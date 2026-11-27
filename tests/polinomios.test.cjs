const test = require('node:test');
const assert = require('node:assert/strict');
const { interpretar, evaluar, raicesReales, factorizar } = require('../matematicas/polinomios/modelo.js');
const cercanos = (actuales, esperados) => {
  assert.equal(actuales.length, esperados.length);
  actuales.forEach((r, i) => assert.ok(Math.abs(r - esperados[i]) < 1e-6, `${r} no coincide con ${esperados[i]}`));
};

test('interpreta grados altos, términos desordenados, decimales y superíndices', () => {
  assert.deepEqual(interpretar('x³ − 3x² − 4x + 12'), [12, -4, -3, 1]);
  const p = interpretar('1,5x^12 + 3 - x + 2x - 0.5x^12');
  assert.equal(p.length, 13);
  assert.equal(p[12], 1);
  assert.equal(evaluar(p, 1), 5);
  assert.deepEqual(interpretar('1e-3x^2 + 2'), [2, 0, .001]);
});
test('rechaza expresiones ajenas a un polinomio', () => {
  for (const texto of ['x^-2', 'x^1.5', '1/x', 'x(x+1)', '<script>', '', '2*']) assert.throws(() => interpretar(texto));
});
test('encuentra raíces simples, irracionales y raíces fuera de la ventana inicial', () => {
  cercanos(raicesReales([12, -4, -3, 1]), [-2, 2, 3]);
  cercanos(raicesReales([-2, 0, 1]), [-Math.SQRT2, Math.SQRT2]);
  cercanos(raicesReales([-10000, 0, 1]), [-100, 100]);
});
test('detecta raíces de multiplicidad par aunque la curva no cruce el eje', () => {
  const resultado = factorizar(interpretar('x^4 - 2x^3 - 3x^2 + 4x + 4'));
  assert.deepEqual(resultado.raices, [{ valor: -1, multiplicidad: 2 }, { valor: 2, multiplicidad: 2 }]);
  assert.deepEqual(resultado.cociente, [1]);
});
test('conserva factores restantes y distingue constantes y polinomio nulo', () => {
  assert.deepEqual(factorizar(interpretar('x^3 - x^2 + x - 1')), { raices: [{ valor: 1, multiplicidad: 1 }], cociente: [1, 0, 1] });
  assert.deepEqual(raicesReales([1, 0, 1]), []);
  assert.deepEqual(raicesReales([0]), []);
  assert.deepEqual(raicesReales([7]), []);
  assert.deepEqual(factorizar(interpretar('x^8')), { raices: [{ valor: 0, multiplicidad: 8 }], cociente: [1] });
});
test('un polinomio de grado 20 mantiene sus raíces y el factor principal', () => {
  const p = Array(21).fill(0); p[0] = -2; p[20] = 2;
  const r = factorizar(p);
  cercanos(r.raices.map(({valor}) => valor), [-1, 1]);
  for (const x of [-1.5, -.3, .2, 1.2]) {
    const reconstruido = r.raices.reduce((v, raiz) => v * (x - raiz.valor) ** raiz.multiplicidad, evaluar(r.cociente, x));
    assert.ok(Math.abs(reconstruido - evaluar(p, x)) < 1e-7 * Math.max(1, Math.abs(evaluar(p, x))));
  }
});
