# Día 1 con la Mac — lista de migración

**Principio: no es un reinicio, es una mudanza.** Todo lo que construiste el mes
anterior sigue corriendo en el VPS mientras haces esto. Si algo aquí falla, tus
clientes ni se enteran — que es exactamente el punto de haber empezado antes.

## Antes de tocar la Mac (hazlo el día previo)

- [ ] Todo commiteado y subido a GitHub, incluida la carpeta `negocio/`
- [ ] Credenciales de clientes en el gestor de contraseñas, **nunca en el repo**
- [ ] Respaldo del VPS verificado — *verificado* significa que restauraste uno de
      prueba, no que el script dijo "ok"
- [ ] Lista de llaves API a rotar (ver abajo)

## Bloque 1 — Base del sistema (1 h)

- [ ] Xcode Command Line Tools: `xcode-select --install`
- [ ] Homebrew
- [ ] `brew install git gh node python@3.12 docker uv ripgrep jq`
- [ ] Terminal de tu gusto (iTerm2 o Ghostty), shell y dotfiles
- [ ] Iniciar sesión en GitHub con la **identidad profesional nueva**

## Bloque 2 — Núcleo de IA (1 h)

- [ ] Instalar Claude Code, iniciar sesión con la cuenta profesional
- [ ] Clonar tus repos, incluido este
- [ ] Copiar `01_NUCLEO_IA/claude/plantillas-CLAUDE-md/` a su lugar
- [ ] Instalar servidores MCP (`02-ARSENAL-HERRAMIENTAS.md` § 01_NUCLEO_IA)
- [ ] Instalar tus 5 skills propios y verificar que cargan
- [ ] Instalar OpenClaw — **revisa su documentación oficial vigente**, no notas viejas
- [ ] Ollama + un modelo local, para aprovechar la máquina nueva

## Bloque 3 — Verificar que los clientes siguen vivos (30 min)

Esto va antes que cualquier cosa bonita:

- [ ] Entrar a Coolify y ver todos los servicios en verde
- [ ] Uptime Kuma sin alertas
- [ ] **Mandarle un WhatsApp real al bot del hotel y ver que conteste**
- [ ] Que un respaldo haya corrido en las últimas 24 h

## Bloque 4 — Rotación de llaves (45 min) 🔒

Si en el mes usaste llaves desde cuentas personales o las pegaste en algún lado
dudoso, este es el momento. No lo dejes "para después": las llaves de producción de
un cliente son responsabilidad tuya, no suya.

- [ ] Rotar llaves de proveedores de modelos
- [ ] Rotar tokens de Meta / WhatsApp
- [ ] Rotar llaves de Supabase de clientes
- [ ] Rotar llave de API de Cloudflare
- [ ] Confirmar que ninguna llave está en un repo (`git log -p | grep -i "api.key"`)
- [ ] Rotar llaves SSH del VPS y retirar las viejas de `authorized_keys`

## Bloque 5 — Herramientas de trabajo (1 h)

- [ ] Navegadores + extensiones (Lighthouse, validador de datos estructurados)
- [ ] VS Code o el editor que uses
- [ ] Figma / Canva para material de venta
- [ ] Gestor de contraseñas
- [ ] Herramienta de facturación CFDI
- [ ] Calendario y correo profesional

## Lo que NO haces el día 1

- ❌ Reconstruir lo que ya funciona en el VPS
- ❌ Cambiar de stack porque la máquina nueva "aguanta más"
- ❌ Instalar los 50 repos del arsenal "por si acaso" — instala lo que uses hoy,
      el resto está en el script cuando lo necesites
- ❌ Migrar clientes a la máquina nueva. **Los clientes viven en el servidor.
      Siempre.** Si algo de un cliente depende de tu laptop, eso es un error de
      arquitectura que hay que arreglar, no que migrar.

## Verificación final

```bash
claude --version          # Claude Code responde
docker ps                 # Docker vivo
ssh tu-vps "uptime"       # VPS accesible
# y el más importante:
# mándale un WhatsApp al hotel desde tu celular y espera respuesta
```

Si esos cuatro pasan, migraste bien. Cierra la laptop y vete a vender.
