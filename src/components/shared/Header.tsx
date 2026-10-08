import Link from "next/link";
import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";

export default async function Header() {
  const session = await auth();

  return (
    <div
      style={{ background: "#FBF7F0", borderBottom: "1px solid #E9DCCB" }}
      className="w-full px-6 py-6 sticky top-0 z-10"
    >
      <div className="flex justify-between items-center max-w-3xl mx-auto">
        <Link
          href="/"
          className="text-lg font-medium text-[#3A2E22] transition-colors hover:text-[#C4622E] outline-none focus-visible:ring-2 focus-visible:ring-[#C4622E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FBF7F0] rounded-sm"
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
              className="text-sm text-[#8A7A68] transition-colors hover:text-[#C4622E] outline-none focus-visible:ring-2 focus-visible:ring-[#C4622E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FBF7F0] rounded-sm"
            >
              Logg ut
            </button>
          </form>
        ) : (
          <Link
            href="/logg-inn"
            className="text-sm text-[#8A7A68] transition-colors hover:text-[#C4622E] outline-none focus-visible:ring-2 focus-visible:ring-[#C4622E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FBF7F0] rounded-sm"
          >
            Logg inn
          </Link>
        )}
      </div>
    </div>
  );
}
