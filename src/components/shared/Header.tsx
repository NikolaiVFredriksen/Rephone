import Link from "next/link";
import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";

export default async function Header() {
  const session = await auth();

  return (
    <div
      style={{ background: "#FBF7F0" }}
      className="w-full px-6 py-6 sticky top-0 z-10"
    >
      <div className="flex justify-between items-center max-w-3xl mx-auto">
        <Link
          href="/"
          style={{ color: "#3A2E22" }}
          className="text-lg font-medium"
        >
          Rephone
        </Link>

        {session?.user ? (
          <form
            action={async () => {
              "use server";
              await signOut({ redirect: false });
              redirect("/");
            }}
          >
            <button
              type="submit"
              style={{ color: "#8A7A68" }}
              className="text-sm"
            >
              Logg ut
            </button>
          </form>
        ) : (
          <Link
            href="/logg-inn"
            style={{ color: "#8A7A68" }}
            className="text-sm"
          >
            Logg inn
          </Link>
        )}
      </div>
    </div>
  );
}
