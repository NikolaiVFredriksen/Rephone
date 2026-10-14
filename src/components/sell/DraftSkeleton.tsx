import Skeleton from "../shared/Skeleton";
import Spinner from "../shared/Spinner";

export default function DraftSkeleton() {
  return (
    <div className="max-w-xl mx-auto mt-8 fade-in-up">
      <div
        role="status"
        aria-live="polite"
        style={{
          background: "white",
          border: "1px solid #E9DCCB",
          borderRadius: 16,
          padding: 20,
        }}
      >
        <div
          className="flex items-center gap-2 text-sm mb-4"
          style={{ color: "#8A7A68" }}
        >
          <Spinner size={14} />
          <span>Lager utkast...</span>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-3 w-12 mb-2" />
              <Skeleton className="h-8 w-full" />
            </div>
          ))}
        </div>
        <Skeleton className="h-16 w-full mb-4" style={{ borderRadius: 12 }} />
        <Skeleton className="h-10 w-full" style={{ borderRadius: 999 }} />
      </div>
    </div>
  );
}
