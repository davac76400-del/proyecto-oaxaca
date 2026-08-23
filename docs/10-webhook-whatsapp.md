# El webhook de WhatsApp

Servidor que **recibe** lo que la gente le escribe al WhatsApp del negocio:
textos y fotos. Las fotos las baja de verdad y las guarda.

Vive en la raíz del proyecto y es **independiente** del resto: no toca la app
ni el servidor de la IA. Puedes correrlo o no, sin afectar nada.

> No confundir con `backend/otp-core.js`, que **manda** los códigos de
> verificación. Este es el otro lado: el que **escucha**.

---

## Arrancarlo

```bash
npm install          # solo la primera vez
cp .env.example .env # y pon tus datos
npm start            # servidor en el puerto 8080
```

Al arrancar te imprime en la terminal, dentro de un recuadro, **la dirección
y el token exactos** que tienes que pegar en Meta.

---

## Para que Meta lo alcance: necesitas una dirección https pública

Meta **no acepta** `http://localhost`. Tienes tres caminos:

### A · ngrok (lo más rápido para probar)

```bash
# 1. Saca tu authtoken gratis:
#    https://dashboard.ngrok.com/get-started/your-authtoken
# 2. Ponlo en el .env:  NGROK_AUTHTOKEN=2abc...
npm run tunel
```

Levanta el túnel solo y te imprime la URL pública, ya lista para pegar.

**Ojo:** con la cuenta gratuita la dirección **cambia cada vez que reinicias**,
y hay que volver a pegarla en Meta. Para algo permanente, usa el camino C.

**Si falla con «tls handshake error»**, no es tu token: es la red. Un proxy,
un firewall o el wifi de una oficina o escuela está bloqueando la salida a
ngrok. Pruébalo desde otra red, o usa el camino B o C.

### B · Cloudflare Tunnel (gratis, sin cuenta)

```bash
cloudflared tunnel --url http://localhost:8080
```

Te da una dirección `https://loquesea.trycloudflare.com`. Pégala en el `.env`
como `URL_PUBLICA` y el recuadro de la terminal te imprime la Callback URL ya
armada, sin que tengas que pegarle el `/webhook` a mano:

```bash
URL_PUBLICA=https://loquesea.trycloudflare.com
```

Sirve igual para Railway, Render o Fly.io.

### C · Publicarlo de verdad ⭐ para cuando ya funcione

Sube el proyecto a **Railway**, **Render** o **Fly.io**. Te dan un
dominio fijo con https, y ya no tienes que volver a tocar la configuración de
Meta.

---

## Conectarlo en Meta

1. Entra a **developers.facebook.com** → tu app → **WhatsApp** →
   **Configuration** → **Webhook** → **Edit**
2. Pega lo que te imprimió la terminal:
   - **Callback URL:** `https://loquesea.ngrok-free.app/webhook`
   - **Verify token:** `oax_token_secreto_2026`
3. Pulsa **Verify and save**
4. Abajo, en **Webhook fields**, suscríbete a **`messages`**

Si el token no coincide, la terminal te lo dice y te muestra los dos, para que
veas exactamente dónde está la diferencia.

---

## Lo que hace con cada mensaje

| Llega | Qué pasa |
|---|---|
| **Texto** | Contesta con el saludo. Si dice «huipil», manda fotos verificadas. |
| **Foto** | La baja, la guarda en `media/` y confirma el peso. |
| Otra cosa | Avisa que por ahora entiende textos y fotos. |

### Bajar una foto son DOS pasos, no uno

Es el tropiezo más común con esta API. Meta **no** te da la foto directa:

1. Le preguntas por el id → te devuelve una **dirección temporal**
2. Abres esa dirección **mandando el token otra vez**

Si intentas abrirla en el navegador sin el token, te sale error y parece que
todo está roto. No lo está: le falta el token.

```js
const bajada = await wa.descargarMedia(idDeLaFoto);
// → { ruta, nombre, mime, bytes, sha256 }
```

---

## Los huipiles

`lib/huipiles.js` busca fotos, **comprueba que sean de Oaxaca de verdad**, las
recorta a 1200×788 (el formato de las tarjetas de la app) y escribe los
créditos.

```bash
npm run huipiles        # busca 3
node lib/huipiles.js 5  # busca 5
```

De cada foto comprueba tres cosas, y si falla una la rechaza diciendo por qué:

1. Que la descripción **mencione Oaxaca** o un pueblo/lengua de allá —
   Yalálag, Huazolotitlán, Juchitán, Tehuantepec, Mitla, Teotitlán, Coyotepec,
   Pinotepa, zapoteco, mixteco, amuzgo, mixe, triqui, chinanteco…
2. Que la **licencia permita usarla** (Creative Commons o dominio público)
3. Que **se sepa quién la tomó**, para darle crédito

