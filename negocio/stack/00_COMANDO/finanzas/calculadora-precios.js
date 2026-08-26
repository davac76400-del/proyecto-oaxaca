#!/usr/bin/env node
/**
 * Calculadora de precios — sustituye el "margen por desinformación" por
 * participación del valor generado.
 *
 *   MENSUALIDAD = infraestructura × 1.3
 *               + horas de soporte × tarifa
 *               + % del valor económico mensual generado
 *
 * Uso:
 *   node calculadora-precios.js hotel --cuartos 20 --ocupacion 60 --tarifa 1400
 *   node calculadora-precios.js restaurante --ventas-apps 80000
 *   node calculadora-precios.js --help
 */

const COSTOS = {              // MXN/mes, costo real tuyo
  vps_compartido: 120,        // tajada de un KVM2 entre ~4 clientes
  vps_dedicado: 330,
  dominio: 21,
  whatsapp_base: 700,         // ~1000 utilidad + ~500 marketing
  modelo_api: 120,
  supabase: 0,
};

const TARIFA_HORA = 500;
const BUFFER_INFRA = 1.3;
const COMISION_OTA = 0.17;
const COMISION_APP_COMIDA = 0.27;

const mxn = (n) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency', currency: 'MXN', maximumFractionDigits: 0,
  }).format(Math.round(n));

function arg(nombre, def) {
  const i = process.argv.indexOf(`--${nombre}`);
  if (i === -1 || i === process.argv.length - 1) return def;
  const v = Number(process.argv[i + 1]);
  return Number.isFinite(v) ? v : def;
}

function infraestructura({ dedicado = false, whatsapp = true } = {}) {
  return (
    (dedicado ? COSTOS.vps_dedicado : COSTOS.vps_compartido) +
    COSTOS.dominio +
    (whatsapp ? COSTOS.whatsapp_base : 0) +
    COSTOS.modelo_api
  );
}

function precio({ infra, horasSoporte, valorMensual, participacion }) {
  const a = infra * BUFFER_INFRA;
  const b = horasSoporte * TARIFA_HORA;
  const c = valorMensual * participacion;
  return { a, b, c, total: a + b + c, margen: a + b + c - infra };
}

function imprimir(titulo, p, infra, valorMensual, participacion, notas = []) {
  console.log(`\n\x1b[1m${titulo}\x1b[0m`);
  console.log('─'.repeat(58));
  const etiquetaA = `  (A) Infraestructura ${mxn(infra)} × 1.3`;
  console.log(etiquetaA.padEnd(43) + mxn(p.a).padStart(12));
  console.log(`  (B) Soporte comprometido                 ${mxn(p.b).padStart(12)}`);
  console.log(`  (C) ${(participacion * 100).toFixed(0)}% del valor generado (${mxn(valorMensual)}/mes)  ${mxn(p.c).padStart(12)}`);
  console.log('─'.repeat(58));
  console.log(`  \x1b[1mMENSUALIDAD                              ${mxn(p.total).padStart(12)}\x1b[0m`);
  console.log(`  Costo real tuyo                          ${mxn(infra).padStart(12)}`);
  console.log(`  \x1b[32mMargen mensual                           ${mxn(p.margen).padStart(12)}\x1b[0m`);
  console.log(`  Instalación sugerida (5–7× mensualidad)  ${mxn(p.total * 6).padStart(12)}`);
  console.log(`\n  \x1b[33mEste es tu PISO, no tu precio de lista.\x1b[0m`);
  console.log(`  \x1b[2mEl catálogo (01-CATALOGO) trae el precio empaquetado, más alto.`);
  console.log(`  Debajo de ${mxn(p.total)} el trato no te conviene: ahí te levantas.\x1b[0m`);
  if (notas.length) {
    console.log('\n  \x1b[2mLa servilleta para la reunión:\x1b[0m');
    notas.forEach((n) => console.log(`  \x1b[2m· ${n}\x1b[0m`));
  }
}

