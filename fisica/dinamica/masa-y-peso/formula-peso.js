(() => {
  window.FormulaInteractiva.enlazar(document.getElementById("explorar-formula-peso"), {
    objetivoInicial: "P",
    variables: [
      { id: "P", nombre: "Peso", unidad: "N", max: 2000 },
      { id: "m", nombre: "Masa", unidad: "kg", max: 100 },
      { id: "g", nombre: "Gravedad", unidad: "m/s²", max: 20 },
    ],
    operadores: ["=", "·"],
    leerValores: () => ({
      m: document.getElementById("masa").valueAsNumber,
      g: document.getElementById("gravedad").valueAsNumber,
    }),
    despejes: {
      P: {
        expresion: "P = m · g",
        calcular: ({ m, g }) => m * g,
        nota: "Si duplicas m o g y mantienes fija la otra variable, P también se duplica.",
      },
      m: {
        expresion: "m = P / g",
        calcular: ({ P, g }) => g === 0 ? null : P / g,
        nota: "Con un peso positivo y fijo, al aumentar g disminuye m.",
        error: "Con g = 0, el peso no permite calcular la masa. Sube la barra de g para continuar.",
      },
      g: {
        expresion: "g = P / m",
        calcular: ({ P, m }) => m === 0 ? null : P / m,
        nota: "Con un peso positivo y fijo, al aumentar m disminuye g.",
        error: "Con m = 0, el peso no permite calcular la gravedad. Sube la barra de m para continuar.",
      },
    },
  });
})();
