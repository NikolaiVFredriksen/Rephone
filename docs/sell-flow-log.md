# Sell-flow log

Formål: salgsflyten skal gi tydelig retning (hvor er jeg, hva skal jeg gjøre,
hva skjer når jeg trykker), og prisen skal oppdatere seg raskt og riktig.

## Avvik fra oppgavebeskrivelsen (dokumentert, ikke rettet selv)

- `StepIndicator.tsx` ligger i `src/components/sell/`, ikke
  `src/components/shared/` som oppgaveteksten nevner. Det finnes ingen
  StepIndicator i `shared/`. Jeg har redigert filen der den faktisk ligger
  (`sell/StepIndicator.tsx`), siden `sell/**` uansett er en fil jeg får endre.

## Infrastruktur — delt Draft-type

**Hvorfor:** `Draft`-typen var kopiert likt i `SellFlow.tsx`,
`EditDraftStep.tsx` og `GenerateDescription.tsx`. Én endring i formen (f.eks.
et nytt felt) måtte da gjøres tre steder uten at TypeScript varslet om du
glemte ett av dem.

Opprettet `src/components/sell/types.ts` med `Draft`. Byttet importen i
`SellFlow.tsx` nå (den filen jeg rørte i oppgave 1). `EditDraftStep.tsx` og
`GenerateDescription.tsx` byttes til samme import i oppgave 2 og 4, når jeg
likevel redigerer dem — for å holde hver commit til én oppgave.

## Oppgave 1 — Steg 1 (SellFlow)

**Hvorfor:** Et enlinjefelt med placeholder "Hva vil du selge?" gir ingen
retning for HVA man bør skrive (modell, tilstand, lagring, batteri) — det ser
ut som et søkefelt, ikke et skjema som skal fylles ut. Og en alltid-aktiv
knapp lar brukeren sende et tomt eller meningsløst forslag.

Endringer:
- Enlinjefelt → `<textarea rows={3}>`, med egen overskrift "Hva vil du
  selge?", hjelpetekst og eksempel som placeholder ("iPhone 13 Pro, 256 GB,
  pent brukt, batterihelse 88 prosent").
- Knappen heter "Lag annonseutkast", er `disabled` (dempet med `opacity-40`
  og `cursor-not-allowed`) til beskrivelsen har minst 3 tegn (samme grense
  brukes i `handleSubmit`-guarden, så innsending ikke kan trigges på andre
  måter, f.eks. Enter).
- `ImageUploader`: lagt til overskriften "Bilder (valgfritt, opptil 3)" over
  slottene, og byttet det nakne plusstegnet i tomme slots til ikon + teksten
  "Legg til" under.
- `StepIndicator`: fjernet alt som kunne se klikkbart ut (lagt til
  `cursor-default`, ingen hover-stil fantes allerede siden det ikke er noen
  onClick). Lagt til navn under hver sirkel ("Beskriv", "Sjekk", "Publiser"),
  en hake for fullførte steg i stedet for tallet, og en ring
  (`box-shadow`-glow i `#F3DCD1`) rundt nåværende steg. Brukt `<ol>`/`<li>`
  med `aria-current="step"` og skjermleser-tekst for fullført/nåværende,
  siden indikatoren nå faktisk formidler informasjon (navn), ikke bare
  dekorasjon.
- Lagt til et `DraftSkeleton`-steg (se oppgave 2) som vises i stedet for
  steg-1-formen mens "Lager utkast..." pågår, og fjernet den gamle
  "Henter..."-teksten som lå løst under formen.

**Bør sjekkes visuelt:** at textarea-en er 3 rader høy med synlig
placeholder-eksempel, at knappen faktisk ser dempet/uklikkbar ut før du har
skrevet 3 tegn og normal etter, at bildeslottene viser "Legg til" i tomme
slots, og at StepIndicator viser haker på fullførte steg og en synlig ring
rundt det nåværende (uten hover-effekt noe sted på selve indikatoren).

## Oppgave 2 — Steg 2 (EditDraftStep)

**Hvorfor:** "AI-forslag, juster det som ikke stemmer" sier ikke hvilke felt
som faktisk kommer fra AI-en og hvilke som er tomme og må fylles ut manuelt —
brukeren må gjette. Og "Fortsett" var alltid klikkbar, selv med tomme felt
som gjør annonsen upubliserbar lenger ned i flyten.

