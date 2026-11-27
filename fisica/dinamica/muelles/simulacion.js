(() => {
  const { linea, flecha, rejilla, bloque } = window.LabDinamica;
  const { montar, unidades, rotulo, disco } = window.TallerDinamica;
  const { muelles, estadoMuelle } = window.ModelosTallerDinamica;
  const aplicada = "#95f4c9";
  const elastica = "#ffc781";
  const objetivo = "#e2ddff";
  const longitudNatural = 0.2;

  function dibujarResorte(ctx, inicio, fin, y) {
    const espiras = 12;
    const tramo = (fin - inicio - 12) / (espiras * 2);
    ctx.beginPath();
    ctx.moveTo(inicio, y);
    ctx.lineTo(inicio + 6, y);
    for (let paso = 1; paso < espiras * 2; paso++) {
      ctx.lineTo(inicio + 6 + tramo * paso, y + (paso % 2 ? -9 : 9));
    }
    ctx.lineTo(fin - 6, y);
    ctx.lineTo(fin, y);
    ctx.strokeStyle = "#a7c8fb";
    ctx.lineWidth = 2.5;
    ctx.lineJoin = "round";
    ctx.stroke();
  }

  function dibujar(ctx, ancho, alto, d) {
    rejilla(ctx, ancho, alto);
    const inicio = ancho * 0.105;
    const escala = ancho * 0.91;
    const y = alto * 0.22;
    const fin = inicio + (longitudNatural + d.extension) * escala;
    const natural = inicio + longitudNatural * escala;
    for (let i = -24; i <= 22; i += 8) linea(ctx, inicio - 10, y + i + 6, inicio, y + i, "#759aca");
    linea(ctx, inicio, y - 26, inicio, y + 29, "#b6d7fb", 4);
    dibujarResorte(ctx, inicio, fin, y);
    bloque(ctx, fin, y, 18, 25);
    linea(ctx, natural, y + 23, natural, y + 40, objetivo, 1.5);
    rotulo(ctx, "L₀", natural, y + 50, objetivo);
    if (d.extension > 0.035) {
      linea(ctx, natural, y + 31, fin, y + 31, elastica);
      rotulo(ctx, "ΔL", fin, y + 50, elastica);
    }
    if (d.capa) {
      const longitud = Math.min(ancho * 0.1, 50) * d.fuerza / 2;
      flecha(ctx, fin + 8, y - 7, longitud, 0, aplicada);
      flecha(ctx, fin - 8, y + 7, -longitud, 0, elastica);
    }

    const x0 = 38;
    const y0 = alto - 30;
    const xspan = ancho - 70;
    const yspan = alto * 0.35;
    const x = extension => x0 + extension / 0.5 * xspan;
    const yf = fuerza => y0 - fuerza / 2 * yspan;
    linea(ctx, x0, y0, x(0.5), y0, "#a0b7e7", 1.5);
    linea(ctx, x0, yf(2), x0, y0, "#a0b7e7", 1.5);
    for (const f of [0, 1, 2]) rotulo(ctx, String(f), x0 - 11, yf(f), "#b8cdf1");
    rotulo(ctx, "F (N)", x0 - 2, yf(2) - 11);
    rotulo(ctx, "ΔL (m)", x(0.5), y0 + 17);
    rotulo(ctx, "0,25", x(0.25), y0 + 15, "#b8cdf1");
    linea(ctx, x0, y0, x(2 / d.k), yf(2), "#8dbbff", 2);
    linea(ctx, x0, yf(d.objetivo), x(d.extensionFinal), yf(d.objetivo), "#d5d5f8a0");
    linea(ctx, x(d.extensionFinal), yf(d.objetivo), x(d.extensionFinal), y0, "#d5d5f8a0");
    disco(ctx, x(d.extensionFinal), yf(d.objetivo), 6, "#233669", objetivo);
    disco(ctx, x(d.extension), yf(d.fuerza), 3.5, aplicada);
  }

  montar({
    calcular: muelles, instante: estadoMuelle, dibujar,
    medidas: d => ({
      f: unidades(d.fuerza, "N"), x: unidades(d.extension * 100, "cm"),
      l: unidades((longitudNatural + d.extension) * 100, "cm"),
      objetivo: unidades(d.extensionFinal * 100, "cm"),
    }),
    formulas: {
      "formula-hooke": {
        objetivoInicial: "ΔL",
        variables: [
          { id: "ΔL", nombre: "Alargamiento", unidad: "m", max: 0.5, decimales: 3 },
          { id: "F", nombre: "Fuerza", unidad: "N", max: 2 },
          { id: "k", nombre: "Rigidez", unidad: "N/m", min: 4, max: 30 },
        ], operadores: ["=", "/"],
        valores: d => ({ F: d.objetivo, k: d.k }),
        despejes: {
          "ΔL": { expresion: "ΔL = F/k", calcular: ({ F, k }) => k > 0 ? F / k : null, nota: "El formulario parte de la fuerza objetivo de la simulación." },
          F: { expresion: "F = k · ΔL", calcular: ({ k, "ΔL": x }) => k * x },
          k: { expresion: "k = F/ΔL", calcular: ({ F, "ΔL": x }) => x > 0 ? F / x : null, error: "Con alargamiento cero hace falta otro punto para obtener la pendiente." },
        },
      },
    },
  });
})();
