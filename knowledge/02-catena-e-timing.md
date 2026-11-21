# PARTE 2 — CATENA, VELOCITÀ, TIMING E TIPI DI EFFETTO

## 2.1 Tipi di effetto dei mostri
- **Effetto ad Accensione (Ignition)**: si attiva dichiarandolo durante la propria Main Phase quando la catena è vuota. Velocità 1. Es.: "Puoi...: [effetto]" senza condizione temporale.
- **Effetto a Innesco (Trigger)**: si attiva quando avviene un evento ("Quando/Se questa carta viene Evocata...", "Se questa carta viene mandata al Cimitero..."). Velocità 1 (ma può formare una catena con altri effetti a innesco simultanei: vedi SEGOC). Può essere obbligatorio o facoltativo ("puoi").
- **Effetto Rapido (Quick Effect)**: Velocità 2; si può attivare anche nel turno avversario e in risposta ad altri effetti. Nel PSCT moderno è indicato da "(Effetto Rapido)" o da condizioni come "Quando l'avversario attiva...", "durante la Main Phase di qualsiasi giocatore". Gli "hand trap" sono Effetti Rapidi attivati dalla mano.
- **Effetto FLIP**: si attiva quando il mostro viene scoperto (Flip Summon o girato da un attacco/effetto). È un tipo di effetto a innesco, Velocità 1.
- **Effetto Continuo**: non si attiva, si applica finché la carta è scoperta sul terreno (o nella zona indicata). Non usa la catena.
- **Effetto di Evocazione / condizione** (Summoning condition): restrizioni o procedure su come il mostro può essere evocato; non è un effetto che si attiva e non può essere annullato da effetti che annullano gli effetti dei mostri.
- **Effetti che "si applicano"** dal Cimitero o dalla mano senza attivarsi (es. "Se un mostro... verrebbe distrutto, puoi invece bandire questa carta dal tuo Cimitero"): sono effetti di sostituzione/applicazione, non usano la catena e non possono essere contrastati con effetti che rispondono alle attivazioni.

## 2.2 Velocità degli Incantesimi (Spell Speed)
| Velocità | Cosa |
|---|---|
| 1 | Magie Normali, Magie Equipaggiamento, Magie Continue, Magie Terreno, Magie Rituali; effetti ad Accensione, a Innesco e FLIP dei mostri; effetti attivati di Magie Continue/Terreno se non diversamente indicato |
| 2 | Magie Rapide, Trappole Normali, Trappole Continue, Effetti Rapidi dei mostri, effetti attivabili delle Trappole Continue |
| 3 | Contro-Trappole (e rari effetti che si dichiarano di Velocità 3) |

- Una carta di Velocità 1 può essere solo **Anello 1 (Chain Link 1)** di una catena (eccezione: più effetti a innesco simultanei di Velocità 1 vengono messi insieme in catena tramite SEGOC).
- Per rispondere a un Anello serve Velocità **uguale o superiore** a quello a cui si risponde, e comunque almeno 2.
- A una Contro-Trappola (Velocità 3) si può rispondere solo con un'altra Velocità 3.