Endringer:
- Overskrift "Sjekk utkastet" og hjelpetekst "Vi har fylt ut dette ut fra
  beskrivelsen din. Rett det som er feil." erstatter den gamle
  énlinjesteksten.
- Hvert felt har nå en liten `Badge` ved siden av label: "Foreslått" (grønn-
  aktig/aksent bakgrunn) når feltet har en verdi, "Fyll inn" (outline i
  aksentfarge) når det er tomt/null. Tomme felt får samtidig en tydelig
  aksentfarget kant (`#C4622E`) i stedet for standard `#E9DCCB`, så de er
  synlige uten å måtte lese merkelappen.
- "Fortsett"-knappen er `disabled` til merke, modell, tilstand og pris
  (pris > 0) er satt — med en liten forklarende tekst under knappen når den
  er deaktivert, slik at brukeren vet HVORFOR, ikke bare at den ikke virker.
- Prisfeltets label endret til "Foreslått pris", med en diskret `Spinner`
  (11px, kun ikon + skjermleser-tekst, ingen synlig "Oppdaterer..."-tekst
  oppå selve prisen) ved siden av label mens `adjusting` er sann. Den
  forklarende linjen under prisen viser fortsatt "Oppdaterer
  prisforslag..." mens den venter, ellers AI-ens begrunnelse.
- "Mens utkastet lages... vises et skeleton" og "Steg 2 vises ikke før
  svaret er ferdig" var allerede løst i oppgave 1 (se der): `DraftSkeleton`
  vises i `SellFlow` mens `/api/price-suggestion` pågår, og
  `EditDraftStep` rendres aldri før `step === 2 && draft` — altså aldri før
  svaret er ferdig og lagret i `draft`.
- Byttet den lokale `Draft`-typen til import fra `./types` (se
  infrastruktur-notatet øverst).

**Bør sjekkes visuelt:** at "Foreslått"/"Fyll inn"-merkelappene vises riktig
per felt rett etter at utkastet er lastet (batterihelse er ofte "Fyll inn"
siden beskrivelsen sjelden nevner det), at tomme felt har synlig
aksentfarget kant, at "Fortsett" er synlig dempet og viser forklaringsteksten
når f.eks. tilstand ikke er valgt, og at den lille spinneren ved "Foreslått
pris" dukker opp når du endrer tilstand/lagring (uten å dekke prisen helt).

## Rettet fra oppgave 2 — prisfeltet ble ved et uhell skrivebeskyttet

I oppgave 2 skrev jeg om prisvisningen til en ren `<p>` (for å vise
"Foreslått pris" ryddig), og glemte at det samtidig fjernet muligheten til å
skrive inn pris manuelt — som fantes i originalkoden og som oppgave 3 er
avhengig av. Rettet nå, som del av oppgave 3: pris er igjen et `<input>` (med
"kr" som statisk tekst utenfor selve input-feltet, så formatering ikke
kolliderer med tallparsing), og brukerens skriving setter `priceSource` til
"user" (se under).

## Oppgave 3 — Prisoppdatering (refreshPrice)

**Hvorfor:** Hvert tastetrykk i merke/modell/batterihelse kalte `/api/adjust-
price` på `onBlur` før (bare når du klikket ut av feltet, lett å glemme), og
et sent svar fra et gammelt kall kunne overskrive et nyere hvis du endret
flere felt raskt. Og en pris brukeren selv har skrevet inn ble stille
overskrevet av neste automatiske oppdatering, som føles som om appen
"spiser" det du nettopp skrev.

Endringer i `EditDraftStep.tsx`:
- **Debounce (600 ms):** merke, modell og batterihelse (tekstfelt) kaller nå
  `refreshPrice` 600 ms etter siste tastetrykk, ikke på blur. En
  `debounceRef`-timer nullstilles på hvert tastetrykk, og det debouncede
  kallet leser alltid den NYESTE draften via `draftRef` (ikke en gammel
  snapshot fra da timeren ble satt), så et felt du endret i mellomtiden ikke
  går tapt.
- **Umiddelbar oppdatering:** tilstand og lagring (dropdowns) kaller
  `refreshPrice` med en gang, som før — og rydder samtidig bort en eventuell
  ventende debounce-timer fra et tekstfelt, så den ikke dukker opp senere og
  overskriver et friskere svar.
