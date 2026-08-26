# 06_INFRAESTRUCTURA

Lo que te deja dormir.

- `hostinger-vps/` — **Coolify** es la mejor recomendación de todo el arsenal:
  instalas n8n, Chatwoot y las webs de clientes desde una pantalla, con SSL
  automático.
- `monitoreo/` — **no vendas "24/7" sin Uptime Kuma instalado.** Tienes que
  enterarte antes que el cliente.
- `runbooks/` — uno por servicio, una cuartilla, formato "si pasa X, haz Y".

## Escríbelos ahora, no cuando se caiga

Cuando se cae un bot un sábado a las 11 de la noche y el hotel te está marcando, no
vas a estar en condiciones de improvisar.

Mínimos: bot que no responde · se acabó el saldo de WhatsApp o Meta rechazó una
plantilla · VPS lleno de disco · restaurar cliente desde respaldo · se cayó el
proveedor del modelo.

Para el último ya tienes el patrón correcto: la cadena Llama → Gemini → local de
OaxIntegra IA. Repítela en cada bot de cliente.

> La diferencia entre un freelance y un proveedor serio no es el código: es tener
> respuesta a las 11 de la noche del sábado. Eso justifica el componente (B) de tu
> fórmula de precios.
