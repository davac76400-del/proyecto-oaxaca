# Catálogo de servicios y estructura de precios

**Mercado:** Oaxaca de Juárez y valles centrales. Hotelería boutique, restaurantes,
tour operadores, y sector cívico.
**Moneda:** MXN. Tipo de cambio de referencia: 18.5 MXN/USD.
**Vigencia de esta lista de precios:** revísala cada 6 meses.

---

## PARTE 1 — La fórmula de precios corregida

### Lo que estabas por hacer

```
Precio = costo del servidor + servicio + margen por desinformación del cliente
```

Está explicado en `00-EVALUACION-CRITICA.md` § 3, Error 2. Resumen: te amarra el
precio a tu insumo más barato, y el margen se cae el día que el cliente se entera.
En un mercado que corre por recomendación de boca en boca —que es exactamente el
tuyo— ese día te cuesta el cliente y los cinco que traía detrás.

### La fórmula que sí usas

```
MENSUALIDAD = (A) Infraestructura real × 1.3
            + (B) Horas de soporte comprometidas × tarifa hora
            + (C) 10–20% del valor económico mensual que generas o ahorras
```

- **(A) Infraestructura × 1.3** — el 1.3 es buffer real, no adorno: sobreconsumo de
  mensajes, un mes con más tráfico, subida de precio de Meta. Si no lo pones, esos
  meses los pagas tú.
- **(B) Soporte** — horas que te comprometes a tener disponibles, cambios menores,
  monitoreo. Se cobran estén o no usadas: estás vendiendo disponibilidad.
  Tarifa hora de arranque en Oaxaca: **500 MXN/hr**. A los 10 clientes, súbela a 700.
- **(C) Participación del valor** — aquí está tu ganancia real. Es defendible en voz
  alta, sube cuando los resultados suben, y sobrevive a que el cliente sepa cuánto
  cuesta un VPS.

### El costo real de infraestructura (memorízalo)

| Concepto | Costo real mensual MXN | Nota |
|---|---|---|
| Hostinger VPS KVM 2 (2 vCPU / 8 GB) | 200 – 330 | Aguanta 4–6 clientes chicos con Coolify |
| Hostinger VPS KVM 4 (4 vCPU / 16 GB) | 370 – 550 | Cuando pases de 6 clientes |
| Dominio .com | ~21 (250/año) | .mx cuesta ~2× |
| Cloudflare Free | 0 | El plan gratis te alcanza para casi todo |
| WhatsApp Cloud API — servicio | 0 | Ventana de atención de 24 h: no se cobra |
| WhatsApp Cloud API — plantilla utilidad | ~0.16 c/u | Confirmaciones, recordatorios |
| WhatsApp Cloud API — plantilla marketing | ~0.81 c/u | Promociones. Es la cara. |
| API de modelo (clase Haiku/mini) | 40 – 150 | ~500 conversaciones/mes |
| Supabase Free | 0 | Pro son ~460 cuando lo necesites |

**Stack típico de un hotel: 900 – 1,300 MXN/mes de costo real tuyo.**

Regla de reventa de mensajes: **no absorbas el costo variable de WhatsApp.**
Incluye una bolsa mensual (ej. 1,000 mensajes de utilidad + 500 de marketing) y
factura el excedente a 0.35 y 1.60 respectivamente. Eso sí es margen limpio y
explicable: le estás vendiendo el servicio de administrar ese consumo.

### La servilleta que cierra la venta

Tenla memorizada. Hotel de 20 cuartos:

```
20 cuartos × 60% ocupación × 30 días        = 360 noches/mes
360 noches × $1,400 tarifa promedio          = $504,000 de ingreso
55% llega por Booking/Expedia                = $277,200 vía OTA
Comisión OTA ~17%                            = $47,124 al mes que se van en comisión

Si le mueves solo el 15% de esas reservas a canal directo:
                                             = $7,068 MXN ahorrados AL MES
                                             = $84,816 al año
```

Tu mensualidad de $6,500 sale de ahí. **No le estás cobrando un servidor de 250
pesos: le estás cobrando el 8% de lo que le devuelves.** Y el cliente puede
verificar cada número de esa cuenta en su propio panel de Booking.

Ajusta las variables al hotel que tengas enfrente antes de la reunión. Que la
cuenta sea de él, no genérica.

