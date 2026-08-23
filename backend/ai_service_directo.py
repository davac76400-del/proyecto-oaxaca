#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
OaxIntegra IA — Servicio de IA en Python
=========================================
Backend mínimo con FastAPI que sirve de puente entre la página y la IA.
Mantiene la clave de API en el servidor (segura, no expuesta al navegador)
y resuelve CORS de una vez por todas.

INSTALAR:
    pip install fastapi uvicorn httpx

CONFIGURAR:
    export OPENAI_API_KEY="sk-..."       # o ANTHROPIC_API_KEY
    export PROVEEDOR="openai"            # openai | anthropic | groq | deepseek

CORRER:
    uvicorn ai_service_directo:app --host 0.0.0.0 --port 8000

USAR DESDE LA APP:
    En app.src.html, cambia:
        WEBHOOK_ASISTENTE: 'http://localhost:8000/chat'
    (o la URL pública donde lo despliegues)

DESPLEGAR GRATIS: Render, Railway, Fly.io o Deta aceptan FastAPI directo.
"""

import os
from typing import Optional

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ---------------------------------------------------------------------------
# Configuración
# ---------------------------------------------------------------------------
PROVEEDOR = os.getenv("PROVEEDOR", "openai")

CLAVES = {
    "openai":    os.getenv("OPENAI_API_KEY", ""),
    "anthropic": os.getenv("ANTHROPIC_API_KEY", ""),
    "groq":      os.getenv("GROQ_API_KEY", ""),
    "deepseek":  os.getenv("DEEPSEEK_API_KEY", ""),
}

MODELOS = {
    "openai":    "gpt-4o-mini",
    "anthropic": "claude-3-5-haiku-20241022",
    "groq":      "llama-3.3-70b-versatile",
    "deepseek":  "deepseek-chat",
}

ENDPOINTS = {
    "openai":    "https://api.openai.com/v1/chat/completions",
    "anthropic": "https://api.anthropic.com/v1/messages",
    "groq":      "https://api.groq.com/openai/v1/chat/completions",
    "deepseek":  "https://api.deepseek.com/chat/completions",
}

TIEMPO_LIMITE = 25.0


# ---------------------------------------------------------------------------
# Prompt maestro — la personalidad de OaxIntegra IA
# ---------------------------------------------------------------------------
def prompt_maestro(giro: str = "", usuario: str = "") -> str:
    giro = giro or "un negocio pequeño"
    usuario = usuario or "el emprendedor"
    return f"""Eres el asistente de OaxIntegra IA, una plataforma hecha para emprendedores
oaxaqueños tradicionales: artesanos, mezcaleros, cocineras, comerciantes y
gente del turismo en Oaxaca, México.

CON QUIÉN HABLAS:
- Se llama {usuario} y su negocio es de: {giro}.
- Puede tener poca práctica con la tecnología y algo de desconfianza hacia ella.
- Valora profundamente su cultura y su oficio.

CÓMO DEBES HABLAR:
- Español mexicano cálido, cercano y respetuoso. Como un ayudante de confianza.
- PROHIBIDO usar tecnicismos: nunca digas "prompt", "token", "IA generativa",
  "endpoint", "algoritmo", "input". Di "escríbeme", "tu mensaje", "la máquina".
- Frases cortas. Nada de párrafos densos.

QUÉ DEBES ENTREGAR:
- SIEMPRE material listo para usar, no consejos vagos.
- Si pide una publicación: escríbela completa, lista para copiar y pegar.
- Si pregunta por precios: da un rango concreto, explicado en lenguaje simple.
- Si pide una descripción de producto: escríbela con el habla de la región.
- Usa ejemplos de SU giro ({giro}), no ejemplos genéricos.

RESPETO CULTURAL:
- La IA acompaña y ayuda, NUNCA reemplaza el trabajo artesanal.
- Valora el oficio tradicional. Nunca sugieras industrializar ni abaratar
  lo hecho a mano.

LARGO: máximo 200 palabras, salvo que pidan explícitamente más."""


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(title="OaxIntegra IA — servicio de IA")

# CORS abierto: esto resuelve el problema que n8n no resolvía
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["POST", "OPTIONS", "GET"],
    allow_headers=["*"],
)


class Peticion(BaseModel):
    message: str
    username: Optional[str] = "invitado"
    code: Optional[str] = ""
    businessType: Optional[str] = ""
    phone: Optional[str] = "No proporcionado"
    origen: Optional[str] = "oaxintegra"


def _armar(consulta: str, sistema: str):
    """Devuelve (url, headers, body) según el proveedor activo."""
    clave = CLAVES.get(PROVEEDOR, "")
    modelo = MODELOS[PROVEEDOR]
    url = ENDPOINTS[PROVEEDOR]

    if PROVEEDOR in ("openai", "groq", "deepseek"):
        return url, {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {clave}",
        }, {
            "model": modelo,
            "max_tokens": 900,
            "messages": [
                {"role": "system", "content": sistema},
                {"role": "user", "content": consulta},
            ],
        }

    if PROVEEDOR == "anthropic":
        return url, {
            "Content-Type": "application/json",
            "x-api-key": clave,
            "anthropic-version": "2023-06-01",
        }, {
            "model": modelo,
            "max_tokens": 900,
            "system": sistema,
            "messages": [{"role": "user", "content": consulta}],
        }

    raise ValueError(f"Proveedor no reconocido: {PROVEEDOR}")


def _extraer(d: dict) -> str:
    """Extractor universal del texto, sirva el proveedor que sirva."""
    if not d:
        return ""
    if isinstance(d, str):
        return d
    # OpenAI / Groq / DeepSeek
    try:
        return d["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError):
        pass
    # Anthropic
    try:
        return "".join(b["text"] for b in d["content"] if b.get("type") == "text")
    except (KeyError, TypeError):
        pass
    # genéricos
    for k in ("output", "respuesta", "reply", "text", "message", "answer", "result"):
        v = d.get(k)
        if isinstance(v, str) and v.strip():
            return v
    return ""


@app.get("/")
def salud():
    return {"ok": True, "proveedor": PROVEEDOR, "modelo": MODELOS.get(PROVEEDOR)}


@app.post("/chat")
async def chat(p: Peticion):
    """
    Recibe exactamente el mismo payload que la app mandaba a n8n,
    así no hay que cambiar nada en el frontend salvo la URL.
    """
    sistema = prompt_maestro(p.businessType, p.username)
    url, headers, body = _armar(p.message, sistema)

    try:
        async with httpx.AsyncClient(timeout=TIEMPO_LIMITE) as cliente:
            r = await cliente.post(url, headers=headers, json=body)
            r.raise_for_status()
            texto = _extraer(r.json())
        return {"output": texto}
    except httpx.TimeoutException:
        return {"output": "", "error": "La IA tardó demasiado en responder."}
    except Exception as e:  # noqa: BLE001
        return {"output": "", "error": f"No pude contactar a la IA: {e}"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