Probado con casos reales:

| Caso | Resultado |
|---|---|
| Huipil de Yalálag, CC BY-SA, con autor | ✅ acepta |
| Huipil de Zinacantán, **Chiapas** | 🚫 rechaza: no confirma Oaxaca |
| Huipil maya de **Guatemala** | 🚫 rechaza: no confirma Oaxaca |
| Huipil de Juchitán, «All rights reserved» | 🚫 rechaza: licencia no permitida |
| Textil de Teotitlán **sin autor** | 🚫 rechaza: hay que dar crédito |

**Por qué tan estricto:** los diseños no son adorno, **identifican al pueblo
que los teje**. Un huipil de Yalálag no es uno de Pinotepa. Confundirlos es
faltarle al respeto a quien lo hizo, y peor todavía en una página que habla
justo de autenticidad cultural.

### De dónde busca

- **Wikimedia Commons** (por defecto) — no necesita llaves y entrega licencia
  y autor comprobables. Es la fuente recomendada.
- **Google Custom Search** (opcional) — necesita `GOOGLE_API_KEY` y
  `GOOGLE_CX`. Google **no entrega licencia ni autor fiables**, así que lo que
  venga de ahí se marca como «revisar a mano» y no se da por bueno solo.

**No se hace scraping del buscador**: va contra sus términos y se rompe cada
dos semanas cuando cambian el HTML.

---

## Seguridad

### La firma de Meta

Meta firma cada aviso con tu **App Secret**. El servidor lo comprueba antes de
hacerle caso a nada.

```bash
# developers.facebook.com → tu app → Configuración → Básica → Clave secreta
WHATSAPP_APP_SECRET=...
```

**Sin esto, cualquiera que sepa tu dirección puede inventarse mensajes** a
nombre de quien quiera. El servidor arranca igual pero te avisa en amarillo.
Ponlo antes de dejarlo publicado.

### Lo demás que ya está cuidado

- Se le contesta a Meta con 200 **de inmediato**, y el trabajo se hace después.
  Si tardas, Meta reintenta y te llega el mismo mensaje una y otra vez.
- Los mensajes repetidos se detectan por su id y se saltan.
- El nombre de archivo se limpia: nunca se deja que un dato de fuera decida
  una ruta del disco.
- Tope de 25 MB por archivo, que es el máximo de WhatsApp.
- El `.env` está en `.gitignore`. Igual que `media/` y `huipiles/`: no tiene
  sentido subir a GitHub las fotos que manda la gente.

---

## Si algo no funciona

| Lo que ves | Qué pasa |
|---|---|
| Meta dice «The callback URL couldn't be validated» | El token no coincide, o tu dirección no es https, o el servidor no está corriendo. Mira la terminal: te dice cuál de los tres. |
| Llega el mensaje pero no baja la foto | Falta `WHATSAPP_TOKEN` o venció. Los de prueba duran 24 horas. |
| «El puerto 8080 ya está ocupado» | Dejaste otro servidor corriendo. `PORT=8090 npm start` |
| Te llega el mismo mensaje muchas veces | Estás tardando en responder a Meta. El servidor ya responde primero y trabaja después, así que revisa si algo lo está bloqueando. |
| No encuentra huipiles | Sin internet o detrás de un proxy que bloquea Wikimedia. Lo dice en la terminal. |

### Ver si está vivo

```bash
curl http://localhost:8080/salud
```

Te dice qué está configurado y qué falta, sin enseñar ninguna credencial.

---

## Lo que probé y lo que no

**Probado aquí, funcionando:**

- La comprobación de Meta: con el token correcto devuelve el `hub.challenge`;
  con uno equivocado, 403
- La firma: un POST sin firma válida se rechaza con 403
- Un mensaje de texto → responde
- Un mensaje con foto → **los dos pasos de descarga con token** → guarda el
  archivo → responde. Comprobado que el archivo guardado es una imagen válida.
- El filtro de huipiles con los 7 casos de la tabla de arriba
- El recorte con sharp: 600×1400 → 1200×788
- El puerto ocupado y el ngrok sin token: los dos con mensaje entendible

**No pude probar aquí:**

- **El túnel de ngrok.** La máquina donde corro solo tiene permitido salir a
  GitHub y a npm. Todo lo demás responde `000`: ngrok, Cloudflare y hasta
  `graph.facebook.com`. Con el authtoken puesto, ngrok llega a intentarlo
  («Levantando el túnel…») y muere en «tls handshake error». El código está
  bien y funcionará en tu computadora, pero **la URL pública tienes que verla
  tú** cuando lo corras.
- **La conexión real con Meta**, porque hace falta tu token de verdad.
- **La búsqueda real de huipiles**, por el mismo bloqueo de red. Lo que sí
  verifiqué fue el filtro, que es la parte que decide.
