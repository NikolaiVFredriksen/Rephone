# Frontend polish-logg

Branch: `feature/frontend-polish`. Kun visuell polish, ingen logikk-/datafeltendringer.
Stack-notat: Tailwind v4 (`@import "tailwindcss"`), ingen framer-motion installert -> CSS/Tailwind-overganger først.

## Plan

1. Forsiden: fiks sentrering (fjerne kolliderende max-w/mx-auto i BuyFlow/SellFlow), myk overgang når resultater kommer.
2. Loading: skeleton-kort (4:5, ResultsGrid-layout) i BuyFlow, diskret spinner i EditDraftStep.
3. Overganger: fade/stagger på resultater, myk overgang mellom steg i SellFlow, hover/fokus på knapper og kort. CSS/Tailwind, `prefers-reduced-motion` respekteres.
4. Detaljsiden: luft, hierarki, mobilvisning (stack under bilde/info ved smal skjerm), samme kort-layout.
5. Salg-flyten: StepIndicator (ny, ren presentasjonskomponent, drevet av `step`), penere ImageUploader-slots.
6. /logg-inn og /registrer: samme visuelle språk (kort-wrapper, fokus-tilstander) som resten.
7. Responsivitet: 375 / 768 / 1280 gjennomgang på alle sider.

## Status per oppgave

### 1. Forsiden — ferdig

Fant ikke et reelt venstreforskyvnings-bug ved manuell gjennomgang i Chrome (1280px og nedskalert) av koden som den var: BuyFlow/SellFlow sine `mx-auto`-bokser lå allerede inni flex-foreldre med `items-center`, så de ble sentrert to ganger (harmløst, men unødvendig dobbelt ansvar for sentrering). Ryddet opp ved kilden likevel, slik oppgaven ba om:

- `BuyFlow.tsx` og roten i `SellFlow.tsx`: fjernet redundant `mx-auto` der forelder allerede er `flex items-center` (parent eier sentreringen); beholdt `mx-auto` der forelder ikke er flex (f.eks. steg-2/3-kortene i SellFlow, EditDraftStep).
- Ny "myk overgang"-mekanikk er ren CSS, ingen ny state løftet opp: `Hero.tsx` fikk klassen `hero-section`, `ResultsGrid.tsx` fikk `results-grid` på selve grid-elementet, og `HomeContent.tsx` fikk en `home-shell`-klasse på ytre wrapper. I `globals.css` kollapser `.home-shell:has(.results-grid:not(:empty)) .hero-section` hero-teksten (max-height/opacity/margin, 500ms/350ms ease) når resultatgrid-en får barn. Ingen prop- eller state-endring i BuyFlow/SellFlow trengtes.
- Verifisert i Chrome (localhost:3000, 1280px): uten resultater er hero+søkefelt sentrert under header; etter "Våre anbefalinger" glir hero mykt bort og søkefelt+resultater havner øverst, ikke vertikalsentrert.
- Global `prefers-reduced-motion: reduce`-regel lagt i `globals.css` nå (gjelder alle overganger fremover i oppgave 3 også), siden jeg uansett var i filen.
- Rettet `body`-fontregelen i `globals.css`: den falt tilbake til Arial/Helvetica fordi `font-family` aldri pekte på `--font-geist-sans`-variabelen fra layout.tsx. Nå brukes Geist faktisk som kroppsskrift (var reelt avvik fra "Kun Geist"-kravet).
- Fjernet `prefers-color-scheme: dark`-varianten av paletten i `globals.css`. Den satte `--foreground` til nesten hvit mens bakgrunnen uansett tvinges til `#FBF7F0` via inline style i `layout.tsx` — i mørk systemmodus ville all tekst som arver body-fargen (ikke alt gjør det, det meste har egen inline-farge) blitt nesten usynlig lys tekst på krembunn. Godkjent design er én fast palett, ikke adaptiv, så dette var i strid med spec.
- Ny copy brukt (fra godkjent liste): placeholder "Hva leter du etter?" i BuyFlow, "Hva vil du selge?" i SellFlow (erstatter tidligere "...hva trenger du?" / "...beskriv telefonen din").
- La til hover/fokus-tilstander på "Se forslag", "Våre anbefalinger" og "Se forslag til annonse"-knappene, samt fokus-ring på søkefeltene. Måtte konvertere disse knappenes farger fra inline `style` til Tailwind-klasser (`border-[#C4622E]` osv.) — inline style har høyere spesifisitet enn Tailwind sine `hover:`/`focus-visible:`-klasser og ville overstyrt dem.
- La til `role="status" aria-live="polite"` på de eksisterende "Henter..."-tekstene (ikke ny copy, bare gjort dem skjermleser-vennlige).

**Sjekk visuelt (lokalt):** forsiden i "Kjøp"-modus tom, deretter trykk "Våre anbefalinger" og se at hero-teksten glir bort mens søkefeltet flytter opp — spesielt at det ikke "hopper" eller at linjene ombrekker stygt midt i overgangen på smalere skjermbredder. Sjekk at Geist-fonten nå faktisk brukes (tekst skal se ut som før, men dette er en reell fontbytte under panseret). Sjekk hover/fokus (tab-tastatur) på knappene og søkefeltene.

### 2. Loading — ferdig

- Ny `ListingCardSkeleton.tsx` og `ResultsGridSkeleton.tsx` (rene presentasjonskomponenter, ingen state/datahenting, lagt i `components/shared`) — gjenbruker nøyaktig samme grid-klasser som `ResultsGrid` (inkl. `results-grid`-klassen fra oppgave 1, så hero fortsatt kollapser mens skjelettene vises).
- `BuyFlow.tsx` viser `ResultsGridSkeleton` mens `loading` er sann, ellers `ResultsGrid`. Beholdt synlig "Henter..." (eksisterende copy), men gjorde den til en skikkelig `role="status" aria-live="polite"`-region med en separat skjult `sr-only`-tekst "Søker..." (godkjent skjermleser-copy) slik at skjermlesere ikke leser "Henter..." og "Søker..." samtidig.
- Ny `Spinner.tsx` (ren presentasjonskomponent, `components/shared`) brukt i `EditDraftStep.tsx` sammen med en skjult `sr-only`-tekst "Oppdaterer pris..." (godkjent copy) når `adjusting` er sann. Prisen får en lett opacity-overgang mens den venter på nytt forslag.
- Alle nye spinnere/skeletons har `aria-hidden="true"` på selve de visuelle elementene; det er kun `role="status"`-regionene som annonseres for skjermleser, for å unngå støy.

**Sjekk visuelt (lokalt):** Lokal API-respons er for rask til at jeg fikk fanget skjelett-tilstanden i et skjermbilde (og mitt forsøk på å forsinke `fetch` via konsollen traff ikke sidens egen `fetch`, trolig isolert JS-kontekst). Koden er bygget til å vise skjelett-kort automatisk mens `loading` er sann — sjekk gjerne selv med nettverksdrossling i DevTools (Network → Slow 3G) på "Våre anbefalinger"/"Se forslag", og at EditDraftStep-spinneren vises kort når du endrer tilstand/lagring/batteri (utløser `/api/adjust-price`).

## Funn utenfor scope

(fylles ut underveis)

## Hva jeg ikke endret (copy-forslag utover godkjent liste)

(fylles ut underveis)
