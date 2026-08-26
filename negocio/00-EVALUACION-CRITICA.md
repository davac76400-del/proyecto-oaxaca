# Evaluación crítica — sin filtro

**Para:** David Alfredo Romero Rendón
**Fecha:** 26 de agosto de 2026
**Modo:** Kill Critic. Aquí no hay porras. Las porras te las da tu familia; yo te
doy lo que te va a costar dinero si no lo ves.

---

## 1. La calificación

**Idea general: 6.5 / 10**
**Tu posición personal: 8.5 / 10**
**Tu plan de ejecución: 3 / 10**

Esa diferencia es todo el diagnóstico: **tienes una posición excelente y un plan
mediocre.** La mayoría de la gente tiene el problema inverso, y por eso la
mayoría de la gente no llega. Tú sí puedes llegar. Pero no con el plan que me
acabas de describir.

Desglose honesto:

| Componente | Nota | Por qué |
|---|---|---|
| Momento de mercado | 9/10 | La PyME mexicana apenas está despertando a la IA. Oaxaca tiene turismo de clase mundial y digitalización de los 2010s. Hay hueco real. |
| Acceso a primer cliente | 8/10 | Tener dónde instalar vale más que saber instalar. La mayoría muere aquí. Tú ya lo tienes. |
| Capacidad técnica demostrada | 7/10 | **No estás empezando.** Ya enviaste OaxIntegra IA: auth, RLS, fallback de 3 modelos, pruebas, bug tracker. Eso es más de lo que el 90% de tus futuros competidores locales ha hecho jamás. |
| Arquitectura propuesta | 5/10 | Sobre-apilada. Tres capas de IA donde caben una y media. Detalle abajo. |
| Modelo de precios | 3/10 | Costo-plus con "margen por desinformación". Te pone techo y te pone bomba de tiempo. Es el error más caro del documento. |
| Plan del mes | 2/10 | Vas a quemar 30 días esperando una computadora para hacer un trabajo que no necesita esa computadora. |
| Perfil de riesgo | 3/10 | Dependencia política + exposición legal + cliente único familiar. Tres puntos únicos de falla, y los tres son evitables. |

---

## 2. Probabilidad de éxito, con números

"Éxito" hay que definirlo o no significa nada. Tres escalones:

**A. Llegar a 30,000–50,000 MXN/mes recurrentes en 12 meses**
- Con tu plan tal cual: **35%**
- Corrigiendo los 5 errores de la sección 3: **70%**

**B. Agencia de 1.5–3 MDP/año en 3 años, con equipo de 3–5 personas**
- Con tu plan tal cual: **12%**
- Corrigiendo y con segundo cliente pagado antes de noviembre: **35%**

**C. Abandonar el proyecto en 18 meses**
- Con tu plan tal cual: **45%**

Y quiero que veas la causa de muerte más probable, porque no es la que esperas.
No es que no sepas programar. **Es esta secuencia:**

> Esperas el mes → instalas todo el día uno → te toma tres semanas más de lo que
> creías porque WhatsApp oficial tarda en verificarse → le instalas al hotel de
> tu tía → tu tía no te paga porque es tu tía → no tienes caso de éxito con
> factura ni testimonio creíble → no hay cliente dos → a los 5 meses regresas a
> depender del dinero de tus papás → el proyecto se vuelve un hobby.

Ese es el escenario del 45%. Todo lo que sigue está diseñado para matarlo.

---

## 3. Los cinco errores que tienes que corregir esta semana

### ERROR 1 — Estás usando la computadora como permiso para no empezar (el más caro)

Esto es lo más grave que dijiste, y lo dijiste sin darte cuenta.

Tu plan es: un mes investigando y descargando, y arrancar el día 31.

