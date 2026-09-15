"use client";

import { apiPost } from "@/lib/http";
import { PasswordSchema } from "@/lib/validations/password";
import { signIn } from "next-auth/react";
import { FormEvent, useState } from "react";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const passwordCheck = PasswordSchema.safeParse(password);
    if (!passwordCheck.success) {
      setSubmitting(false);
      setError(
        passwordCheck.error.issues[0]?.message || "Senha inválida."
      );
      return;
    }

    try {
      await apiPost("/api/register", { name, email, password });
    } catch (err: any) {
      setSubmitting(false);
      setError(err?.message || "Falha ao cadastrar.");
      return;
    }

    // login automático após cadastro
    await signIn("credentials", {
      email,
      password,
      callbackUrl: "/dashboard",
    });
  }

  return (
    <section className="max-w-md mx-auto mt-10 p-4 panel">
      <h1 className="text-xl font-semibold mb-4">Criar conta</h1>
      <form onSubmit={onSubmit} className="grid gap-3">
        <div>
          <label className="block text-sm mb-1">Nome</label>
          <input
            className="w-full px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome"
          />
        </div>
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
            placeholder="Mínimo 8 caracteres, com letra e número"
            autoComplete="new-password"
            minLength={8}
          />
          <p className="mt-1 text-xs text-[var(--muted)]">
            Use pelo menos 8 caracteres, incluindo letra e número.
          </p>
        </div>

        {error && <p className="text-[var(--danger)] text-sm">{error}</p>}

        <button
          type="submit"
          className="button-primary disabled:opacity-60"
          disabled={submitting}
        >
          {submitting ? "Cadastrando..." : "Criar conta"}
        </button>
      </form>
    </section>
  );
}
