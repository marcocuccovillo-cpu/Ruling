// Scarica il database delle carte da YGOPRODeck (inglese + italiano) e lo salva in data/.
// - data/cards-index.json : { shards, cards: [[id, nomeInglese, nomeItaliano], ...] }  (per la ricerca)
// - data/cards/<n>.json   : dettagli delle carte, divisi in `shards` file per id % shards
// Viene eseguito dalla GitHub Action di pubblicazione: i file generati non vengono committati.
// In locale: node scripts/build-cards.mjs
import fs from "node:fs/promises";
import path from "node:path";

const API = "https://db.ygoprodeck.com/api/v7/cardinfo.php";
const SHARDS = 64;
const OUT = path.resolve(process.argv[2] || "data");

async function get(params = {}) {
  const url = `${API}?${new URLSearchParams(params)}`;
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, { headers: { "User-Agent": "ruling-bot-card-index/1.0" } });
    if (res.ok) return (await res.json()).data;
    if (attempt >= 4) throw new Error(`${url} → HTTP ${res.status}`);
    await new Promise((r) => setTimeout(r, 5000 * attempt));
  }
}

const en = await get();
console.log(`Carte (EN): ${en.length}`);
let it = [];
try {
  it = await get({ language: "it" });
  console.log(`Carte (IT): ${it.length}`);
} catch (err) {
  console.warn("Traduzioni italiane non disponibili:", err.message);
}
const itById = new Map(it.map((c) => [c.id, c]));

const index = [];
const shards = Array.from({ length: SHARDS }, () => ({}));
for (const c of en) {
  const t = itById.get(c.id);
  index.push([c.id, c.name, t && t.name !== c.name ? t.name : ""]);
  const d = { n: c.name, t: c.type, x: c.desc };
  if (t) { d.ni = t.name; d.xi = t.desc; }
  if (c.race) d.r = c.race;
  if (c.attribute) d.a = c.attribute;
  if (c.level != null) d.l = c.level;
  if (c.linkval != null) d.lk = c.linkval;
  if (c.linkmarkers) d.lm = c.linkmarkers;
  if (c.scale != null) d.s = c.scale;
  if (c.atk != null) d.atk = c.atk;
  if (c.def != null) d.def = c.def;
  if (c.archetype) d.ar = c.archetype;
  shards[c.id % SHARDS][c.id] = d;
}
index.sort((a, b) => a[1].localeCompare(b[1]));

await fs.rm(path.join(OUT, "cards"), { recursive: true, force: true });
await fs.mkdir(path.join(OUT, "cards"), { recursive: true });
await fs.writeFile(path.join(OUT, "cards-index.json"), JSON.stringify({ shards: SHARDS, updated: new Date().toISOString().slice(0, 10), cards: index }));
await Promise.all(shards.map((s, i) => fs.writeFile(path.join(OUT, "cards", `${i}.json`), JSON.stringify(s))));
console.log(`Scritte ${index.length} carte in ${SHARDS} file.`);
