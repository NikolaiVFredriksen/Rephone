type BadgeTone = "suggested" | "missing";

const TONE_STYLES: Record<BadgeTone, React.CSSProperties> = {
  suggested: { background: "#F3DCD1", color: "#8A4A2E" },
  missing: { background: "transparent", color: "#C4622E", border: "1px solid #C4622E" },
};

export default function Badge({
  tone,
  children,
}: {
  tone: BadgeTone;
  children: React.ReactNode;
}) {
  return (
    <span
      className="text-[10px] px-2 py-0.5 rounded-full font-medium"
      style={TONE_STYLES[tone]}
    >
      {children}
    </span>
  );
}
