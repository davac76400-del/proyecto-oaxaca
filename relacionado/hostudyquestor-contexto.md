# HoStudyQuestor — proyecto hermano (SEPARADO)

**Importante:** este es un proyecto **distinto** de OaxIntegra IA. Se incluye
porque comparte estética, arquitectura y autor, y porque hay decisiones y
código reutilizables entre ambos.

- **Archivo:** `HoStudyQuestor.html` (271 KB, en esta misma carpeta)
- **Sitio original:** https://hostudyquestor.my.canva.site/
- **Nombre completo:** "Plataforma Web Educativa Inteligente"

## Qué es

Plataforma educativa que evolucionó a **"Plataforma Híbrida SaaS + Marketplace
Académico Protegido"**: ayuda con tareas mediante IA y conecta alumnos con
maestros/tutores humanos.

## Funciones principales

- **Asistente de IA** para explicar o realizar tareas (campo abierto, cualquier materia)
- **Calculadora de promedios** por materias, con guardado local y mini-asistente
  que sugiere la nota mínima necesaria en el examen final
- **4 opciones por servicio:** explicación con IA, generación con IA,
  explicación por maestro humano, trabajo terminado por maestro humano
- **Cuentas híbridas comprador/vendedor:** todo usuario inicia como comprador y
  puede activar perfil de tutor sin crear otra cuenta
- **Bolsa de trabajos** donde los tutores se postulan con cotización
- **Portal de Maestros** con registro público

## Modelo de negocio definido

- Prueba gratis 7 días
- Plan Pro: $99 MXN/mes o $599/año
- Plan Premium: $199 MXN/mes o $1,199/año (10% de descuento en servicios humanos)
- Comisión: 20% sobre el precio del vendedor (recibe 80%)
- Tutor "Súper Tutor" (10 ventas con 4.8★+): comisión baja a 15%
- Escrow de 3 días con opción de aclaración o reembolso

## Mecanismos de protección

- **Chat ciego:** bloquea números, correos, enlaces y redes sociales para
  evitar pagos fuera de la plataforma
- **Vista previa con marca de agua** en los entregables, se retira al liberar el pago
- Insignias de tutor verificado ("Identidad Verificada", "Respuesta en <15 min")

## Estética

Paleta tierra (marrones claros, arena, crema, blancos rotos), elegante y cálida,
con grecas geométricas oaxaqueñas sutiles y **botones 3D** (relieve, sombras
profundas, gradientes, efecto de presión al clic).

Paleta anterior (histórica): azul confianza #2563EB, morado académico #7C3AED,
verde de éxito #10B981.

## Renderizado por tipo de tarea

Al usar "Te lo hago con IA", renderiza distinto según lo pedido:
- Presentaciones → carrusel de diapositivas
- Mapas mentales / esquemas → Mermaid.js (con exportar PNG)
- Datos / reportes → Chart.js
- Guiones / cómics / debates → formato a dos columnas
- Redacción / apuntes → plantilla tipo hoja de libreta con cita APA

## Webhooks

- Chat/IA: `https://davidrr7630.app.n8n.cloud/webhook/chat`
  (payload `{"message","username"}`, más un campo `modo` que vale
  `"explicacion"` o `"realizar"`)
- Registro: `https://davidrr7630.app.n8n.cloud/webhook/3ffe0c04-73c3-42a7-973d-2b5f8ec4d37d`
- Histórico: `https://davidrr7630.app.n8n.cloud/webhook/student-intent`

## Qué se puede reutilizar entre proyectos

| De HoStudyQuestor a OaxIntegra | De OaxIntegra a HoStudyQuestor |
|---|---|
| Botones 3D con relieve | Sistema de temas día/noche con variables RGB |
| Renderizado por tipo de tarea (Mermaid, Chart.js) | Recorte de transparencia del chapulín |
| Login por QR con OTP | Validación de usuario con reglas |
| Sistema de rachas/gamificación | Selector de lada internacional |
| Centro de notificaciones | Motor local de respaldo |

**Ambos proyectos comparten el mismo problema de n8n**, así que la solución de
`backend/ai_service_directo.js` sirve para los dos.
