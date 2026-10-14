import Link from "next/link";

export default function SellGate() {
  return (
    <div className="w-full max-w-sm mx-auto mt-8 text-center fade-in-up">
      <div
        style={{
          background: "white",
          border: "1px solid #E9DCCB",
          borderRadius: 16,
          padding: 32,
        }}
      >
        <h2 className="text-lg font-medium mb-2" style={{ color: "#3A2E22" }}>
          Logg inn for å publisere annonser
        </h2>
        <p className="text-sm mb-6" style={{ color: "#8A7A68" }}>
          Du kan også prøve appen som gjest.
        </p>
        <div className="flex flex-col gap-2">
          <Link
            href="/logg-inn"
            className="w-full rounded-full py-2.5 text-sm bg-[#C4622E] text-[#FBF7F0] transition-colors hover:bg-[#A8521F] outline-none focus-visible:ring-2 focus-visible:ring-[#C4622E] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            Logg inn
          </Link>
          <Link
            href="/registrer"
            className="w-full rounded-full py-2.5 text-sm border border-[#C4622E] text-[#C4622E] bg-transparent transition-colors hover:bg-[#C4622E] hover:text-[#FBF7F0] outline-none focus-visible:ring-2 focus-visible:ring-[#C4622E] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            Opprett konto
          </Link>
          <button
            type="button"
            className="w-full rounded-full py-2.5 text-sm text-[#8A7A68] bg-transparent transition-colors hover:text-[#C4622E] outline-none focus-visible:ring-2 focus-visible:ring-[#C4622E] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            Fortsett som gjest
          </button>
        </div>
      </div>
    </div>
  );
}
