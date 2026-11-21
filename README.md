# ⚖️ Ruling Bot — Yu-Gi-Oh!

Webapp in cui fai una domanda sui **ruling di Yu-Gi-Oh!** e un bot basato su Claude risponde
con una spiegazione ragionata (risposta breve, spiegazione, esempio di catena, affidabilità).

## Come funziona
- **Knowledge base** (`knowledge/*.md`): regolamento attuale (Master Rule), catena e Velocità, SEGOC,
  "Quando" vs "Se" e perdita del timing, PSCT (costo/bersaglio/effetto), OPT, annullamenti, battaglia e
  Damage Step, Evocazioni (Fusion/Synchro/Xyz/Pendulum/Link, evocazione corretta, Nomi), ruling delle staple
  più giocate e glossario IT/EN. Viene inviata come system prompt con **prompt caching**.
- **Strumento `cerca_carta`**: il bot legge il testo ufficiale delle carte citate dall'API pubblica di
  [YGOPRODeck](https://ygoprodeck.com/api-guide/) (nomi in italiano o inglese).
- **Ricerca web** (opzionale): web search/fetch limitati a siti di ruling (Yugipedia, db.ygoresources.com,
  YGOrganization, yugioh-card.com, YGOPRODeck) per i ruling specifici delle carte.
- Risposte in **streaming**, conversazione multi-turno, limite di richieste per IP.

Per ampliare le conoscenze del bot basta aggiungere/modificare file `.md` in `knowledge/` e riavviare.

## Avvio locale
Richiede Node.js 22+ e una chiave API Anthropic.

```bash
npm install
cp .env.example .env   # inserisci ANTHROPIC_API_KEY
npm start              # http://localhost:3000
```

### Variabili d'ambiente
| Variabile | Default | Descrizione |
|---|---|---|
| `ANTHROPIC_API_KEY` | — | Chiave API (obbligatoria) |
| `PORT` | `3000` | Porta HTTP |
| `CLAUDE_MODEL` | `claude-opus-5-5` | Modello |
| `CLAUDE_EFFORT` | `high` | Effort: `low`…`max` |
| `ENABLE_WEB_SEARCH` | `true` | Ricerca web sui siti di ruling (va abilitata anche nella Console Anthropic) |
| `RATE_LIMIT_PER_HOUR` | `30` | Domande per IP all'ora |

## Docker
```bash
docker build -t ruling-bot .
docker run -p 3000:3000 -e ANTHROPIC_API_KEY=sk-ant-... ruling-bot
```

## Struttura
```
server.js          # Express: /api/ask (SSE), tool loop con Claude, strumento cerca_carta
knowledge/         # knowledge base dei ruling (Markdown)
public/            # frontend (HTML/CSS/JS, marked + DOMPurify in vendor/)
```

> Le risposte sono generate da un'IA e possono contenere errori: in torneo vale sempre la decisione del giudice.
