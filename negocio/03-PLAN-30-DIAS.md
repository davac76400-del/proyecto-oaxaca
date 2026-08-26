# Plan de 30 días — 26 de agosto a 26 de septiembre de 2026

## La premisa que cambia todo

Tu plan original: un mes investigando y descargando, arrancar el día 31.

Este plan: **el mes de estudio y el mes de construcción son el mismo mes.** Cuando
llegue la Mac, no arrancas — migras una operación que ya está viva y facturando.

Por qué (largo en `00-EVALUACION-CRITICA.md` § 3, Error 1; corto aquí):

- El chatbot, n8n y la web corren en un **VPS de ~200 MXN/mes**, no en tu
  computadora. La Mac no cambia si funcionan o no.
- **La verificación de WhatsApp con Meta tarda de 1 a 3 semanas** y el reloj no lo
  controlas tú. Si la arrancas el día 31, tu primer mensaje real sale a mediados de
  octubre. Si la arrancas mañana, sale a mediados de septiembre.

Es mes y medio de diferencia por hacer una llamada esta semana.

## Ritmo diario

```
2 h  ESTUDIO       lo que necesitas para lo de hoy, no "aprender IA en general"
4 h  CONSTRUCCIÓN  sobre el hotel real, con datos reales
1 h  VENTA/ADMIN   contrato, prospecto, factura, bitácora
```

**Regla:** la hora de venta/admin no se salta nunca, ni cuando estés emocionado
programando. Es la que separa un proyecto de un negocio.

---

## SEMANA 1 (26 ago – 1 sep) — Encender relojes ajenos

**Objetivo: que todo lo que no depende de ti ya esté corriendo.**

| Día | Construcción | Estudio |
|---|---|---|
| Mar 26 | Contratar VPS Hostinger KVM 2. Endurecer SSH, UFW, usuario sin root. Instalar Coolify. | Coolify: conceptos, despliegue, SSL automático |
| Mié 27 | Comprar dominio de tu marca. Correo profesional. Cloudflare enfrente del dominio. | DNS, Cloudflare, registros MX |
| Jue 28 | **Meta Business Manager.** Iniciar verificación del hotel. Juntar documentos con tu tía. | WhatsApp Cloud API: categorías de plantilla, ventana de 24 h, precios en México |
| Vie 29 | Desplegar n8n + Chatwoot + Postgres en Coolify. Que respondan por HTTPS. | n8n: nodos, credenciales, webhooks |
| Sáb 30 | **Reunión con tu tía.** Contrato de una cuartilla. Precio. Anticipo. Medir el "antes". | — |
| Dom 31 | Descanso o laboratorio | — |
| Lun 1 | Uptime Kuma + respaldos con restic. Alta en SAT / cuenta del negocio. | Régimen fiscal, RESICO, facturación |

**Sobre el sábado 30 — la reunión.** No vayas a "explicarle lo que vas a hacer". Ve
con tres cosas: un precio, un contrato de una cuartilla, y una libreta para anotar
los números de *antes*. Cóbrale aunque sea la mitad (`00-EVALUACION-CRITICA.md`
§ 3, Error 5).

Los números del "antes" que tienes que salir con ellos anotados:
- ¿Cuántas reservas al mes y cuántas llegan por Booking/Expedia?
- ¿Qué comisión les paga exactamente?
- ¿Cuántos mensajes de WhatsApp recibe al día y cuántos quedan sin contestar?
- ¿Cuál es su tarifa promedio y su ocupación?
- ¿Cuánto vende de extras (tours, desayunos, late check-out)?

**Sin estos cinco números no hay caso de éxito, y sin caso de éxito no hay cliente
dos.** Es el entregable más importante de la semana, más que cualquier servidor.

✅ **Criterio de éxito de la semana:** VPS vivo, verificación de Meta en trámite,
contrato firmado, anticipo cobrado, cinco números anotados.

---

## SEMANA 2 (2 – 8 sep) — El primer producto real

**Objetivo: recepcionista IA del Arcozodi funcionando de punta a punta.**

| Día | Construcción | Estudio |
|---|---|---|
| Mar 2 | Juntar la base de conocimiento: tarifas, cuartos, políticas, FAQ, cómo llegar, cancelaciones | RAG: fragmentación, embeddings, pgvector |
| Mié 3 | Ingesta a pgvector. Primeras respuestas correctas del bot. | Ingeniería de contexto para bots de atención |
| Jue 4 | Flujo n8n: WhatsApp → contexto → modelo → respuesta. Traspaso a humano en Chatwoot. | n8n: manejo de errores, reintentos, colas |
| Vie 5 | Multilingüe ES/EN/FR. Mandar plantillas a aprobación de Meta. | Políticas de plantillas de Meta |
| Sáb 6 | **Pruebas con personas reales.** Que tu familia y amigos le escriban e intenten romperlo. | — |
| Dom 7 | Descanso | — |
| Lun 8 | Corregir todo lo que rompieron. Exportar el flujo a `workflows-plantilla/`. | — |

**El sábado 6 no es opcional.** Un bot que solo probaste tú es un bot sin probar.
Pídeles específicamente que intenten confundirlo, que escriban con faltas de
ortografía, que pregunten cosas fuera de tema, que se enojen. Ahí es donde vas a
encontrar lo que se rompe frente a un huésped real.

✅ **Criterio de éxito:** un huésped real puede escribirle al hotel a las 2 a.m. y
recibir una respuesta correcta, en su idioma, con salida a humano cuando se atora.

---

## SEMANA 3 (9 – 15 sep) — La capa que genera dinero

**Objetivo: que el sistema deje de ahorrar minutos y empiece a generar pesos.**

