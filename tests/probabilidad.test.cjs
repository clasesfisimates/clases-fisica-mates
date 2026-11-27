const test = require("node:test");
const assert = require("node:assert/strict");
const { llenarUrna, contarColores, sacarBola } = require("../matematicas/probabilidad/modelo.js");

test("sin reposición se agota la urna sin repetir ninguna bola", () => {
  const bolas = llenarUrna();
  const extraidas = new Set();
  assert.deepEqual(contarColores(bolas), [3, 4, 5]);
  for (let i = 0; i < 12; i++) {
    extraidas.add(sacarBola(bolas, () => .5).id);
    assert.equal(bolas.length, 11 - i);
  }
  assert.equal(extraidas.size, 12);
  assert.equal(sacarBola(bolas), null);
});

test("con reposición se puede repetir una bola y se conservan todas las probabilidades", () => {
  const bolas = llenarUrna();
  const iniciales = bolas.slice();
  for (let i = 0; i < 25; i++) {
    assert.equal(sacarBola(bolas, () => 0, true), iniciales[0]);
    assert.deepEqual(contarColores(bolas), [3, 4, 5]);
  }
  assert.deepEqual(bolas, iniciales);
  assert.equal(sacarBola(bolas, () => .999, true), iniciales[11]);
});

test("una urna vacía no permite extraer en ninguno de los dos modos", () => {
  assert.equal(sacarBola([], Math.random, false), null);
  assert.equal(sacarBola([], Math.random, true), null);
});
