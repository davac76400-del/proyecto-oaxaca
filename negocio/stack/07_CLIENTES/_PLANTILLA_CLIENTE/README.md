# Plantilla de cliente

Copia esta carpeta completa por cada cliente nuevo:

```bash
cp -r _PLANTILLA_CLIENTE ../nombre-del-cliente
```

| Carpeta | Qué va aquí |
|---|---|
| `descubrimiento/` | `NUMEROS-DEL-ANTES.md` lleno. **Empieza siempre aquí.** |
| `entregables/` | Lo que se le entrega: workflows, web, base de conocimiento |
| `credenciales/` | **VACÍA.** Está en `.gitignore`. Las llaves van al gestor. |
| `facturacion/` | Contrato firmado, facturas, comprobantes |
| `soporte/` | Incidencias, runbook específico, historial de cambios |

## Orden que no se altera

1. Números del antes → 2. Contrato firmado → 3. Anticipo cobrado →
4. Construcción → 5. Medición del después → 6. Caso de éxito

**Si te saltas el 2 y el 3, el 6 nunca llega.**
