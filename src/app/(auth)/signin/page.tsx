"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { FormEvent, useState } from "react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setSubmitting(false);
    if (res?.error) {
      setError("E-mail ou senha inválidos.");
      return;
    }
    window.location.href = "/dashboard";
  }

  return (
    <section className="max-w-md mx-auto mt-10 p-4 panel">
      <h1 className="text-xl font-semibold mb-4">Entrar</h1>

      <form onSubmit={onSubmit} className="grid gap-3">
        <div>
          <label className="block text-sm mb-1">E-mail</label>
          <input
            type="email"
            className="w-full px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@email.com"
            autoComplete="email"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Senha</label>
          <input
            type="password"
            className="w-full px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Sua senha"
            autoComplete="current-password"
          />
        </div>

        {error && <p className="text-[var(--danger)] text-sm">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="button-primary disabled:opacity-60"
        >
          {submitting ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <div className="my-4 h-px bg-white/10" />

      <button
        onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
        className="w-full px-3 py-2 rounded-lg border border-[var(--border)] hover:ring-1 hover:ring-white/5"
      >
        Entrar com Google
      </button>

      <p className="text-sm text-[var(--muted)] mt-4">
        Não tem conta?{" "}
        <Link className="underline" href="/signup">
          Cadastre-se
        </Link>
      </p>
    </section>
  );
}