**Nada de lo que vas a vender corre en tu computadora.** El chatbot corre en un
servidor. n8n corre en un servidor. La web corre en un servidor. El VPS no sabe
ni le importa si le hablas desde una MacBook M4 Max o desde la máquina que tienes
hoy. Un VPS de Hostinger cuesta unos **150–250 MXN al mes**. Lo puedes contratar
hoy en veinte minutos.

Y hay algo peor, algo con plazo real: **dar de alta un número en WhatsApp Cloud
API oficial no es instantáneo.** Necesitas Meta Business Manager, verificación
del negocio (documentos fiscales del hotel, comprobante de domicilio), alta del
número, plantillas de mensaje aprobadas por Meta una por una. Entre trámite y
aprobaciones eso es de **una a tres semanas**, y buena parte del tiempo estás
esperando a Meta, no trabajando.

Si empiezas ese trámite el día 31, tu primer mensaje real sale a mediados de
octubre. Si lo empiezas **mañana**, sale a mediados de septiembre. Es el mismo
esfuerzo. Es mes y medio de diferencia. Es literalmente dinero gratis por
levantar el teléfono hoy.

**Corrección:** el mes de estudio y el mes de construcción son el mismo mes.
Contrata el VPS esta semana. Arranca la verificación de Meta esta semana. Que la
Mac llegue a una operación que ya está viva y facturando. La Mac es una mejora,
no un pistoletazo de salida.

### ERROR 2 — Tu fórmula de precios te pone techo y te pone una bomba

Tu fórmula es:

> costo del servidor + servicio + margen extra por la desinformación tecnológica del negocio

Dos problemas, uno de negocio y uno de supervivencia.

**El de negocio:** el costo-plus amarra tu ingreso a tus gastos. Si tu servidor
cuesta 200 pesos, tu conversación mental empieza en 200 pesos y negocias hacia
arriba desde ahí, a la defensiva. Cuando alguien te pregunte "¿por qué 6,000 si
el servidor cuesta 200?", no vas a tener respuesta, porque tú mismo pusiste el
costo del servidor como base del precio. Te estás encadenando a tu insumo más
barato.

**El de supervivencia:** un margen que depende de que el cliente *no sepa* es un
margen que se evapora el día que el cliente sepa. Y va a saber. Va a llegar el
sobrino que estudia sistemas, o va a preguntarle a ChatGPT cuánto cuesta un VPS,
y ChatGPT le va a decir la verdad en ocho segundos. Ese día no pierdes el margen:
pierdes al cliente, y pierdes lo que te vino a buscar aquí.

Piénsalo con tu propio plan. Tu estrategia entera es que tu tía **te recomiende**
con el gremio hotelero. Eso quiere decir que tu negocio corre sobre reputación en
un círculo cerrado donde todos se conocen y todos hablan entre ellos. En ese
mercado, un cliente que se siente visto la cara no se va callado: se lleva a
otros cinco. La desinformación es el activo más frágil sobre el que puedes
construir, y tú justo elegiste construir en el lugar donde más rápido se rompe.

**La corrección paga más, no menos.** Cambia la variable, no el número:

```
NO:  costo de servidor + servicio + margen por lo que el cliente ignora
SÍ:  costo real de infraestructura × 1.3   (buffer de sobreconsumo)
   + horas de soporte comprometidas × tu tarifa
   + 10–20% del valor económico que el sistema le genera o le ahorra al mes
```

Corre el número con el hotel. Un hotel de 20 cuartos, 60% de ocupación, tarifa
promedio 1,400 MXN, con 55% de sus reservas vía Booking/Expedia pagando ~17% de
comisión, paga cerca de **78,000 MXN al mes solo en comisión de OTAs**. Si le
mueves apenas el 15% de esas reservas a canal directo, le ahorras ~11,700 al mes.

Cobrarle 6,000 al mes por eso no es caro. **Es el mejor negocio que hará ese
hotel este año, y se lo puedes demostrar en una servilleta.** Ese precio sobrevive
a que el cliente sepa exactamente cuánto cuesta un VPS — de hecho *mejora* cuando
lo sabe, porque entiende que no te está pagando el servidor, te está pagando el
resultado.

