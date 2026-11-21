// Yu-Gi-Oh! Ruling Bot — server Express + Claude API
import express from "express";
import Anthropic from "@anthropic-ai/sdk";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;
const MODEL = process.env.CLAUDE_MODEL || "claude-opus-5-5";
const EFFORT = process.env.CLAUDE_EFFORT || "high";
const WEB_SEARCH = process.env.ENABLE_WEB_SEARCH !== "false";
const MAX_QUESTION_CHARS = 4000;
const MAX_HISTORY_TURNS = 10;
const MAX_LOOP_ITERATIONS = 8;

// ---------- Knowledge base (caricata una volta: prefisso stabile per il prompt caching) ----------
const knowledgeDir = path.join(here, "knowledge");
const knowledge = fs
  .readdirSync(knowledgeDir)
  .filter((f) => f.endsWith(".md"))
  .sort()
  .map((f) => fs.readFileSync(path.join(knowledgeDir, f), "utf8"))
  .join("\n\n---\n\n");

const INSTRUCTIONS = `Sei "Ruling Bot", un giudice esperto del Gioco di Carte Collezionabili Yu-Gi-Oh! (formato TCG/OCG, Master Rule attuale).
Il tuo compito è rispondere a domande sui ruling: interazioni tra carte, catene, timing, evocazioni, battaglia, lettura del testo (PSCT) e regole di torneo.

Come lavori:
- Basati sulla KNOWLEDGE BASE qui sotto per le regole generali.
- Quando la domanda cita carte specifiche, usa SEMPRE lo strumento \`cerca_carta\` per leggere il testo ufficiale aggiornato di ogni carta citata prima di rispondere: i ruling dipendono dalla formulazione esatta (bersaglio sì/no, costo vs effetto, "Quando" vs "Se", hard OPT...). Se l'utente usa il nome italiano, prova prima con quello; se non trovi nulla, prova col nome inglese.
- ${WEB_SEARCH ? "Se la domanda riguarda un ruling specifico di una carta che non si deduce dalle regole generali, o se non sei sicuro, usa la ricerca web (siti di ruling affidabili come Yugipedia, db.ygoresources.com, YGOrganization) per cercare il ruling ufficiale e cita la fonte." : "Se non sei sicuro di un ruling specifico, dillo chiaramente."}
- Non inventare ruling. Se una situazione non è coperta con certezza, dichiaralo e indica il ragionamento più probabile basato sulle regole, consigliando di verificare con un giudice.
- Ricorda che OCG e TCG possono avere Liste Limitate e, raramente, ruling diversi.

Formato della risposta (in Markdown, nella stessa lingua dell'utente, di default italiano):
1. **Risposta breve**: una riga (es. "Sì, puoi...", "No, perché...").
2. **Spiegazione**: il ragionamento passo per passo, citando le regole pertinenti (catena, velocità, PSCT...) e il testo delle carte rilevante.
3. Se utile, un esempio di risoluzione della catena (Anello 1, Anello 2...).
4. **Affidabilità**: Alta / Media / Bassa, con una breve motivazione, e le fonti consultate se hai usato la ricerca.
Sii preciso e conciso. Rispondi solo a domande inerenti a Yu-Gi-Oh!; per altro, spiega gentilmente che sei specializzato nei ruling di Yu-Gi-Oh!.`;

const SYSTEM = [
  { type: "text", text: INSTRUCTIONS },
  {
    type: "text",
    text: `<knowledge_base>\n${knowledge}\n</knowledge_base>`,
    cache_control: { type: "ephemeral" },
  },
];

// ---------- Strumenti ----------
const CARD_TOOL = {
  name: "cerca_carta",
  description:
    "Cerca una carta di Yu-Gi-Oh! nel database YGOPRODeck e restituisce il testo ufficiale (effetto), tipo, Livello/Rango/Link, ATK/DEF, Attributo e archetipo. Accetta nomi parziali, in italiano o in inglese. Usalo per ogni carta citata nella domanda.",
  eager_input_streaming: true,
  input_schema: {
    type: "object",
    properties: {
      nome: { type: "string", description: "Nome (anche parziale) della carta, in italiano o inglese" },
    },
    required: ["nome"],
    additionalProperties: false,
  },
};

