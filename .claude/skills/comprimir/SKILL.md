---
name: comprimir
description: Comprime la conversación actual a un resumen mínimo y operativo, descartando el ruido (confirmaciones, capturas ya leídas, intentos fallidos ya superados) y conservando solo lo necesario para seguir trabajando. Úsala cuando la sesión se esté alargando, antes de que el contexto se llene, o cuando el usuario pida comprimir, resumir o limpiar la sesión.
---

# Comprimir la sesión

Convierte todo lo hablado hasta ahora en un resumen corto que sirva para **seguir
trabajando**, no para recordar la conversación. El resumen reemplaza al historial:
lo que no quede escrito, se pierde.

## La regla que decide todo

Para cada cosa dicha en la sesión, pregúntate:

> **Si mañana empiezo de cero y no tengo esto, ¿me atoro?**

- **Sí** → va al resumen.
- **No** → se tira, aunque haya costado trabajo llegar ahí.

El proceso no importa. **Importa dónde quedamos y qué falta.**

## Qué se conserva siempre

| Qué | Por qué |
|---|---|
| **Estado actual** | En qué paso vamos, qué ya quedó hecho y funcionando |
| **Configuración viva** | Valores que están puestos ahora mismo (puertos, hosts, URLs, nombres de campos, rutas) |
| **Decisiones y su motivo** | «Se usa X y no Y porque Y no entregaba» — sin el motivo, alguien lo revierte |
| **Problemas resueltos** | Solo el síntoma y el arreglo, en un renglón. Nunca el camino que se recorrió |
| **Pendientes** | Lo que falta, en orden, con quién lo tiene que hacer (usuario o Claude) |
| **Callejones sin salida** | Lo que ya se probó y NO funcionó, para no repetirlo |

## Qué se tira siempre

- «ok», «listo», «ya», «sí», y toda confirmación sin contenido.
- Capturas de pantalla ya leídas: **queda el dato que traían, no la captura**.
- Intentos fallidos que después se arreglaron (queda solo el arreglo final).
- Instrucciones paso a paso ya ejecutadas.
- Bloques de código o HTML ya pegados en su destino: **queda el nombre del archivo y dónde vive, no el contenido**.
- Explicaciones y ping-pong de aclaraciones.
- Repeticiones de lo mismo dicho con otras palabras.

## Secretos

**Nunca copies al resumen** contraseñas, llaves de API, tokens ni secretos, aunque
hayan aparecido en la sesión.

Escribe en su lugar **dónde vive** el valor:

- Bien: `Password SMTP: contraseña de aplicación de Google, guardada en Supabase → Auth → SMTP Settings`
- Mal: `Password SMTP: qeabtlusqaphjed`

Si un secreto se pegó por chat durante la sesión, anótalo como pendiente:
`[ ] Rotar <qué credencial> — se expuso en chat`.

## Formato de salida

Escribe exactamente esto, sin secciones de más. Una sección vacía se omite entera.

```markdown
# Dónde vamos — <fecha>

## Estado
<2-4 renglones: qué se está haciendo y qué ya funciona>

## Configuración activa
| Qué | Valor |
|---|---|
| ... | ... |

## Decisiones
- **<decisión>** — <motivo en media línea>

## Resuelto
- **<síntoma>** → <arreglo>

## Ya se probó y no sirve
- <qué> — <por qué no>

## Pendiente
- [ ] **(usuario)** <lo que le toca a él>
- [ ] **(Claude)** <lo que me toca a mí>
```

## Cómo se hace

1. **Relee la sesión completa** antes de escribir nada. Comprimir de memoria
   pierde justo los detalles de configuración que después hacen falta.
2. **Escribe el resumen** en `.claude/resumen-sesion.md` (sobrescribe el que haya).
   Un archivo sobrevive a la sesión; un mensaje en el chat, no.
3. **Enséñale el resumen al usuario** en el chat, completo, para que corrija lo que
   falte antes de que el historial deje de estar a la mano.
4. **Sigue trabajando desde el resumen.** A partir de ahí, ese archivo es la verdad:
   si algo no quedó ahí y hace falta, pregúntalo en vez de suponerlo.

## Qué tan corto

Apunta a **media pantalla**. Si pasa de una pantalla, no comprimiste: copiaste.

La prueba: dale el resumen a alguien que no estuvo en la sesión. Si puede seguir
desde el siguiente paso sin hacer preguntas, está bien. Si pregunta algo que sí
estaba en la sesión, falta ese dato — añádelo. Si pregunta «¿y esto para qué?»,
sobra ese renglón — quítalo.