Es el mismo dinero en tu bolsa. Con una diferencia: este se puede defender en voz
alta, se renueva cada año, y se puede subir cuando los resultados suben.

### ERROR 3 — Estás vendiendo chatbots. El dinero no está ahí

Un chatbot que contesta preguntas es un **centro de costo**: le ahorra minutos a
la recepcionista, y los minutos de la recepcionista no aparecen en ningún estado
de resultados que el dueño mire.

Un sistema que convierte una pregunta de WhatsApp en una **reserva directa** es
un centro de ingreso, y aparece en la primera línea del estado de resultados.

Es el mismo software. Es una conversación de venta completamente distinta, y es
la diferencia entre cobrar 1,500 y cobrar 8,000.

Regla para todo lo que diseñes de aquí en adelante: **si no puedes decir en una
frase cuánto dinero entra o cuánto sale, no es un producto, es una demo.**
Aplícasela a cada servicio del catálogo antes de cotizarlo.

### ERROR 4 — La arquitectura tiene una capa de más (y tú ya lo comprobaste)

Tu cadena es: Gemini te dicta → tú se lo dictas a OpenClaw → OpenClaw trabaja con
Claude Code.

Eso es un teléfono descompuesto con tres bocinas. Cada traspaso pierde contexto,
y ninguno agrega capacidad que no tenga la capa de abajo. Claude Code ya lee tu
repo, ya ejecuta, ya itera. Gemini dictando instrucciones a ciegas sobre un repo
que no está viendo produce instrucciones plausibles y equivocadas, y tú te
conviertes en el cable USB entre dos modelos.

Y esto no es teoría: **ya te pasó en este mismo proyecto.** En `logs/pendientes.md`
está escrito que sacaste n8n del chat de OaxIntegra IA y conectaste la IA directo,
porque la capa intermedia estorbaba. Tuviste razón esa vez. Es exactamente el
mismo error, un nivel más arriba.

**Arquitectura corregida:**

- **Claude Code** — motor único de desarrollo. Contexto del repo, ejecuta, itera.
  Aquí vive el trabajo.
- **Gemini** — segunda opinión y ventana larga. Métele el documento de 200 páginas,
  el PDF del SAT, la licitación completa, el manual del PMS del hotel. Que resuma
  y contraste. **Consultor, no intermediario.** Nunca en la cadena de ejecución.
- **OpenClaw** — operador, no traductor. Que corra tareas recurrentes y vigile
  cosas (revisar buzones, disparar rutinas, avisarte). No lo pongas a "recibir
  instrucciones de Gemini para pasárselas a Claude".
- **n8n** — el plomería del cliente, no la tuya. Ahí viven los flujos que se
  ejecutan en producción sin ti.
- **Hostinger** — un VPS, no hosting compartido. Con Coolify encima para
  administrar todo desde una pantalla.

Ganas velocidad, pierdes cero capacidad, y dejas de ser el cuello de botella de tu
propio stack.

### ERROR 5 — Tu cliente piloto es tu tía, y eso tiene un costo que no estás contando

El Hotel Arcozodi es un gran laboratorio. Es una **mala prueba social**, y hay que
separar las dos cosas.

Lo que pasa con clientes familiares, sin excepción:
- No te pagan, o te pagan tarde, o te pagan "cuando se pueda".
- No te reclaman cuando algo falla, así que nunca te enteras de qué está roto.
- Te piden cambios infinitos porque no hay contrato que diga dónde termina el
  alcance.
- Y el gremio descuenta el testimonio automáticamente: *"claro que habla bien de
  él, es su sobrino."*

**Corrección, y es innegociable:** cóbrale. Aunque sea 50% de tarifa. Aunque el
dinero regrese a la familia por otro lado. Necesitas **factura, contrato firmado y
números medidos antes/después**, porque eso es lo que vas a enseñarle al segundo
hotel, y el segundo hotel sí es un desconocido que sí te va a pagar completo.

