export interface DimCustomer {
  customer_id: number;
  customer_name: string;
  country: string;
}

export interface FctOrder {
  order_id: number;
  customer_id: number;
  amount: number | null;
  order_date: string;
}

export const dimCustomers: DimCustomer[] = [
  { customer_id: 1,  customer_name: 'Grupo Valera',          country: 'Spain' },
  { customer_id: 2,  customer_name: 'Distribuciones Casas',  country: 'Spain' },
  { customer_id: 3,  customer_name: 'Comercial Ibérica',     country: 'Spain' },
  { customer_id: 4,  customer_name: 'Almacenes del Sur',     country: 'Spain' },
  { customer_id: 5,  customer_name: 'Industrias Bernal',     country: 'Spain' },
  { customer_id: 6,  customer_name: 'Soluciones Moya',       country: 'Spain' },
  { customer_id: 7,  customer_name: 'Transportes Ruiz',      country: 'Spain' },
  { customer_id: 8,  customer_name: 'Ferretería Prieto',     country: 'Spain' },
  { customer_id: 9,  customer_name: 'Construcciones Vega',   country: 'Spain' },
  { customer_id: 10, customer_name: 'Logística Serrano',     country: 'Spain' },
  { customer_id: 11, customer_name: 'Materiales Blanco',     country: 'Spain' },
  { customer_id: 12, customer_name: 'Confecciones Gil',      country: 'Spain' },
  { customer_id: 13, customer_name: 'Electrónica Marín',     country: 'Spain' },
  { customer_id: 14, customer_name: 'Alimentación Jiménez',  country: 'Spain' },
  { customer_id: 15, customer_name: 'Automoción Díaz',       country: 'Spain' },
  { customer_id: 16, customer_name: 'Consultoría Romero',    country: 'Spain' },
  { customer_id: 17, customer_name: 'Maison Dupont',         country: 'France' },
  { customer_id: 18, customer_name: 'Atelier Laurent',       country: 'France' },
  { customer_id: 19, customer_name: 'Groupe Morel',          country: 'France' },
  { customer_id: 20, customer_name: 'Société Perrin',        country: 'France' },
];

// Batch 1: clean data, amount NOT NULL.
// Top 5 by avg (Spain only): Grupo Valera(~4213), Distribuciones Casas(~3500), Comercial Ibérica(~2800), Almacenes del Sur(~2100), Industrias Bernal(~1600).
// French customers (ids 17-20) avg 175-205, well below the Spanish top 5.
// Remaining Spanish customers cluster between 200-900 to make the top 5 visually distinct.
export const fctOrdersBatch1: FctOrder[] = [
  // Grupo Valera (id=1) — avg ~4213
  { order_id: 1,   customer_id: 1,  amount: 4100, order_date: '2026-01-15' },
  { order_id: 2,   customer_id: 1,  amount: 4300, order_date: '2026-02-10' },
  { order_id: 3,   customer_id: 1,  amount: 4050, order_date: '2026-03-22' },
  { order_id: 4,   customer_id: 1,  amount: 4400, order_date: '2026-04-08' },
  // Distribuciones Casas (id=2) — avg ~3500
  { order_id: 5,   customer_id: 2,  amount: 3400, order_date: '2026-01-20' },
  { order_id: 6,   customer_id: 2,  amount: 3600, order_date: '2026-02-14' },
  { order_id: 7,   customer_id: 2,  amount: 3450, order_date: '2026-03-30' },
  { order_id: 8,   customer_id: 2,  amount: 3550, order_date: '2026-04-25' },
  // Comercial Ibérica (id=3) — avg ~2800
  { order_id: 9,   customer_id: 3,  amount: 2750, order_date: '2026-01-08' },
  { order_id: 10,  customer_id: 3,  amount: 2900, order_date: '2026-02-28' },
  { order_id: 11,  customer_id: 3,  amount: 2700, order_date: '2026-03-15' },
  { order_id: 12,  customer_id: 3,  amount: 2850, order_date: '2026-04-12' },
  // Almacenes del Sur (id=4) — avg ~2100
  { order_id: 13,  customer_id: 4,  amount: 2000, order_date: '2026-01-25' },
  { order_id: 14,  customer_id: 4,  amount: 2200, order_date: '2026-02-18' },
  { order_id: 15,  customer_id: 4,  amount: 2050, order_date: '2026-03-05' },
  { order_id: 16,  customer_id: 4,  amount: 2150, order_date: '2026-04-20' },
  // Industrias Bernal (id=5) — avg ~1600
  { order_id: 17,  customer_id: 5,  amount: 1550, order_date: '2026-01-12' },
  { order_id: 18,  customer_id: 5,  amount: 1650, order_date: '2026-02-22' },
  { order_id: 19,  customer_id: 5,  amount: 1580, order_date: '2026-03-18' },
  { order_id: 20,  customer_id: 5,  amount: 1620, order_date: '2026-04-14' },
  // Remaining customers — avg 200-900, 2 orders each
  { order_id: 21,  customer_id: 6,  amount: 850,  order_date: '2026-01-30' },
  { order_id: 22,  customer_id: 6,  amount: 900,  order_date: '2026-03-10' },
  { order_id: 23,  customer_id: 7,  amount: 700,  order_date: '2026-02-05' },
  { order_id: 24,  customer_id: 7,  amount: 750,  order_date: '2026-04-01' },
  { order_id: 25,  customer_id: 8,  amount: 600,  order_date: '2026-01-18' },
  { order_id: 26,  customer_id: 8,  amount: 650,  order_date: '2026-03-25' },
  { order_id: 27,  customer_id: 9,  amount: 500,  order_date: '2026-02-08' },
  { order_id: 28,  customer_id: 9,  amount: 550,  order_date: '2026-04-18' },
  { order_id: 29,  customer_id: 10, amount: 400,  order_date: '2026-01-22' },
  { order_id: 30,  customer_id: 10, amount: 450,  order_date: '2026-03-12' },
  { order_id: 31,  customer_id: 11, amount: 350,  order_date: '2026-02-15' },
  { order_id: 32,  customer_id: 11, amount: 380,  order_date: '2026-04-05' },
  { order_id: 33,  customer_id: 12, amount: 300,  order_date: '2026-01-28' },
  { order_id: 34,  customer_id: 12, amount: 320,  order_date: '2026-03-20' },
  { order_id: 35,  customer_id: 13, amount: 280,  order_date: '2026-02-25' },
  { order_id: 36,  customer_id: 13, amount: 300,  order_date: '2026-04-22' },
  { order_id: 37,  customer_id: 14, amount: 250,  order_date: '2026-01-05' },
  { order_id: 38,  customer_id: 14, amount: 270,  order_date: '2026-03-08' },
  { order_id: 39,  customer_id: 15, amount: 230,  order_date: '2026-02-12' },
  { order_id: 40,  customer_id: 15, amount: 240,  order_date: '2026-04-28' },
  { order_id: 41,  customer_id: 16, amount: 210,  order_date: '2026-01-10' },
  { order_id: 42,  customer_id: 16, amount: 220,  order_date: '2026-03-28' },
  { order_id: 43,  customer_id: 17, amount: 200,  order_date: '2026-02-20' },
  { order_id: 44,  customer_id: 17, amount: 210,  order_date: '2026-04-10' },
  { order_id: 45,  customer_id: 18, amount: 190,  order_date: '2026-01-16' },
  { order_id: 46,  customer_id: 18, amount: 200,  order_date: '2026-03-02' },
  { order_id: 47,  customer_id: 19, amount: 180,  order_date: '2026-02-02' },
  { order_id: 48,  customer_id: 19, amount: 190,  order_date: '2026-04-16' },
  { order_id: 49,  customer_id: 20, amount: 170,  order_date: '2026-01-24' },
  { order_id: 50,  customer_id: 20, amount: 180,  order_date: '2026-03-14' },
];

