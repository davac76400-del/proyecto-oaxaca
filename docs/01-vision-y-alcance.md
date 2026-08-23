# Visión y alcance — OaxIntegra IA

## Propósito exacto

OaxIntegra IA es un **Hub de Innovación Cultural y Tecnológica para Oaxaca**.
Su función es ser un **"Puente de Confianza"** entre la tradición oaxaqueña y la
Inteligencia Artificial.

No es un chatbot genérico. Es una herramienta que toma a un artesano que teje
rebozos en telar de pedal, o a un productor de mezcal de palenque, y le entrega
material listo para usar en su negocio —una publicación para vender, un precio
sugerido, una descripción de producto— **sin pedirle que aprenda tecnicismos**.

## El público real

- Empresario/emprendedor oaxaqueño **tradicional**
- Apegado a su cultura, a veces **reacio o desconfiado** de la tecnología
- Puede tener poca práctica con computadoras
- Vende: artesanías, alebrijes, textiles, mezcal, comida, turismo

**Implicación de diseño:** cada texto de la interfaz está escrito como se lo
explicarías a un tío que nunca usó IA. Nada de "prompt", "endpoint", "token".
Se dice "escríbele", "tu código", "tu plática".

## Tono de la plataforma

Cálido, familiar, culturalmente reverente. La IA se presenta como **aliada
("Nahual", acompañante)**, nunca como reemplazo del trabajo artesanal.

Ejemplo del saludo real que da el asistente:
> "Escríbeme como le hablarías a tu ayudante: dime qué vendes y qué necesitas
> resolver, y te lo dejo listo para usar."

## Qué hace la plataforma (funciones entregadas)

1. **Portada de acceso** que bloquea todo hasta registrarse o iniciar sesión
2. **Cuentas locales** por usuario + código de 6 dígitos (sin correo, sin contraseña larga)
3. **Asistente de chat con IA** que responde con ejemplos del giro del usuario
4. **Historial de conversaciones múltiples** por cuenta (nueva, cambiar, borrar)
5. **4 tarjetas de solución** con ejemplos clicables:
   - Estrategia y Redacción
   - Investigación y Crecimiento
   - Diseño Creativo
   - Guía de Formalización
6. **Tarjetas de publicación** — la respuesta de la IA sale con formato listo para
   copiar y publicar, con imagen y botones de acción
7. **Tutorial integrado**: video de YouTube + guía de texto sobre cómo usar IA
8. **Modo día / noche** con preferencia recordada
9. **Módulo de iniciativa de ley** (contenido cívico)
10. **Contacto** por WhatsApp y formulario

## Relación con otros proyectos del autor

- **HoStudyQuestor** (`/relacionado/`): plataforma educativa, proyecto hermano
  que comparte estética y arquitectura. Es un proyecto **separado**.
- **Laboratorio de Emprendimiento de IA para Emprendedores Oaxaqueños**:
  iniciativa de política pública del autor; es fuente de contenido para el
  módulo de iniciativa de ley dentro de esta app.

## Alcance NO incluido (decisiones tomadas)

- Sin backend propio: todo vive en el navegador (localStorage)
- Sin base de datos real (hay esquema propuesto en `backend/schema.sql`)
- Sin pagos ni suscripciones
- Sin Facebook ni Instagram (decisión explícita: solo WhatsApp)
- Sin registro por correo electrónico (decisión: usuario + código numérico)