## 2.3 Costruzione e risoluzione della catena
- Quando una carta/effetto viene attivato si crea l'Anello 1. L'avversario del giocatore che ha attivato ha per primo la possibilità di rispondere; poi si alterna finché entrambi passano.
- La catena si risolve **all'indietro**: dall'ultimo anello al primo (LIFO).
- Durante la risoluzione di una catena non si possono attivare carte o effetti (eccetto ciò che la risoluzione stessa richiede). Gli effetti a innesco che si innescano durante la risoluzione aspettano la fine della catena e poi formano una **nuova catena**.
- Una stessa carta sul terreno non può attivare più volte lo stesso effetto nella stessa catena (in generale ogni effetto attivabile una volta per catena), salvo indicazioni.
- **Costi** e **bersagli** si pagano/scelgono al momento dell'**attivazione** (all'atto di creare l'anello), non alla risoluzione.
- Le informazioni "pubbliche" alla risoluzione: un effetto usa lo stato del gioco al momento della risoluzione (salvo che il testo si riferisca a valori al momento dell'attivazione).
- **Priorità del turno**: in ogni fase il turno player ha il diritto di agire per primo. Dopo un'Evocazione, il turno player può attivare per primo (anche un effetto ad Accensione) prima che l'avversario risponda all'evocazione.

## 2.4 SEGOC (Simultaneous Effects Go On Chain)
Quando più effetti a innesco si innescano nello stesso momento (o durante la stessa catena), dopo la risoluzione vengono messi in catena nell'ordine:
1. Effetti a innesco **obbligatori** del turno player;
2. Effetti a innesco **obbligatori** dell'avversario;
3. Effetti a innesco **facoltativi** del turno player;
4. Effetti a innesco **facoltativi** dell'avversario.
- Ogni giocatore decide l'ordine dei propri effetti all'interno di ciascuna categoria.
- Dopo che tutti questi effetti sono stati messi in catena, i giocatori possono rispondere con Effetti Rapidi/Velocità 2+ (prima l'avversario del giocatore che ha attivato l'ultimo anello).
- Gli effetti a innesco facoltativi attivati in SEGOC si risolvono in ordine inverso, quindi l'ultimo inserito si risolve per primo.

## 2.5 "Quando" vs "Se" — perdere il timing (Missing the Timing)
- Gli effetti a innesco **facoltativi** scritti "**Quando** ... puoi ..." (When ... you can) **perdono il timing** se l'evento che li innesca **non è l'ultima cosa accaduta**. Accade tipicamente quando l'evento avviene:
  - a metà della risoluzione di un effetto seguito da altro ("e poi", "then"), oppure
  - durante un anello di catena che non è l'ultimo a risolversi (cioè se dopo l'evento, nella stessa catena, si risolve qualcos'altro), oppure
  - come costo di un'attivazione (dopo il costo segue la risoluzione).
- Gli effetti "**Se** ... puoi ..." (If ... you can) **non perdono mai il timing**: si attivano dopo la catena anche se l'evento non era l'ultimo.
- Gli effetti **obbligatori** ("Quando ...: [fai]" senza "puoi") **non perdono il timing**.
- Esempio classico: un mostro con "Quando questa carta viene mandata al Cimitero: puoi ..." mandato al Cimitero come Anello 1 di una catena a 2 anelli: se l'Anello 1 è l'ultima cosa a risolversi e manda il mostro al Cimitero come ultima azione, il mostro **non** perde il timing; se viene mandato al Cimitero nell'Anello 2 (che si risolve prima dell'Anello 1), lo perde.
- Se un evento avviene come costo e poi la carta risolve, l'evento non è più "l'ultima cosa accaduta" → gli effetti "Quando ... puoi" su quel costo perdono il timing (gli effetti "Se" no).
- Nota PSCT: le carte moderne usano quasi sempre "Se" per evitare problemi di timing; testi vecchi usano "Quando".

## 2.6 Lettura del testo (PSCT — Problem-Solving Card Text)
- **Due punti (:)**: ciò che precede i due punti è la **condizione di attivazione** e/o il **costo**; il testo che indica un costo viene prima del punto e virgola.
- **Punto e virgola (;)**: separa **costo/bersaglio** (prima) dall'**effetto** (dopo). Struttura tipica: "[Condizione]: [Costo]; [Effetto]". Esempio: "Quando l'avversario attiva una Magia: puoi scartare 1 carta; annulla l'attivazione" → condizione = l'avversario attiva una Magia; costo = scartare 1 carta; effetto = annulla.
- **"Scegli come bersaglio" (target)**: se il testo dice "scegli come bersaglio", l'effetto **bersaglia** e la scelta avviene all'attivazione. Se non lo dice (es. "distruggi 1 mostro"), la scelta avviene alla risoluzione e **non bersaglia**.
- **"e se lo fai"** (and if you do): le due azioni avvengono contemporaneamente, ma la seconda avviene solo se la prima va a buon fine.
- **"e poi"/"poi"** (then): azioni in sequenza; la seconda dipende dalla prima, ma **non** avviene contemporaneamente → la prima azione non è "l'ultima cosa accaduta" (può causare la perdita di timing per effetti "Quando").
- **"Inoltre"/"anche"** (also): le due parti avvengono contemporaneamente ma sono indipendenti: se una non può essere eseguita, l'altra si esegue comunque.
- **"e"** (and): le azioni avvengono simultaneamente e sono collegate: se una non può essere eseguita, in genere non si esegue nemmeno l'altra (dipende dal ruling della carta).
- **"Durante [fase]"** vs **"All'inizio/alla fine di [fase]"**: momenti di attivazione specifici.
- Testo in grassetto/parentesi come "(Effetto Rapido)", "(Questo è un Effetto Rapido)" chiarisce il tipo.
- "Mostri 'X'" o "carte 'X'" = carte che hanno "X" nel nome o sono dichiarate parte dell'archetipo.
- **"Nome originale"**, **"ATK originale"**: quelli stampati sulla carta, ignorando modifiche.

