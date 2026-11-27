const { test } = require("node:test");
const assert = require("node:assert/strict");
const { calcular, g } = require("../fisica/dinamica/movimiento-sobre-planos/modelo.js");
const base = { masa: 5, angulo: 0, fuerza: 0, beta: 0, sentido: 1, superficie: "rugosa" };
const caso = (cambios) => calcular({ ...base, ...cambios });
const cerca = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`);

test("horizontal: el estático usa lo necesario y nunca hace arrancar hacia atrás", () => {
  const d = caso({ fuerza: 14 });
  cerca(d.normal, 49); cerca(d.limite, 14.7); cerca(d.rozamiento, -14);
  assert.equal(d.seMueve, false); assert.equal(d.resultante, 0); assert.equal(d.aceleracion, 0);
});
test("el umbral estático incluye la igualdad; al superarlo actúa el cinético", () => {
  assert.equal(caso({ fuerza: 14.7 }).seMueve, false);
  const d = caso({ fuerza: 15 });
  assert.equal(d.seMueve, true); cerca(d.rozamiento, -9.8); cerca(d.resultante, 5.2); cerca(d.aceleracion, 1.04);
});
test("rampa: el peso baja y el rozamiento se opone; a no depende de m sin empuje", () => {
  const d = caso({ angulo: 30, masa: 10, superficie: "suave" });
  cerca(d.pesoParalelo, -49); cerca(d.normal, 98 * Math.cos(Math.PI / 6));
  assert.ok(d.rozamiento > 0); assert.ok(d.resultante < 0);
  cerca(d.aceleracion, caso({ angulo: 30, masa: 20, superficie: "suave" }).aceleracion);
});
test("rampa: el estático también impide caer sin empuje", () => {
  const d = caso({ angulo: 10, superficie: "muyRugosa" });
  assert.equal(d.seMueve, false); cerca(d.rozamiento, -d.pesoParalelo); assert.equal(d.resultante, 0);
});
test("el empuje puede vencer el peso y hacer subir el bloque", () => {
  const d = caso({ angulo: 30, masa: 8, fuerza: 70, superficie: "suave" });
  assert.ok(d.resultante > 0); assert.ok(d.rozamiento < 0);
});
test("el empuje oblicuo se descompone respecto al plano y modifica N", () => {
  const d = caso({ angulo: 30, masa: 10, fuerza: 30, beta: 20 });
  cerca(d.fuerzaParalela, 30 * Math.cos(20 * Math.PI / 180));
  cerca(d.fuerzaPerpendicular, 30 * Math.sin(20 * Math.PI / 180));
  cerca(d.normal + d.fuerzaPerpendicular + d.pesoPerpendicular, 0);
  const dentro = caso({ angulo: 30, masa: 10, fuerza: 30, beta: -20 });
  assert.ok(dentro.normal > d.normal);
});
test("al reflejar la pendiente y el empuje, se invierte el movimiento y se conserva la normal", () => {
  const parametros = { angulo: 30, masa: 8, fuerza: 40, beta: -20, sentido: -1 };
  const original = caso(parametros);
  const reflejado = caso({ ...parametros, angulo: -30, sentido: 1 });
  assert.ok(original.aceleracion < 0);
  cerca(reflejado.pesoParalelo, -original.pesoParalelo);
  cerca(reflejado.normal, original.normal);
  cerca(reflejado.rozamiento, -original.rozamiento);
  cerca(reflejado.aceleracion, -original.aceleracion);
});
test("empujar a la izquierda invierte F∥ y conserva la convención de F⊥", () => {
  const d = caso({ fuerza: 30, beta: 20, sentido: -1 });
  assert.ok(d.fuerzaParalela < 0); assert.ok(d.fuerzaPerpendicular > 0);
  assert.ok(d.resultante < 0); assert.ok(d.rozamiento > 0);
});
test("sin rozamiento: horizontal sin fuerzas y rampa ideal", () => {
  const quieto = caso({ superficie: "ninguna" });
  assert.equal(quieto.resultante, 0); assert.equal(quieto.seMueve, false);
  cerca(caso({ angulo: 30, superficie: "ninguna" }).aceleracion, -g * 0.5);
});
test("se detecta la pérdida de contacto sin simular una normal negativa", () => {
  const d = caso({ fuerza: 70, beta: 45, angulo: 60 });
  assert.equal(d.contacto, false); assert.equal(d.normal, 0);
  assert.equal(d.seMueve, false); assert.equal(d.resultante, null); assert.equal(d.aceleracion, null);
});
test("equilibrio perpendicular y rozamiento en todo el rango de controles", () => {
  for (const angulo of [-60, -30, -10, 0, 10, 30, 60]) for (const masa of [1, 5, 10])
  for (const fuerza of [0, 14, 30, 70]) for (const beta of [-45, 0, 45])
  for (const sentido of [-1, 1]) for (const superficie of ["ninguna", "suave", "rugosa", "muyRugosa"]) {
    const d = caso({ angulo, masa, fuerza, beta, sentido, superficie });
    if (!d.contacto) continue;
    cerca(d.normal + d.fuerzaPerpendicular + d.pesoPerpendicular, 0);
    cerca(d.resultante, d.fuerzaParalela + d.pesoParalelo + d.rozamiento);
    cerca(d.aceleracion, d.resultante / masa);
    if (d.seMueve) {
      cerca(Math.abs(d.rozamiento), d.material.dinamico * d.normal);
      assert.ok(d.rozamiento * d.resultante <= 0);
      assert.ok(d.resultante * d.motriz > 0);
    } else {
      assert.ok(Math.abs(d.rozamiento) <= d.limite + 1e-9);
      assert.equal(d.resultante, 0);
    }
  }
});