// Batch 2: next upstream refresh. amount is now nullable upstream.
// Top customers (id 1-5) have only NULL amounts → AVG(amount) = NULL → NULLS FIRST on DESC → empty bars.
export const fctOrdersBatch2: FctOrder[] = [
  { order_id: 51,  customer_id: 1,  amount: null, order_date: '2026-05-01' },
  { order_id: 52,  customer_id: 1,  amount: null, order_date: '2026-05-15' },
  { order_id: 53,  customer_id: 2,  amount: null, order_date: '2026-05-03' },
  { order_id: 54,  customer_id: 2,  amount: null, order_date: '2026-05-18' },
  { order_id: 55,  customer_id: 3,  amount: null, order_date: '2026-05-05' },
  { order_id: 56,  customer_id: 3,  amount: null, order_date: '2026-05-20' },
  { order_id: 57,  customer_id: 4,  amount: null, order_date: '2026-05-07' },
  { order_id: 58,  customer_id: 4,  amount: null, order_date: '2026-05-22' },
  { order_id: 59,  customer_id: 5,  amount: null, order_date: '2026-05-09' },
  { order_id: 60,  customer_id: 5,  amount: null, order_date: '2026-05-24' },
  { order_id: 61,  customer_id: 6,  amount: 880,  order_date: '2026-05-02' },
  { order_id: 62,  customer_id: 7,  amount: 720,  order_date: '2026-05-04' },
  { order_id: 63,  customer_id: 8,  amount: 630,  order_date: '2026-05-06' },
  { order_id: 64,  customer_id: 9,  amount: 510,  order_date: '2026-05-08' },
  { order_id: 65,  customer_id: 10, amount: 420,  order_date: '2026-05-10' },
  { order_id: 66,  customer_id: 11, amount: 360,  order_date: '2026-05-11' },
  { order_id: 67,  customer_id: 12, amount: 310,  order_date: '2026-05-12' },
  { order_id: 68,  customer_id: 13, amount: 290,  order_date: '2026-05-13' },
  { order_id: 69,  customer_id: 14, amount: 260,  order_date: '2026-05-14' },
  { order_id: 70,  customer_id: 15, amount: 235,  order_date: '2026-05-16' },
];
