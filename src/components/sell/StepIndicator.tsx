type StepIndicatorProps = {
  step: 1 | 2 | 3;
};

const STEP_LABELS = ["Beskriv", "Sjekk", "Publiser"];

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M2.5 6.5L4.75 8.75L9.5 3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function StepIndicator({ step }: StepIndicatorProps) {
  return (
    <ol
      className="flex items-start justify-center gap-2 mb-8 fade-in-up cursor-default select-none"
      aria-label="Fremdrift i salgsflyten"
    >
      {STEP_LABELS.map((label, idx) => {
        const n = idx + 1;
        const isDone = n < step;
        const isCurrent = n === step;

        return (
          <li
            key={label}
            className="flex items-center gap-2"
            aria-current={isCurrent ? "step" : undefined}
          >
            <div className="flex flex-col items-center gap-1.5">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors duration-300"
                style={{
                  background: isDone ? "#C4622E" : "transparent",
                  color: isDone ? "#FBF7F0" : isCurrent ? "#C4622E" : "#8A7A68",
                  border: isCurrent
                    ? "1px solid #C4622E"
                    : isDone
                      ? "1px solid transparent"
                      : "1px solid #E9DCCB",
                  boxShadow: isCurrent ? "0 0 0 3px #F3DCD1" : "none",
                }}
              >
                {isDone ? <CheckIcon /> : n}
              </div>
              <span
                className="text-[11px]"
                style={{
                  color: isCurrent ? "#3A2E22" : "#8A7A68",
                  fontWeight: isCurrent ? 500 : 400,
                }}
              >
                {label}
                {isDone && <span className="sr-only"> (fullført)</span>}
                {isCurrent && <span className="sr-only"> (nåværende steg)</span>}
              </span>
            </div>
            {idx < STEP_LABELS.length - 1 && (
              <div
                className="w-8 h-px transition-colors duration-300 mb-5"
                style={{ background: n < step ? "#C4622E" : "#E9DCCB" }}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
