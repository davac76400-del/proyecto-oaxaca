# Pendientes y mejoras

## ✅ PRIORIDAD 1 — RESUELTO (23 ago 2026)

### Conectar la IA de verdad
Hecho. Se sacó n8n del chat y ahora la IA es directa:
**Llama 3.2 (gratis) → Gemini Flash (gratis) → motor local.**
Ver `logs/bug-tracker.md` → BUG-13 y la guía completa en
`docs/06-ia-directa.md`.

Las llaves viven en el servidor (`.env`), nunca en el HTML.

**Lo único que falta, y te toca a ti (5 minutos):**
1. Saca tu llave gratis de Llama en https://openrouter.ai/keys
2. Saca tu llave gratis de Gemini en https://aistudio.google.com/apikey
3. `cp .env.example .env` y pégalas ahí
4. `cd frontend && python3 build.py && cd ..`
5. `node backend/servidor.js` y abre http://localhost:3000

Mientras no pongas las llaves, la app funciona igual pero con el motor
local, y la insignia dice "Modo local".

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

### ✅ Reducir el peso del archivo — HECHO (23 ago 2026)
Se incrustó el chapulín **una sola vez** en la variable CSS `--chapulin`.
De 975 KB a 440 KB. Ver BUG-20.

### Seguridad real de las cuentas
Los códigos de acceso siguen en texto plano en localStorage. Cualquiera con
acceso al navegador los ve. Para producción: backend + bcrypt. Ver
`backend/schema.sql`.

(Las llaves de la IA **ya no** tienen este problema: se movieron al servidor
el 23 ago 2026. Ver BUG-15.)

### Accesibilidad
- Revisar contraste con herramienta automática (WCAG AA)
- Navegación completa por teclado en las casillas del código
- `aria-live` en los mensajes del chat para lectores de pantalla

### Responsivo en móvil
Probado en escritorio (1280px). Falta verificar a fondo en 360–420px, sobre
todo el chat con su barra lateral y las 6 casillas del código.

---

## 💡 Ideas mencionadas, sin implementar

- ✅ Modo sin conexión con Service Worker — HECHO (23 ago 2026), ver docs/07
- ✅ Exportar a PDF o imagen — HECHO (23 ago 2026), ver docs/07
- Plantillas por giro (mezcal, textil, barro…) con ejemplos precargados
- Panel para ver cuántos emprendedores usan la plataforma
- Traducción a lenguas originarias de Oaxaca (zapoteco, mixteco) — encajaría
  muy bien con la misión cultural del proyecto