## 2.7 Restrizioni "una volta per turno" (OPT)
- **"Una volta per turno" (soft OPT)**: vale per quella specifica copia della carta. Un'altra copia può usare il suo effetto nello stesso turno; se la carta lascia il terreno e torna, è considerata una carta nuova e può riusarlo.
- **"Puoi usare questo effetto di [nome] una sola volta per turno" (hard OPT)**: vale per **tutte le copie** con quel nome; anche se la carta lascia e torna.
- **"Puoi usare ogni effetto di [nome] una sola volta per turno"**: ogni effetto elencato è limitato separatamente (puoi usare l'effetto 1 e l'effetto 2 nello stesso turno, una volta ciascuno).
- **"Puoi usare solo 1 effetto di [nome] per turno, e solo una volta in quel turno"**: puoi usare solo uno degli effetti, una volta.
- **"Puoi attivare solo 1 [nome] per turno"**: limita l'attivazione della carta (per le Magie/Trappole); non è possibile attivare un'altra copia, nemmeno se la prima è stata annullata.
- **"Puoi Evocare Specialmente '[nome]' una sola volta per turno"** (in questo modo/così): limita quella procedura di evocazione.
- Se l'**attivazione** o l'**effetto** di un effetto limitato dall'OPT viene **annullato**, l'uso **viene comunque conteggiato** (hai comunque "usato" l'effetto). Lo stesso vale per i costi pagati.
- Un effetto "una volta per turno" che non si attiva (effetto continuo o di sostituzione) è "usato" quando viene applicato.

## 2.8 Costi vs Effetti
- Il **costo** si paga all'attivazione e non può essere evitato o annullato: anche se l'attivazione viene annullata, il costo resta pagato.
- Se non puoi pagare il costo, non puoi attivare la carta.
- Una carta mandata al Cimitero **come costo** non è stata mandata "da un effetto": gli effetti "Se questa carta viene mandata al Cimitero da un effetto di una carta" **non** si attivano.
- Bandire/scartare/Tributare/staccare materiali/pagare LP sono costi tipici se scritti prima del punto e virgola.
- Gli effetti che impediscono un'azione (es. "Nessun giocatore può bandire carte") impediscono anche di pagare costi che richiedono quell'azione.

## 2.9 Annullamento (Negation)
- **Annullare l'attivazione** (negate the activation): la carta/effetto è considerata come non attivata; una carta Magia/Trappola annullata va al Cimitero. Gli effetti "dopo la risoluzione" non si applicano. L'OPT è comunque consumato.
- **Annullare l'effetto** (negate the effect): l'attivazione avviene ma l'effetto non si applica. Una Magia/Trappola Normale va comunque al Cimitero; una Continua resta sul terreno se l'attivazione non è stata annullata (ma il suo effetto di attivazione non si applica).
- **Annullare gli effetti di un mostro sul terreno** (es. "Velo dell'Effetto" / "Effect Veiler", "Impermanenza Infinita"): annulla gli effetti del mostro finché è scoperto sul terreno per la durata indicata. Se il mostro ha già attivato un effetto e l'annullamento si risolve mentre il mostro è ancora scoperto sul terreno, anche l'effetto attivato in catena viene annullato. Se invece il mostro ha lasciato il terreno (es. si è bandito come costo) o l'effetto è stato attivato in mano/Cimitero, l'annullamento sul terreno non ha effetto su quell'effetto.
- **Annullare un'Evocazione** (negate the Summon): solo per Evocazioni "in corso" (Normal, Flip, Tribute, Evocazioni Speciali inerenti come Synchro/Xyz/Link/Pendulum o procedure). Un mostro la cui evocazione è annullata non è mai stato sul terreno: non si innescano i suoi effetti "Se viene Evocato"; va al Cimitero (e un mostro dall'Extra Deck non è stato evocato correttamente). Le Evocazioni Speciali tramite effetto (es. "Mostro Resuscitato") non si annullano come evocazione: si annulla l'attivazione/effetto della carta che evoca.
- Gli effetti che annullano non possono annullare le **condizioni di evocazione**, le regole di gioco o i costi.

## 2.10 Bersagli
- Una carta bersagliata deve essere un bersaglio valido sia all'attivazione che alla risoluzione. Se alla risoluzione il bersaglio ha lasciato la zona, è diventato coperto (quando serve scoperto) o non è più valido, l'effetto non si applica a esso (se aveva più bersagli, si applica agli altri ancora validi, salvo testo diverso).
- Una carta che lascia il terreno e ritorna è una **nuova carta**: un effetto che la bersagliava non la riconosce più.
- "Non può essere scelto come bersaglio da effetti di carte" protegge solo dagli effetti che usano la parola "bersaglio"; non protegge da effetti che non bersagliano (es. "distruggi tutti i mostri").
- "Non può essere scelto come bersaglio per un attacco" riguarda solo la dichiarazione d'attacco.

