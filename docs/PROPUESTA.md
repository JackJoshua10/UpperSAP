# EventoPro — Propuesta de Micro SaaS B2B

## 1. Nombre
**EventoPro**: gestión de inscripciones para congresos y eventos corporativos.

## 2. Problema que resuelve
Las organizaciones que realizan congresos (gremios, asociaciones, sociedades de gestión, universidades, empresas) gestionan las inscripciones con formularios sueltos, hojas de Excel y mensajes de WhatsApp. Esto provoca:
- No saber cuántos asistentes están realmente confirmados frente al aforo.
- Correos de confirmación redactados a mano, con demoras y errores.
- Falta de control de asistencia el día del evento, lo que impide medir resultados y rendir cuentas a sponsors.

**Origen de la idea:** desarrollé la landing del *I Congreso de la Industria Musical en el Perú*. Ahí vi que la página informativa resolvía la difusión, pero la gestión de inscritos seguía siendo manual. EventoPro es el producto que faltaba detrás de esa landing.

## 3. Usuario objetivo
- **Cliente (paga):** el equipo organizador de eventos de una institución o empresa.
- **Usuario final:** el asistente que se inscribe desde la página pública del evento.

## 4. Funcionalidad principal del MVP
1. Landing del producto.
2. Registro e inicio de sesión del organizador.
3. Creación de eventos con su enlace público de inscripción (`/e/<slug>`).
4. Formulario público de inscripción.
5. Panel del organizador:
   - listar, buscar y filtrar inscritos
   - cambiar su estado (Pendiente → Confirmado → Asistió / Cancelado)
   - editarlos, eliminarlos y registrarlos manualmente
   - ver métricas por estado y aforo
6. Correo de confirmación generado con IA.

## 5. Datos que se guardan
- `events`: organizador, nombre, slug, descripción, lugar, fecha y aforo.
- `registrations`: evento, nombre, correo, empresa, cargo, teléfono, tipo de entrada, estado, notas internas, mensaje generado por IA y fechas de creación y actualización.

## 6. Uso de IA en el producto
- **MVP:** Gemini redacta un correo de confirmación personalizado según el estado de la inscripción, la empresa y el cargo del asistente, y los datos del evento. Si la IA no está disponible, se usa una plantilla.
- **Evolución:**
  - resumen ejecutivo post-evento para sponsors
  - detección de inscripciones duplicadas o sospechosas
  - segmentación de asistentes por sector o cargo
  - asistente que responde preguntas frecuentes del evento

## 7. Monetización
| Plan | Precio | Incluye |
|---|---|---|
| Starter | Gratis | 1 evento activo, hasta 100 inscritos |
| Pro | US$ 29/mes | Eventos ilimitados, 2,000 inscritos, IA |
| Enterprise | A medida | Multi-equipo, marca blanca, integraciones ERP/CRM (ej. SAP Business One para facturar entradas y patrocinios) |

Ingreso adicional futuro: comisión por la venta de entradas pagadas.

## 8. Qué falta para llevarlo a producción
- Envío real de correos (Resend o SendGrid) y dominio propio.
- Pagos de entradas (Culqi, Mercado Pago o Stripe).
- Check-in con código QR el día del evento y certificados de asistencia.
- Organizaciones con varios miembros y roles (admin, acreditador).
- Módulo de patrocinadores con un pipeline comercial y propuestas generadas con IA.
- Límites por plan, facturación y protección anti-spam en el formulario público (captcha o rate limit).
- Tests automatizados, monitoreo (Sentry), backups y cumplimiento de la Ley N° 29733 de protección de datos personales.
