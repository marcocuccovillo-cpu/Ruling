# ⚖️ Ruling Bot — Yu-Gi-Oh!

Sito **statico e gratuito** per cercare i ruling di Yu-Gi-Oh!: nessuna IA, nessun server, nessuna chiave API.

## Cosa fa
- **Chiedi**: scrivi la domanda con parole tue. La ricerca (tutta nel browser, con sinonimi italiano/inglese
  e gergo come "GY", "imperm", "chainare") trova la risposta nella raccolta di domande frequenti
  e le sezioni pertinenti del regolamento. Le carte citate nella domanda (anche con soprannomi come
  "ash", "imperm", "veiler") vengono riconosciute e mostrate con il testo ufficiale.
- **Carte**: ricerca per nome italiano o inglese, anche parziale o con errori di battitura, con suggerimenti
  mentre scrivi. Testo ufficiale (italiano e inglese) e link ai ruling su Yugipedia e al database Konami.
- **Regolamento**: tutta la knowledge base consultabile e filtrabile.
- **Installabile** sulla schermata Home (Android: pulsante "Installa"; iPhone: Condividi → Aggiungi alla
  schermata Home) e **utilizzabile offline**.
- Le ricerche sono condivisibili: l'URL contiene la domanda (`?q=...`).

## Database delle carte
Le carte provengono dall'API gratuita di [YGOPRODeck](https://ygoprodeck.com/api-guide/). Lo script
`scripts/build-cards.mjs` scarica tutte le carte (inglese + italiano) e crea `data/cards-index.json`
e `data/cards/*.json`. Non serve farlo a mano: lo fa la GitHub Action a ogni pubblicazione e ogni
lunedì, così le carte nuove arrivano da sole. I file generati non vengono salvati nel repository.

## Pubblicarlo gratis con GitHub Pages
1. Sul repository: **Settings → Pages**.
2. In *Build and deployment → Source* scegli **GitHub Actions**.
3. Vai su **Actions → Pubblica sito → Run workflow** (oppure fai un push su `main`).
4. Dopo un paio di minuti il sito è online su `https://<utente>.github.io/Ruling/`.

## Provarlo in locale
Serve un piccolo server (aprire `index.html` con doppio clic non basta):
```bash
node scripts/build-cards.mjs     # facoltativo: scarica il database delle carte (Node 22+)
python3 -m http.server 8000      # poi apri http://localhost:8000
```
Senza il database locale la scheda Carte cerca direttamente online su YGOPRODeck.

## Aggiungere ruling
- **Domande frequenti** → `faq/domande.md`. Ogni domanda è un blocco:
  ```markdown
  ## Testo della domanda?
  tag: parole chiave, nomi delle carte in italiano e inglese, sinonimi
  Risposta in Markdown...
  ```
  I tag sono importanti: aggiungi i modi diversi in cui qualcuno potrebbe porre la domanda.
- **Regolamento** → `knowledge/*.md`, una sezione per ogni titolo `##`.
  Per aggiungere un nuovo file, inseriscilo anche nella lista `KNOWLEDGE_FILES` in `app.js`.
- Nuovi sinonimi o termini di gergo → lista `SYNONYMS` in `app.js`.

Dopo aver modificato i file del sito, aumenta il numero di versione `CACHE` in `sw.js`,
così chi ha installato l'app riceve subito l'aggiornamento.

## Struttura
```
index.html, style.css, app.js   # il sito
sw.js, manifest.webmanifest     # installazione e uso offline
icons/                          # icone dell'app
scripts/build-cards.mjs         # scarica il database delle carte
.github/workflows/pages.yml     # pubblicazione su GitHub Pages
faq/domande.md                  # domande frequenti con risposta
knowledge/                      # regolamento (Markdown)
vendor/                         # marked + DOMPurify (rendering Markdown sicuro)
```

> Raccolta curata a mano: può essere incompleta. In torneo vale sempre la decisione del giudice.
> Sito non ufficiale, non affiliato a Konami.
