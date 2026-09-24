---
name: datos-campo-gratis
description: APIs gratuitas y sin llave para apps agrícolas en México - geocodificar municipios, clima y pronóstico, humedad y temperatura de suelo, evapotranspiración, historial de lluvia, datos satelitales de la NASA, grados-día y balance de agua. Úsala para cualquier función de clima, siembra o seguimiento de cultivos.
---

# Datos del campo gratis y sin llave

Todo esto corre desde el navegador (CORS abierto), sin registrarse. Usado en "Mi parcela" de OaxIntegra IA.

## 1. Municipio → coordenadas (Open-Meteo Geocoding)
```
https://geocoding-api.open-meteo.com/v1/search?name=<municipio, estado>&count=5&language=es&format=json&country=MX
```
Guardar en caché local: los municipios no se mueven.

## 2. Clima de la parcela (Open-Meteo)
```
https://api.open-meteo.com/v1/forecast?latitude=<lat>&longitude=<lon>
 &daily=precipitation_sum,precipitation_probability_max,temperature_2m_max,temperature_2m_min,et0_fao_evapotranspiration,shortwave_radiation_sum
 &hourly=soil_moisture_3_to_9cm,soil_temperature_6cm
 &current=temperature_2m,relative_humidity_2m,precipitation
 &timezone=America%2FMexico_City&past_days=7&forecast_days=7
```
- `past_days` hasta 92 → historial de lluvia de 30/90 días con el mismo endpoint.
- Respaldo: `https://wttr.in/<lat>,<lon>?format=j1` (sin suelo ni ET0) y luego caché. Ver skill `respaldo-en-cadena`.

## 3. Satélite NASA POWER (comunidad AG)
```
https://power.larc.nasa.gov/api/temporal/daily/point?parameters=ALLSKY_SFC_SW_DWN,T2M,PRECTOTCORR
 &community=AG&longitude=<lon>&latitude=<lat>&start=AAAAMMDD&end=AAAAMMDD&format=JSON
```
Tiene 2-3 días de retraso: pedir hasta "hoy - 3". Valor `-999` = sin dato.

## 4. Grados-día (etapa del cultivo)
```js
function gradosDia(dias, base = 10) {
  let suma = 0;
  for (const d of dias) {
    const media = (d.tMax + d.tMin) / 2;
    if (media > base) suma += media - base;
  }
  return Math.round(suma);
}
```
Base y total por ciclo (aprox.): maíz 10 °C / 1500, frijol 10 / 1100, calabaza 10 / 1100. Perennes (agave, café) no van por grados-día.

## 5. Balance de agua y canícula
- Balance = lluvia acumulada − ET0 acumulada (últimos 14-30 días). Negativo sostenido = estrés hídrico.
- Canícula (mediados de julio-agosto en el sur): avisar si hay ≥7 días seguidos con lluvia < 1 mm dentro de la temporada de lluvias.

## 6. ¿Ya puedo sembrar?
Por cultivo guardar `lluviaMin` (mm en 7 días) y `tempSuelo` (°C). Maíz: ~25 mm y suelo ≥ 12 °C. Evaluar con lluvia pasada + pronóstico y temperatura de suelo de Open-Meteo, y explicar el porqué en lenguaje simple.

## Reglas
- Citar la fuente en la UI (Open-Meteo, NASA POWER). Nunca inventar cifras.
- Timeout de 9-18 s en el navegador (señal mala en zonas rurales).
- Pasar el resumen de clima y cultivo al prompt de la IA para que sus consejos usen datos reales.
- Estados y municipios: tener el catálogo completo de México con buscador; permitir "ninguno" y cambiarlo cuando sea.
