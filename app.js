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

  const cardsBox = el("div", "cards");
  results.appendChild(cardsBox);
  results.insertAdjacentHTML("beforeend", externalSearchLinks(q));
  showCardsInQuestion(q, cardsBox, !strong);
}

// Carte citate nella domanda: tra virgolette oppure riconosciute dal database locale.
async function showCardsInQuestion(q, box, first) {
  const index = await loadCardIndex();
  const quoted = quotedCardNames(q);
  const ids = new Set();
  const found = [];
  if (index) {
    for (const name of quoted) {
      const [e] = searchCardIndex(index, name, 1);
      if (e && !ids.has(e.id)) { ids.add(e.id); found.push(e); }
    }
    for (const e of detectCardsInText(index, q)) if (!ids.has(e.id)) { ids.add(e.id); found.push(e); }
  }
  if (!found.length && !(quoted.length && !index)) return;
  const label = el("h2", "label", "Carte citate");
  box.appendChild(label);
  // se non c'è una risposta esatta, le carte sono l'informazione più utile: mettile in cima
  if (first) box.parentElement.prepend(box);
  if (index) for (const e of found.slice(0, 4)) await showCardById(index, e.id, box);
  else for (const name of quoted) await showCards(name, box, 1);
}

// ---------------------------------------------------------------- Carte

// Database locale (generato da scripts/build-cards.mjs al momento della pubblicazione).
// Se non c'è (es. in locale senza averlo generato) si usa direttamente l'API di YGOPRODeck.
let cardIndexPromise = null;
const shardCache = new Map();

// Parole del gioco che non vanno scambiate per nomi di carte quando appaiono in una domanda.
const GAME_WORDS = new Set([
  "mostro", "mostri", "monster", "carta", "carte", "card", "deck", "extra deck", "token", "link", "synchro", "xyz",
  "fusion", "fusione", "ritual", "rituale", "tuner", "pendulum", "battle", "battaglia", "flip", "effetto", "effect",
  "terreno", "field", "turno", "turn", "fase", "phase", "cimitero", "graveyard", "catena", "chain", "tributo",
  "tribute", "magia", "spell", "trappola", "trap", "evocazione", "summon", "evocazione speciale", "special summon",
  "danni", "damage", "attacco", "attack", "difesa", "defense", "mano", "hand", "costo", "cost", "bersaglio", "target",
  "materiale", "material", "regola", "regole", "risposta", "domanda", "timing", "contatore", "counter",
]);

function loadCardIndex() {
  cardIndexPromise ??= fetch("data/cards-index.json")
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      if (!data?.cards?.length) return null;
      const entries = data.cards.map(([id, en, it]) => ({ id, en, it, nen: normalize(en), nit: it ? normalize(it) : "" }));
      // Nomi brevi automatici: la parte prima di " & " o "," (es. "Ash Blossom", "Nibiru", "Ghost Ogre")
      const shortCount = new Map();
      const short = (n) => n.split(/ & |, /)[0];
      for (const e of entries) for (const name of [e.en, e.it]) {
        if (!name || !/ & |, /.test(name)) continue;
        const s = normalize(short(name));
        shortCount.set(s, (shortCount.get(s) ?? 0) + 1);
      }
      for (const e of entries) {
        e.aliases = [e.en, e.it].filter((n) => n && / & |, /.test(n)).map((n) => normalize(short(n)))
          .filter((s) => s.length >= 5 && shortCount.get(s) === 1 && !GAME_WORDS.has(s));
      }
      return { shards: data.shards, entries, byId: new Map(entries.map((e) => [e.id, e])) };
    })
    .catch(() => null);
  return cardIndexPromise;
}

// Soprannomi comuni → nome inglese ufficiale
const CARD_ALIASES = {
  "ash": "Ash Blossom & Joyous Spring",
  "imperm": "Infinite Impermanence",
  "impermanenza": "Infinite Impermanence",
  "veiler": "Effect Veiler",
  "maxx c": 'Maxx "C"',
  "cbtg": "Called by the Grave",
  "mst": "Mystical Space Typhoon",
  "bottomless": "Bottomless Trap Hole",
  "torrential": "Torrential Tribute",
  "droplet": "Forbidden Droplet",
  "dark ruler": "Dark Ruler No More",
  "ttt": "Triple Tactics Talent",
  "lancea": "Ancestagon Lancea",
  "nibiru": "Nibiru, the Primal Being",
  "droll": "Droll & Lock Bird",
  "reborn": "Monster Reborn",
};

function trigrams(s) {
  const t = new Set(), p = `  ${s} `;
  for (let i = 0; i < p.length - 2; i++) t.add(p.slice(i, i + 3));
  return t;
}
function similarity(a, bSet) {
  const A = trigrams(a);
  let inter = 0;
  for (const g of A) if (bSet.has(g)) inter++;
  return (2 * inter) / (A.size + bSet.size);
}

