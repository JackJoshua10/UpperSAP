"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatDate, type EventItem, type TicketType } from "@/lib/types";

const emptyForm = {
  full_name: "",
  email: "",
  company: "",
  job_title: "",
  phone: "",
  ticket_type: "general" as TicketType,
};

// Next 16: useParams() debe ir dentro de <Suspense> para no bloquear el prerender.
export default function Page() {
  return (
    <Suspense fallback={<main className="flex flex-1 items-center justify-center text-slate-500">Cargando evento...</main>}>
      <PublicEventPage />
    </Suspense>
  );
}

function PublicEventPage() {
  const { slug } = useParams<{ slug: string }>();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("events")
      .select("*")
      .eq("slug", slug)
      .maybeSingle()
      .then(({ data }) => {
        setEvent(data);
        setLoading(false);
      });
  }, [slug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!event) return;
    setSending(true);
    setError(null);

    const { error } = await supabase.from("registrations").insert({
      event_id: event.id,
      full_name: form.full_name.trim(),
      email: form.email.trim().toLowerCase(),
      company: form.company.trim() || null,
      job_title: form.job_title.trim() || null,
      phone: form.phone.trim() || null,
      ticket_type: form.ticket_type,
    });

    setSending(false);
    if (error) {
      setError(
        error.code === "23505"
          ? "Este correo ya está inscrito en el evento."
          : "No pudimos registrar tu inscripción. Inténtalo nuevamente.",
      );
      return;
    }
    setDone(true);
    setForm(emptyForm);
  }

  if (loading) {
    return <main className="flex flex-1 items-center justify-center text-slate-500">Cargando evento...</main>;
  }

  if (!event) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-2xl font-bold">Evento no encontrado</h1>
        <Link href="/" className="btn-secondary">
          Ir a EventoPro
        </Link>
      </main>
    );
  }

  return (
    <main className="flex-1">
      <section className="bg-gradient-to-br from-violet-700 to-fuchsia-600 text-white">
        <div className="mx-auto max-w-3xl px-4 py-14">
          <p className="text-sm font-semibold uppercase tracking-wide text-violet-200">Inscripción abierta</p>
          <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">{event.name}</h1>
          <p className="mt-3 text-violet-100">
            {formatDate(event.starts_at)}
            {event.venue ? ` · ${event.venue}` : ""}
          </p>
          {event.description && <p className="mt-4 max-w-2xl text-violet-50">{event.description}</p>}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-10">
        {done ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
            <h2 className="text-xl font-bold text-emerald-800">¡Inscripción recibida!</h2>
            <p className="mt-2 text-emerald-700">
              El equipo organizador revisará tu registro y te enviará la confirmación a tu correo.
            </p>
            <button className="btn-secondary mt-4" onClick={() => setDone(false)}>
              Inscribir a otra persona
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold">Regístrate</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium sm:col-span-2">
                Nombre completo *
                <input
                  required
                  minLength={2}
                  className="input mt-1"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                />
              </label>
              <label className="block text-sm font-medium">
                Correo *
                <input
                  type="email"
                  required
                  className="input mt-1"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </label>
              <label className="block text-sm font-medium">
                Teléfono
                <input
                  className="input mt-1"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </label>
              <label className="block text-sm font-medium">
                Empresa / institución
                <input
                  className="input mt-1"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                />
              </label>
              <label className="block text-sm font-medium">
                Cargo
                <input
                  className="input mt-1"
                  value={form.job_title}
                  onChange={(e) => setForm({ ...form, job_title: e.target.value })}
                />
              </label>
              <label className="block text-sm font-medium sm:col-span-2">
                Tipo de entrada
                <select
                  className="input mt-1"
                  value={form.ticket_type}
                  onChange={(e) => setForm({ ...form, ticket_type: e.target.value as TicketType })}
                >
                  <option value="general">General</option>
                  <option value="vip">VIP</option>
                  <option value="estudiante">Estudiante</option>
                </select>
              </label>
            </div>
            {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <button type="submit" className="btn-primary mt-6 w-full sm:w-auto" disabled={sending}>
              {sending ? "Enviando..." : "Confirmar inscripción"}
            </button>
          </form>
        )}
        <p className="mt-6 text-center text-xs text-slate-500">
          Inscripciones gestionadas con <Link href="/" className="font-semibold text-violet-700">EventoPro</Link>
        </p>
      </section>
    </main>
  );
}