- **AbortController:** ett delt `abortRef` avbryter forrige forespørsel hver
  gang en ny startes, uansett hvilket felt som trigget den. Dermed er det
  alltid kun det SISTE kallet som kan skrive til state — et sent svar fra et
  utdatert kall kan aldri vinne over et nyere.
- **basePrice/baseStorage/baseBatteryHealth:** endres merke, modell eller
  tilstand, kalles ruten uten disse (fullt nytt forslag). Endres bare
  lagring eller batterihelse, sendes de med fra `baselineRef` — en
  "siste godkjente"-snapshot som KUN oppdateres når systemet selv foreslår en
  ny pris (aldri når brukeren skriver et tall manuelt), nøyaktig som
  beskrevet i oppgaven. **Se "Trenger endring i API" under** — selve ruten
  bruker i dag ikke disse feltene til noe.
- **Brukerskrevet pris overskrives ikke stille:** et prisfelt brukeren har
  skrevet i (sporet med `priceSource`) gjør at en senere automatisk
  prisoppdatering legges i `pendingPrice` i stedet for å skrive over
  `draft.price`. Det vises som en lenke "Bruk foreslått pris (xxx kr)" under
  prisen, som brukeren selv velger å trykke på.
- **404 og andre feil:** 404 ("Ingen grunnlag") viser "Fant ikke grunnlag for
  ny pris, juster selv" og beholder prisen. Andre feil (nettverksfeil,
  500 osv.) beholder prisen uten noen feilmelding til brukeren, men logges
  med `console.error`. En avbrutt forespørsel (`AbortError`) regnes ikke som
  en feil og logges ikke.
- **Validering:** batterihelse må være `null` eller et tall i intervallet
  0–100 før noe kall gjøres (ugyldige verdier stopper kallet helt, i stedet
  for å sende `NaN` til ruten). `basePrice` sendes kun når den faktisk er et
  gyldig tall.

**Bør sjekkes visuelt/manuelt:** skriv i modell-feltet og se at prisen ikke
endrer seg før ca. 600ms etter du stopper å skrive (ikke ved hver bokstav,
ikke bare ved blur). Bytt tilstand/lagring og se at prisen endrer seg med en
gang. Skriv en egen pris manuelt, endre deretter tilstand — prisen din skal
IKKE forsvinne, men en lenke "Bruk foreslått pris (...)" skal dukke opp under.
Sett batterihelse til f.eks. 150 eller -5 og se at ingenting skjer (ingen
nettverkskall, ingen krasj).

## Trenger endring i API

- **`/api/adjust-price`** tar i dag KUN imot `{ brand, model, condition,
  storage, batteryHealth }` og kjører alltid samme Claude-kall, med en
  systemprompt som er hardkodet til å anta at "lagring og batterihelse ER
  ALLEREDE endret fra forrige forslag" — uansett om det faktisk er merke,
  modell eller tilstand som endret seg. Ruten har ingen `basePrice`,
  `baseStorage` eller `baseBatteryHealth`-parametre, og gjør derfor ingen
  deterministisk uträkning fra en grunnlinje slik oppgaven beskriver.
  Jeg sender disse feltene fra klienten likevel (se oppgave 3), siden de er
  harmløse ekstra felt ruten ignorerer i dag, men den faktiske "regn
  deterministisk ut fra basePrice"-oppførselen finnes ikke før ruten endres
  til å: (1) ta imot `basePrice`/`baseStorage`/`baseBatteryHealth`, og (2)
  gjøre en egen (eventuelt ren matematisk, ikke LLM-basert) uträkning når de
  er satt, i stedet for alltid å kjøre samme "allerede endret"-prompt. Uten
  denne endringen er "deterministisk"-kravet i praksis fortsatt en ny
  Claude-vurdering hver gang, bare med litt mer kontekst i requesten.

## Oppgave 4 — Steg 3 (GenerateDescription)

**Hvorfor:** Brukeren måtte selv trykke en knapp for å få en beskrivelse
("✦ Generer beskrivelse") i stedet for å få den ferdig når de kommer til
steget — ett ekstra, uforklart klikk. Og det var ingen oppsummering av HVA
som faktisk publiseres, så steg 3 føltes løsrevet fra steg 1 og 2.

