(() => {
  const leer = () => window.ModeloPlanos.calcular({
    masa: document.getElementById("masa").valueAsNumber,
    angulo: document.getElementById("angulo").valueAsNumber * (document.getElementById("invertir-pendiente").checked ? -1 : 1),
    fuerza: document.getElementById("fuerza").valueAsNumber,
    beta: document.getElementById("beta").valueAsNumber,
    sentido: Number(document.getElementById("sentido").value),
    superficie: document.getElementById("superficie").value,
  });
  window.FormulaInteractiva.enlazar(document.getElementById("formula-peso"), {
    objetivoInicial: "P",
    variables: [{ id: "P", nombre: "Peso", unidad: "N", max: 300 }, { id: "m", nombre: "Masa", unidad: "kg", max: 30 }, { id: "g", nombre: "Gravedad", unidad: "m/s²", max: 20 }],
    operadores: ["=", "·"],
    leerValores: () => ({ m: leer().masa, g: 9.8 }),
    despejes: {
      P: { expresion: "P = m · g", calcular: ({ m, g }) => m * g },
      m: { expresion: "m = P / g", calcular: ({ P, g }) => g === 0 ? null : P / g, error: "Con g = 0 no podemos despejar m. Cambia g." },
      g: { expresion: "g = P / m", calcular: ({ P, m }) => m === 0 ? null : P / m, error: "Con m = 0 no podemos despejar g. Cambia m." },
    },
  });
  window.FormulaInteractiva.enlazar(document.getElementById("formula-newton"), {
    objetivoInicial: "a",
    variables: [{ id: "ΣF∥", nombre: "Resultante paralela", unidad: "N", min: -300, max: 300 }, { id: "m", nombre: "Masa", unidad: "kg", max: 30 }, { id: "a", nombre: "Aceleración", unidad: "m/s²", min: -30, max: 30 }],
    operadores: ["=", "·"],
    leerValores: () => ({ "ΣF∥": leer().resultante ?? 0, m: leer().masa, a: leer().aceleracion ?? 0 }),
    despejes: {
      "ΣF∥": { expresion: "ΣF∥ = m · a", calcular: ({ m, a }) => m * a, nota: "El signo positivo indica que el vector apunta hacia la derecha del plano." },
      m: { expresion: "m = ΣF∥ / a", calcular: (v) => v.a === 0 || v["ΣF∥"] / v.a < 0 ? null : v["ΣF∥"] / v.a, error: "Para calcular una masa física, la fuerza y la aceleración deben tener el mismo signo y a debe ser distinta de cero." },
      a: { expresion: "a = ΣF∥ / m", calcular: (v) => v.m === 0 ? null : v["ΣF∥"] / v.m, error: "La masa debe ser mayor que cero para calcular la aceleración." },
    },
  });
})();
