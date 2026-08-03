"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const REDIRECT_BASE = "https://academic-completion.invalid";

function safeNext(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return "/";
  if (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /[\r\n\0]/.test(value)
  ) {
    return "/";
  }

  try {
    const parsed = new URL(value, REDIRECT_BASE);
    if (parsed.origin !== REDIRECT_BASE) return "/";
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return "/";
  }
}

function credentials(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || typeof password !== "string") {
    throw new Error("Email i lozinka su obavezni.");
  }

  if (!email.includes("@") || password.length < 8) {
    throw new Error("Unesi valjan email i lozinku od najmanje 8 znakova.");
  }

  return { email: email.trim(), password };
}

export async function signIn(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const { email, password } = credentials(formData);
  const next = safeNext(formData.get("next"));

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect(`/prijava?error=${encodeURIComponent("Prijava nije uspjela.")}&next=${encodeURIComponent(next)}`);
  }

  redirect(next);
}

export async function signUp(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const { email, password } = credentials(formData);
  const next = safeNext(formData.get("next"));

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    redirect(`/registracija?error=${encodeURIComponent("Registracija nije uspjela.")}&next=${encodeURIComponent(next)}`);
  }

  if (!data.session) {
    redirect(`/prijava?message=${encodeURIComponent("Provjeri email i potvrdi račun prije prijave.")}&next=${encodeURIComponent(next)}`);
  }

  redirect(next);
}

export async function signOut() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/");
}