Endringer:
- Beskrivelsen genereres nå automatisk i en `useEffect` ved mount av steget
  (kallet var der fra før, bare bak en knapp — nå kjøres det automatisk én
  gang når brukeren kommer til steg 3).
- Mens den genereres: `Skeleton`-blokk i tekstfeltets form + "Skriver
  forslag..." med spinner, i stedet for et tomt felt.
- Overskrift "Beskrivelse" og hjelpetekst "Vi har skrevet et forslag.
  Rediger fritt, eller generer på nytt."
- Knappen "Generer på nytt" erstatter "✦ Generer beskrivelse" (samme
  funksjon, tydeligere tekst om hva som skjer — og ingen emoji, per
  designprinsippet).
- Feiler genereringen (kastet unntak, ikke bare dårlig JSON): feltet vises
  tomt med teksten "Kunne ikke lage forslag. Skriv selv." i stedet for å
  krasje eller vise `undefined`.
- Ny oppsummeringsboks over beskrivelsen: første bilde (eller en tom
  plassholder-boks hvis ingen bilde er lastet opp), merke + modell, lagring,
  tilstand (norsk label) og pris.
- "Publiser annonse" er `disabled` når beskrivelsen er tom, med forklarende
  tekst under ("Skriv en beskrivelse før du kan publisere").

**Publiseringsbugen vi fant i nettleseren (URL ble `/undefined`):** rettet
som del av denne oppgaven, siden det er nøyaktig denne filens "hva skjer når
jeg trykker"-ansvar. `publish()` sjekket aldri `res.ok` før den leste
`listing.id` — når `/api/listings` svarer 401 ("Du må være innlogget") eller
400, var responsen `{ error: "..." }` uten `id`, og
`router.push('/annonse/undefined')` kjørte likevel. Nå: ved feil-status
leses `error`-feltet fra svaret og vises over "Publiser annonse"-knappen
(f.eks. "Du må være innlogget"), prisen/beskrivelsen beholdes, og ingen
navigasjon skjer. Samtidig lagt til en `publishing`-state (knappen viser
"Publiserer..." og er deaktivert mens kallet pågår, så dobbeltklikk ikke
sender to annonser), og kalt `onPublish()` — som var sendt inn som prop men
aldri faktisk kalt noe sted i originalkoden — rett før navigering, slik at
`SellFlow` nullstiller flyten sin (ufarlig uansett siden navigeringen uansett
fjerner komponenten, men riktig å faktisk bruke propen den fikk).

**Bør sjekkes visuelt/manuelt:** gå til steg 3 og se at beskrivelsen dukker
opp automatisk (skeleton + "Skriver forslag..." først), at oppsummeringsboksen
viser riktig modell/lagring/tilstand/pris og første bilde, at "Generer på
nytt" fungerer, og at "Publiser annonse" er dempet med forklaringstekst hvis
du tømmer feltet helt. Test publisering både innlogget (skal navigere til
annonsen) og uten å være innlogget (skal vise feilmelding, ikke navigere til
`/undefined`).

## Oppgave 5 — Mobil (375px)

**Hvorfor:** En fast piksel-bredde som er bredere enn 375px tvinger
horisontal scroll på mobil — usynlig på en stor skjerm, men ødelegger
opplevelsen på telefon, som er der folk faktisk selger telefoner fra.

Gjennomgikk alle filer i `src/components/sell/` for faste bredder
(`grep -n "width:\|w-\["` på hele mappen). Funn:
- Bildeslottene i `ImageUploader.tsx` er faste 72px × 3 + mellomrom ≈ 240px —
  trygt under 375px uansett padding.
- Prisfeltets `input` i `EditDraftStep.tsx` bruker `width: "7ch"` (relativt
  til font, ikke piksler) — trygt.
- Alt annet (grid, textarea, bildeoppsummering, knapper) bruker `w-full`,
  `max-w-*` eller ingen bredde satt (innhold styrer) — intet som kan sprenge
  skjermen.
- `StepIndicator` sin tre-sirkler-rad er omtrent 180–220px bred totalt — god
  margin selv på 375px.

