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

(fylles ut underveis)

## Funn utenfor scope

(fylles ut underveis)

## Hva jeg ikke endret (copy-forslag utover godkjent liste)

(fylles ut underveis)
