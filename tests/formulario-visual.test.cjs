const { test } = require("node:test");
const assert = require("node:assert/strict");
const visual = require("../fisica/dinamica/movimiento-sobre-planos/formulario-visual-modelo.js");
const planos = require("../fisica/dinamica/movimiento-sobre-planos/modelo.js");
const cerca = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`);

test("la normal visual coincide con el ensayo al tirar hacia fuera o empujar hacia dentro", () => {
  for (const angulo of [-60, -30, 0, 30, 60]) for (const beta of [-45, 0, 45]) {
    const d = planos.calcular({ masa: 6, angulo, fuerza: 30, beta, sentido: 1, superficie: "rugosa" });
    const n = visual.normal(d.peso, Math.abs(angulo), d.fuerzaPerpendicular);
    cerca(n.normal, d.normal); assert.equal(n.contacto, d.contacto);
  }
});
test("el plano deja de empujar al perder contacto y nunca genera una normal negativa", () => {
  cerca(visual.normal(60, 0, -25).normal, 85);
  cerca(visual.normal(60, 0, 25).normal, 35);
  const borde = visual.normal(60, 0, 60);
  assert.equal(borde.contacto, true); cerca(borde.normal, 0);
  const fuera = visual.normal(60, 0, 80);
  assert.equal(fuera.contacto, false); cerca(fuera.normal, 0);
});
test("el monigote iguala el empuje hasta el límite, incluido el valor exacto", () => {
  for (const empuje of [0, 10, 30]) {
    const d = visual.rozamiento(empuje, 60, 0.5);
    assert.equal(d.desliza, false); cerca(d.resistencia, empuje); cerca(d.resultante, 0);
  }
});
test("superar el límite deja un lastre opuesto al empuje, y sin apoyo o agarre no hay resistencia", () => {
  const d = visual.rozamiento(50, 60, 0.5);
  assert.equal(d.desliza, true); cerca(d.limite, 30); cerca(d.resistencia, 21); cerca(d.resultante, 29);
  for (const [normal, mu] of [[0, 0.5], [60, 0]]) {
    const libre = visual.rozamiento(50, normal, mu);
    cerca(libre.resistencia, 0); cerca(libre.resultante, 50);
  }
});
test("la suma por ejes cancela solo la parte común y construye la diagonal correcta", () => {
  const r = visual.sumar([{ magnitud: 50, angulo: 0 }, { magnitud: 20, angulo: 180 }, { magnitud: 40, angulo: 90 }]);
  cerca(r.x, 30); cerca(r.y, 40); cerca(r.modulo, 50);
  cerca(r.positivaX, 50); cerca(r.negativaX, 20);
  cerca(r.angulo, Math.atan2(40, 30) * 180 / Math.PI);
});
test("fuerzas oblicuas opuestas se equilibran sin inventar una dirección para la resultante cero", () => {
  const fuerzas = [[60, 20], [60, 200], [45, 90], [45, -90], [35, 150], [35, -30]]
    .map(([magnitud, angulo]) => ({ magnitud, angulo }));
  const r = visual.sumar(fuerzas);
  cerca(r.x, 0); cerca(r.y, 0); cerca(r.modulo, 0); assert.equal(r.angulo, null);
});
test("rotar todas las fuerzas rota la resultante y conserva su módulo", () => {
  const fuerzas = [{ magnitud: 70, angulo: 20 }, { magnitud: 45, angulo: 140 }, { magnitud: 40, angulo: 205 }];
  const a = visual.sumar(fuerzas), b = visual.sumar(fuerzas.map((f) => ({ ...f, angulo: f.angulo + 90 })).reverse());
  cerca(b.x, -a.y); cerca(b.y, a.x); cerca(b.modulo, a.modulo);
});