## 2.11 Immunità e protezioni
- **"Non influenzato dagli effetti di altre carte"** (unaffected): non subisce effetti di altre carte, ma:
  - può essere usato come costo o materiale;
  - non lo proteggono dalle regole del gioco (battaglia, ecc.);
  - l'**attivazione** dei suoi effetti può comunque essere annullata da effetti che annullano l'attivazione (l'annullamento influenza l'anello di catena, non il mostro), mentre la parte che lo influenzerebbe (es. distruggerlo) non si applica;
  - effetti continui che si applicano "ai giocatori" (es. "Nessun giocatore può...") lo riguardano solo se non influenzano direttamente la carta.
- **"Non può essere distrutto da effetti di carte"**: può essere bandito, mandato al Cimitero, Tributato, rimandato in mano, ecc. "Non può essere distrutto in battaglia": niente distruzione in battaglia, ma i danni da battaglia si calcolano normalmente.
- **Effetti di sostituzione alla distruzione** (es. "se questa carta verrebbe distrutta, puoi invece..."): si applicano quando la carta verrebbe distrutta; non usano la catena; se più effetti di sostituzione si applicano, il controllore della carta sceglie quale applicare.

## 2.12 Distruggere, mandare, bandire, rimandare
- **Distruggere** (destroy): la carta va al Cimitero (o nell'Extra Deck se Pendulum dal terreno) come conseguenza di distruzione. Si attivano effetti "se viene distrutta".
- **Mandare al Cimitero** (send): non è distruzione → non bypassa né attiva effetti di distruzione; supera protezioni "non può essere distrutto".
- **Tributare** (Tribute/Release): è un modo specifico di mandare al Cimitero; non è distruzione. Un mostro Tributato è considerato "mandato al Cimitero" (attiva gli effetti "se viene mandato al Cimitero"); se un effetto bandisce le carte che andrebbero al Cimitero (es. "Macro Cosmo"), il mostro Tributato viene invece bandito.
- **Bandire** (banish): la carta va nella zona delle carte bandite, scoperta (salvo che sia "bandita coperta"). Le carte bandite coperte non sono considerate pubbliche e non possono essere scelte da effetti che riguardano carte bandite scoperte.
- **Rimandare in mano / mischiare nel Deck**: i mostri dell'Extra Deck rimandati in mano o nel Deck vanno invece nell'**Extra Deck**. I Token scompaiono.
- **Lasciare il terreno**: qualunque spostamento dal terreno a un'altra zona (Cimitero, mano, Deck, Extra Deck, banditi, diventare materiale Xyz). Diventare materiale Xyz conta come lasciare il terreno.
- Una carta **coperta** che lascia il terreno: i suoi effetti "se questa carta lascia il terreno" non si attivano se la carta non era scoperta (gli effetti dei mostri coperti non sono applicabili), salvo testo diverso.

## 2.13 Effetti persistenti (lingering) e durate
- Un effetto che, una volta risolto, si applica "per il resto di questo turno" o "fino alla fine del prossimo turno" continua ad applicarsi anche se la carta che l'ha generato lascia il terreno o viene annullata **dopo** la risoluzione.
- Se l'effetto viene annullato **prima** di risolversi, la sua parte di restrizione dipende da dove è scritta: se la restrizione fa parte dell'effetto risolto, non si applica; se è scritta come condizione/costo dell'attivazione (es. "Non puoi Evocare Specialmente... nel turno in cui attivi questa carta"), si applica comunque.
- Le restrizioni scritte **prima** dell'effetto come condizione ("Non puoi Evocare Specialmente mostri dall'Extra Deck nel turno in cui attivi questo effetto, eccetto...") si controllano sia prima (non devi aver fatto l'azione) sia dopo (non puoi farla per il resto del turno), anche se l'effetto viene annullato.

## 2.14 Controllo e proprietà
- Il **proprietario** è chi ha messo la carta nel Deck; il **controllore** è chi la controlla al momento. Prendere il controllo di un mostro (es. "Cambio di Cuore") non ne cambia la proprietà: se va al Cimitero, va nel Cimitero del proprietario.
- I mostri il cui controllo è stato preso possono essere usati come Tributo/Materiale dal controllore.
- Le carte "che controlli" si riferiscono al terreno del controllore.
