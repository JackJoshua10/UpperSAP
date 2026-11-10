import Link from "next/link";

const problems = [
  {
    title: "Inscripciones dispersas",
    text: "Formularios sueltos, hojas de Excel y mensajes de WhatsApp. Nadie sabe cuántos asistentes están realmente confirmados.",
  },
  {
    title: "Confirmaciones manuales",
    text: "El equipo redacta cada correo de confirmación a mano, con errores y demoras justo antes del evento.",
  },
  {
    title: "Sin control el día del evento",
    text: "No hay un registro claro de quién asistió, lo que impide medir resultados y rendir cuentas a sponsors.",
  },
];

const features = [
  {
    title: "Página pública de inscripción",
    text: "Cada evento obtiene un enlace propio para que los asistentes se registren en segundos.",
  },
  {
    title: "Panel del organizador",
    text: "Lista, filtra y busca inscritos. Edita sus datos o elimínalos cuando sea necesario.",
  },
  {
    title: "Flujo de estados",
    text: "Pendiente → Confirmado → Asistió, o Cancelado. Métricas en tiempo real por evento.",
  },
  {
    title: "Confirmaciones con IA",
    text: "Gemini redacta un correo de confirmación personalizado según el asistente, su empresa y su entrada.",
  },
  {
    title: "Datos aislados por organización",
    text: "Seguridad a nivel de fila en Postgres: cada organizador solo ve las inscripciones de sus eventos.",
  },
  {
    title: "Responsive",
    text: "Funciona en el celular del equipo de acreditación el mismo día del evento.",
  },
];

const plans = [
  { name: "Starter", price: "Gratis", detail: "1 evento activo · hasta 100 inscritos" },
  { name: "Pro", price: "US$ 29/mes", detail: "Eventos ilimitados · 2,000 inscritos · IA incluida" },
  { name: "Enterprise", price: "A medida", detail: "Multi-equipo · marca blanca · integraciones (ERP / CRM)" },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="text-lg font-bold text-violet-700">
            Evento<span className="text-slate-900">Pro</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login" className="btn-secondary">
              Ingresar
            </Link>
            <Link href="/login?mode=signup" className="btn-primary hidden sm:inline-flex">
              Crear cuenta
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        <section className="bg-gradient-to-br from-violet-700 via-violet-600 to-fuchsia-600 text-white">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
            <p className="mb-4 inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
              Micro SaaS B2B para organizadores de eventos
            </p>
            <h1 className="max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl">
              Gestiona las inscripciones de tus congresos sin Excel ni formularios sueltos
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-violet-100">
              EventoPro centraliza el registro de asistentes, su confirmación y el control de
              asistencia. La IA redacta las confirmaciones por ti.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/login?mode=signup"
                className="rounded-lg bg-white px-5 py-3 font-semibold text-violet-700 hover:bg-violet-50"
              >
                Empezar gratis
              </Link>
              <a
                href="#como-funciona"
                className="rounded-lg border border-white/40 px-5 py-3 font-semibold hover:bg-white/10"
              >
                Cómo funciona
              </a>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-bold">El problema</h2>
          <p className="mt-2 max-w-3xl text-slate-600">
            Gremios, asociaciones, universidades y empresas organizan congresos con cientos de
            asistentes, pero la gestión de inscripciones sigue siendo manual.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {problems.map((p) => (
              <div key={p.title} className="rounded-xl border border-slate-200 bg-white p-5">
                <h3 className="font-semibold text-slate-900">{p.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{p.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="como-funciona" className="border-y border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <h2 className="text-2xl font-bold">Cómo funciona</h2>
            <ol className="mt-6 grid gap-4 md:grid-cols-3">
              {[
                "Crea tu evento y obtén su enlace público de inscripción.",
                "Los asistentes se registran; tú los ves al instante en tu panel.",
                "Confirma, genera el correo con IA y marca la asistencia el día del evento.",
              ].map((step, i) => (
                <li key={step} className="flex gap-3 rounded-xl bg-slate-50 p-5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-600 text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="text-sm text-slate-700">{step}</span>
                </li>
              ))}
            </ol>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <div key={f.title} className="rounded-xl border border-slate-200 p-5">
                  <h3 className="font-semibold text-violet-700">{f.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-bold">Planes</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {plans.map((p) => (
              <div key={p.name} className="rounded-xl border border-slate-200 bg-white p-6">
                <h3 className="font-semibold">{p.name}</h3>
                <p className="mt-2 text-2xl font-extrabold text-violet-700">{p.price}</p>
                <p className="mt-2 text-sm text-slate-600">{p.detail}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-500">
        EventoPro · MVP construido para el examen práctico de innovación SaaS
      </footer>
    </div>
  );
}
