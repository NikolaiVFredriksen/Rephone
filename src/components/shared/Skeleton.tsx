export default function Skeleton({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block rounded-md animate-pulse ${className}`}
      style={{ background: "#E9DCCB", ...style }}
    />
  );
}