// Ricerca per nome (italiano o inglese), tollerante a nomi parziali e piccoli errori di battitura.
function searchCardIndex(index, query, limit = 10) {
  const q = normalize(query);
  if (!q) return [];
  const aliased = CARD_ALIASES[q] && index.entries.find((e) => e.en === CARD_ALIASES[q]);
  const words = q.split(" ");
  const scored = [];
  for (const e of index.entries) {
    let best = 0;
    for (const n of [e.nen, e.nit]) {
      if (!n) continue;
      let s = 0;
      if (n === q) s = 100;
      else if (n.startsWith(q)) s = 85;
      else if (` ${n} `.includes(` ${q} `)) s = 75;
      else if (n.includes(q)) s = 65;
      else if (words.length > 1 && words.every((w) => ` ${n}`.includes(" " + w))) s = 55;
      if (s) s -= Math.min(10, n.length / 20); // a parità, nomi più corti prima
      best = Math.max(best, s);
    }
    if (best) scored.push({ e, s: best });
  }
  if (!scored.length && q.length >= 4) {
    // nessuna corrispondenza diretta: somiglianza per trigrammi (errori di battitura)
    const Q = trigrams(q);
    for (const e of index.entries) {
      const s = Math.max(similarity(e.nen, Q), e.nit ? similarity(e.nit, Q) : 0);
      if (s >= 0.45) scored.push({ e, s: 40 * s });
    }
  }
  scored.sort((a, b) => b.s - a.s);
  const out = scored.slice(0, limit).map((x) => x.e);
  if (aliased && !out.includes(aliased)) out.unshift(aliased);
  return out.slice(0, limit);
}

// Riconosce le carte citate in una domanda (anche senza virgolette).
function detectCardsInText(index, text) {
  const hay = ` ${normalize(text)} `;
  const hits = new Map();
  const add = (e, len) => { if (!hits.has(e.id) || hits.get(e.id) < len) hits.set(e.id, len); };
  for (const e of index.entries) {
    for (const n of [e.nen, e.nit, ...e.aliases]) {
      if (!n || n.length < 4 || /^\d+$/.test(n)) continue;
      if (!n.includes(" ") && (n.length < 6 || GAME_WORDS.has(n))) continue;
      if (GAME_WORDS.has(n)) continue;
      if (hay.includes(` ${n} `)) add(e, n.length);
    }
  }
  for (const [alias, en] of Object.entries(CARD_ALIASES)) {
    if (hay.includes(` ${alias} `)) {
      const e = index.entries.find((x) => x.en === en);
      if (e) add(e, alias.length);
    }
  }
  // tra corrispondenze sovrapposte (es. "Dark Magician" dentro "Dark Magician Girl") tieni la più lunga
  const list = [...hits].map(([id, len]) => ({ e: index.byId.get(id), len })).sort((a, b) => b.len - a.len);
  const kept = [];
  for (const h of list) {
    const names = [h.e.nen, h.e.nit].filter(Boolean);
    const inside = kept.some((k) => [k.e.nen, k.e.nit].some((kn) => kn && names.some((n) => kn !== n && kn.includes(n))));
    if (!inside) kept.push(h);
  }
  return kept.slice(0, 4).map((h) => h.e);
}

async function getCardDetails(index, id) {
  const shard = id % index.shards;
  if (!shardCache.has(shard)) {
    shardCache.set(shard, fetch(`data/cards/${shard}.json`).then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    }).catch((err) => { shardCache.delete(shard); throw err; }));
  }
  const d = (await shardCache.get(shard))[id];
  if (!d) throw new Error("carta non trovata");
  return {
    id, name: d.n, type: d.t, desc: d.x, itName: d.ni, itDesc: d.xi, race: d.r, attribute: d.a,
    level: d.l, linkval: d.lk, linkmarkers: d.lm, scale: d.s, atk: d.atk, def: d.def, archetype: d.ar,
  };
}

// --- riserva: API YGOPRODeck (usata solo se il database locale non è disponibile)
async function ygo(params) {
  const res = await fetch(`${YGO_API}?${new URLSearchParams(params)}`);
  if (res.status === 400) return []; // nessuna carta trovata
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()).data ?? [];
}