| Día | Construcción | Estudio |
|---|---|---|
| Mar 9 | Captura de reserva directa: disponibilidad, cotización, apartado | Motores de reserva, integración con el PMS del hotel |
| Mié 10 | Link de pago y confirmación automática | Stripe / Mercado Pago / Conekta: comisiones reales en México |
| Jue 11 | **Upsell pre-estancia (A3).** 48 h antes: late check-out, tours, temazcal, mezcal. | Redacción persuasiva breve para WhatsApp |
| Vie 12 | Web rápida del hotel en Astro, con GEO base | Astro, rendimiento, Core Web Vitals |
| Sáb 13 | Schema.org Hotel + llms.txt + Google Business Profile | GEO: datos estructurados, rastreadores de IA |
| Dom 14 | Descanso | — |
| Lun 15 | Panel del dueño (C3) + resumen de lunes por WhatsApp | Metabase |

**El jueves 11 es el día más importante del mes.** El upsell es lo primero que le
va a meter dinero *nuevo* a tu tía, se ve en 30 días, y es lo que ella va a contar
en la próxima comida del gremio. Es tu caso de éxito. Trátalo así.

✅ **Criterio de éxito:** el hotel puede recibir una reserva directa completa por
WhatsApp, cobrada, sin que nadie del hotel intervenga.

---

## SEMANA 4 (16 – 22 sep) — Empaquetar y vender

**Objetivo: convertir "lo que le hice al hotel de mi tía" en un producto repetible
con precio.**

| Día | Construcción | Estudio |
|---|---|---|
| Mar 16 | Parametrizar todo: quitar lo específico del Arcozodi, dejar plantilla | — |
| Mié 17 | Escribir skills `cotizador-oaxaca` y `alta-cliente` | `/skill-creator` |
| Jue 18 | Escribir skills `bot-hotel` y `reporte-mensual` | — |
| Vie 19 | **Medir resultados del Arcozodi.** Antes vs. después, con números. | — |
| Sáb 20 | Caso de éxito de una cuartilla + presentación de 10 diapositivas | — |
| Dom 21 | Descanso | — |
| Lun 22 | **Vender.** Tres prospectos que no sean familia. | — |

**El lunes 22 es la prueba de fuego de todo el mes.** Si llegas a ese día sin nada
que enseñar, el problema no fue técnico.

De dónde salen esos tres prospectos, en orden de facilidad:
1. Los contactos del gremio de tu tía — que te presente, no que te recomiende por
   mensaje. Que te lleve.
2. La asociación de hoteleros y la CANIRAC. Una reunión con el presidente de una
   cámara vale por cincuenta llamadas en frío.
3. Los hoteles y restaurantes del centro donde ya te conocen de vista.

✅ **Criterio de éxito:** caso de éxito con números reales, y tres conversaciones
de venta iniciadas con gente que no comparte tu apellido.

---

## SEMANA 5 (23 – 29 sep) — Recibir la Mac sin perder el paso

| Día | Qué |
|---|---|
| Mar 23 – Jue 25 | Cerrar pendientes. Documentar el `CLAUDE.md` de cada cliente. Runbooks. |
| Vie 26 | **Llega la Mac.** Seguir `04-MIGRACION-MAC-DIA-1.md`. Migración, no reinicio. |
| Sáb 27 – Dom 28 | Verificar que todo sigue vivo desde la máquina nueva |
| Lun 29 | Primer día operando desde la Mac, con clientes ya corriendo |

---

## Sobre abandonar todas tus cuentas

Dijiste que el día uno abandonas Gemini, Claude y correos, y creas un ecosistema
limpio desde cero.

**La intención es correcta. El momento está mal.**

Lo que se pierde si esperas al día 31: el historial de trabajo del mes, la memoria
acumulada de tus proyectos, y —lo importante— **un mes de correos y trámites hechos
desde una cuenta que después vas a abandonar.** El alta de Meta Business, el
dominio, el VPS, el SAT: todo eso queda amarrado a una cuenta que dijiste que ibas
a tirar. Migrar la propiedad de una cuenta de Meta Business después no es trivial.

**Hazlo al revés, y hazlo esta semana:**

1. Compra el dominio **hoy** (miércoles 27, ya está en el plan).
2. Crea el correo profesional en ese dominio **hoy**.
3. **Todo lo del mes se da de alta con esa identidad**: VPS, Meta, Cloudflare,
   Stripe, GitHub, SAT.
4. La Mac llega y solo inicias sesión. Cero migraciones, cero cuentas huérfanas.

El ecosistema limpio lo empiezas hoy, no el día 31. Y así el trabajo del mes nace
ya en el lugar correcto.

---

## Cómo saber si el mes salió bien

Al 26 de septiembre, marca lo que sí:

- [ ] VPS operando con Coolify, n8n, Chatwoot y monitoreo
- [ ] WhatsApp Cloud API **oficial** verificado y funcionando
- [ ] Hotel Arcozodi con bot vivo atendiendo huéspedes reales
- [ ] Reserva directa por WhatsApp completada de punta a punta, cobrada
- [ ] Upsell pre-estancia generando ingreso medible
- [ ] Web rápida publicada con GEO base
- [ ] **Contrato firmado y primera factura emitida**
- [ ] Caso de éxito con números antes/después
- [ ] 5 skills propios escritos y funcionando
- [ ] 3 prospectos no familiares en conversación
- [ ] Identidad profesional (dominio, correo, SAT, banco) desde el día 2

**Nueve o más: vas muy bien.**
**Seis a ocho: bien, con dos semanas de retraso recuperables.**
**Cinco o menos: párate y averigua qué te frenó, porque va a volver a frenarte en
octubre.**

Y el único que no es negociable, si tuvieras que elegir uno solo: **la primera
factura emitida.** Todo lo demás es preparación. Esa es la prueba de que existe un
negocio.
