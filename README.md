# ⚖️ Ruling Bot — Yu-Gi-Oh!

Sito **statico e gratuito** per cercare i ruling di Yu-Gi-Oh!: nessuna IA, nessun server, nessuna chiave API.

## Cosa fa
- **Chiedi**: scrivi la domanda con parole tue. La ricerca (tutta nel browser, con sinonimi italiano/inglese
  e gergo come "GY", "imperm", "chainare") trova la risposta nella raccolta di domande frequenti
  e le sezioni pertinenti del regolamento. I nomi di carte tra virgolette mostrano anche il testo ufficiale.
- **Carte**: testo ufficiale delle carte (nomi italiani o inglesi) dall'API gratuita di
  [YGOPRODeck](https://ygoprodeck.com/api-guide/), con link ai ruling su Yugipedia e al database Konami.
- **Regolamento**: tutta la knowledge base consultabile e filtrabile.
- Le ricerche sono condivisibili: l'URL contiene la domanda (`?q=...`).

## Pubblicarlo gratis con GitHub Pages
1. Sul repository: **Settings → Pages**.
2. In *Build and deployment* scegli **Deploy from a branch**, branch **main**, cartella **/ (root)** → Save.
3. Dopo un minuto il sito è online su `https://<utente>.github.io/Ruling/`.

## Provarlo in locale
Serve un piccolo server (aprire `index.html` con doppio clic non basta, perché il sito carica i file `.md`):
```bash
python3 -m http.server 8000
# poi apri http://localhost:8000
```

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

## Struttura
```
index.html, style.css, app.js   # il sito
faq/domande.md                  # domande frequenti con risposta
knowledge/                      # regolamento (Markdown)
vendor/                         # marked + DOMPurify (rendering Markdown sicuro)
```

> Raccolta curata a mano: può essere incompleta. In torneo vale sempre la decisione del giudice.
> Sito non ufficiale, non affiliato a Konami.
