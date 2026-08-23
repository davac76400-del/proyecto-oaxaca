# Sistema de autenticación — usuario + código de 6 dígitos

## Decisión de diseño

Sin correo electrónico, sin contraseña larga, sin verificación por email.
El usuario elige **un nombre de usuario** y **un código de 6 números** que él
mismo escribe. Razón: el público objetivo puede no tener correo activo ni
recordar contraseñas complejas, pero sí recuerda 6 números.

**Importante — historial de decisión:** hubo una iteración donde el sistema
generaba el código automáticamente. El autor lo revirtió: **el usuario escribe
y elige su propio código**. Esa es la versión correcta y final.

---

## FLUJO DE REGISTRO (2 pasos)

### Paso 1 — Datos

| Campo | Obligatorio | Regla |
|---|---|---|
| **Usuario** | Sí | Sin espacios, 4–20 caracteres, al menos una MAYÚSCULA, único |
| **Teléfono** | **NO (opcional)** | Si se llena: exactamente 10 dígitos. Con selector de lada. |
| **Tipo de negocio** | Sí | Select con giros (mezcal, textil, barro, comida, turismo…) |

**Regex del usuario:**
```js
usuario: {
  probar: function (v) {
    var t = v.trim();
    return /^[A-Za-z0-9._-]{4,20}$/.test(t) && /[A-Z]/.test(t);
  },
  error: 'Sin espacios, 4 a 20 caracteres y al menos una mayúscula.'
}
```

**Regla del teléfono opcional (crítica — fue el BUG-06):**
```js
'telefono-opcional': {
  probar: function (v) {
    var d = v.replace(/\D/g, '');
    return d.length === 0 || d.length === 10;   // vacío O exactamente 10
  },
  error: 'El teléfono debe tener 10 dígitos (o déjalo vacío).'
}
```
Nota: limpia espacios, guiones y paréntesis antes de contar. `55-1234 5678`
es válido. **Si esta regla se rompe, el registro se bloquea entero.**

**Unicidad del usuario:**
```js
var clave = usu.value.trim().toLowerCase();
if (leerCuentas()[clave]) { /* ya existe → mandar a iniciar sesión */ }
```

### Selector de lada (América + España)

```js
var LADAS = [
  ['+52','🇲🇽 MX'], ['+1','🇺🇸 US/CA'], ['+54','🇦🇷 AR'], ['+591','🇧🇴 BO'],
  ['+55','🇧🇷 BR'], ['+56','🇨🇱 CL'], ['+57','🇨🇴 CO'], ['+506','🇨🇷 CR'],
  ['+53','🇨🇺 CU'], ['+593','🇪🇨 EC'], ['+503','🇸🇻 SV'], ['+502','🇬🇹 GT'],
  ['+509','🇭🇹 HT'], ['+504','🇭🇳 HN'], ['+505','🇳🇮 NI'], ['+507','🇵🇦 PA'],
  ['+595','🇵🇾 PY'], ['+51','🇵🇪 PE'], ['+1','🇩🇴 DO'], ['+598','🇺🇾 UY'],
  ['+58','🇻🇪 VE'], ['+34','🇪🇸 ES']
];
// Default: +52 (México)
```
El teléfono se guarda con lada: `"+52 5512345678"`

⚠️ **Pendiente conocido:** España usa 9 dígitos, no 10. La validación exige 10
para todos porque así se pidió. Mejora futura: validar según el país elegido.

### Paso 2 — Código

Seis casillas individuales (`.casilla` dentro de `#casillas`).
- Avance automático al escribir
- Retroceso con borrar
- Pegado inteligente (pegar "123456" llena las 6)
- **Al completar las 6 cifras se envía solo** (auto-submit)

```js
var codigoRegistro = conectarCasillas('#casillas', function(){ crearCuenta(); });
```

---

## FLUJO DE INICIO DE SESIÓN

Solo dos campos: **usuario** + **código**.

```js
var cuenta = leerCuentas()[usuario.trim().toLowerCase()];
if (!cuenta)                  → "No encontré esa cuenta"
if (cuenta.codigo !== codigo) → "Código incorrecto"
else                          → sesión iniciada, cargar su historial
```

---

## ALMACENAMIENTO (localStorage)

| Clave | Contenido |
|---|---|
| `oaxintegra.cuentas` | Objeto `{ usuarioEnMinusculas: {…datos} }` |
| `oaxintegra.sesion` | La cuenta activa (JSON) |
| `oaxintegra.convs.<usuario>` | Historial de conversaciones de esa cuenta |
| `oaxintegra.tema` | `"dia"` o `"noche"` |

**Estructura de una cuenta:**
```json
{
  "usuario": "MariaTelar23",
  "nombre": "MariaTelar23",
  "telefono": "+52 5512345678",
  "giro": "mezcal",
  "giroTexto": "Mezcal, palenque y bebidas",
  "codigo": "473921",
  "alta": "2026-08-22T06:15:00.000Z"
}
```

---

## LA PORTADA QUE BLOQUEA (`#portada`)

Overlay a pantalla completa, `z-index: 200`, que **impide usar la app** hasta
autenticarse.

```js
function mostrarPortada() {
  document.getElementById('portada').hidden = false;
  document.body.style.overflow = 'hidden';   // bloquea el scroll detrás
  verPestanaAuth('entrar');
}
function ocultarPortada() {
  document.getElementById('portada').hidden = true;
  document.body.style.overflow = '';
}
// Al arrancar:
if (sesion) { cargarConvs(); ocultarPortada(); } else { mostrarPortada(); }
// Al cerrar sesión: mostrarPortada()
```

---

## ADVERTENCIA DE SEGURIDAD (importante para Claude Code)

**Esto NO es seguridad real.** Todo vive en el navegador:
- Cualquiera puede abrir la consola y leer todos los códigos
- Los datos solo existen en ese dispositivo/navegador
- Borrar los datos del navegador borra todas las cuentas
- No hay recuperación si se pierde el código

Es aceptable para un prototipo/demo. Para producción hace falta backend real:
ver `backend/schema.sql` para el esquema propuesto, y usar hash (bcrypt) para
los códigos, nunca texto plano.
