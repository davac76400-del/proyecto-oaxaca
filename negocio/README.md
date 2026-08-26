# Negocio — sistema comercial y arsenal técnico

**David Alfredo Romero Rendón · Oaxaca · agosto 2026**

Todo lo necesario para convertir la capacidad técnica que ya demostraste en
OaxIntegra IA en un negocio que factura.

## Los documentos, en orden de lectura

| # | Documento | Qué contiene |
|---|---|---|
| 00 | [`00-EVALUACION-CRITICA.md`](00-EVALUACION-CRITICA.md) | Calificación sin filtro, probabilidad de éxito, los 5 errores a corregir esta semana |
| 01 | [`01-CATALOGO-SERVICIOS-Y-PRECIOS.md`](01-CATALOGO-SERVICIOS-Y-PRECIOS.md) | 18 servicios con precios, la fórmula corregida, paquetes, metas de ingreso |
| 02 | [`02-ARSENAL-HERRAMIENTAS.md`](02-ARSENAL-HERRAMIENTAS.md) | Qué descargar y en qué carpeta exacta va cada cosa |
| 03 | [`03-PLAN-30-DIAS.md`](03-PLAN-30-DIAS.md) | Día por día, del 26 ago al 26 sep |
| 04 | [`04-MIGRACION-MAC-DIA-1.md`](04-MIGRACION-MAC-DIA-1.md) | Lista para cuando llegue la Mac |

## Herramientas que ya funcionan

```bash
# Calcula el precio con los números del cliente que tienes enfrente
node negocio/stack/00_COMANDO/finanzas/calculadora-precios.js hotel --cuartos 20
node negocio/stack/00_COMANDO/finanzas/calculadora-precios.js restaurante

# Descarga el arsenal en las carpetas correctas
./negocio/stack/descargar-arsenal.sh listar     # ver qué trae
./negocio/stack/descargar-arsenal.sh esencial   # ~12 repos del primer mes
```

## El árbol

```
stack/
├── 00_COMANDO/          estrategia · finanzas · legal · ventas · bitácora
├── 01_NUCLEO_IA/        claude (plugins, skills, MCP) · openclaw · modelos locales
├── 02_CHATBOTS_Y_AUTOMATIZACION/  whatsapp · n8n · motores de chat · RAG
├── 03_WEBS_Y_RESERVAS/  stacks · plantillas · reservas · pagos MX
├── 04_GEO_Y_VISIBILIDAD/ cloudflare · schema.org · llms.txt · medición
├── 05_DATOS_E_INTELIGENCIA/ tarifas · calendario Oaxaca · observatorio
├── 06_INFRAESTRUCTURA/  VPS · docker · seguridad · monitoreo · runbooks
├── 07_CLIENTES/         plantilla + una carpeta por cliente
└── 08_APRENDIZAJE/      ruta 30 días · notas · laboratorio
```

Cada carpeta tiene su propio `README.md` explicando qué va adentro y por qué.

---

## Los seis cambios, en una pantalla

Si no lees nada más, lee esto.

1. **No esperes la computadora.** Lo que vendes corre en un VPS de 200 pesos, no en
   tu laptop. Y la verificación de WhatsApp con Meta tarda de 1 a 3 semanas: si la
   arrancas el día 31, tu primer mensaje sale mes y medio tarde.

2. **Cambia la fórmula de precios.** Fuera el margen por desinformación; dentro la
   participación del valor generado. Es el mismo dinero, pero se puede decir en voz
   alta, se renueva, y no se cae el día que el cliente averigüe cuánto cuesta un
   servidor. En un negocio que corre por recomendación, ese día llega.

3. **Vende resultados, no chatbots.** "Reservas directas sin comisión de Booking"
   se cobra a 6,500. "Un chatbot" se cobra a 1,500. Es el mismo software.

4. **Quita la capa de más.** Claude Code programa, Gemini opina, OpenClaw opera. La
   cadena Gemini→OpenClaw→Claude es un teléfono descompuesto. Ya lo comprobaste
   cuando sacaste n8n del chat de OaxIntegra IA.

5. **Cóbrale a tu tía.** Contrato, factura, números medidos. Sin eso no tienes un
   caso de éxito, tienes un favor familiar con servidores.

6. **Sepárate del riesgo político.** El apoyo de tus papás vale por el capital
   paciente y las puertas, no por los contratos. Vender a dependencias donde tienen
   influencia los expone a ellos y a ti bajo la LGRA y la LAASSP, y la sanción no
   es perder el contrato: es inhabilitación. Construye privado primero.

## Lo que casi nadie ve a tiempo

**OaxIntegra IA no es tu negocio: es tu portafolio y tu carta política.** Su público
—artesanos y mezcaleros— no puede pagarte una mensualidad. Tu negocio son hoteles,
restaurantes y turismo, donde sí hay presupuesto y dolor medible en pesos.

Y el activo de más valor de todo el plan no es ningún chatbot: es el
[**Observatorio Turístico**](01-CATALOGO-SERVICIOS-Y-PRECIOS.md) que puedes
construir cuando tengas 15 hoteles instalados. Datos de ocupación y tarifas de
Oaxaca que hoy no existen en ningún lado. Margen del 90%, imposible de copiar sin
haber hecho el trabajo primero.

Por eso la cláusula de datos agregados va en el contrato **desde el cliente uno**.
