// Ruling Bot — versione statica: ricerca locale su FAQ e regolamento + testo carte da YGOPRODeck.
"use strict";

const KNOWLEDGE_FILES = [
  "knowledge/01-regole-base.md",
  "knowledge/02-catena-e-timing.md",
  "knowledge/03-meccaniche-e-carte.md",
];
const FAQ_FILE = "faq/domande.md";
const YGO_API = "https://db.ygoprodeck.com/api/v7/cardinfo.php";

// ---------------------------------------------------------------- testo e ricerca

const STOPWORDS = new Set(`a ad al allo ai agli all agl alla alle con col coi da dal dallo dai dagli dall dagl dalla dalle di del dello dei degli dell degl della delle in nel nello nei negli nell negl nella nelle su sul sullo sui sugli sull sugl sulla sulle per tra fra il lo la i gli le l un uno una un e ed o od ma se che chi cui non piu più come dove quando quanto quale quali questo questa questi queste quello quella quelli quelle mi ti ci vi si io tu lui lei noi voi loro mio mia miei mie tuo tua suo sua è e' sono essere ha hanno ho hai abbiamo avere fa fare posso puoi può puo possono devo deve cosa succede anche ancora gia già poi solo sempre ogni tutto tutti tutte altro altra altri dopo prima mentre allora quindi perché perche oppure sia via del della the of to and or is can i you it in on a an be does do what when if`.split(/\s+/));

// Gruppi di sinonimi (italiano/inglese/gergo): vengono ricondotti alla stessa chiave.
const SYNONYMS = [
  ["cimitero", "gy", "graveyard", "cimi", "grave"],
  ["bandire", "bandita", "bandito", "bandite", "banditi", "banish", "banished", "esiliare", "rimuovere dal gioco"],
  ["catena", "chain", "anello", "link catena"],
  ["evocazione", "evocare", "evocato", "evocata", "evocati", "summon", "summoned", "evoco"],
  ["speciale", "special", "ss"],
  ["normale", "normal", "ns"],
  ["annullare", "annulla", "annullato", "annullata", "negate", "negare", "nega", "negato", "negazione"],
  ["bersaglio", "bersagliare", "target", "targettare", "targetta", "bersaglia"],
  ["trappola", "trap", "trappole"],
  ["magia", "spell", "magie"],
  ["rapida", "rapido", "quick", "quickplay"],
  ["mano", "hand", "handtrap"],
  ["tributo", "tributare", "tribute", "release", "sacrificare", "sacrificio"],
  ["distruggere", "distrutto", "distrutta", "distruzione", "destroy", "destroyed"],
  ["staccare", "detach", "stacco", "overlay"],
  ["danni", "danno", "damage"],
  ["timing", "tempistica"],
  ["costo", "cost", "costi"],
  ["attaccare", "attacco", "attacca", "attack"],
  ["pescare", "pesca", "pescata", "draw"],
  ["aggiungere", "ricerca", "search", "cercare", "aggiunge"],
  ["posizionare", "posizionata", "posizionato", "set", "settare", "settata", "coperta"],
  ["opt", "volta per turno", "once per turn"],
  ["ash", "ash blossom", "gioiosa primavera"],
  ["veiler", "velo dell'effetto", "velo"],
  ["impermanenza", "impermanence", "imperm"],
  ["called", "chiamato dalla tomba", "chiamato"],
  ["reborn", "mostro resuscitato", "resuscitato"],
  ["droll", "lock bird"],
  ["maxx", "maxx c", "scarafaggio"],
  ["solemn", "solenne"],
  ["bottomless", "buco senza fondo"],
  ["extra deck", "extra", "ed"],
  ["zona mostri extra", "emz", "extra monster zone"],
  ["pendulum", "pendolo"],
  ["materiale", "materiali", "material", "materials"],
  ["fusione", "fusion", "polimerizzazione", "polymerization", "poly"],
  ["immune", "non influenzato", "unaffected"],
];

