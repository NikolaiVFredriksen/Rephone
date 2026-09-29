import Link from "next/link";

export default function Header() {
  return (
    <div className="w-full px-6 py-6">
      <div className="flex justify-between items-center max-w-3xl mx-auto">
        <Link
          href="/"
          style={{ color: "#3A2E22" }}
          className="text-lg font-medium"
        >
          Rephone
        </Link>
        <Link href="/logg-inn" style={{ color: "#8A7A68" }} className="text-sm">
          Logg inn
        </Link>
      </div>
    </div>
  );
}