const RULING_DOMAINS = [
  "yugipedia.com",
  "db.ygoresources.com",
  "ygorganization.com",
  "yugioh-card.com",
  "ygoprodeck.com",
];

const TOOLS = [
  CARD_TOOL,
  ...(WEB_SEARCH
    ? [
        { type: "web_search_20260209", name: "web_search", max_uses: 5, allowed_domains: RULING_DOMAINS },
        { type: "web_fetch_20260209", name: "web_fetch", max_uses: 5, allowed_domains: RULING_DOMAINS },
      ]
    : []),
];

function formatCard(c) {
  const parts = [`Nome: ${c.name}`, `Tipo: ${c.type}`];
  if (c.race) parts.push(`Tipo mostro/Magia/Trappola: ${c.race}`);
  if (c.attribute) parts.push(`Attributo: ${c.attribute}`);
  if (c.level != null) parts.push(`${/XYZ/i.test(c.type) ? "Rango" : "Livello"}: ${c.level}`);
  if (c.linkval != null) parts.push(`Link: ${c.linkval}${c.linkmarkers ? ` (frecce: ${c.linkmarkers.join(", ")})` : ""}`);
  if (c.scale != null) parts.push(`Scala Pendulum: ${c.scale}`);
  if (c.atk != null) parts.push(`ATK: ${c.atk}${c.def != null ? ` / DEF: ${c.def}` : ""}`);
  if (c.archetype) parts.push(`Archetipo: ${c.archetype}`);
  parts.push(`Testo: ${c.desc}`);
  return parts.join("\n");
}

async function ygoQuery(params) {
  const url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?${new URLSearchParams(params)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (res.status === 400) return []; // l'API risponde 400 quando non trova carte
  if (!res.ok) throw new Error(`YGOPRODeck HTTP ${res.status}`);
  const json = await res.json();
  return json.data ?? [];
}

async function searchCard(nome) {
  const attempts = [
    { name: nome, language: "it" },
    { name: nome },
    { fname: nome, language: "it" },
    { fname: nome },
  ];
  for (const params of attempts) {
    const cards = await ygoQuery(params);
    if (cards.length) {
      const shown = cards.slice(0, 5).map(formatCard).join("\n\n---\n\n");
      const extra = cards.length > 5 ? `\n\n(${cards.length - 5} altri risultati non mostrati: specifica meglio il nome)` : "";
      return shown + extra;
    }
  }
  return `Nessuna carta trovata per "${nome}". Prova con il nome inglese o un nome parziale.`;
}

async function runTool(block) {
  if (block.name !== "cerca_carta") {
    return { content: `Strumento sconosciuto: ${block.name}`, is_error: true };
  }
  const nome = block.input?.nome;
  if (typeof nome !== "string" || !nome.trim() || nome.length > 200) {
    return { content: "Input non valido: serve il campo 'nome' (stringa).", is_error: true };
  }
  try {
    return { content: await searchCard(nome.trim()) };
  } catch (err) {
    return { content: `Errore durante la ricerca della carta: ${err.message}`, is_error: true };
  }
}

// ---------- App ----------
const client = new Anthropic();
const app = express();
app.use(express.json({ limit: "100kb" }));
app.use(express.static(path.join(here, "public")));

// Limite semplice di richieste per IP (protegge la chiave API)
const RATE_LIMIT = Number(process.env.RATE_LIMIT_PER_HOUR) || 30;
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 3_600_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > RATE_LIMIT;
}

function sanitizeHistory(history) {
  if (!Array.isArray(history)) return [];
  const clean = history
    .filter(
      (m) =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim(),
    )
    .slice(-MAX_HISTORY_TURNS * 2)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 20_000) }));
  while (clean.length && clean[0].role !== "user") clean.shift();
  return clean;
}

