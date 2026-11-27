const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  G, poleas, estadoPoleas, muelles, estadoMuelle, fuerzasGravitatorias, gravitacion, estadoGravedad,
  curva, estadoCurva, rebote, estadoRebote,
} = require("../fisica/dinamica/modelos-taller.js");

function cerca(actual, esperado, error = 1e-9) {
  assert.ok(Math.abs(actual - esperado) <= error, `Se esperaba ${esperado} y salió ${actual}`);
}

test("la polea invierte la aceleración al intercambiar las masas y conserva la tensión", () => {
  const derecha = poleas({ m1: 2, m2: 5 });
  const izquierda = poleas({ m1: 5, m2: 2 });
  cerca(derecha.a, 4.2);
  cerca(derecha.tension, 28);
  cerca(izquierda.a, -derecha.a);
  cerca(izquierda.tension, derecha.tension);
  cerca(estadoPoleas(derecha, 1).distancia, 1);
  const iguales = poleas({ m1: 5, m2: 5 });
  cerca(iguales.tension, 49);
  cerca(estadoPoleas(iguales, 1).distancia, 0);
});

test("el alargamiento de Hooke sigue la fuerza y se reduce al aumentar k", () => {
  const muelle = muelles({ k: 6, fuerza: 0.28 });
  cerca(estadoMuelle(muelle, 0).extension, 0);
  cerca(estadoMuelle(muelle, 0.5).extension, 0.14 / 6);
  cerca(estadoMuelle(muelle, 1).extension, 0.046666666666667);
  cerca(muelles({ k: 18, fuerza: 0.28 }).extensionFinal, muelle.extensionFinal / 3);
});

test("gravedad cumple la ley del inverso del cuadrado y el equilibrio del centro de masas", () => {
  const datos = gravitacion({ m1: 2, m2: 10, distancia: 2 });
  const origen = estadoGravedad(datos, 0);
  const medio = estadoGravedad(datos, 0.5);
  const fin = estadoGravedad(datos, 1);
  cerca(origen.fuerza, G * datos.m1 * datos.m2 / 2000 ** 2, 1e-6);
  cerca(fuerzasGravitatorias(datos.m1, datos.m2, 4000).fuerza / origen.fuerza, 1 / 4);
  assert.ok(fin.r < medio.r && medio.r < origen.r);
  assert.ok(fin.fuerza > origen.fuerza);
  cerca(fin.a1 / fin.a2, 5);
  cerca(fin.recorrido1 / fin.recorrido2, 5);
  cerca(fin.recorrido1 + fin.recorrido2, origen.r - fin.r);
  cerca(fin.t, datos.duracion);
});

test("la rapidez límite en una curva ideal no depende de la masa", () => {
  const datos = { masa: 500, rapidez: 120, radio: 80, agarre: 0.6 };
  const pocoAgarre = curva(datos);
  const conAgarre = curva({ ...datos, agarre: 1.5 });
  cerca(pocoAgarre.necesaria, 6944.444444444444);
  assert.equal(pocoAgarre.gira, false);
  assert.equal(conAgarre.gira, true);
  assert.equal(curva({ ...datos, rapidez: pocoAgarre.limite }).gira, true);
  cerca(curva({ ...datos, masa: 900 }).limite, pocoAgarre.limite);
  cerca(estadoCurva(pocoAgarre, 1).recorrido, 105);
});

test("duplicar el contacto conserva el impulso de rebote y reduce a la mitad la fuerza", () => {
  const datos = { masa: 0.3, entrada: 15, salida: 10, contacto: 0.05 };
  const corto = rebote(datos);
  const largo = rebote({ ...datos, contacto: 0.1 });
  cerca(corto.vf, -10);
  cerca(corto.impulso, -7.5);
  cerca(corto.fuerza, -150);
  cerca(largo.impulso, corto.impulso);
  cerca(largo.fuerza, corto.fuerza / 2);
  cerca(estadoRebote(corto, 0.475).v, 2.5);
  cerca(estadoRebote(corto, 0.65).v, -10);
  cerca(estadoRebote(corto, 1).fuerzaActual, 0);
  cerca(rebote({ ...datos, salida: 20 }).vf, -datos.entrada);
  assert.equal(estadoRebote(rebote({ ...datos, salida: 0 }), 1).fase, "Queda en la pared");
});
