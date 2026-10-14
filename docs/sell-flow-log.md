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