Y ponte fecha: **cliente #2, que no sea familiar, con contrato firmado, antes del
15 de noviembre.** Si el 15 de noviembre solo tienes al hotel de tu tía, no tienes
un negocio: tienes un favor familiar con servidores.

---

## 4. Tres riesgos estructurales que tienes que ver de frente

Estos no son errores de ejecución, son riesgos de fondo. Los digo una vez, con
claridad, y sigo.

### El apalancamiento político es tu mayor activo y tu mayor pasivo

Vender tecnología a dependencias donde tus papás son funcionarios con influencia
no es una zona gris. En México lo aterrizan la **Ley General de Responsabilidades
Administrativas** (conflicto de interés y tráfico de influencias, incluido el
capítulo de faltas de particulares, que aplica sobre ti, no solo sobre ellos) y la
**LAASSP** en materia de contratación pública, que restringe contratar con
proveedores en los que un servidor público que interviene tiene interés personal,
familiar o de negocios. La consecuencia típica no es solo perder el contrato: es
inhabilitación para contratar con el Estado, multa, y expediente en el Órgano
Interno de Control — para ti y para ellos.

No te lo digo como sermón. Te lo digo porque es **el escenario que borra el
negocio completo de un día para otro**, y porque tú lo escribiste como si fuera
una ventaja limpia. La ventaja real de tus papás no son los contratos: es el
capital paciente y el acceso a puertas. Eso vale muchísimo y no te expone a nada.

**El camino que sí aguanta:** construye el negocio privado primero — hoteles,
restaurantes, turismo. Cuando quieras ir a gobierno, ve por licitación abierta, a
dependencias donde nadie de tu familia decide, con expediente limpio y track
record privado que hable por ti. Es más lento y es el único que no te puede
explotar en la cara. Y honestamente: si en dos años tienes 20 hoteles con números
demostrables, no vas a necesitar el apellido.

### El número de los 100,000 pesos diarios no cuadra, y eso te afecta comercialmente

100,000 pesos al día son ~36.5 millones al año. Ningún sueldo de gobierno en
México paga eso — ni de lejos, ni sumando dos.

No me interesa de dónde sale. Me interesa una consecuencia práctica que te va a
pegar: **el capital que no se puede documentar no se puede usar como capital de
negocio.** No sirve para pedir un crédito PyME (el banco pide comprobantes de
ingreso), no sirve para levantar inversión (due diligence lo revienta en la
primera semana), y si algún día compites por un contrato público, el origen del
capital es exactamente lo que se revisa.

Sepáralo desde hoy: cuenta bancaria del negocio, aparte. Alta en el SAT como
persona física con actividad empresarial (RESICO si calificas). Factura todo,
aunque sean 500 pesos. **Tu negocio necesita su propia historia financiera
verificable**, y esa historia empieza con la primera factura que emitas — ojalá
esta semana, ojalá a tu tía.

### Eres un solo punto de falla, y estás vendiendo 24/7

Vender "chatbot 24/7" significa que te comprometiste a que funcione a las 3 de la
mañana del 31 de diciembre. Con 3 clientes lo aguantas. Con 15 clientes y sin
monitoreo, plantillas ni respaldos, un martes cualquiera se te caen tres bots al
mismo tiempo y no tienes idea de cuál se rompió primero.

Por eso el árbol de carpetas trae `06_INFRAESTRUCTURA/monitoreo` y `runbooks`
desde el día uno, y no como algo "para después". Uptime Kuma y un runbook por
servicio son dos horas de trabajo que te compran la posibilidad de dormir.

---

## 5. Lo que sí tienes, y que no estás valorando

Terminé de pegar. Ahora lo real, porque también sería deshonesto no decirlo:

