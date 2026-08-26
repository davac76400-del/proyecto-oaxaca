# Abrir la app sin terminal

`http://localhost:3000` **solo existe mientras tu propia computadora esté
corriendo `npm start`**. No es una página de internet: es tu máquina
hablándole a sí misma. Si nadie encendió el servidor, el navegador dice
«no se puede acceder a este sitio», y es lo correcto.

Como la app entera cabe en **un archivo**, no hace falta ningún servidor.

---

## La salida corta: `publicar/index.html`

```
publicar/
  └── index.html      ← la app completa, 498 KB, un solo archivo
```

Es una copia de `dist/OaxIntegra-IA-app.html` con el nombre que los
servicios de publicación esperan. Dentro va todo: el diseño, el chat, y las
llaves públicas de Supabase.

### Opción A · Netlify Drop (sin cuenta, sin instalar nada)

1. [app.netlify.com/drop](https://app.netlify.com/drop)
2. Arrastra la **carpeta** `publicar` (la carpeta, no el archivo) al recuadro
3. En unos segundos sale una dirección tipo
   `https://algo-algo-123456.netlify.app`

Esa dirección sirve en cualquier teléfono y computadora del mundo.

### Opción B · doble clic

Abrir `publicar/index.html` con doble clic funciona **para ver la app**. El
registro por correo solo funciona así si el correo trae los **números**
(ver «Mejora 1» en `docs/08-acceso-por-codigo.md`); si trae un enlace, el
enlace no sabe volver a un archivo del disco duro.

---

## ⚠️ Después de publicar: avísale a Supabase

Supabase solo manda a la gente de regreso a direcciones que conoce. Si no se
apunta la nueva, el correo la manda a `localhost:3000` y se queda fuera.

**supabase.com/dashboard** → tu proyecto → **Authentication** →
**URL Configuration**:

| Campo | Qué poner |
|---|---|
| **Site URL** | `https://loquesalga.netlify.app` |
| **Redirect URLs** | `https://loquesalga.netlify.app/**` |

El `/**` del final importa: deja volver a cualquier parte del sitio.

---

## Si sí puedes usar la terminal

Entonces `localhost` sí es opción, y casi siempre falla por una de tres:

| Lo que ves | Qué pasa |
|---|---|
| «No se puede acceder a este sitio» | No hay servidor. Falta `npm start` |
| La terminal dice `EADDRINUSE` | Ya hay algo en el 3000. `PORT=3001 npm start` |
| `npm: no se reconoce...` | Falta Node.js: [nodejs.org](https://nodejs.org) |

El servidor hay que **dejarlo abierto**. Si se cierra la terminal, la
dirección deja de existir.

---

## Lo que NO cambia al publicar

- Los datos siguen en Supabase, con RLS. No viajan en el archivo.
- La llave `anon` va dentro del HTML **a propósito**: para eso es. La que
  nunca puede ir es `service_role`, y `build.py` se detiene si aparece.
- El chat sin llaves de IA responde con su motor local. Igual que en
  `localhost`.
