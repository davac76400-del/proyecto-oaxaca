---
name: pruebas-flujos-sin-red
description: Cómo probar flujos de app web que dependen de Supabase cuando el entorno remoto no tiene salida a internet - mocks con Playwright, pruebas de reglas con SQL por MCP, lectura de logs, capturas en tira con ffmpeg y errores típicos de shell. Úsala antes de decir que un flujo de login, registro o formulario funciona.
---

# Probar sin red (y sin mentir)

## Hechos del entorno
- Desde el contenedor `curl https://<proyecto>.supabase.co/...` devuelve código `000` (sin salida). Para hablar con Supabase usar el **MCP de Supabase** (`execute_sql`, `query_logs`, `apply_migration`, `deploy_edge_function`, `get_advisors`), no `curl`.
- Chromium ya está en `/opt/pw-browsers`; no correr `playwright install`.
- El usuario solo puede abrir archivos dentro del directorio de trabajo principal; si algo es para copiar (HTML de plantilla, SQL), **pegarlo en el chat**.
- Nunca decir «ya funciona» si solo compiló. Decir qué se probó (simulado) y qué falta probar con servicios reales.

## Qué probar y con qué
| Cosa | Herramienta |
|---|---|
| Tipos | `npx tsc --noEmit -p .` (salida vacía = bien) |
| Build | `npx vite build` |
| Reglas del servidor | `execute_sql` con `unnest(array[...])` llamando a la función con casos buenos y malos |
| Flujo completo de pantalla | Playwright + `page.route` simulando Supabase |
| Error real de producción | `query_logs` sobre `auth_logs` |
| Seguridad de tablas/funciones | `get_advisors` tipo `security` tras cada migración |

## Mocks de Supabase con Playwright (esqueleto)
```js
const CORS = { 'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'*' };
await page.route(/dns\.google/, r => r.fulfill({status:200, headers:CORS, contentType:'application/json',
  body: JSON.stringify({Status:0, Answer:[{data:'mx'}]})}));
await page.route(/supabase\.co/, async r => {
  const req = r.request(), url = req.url();
  if (req.method()==='OPTIONS') return r.fulfill({status:204, headers:CORS});   // preflight
  const body = JSON.parse(req.postData()||'{}');
  const J = (s,o)=>r.fulfill({status:s, headers:CORS, contentType:'application/json', body:JSON.stringify(o)});
  if (url.includes('/auth/v1/otp'))    return J(200,{});
  if (url.includes('/auth/v1/verify')) return body.token==='12345678' || body.token_hash ? J(200, session) : J(403,{error_code:'otp_expired',msg:'Token has expired or is invalid'});
  if (url.includes('/auth/v1/user'))   return J(200,user);
  if (url.includes('rpc/mi_perfil'))   return J(200, perfil?[perfil]:[]);
  if (url.includes('rpc/usuario_disponible')) return J(200, body.p_usuario!=='Ocupado1');
  if (url.includes('rpc/guardar_perfil')) { perfil={usuario:body.p_usuario,pin:body.p_pin}; return r.fulfill({status:204,headers:CORS}); }
  if (url.includes('functions/v1/entrar'))   return body.pin==='1234' ? J(200,{token_hash:'th',usuario:body.usuario}) : J(401,{error:'Usuario o contraseña incorrectos.'});
  return J(200,[]);
});
```
Detalles que importan:
- Responder el `OPTIONS` o el navegador bloquea las llamadas (CORS).
- `rpc` que devuelve `void` → `204` sin cuerpo.
- Simular latencia en `/verify` (≈1400 ms) para poder capturar la animación a mitad.
- Mock de `dns.google` para que `checkEmail` no dependa de internet.
- Guardar las peticiones en un `log` y revisar al final que cada paso llamó al endpoint correcto con el cuerpo esperado.

## Qué cubrió el guion `flow.cjs` (modelo a repetir)
Crear cuenta (correo con typo → aviso, código malo → error y casillas limpias, código bueno), usuario inválido/ocupado/libre, PIN con letras (ignora), crear, login con usuario inexistente / PIN malo / PIN bueno, recuperación → ver datos → modificar → entrar. Capturas en 390×800 móvil y revisión visual de cada una.

## Ver varias capturas de una vez
```bash
ffmpeg -y -i a.png -i b.png -i c.png -filter_complex "[0][1][2]hstack=inputs=3,scale=1560:-1" -frames:v 1 montaje.png
```

## Errores de shell que nos pasaron
- `pkill -f "vite --port 5199"` mató también la shell de la herramienta (el patrón coincide con su propia línea de comando; salió con código 144). Guardar el PID al lanzar (`vite & echo $! > pid`) y `kill $(cat pid)`.
- Leer una captura con `Read` y mirar la imagen; no inferir la pantalla por el código.
- Después de editar CSS con el servidor de desarrollo activo no hace falta reiniciar; volver a correr el guion.

## Cierre
Reportar: qué pasó en simulación, qué no se pudo comprobar (correo real, Vercel) y pedir al usuario la prueba real con su correo.