**Fjernet en overflødig endring:** La til `px-4` på `SellFlow`s ytre
wrapper i oppgave 1 "for sikkerhets skyld", men fant nå at foreldre-
komponenten (`HomeContent.tsx`, utenfor det jeg får endre) allerede har
`px-6` på `<main>` — konstant padding, ikke en fast bredde, så den er trygg
på alle skjermstørrelser i seg selv. Min `px-4` var dermed bare dobbel,
unødvendig innrykk og inkonsekvent med `BuyFlow` (som ikke har noe
tilsvarende). Fjernet den igjen.

**Eneste trange punkt, ikke en faktisk feil:** `FieldLabel` i
`EditDraftStep.tsx` (label + "Foreslått"/"Fyll inn"-merkelapp,
`justify-between` i samme rad) har ca. 137px tilgjengelig per kolonne på en
375px-skjerm etter all padding. For det lengste feltet, "Batterihelse (%)",
er det tightere enn andre felt. Flexbox lar label-teksten og merkelappen
krympe/brytes i stedet for å sprenge bredden (ingen av dem har en fast
bredde), så det blir aldri horisontal scroll — i verste fall ser det
komprimert ut på en smal skjerm. Jeg endrer ikke layouten for dette, siden
oppgaven spesifikt ber om å unngå det som "sprenger skjermen", ikke om perfekt
linjeknekk på alle feltnavn.

**Bør sjekkes visuelt:** åpne salgsflyten i DevTools med en 375px bredde
(f.eks. "iPhone SE") og gå gjennom steg 1–3. Se spesielt på
"Batterihelse (%)"-raden i steg 2 — merkelappen kan se trang ut, men skal
ikke tvinge sidescroll noe sted.

## Oppgave 6 — Tilbake-knapp

**Hvorfor:** Flyten var strengt fremover: ingen vei tilbake fra steg 2 eller
3 for å rette noe uten å måtte starte helt på nytt (tape beskrivelse, bilder
og utkast). Det bryter rett og slett med "hva skjer når jeg trykker" hvis
den eneste knappen som finnes er "fortsett".

Endringer:
- `EditDraftStep` (steg 2) og `GenerateDescription` (steg 3) får en ny
  `onBack`-prop, kalt fra `SellFlow` (`setStep(1)` / `setStep(2)`). Begge
  steg får en dempet "Tilbake"-knapp (outline, `#8A7A68`, IKKE
  aksentfarget — skal tydelig underordnes "Fortsett"/"Publiser annonse") i
  en rad til venstre for hovedknappen.
- Siden `draft` og `input`/`images` allerede lever i `SellFlow` og ikke
  nulles ut av å endre `step`, beholdes alt som er fylt ut i steg 1 og 2 når
  du går tilbake — det er ingen egen "lagre før du går tilbake"-logikk som
  trengs, bare at ingenting sletter state ved navigering.
- **Fant og rettet et ekte hull i det:** `draft.description` har ALLTID
  vært et felt på `Draft`-typen, men ble ikke faktisk brukt — `
  GenerateDescription` hadde sin egen lokale `useState(draft.description)`
  som aldri ble skrevet tilbake til `draft`. Det betyr at hvis du gikk
  tilbake fra steg 3 til steg 2 og videre til steg 3 igjen, ville
  `GenerateDescription` blitt remountet, den lokale staten forsvunnet, og
  en NY beskrivelse blitt generert automatisk — alt du hadde skrevet eller
  redigert i beskrivelsen, tapt, uten varsel. Rettet ved å la
  `GenerateDescription` ta imot `onDraftChange` og lese/skrive
  `draft.description` direkte i stedet for egen lokal state.
  Auto-genereringen kjører nå kun hvis `draft.description` er tom ved
  mount, så en tur til steg 2 og tilbake til steg 3 viser teksten du hadde,
  ikke et nytt AI-forslag.

**Bør sjekkes visuelt/manuelt:** fra steg 2, trykk "Tilbake" — steg 1 skal
vise samme beskrivelse og bilder som du skrev. Fra steg 3, rediger
beskrivelsen, trykk "Tilbake" til steg 2, endre noe der (f.eks. lagring, så
prisen oppdaterer seg), og gå "Fortsett" til steg 3 igjen — den redigerte
beskrivelsen skal fortsatt stå der, ikke bli byttet ut med et nytt forslag.

## Slik henger salgsflyten sammen

**Hver fil, og hvorfor den finnes:**