function hotel() {
  const cuartos = arg('cuartos', 20);
  const ocupacion = arg('ocupacion', 60) / 100;
  const tarifa = arg('tarifa', 1400);
  const pctOta = arg('pct-ota', 55) / 100;
  const recuperacion = arg('recuperacion', 15) / 100;

  const noches = cuartos * ocupacion * 30;
  const ingreso = noches * tarifa;
  const viaOta = ingreso * pctOta;
  const comision = viaOta * COMISION_OTA;
  const ahorro = comision * recuperacion;

  const infra = infraestructura({ whatsapp: true });
  const p = precio({ infra, horasSoporte: 4, valorMensual: ahorro, participacion: 0.15 });

  imprimir('HOTEL — Motor de Reserva Directa (A1)', p, infra, ahorro, 0.15, [
    `${cuartos} cuartos × ${(ocupacion * 100).toFixed(0)}% × 30 días = ${Math.round(noches)} noches/mes`,
    `Ingreso mensual estimado: ${mxn(ingreso)}`,
    `${(pctOta * 100).toFixed(0)}% vía OTA = ${mxn(viaOta)} → comisión ${(COMISION_OTA * 100).toFixed(0)}% = ${mxn(comision)}/mes`,
    `Recuperando ${(recuperacion * 100).toFixed(0)}% a canal directo = ${mxn(ahorro)}/mes ahorrados`,
    `Le cobras ${mxn(p.total)} para devolverle ${mxn(ahorro)}. Anual: ${mxn(ahorro * 12)}.`,
  ]);

  // Upsell pre-estancia: se cuenta por ESTANCIA, no por noche.
  // Un huesped de 3 noches es una sola oportunidad de upsell.
  const nochesPorEstancia = arg('noches-estancia', 2.2);
  const estancias = noches / nochesPorEstancia;
  const conv = 0.18, ticket = 600;
  const upsell = estancias * conv * ticket;
  const infraU = infraestructura({ whatsapp: true });
  const pu = precio({ infra: infraU, horasSoporte: 2, valorMensual: upsell, participacion: 0.10 });
  imprimir('HOTEL — Upsell Pre-Estancia (A3)', pu, infraU, upsell, 0.10, [
    `${Math.round(noches)} noches ÷ ${nochesPorEstancia} noches por estancia = ~${Math.round(estancias)} estancias/mes`,
    `${Math.round(estancias)} estancias × ${(conv * 100).toFixed(0)}% conversión × ${mxn(ticket)} = ${mxn(upsell)} de ingreso NUEVO`,
    `Este es dinero que hoy no existe. Es tu mejor demostración.`,
  ]);
}

function restaurante() {
  const ventasApps = arg('ventas-apps', 80000);
  const migracion = arg('migracion', 50) / 100;

  const comisionHoy = ventasApps * COMISION_APP_COMIDA;
  const ahorro = comisionHoy * migracion;

  const infra = infraestructura({ whatsapp: true });
  const p = precio({ infra, horasSoporte: 3, valorMensual: ahorro, participacion: 0.15 });

  imprimir('RESTAURANTE — Pedidos Sin Comisión (B1)', p, infra, ahorro, 0.15, [
    `Vende ${mxn(ventasApps)}/mes por apps → paga ${mxn(comisionHoy)} de comisión (${(COMISION_APP_COMIDA * 100).toFixed(0)}%)`,
    `Migrando ${(migracion * 100).toFixed(0)}% a canal propio ahorra ${mxn(ahorro)}/mes`,
    `Le cobras ${mxn(p.total)}. Anual ahorrado: ${mxn(ahorro * 12)}.`,
  ]);
}

function ayuda() {
  console.log(`
Calculadora de precios — Oaxaca

  node calculadora-precios.js hotel [opciones]
    --cuartos N        (20)   --ocupacion N%      (60)
    --tarifa N         (1400) --pct-ota N%        (55)
    --recuperacion N%  (15)   --noches-estancia N (2.2)

  node calculadora-precios.js restaurante [opciones]
    --ventas-apps N    (80000)  --migracion N%    (50)

Ajusta SIEMPRE los números al cliente que tienes enfrente antes de la reunión.
Una servilleta con sus números cierra; una genérica, no.
`);
}

const modo = process.argv[2];
if (modo === 'hotel') hotel();
else if (modo === 'restaurante') restaurante();
else ayuda();
