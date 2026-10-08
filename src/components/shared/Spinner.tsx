export default function Spinner({ size = 14 }: { size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="inline-block rounded-full animate-spin align-[-2px]"
      style={{
        width: size,
        height: size,
        border: "2px solid #E9B9A0",
        borderTopColor: "#C4622E",
      }}
    />
  );
}