1. **Ya enviaste software funcionando.** OaxIntegra IA tiene autenticación, RLS en
   Supabase, migraciones versionadas, fallback de tres modelos, pruebas
   automatizadas y un bug tracker con 13 bugs documentados y resueltos. Eso no lo
   tiene un principiante. Eso lo tiene alguien que ya terminó cosas, y terminar es
   la habilidad rara.

2. **Escribes para humanos.** Tu documentación dice "escríbele" en vez de "prompt".
   Suena a detalle estético; es tu mejor ventaja competitiva. Vas a vender a
   señores de 55 años dueños de restaurantes que odian sentirse tontos. El que
   les hable claro se queda con el mercado. Ya sabes hacer eso y ya lo demostraste.

3. **Tienes distribución.** Es lo más escaso. Miles de personas saben montar un
   chatbot; casi ninguna tiene dónde instalarlo el lunes.

4. **Tienes pista.** El respaldo familiar significa que puedes cobrar precios
   correctos en vez de precios de hambre, y aguantar los 6 meses que tarda un
   negocio de servicios en despegar. Es una ventaja enorme — úsala para tener
   paciencia, no para tardarte.

5. **Oaxaca es un mercado de nicho defendible.** Guelaguetza, Día de Muertos, Noche
   de Rábanos, temporada alta de diciembre. Nadie en Ciudad de México va a
   construir un motor de tarifas que entienda que la Noche de Rábanos mueve la
   ocupación del centro histórico. Tú sí. Los datos locales son foso.

---

## 6. Un punto ciego estratégico: estás confundiendo dos negocios

Esto no lo preguntaste y es lo más importante que te voy a decir sobre estrategia.

**OaxIntegra IA no es tu negocio. Es tu portafolio y tu carta política.**

Su público son artesanos, mezcaleros y cocineros tradicionales. Es un público
hermoso, es genuinamente útil, y **no tiene dinero para pagarte una mensualidad.**
Como negocio comercial vale poco; como demostración de capacidad ante una
dependencia, una fundación o una cámara empresarial, vale muchísimo.

**Tu negocio es la agencia:** hoteles, restaurantes y turismo. Ahí hay presupuesto,
dolor medible en pesos, y renovación mensual.

No los mezcles y no los mates. Que la agencia financie a OaxIntegra IA, y que
OaxIntegra IA le dé a la agencia legitimidad y prensa. Pero el día que tengas que
elegir dónde poner ocho horas, **van a la agencia**, siempre, hasta que la agencia
pague tu sueldo completo.

Y hay una tercera cosa escondida aquí que casi nadie ve a tiempo, así que
subráyala: cuando tengas 12 o 15 hoteles instalados, vas a ser dueño de **datos
agregados de ocupación y tarifas de Oaxaca que hoy no existen en ningún lado.**
Ese es el activo con más valor de todo el plan — más que los chatbots, más que las
webs. Está en `05_DATOS_E_INTELIGENCIA/observatorio` y es a lo que deberías estar
apuntando desde el primer cliente, aunque tarde dos años en madurar.

---

## 7. Qué hacer el lunes en la mañana

En orden. Sin saltarte ninguno.

1. Contrata el VPS de Hostinger (KVM 2 alcanza para empezar). ~200 MXN.
2. Abre Meta Business Manager y arranca la verificación del hotel. Empieza el
   reloj que no controlas.
3. Compra el dominio de tu marca y monta el correo profesional. Úsalo desde hoy,
   no el día 31.
4. Siéntate con tu tía con un contrato de una cuartilla y un precio. Cóbrale.
5. Mide el "antes": cuántas reservas directas trae hoy, cuánto paga de comisión a
   OTAs, cuántos mensajes de WhatsApp deja sin contestar. **Sin el "antes" no hay
   caso de éxito, y sin caso de éxito no hay cliente dos.**

---

*Este documento existe para que en seis meses lo releas y compruebes cuáles de
estos riesgos evitaste. Anota las fechas.*
