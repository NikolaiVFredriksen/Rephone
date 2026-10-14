"use server";

import { signIn } from "@/auth";

export async function guestLogin() {
  const email = process.env.DEMO_USER_EMAIL;
  const password = process.env.DEMO_USER_PASSWORD;

  if (!email || !password) {
    return { error: "Gjesteinnlogging er ikke konfigurert" };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    return { success: true as const };
  } catch (err) {
    console.error("Gjesteinnlogging feilet:", err);
    return { error: "Kunne ikke logge inn som gjest, prøv igjen" };
  }
}
