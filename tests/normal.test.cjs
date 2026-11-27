const { test } = require("node:test");
const assert = require("node:assert/strict");
const { calcular, g, duracionCaida, duracion } = require("../fisica/dinamica/masa-y-peso/normal-modelo.js");
const cerca = (a, b, tolerancia = 1e-8) => assert.ok(Math.abs(a - b) < tolerancia, `${a} != ${b}`);

test("sin contacto no hay normal: el objeto cae acelerado por el peso", () => {
  const inicio = calcular(6, 0);
  const cayendo = calcular(6, duracionCaida / 2);
  cerca(cayendo.normal, 0); cerca(cayendo.resultante, -6 * g);
  cerca(cayendo.aceleracion, -g);
  assert.ok(cayendo.altura < inicio.altura);
  assert.ok(cayendo.velocidad > inicio.velocidad);
});

test("el contacto frena la caída con una normal inicialmente mayor que el peso", () => {
  const contacto = calcular(6, duracionCaida);
  const despues = calcular(6, duracionCaida + 0.3);
  cerca(contacto.altura, 0); cerca(contacto.compresion, 0);
  assert.ok(contacto.normal > contacto.peso);
  assert.ok(despues.compresion > 0);
  assert.ok(despues.velocidad < contacto.velocidad);
});

test("el contacto converge al reposo y cumple la segunda ley sin normal negativa", () => {
  for (const masa of [2, 6, 10]) for (let t = duracionCaida; t < 5; t += 0.01) {
    const d = calcular(masa, t);
    assert.ok(d.normal >= 0); assert.ok(d.compresion >= 0);
    cerca(d.resultante, d.normal - d.peso);
    cerca(d.aceleracion, d.resultante / masa);
  }
  const finalContacto = calcular(6, 5 - 1e-6);
  cerca(finalContacto.normal, 6 * g, 0.01);
  cerca(finalContacto.velocidad, 0, 0.0001);
});

test("en equilibrio N = P y al duplicar la masa se duplican ambas fuerzas", () => {
  const a = calcular(4, duracion);
  const b = calcular(8, duracion);
  cerca(a.normal, a.peso); cerca(a.resultante, 0); cerca(a.velocidad, 0);
  cerca(b.normal, 2 * a.normal); cerca(b.peso, 2 * a.peso);
  for (const t of [0.5, duracionCaida, duracionCaida + 0.5]) {
    cerca(calcular(8, t).normal, 2 * calcular(4, t).normal);
  }
});

test("quitar el suelo elimina la normal, conserva el peso y acelera la caída", () => {
  const a = calcular(6, 1, true);
  const b = calcular(6, 2, true);
  cerca(a.normal, 0); cerca(a.peso, 6 * g); cerca(a.resultante, -a.peso);
  assert.ok(b.altura < a.altura); assert.ok(b.velocidad > a.velocidad);
});
