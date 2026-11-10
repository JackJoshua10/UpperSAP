"use client";

import { useState } from "react";

export type EventFormValues = {
  name: string;
  starts_at: string;
  venue: string;
  description: string;
  capacity: string;
};

type EventFormProps = {
  onSubmit: (form: EventFormValues) => Promise<void>;
  isFirst: boolean;
};

export function EventForm({ onSubmit, isFirst }: EventFormProps) {
  const [form, setForm] = useState<EventFormValues>({ name: "", starts_at: "", venue: "", description: "", capacity: "" });
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
        <input
          type="date"
          className="input mt-1"
          value={form.starts_at}
          onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
        />
      </label>
      <label className="block text-sm font-medium">
        Aforo
        <input
          type="number"
          min={1}
          className="input mt-1"
          value={form.capacity}
          onChange={(e) => setForm({ ...form, capacity: e.target.value })}
        />
      </label>
      <label className="block text-sm font-medium sm:col-span-2">
        Lugar
        <input className="input mt-1" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} />
      </label>
      <label className="block text-sm font-medium sm:col-span-2">
        Descripción
        <textarea
          rows={2}
          className="input mt-1"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </label>
      <div className="sm:col-span-2">
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Creando..." : "Crear evento"}
        </button>
      </div>
    </form>
  );
}