---

## PARTE 2 — Los servicios

Cada uno trae: qué problema resuelve, instalación (pago único), mensualidad, costo
real tuyo y de dónde sale el precio.

> **Filtro obligatorio antes de cotizar cualquier cosa:** si no puedes decir en una
> frase cuánto dinero le entra o le deja de salir al cliente, no es un producto.
> Es una demo. No la cobres como producto.

---

### BLOQUE A — HOTELES

#### A1. Motor de Reserva Directa por WhatsApp ⭐ EL PRODUCTO ANCLA

**Problema:** el hotel paga 15–22% de comisión a Booking y Expedia por reservas
que muchas veces ya lo conocían. Y cuando alguien pregunta directo por WhatsApp a
las 11 de la noche, nadie contesta hasta las 9 de la mañana — para entonces ya
reservó en otro lado.

**Qué hace:** atiende 24/7, consulta disponibilidad real, cotiza, arma la reserva,
cobra anticipo con link de pago y manda confirmación. Escala a humano cuando se
atora.

- **Instalación:** $35,000 – $45,000
- **Mensualidad:** $6,500 (o $4,500 + 3% de reservas directas atribuidas)
- **Costo real tuyo:** ~$1,200 → **margen ~$5,300**
- **Justificación:** ahorra $7,000–$12,000/mes de comisión. Cobras ~8% de lo que
  devuelves.

La variante con % es mejor negocio para ti a mediano plazo y **es más fácil de
cerrar**, porque el hotel siente que solo paga si funciona. Úsala con los
desconfiados.

#### A2. Recepcionista IA Multilingüe 24/7

**Problema:** Oaxaca recibe turismo internacional. La recepción no habla inglés a
las 2 a.m., y las preguntas repetidas (wifi, horario de desayuno, cómo llegar,
estacionamiento, check-out tardío) se comen el turno.

**Qué hace:** responde en español, inglés y francés sobre todo el hotel, con base
de conocimiento propia (RAG del manual, políticas y FAQ del hotel).

- **Instalación:** $22,000 – $28,000
- **Mensualidad:** $3,800
- **Costo real tuyo:** ~$900 → **margen ~$2,900**
- **Justificación:** libera ~25 h/mes de recepción y evita reseñas negativas por
  "nadie me contestó".

#### A3. Upsell Automático Pre-Estancia 💰 EL DE MEJOR MARGEN PARA EL CLIENTE

**Problema:** el huésped ya pagó el cuarto y el hotel no le vuelve a vender nada
hasta que llega. Todo lo que se le venda antes es margen casi puro.

**Qué hace:** 48 h antes del check-in manda un mensaje con late check-out,
upgrade, desayuno, temazcal, cata de mezcal, tour a Hierve el Agua o Monte Albán,
traslado del aeropuerto. Cobra en el momento.

- **Instalación:** $15,000 – $18,000
- **Mensualidad:** $2,800 + **10% del upsell generado**
- **Costo real tuyo:** ~$700 → **margen ~$2,100 + variable**
- **Justificación:** un upsell bien hecho convierte 15–25% y deja $400–$900 por
  huésped. Con 200 huéspedes/mes son $12,000–$45,000 de ingreso nuevo.

**Este es tu mejor producto de demostración.** El resultado se ve en 30 días, es
dinero *nuevo* (no ahorro, que se siente abstracto), y el dueño lo puede contar en
la próxima comida del gremio. Instálalo en el Arcozodi primero.

#### A4. Vigía de Tarifas Oaxaca 🔒 EL DEFENDIBLE

**Problema:** el hotel pone precios "como el año pasado" y no reacciona a la
demanda. En Guelaguetza, Día de Muertos o Noche de Rábanos deja dinero en la mesa;
en temporada baja se queda vacío por no ajustar.

**Qué hace:** monitorea tarifas de competidores directos, cruza con el calendario
real de eventos de Oaxaca y manda recomendación semanal de tarifa por fecha.

- **Instalación:** $28,000 – $35,000
- **Mensualidad:** $5,500
- **Costo real tuyo:** ~$1,100 → **margen ~$4,400**
- **Justificación:** 5% de mejora en tarifa promedio en un hotel de $500,000
  mensuales son $25,000 al mes.

