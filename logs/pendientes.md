# Pendientes y mejoras

## 🟡 PRIORIDAD 1 — Mitigado, falta que el autor active una IA real

### Conectar la IA de verdad
El chat siempre caía en modo local. Ver `logs/bug-tracker.md` → BUG-13.

**Lo que ya se hizo (23 ago 2026):** se integró `CONFIG_IA` directamente en
`frontend/app.src.html` (adaptado de `backend/ai_service_directo.js`), con una
cadena de respaldo n8n → IA directa → motor local. Viene apagada por defecto.

**Lo que falta para que responda una IA real (le toca al autor):**
1. **Prueba decisiva primero:** subir `dist/OaxIntegra-IA-app.html` a Netlify
   Drop (arrastrar y soltar, gratis, 30 segundos) y probar desde la URL
   `https://`. Si ahí sí funciona, el problema era el protocolo `file://`.
2. Si sigue fallando con n8n: F12 → Console → leer el error exacto, o usar
   la insignia de diagnóstico del chat (ya explica cada caso).
3. **Activar la IA directa:** en `frontend/app.src.html`, buscar `CONFIG_IA` y
   poner `PROVEEDOR` + la clave en `CLAVES` (rápido, solo para pruebas — la
   clave queda visible en el HTML), o mejor, desplegar un proxy propio
   (ejemplo de función serverless al final de `backend/ai_service_directo.js`)
   y poner su URL en `CONFIG_IA.PROXY`. Después reconstruir con
   `cd frontend && python3 build.py`.
4. El autor quiere cambiar de Gemini. Sugerencias ya cableadas en `CONFIG_IA`:
   OpenAI GPT-4o mini (más fácil), Claude Haiku (mejor español), Groq
   (gratis y rápido), DeepSeek (económico).

---

## 🟡 PRIORIDAD 2 — Funcionalidad prometida

### Envío del código por WhatsApp/SMS
El registro ya manda al webhook de n8n el usuario, el código y el teléfono con
lada. **Falta el nodo que efectivamente envíe el mensaje.**

Opciones: Twilio, WhatsApp Business API, o CallMeBot (gratis para uso personal).
El payload ya está listo:
```json
{ "accion":"registro", "username":"...", "code":"473921",
  "phone":"+52 5512345678", "businessType":"..." }
```

### Recuperación de cuenta
Hoy: si pierdes el código, pierdes la cuenta. No hay recuperación.
Requiere lo anterior (envío por WhatsApp) más la tabla
`codigos_recuperacion` de `backend/schema.sql`.

---

## 🟢 PRIORIDAD 3 — Mejoras de calidad

### Validación de teléfono por país
Hoy exige 10 dígitos para todos. España usa 9, otros países varían.
Mejora: validar según la lada elegida.
```js
var LARGOS = { '+52':10, '+1':10, '+34':9, '+57':10, '+54':10, '+56':9, ... };
```

### Vectorizar el chapulín a SVG
El autor pidió que se vea "más animado, tipo ilustración, padrísimo".
Convertirlo a SVG permitiría:
- Animar partes individuales (antenas que se mueven, patas, alas)
- Peso mínimo (hoy son 137 KB × 4 incrustaciones)
- Nitidez perfecta a cualquier tamaño
- Colores controlados por tema

Herramientas: `potrace`, `vtracer`, o redibujarlo a mano en Figma/Illustrator.

### Reducir el peso del archivo
Hoy ~900 KB porque el chapulín va incrustado 4 veces en base64.
Opciones:
- Incrustarlo **una sola vez** como `<symbol>` SVG o como CSS custom property,
  y referenciarlo 4 veces
- Servir la imagen como archivo aparte (rompe el "un solo archivo", consultar
  con el autor primero)

### Seguridad real
Los códigos están en texto plano en localStorage. Cualquiera con acceso al
navegador los ve. Para producción: backend + bcrypt. Ver `backend/schema.sql`.

### Accesibilidad
- Revisar contraste con herramienta automática (WCAG AA)
- Navegación completa por teclado en las casillas del código
- `aria-live` en los mensajes del chat para lectores de pantalla

### Responsivo en móvil
Probado en escritorio (1280px). Falta verificar a fondo en 360–420px, sobre
todo el chat con su barra lateral y las 6 casillas del código.

---

## 💡 Ideas mencionadas, sin implementar

- Modo sin conexión con Service Worker (útil donde la señal es mala)
- Exportar las publicaciones guardadas a PDF o imagen
- Plantillas por giro (mezcal, textil, barro…) con ejemplos precargados
- Panel para ver cuántos emprendedores usan la plataforma
- Traducción a lenguas originarias de Oaxaca (zapoteco, mixteco) — encajaría
  muy bien con la misión cultural del proyecto