- **`SellFlow.tsx`** — eier all state for hele flyten: beskrivelsesteksten
  (`input`), bildene, utkastet (`draft`) og hvilket steg du er på (`step`).
  Ingen av de andre komponentene har egen "sannhet" om disse — de får data
  som props og melder endringer tilbake med `onDraftChange`/`onImagesChange`
  osv. Det er derfor "Tilbake" (oppgave 6) er trygt: å bytte `step` fjerner
  ikke noe av denne staten.
- **`types.ts`** — definerer `Draft` på ett sted, importert av `SellFlow`,
  `EditDraftStep` og `GenerateDescription`. Uten denne måtte formen på et
  utkast holdes i hodet synkronisert mellom tre filer.
- **`StepIndicator.tsx`** — ren visning av hvor i flyten du er (ikke
  klikkbar, viser navn + hake/ring). Vet ingenting om hvordan steg byttes,
  bare hvilket tall den får fra `SellFlow`.
- **`ImageUploader.tsx`** — opplasting av opptil 3 bilder (bruker
  `/api/upload`, en API-rute jeg ikke har rørt). Egen fil fordi
  opplastingslogikken (feilhåndtering, spinner per slot) er egen og ikke
  bør blande seg med steg-1-formen i `SellFlow`.
- **`DraftSkeleton.tsx`** — ren visning som vises i `SellFlow` mens
  `/api/price-suggestion` pågår, formet som steg-2-skjemaet (via den
  generiske `Skeleton`-primitiven i `shared/`) så overgangen til det
  virkelige skjemaet ikke hopper visuelt.
- **`EditDraftStep.tsx`** — steg 2: viser og retter AI-utkastet. Eier sin
  egen prisoppdateringslogikk (`refreshPrice`, debounce, AbortController,
  baseline for siste godkjente pris) siden det er lokalt for dette steget og
  ingen andre komponenter trenger å vite om det.
- **`GenerateDescription.tsx`** — steg 3: genererer og viser
  annonsebeskrivelsen (lagret på `draft.description`, ikke egen lokal
  state — se oppgave 6), viser en oppsummering av annonsen, og publiserer
  via `/api/listings`.

**Fra beskrivelse til publisert annonse, i punkter:**

1. Brukeren skriver en fritekstbeskrivelse (og ev. laster opp bilder) i
   steg 1 og trykker "Lag annonseutkast" (krever minst 3 tegn).
2. `SellFlow` kaller `/api/price-suggestion` med teksten. Mens den venter
   vises `DraftSkeleton` + "Lager utkast...". Steg 2 vises ALDRI før svaret
   er klart.
3. Svaret (merke, modell, tilstand, batterihelse, lagring, foreslått pris og
   begrunnelse) lagres som `draft`, og `step` settes til 2.
4. I `EditDraftStep` ser brukeren utkastet med "Foreslått"/"Fyll inn"-
   merkelapper per felt. Endrer de et felt, kalles `/api/adjust-price` på
   nytt — debounced for tekstfelt, umiddelbart for dropdowns, alltid med
   AbortController så bare siste svar vinner. Skriver brukeren inn en egen
   pris manuelt, blir senere automatiske forslag liggende som en lenke
   ("Bruk foreslått pris...") i stedet for å overskrive.
5. Brukeren kan gå "Tilbake" til steg 1 (med teksten og bildene intakte) eller
   trykke "Fortsett" til steg 3 — bare mulig når merke, modell, tilstand og
   pris er satt.
6. I `GenerateDescription` genereres en annonsetekst automatisk via
   `/api/generate-description` og lagres på `draft.description`. En
   oppsummering (bilde, modell, lagring, tilstand, pris) vises over
   teksten. Brukeren kan redigere fritt, trykke "Generer på nytt", eller gå
   "Tilbake" til steg 2 uten å tape den redigerte teksten (den ligger på
   `draft`, ikke i komponentens egen state).
7. Trykker brukeren "Publiser annonse" (krever ikke-tom beskrivelse), kaller
   `GenerateDescription` `/api/listings`. Lykkes det, kalles `onPublish`
   (nullstiller `SellFlow`) og brukeren sendes til `/annonse/[id]`. Feiler
   det (f.eks. ikke innlogget), vises API-ens feilmelding og ingenting
   nullstilles eller navigeres — brukeren kan rette feilen og trykke igjen.
