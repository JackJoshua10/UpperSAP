"use client";

import { useState } from "react";
import { STATUSES, STATUS_LABEL, TICKET_LABEL, type RegistrationStatus, type TicketType } from "@/lib/types";
import { Modal } from "./Modal";

export type RegistrationForm = {
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

export const emptyRegistration: RegistrationForm = {
  full_name: "",
  email: "",
  company: "",
  job_title: "",
  phone: "",
  ticket_type: "general",
  status: "pendiente",
  notes: "",
};

type RegistrationModalProps = {
  initial: RegistrationForm;
  onCancel: () => void;
  onSave: (form: RegistrationForm) => Promise<void>;
};

/** Formulario para crear (sin id) o editar (con id) una inscripción. */
export function RegistrationModal({ initial, onCancel, onSave }: RegistrationModalProps) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);

  const set =
    (field: keyof RegistrationForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
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
