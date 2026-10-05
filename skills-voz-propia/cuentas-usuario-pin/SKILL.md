---
name: cuentas-usuario-pin
description: Sistema de cuentas con correo verificado por código + nombre de usuario único + contraseña de 4 números, con inicio de sesión por usuario y recuperación por correo, sobre Supabase. Úsala al crear o modificar registro/login, tablas de perfiles, funciones RPC, Edge Function de entrada, límite de intentos o recuperación de usuario y contraseña.
---

# Cuentas: correo (una vez) + usuario único + PIN de 4 números

## Idea
1. El **correo se verifica una sola vez** con código OTP de Supabase Auth (ver skill `email-verification`).
2. Después la persona crea **usuario** (paso 1/2) y **contraseña de 4 números** (paso 2/2).
3. Para entrar de nuevo: **usuario** (1/2) y **PIN** (2/2). No se vuelve a pedir correo.
4. «No recuerdo mi usuario o contraseña»: correo → código → se muestran usuario y PIN, con opción de modificarlos.

## Reglas del usuario (acordadas con David)
5 a 10 caracteres · solo letras, números, `-` y `_` · mínimo **5 letras** · una minúscula · una mayúscula · un número, `-` o `_` · único sin importar mayúsculas.
Ambigüedad: «min 5 letras» se tomó literal (5 letras, sin contar números). `Dav1d` no pasa, `Davi1d` sí. Si la persona quería 5 caracteres, cambiar la regla `letters`.
La contraseña son exactamente 4 dígitos.
Las reglas viven en DOS lugares y deben ser idénticas: `USER_RULES` (cliente, para mostrar la lista en vivo) y `public.usuario_valido()` (servidor, la que manda).

## Base de datos (migración aplicada)
```sql
create table public.perfiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  usuario text not null,
  pin text not null check (pin ~ '^[0-9]{4}$'),
  intentos int not null default 0,
  bloqueado_hasta timestamptz,
  creado timestamptz not null default now()
);
create unique index perfiles_usuario_uq on public.perfiles (lower(usuario));
alter table public.perfiles enable row level security;
revoke all on public.perfiles from anon, authenticated;   -- sin policies a propósito
```
Funciones `security definer` con `set search_path = ''`:
- `usuario_valido(text)` · `usuario_disponible(text)` (anon + authenticated, para el aviso en vivo)
- `mi_perfil()` → `(usuario, pin)` de `auth.uid()` (solo authenticated)
- `guardar_perfil(p_usuario, p_pin)` → inserta/actualiza; errores `usuario_ocupado`, `usuario_invalido`, `pin_invalido`, `sin_sesion`
Después de crear funciones: `revoke execute ... from anon` en las que no deben ser públicas (Supabase da EXECUTE a anon por defecto). Revisar con `get_advisors(security)`.

## Entrar con usuario + PIN: Edge Function `entrar` (verify_jwt = false)
Desde SQL no se puede crear una sesión, así que la función (con service role):
1. Busca el perfil por usuario (`ilike` escapando `% _ \`). Si no existe: 401 con mensaje genérico «Usuario o contraseña incorrectos.»
2. Si `bloqueado_hasta` está en el futuro: 429.
3. PIN mal → `intentos+1`; al 5.º se bloquea 15 min.
4. PIN bien → resetea intentos, `admin.getUserById`, `admin.generateLink({type:'magiclink', email})` y devuelve `{token_hash, usuario}`.
5. El cliente llama `supabase.auth.verifyOtp({ token_hash, type: 'magiclink' })` y queda con sesión real. El correo nunca viaja al navegador.
Desplegada con el MCP de Supabase (`deploy_edge_function`, `verify_jwt:false` porque quien llama aún no tiene sesión; la seguridad es el límite de intentos).

## Cliente (`src/core/auth.ts`)
`requestCode(email, crear)` · `verifyCode(email, code)` (devuelve perfil o null) · `miPerfil()` · `usuarioDisponible()` · `usuarioExiste()` · `guardarPerfil()` · `abrirSesion()` · `entrarConPin()` · `checkEmail()` · `signOut()`.
- `shouldCreateUser: true` solo al crear cuenta; en login/recuperación `false` (si no existe, Supabase responde «Signups not allowed» → «Ese correo no está registrado.»).
- La sesión de la app (`voz-propia:sesion`) guarda solo `{kind, name: usuario, email}`; si Supabase ya no tiene sesión se cierra la local.
- Errores de Edge Function: `error.context.json()` trae el `{error}` legible.

## Casos de borde ya cubiertos
- Verificó el correo pero abandonó antes de crear usuario → al volver a verificar, `mi_perfil()` es null y se le lleva al paso 1/2.
- Intenta «crear» con correo que ya tiene cuenta → se le muestra «Ya tenías una cuenta» con sus datos.
- Usuario ocupado en el último instante (`usuario_ocupado`) → vuelve al paso 1/2 con el aviso.
- Modificar: si no cambió nada, avisa; si cambia solo el PIN, conserva el usuario.

## Decisiones de seguridad (y su costo)
- El PIN se guarda **legible** porque el requisito pide mostrarlo en la recuperación. Solo lo lee su dueño tras verificar el correo (RLS cerrado + RPC).
- 4 dígitos son 10 000 combinaciones: lo compensa el bloqueo por usuario (5 intentos / 15 min) y que la recuperación exige correo.
- Se puede saber si un usuario existe (`usuario_disponible` es público). Aceptado para la UX.
- Advisor restante esperado: «RLS enabled, no policy» en `perfiles` (intencional, ver `comment on table`).
- Si algún día se quiere PIN más fuerte o no legible: guardar hash (`crypt`) y quitar «mostrar contraseña».

## Probar
Ver skill `pruebas-flujos-sin-red` (mocks de Supabase con Playwright) y `ui-verificacion-animada` para la pantalla.