**Este servicio es tu foso.** Requiere el calendario de eventos locales, que
ninguna herramienta gringa tiene y que tú construyes una vez
(`05_DATOS_E_INTELIGENCIA/calendario-oaxaca`) y revendes a todos tus clientes. Cada
hotel nuevo lo hace más preciso.

#### A5. Rescate de Reseñas

**Problema:** el huésped molesto no se queja en recepción, se queja en Google y
TripAdvisor cuando ya se fue. Una reseña de 1 estrella cuesta reservas por meses.

**Qué hace:** encuesta breve el día del check-out. Si sale mal, alerta al gerente
al instante para resolver antes de que se vaya. Si sale bien, pide reseña pública
con link directo.

- **Instalación:** $10,000 – $14,000
- **Mensualidad:** $2,200
- **Costo real tuyo:** ~$600 → **margen ~$1,600**
- **Justificación:** subir de 4.2 a 4.6 en Google mueve la conversión de forma
  medible. Barato, se instala en 2 días.

**Úsalo como producto gancho.** Es lo que le vendes al hotel que dice "déjame
pensarlo": chico, rápido, resultado visible en tres semanas. Después le subes.

#### A6. Check-in Digital + Cumplimiento de Datos

**Problema:** fila en recepción, datos capturados a mano, y un tema que el hotel no
está viendo: guarda identificaciones y datos personales de huéspedes sin aviso de
privacidad ni control, lo cual lo expone bajo la ley mexicana de protección de
datos personales en posesión de particulares.

**Qué hace:** registro previo desde el celular, documentos cifrados, aviso de
privacidad correcto, retención con borrado automático.

- **Instalación:** $20,000 – $26,000
- **Mensualidad:** $3,200
- **Costo real tuyo:** ~$800 → **margen ~$2,400**
- **Justificación:** ahorra 8–10 min por check-in y le quita un riesgo legal real
  que hoy ni sabe que tiene.

**Vende esto con cuidado y con honestidad**: no es un producto de miedo, es un
producto de orden. Y te posiciona como el que sabe de cumplimiento, que es de las
pocas cosas por las que un dueño paga sin regatear.

---

### BLOQUE B — RESTAURANTES

#### B1. Pedidos Sin Comisión ⭐ EL ANCLA DE ESTE SECTOR

**Problema:** Rappi, DiDi Food y Uber Eats cobran 25–30% de cada pedido. El
restaurante trabaja para la app.

**Qué hace:** canal propio de pedidos por WhatsApp + web, con menú, carrito, pago
en línea y aviso a cocina. El cliente que ya lo conoce pide directo.

- **Instalación:** $18,000 – $24,000
- **Mensualidad:** $2,500 + 3% de pedidos directos (tope $6,000)
- **Costo real tuyo:** ~$800 → **margen ~$1,700 + variable**
- **Justificación:** un restaurante con $80,000/mes en apps ahorra ~$20,000 al mes
  si mueve la mitad a canal propio. Tú cobras una fracción de eso.

#### B2. Reservas y Lista de Espera por WhatsApp

**Problema:** el teléfono suena en hora pico y nadie contesta. En temporada alta en
el centro, cada llamada perdida es una mesa perdida.

**Qué hace:** toma reservas 24/7, confirma, manda recordatorio (baja el *no-show*),
administra lista de espera con aviso automático de "ya está tu mesa".

- **Instalación:** $12,000 – $15,000
- **Mensualidad:** $1,800
- **Costo real tuyo:** ~$550 → **margen ~$1,250**
- **Justificación:** el recordatorio automático baja el no-show del ~20% al ~8%.
  En un restaurante de 40 lugares eso son varias mesas por noche.

#### B3. Reactivación de Clientes Dormidos

**Problema:** el restaurante tiene cientos de números de WhatsApp de gente que ya
le compró y nunca les vuelve a hablar. Traer de vuelta a un cliente cuesta una
fracción de conseguir uno nuevo.

**Qué hace:** segmenta por última visita y ticket promedio, y manda campañas
dirigidas (no spam masivo) con oferta pensada por segmento.

- **Instalación:** $9,000 – $12,000
- **Mensualidad:** $2,000 + costo de mensajes de marketing
- **Costo real tuyo:** ~$500 + mensajes → **margen ~$1,500 + reventa de mensajes**
- **Justificación:** una campaña a 800 contactos que convierte 6% a ticket de $350
  son $16,800 de ingreso. Costo de mensajes: ~$650.

