(() => {
  const { linea, flecha } = window.LabDinamica;
  const { montar, unidades, rotulo, disco } = window.TallerDinamica;
  const { G, gravitacion, estadoGravedad } = window.ModelosTallerDinamica;
  const fuerza = "#ffe2a4";
  const centro = "#8df4df";
  const conversion = G * 1e9;

  function asteroide(ctx, x, y, radio, claro, oscuro) {
    const luz = ctx.createRadialGradient(x - radio * 0.42, y - radio * 0.5, 2, x, y, radio);
    luz.addColorStop(0, claro);
    luz.addColorStop(1, oscuro);
    disco(ctx, x, y, radio, luz, claro);
    disco(ctx, x + radio * 0.29, y - radio * 0.32, radio * 0.25, "#152d4773", "#c4e4e449");
    disco(ctx, x - radio * 0.33, y + radio * 0.25, radio * 0.16, "#152d4773");
    disco(ctx, x + radio * 0.35, y + radio * 0.32, radio * 0.10, "#152d4773");
  }

  function dibujar(ctx, ancho, alto, d) {
    const cielo = ctx.createRadialGradient(ancho * 0.5, alto * 0.45, 0, ancho * 0.55, alto * 0.6, alto * 0.72);
    cielo.addColorStop(0, "#254b68");
    cielo.addColorStop(1, "#101b40");
    ctx.fillStyle = cielo;
    ctx.fillRect(0, 0, ancho, alto);
    for (let i = 0; i < 85; i++) {
      const x = ((i * 173 + 51) % 677) / 677 * ancho;
      const y = ((i * 139 + 31) % 443) / 443 * alto;
      disco(ctx, x, y, i % 7 === 0 ? 1.2 : 0.55, i % 3 === 0 ? "#cddfff98" : "#91c8e493");
    }
    const y = alto * 0.47;
    const escala = ancho * 0.165 / 1000;
    const origen1 = ancho / 2 - d.r0 * escala / 2;
    const origen2 = ancho / 2 + d.r0 * escala / 2;
    const x1 = origen1 + d.recorrido1 * escala;
    const x2 = origen2 - d.recorrido2 * escala;
    const cm = (origen1 * d.m1 + origen2 * d.m2) / (d.m1 + d.m2);
    const radio1 = 10 + 5 * Math.cbrt(d.m1 / 1e12);
    const radio2 = 10 + 5 * Math.cbrt(d.m2 / 1e12);
    linea(ctx, origen1 - 8, y, origen2 + 8, y, "#83a8c38f");
    ctx.save();
    ctx.setLineDash([4, 5]);
    linea(ctx, cm, y - 72, cm, y + 88, "#8df4df99", 1.2);
    ctx.restore();
    disco(ctx, cm, y, 3.5, centro);
    asteroide(ctx, x1, y, radio1, "#a7e9df", "#2b7c8c");
    asteroide(ctx, x2, y, radio2, "#c4bdfa", "#5253a0");
    rotulo(ctx, "m₁", x1, y);
    rotulo(ctx, "m₂", x2, y);
    rotulo(ctx, "Centro de masas", cm, y + 101, centro);
    const cotaY = y - 84;
    linea(ctx, x1, cotaY, x2, cotaY, "#a4bce1");
    linea(ctx, x1, cotaY - 5, x1, cotaY + 5, "#a4bce1");
    linea(ctx, x2, cotaY - 5, x2, cotaY + 5, "#a4bce1");
    rotulo(ctx, unidades(d.r / 1000, "km"), (x1 + x2) / 2, cotaY - 13);
    if (d.capa) {
      const longitud = d.fuerza / 1e9 * Math.min(62, ancho * 0.152);
      flecha(ctx, x1, y - 33, longitud, 0, fuerza);
      flecha(ctx, x2, y + 34, -longitud, 0, fuerza);
      rotulo(ctx, "F₁ →", x1, y - 48, fuerza);
      rotulo(ctx, "← F₂", x2, y + 49, fuerza);
    }
  }

  const f = { id: "F", nombre: "Fuerza", unidad: "GN", max: 3.6, decimales: 3 };
  montar({
    calcular: gravitacion, instante: estadoGravedad, dibujar,
    medidas: d => ({
      r: unidades(d.r / 1000, "km"), F: unidades(d.fuerza / 1e9, "GN"),
      a1: unidades(d.a1 * 1000, "mm/s²"), a2: unidades(d.a2 * 1000, "mm/s²"),
    }),
    formulas: {
      "formula-gravedad": {
        objetivoInicial: "F",
        variables: [
          f,
          { id: "m₁", nombre: "Masa izquierda", unidad: "×10¹² kg", min: 2, max: 10 },
          { id: "m₂", nombre: "Masa derecha", unidad: "×10¹² kg", min: 2, max: 10 },
          { id: "r", nombre: "Distancia", unidad: "km", min: 1.3, max: 4 },
        ], operadores: ["=", "·", "/"],
        valores: d => ({ "m₁": d.m1 / 1e12, "m₂": d.m2 / 1e12, r: d.r / 1000 }),
        despejes: {
          F: { expresion: "F = 0,066743 · m₁ · m₂ / r²", calcular: ({ "m₁": a, "m₂": b, r }) => r > 0 ? conversion * a * b / r ** 2 : null, nota: "El factor 0,066743 incorpora las unidades de las barras y da el resultado en GN." },
          r: { expresion: "r = √(0,066743 · m₁ · m₂ / F)", calcular: ({ "m₁": a, "m₂": b, F }) => F > 0 ? Math.sqrt(conversion * a * b / F) : null },
          "m₁": { expresion: "m₁ = F · r² / (0,066743 · m₂)", calcular: ({ F, r, "m₂": m }) => m > 0 ? F * r ** 2 / (conversion * m) : null },
          "m₂": { expresion: "m₂ = F · r² / (0,066743 · m₁)", calcular: ({ F, r, "m₁": m }) => m > 0 ? F * r ** 2 / (conversion * m) : null },
        },
      },
      "formula-aceleracion": {
        objetivoInicial: "a",
        variables: [
          { id: "a", nombre: "Aceleración", unidad: "mm/s²", max: 0.6, decimales: 3 }, f,
          { id: "m", nombre: "Masa del cuerpo", unidad: "×10¹² kg", min: 2, max: 10 },
        ], operadores: ["=", "/"],
        valores: d => ({ F: d.fuerza / 1e9, m: d.m1 / 1e12 }),
        despejes: {
          a: { expresion: "a = F/m", calcular: ({ F, m }) => m > 0 ? F / m : null, nota: "Parte de la masa izquierda. Para comparar con la derecha, conserva F y cambia m." },
          F: { expresion: "F = m · a", calcular: ({ m, a }) => m * a },
          m: { expresion: "m = F/a", calcular: ({ F, a }) => a > 0 ? F / a : null },
        },
      },
    },
  });
})();
