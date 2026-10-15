import HomeContent from "@/components/HomeContent";
import { auth } from "@/auth";

export default async function Home() {
  const session = await auth();
  return <HomeContent isLoggedIn={!!session?.user} />;
}
