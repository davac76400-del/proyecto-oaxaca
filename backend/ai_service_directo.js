/* ============================================================================
   ⚠️  ARCHIVO RETIRADO — NO LO USES
   ----------------------------------------------------------------------------
   Aquí vivía una versión que llamaba a la IA DESDE EL NAVEGADOR, con la llave
   de acceso escrita en el propio archivo. Eso significaba que cualquiera que
   abriera la página y mirara el código fuente podía leerse la llave y gastarla.

   Se retiró el 23 de agosto de 2026 por ese motivo, y para que nadie lo copie
   por error se dejó solo este aviso. El historial completo sigue en git.

   ----------------------------------------------------------------------------
   LO QUE DEBES USAR HOY
   ----------------------------------------------------------------------------
   La lógica de la IA vive ahora en el servidor, donde las llaves están a salvo:

     backend/ia-core.js        ← toda la lógica y las llaves (lado servidor)
     backend/servidor.js       ← para trabajar en tu computadora
     netlify/functions/ia.js   ← si publicas en Netlify
     api/ia.js                 ← si publicas en Vercel

   Las llaves se ponen en el archivo .env (mira .env.example), nunca en el
   código, y nunca en nada que llegue al navegador.

   Para arrancar:
       cp .env.example .env      # y pega tus llaves adentro
       node backend/servidor.js
       # abre http://localhost:3000

   Guía completa: docs/06-ia-directa.md
   ========================================================================= */

throw new Error(
  'backend/ai_service_directo.js fue retirado por seguridad. ' +
  'Usa backend/ia-core.js — mira docs/06-ia-directa.md.'
);