#### B4. Menú Vivo con Control de Faltantes

**Problema:** el menú QR está desactualizado, y el mesero anuncia el platillo que
ya se acabó. Se pide algo, se cancela, el cliente se decepciona.

**Qué hace:** menú web rápido, con precios que se actualizan solos y platillos que
se ocultan cuando cocina marca faltante desde su celular.

- **Instalación:** $8,000 – $11,000
- **Mensualidad:** $1,200
- **Costo real tuyo:** ~$350 → **margen ~$850**
- **Justificación:** producto de entrada, barato, y deja el pie puesto para
  venderle B1 y B2 en tres meses.

---

### BLOQUE C — TRANSVERSALES (cualquier giro)

#### C1. Paquete GEO — "Que la IA te recomiende" ⭐ TU DIFERENCIADOR

**Problema:** cada vez más turistas ya no buscan en Google. Le preguntan a ChatGPT,
a Gemini o a Perplexity "¿cuál es el mejor hotel boutique en el centro de Oaxaca?"
Si el modelo no conoce al negocio, no existe. Y el negocio no tiene ni idea de que
esa conversación está pasando.

**Qué hace:** datos estructurados schema.org correctos (Hotel / Restaurant /
LocalBusiness), `llms.txt`, contenido que responde preguntas reales de viajeros,
perfiles locales consistentes, rendimiento en el borde con Cloudflare, y control
deliberado de rastreadores de IA. Informe mensual de en qué respuestas aparece.

- **Instalación:** $16,000 – $22,000
- **Mensualidad:** $3,500 (incluye informe de citas)
- **Costo real tuyo:** ~$400 → **margen ~$3,100**
- **Justificación:** es posicionamiento en el canal que está creciendo, con reporte
  que se puede enseñar cada mes.

> ⚠️ **Corrección técnica importante sobre tu plan.** Dijiste "GEO usando
> Cloudflare". Cloudflare **no es** una herramienta de GEO. Es CDN, borde y control
> de rastreadores — y su función más publicitada últimamente es justo la contraria
> a lo que quieres: **bloquear** rastreadores de IA.
>
> Para GEO necesitas lo opuesto: **permitir deliberadamente** a `GPTBot`,
> `ClaudeBot`, `PerplexityBot`, `Google-Extended` y `CCBot`, y darles contenido
> bien estructurado que puedan citar. Si activas el bloqueo de IA de Cloudflare
> "porque suena a seguridad", le vuelves el negocio invisible al canal que le
> estás cobrando por conquistar. Cloudflare es el vehículo (velocidad, reglas,
> quién entra); el GEO son los datos estructurados y el contenido. Déjalo escrito
> en `04_GEO_Y_VISIBILIDAD/cloudflare/` antes de que se te olvide.

#### C2. Facturación Automática CFDI 4.0

**Problema:** el huésped o comensal pide factura tres días después por WhatsApp, y
alguien la hace a mano en el portal. Se equivocan de RFC, de régimen fiscal, de uso
de CFDI. Es una hora diaria perdida y errores fiscales.

**Qué hace:** liga el cobro con la emisión automática de CFDI y la manda por
WhatsApp y correo. Portal de autofactura con folio.

- **Instalación:** $18,000 – $25,000
- **Mensualidad:** $2,800 + timbres
- **Costo real tuyo:** ~$700 + timbres → **margen ~$2,100**
- **Justificación:** dolor universal, recurrente y aburrido. Nadie quiere hacerlo.
  Por eso se paga bien.

#### C3. Panel del Dueño

**Problema:** el dueño tiene la información en cinco lados (Booking, el punto de
venta, WhatsApp, la libreta) y no ve nada junto. Decide por corazonada.

**Qué hace:** un tablero con lo que sí importa: ocupación, ingreso, canal de
origen, tiempo de respuesta, conversión, reseñas. Resumen semanal a su WhatsApp los
lunes a las 8 a.m.

- **Instalación:** $20,000 – $28,000
- **Mensualidad:** $3,200
- **Costo real tuyo:** ~$650 → **margen ~$2,550**
- **Justificación:** es lo que hace que **no te cancele**. El dueño abre ese resumen
  cada lunes y ve tu trabajo. Un cliente que ve tus números no se va.

