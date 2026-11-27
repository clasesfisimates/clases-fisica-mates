(() => {
  const { linea, flecha, etiquetaVector, rejilla } = window.LabDinamica;
  const { montar, unidades, rotulo, disco } = window.TallerDinamica;
  const { gravedad: g, curva, estadoCurva } = window.ModelosTallerDinamica;
  const velocidad = "#a6f1ff";
  const fuerza = "#ffcc8b";
  const tangente = "#ff9bb9";

  function pista(ctx, x, y, radio, ancho) {
    ctx.beginPath();
    ctx.arc(x, y, radio, 0, 2 * Math.PI);
    ctx.lineWidth = ancho;
    ctx.stroke();
  }

  function dibujarCoche(ctx, x, y, angulo) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angulo);
    ctx.fillStyle = "#0b122a";
    for (const rueda of [-10, 5]) {
      ctx.fillRect(rueda, -9, 5, 4);
      ctx.fillRect(rueda, 5, 5, 4);
    }
    ctx.beginPath();
    ctx.roundRect(-13, -7, 27, 14, 4);
    ctx.fillStyle = "#45b87b";
    ctx.fill();
    ctx.strokeStyle = "#bbffe1";
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.fillStyle = "#153e65";
    ctx.fillRect(-2, -5, 8, 10);
    ctx.fillStyle = "#fff0a9";
    ctx.fillRect(10, -5, 3, 3);
    ctx.fillRect(10, 2, 3, 3);
    ctx.restore();
  }

  function dibujar(ctx, ancho, alto, d) {
    rejilla(ctx, ancho, alto);
    const cx = ancho / 2;
    const cy = alto * 0.47;
    const escala = Math.min((ancho - 42) / 300, (alto - 92) / 300);
    // Reservamos sitio para las dos flechas incluso en la curva más cerrada.
    // El radio en metros se lee en la escena; la pista es esquemática.
    const radioMinimo = 85 * escala;
    const radio = radioMinimo + (d.radio - 40) / 100 * (140 * escala - radioMinimo);
    const carril = Math.min(22, radio * 0.58);
    ctx.strokeStyle = "#94a9c7";
    pista(ctx, cx, cy, radio, carril + 3);
    ctx.strokeStyle = "#37465e";
    pista(ctx, cx, cy, radio, carril);
    ctx.save();
    ctx.setLineDash([7, 7]);
    ctx.strokeStyle = "#cbd2db9d";
    pista(ctx, cx, cy, radio, 1);
    if (!d.gira) linea(ctx, cx, cy - radio, cx + 105 * escala, cy - radio, tangente, 2);
    ctx.restore();
    disco(ctx, cx, cy, 3.5, "#83a4e4");
    etiquetaVector(ctx, "r = " + unidades(d.radio, "m", 0), 9, 18, "#cad9ef", "left");

    const angulo = d.gira ? d.angulo : -Math.PI / 2;
    const x = cx + radio * Math.cos(angulo) + (d.gira ? 0 : d.recorrido * escala);
    const y = cy + radio * Math.sin(angulo);
    const orientacion = angulo + Math.PI / 2;
    if (d.gira && d.visibles.centripeta) {
      ctx.save();
      ctx.setLineDash([2, 5]);
      linea(ctx, x, y, cx, cy, "#ffcc8b99", 1.5);
      ctx.restore();
    }
    dibujarCoche(ctx, x, y, orientacion);
    if (d.visibles.velocidad) {
      const largo = d.v * Math.min(ancho, alto) * 0.0044;
      const dx = Math.cos(orientacion), dy = Math.sin(orientacion);
      flecha(ctx, x, y, dx * largo, dy * largo, velocidad);
      etiquetaVector(ctx, "v", x + dx * (largo + 13), y + dy * (largo + 13), velocidad);
    }
    if (d.visibles.centripeta && d.gira) {
      // La fuerza máxima con agarre es 1,6 · 1600 · g. Su punta cabe en el radio mínimo.
      const largo = d.necesaria * (radioMinimo - 6) / (1.6 * 1600 * g);
      const dx = -Math.cos(angulo), dy = -Math.sin(angulo);
      const inicioX = x + dx * 6, inicioY = y + dy * 6;
      flecha(ctx, inicioX, inicioY, dx * largo, dy * largo, fuerza);
      etiquetaVector(ctx, "Fc", inicioX + dx * (largo + 17), inicioY + dy * (largo + 17), fuerza);
    }
    const yBarra = alto - 36;
    const inicio = 96;
    const largo = ancho - inicio - 17;
    const escalaBarras = largo / Math.max(d.necesaria, d.maxima);
    const barras = [
      ["Requerida", d.necesaria, d.gira ? fuerza : tangente],
      ["Disponible", d.maxima, "#91e1bd"],
    ];
    for (const [i, [nombre, magnitud, color]] of barras.entries()) {
      const y = yBarra + i * 17;
      rotulo(ctx, nombre, inicio - 9, y, "#dae8fb", "right");
      linea(ctx, inicio, y, inicio + largo, y, "#546c98", 4);
      linea(ctx, inicio, y, inicio + magnitud * escalaBarras, y, color, 4);
    }
  }

  const radio = { id: "r", nombre: "Radio", unidad: "m", min: 40, max: 140 };
  montar({
    calcular: curva, instante: estadoCurva, dibujar,
    medidas: d => ({
      estado: d.gira ? "Sigue la curva" : "Sale por la tangente",
      f: unidades(d.necesaria, "N", 0), max: unidades(d.maxima, "N", 0),
      a: unidades(d.a, "m/s²"), vmax: unidades(d.limite, "km/h"),
    }),
    formulas: {
      "formula-curva": {
        objetivoInicial: "F",
        variables: [
          { id: "F", nombre: "Fuerza centrípeta", unidad: "N", max: 62000 },
          { id: "m", nombre: "Masa del coche", unidad: "kg", min: 400, max: 1600 },
          { id: "v", nombre: "Rapidez", unidad: "m/s", min: 0, max: 40 }, radio,
        ], operadores: ["=", "·", "/"],
        valores: d => ({ m: d.masa, v: d.v, r: d.radio }),
        despejes: {
          F: { expresion: "F = m · v² / r", calcular: ({ m, v, r }) => r > 0 ? m * v ** 2 / r : null, nota: "Al doblar la rapidez, la fuerza necesaria se multiplica por cuatro." },
          m: { expresion: "m = F · r / v²", calcular: ({ F, r, v }) => v > 0 ? F * r / v ** 2 : null },
          v: { expresion: "v = √(F · r / m)", calcular: ({ F, r, m }) => m > 0 ? Math.sqrt(F * r / m) : null },
          r: { expresion: "r = m · v² / F", calcular: ({ m, v, F }) => F > 0 ? m * v ** 2 / F : null },
        },
      },
      "formula-limite": {
        objetivoInicial: "vₘₐₓ",
        variables: [
          { id: "vₘₐₓ", nombre: "Rapidez límite", unidad: "m/s", max: 47 },
          { id: "μ", nombre: "Coeficiente", unidad: "sin unidad", max: 1.6 }, radio,
        ], operadores: ["=", "·"],
        valores: d => ({ "μ": d.maxima / (d.masa * g), r: d.radio }),
        despejes: {
          "vₘₐₓ": { expresion: "vₘₐₓ = √(μ · g · r)", calcular: ({ "μ": mu, r }) => Math.sqrt(mu * g * r), nota: "La masa se cancela al igualar la fuerza necesaria y el límite de rozamiento." },
          "μ": { expresion: "μ = vₘₐₓ² / (g · r)", calcular: ({ "vₘₐₓ": v, r }) => r > 0 ? v ** 2 / (g * r) : null },
          r: { expresion: "r = vₘₐₓ² / (μ · g)", calcular: ({ "vₘₐₓ": v, "μ": mu }) => mu > 0 ? v ** 2 / (mu * g) : null },
        },
      },
    },
  });
})();
