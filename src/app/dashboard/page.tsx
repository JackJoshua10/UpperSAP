"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import {
  STATUS_LABEL,
  STATUS_STYLE,
  TICKET_LABEL,
  formatDate,
  slugify,
  type EventItem,
  type Registration,
  type RegistrationStatus,
  type TicketType,
} from "@/lib/types";

const STATUSES = Object.keys(STATUS_LABEL) as RegistrationStatus[];

type RegistrationForm = {
  id?: string;
  full_name: string;
  email: string;
  company: string;
  job_title: string;
  phone: string;
  ticket_type: TicketType;
  status: RegistrationStatus;
  notes: string;
};

const emptyRegistration: RegistrationForm = {
  full_name: "",
  email: "",
  company: "",
  job_title: "",
  phone: "",
  ticket_type: "general",
  status: "pendiente",
  notes: "",
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [regsLoadedFor, setRegsLoadedFor] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<RegistrationStatus | "todos">("todos");
  const [showEventForm, setShowEventForm] = useState(false);
  const [editing, setEditing] = useState<RegistrationForm | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [aiState, setAiState] = useState<{ reg: Registration; loading: boolean; text?: string; source?: string; error?: string } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const selectedEvent = events.find((e) => e.id === selectedId) ?? null;
  const loadingRegs = selectedId !== null && regsLoadedFor !== selectedId;

  const notify = (text: string) => {
    setToast(text);
    setTimeout(() => setToast(null), 3000);
  };

  // --- Sesion ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace("/login");
      else setUser(data.session.user);
    });
  }, [router]);

  // --- Eventos del organizador ---
  // Filtramos por owner_id porque la lectura de eventos es publica (para la pagina de inscripcion).
  useEffect(() => {
    if (!user) return;
    supabase
      .from("events")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setEvents(data ?? []);
        setSelectedId((current) => current ?? data?.[0]?.id ?? null);
        if (!data?.length) setShowEventForm(true);
      });
  }, [user]);

  // --- Inscripciones del evento seleccionado ---
  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    supabase
      .from("registrations")
      .select("*")
      .eq("event_id", selectedId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!active) return;
        setRegistrations(data ?? []);
        setRegsLoadedFor(selectedId);
      });
    return () => {
      active = false;
    };
  }, [selectedId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return registrations.filter(
      (r) =>
        (statusFilter === "todos" || r.status === statusFilter) &&
        (!q || [r.full_name, r.email, r.company ?? ""].some((v) => v.toLowerCase().includes(q))),
    );
  }, [registrations, search, statusFilter]);

  const stats = useMemo(() => {
    const count = (s: RegistrationStatus) => registrations.filter((r) => r.status === s).length;
    return {
      total: registrations.length,
      pendiente: count("pendiente"),
      confirmado: count("confirmado"),
      asistio: count("asistio"),
      cancelado: count("cancelado"),
    };
  }, [registrations]);

  // --- Acciones ---
  async function createEvent(form: { name: string; starts_at: string; venue: string; description: string; capacity: string }) {
    const slug = `${slugify(form.name)}-${Math.random().toString(36).slice(2, 6)}`;
    const { data, error } = await supabase
      .from("events")
      .insert({
        name: form.name.trim(),
        slug,
        starts_at: form.starts_at || null,
        venue: form.venue.trim() || null,
        description: form.description.trim() || null,
        capacity: form.capacity ? Number(form.capacity) : null,
      })
      .select()
      .single();
    if (error) return notify(`Error al crear el evento: ${error.message}`);
    setEvents((prev) => [data, ...prev]);
    setSelectedId(data.id);
    setShowEventForm(false);
    notify("Evento creado");
  }

  async function saveRegistration(form: RegistrationForm) {
    if (!selectedId) return;
    const payload = {
      full_name: form.full_name.trim(),
      email: form.email.trim().toLowerCase(),
      company: form.company.trim() || null,
      job_title: form.job_title.trim() || null,
      phone: form.phone.trim() || null,
      ticket_type: form.ticket_type,
      status: form.status,
      notes: form.notes.trim() || null,
    };

    if (form.id) {
      const { data, error } = await supabase.from("registrations").update(payload).eq("id", form.id).select().single();
      if (error) return notify(friendlyError(error.code, error.message));
      setRegistrations((prev) => prev.map((r) => (r.id === data.id ? data : r)));
      notify("Inscripción actualizada");
    } else {
      // Alta manual desde el panel: se crea como pendiente (regla RLS) y luego se aplica el estado elegido.
      const { data, error } = await supabase
        .from("registrations")
        .insert({ ...payload, status: "pendiente", event_id: selectedId })
        .select()
        .single();
      if (error) return notify(friendlyError(error.code, error.message));
      let created = data as Registration;
      if (form.status !== "pendiente") {
        const res = await supabase.from("registrations").update({ status: form.status }).eq("id", created.id).select().single();
        if (res.data) created = res.data;
      }
      setRegistrations((prev) => [created, ...prev]);
      notify("Inscripción registrada");
    }
    setEditing(null);
  }

  async function changeStatus(reg: Registration, status: RegistrationStatus) {
    const { data, error } = await supabase.from("registrations").update({ status }).eq("id", reg.id).select().single();
    if (error) return notify(`Error: ${error.message}`);
    setRegistrations((prev) => prev.map((r) => (r.id === data.id ? data : r)));
    notify(`Estado cambiado a ${STATUS_LABEL[status]}`);
  }

  async function deleteRegistration(id: string) {
    const { error } = await supabase.from("registrations").delete().eq("id", id);
    setConfirmDeleteId(null);
    if (error) return notify(`Error: ${error.message}`);
    setRegistrations((prev) => prev.filter((r) => r.id !== id));
    notify("Inscripción eliminada");
  }

  async function generateMessage(reg: Registration) {
    setAiState({ reg, loading: true });
    const { data } = await supabase.auth.getSession();
    try {
      const res = await fetch("/api/ai/confirmation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.session?.access_token ?? ""}`,
        },
        body: JSON.stringify({ registrationId: reg.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error desconocido");
      setAiState({ reg, loading: false, text: json.message, source: json.source });
      setRegistrations((prev) => prev.map((r) => (r.id === reg.id ? { ...r, ai_message: json.message } : r)));
    } catch (err) {
      setAiState({ reg, loading: false, error: (err as Error).message });
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/");
  }

  if (!user) {
    return <main className="flex flex-1 items-center justify-center text-slate-500">Cargando...</main>;
  }

  const publicUrl = selectedEvent && typeof window !== "undefined" ? `${window.location.origin}/e/${selectedEvent.slug}` : "";

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="text-lg font-bold text-violet-700">
            Evento<span className="text-slate-900">Pro</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-slate-500 sm:inline">{user.email}</span>
            <button className="btn-secondary" onClick={signOut}>
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        {/* Selector de evento */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Panel de inscripciones</h1>
            {events.length > 0 && (
              <select
                className="input mt-2 max-w-md"
                value={selectedId ?? ""}
                onChange={(e) => setSelectedId(e.target.value)}
                aria-label="Evento"
              >
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <button className="btn-secondary" onClick={() => setShowEventForm((v) => !v)}>
            {showEventForm ? "Cerrar" : "+ Nuevo evento"}
          </button>
        </div>

        {showEventForm && <EventForm onSubmit={createEvent} isFirst={events.length === 0} />}

        {selectedEvent && (
          <>
            <section className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold">{selectedEvent.name}</p>
                  <p className="text-sm text-slate-500">
                    {formatDate(selectedEvent.starts_at)}
                    {selectedEvent.venue ? ` · ${selectedEvent.venue}` : ""}
                    {selectedEvent.capacity ? ` · Aforo ${selectedEvent.capacity}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a href={`/e/${selectedEvent.slug}`} target="_blank" className="btn-secondary">
                    Ver página pública
                  </a>
                  <button
                    className="btn-secondary"
                    onClick={() => navigator.clipboard.writeText(publicUrl).then(() => notify("Enlace copiado"))}
                  >
                    Copiar enlace
                  </button>
                </div>
              </div>
            </section>

            {/* Metricas */}
            <section className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
              <Stat label="Total" value={stats.total} sub={selectedEvent.capacity ? `de ${selectedEvent.capacity}` : undefined} />
              <Stat label="Pendientes" value={stats.pendiente} />
              <Stat label="Confirmados" value={stats.confirmado} />
              <Stat label="Asistieron" value={stats.asistio} />
              <Stat label="Cancelados" value={stats.cancelado} />
            </section>

            {/* Filtros */}
            <section className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                className="input sm:max-w-xs"
                placeholder="Buscar por nombre, correo o empresa"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select
                className="input sm:max-w-[180px]"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as RegistrationStatus | "todos")}
                aria-label="Filtrar por estado"
              >
                <option value="todos">Todos los estados</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
              <button className="btn-primary sm:ml-auto" onClick={() => setEditing({ ...emptyRegistration })}>
                + Registrar asistente
              </button>
            </section>

            {/* Listado */}
            <section className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
              {loadingRegs ? (
                <p className="p-6 text-center text-slate-500">Cargando inscripciones...</p>
              ) : filtered.length === 0 ? (
                <p className="p-6 text-center text-slate-500">
                  {registrations.length === 0
                    ? "Aún no hay inscripciones. Comparte el enlace público o registra un asistente."
                    : "Ninguna inscripción coincide con el filtro."}
                </p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {filtered.map((r) => (
                    <li key={r.id} className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">
                          {r.full_name}{" "}
                          <span className="ml-1 rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                            {TICKET_LABEL[r.ticket_type]}
                          </span>
                        </p>
                        <p className="truncate text-sm text-slate-500">
                          {r.email}
                          {r.company ? ` · ${r.company}` : ""}
                          {r.job_title ? ` · ${r.job_title}` : ""}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          className={`rounded-full border-0 px-3 py-1 text-xs font-semibold ${STATUS_STYLE[r.status]}`}
                          value={r.status}
                          onChange={(e) => changeStatus(r, e.target.value as RegistrationStatus)}
                          aria-label={`Estado de ${r.full_name}`}
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {STATUS_LABEL[s]}
                            </option>
                          ))}
                        </select>
                        <button className="btn-secondary !px-3 !py-1 text-xs" onClick={() => generateMessage(r)}>
                          ✨ Correo IA
                        </button>
                        <button
                          className="btn-secondary !px-3 !py-1 text-xs"
                          onClick={() =>
                            setEditing({
                              id: r.id,
                              full_name: r.full_name,
                              email: r.email,
                              company: r.company ?? "",
                              job_title: r.job_title ?? "",
                              phone: r.phone ?? "",
                              ticket_type: r.ticket_type,
                              status: r.status,
                              notes: r.notes ?? "",
                            })
                          }
                        >
                          Editar
                        </button>
                        {confirmDeleteId === r.id ? (
                          <span className="flex gap-1">
                            <button
                              className="rounded-lg bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700"
                              onClick={() => deleteRegistration(r.id)}
                            >
                              Confirmar
                            </button>
                            <button className="btn-secondary !px-3 !py-1 text-xs" onClick={() => setConfirmDeleteId(null)}>
                              No
                            </button>
                          </span>
                        ) : (
                          <button
                            className="rounded-lg border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                            onClick={() => setConfirmDeleteId(r.id)}
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </main>

      {editing && (
        <RegistrationModal initial={editing} onCancel={() => setEditing(null)} onSave={saveRegistration} />
      )}

      {aiState && (
        <Modal title={`Correo para ${aiState.reg.full_name}`} onClose={() => setAiState(null)}>
          {aiState.loading ? (
            <p className="text-slate-500">Generando con IA...</p>
          ) : aiState.error ? (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{aiState.error}</p>
          ) : (
            <>
              <p className="mb-2 text-xs text-slate-500">
                {aiState.source === "gemini" ? "Generado con Gemini" : "Generado con plantilla (IA no configurada o no disponible)"}
              </p>
              <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-4 font-sans text-sm text-slate-800">
                {aiState.text}
              </pre>
              <div className="mt-4 flex justify-end gap-2">
                <button className="btn-secondary" onClick={() => generateMessage(aiState.reg)}>
                  Regenerar
                </button>
                <button
                  className="btn-primary"
                  onClick={() => navigator.clipboard.writeText(aiState.text ?? "").then(() => notify("Correo copiado"))}
                >
                  Copiar
                </button>
              </div>
            </>
          )}
        </Modal>
      )}

      {toast && (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

function friendlyError(code: string | undefined, message: string) {
  if (code === "23505") return "Ese correo ya está inscrito en este evento.";
  if (code === "23514") return "Revisa los datos: hay un campo con formato inválido.";
  return `Error: ${message}`;
}

function Stat({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">
        {value} {sub && <span className="text-sm font-normal text-slate-500">{sub}</span>}
      </p>
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-lg font-bold">{title}</h2>
          <button className="text-slate-400 hover:text-slate-700" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function RegistrationModal({
  initial,
  onCancel,
  onSave,
}: {
  initial: RegistrationForm;
  onCancel: () => void;
  onSave: (form: RegistrationForm) => Promise<void>;
}) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const set = (field: keyof RegistrationForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [field]: e.target.value });

  return (
    <Modal title={initial.id ? "Editar inscripción" : "Registrar asistente"} onClose={onCancel}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setSaving(true);
          await onSave(form);
          setSaving(false);
        }}
        className="grid gap-3 sm:grid-cols-2"
      >
        <label className="block text-sm font-medium sm:col-span-2">
          Nombre completo *
          <input required minLength={2} className="input mt-1" value={form.full_name} onChange={set("full_name")} />
        </label>
        <label className="block text-sm font-medium">
          Correo *
          <input type="email" required className="input mt-1" value={form.email} onChange={set("email")} />
        </label>
        <label className="block text-sm font-medium">
          Teléfono
          <input className="input mt-1" value={form.phone} onChange={set("phone")} />
        </label>
        <label className="block text-sm font-medium">
          Empresa
          <input className="input mt-1" value={form.company} onChange={set("company")} />
        </label>
        <label className="block text-sm font-medium">
          Cargo
          <input className="input mt-1" value={form.job_title} onChange={set("job_title")} />
        </label>
        <label className="block text-sm font-medium">
          Entrada
          <select className="input mt-1" value={form.ticket_type} onChange={set("ticket_type")}>
            {(Object.keys(TICKET_LABEL) as TicketType[]).map((t) => (
              <option key={t} value={t}>
                {TICKET_LABEL[t]}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium">
          Estado
          <select className="input mt-1" value={form.status} onChange={set("status")}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium sm:col-span-2">
          Notas internas
          <textarea rows={2} className="input mt-1" value={form.notes} onChange={set("notes")} />
        </label>
        <div className="mt-2 flex justify-end gap-2 sm:col-span-2">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function EventForm({
  onSubmit,
  isFirst,
}: {
  onSubmit: (form: { name: string; starts_at: string; venue: string; description: string; capacity: string }) => Promise<void>;
  isFirst: boolean;
}) {
  const [form, setForm] = useState({ name: "", starts_at: "", venue: "", description: "", capacity: "" });
  const [saving, setSaving] = useState(false);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        await onSubmit(form);
        setSaving(false);
      }}
      className="mt-4 grid gap-3 rounded-xl border border-violet-200 bg-violet-50/50 p-4 sm:grid-cols-2"
    >
      <p className="font-semibold sm:col-span-2">
        {isFirst ? "Crea tu primer evento para empezar a recibir inscripciones" : "Nuevo evento"}
      </p>
      <label className="block text-sm font-medium sm:col-span-2">
        Nombre del evento *
        <input
          required
          minLength={3}
          maxLength={120}
          className="input mt-1"
          placeholder="Ej. Congreso de Innovación Empresarial 2026"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </label>
      <label className="block text-sm font-medium">
        Fecha
        <input type="date" className="input mt-1" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
      </label>
      <label className="block text-sm font-medium">
        Aforo
        <input type="number" min={1} className="input mt-1" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
      </label>
      <label className="block text-sm font-medium sm:col-span-2">
        Lugar
        <input className="input mt-1" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} />
      </label>
      <label className="block text-sm font-medium sm:col-span-2">
        Descripción
        <textarea rows={2} className="input mt-1" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </label>
      <div className="sm:col-span-2">
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Creando..." : "Crear evento"}
        </button>
      </div>
    </form>
  );
}