app.get("/api/health", (_req, res) => res.json({ ok: true, model: MODEL, webSearch: WEB_SEARCH }));

app.post("/api/ask", async (req, res) => {
  const question = typeof req.body?.question === "string" ? req.body.question.trim() : "";
  if (!question) return res.status(400).json({ error: "Domanda mancante." });
  if (question.length > MAX_QUESTION_CHARS)
    return res.status(400).json({ error: `Domanda troppo lunga (max ${MAX_QUESTION_CHARS} caratteri).` });
  if (rateLimited(req.ip)) return res.status(429).json({ error: "Troppe richieste, riprova più tardi." });

  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);
  let closed = false;
  res.on("close", () => {
    closed = true;
  });

  const messages = [...sanitizeHistory(req.body.history), { role: "user", content: question }];

  try {
    let retries = 0;
    for (let i = 0; i < MAX_LOOP_ITERATIONS && !closed; i++) {
      const stream = client.beta.messages.stream({
        model: MODEL,
        max_tokens: 32000,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        thinking: { type: "adaptive" },
        output_config: { effort: EFFORT },
        system: SYSTEM,
        tools: TOOLS,
        messages,
      });

      stream.on("streamEvent", (event) => {
        if (event.type === "content_block_start") {
          const b = event.content_block;
          if (b.type === "thinking") send({ type: "status", text: "Sto ragionando sul ruling…" });
          else if (b.type === "server_tool_use" && b.name === "web_search")
            send({ type: "status", text: "Cerco ruling ufficiali online…" });
          else if (b.type === "server_tool_use" && b.name === "web_fetch")
            send({ type: "status", text: "Leggo una pagina di ruling…" });
          else if (b.type === "tool_use") send({ type: "status", text: "Cerco il testo della carta…" });
        } else if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          send({ type: "text", text: event.delta.text });
        }
      });

      let message;
      try {
        message = await stream.finalMessage();
        retries = 0;
      } catch (err) {
        if (err instanceof Anthropic.APIError || closed || retries++ >= 2) throw err;
        continue; // input di tool non parsabile o connessione caduta: ripeti il turno
      }

      if (message.stop_reason === "refusal") {
        send({ type: "text", text: "\n\n_Non posso rispondere a questa richiesta._" });
        break;
      }
      if (message.stop_reason === "pause_turn") {
        messages.push({ role: "assistant", content: message.content });
        continue;
      }

      const toolUses = message.content.filter((b) => b.type === "tool_use");
      if (message.stop_reason !== "tool_use" || toolUses.length === 0) break;

      messages.push({ role: "assistant", content: message.content });
      const results = await Promise.all(
        toolUses.map(async (b) => {
          if (b.name === "cerca_carta" && typeof b.input?.nome === "string")
            send({ type: "status", text: `Cerco la carta "${b.input.nome}"…` });
          const r = await runTool(b);
          return { type: "tool_result", tool_use_id: b.id, ...r };
        }),
      );
      messages.push({ role: "user", content: results });
      send({ type: "text_break" });
    }
    send({ type: "done" });
  } catch (err) {
    console.error(err);
    let msg = "Errore del server. Riprova.";
    if (err instanceof Anthropic.AuthenticationError) msg = "Chiave API non valida o mancante sul server.";
    else if (err instanceof Anthropic.RateLimitError) msg = "Il servizio è sovraccarico, riprova tra poco.";
    else if (err instanceof Anthropic.BadRequestError) msg = `Richiesta non valida: ${err.message}`;
    else if (err instanceof Anthropic.APIError) msg = `Errore API (${err.status}).`;
    send({ type: "error", text: msg });
  } finally {
    res.end();
  }
});

app.listen(PORT, () => {
  console.log(`Ruling Bot in ascolto su http://localhost:${PORT} (modello ${MODEL}, web search ${WEB_SEARCH ? "on" : "off"})`);
});
