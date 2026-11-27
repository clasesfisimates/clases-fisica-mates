(() => {
  const { linea, flecha, etiquetaVector, rejilla, bloque } = window.LabDinamica;
  const { montar, unidades, rotulo, disco } = window.TallerDinamica;
  const { gravedad: g, poleas, estadoPoleas } = window.ModelosTallerDinamica;
  const tension = "#83ecd5";
  const peso = "#ffbc8d";

  function dibujar(ctx, ancho, alto, datos) {
    rejilla(ctx, ancho, alto);
    const cx = ancho / 2;
    const cy = alto * 0.23;
    const radio = Math.min(ancho * 0.17, alto * 0.18);
    const x1 = cx - radio;
    const x2 = cx + radio;
    const y1 = alto * (0.56 - datos.distancia * 0.10);
    const y2 = alto * (0.56 + datos.distancia * 0.10);

    const metal = ctx.createLinearGradient(cx - radio, cy - radio, cx + radio, cy + radio);
    metal.addColorStop(0, "#d0d5b6");
    metal.addColorStop(.4, "#638b81");
    metal.addColorStop(1, "#2d4d50");
    linea(ctx, cx, 0, cx, cy, "#809c92", 9);
    linea(ctx, cx - radio * .75, 12, cx + radio * .75, 12, "#d2cfb0", 4);
    disco(ctx, cx, cy, radio, metal, "#bdcabc");
    disco(ctx, cx, cy, radio * .80, "#244448", "#8aaba2");
    const giro = datos.distancia * alto * 0.10 / radio;
    for (let i = 0; i < 6; i++) {
      const angulo = giro + i * Math.PI / 3;
      const extremoX = cx + Math.cos(angulo) * radio * .74;
      const extremoY = cy + Math.sin(angulo) * radio * .74;
      linea(ctx, cx, cy, extremoX, extremoY, "#72958b", 3);
      disco(ctx, extremoX, extremoY, 2, "#cbd1b7");
    }
    disco(ctx, cx, cy, 7, "#c3a16d", "#e1d1a7");
    disco(ctx, cx, cy, 2.5, "#465851");

    ctx.beginPath();
    ctx.arc(cx, cy, radio, Math.PI, 2 * Math.PI);
    ctx.strokeStyle = "#e1ecf9";
    ctx.lineWidth = 3;
    ctx.stroke();
    linea(ctx, x1, cy, x1, y1, "#e1ecf9", 3);
    linea(ctx, x2, cy, x2, y2, "#e1ecf9", 3);
    const cajas = [[x1, y1, datos.m1, "m₁"], [x2, y2, datos.m2, "m₂"]];
    for (const [x, y, masa, nombre] of cajas) {
      bloque(ctx, x, y, 62, 36);
      rotulo(ctx, nombre + " · " + unidades(masa, "kg", 1), x, y + 2);
      const escala = (alto * 0.34 - 24) / (12 * g);
      if (datos.visibles.tension) {
        const largo = datos.tension * escala;
        flecha(ctx, x - 21, y - 13, 0, -largo, tension);
        etiquetaVector(ctx, "T", x - 31, y - 16 - largo, tension, "right");
      }
      if (datos.visibles.peso) {
        const largo = masa * g * escala;
        flecha(ctx, x + 21, y + 13, 0, largo, peso);
        etiquetaVector(ctx, "P", x + 31, y + 16 + largo, peso, "left");
      }
    }
  }

  const m1 = { id: "m₁", nombre: "Masa izquierda", unidad: "kg", min: 1, max: 12 };
  const m2 = { id: "m₂", nombre: "Masa derecha", unidad: "kg", min: 1, max: 12 };
  const a = { id: "a", nombre: "Aceleración", unidad: "m/s²", min: -9, max: 9 };
  montar({
    calcular: poleas,
    instante: estadoPoleas,
    dibujar,
    medidas: d => ({
      sentido: d.a === 0 ? "Equilibrio" : d.a > 0 ? "Baja la derecha" : "Baja la izquierda",
      a: unidades(d.a, "m/s²"), T: unidades(d.tension, "N"), distancia: unidades(Math.abs(d.distancia), "m"),
    }),
    formulas: {
      "formula-a": {
        objetivoInicial: "a", variables: [a, m1, m2], operadores: ["="],
        valores: d => ({ "m₁": d.m1, "m₂": d.m2 }),
        despejes: {
          a: { expresion: "a = g · (m₂ − m₁)/(m₁ + m₂)", calcular: ({ "m₁": m1, "m₂": m2 }) => poleas({ m1, m2 }).a, nota: "Tomamos a positiva cuando la derecha baja. g = 9,8 m/s²." },
          "m₁": { expresion: "m₁ = m₂ · (g − a)/(g + a)", calcular: ({ "m₂": m2, a }) => Math.abs(a) < g ? m2 * (g - a) / (g + a) : null },
          "m₂": { expresion: "m₂ = m₁ · (g + a)/(g − a)", calcular: ({ "m₁": m1, a }) => Math.abs(a) < g ? m1 * (g + a) / (g - a) : null },
        },
      },
      "formula-t": {
        objetivoInicial: "T", variables: [{ id: "T", nombre: "Tensión", unidad: "N", min: 0, max: 120 }, m1, a], operadores: ["=", "·"],
        valores: d => ({ "m₁": d.m1, a: d.a }),
        despejes: {
          T: { expresion: "T = m₁ · (g + a)", calcular: ({ "m₁": m1, a }) => m1 * (g + a), nota: "Escribimos el eje hacia arriba para la masa izquierda." },
          "m₁": { expresion: "m₁ = T/(g + a)", calcular: ({ T, a }) => a > -g ? T / (g + a) : null },
          a: { expresion: "a = T/m₁ − g", calcular: ({ T, "m₁": m1 }) => m1 > 0 ? T / m1 - g : null },
        },
      },
    },
  });
})();