**Regálalo dentro de los paquetes grandes.** Cuesta poco y es el mejor seguro
antichurn que tienes.

#### C4. Web Rápida (producto de entrada)

**Problema:** la web actual carga en 6 segundos, no se ve bien en celular y no
convierte. O no hay web, solo Facebook.

**Qué hace:** sitio estático rapidísimo, optimizado para móvil, con GEO base
incluido y botón de WhatsApp que sí funciona.

- **Instalación:** $14,000 – $30,000 según tamaño
- **Mensualidad:** $900 (hospedaje, respaldos, cambios menores)
- **Costo real tuyo:** ~$150 → **margen ~$750**
- **Justificación:** margen bajo a propósito. **La web es la puerta, no el
  negocio.** Sirve para entrar, demostrar que cumples, y vender lo recurrente.

---

### BLOQUE D — CÍVICO Y GOBIERNO

> ⚠️ **Lee `00-EVALUACION-CRITICA.md` § 4 antes de tocar este bloque.** Vender a
> dependencias donde tu familia tiene influencia te expone a ti y a ellos bajo la
> LGRA y la LAASSP, y el riesgo no es perder el contrato: es inhabilitación.
>
> Estos servicios están diseñados para venderse por **licitación abierta**, o a
> **cámaras empresariales, asociaciones y fundaciones**, que son clientes privados,
> pagan bien y no te exponen a nada. Empieza por ahí. La CANIRAC, la CANACO y la
> asociación de hoteleros son compradores reales.

#### D1. Observatorio Turístico de Oaxaca 🏆 EL ACTIVO DE LARGO PLAZO

**Problema:** nadie en Oaxaca tiene datos agregados y confiables de ocupación,
tarifa promedio y origen del visitante. Ni los hoteles, ni las cámaras, ni la
secretaría de turismo. Todos operan a ciegas.

**Qué hace:** con los datos anonimizados y agregados de tus clientes instalados
(con su consentimiento explícito y contrato que lo permita), publica un informe
mensual de ocupación y tarifas de la ciudad. Suscripción para el gremio.

- **Instalación:** $0 — se construye solo con tus clientes existentes
- **Suscripción:** $1,500 – $3,000 por suscriptor / mes
- **Costo marginal:** casi cero
- **Justificación:** es un producto de datos. Margen ~90%, y **cada cliente nuevo
  lo hace más valioso sin costarte nada.**

**Este es el negocio real escondido dentro del negocio.** Los chatbots son
servicios: cambias horas por pesos y compites con cualquiera. El observatorio es un
activo: nadie lo puede copiar sin tener 15 hoteles instalados primero. Requiere ~15
clientes para tener sentido estadístico, así que es una meta de 18–24 meses — pero
**la cláusula de datos agregados y anonimizados tiene que estar en tu contrato
desde el cliente número uno.** Si no la pones ahora, en dos años tienes que
renegociar con quince personas.

#### D2. Ventanilla Ciudadana IA

**Problema:** el municipio recibe las mismas 40 preguntas todo el día (requisitos
de un trámite, horarios, costos, dónde se paga) y las contesta una persona en una
ventanilla con fila.

**Qué hace:** WhatsApp oficial del municipio que responde trámites, requisitos,
horarios y costos, con escalamiento a humano.

- **Instalación:** $60,000 – $120,000 según tamaño
- **Mensualidad:** $8,000 – $15,000
- **Costo real tuyo:** ~$1,800 → margen alto
- **Justificación:** atiende miles de consultas sin ampliar plantilla.

#### D3. Reportes Ciudadanos Georreferenciados

**Problema:** baches, luminarias apagadas, fugas. Se reportan por Facebook, se
pierden, nadie da seguimiento y el ciudadano se enoja dos veces: por el bache y
por el silencio.

**Qué hace:** reporte por WhatsApp con foto y ubicación, folio automático,
seguimiento y tablero de control interno.

- **Instalación:** $45,000 – $80,000
- **Mensualidad:** $6,000 – $10,000

#### D4. Digitalización para Cámaras Empresariales

**Problema:** la cámara tiene 200 agremiados que quieren digitalizarse y no sabe
por dónde. Tú vendes una vez y entras a 200 negocios.

