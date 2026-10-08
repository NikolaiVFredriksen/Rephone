type StepIndicatorProps = {
  step: 1 | 2 | 3;
};

export default function StepIndicator({ step }: StepIndicatorProps) {
  return (
    <div
      className="flex items-center justify-center gap-2 mb-8 fade-in-up"
      aria-hidden="true"
    >
      {[1, 2, 3].map((n, i) => (
        <div key={n} className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors duration-300"
            style={{
              background: n <= step ? "#C4622E" : "transparent",
              color: n <= step ? "#FBF7F0" : "#8A7A68",
              border: n <= step ? "1px solid transparent" : "1px solid #E9DCCB",
            }}
          >
            {n}
          </div>
          {i < 2 && (
            <div
              className="w-8 h-px transition-colors duration-300"
              style={{ background: n < step ? "#C4622E" : "#E9DCCB" }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