async function findCardsOnline(name) {
  for (const p of [{ fname: name, language: "it" }, { fname: name }]) {
    const cards = await ygo(p);
    if (cards.length) {
      return cards.map((c) => (p.language === "it"
        ? { ...c, itName: c.name, itDesc: c.desc, name: null }
        : c));
    }
  }
  return [];
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

const formatDesc = (t) => esc(t).replace(/\n/g, "<br>");

function renderCard(c, container) {
  const box = el("article", "card");
  const title = c.itName || c.name;
  const sub = c.itName && c.name && c.itName !== c.name ? `<p class="en">${esc(c.name)}</p>` : "";
  const mainDesc = c.itDesc || c.desc;
  const enDesc = c.itDesc && c.desc
    ? `<details class="en-text"><summary>Testo inglese</summary><p class="desc">${formatDesc(c.desc)}</p></details>` : "";
  const en = c.name || c.itName;
  const wiki = encodeURIComponent(en.replace(/ /g, "_"));
  box.innerHTML = `<h3>${esc(title)}</h3>${sub}<p class="stats">${esc(cardStats(c))}</p>
    <p class="desc">${formatDesc(mainDesc)}</p>${enDesc}
    <p class="links">
      <a href="https://yugipedia.com/wiki/Card_Rulings:${wiki}" target="_blank" rel="noopener">Ruling (Yugipedia)</a> ·
      <a href="https://yugipedia.com/wiki/${wiki}" target="_blank" rel="noopener">Scheda</a> ·
      <a href="https://www.db.yugioh-card.com/yugiohdb/card_search.action?ope=1&sess=1&keyword=${encodeURIComponent(en)}&request_locale=it" target="_blank" rel="noopener">Database Konami</a>
    </p>`;
  container.appendChild(box);
  return box;
}

async function showCardById(index, id, container) {
  const status = el("p", "status", "Carico la carta…");
  container.appendChild(status);
  try {
    renderCard(await getCardDetails(index, id), container);
  } catch (err) {
    container.appendChild(el("p", "notice", `Impossibile caricare la carta (${esc(err.message)}).`));
  } finally {
    status.remove();
  }
}

// Mostra le carte che corrispondono a `name` (prima il database locale, poi l'API online).
async function showCards(name, container, max = 1) {
  const index = await loadCardIndex();
  if (index) {
    const found = searchCardIndex(index, name, max);
    if (!found.length) {
      container.appendChild(el("p", "notice", `Nessuna carta trovata per "${esc(name)}". Prova con il nome inglese o una parte del nome.`));
      return;
    }
    for (const e of found) await showCardById(index, e.id, container);
    return;
  }
  const status = el("p", "status", `Cerco "${esc(name)}"…`);
  container.appendChild(status);
  try {
    const cards = await findCardsOnline(name);
    if (!cards.length) container.appendChild(el("p", "notice", `Nessuna carta trovata per "${esc(name)}".`));
    cards.slice(0, max).forEach((c) => renderCard(c, container));
  } catch (err) {
    container.appendChild(el("p", "notice", `Impossibile contattare il database delle carte (${esc(err.message)}). Riprova più tardi.`));
  } finally {
    status.remove();
  }
}

// Scheda "Carte": suggerimenti mentre scrivi + dettaglio della carta scelta.
function setupCardTab() {
  const input = $("card-name"), list = $("card-suggestions"), out = $("card-results");
  let timer;
  const pick = async (index, e) => {
    list.innerHTML = "";
    input.value = e.it || e.en;
    out.innerHTML = "";
    await showCardById(index, e.id, out);
  };
  input.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      const index = await loadCardIndex();
      list.innerHTML = "";
      const q = input.value.trim();
      if (!index || q.length < 2) return;
      for (const e of searchCardIndex(index, q, 8)) {
        const b = el("button", "suggestion");
        b.type = "button";
        b.innerHTML = e.it ? `${esc(e.it)} <span class="en">${esc(e.en)}</span>` : esc(e.en);
        b.addEventListener("click", () => pick(index, e));
        list.appendChild(b);
      }
    }, 120);
  });
  $("card-form").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const name = input.value.trim();
    if (!name) return;
    list.innerHTML = "";
    out.innerHTML = "";
    await showCards(name, out, 5);
  });
  loadCardIndex().then((index) => {
    $("card-db-info").textContent = index
      ? `${index.entries.length.toLocaleString("it-IT")} carte nel database, disponibili anche offline.`
      : "Database locale non disponibile: le carte vengono cercate online su YGOPRODeck.";
  });
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
  setupCardTab();

  renderRules();

  const q = new URL(location.href).searchParams.get("q");
  if (q) { $("question").value = q; runSearch(q); }
}

// ---------------------------------------------------------------- installazione (PWA)

function setupInstall() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
  const banner = $("install-banner"), btn = $("install-btn");
  const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone;
  let dismissed = false;
  try { dismissed = localStorage.getItem("install-dismissed") === "1"; } catch {}
  if (standalone || dismissed) return;

  $("install-close").addEventListener("click", () => {
    banner.hidden = true;
    try { localStorage.setItem("install-dismissed", "1"); } catch {}
  });

  // Android / Chrome / Edge: prompt di installazione nativo
  let deferred = null;
  addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e;
    banner.hidden = false;
  });
  btn.addEventListener("click", async () => {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice;
    deferred = null;
    banner.hidden = true;
  });
  addEventListener("appinstalled", () => { banner.hidden = true; });

  // iPhone / iPad: non esiste il prompt, mostriamo le istruzioni
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (ios) {
    $("install-text").innerHTML = "Per installare Ruling Bot: tocca <strong>Condividi</strong> <span aria-hidden=\"true\">⬆️</span> e poi <strong>Aggiungi alla schermata Home</strong>.";
    btn.hidden = true;
    banner.hidden = false;
  }
}

setupInstall();
init();