**Qué hace:** paquete estandarizado para agremiados, con tarifa preferente. La
cámara cobra membresía, tú operas.

- **Instalación:** negociada por volumen
- **Mensualidad:** $1,200 – $2,500 por agremiado activo
- **Justificación:** **es tu mejor canal de distribución después de tu tía.** Una
  reunión con el presidente de una cámara vale por cincuenta llamadas en frío.

---

## PARTE 3 — Paquetes (así se vende, no por pieza)

Nunca presentes la lista completa. Presenta **tres opciones**, siempre tres. El de
en medio es el que quieres vender y es el que la mayoría escoge.

### Hoteles

| Paquete | Incluye | Instalación | Mensual |
|---|---|---|---|
| **Arranque** | A2 + C4 | $32,000 | $4,200 |
| **Crecimiento** ⭐ | A1 + A2 + A3 + C1 + C3 | $78,000 | $12,500 |
| **Dominio Total** | Todo el bloque A + C1 + C2 + C3 | $135,000 | $19,800 |

### Restaurantes

| Paquete | Incluye | Instalación | Mensual |
|---|---|---|---|
| **Arranque** | B4 + B2 | $18,000 | $2,600 |
| **Crecimiento** ⭐ | B1 + B2 + B3 + C1 | $48,000 | $7,500 |
| **Dominio Total** | Todo B + C1 + C2 + C3 | $85,000 | $12,000 |

**Reglas de venta que no rompes:**

1. **Instalación siempre por adelantado**, mínimo 50% para arrancar. Sin
   excepciones, y menos con conocidos: es justo con los conocidos con quienes más
   se rompe esta regla y más caro sale.
2. **Contrato mínimo de 6 meses** en mensualidades. Tu costo está en la instalación;
   si se van al mes tres, perdiste.
3. **Descuento del 15% por pago anual anticipado.** Te da flujo y te quita churn.
4. **El alcance se escribe.** Lo que no está en el contrato es proyecto nuevo y se
   cotiza aparte. Esta regla es la que te salva de morir de "cambios chiquitos".
5. **Cláusula de datos agregados y anonimizados desde el cliente uno** (ver D1).

---

## PARTE 4 — La escalera

Así se mueve un cliente por tu catálogo. No intentes vender el paquete grande el
primer día: vende el escalón uno y deja que los resultados vendan el dos.

```
GANCHO           →  MOTOR                →  FOSO
$8k–14k             $35k–78k                Los que no te dejan ir
Web rápida          Reserva directa         Vigía de Tarifas (A4)
Rescate reseñas     Pedidos sin comisión    Panel del Dueño (C3)
Menú vivo           Paquete GEO             Observatorio (D1)

"pruébame barato"   "aquí está tu dinero"   "ya no me puedes reemplazar"
```

- El **gancho** existe para que digan que sí rápido y para que tú demuestres que
  cumples. No es donde ganas.
- El **motor** es tu ingreso. Se vende con la servilleta de la Parte 1.
- El **foso** es lo que hace que no te vayan a cambiar por alguien más barato el
  año que entra. Métele tiempo aunque no sea lo que más paga hoy.

---

## PARTE 5 — Metas de ingreso realistas

Con precios de este catálogo y una sola persona operando:

| Momento | Clientes | Mensual recurrente | Instalaciones | Total mes |
|---|---|---|---|---|
| Mes 3 | 2 | $10,000 | $40,000 | $50,000 |
| Mes 6 | 5 | $28,000 | $45,000 | $73,000 |
| Mes 12 | 11 | $68,000 | $60,000 | $128,000 |
| Mes 18 | 18 | $115,000 | $70,000 | $185,000 |

**Lee esto antes de emocionarte:** el número de la izquierda es el único que
importa. El ingreso recurrente es el que te deja dormir; las instalaciones son
sube y baja y no se pueden proyectar.

Y el techo llega antes de lo que crees: **a los ~12 clientes te saturas solo.** En
ese punto, o contratas soporte de primer nivel, o dejas de vender. Decídelo antes
de llegar, no cuando ya estés incumpliendo. Es la razón por la que las plantillas
de `02_CHATBOTS_Y_AUTOMATIZACION/plantillas-industria/` importan tanto: cada cliente
nuevo tiene que costarte menos horas que el anterior, o el modelo no escala.