function normalize(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’'`´]/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const SUFFIXES = ["azioni", "azione", "amenti", "amento", "mente", "ando", "endo", "ato", "ata", "ati", "ate", "ito", "ita", "iti", "ite", "uto", "uta", "are", "ere", "ire", "ano", "ono", "s", "i", "e", "a", "o"];
function stem(word) {
  if (word.length <= 3 || /^\d+$/.test(word)) return word;
  for (const suf of SUFFIXES) {
    if (word.endsWith(suf) && word.length - suf.length >= 3) return word.slice(0, -suf.length);
  }
  return word;
}

// Mappa stem → chiave canonica; le frasi multi-parola vengono sostituite prima della tokenizzazione.
const SYN_STEM = new Map();
const SYN_PHRASES = [];
for (const group of SYNONYMS) {
  const key = "§" + stem(normalize(group[0]).replace(/ /g, "_"));
  for (const term of group) {
    const n = normalize(term);
    if (n.includes(" ")) SYN_PHRASES.push([new RegExp(`\\b${n}\\b`, "g"), key]);
    else SYN_STEM.set(stem(n), key);
  }
}
SYN_PHRASES.sort((a, b) => b[0].source.length - a[0].source.length);

function tokenize(text) {
  let t = " " + normalize(text) + " ";
  for (const [re, key] of SYN_PHRASES) t = t.replace(re, ` ${key} `);
  const out = [];
  for (const w of t.split(/\s+/)) {
    if (!w) continue;
    if (w.startsWith("§")) { out.push(w); continue; }
    if (STOPWORDS.has(w) || w.length < 2) continue;
    const s = stem(w);
    out.push(SYN_STEM.get(s) ?? s);
  }
  return out;
}

class BM25 {
  constructor(docs, getTokens, k1 = 1.4, b = 0.7) {
    this.k1 = k1; this.b = b;
    this.docs = docs.map((d) => {
      const tokens = getTokens(d);
      const tf = new Map();
      for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
      return { d, tf, len: tokens.length };
    });
    this.avgdl = this.docs.reduce((s, x) => s + x.len, 0) / Math.max(1, this.docs.length);
    this.df = new Map();
    for (const x of this.docs) for (const t of x.tf.keys()) this.df.set(t, (this.df.get(t) ?? 0) + 1);
  }
  idf(t) {
    const n = this.docs.length, df = this.df.get(t) ?? 0;
    return Math.log(1 + (n - df + 0.5) / (df + 0.5));
  }
  search(queryTokens, limit = 5) {
    const terms = [...new Set(queryTokens)];
    const results = [];
    for (const x of this.docs) {
      let score = 0, matched = 0;
      for (const t of terms) {
        const f = x.tf.get(t);
        if (!f) continue;
        matched++;
        score += this.idf(t) * (f * (this.k1 + 1)) / (f + this.k1 * (1 - this.b + this.b * x.len / this.avgdl));
      }
      if (score > 0) results.push({ doc: x.d, score, coverage: matched / terms.length });
    }
    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  }
}

// ---------------------------------------------------------------- parsing dei contenuti

function parseFaq(md) {
  md = md.replace(/<!--[\s\S]*?-->/g, "");
  return md.split(/\n(?=## )/).slice(1).map((block, i) => {
    const lines = block.split("\n");
    const question = lines[0].replace(/^##\s*/, "").trim();
    let rest = lines.slice(1);
    let tags = "";
    if (rest[0]?.toLowerCase().startsWith("tag:")) { tags = rest[0].slice(4).trim(); rest = rest.slice(1); }
    return { id: "faq-" + (i + 1), question, tags, answer: rest.join("\n").trim() };
  });
}

function parseKnowledge(md) {
  const partTitle = (md.match(/^# (.+)$/m) || [, ""])[1].trim();
  return md.split(/\n(?=## )/).slice(1).map((block) => {
    const lines = block.split("\n");
    const title = lines[0].replace(/^##\s*/, "").trim();
    const num = (title.match(/^(\d+\.\d+)/) || [, ""])[1];
    return { id: "sez-" + (num || title).replace(/\W+/g, "-"), part: partTitle, title, body: lines.slice(1).join("\n").trim() };
  });
}

// ---------------------------------------------------------------- utilità UI

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
function md(text) {
  const html = window.marked ? marked.parse(text) : `<p>${esc(text).replace(/\n/g, "<br>")}</p>`;
  const clean = window.DOMPurify ? DOMPurify.sanitize(html) : html;
  return clean.replace(/<a /g, '<a target="_blank" rel="noopener noreferrer" ');
}
function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
}

// ---------------------------------------------------------------- stato

let FAQ = [], SECTIONS = [], faqIndex, sectionIndex;

async function loadData() {
  const [faqText, ...kbTexts] = await Promise.all(
    [FAQ_FILE, ...KNOWLEDGE_FILES].map((f) => fetch(f).then((r) => {
      if (!r.ok) throw new Error(`Impossibile caricare ${f}`);
      return r.text();
    })),
  );
  FAQ = parseFaq(faqText);
  SECTIONS = kbTexts.flatMap(parseKnowledge);
  // Domanda e tag pesano più della risposta.
  faqIndex = new BM25(FAQ, (f) => {
    const q = tokenize(f.question), t = tokenize(f.tags);
    return [...q, ...q, ...q, ...t, ...t, ...t, ...tokenize(f.answer)];
  });
  sectionIndex = new BM25(SECTIONS, (s) => {
    const t = tokenize(s.title);
    return [...t, ...t, ...tokenize(s.body)];
  });
}

// ---------------------------------------------------------------- Chiedi

function faqCard(f, open) {
  const d = el("details", "result faq");
  d.open = open;
  d.innerHTML = `<summary>${esc(f.question)}</summary><div class="body">${md(f.answer)}</div>`;
  return d;
}

function sectionCard(s, open = false, showPart = true) {
  const d = el("details", "result section");
  d.open = open;
  d.id = s.id;
  const part = showPart ? `<span class="part">${esc(s.part.replace(/^PARTE \d+ — /, "").replace(/\s*\(.*\)$/, ""))}</span>` : "";
  d.innerHTML = `<summary>${part}${esc(s.title)}</summary><div class="body">${md(s.body)}</div>`;
  return d;
}

function externalSearchLinks(q) {
  const enc = encodeURIComponent(q);
  return `<p class="more">Non trovi la risposta? Cerca su
    <a href="https://yugipedia.com/index.php?search=${enc}" target="_blank" rel="noopener">Yugipedia</a> ·
    <a href="https://www.google.com/search?q=${encodeURIComponent(q + " ruling yugioh")}" target="_blank" rel="noopener">Google</a> ·
    <a href="https://db.ygoresources.com/" target="_blank" rel="noopener">YGOResources</a>
    oppure chiedi a un giudice.</p>`;
}

function quotedCardNames(q) {
  const names = [];
  for (const m of q.matchAll(/["“”«»]([^"“”«»]{2,60})["“”«»]/g)) names.push(m[1].trim());
  return [...new Set(names)].slice(0, 3);
}

function runSearch(q) {
  const results = $("results");
  results.innerHTML = "";
  q = q.trim();
  const url = new URL(location.href);
  if (q) url.searchParams.set("q", q); else url.searchParams.delete("q");
  history.replaceState(null, "", url);
  $("welcome").hidden = !!q;
  if (!q) return;

  const tokens = tokenize(q);
  const faqHits = tokens.length ? faqIndex.search(tokens, 5) : [];
  const secHits = tokens.length ? sectionIndex.search(tokens, 3) : [];
  const best = faqHits[0];
  const strong = best && best.coverage >= 0.5 && best.score >= 4;

  if (strong) {
    results.appendChild(el("h2", "label", "Risposta"));
    results.appendChild(faqCard(best.doc, true));
  } else {
    results.appendChild(el("div", "notice", "Nessuna risposta esatta nella raccolta: ecco i contenuti più vicini alla tua domanda."));
  }

  const others = faqHits.slice(strong ? 1 : 0).filter((h) => h.score >= 2).slice(0, 4);
  if (others.length) {
    results.appendChild(el("h2", "label", strong ? "Domande simili" : "Domande correlate"));
    others.forEach((h, i) => results.appendChild(faqCard(h.doc, !strong && i === 0)));
  }

  const secs = secHits.filter((h) => h.score >= 2);
  if (secs.length) {
    results.appendChild(el("h2", "label", "Dal regolamento"));
    secs.forEach((h) => results.appendChild(sectionCard(h.doc)));
  }

  const cardNames = quotedCardNames(q);
  if (cardNames.length) {
    results.appendChild(el("h2", "label", "Carte citate"));
    const box = el("div", "cards");
    results.appendChild(box);
    cardNames.forEach((name) => showCards(name, box, 1));
  }

  results.insertAdjacentHTML("beforeend", externalSearchLinks(q));
}

// ---------------------------------------------------------------- Carte (YGOPRODeck)

async function ygo(params) {
  const res = await fetch(`${YGO_API}?${new URLSearchParams(params)}`);
  if (res.status === 400) return []; // nessuna carta trovata
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()).data ?? [];
}

async function findCards(name) {
  const attempts = [
    { name, language: "it" }, { name },
    { fname: name, language: "it" }, { fname: name },
  ];
  for (const p of attempts) {
    const cards = await ygo(p);
    if (cards.length) return { cards, italian: p.language === "it" };
  }
  return { cards: [], italian: false };
}

async function englishName(card, italian) {
  if (!italian) return card.name;
  try {
    const [en] = await ygo({ id: card.id });
    return en?.name ?? card.name;
  } catch { return card.name; }
}

function cardStats(c) {
  const bits = [c.type];
  if (c.attribute) bits.push(c.attribute);
  if (c.race) bits.push(c.race);
  if (c.level != null) bits.push(`${/xyz/i.test(c.type) ? "Rango" : "Livello"} ${c.level}`);
  if (c.linkval != null) bits.push(`Link-${c.linkval}`);
  if (c.scale != null) bits.push(`Scala ${c.scale}`);
  if (c.atk != null) bits.push(`ATK ${c.atk}` + (c.def != null ? ` / DEF ${c.def}` : ""));
  return bits.join(" · ");
}

async function renderCard(c, italian, container) {
  const box = el("article", "card");
  box.innerHTML = `<h3>${esc(c.name)}</h3><p class="stats">${esc(cardStats(c))}</p>
    <p class="desc">${esc(c.desc).replace(/\n/g, "<br>")}</p><p class="links">Carico i link…</p>`;
  container.appendChild(box);
  const en = await englishName(c, italian);
  const wiki = encodeURIComponent(en.replace(/ /g, "_"));
  box.querySelector(".links").innerHTML = `
    <a href="https://yugipedia.com/wiki/Card_Rulings:${wiki}" target="_blank" rel="noopener">Ruling (Yugipedia)</a> ·
    <a href="https://yugipedia.com/wiki/${wiki}" target="_blank" rel="noopener">Scheda</a> ·
    <a href="https://www.db.yugioh-card.com/yugiohdb/card_search.action?ope=1&sess=1&keyword=${encodeURIComponent(en)}&request_locale=it" target="_blank" rel="noopener">Database Konami</a>
    ${italian && en !== c.name ? `<span class="en">(${esc(en)})</span>` : ""}`;
}

async function showCards(name, container, max = 5) {
  const status = el("p", "status", `Cerco "${esc(name)}"…`);
  container.appendChild(status);
  try {
    const { cards, italian } = await findCards(name);
    status.remove();
    if (!cards.length) {
      container.appendChild(el("p", "notice", `Nessuna carta trovata per "${esc(name)}". Prova con il nome inglese o una parte del nome.`));
      return;
    }
    for (const c of cards.slice(0, max)) await renderCard(c, italian, container);
    if (cards.length > max) container.appendChild(el("p", "hint", `Altri ${cards.length - max} risultati: specifica meglio il nome.`));
  } catch (err) {
    status.remove();
    container.appendChild(el("p", "notice", `Impossibile contattare il database delle carte (${esc(err.message)}). Riprova più tardi.`));
  }
}

// ---------------------------------------------------------------- Regolamento

function renderRules() {
  const root = $("rules");
  let currentPart = null;
  for (const s of SECTIONS) {
    if (s.part !== currentPart) {
      currentPart = s.part;
      root.appendChild(el("h2", "label", esc(s.part)));
    }
    root.appendChild(sectionCard(s, false, false));
  }
  $("rules-filter").addEventListener("input", (e) => {
    const q = normalize(e.target.value);
    root.querySelectorAll("details").forEach((d) => {
      d.hidden = q && !normalize(d.textContent).includes(q);
      d.open = !!q && !d.hidden;
    });
  });
}

// ---------------------------------------------------------------- tab e avvio

function selectTab(name) {
  document.querySelectorAll("[data-tab]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.tab === name)));
  document.querySelectorAll(".tab").forEach((t) => { t.hidden = t.id !== "tab-" + name; });
}

async function init() {
  document.querySelectorAll("[data-tab]").forEach((b) => b.addEventListener("click", () => selectTab(b.dataset.tab)));

  try {
    await loadData();
  } catch (err) {
    $("results").innerHTML = `<p class="notice">Errore nel caricamento dei dati: ${esc(err.message)}. Se hai aperto il file direttamente, avvia un server locale (vedi README).</p>`;
    return;
  }

  const popular = $("popular");
  FAQ.slice(0, 12).forEach((f) => {
    const b = el("button", "chip");
    b.type = "button";
    b.textContent = f.question;
    b.addEventListener("click", () => { $("question").value = f.question; runSearch(f.question); });
    popular.appendChild(b);
  });

  $("ask").addEventListener("submit", (e) => { e.preventDefault(); runSearch($("question").value); });
  $("card-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("card-name").value.trim();
    if (!name) return;
    $("card-results").innerHTML = "";
    showCards(name, $("card-results"));
  });

  renderRules();

  const q = new URL(location.href).searchParams.get("q");
  if (q) { $("question").value = q; runSearch(q); }
}

init();
