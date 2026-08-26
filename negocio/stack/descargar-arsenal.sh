#!/usr/bin/env bash
# Descarga el arsenal en las carpetas correctas.
#
#   ./descargar-arsenal.sh esencial   # ~12 repos. Lo que usas el primer mes.
#   ./descargar-arsenal.sh completo   # todo el catalogo
#   ./descargar-arsenal.sh listar     # ver sin descargar
#
# Idempotente: si un repo ya esta, hace pull en vez de fallar.
# Clona superficial (--depth 1): es para leer y usar, no para contribuir.
#
# LEE PRIMERO la regla de seguridad en negocio/02-ARSENAL-HERRAMIENTAS.md.
# Un skill o plugin ejecuta codigo con tus permisos, en la misma maquina
# donde viven las credenciales de tus clientes.

set -uo pipefail
cd "$(dirname "$0")"

MODO="${1:-listar}"

# destino|repo|nivel
REPOS="
01_NUCLEO_IA/claude/skills|https://github.com/anthropics/skills|esencial
01_NUCLEO_IA/claude/mcp-servers|https://github.com/modelcontextprotocol/servers|esencial
01_NUCLEO_IA/claude/mcp-servers|https://github.com/czlonkowski/n8n-mcp|esencial
01_NUCLEO_IA/claude/mcp-servers|https://github.com/microsoft/playwright-mcp|esencial
01_NUCLEO_IA/claude/mcp-servers|https://github.com/upstash/context7|completo
01_NUCLEO_IA/claude/mcp-servers|https://github.com/cloudflare/mcp-server-cloudflare|completo
01_NUCLEO_IA/claude/mcp-servers|https://github.com/supabase-community/supabase-mcp|completo
01_NUCLEO_IA/modelos-locales|https://github.com/ollama/ollama|completo
01_NUCLEO_IA/modelos-locales|https://github.com/open-webui/open-webui|completo
02_CHATBOTS_Y_AUTOMATIZACION/n8n/docker|https://github.com/n8n-io/self-hosted-ai-starter-kit|esencial
02_CHATBOTS_Y_AUTOMATIZACION/n8n/docker|https://github.com/n8n-io/n8n|completo
02_CHATBOTS_Y_AUTOMATIZACION/motores-de-chat|https://github.com/chatwoot/chatwoot|esencial
02_CHATBOTS_Y_AUTOMATIZACION/motores-de-chat|https://github.com/baptisteArno/typebot.io|completo
02_CHATBOTS_Y_AUTOMATIZACION/motores-de-chat|https://github.com/FlowiseAI/Flowise|completo
02_CHATBOTS_Y_AUTOMATIZACION/motores-de-chat|https://github.com/langgenius/dify|completo
02_CHATBOTS_Y_AUTOMATIZACION/whatsapp/no-oficial-RIESGO|https://github.com/EvolutionAPI/evolution-api|completo
02_CHATBOTS_Y_AUTOMATIZACION/whatsapp/no-oficial-RIESGO|https://github.com/devlikeapro/waha|completo
02_CHATBOTS_Y_AUTOMATIZACION/rag-y-conocimiento|https://github.com/pgvector/pgvector|esencial
02_CHATBOTS_Y_AUTOMATIZACION/rag-y-conocimiento|https://github.com/qdrant/qdrant|completo
02_CHATBOTS_Y_AUTOMATIZACION/rag-y-conocimiento|https://github.com/mendableai/firecrawl|completo
03_WEBS_Y_RESERVAS/stacks|https://github.com/withastro/astro|esencial
03_WEBS_Y_RESERVAS/stacks|https://github.com/directus/directus|completo
03_WEBS_Y_RESERVAS/componentes-ui|https://github.com/shadcn-ui/ui|completo
03_WEBS_Y_RESERVAS/motores-de-reserva|https://github.com/calcom/cal.com|completo
04_GEO_Y_VISIBILIDAD/medicion-de-citas|https://github.com/harlan-zw/unlighthouse|completo
05_DATOS_E_INTELIGENCIA/scraping-tarifas|https://github.com/apify/crawlee|completo
05_DATOS_E_INTELIGENCIA/dashboards|https://github.com/metabase/metabase|completo
06_INFRAESTRUCTURA/hostinger-vps|https://github.com/coollabsio/coolify|esencial
06_INFRAESTRUCTURA/monitoreo|https://github.com/louislam/uptime-kuma|esencial
06_INFRAESTRUCTURA/monitoreo|https://github.com/henrygd/beszel|completo
06_INFRAESTRUCTURA/seguridad-y-respaldos|https://github.com/restic/restic|completo
00_COMANDO/legal|https://github.com/documenso/documenso|completo
"

ok=0; falla=0; saltado=0

while IFS='|' read -r destino repo nivel; do
  [ -z "${repo:-}" ] && continue
  nombre="$(basename "$repo")"
  ruta="$destino/$nombre"

  if [ "$MODO" = "listar" ]; then
    printf '  [%-8s] %-34s -> %s\n' "$nivel" "$nombre" "$destino"
    continue
  fi

  if [ "$MODO" = "esencial" ] && [ "$nivel" != "esencial" ]; then
    saltado=$((saltado+1)); continue
  fi

  if [ -d "$ruta/.git" ]; then
    echo "  ~ $nombre (ya esta, actualizando)"
    git -C "$ruta" pull --quiet --ff-only 2>/dev/null && ok=$((ok+1)) || falla=$((falla+1))
    continue
  fi

  echo "  + $nombre -> $destino"
  mkdir -p "$destino"
  if git clone --depth 1 --quiet "$repo" "$ruta" 2>/dev/null; then
    ok=$((ok+1))
  else
    echo "    ! fallo. Verifica a mano: $repo"
    falla=$((falla+1))
  fi
done <<< "$REPOS"

if [ "$MODO" = "listar" ]; then
  echo
  echo "  Nada descargado. Corre:  ./descargar-arsenal.sh esencial"
else
  echo
  echo "  OK: $ok   Fallaron: $falla   Saltados (no esenciales): $saltado"
  echo
  echo "  ANTES DE ACTIVAR CUALQUIER SKILL O PLUGIN:"
  echo "  pidele a Claude Code que revise que hace con la red y con tus archivos."
fi
