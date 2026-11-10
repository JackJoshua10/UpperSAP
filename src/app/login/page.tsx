"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "info"; text: string } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) return router.replace("/dashboard");
      if (new URLSearchParams(window.location.search).get("mode") === "signup") setMode("signup");
    });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({ email, password });
      setLoading(false);
      if (error) return setMessage({ type: "error", text: error.message });
      if (!data.session) {
        return setMessage({
          type: "info",
          text: "Cuenta creada. Revisa tu correo para confirmarla y luego ingresa.",
        });
      }
      return router.replace("/dashboard");
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setMessage({ type: "error", text: "Correo o contraseña incorrectos." });
    router.replace("/dashboard");
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <Link href="/" className="text-lg font-bold text-violet-700">
          Evento<span className="text-slate-900">Pro</span>
        </Link>
        <h1 className="mt-4 text-xl font-bold">
          {mode === "login" ? "Ingresa a tu panel" : "Crea tu cuenta de organizador"}
        </h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-medium">
            Correo
            <input
              type="email"
              required
              className="input mt-1"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </label>
          <label className="block text-sm font-medium">
            Contraseña
            <input
              type="password"
              required
              minLength={6}
              className="input mt-1"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </label>

          {message && (
            <p
              className={`rounded-lg p-3 text-sm ${
                message.type === "error" ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"
              }`}
            >
              {message.text}
            </p>
          )}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "Procesando..." : mode === "login" ? "Ingresar" : "Crear cuenta"}
          </button>
        </form>

        <button
          type="button"
          className="mt-4 w-full text-center text-sm text-violet-700 hover:underline"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setMessage(null);
          }}
        >
          {mode === "login" ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Ingresa"}
        </button>
      </div>
    </main>
  );
}
