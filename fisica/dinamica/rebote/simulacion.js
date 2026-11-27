(() => {
  const { linea, flecha, etiquetaVector, rejilla } = window.LabDinamica;
  const { montar, unidades, rotulo, disco } = window.TallerDinamica;
  const { rebote, estadoRebote } = window.ModelosTallerDinamica;
  const velocidad = "#a5ecff";
  const fuerza = "#ffaccc";

  function dibujarPelota(ctx, x, y, radio, compresion) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1 - 0.28 * compresion, 1 + 0.14 * compresion);
    const color = ctx.createRadialGradient(-radio * 0.38, -radio * 0.48, 2, 0, 0, radio);
    color.addColorStop(0, "#fff0bf");
    color.addColorStop(0.5, "#f8ae78");
    color.addColorStop(1, "#b74e6f");
    disco(ctx, 0, 0, radio, color, "#ffd8b3");
    ctx.beginPath();
    ctx.ellipse(0, 0, radio * 0.55, radio * 0.96, 0.6, 0, Math.PI * 2);
    ctx.strokeStyle = "#ffe0b97d";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  function dibujarPulso(ctx, ancho, alto, d) {
    const inicio = 30;
    const fin = ancho - 33;
    const techo = alto * 0.63;
    const base = alto - 28;
    const t = s => inicio + s / 0.73 * (fin - inicio);
    const contacto = t(0.25);
    const salida = t(0.25 + d.contacto);
    const escalaF = Math.max(220, Math.ceil(Math.abs(d.fuerza) / 100) * 100);
    const profundidad = Math.abs(d.fuerza) / escalaF * (base - techo);
    linea(ctx, inicio, techo, fin, techo, "#a1b4df", 1.3);
    linea(ctx, inicio, techo, inicio, base, "#6b86bf");
    rotulo(ctx, "F (N)", inicio - 2, techo - 13);
    rotulo(ctx, "t (s)", fin, base + 15);
    rotulo(ctx, "0", inicio - 12, techo, "#a1b4df");
    ctx.fillStyle = "#fe8db240";
    ctx.fillRect(contacto, techo, salida - contacto, profundidad);
    linea(ctx, contacto, techo, contacto, techo + profundidad, fuerza, 1.6);
    linea(ctx, contacto, techo + profundidad, salida, techo + profundidad, fuerza, 1.6);
    linea(ctx, salida, techo + profundidad, salida, techo, fuerza, 1.6);
    rotulo(ctx, unidades(d.fuerza, "N"), Math.min(salida + 6, fin - 45), techo + profundidad * 0.75 + 7, fuerza, "left");
    const curso = t(d.t);
    linea(ctx, curso, techo - 5, curso, base + 3, "#a5ecff9c", 1.5);
    disco(ctx, curso, d.fuerzaActual ? techo + profundidad : techo, 3.5, velocidad);
  }

  function dibujar(ctx, ancho, alto, d) {
    rejilla(ctx, ancho, alto);
    const suelo = alto * 0.48;
    const pared = ancho * 0.85;
    const y = alto * 0.35;
    const radio = 14 + d.masa * 13;
    const escala = ancho * 0.105;
    const x = pared - radio * (1 - 0.28 * d.compresion) - d.separacion * escala;
    ctx.fillStyle = "#334369";
    ctx.fillRect(pared, alto * 0.09, ancho - pared, suelo - alto * 0.09);
    linea(ctx, pared, alto * 0.09, pared, suelo, "#cfc9ed", 3);
    linea(ctx, 12, suelo, ancho - 10, suelo, "#748bb7", 2);
    for (let marca = alto * 0.12; marca < suelo - 2; marca += 10) {
      linea(ctx, pared + 5, marca, ancho - 6, marca - 6, "#768bb268");
    }
    disco(ctx, x, suelo - 7, 4, "#a1b8e186");
    dibujarPelota(ctx, x, y, radio, d.compresion);
    rotulo(ctx, d.fase, 15, 19, "#ffdaf0", "left");
    rotulo(ctx, "+x →", 15, suelo + 13, velocidad, "left");
    if (d.visibles.velocidad) {
      const largo = d.v * ancho * 0.0064;
      const fila = y - radio - 12;
      flecha(ctx, x, fila, largo, 0, velocidad);
      const lectura = Math.abs(largo) >= 12 ? "v" : "v = " + unidades(d.v, "m/s");
      etiquetaVector(ctx, lectura, x + largo / 2, fila - 15, velocidad);
    }
    if (d.visibles.pared && d.fuerzaActual !== 0) {
      const largo = d.fuerzaActual * ancho * 0.00048;
      flecha(ctx, x, y, largo, 0, fuerza);
      etiquetaVector(ctx, "F", x + largo / 2, y + 18, fuerza);
    }
    dibujarPulso(ctx, ancho, alto, d);
  }

  const impulso = { id: "Δp", nombre: "Impulso", unidad: "N·s", min: -24, max: 0 };
  montar({
    calcular: rebote, instante: estadoRebote, dibujar,
    ajustar: controles => { controles.salida.max = controles.entrada.value; },
    medidas: d => ({
      fase: d.fase, v: unidades(d.v, "m/s"), j: unidades(d.impulso, "N·s"), f: unidades(d.fuerza, "N"),
    }),
    formulas: {
      "formula-impulso": {
        objetivoInicial: "Δp",
        variables: [
          impulso,
          { id: "m", nombre: "Masa", unidad: "kg", min: 0.1, max: 0.6 },
          { id: "v_f", nombre: "Velocidad final", unidad: "m/s", min: -20, max: 0 },
          { id: "v_i", nombre: "Velocidad inicial", unidad: "m/s", min: 3, max: 20 },
        ], operadores: ["=", "·", "−"],
        valores: d => ({ m: d.masa, v_f: d.vf, v_i: d.entrada }),
        despejes: {
          "Δp": { expresion: "Δp = m · (v_f − v_i)", calcular: ({ m, v_f, v_i }) => m * (v_f - v_i), nota: "El signo menos indica que la pared ejerce el impulso en sentido opuesto a la llegada." },
          m: { expresion: "m = Δp/(v_f − v_i)", calcular: ({ "Δp": deltaP, v_f, v_i }) => v_f !== v_i ? deltaP / (v_f - v_i) : null },
          v_f: { expresion: "v_f = v_i + Δp/m", calcular: ({ "Δp": deltaP, m, v_i }) => m > 0 ? v_i + deltaP / m : null },
          v_i: { expresion: "v_i = v_f − Δp/m", calcular: ({ "Δp": deltaP, m, v_f }) => m > 0 ? v_f - deltaP / m : null },
        },
      },
      "formula-fuerza": {
        objetivoInicial: "Fₘ",
        variables: [
          { id: "Fₘ", nombre: "Fuerza media", unidad: "N", min: -1200, max: 0 },
          impulso,
          { id: "Δt", nombre: "Tiempo de contacto", unidad: "s", min: 0.02, max: 0.18, decimales: 3 },
        ], operadores: ["=", "/"],
        valores: d => ({ "Δp": d.impulso, "Δt": d.contacto }),
        despejes: {
          "Fₘ": { expresion: "Fₘ = Δp/Δt", calcular: ({ "Δp": deltaP, "Δt": t }) => t > 0 ? deltaP / t : null, nota: "La fuerza media da el mismo impulso que la fuerza real variable." },
          "Δp": { expresion: "Δp = Fₘ · Δt", calcular: ({ "Fₘ": F, "Δt": t }) => F * t },
          "Δt": { expresion: "Δt = Δp/Fₘ", calcular: ({ "Fₘ": F, "Δp": deltaP }) => F !== 0 ? deltaP / F : null },
        },
      },
    },
  });
})();
