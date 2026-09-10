---
description: Arranca el gateway OmniRoute y reporta el endpoint y el estado de los proveedores
---

Arranca OmniRoute y confirma que quedó operativo.

1. Comprueba si ya hay una instancia viva: `omniroute status` (si el comando falla porque no está instalado, indícalo y detente).
2. Si no está corriendo, arráncalo en segundo plano: `omniroute serve`.
3. Reporta al usuario, en no más de cinco líneas:
   - la URL del endpoint compatible con OpenAI,
   - la URL del dashboard,
   - cuántos proveedores quedaron configurados y cuántos responden.

Si el arranque falla, muestra la línea de error decisiva y la causa probable (puerto ocupado, falta `.env`, o falta de claves), sin volcar el log completo.
