---
name: publicar-en-vercel
description: Conecta un repo de GitHub a Vercel para que el link público muestre siempre la última versión, y diagnostica por qué "subí cambios y el link no se actualiza". Úsala al publicar una app web, cuando el enlace de producción muestra una versión vieja, o cuando el preview funciona pero el link público no.
---

# Publicar en Vercel y que el link siempre esté al día

Aprendido en OaxIntegra IA: el código estaba en GitHub, el build pasaba, y el link público seguía viejo por días.

## Conceptos que hay que tener claros

| Cosa | Qué es |
|---|---|
| **Production** | El link fijo que ve el público (`proyecto-xxx.vercel.app`). Solo se actualiza con la **rama de producción**. |
| **Preview** | Un link por cada rama/commit (`proyecto-git-<rama>-<usuario>.vercel.app`). Funciona, pero el público no lo ve. |
| **Rama de producción** | Por defecto `main`. Si trabajas en otra rama, sus cambios NUNCA llegan a producción solos. |

Síntoma clásico: "en mi link sí jala, en el público no" → estás viendo un **preview**.

## Configuración mínima que funciona

`vercel.json` en la raíz:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "git": { "productionBranch": "main" }
}
```

- `package.json` con script `build` y `"engines": { "node": ">=18" }`.
- Commitear `package-lock.json` (build determinista).
- Funciones serverless: archivos en `/api/*.js` → quedan en `/api/<nombre>`. Exportan `module.exports = async (req, res) => {...}`.
- Llaves secretas: **Project Settings → Environment Variables**, nunca en el repo.

## Diagnóstico: "el link no se actualiza"

Revisa en este orden y para en el primero que falle:

1. **¿El cambio está en `main`?** `git log origin/main --oneline -5`. Si está solo en tu rama: merge a `main` (o PR) y push.
2. **¿Hay archivos que confunden el runtime?** `runtime.txt`, `requirements.txt`, `Pipfile` en la raíz hacen que Vercel crea que es Python aunque el build sea Node. Bórralos si el proyecto es Node.
3. **¿El build pasa local?** `npm ci && npm run build`. Si truena local, truena en Vercel.
4. **¿Vercel recibió el push?** Dashboard → Deployments. Si no hay deploy nuevo del commit: el webhook de GitHub falló → botón **Redeploy** del último, o Settings → Git → reconectar el repo.
5. **¿El deploy quedó como Preview y no Production?** En el deploy: menú `⋯` → **Promote to Production**.
6. **¿Falló el deploy?** Abre **Deploy Logs**; el error real está al final.
7. **Caché del navegador:** Ctrl+Shift+R o ventana privada antes de concluir que "no cambió".

## Verificar qué versión está viva

- En el deploy de Production, la sección **Source** muestra el commit (`f384a6d ...`). Compáralo con `git log origin/main -1`.
- Truco: poner la fecha/commit del build en un comentario HTML o en `/api/estado` para verlo desde el navegador.

## Qué puede hacer Claude y qué no

- Claude **sí** puede: arreglar código/config, commitear y pushear a la rama correcta.
- Desde un entorno remoto, la API de Vercel suele estar bloqueada. Los botones **Redeploy / Promote** los hace el usuario en el dashboard. Dar la ruta exacta de clics.

## Checklist final

- [ ] Cambios en `main`
- [ ] `vercel.json` con `productionBranch`
- [ ] Sin archivos de otro runtime
- [ ] Build local OK
- [ ] Deploy en estado **Ready** y marcado **Production**
- [ ] Link público probado en ventana privada
