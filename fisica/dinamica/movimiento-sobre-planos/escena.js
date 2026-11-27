(() => {
  const { numero, rejilla, linea, dibujarVectores, etiquetaVector, suavizar, bloque } = window.LabDinamica;
  const colores = { P: "#ffba80", N: "#94caff", F: "#8be9cc", f: "#e5abff", resultante: "#ffe38a" };
  const nombres = { P: "Peso", N: "Normal", F: "Empuje", f: "Rozamiento", resultante: "ΣF" };

  function dibujar(ctx, ancho, alto, { d, paso, progreso, tiempo, iniciado, componentes, reducir }) {
    const seno = Math.sin(d.theta);
    const coseno = Math.cos(d.theta);
    const pendiente = Math.abs(seno);
    const detalle = paso === 1 ? suavizar(progreso / 0.18) : paso < 5 ? Number(paso > 1) : 1 - suavizar(progreso);
    const zoom = 1 + (0.83 + 0.34 * pendiente) * detalle;
    const semiplano = Math.min(ancho / 2 - 24, (alto - 134) / (2 * Math.max(pendiente, 0.2)));
    // Los máximos de los controles permiten reservar espacio para cualquier fuerza.
    const pixelesPorNewton = Math.min(1.65, (ancho - 42) / 310, (alto - 86) / 248);
    const medioY = 44 + (alto - 76) * 0.59;
    const largoResultado = Math.abs(d.resultante ?? 0) * pixelesPorNewton;
    const margenX = (ancho / 2 - 22) / coseno - largoResultado;
    const margenY = Math.min(medioY - 42, alto - medioY - 20) / Math.max(pendiente, 0.01) - largoResultado;
    const tramo = Math.max(0, Math.min(semiplano * 0.66, margenX, margenY));
    const avance = (d.aceleracion ?? 0) * tiempo ** 2 / 8 * tramo;
    const centro = { x: ancho / 2 + avance * coseno, y: medioY - avance * seno };
    const base = { x: ancho / 2 + 22 * zoom * seno, y: medioY + 22 * zoom * coseno };
    const largo = semiplano * zoom;
    const izquierda = { x: base.x - largo * coseno, y: base.y + largo * seno };
    const derecha = { x: base.x + largo * coseno, y: base.y - largo * seno };

    rejilla(ctx, ancho, alto);
    ctx.beginPath();
    ctx.moveTo(izquierda.x, izquierda.y);
    ctx.lineTo(derecha.x, derecha.y);
    ctx.lineTo(derecha.x, alto);
    ctx.lineTo(izquierda.x, alto);
    ctx.closePath();
    const terreno = ctx.createLinearGradient(0, base.y - 40, 0, alto);
    terreno.addColorStop(0, "#315554");
    terreno.addColorStop(1, "#192f35");
    ctx.fillStyle = terreno;
    ctx.fill();
    linea(ctx, izquierda.x, izquierda.y, derecha.x, derecha.y, "#d2ceb3", 3);
    ctx.save();
    ctx.globalAlpha = 1 - detalle * 0.75;
    for (let m = -4; m <= 4; m += 2) {
      const distancia = m / 4 * tramo * zoom;
      const x = base.x + distancia * coseno;
      const y = base.y - distancia * seno;
      linea(ctx, x, y, x + 7 * seno, y + 7 * coseno, "#879cc8", 2);
    }
    ctx.globalAlpha = 1 - detalle * 0.5;
    bloque(ctx, centro.x, centro.y, 52 * zoom, 44 * zoom, -d.theta);
    ctx.restore();

    const vectores = [];
    function proyectar(paralela, perpendicular) {
      return {
        x: (paralela * coseno - perpendicular * seno) * pixelesPorNewton,
        y: (-paralela * seno - perpendicular * coseno) * pixelesPorNewton,
      };
    }
    function vector(paralela, perpendicular, nombre, sufijo = "", alfa = 1) {
      const punta = proyectar(paralela, perpendicular);
      const longitud = Math.hypot(punta.x, punta.y);
      if (alfa > 0 && longitud >= 0.7) {
        vectores.push({ ...punta, longitud, color: colores[nombre], grosor: nombre === "resultante" ? 6 : 4, rotulo: sufijo ? nombre + sufijo : nombres[nombre], alfa });
      }
    }
    function descomponer(paralela, perpendicular, nombre, avance) {
      if (paralela === 0 || perpendicular === 0) {
        const sufijo = avance > 0.5 ? (perpendicular === 0 ? "∥" : "⊥") : "";
        vector(paralela, perpendicular, nombre, sufijo);
        return;
      }
      const guia = suavizar(avance / 0.48);
      const crecimiento = suavizar((avance - 0.14) / 0.60);
      const fundido = suavizar((avance - 0.70) / 0.22);
      if (paso === 1 && crecimiento > 0.3) {
        // La fuerza completa es la hipotenusa; los ejes forman el ángulo recto.
        const punta = proyectar(paralela, perpendicular);
        const adyacente = nombre === "P" ? proyectar(0, perpendicular) : proyectar(paralela, 0);
        ctx.save(); ctx.translate(centro.x, centro.y); ctx.globalAlpha = crecimiento * 0.75;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(adyacente.x, adyacente.y); ctx.lineTo(punta.x, punta.y); ctx.closePath();
        ctx.fillStyle = colores[nombre] + "25"; ctx.fill();
        linea(ctx, 0, 0, punta.x, punta.y, colores[nombre] + "99", 1.5);
        const lado = Math.hypot(adyacente.x, adyacente.y);
        const otro = Math.hypot(punta.x - adyacente.x, punta.y - adyacente.y);
        if (lado > 12 && otro > 12) {
          const ux = adyacente.x / lado, uy = adyacente.y / lado;
          const vx = (punta.x - adyacente.x) / otro, vy = (punta.y - adyacente.y) / otro;
          linea(ctx, adyacente.x - 8 * ux, adyacente.y - 8 * uy, adyacente.x - 8 * ux + 8 * vx, adyacente.y - 8 * uy + 8 * vy, "#dce8ff", 1.4);
          linea(ctx, adyacente.x - 8 * ux + 8 * vx, adyacente.y - 8 * uy + 8 * vy, adyacente.x + 8 * vx, adyacente.y + 8 * vy, "#dce8ff", 1.4);
        }
        ctx.restore();
      }
      if (guia > 0) {
        const punta = proyectar(paralela, perpendicular);
        const extremos = [proyectar(paralela, 0), proyectar(0, perpendicular)];
        ctx.save();
        ctx.globalAlpha = 0.66 * (1 - fundido * 0.72);
        ctx.setLineDash([3, 4]);
        for (const extremo of extremos) {
          linea(ctx, centro.x + punta.x, centro.y + punta.y,
            centro.x + punta.x + (extremo.x - punta.x) * guia,
            centro.y + punta.y + (extremo.y - punta.y) * guia, colores[nombre], 1.5);
        }
        ctx.restore();
      }
      vector(paralela, perpendicular, nombre, "", 1 - fundido);
      vector(paralela * crecimiento, 0, nombre, "∥", crecimiento);
      vector(0, perpendicular * crecimiento, nombre, "⊥", crecimiento);
    }

    const q = suavizar(progreso);
    const { pesoParalelo: p, fuerzaParalela: f, pesoPerpendicular: pp, fuerzaPerpendicular: fp, rozamiento } = d;
    if (paso === 0) {
      if (!iniciado && componentes) {
        descomponer(p, pp, "P", p === 0 ? 0 : 1);
        descomponer(f, fp, "F", fp === 0 ? 0 : 1);
      } else {
        vector(p, pp, "P");
        vector(f, fp, "F");
      }
      vector(0, d.normal, "N");
      vector(rozamiento, 0, "f");
    } else if (paso === 1) {
      ctx.save();
      ctx.globalAlpha = detalle * 0.36;
      ctx.setLineDash([3, 5]);
      for (const eje of [proyectar(135, 0), proyectar(0, 135)]) {
        linea(ctx, centro.x - eje.x, centro.y - eje.y, centro.x + eje.x, centro.y + eje.y, "#a9bee0");
      }
      ctx.restore();
      const proyeccion = reducir ? 1 : Math.max(0, (progreso - 0.16) / 0.78);
      const separarAmbas = p !== 0 && f !== 0 && fp !== 0;
      const verPeso = separarAmbas && !reducir ? Math.min(1, proyeccion * 2) : proyeccion;
      const verEmpuje = separarAmbas && !reducir ? Math.max(0, proyeccion * 2 - 1) : proyeccion;
      descomponer(p, pp, "P", verPeso);
      descomponer(f, fp, "F", verEmpuje);
      vector(0, d.normal, "N", "", 0.92);
      vector(rozamiento, 0, "f", "", 0.85);
    } else if (paso === 2) {
      vector(0, d.normal * (1 - q), "N");
      vector(0, pp * (1 - q), "P", "⊥");
      vector(0, fp * (1 - q), "F", "⊥");
      vector(p, 0, "P", "∥");
      vector(f, 0, "F", "∥");
      vector(rozamiento, 0, "f");
    } else {
      // Repartimos la cancelación del rozamiento entre las flechas que quedan.
      const comun = f * p < 0 ? Math.min(Math.abs(f), Math.abs(p)) : 0;
      const cancelacionParalela = comun * (paso === 3 ? q : 1);
      const pesoRestante = p - Math.sign(p) * cancelacionParalela;
      const empujeRestante = f - Math.sign(f) * cancelacionParalela;
      const fraccionRoce = d.motriz === 0 ? 0 : Math.min(1, Math.abs(rozamiento / d.motriz));
      const cancelacionRoce = paso === 3 ? 0 : paso === 4 ? q : 1;
      const resto = 1 - fraccionRoce * cancelacionRoce;
      const fundido = paso === 5 ? suavizar(progreso / 0.48) : 0;
      vector(pesoRestante * resto, 0, "P", "∥", 1 - fundido);
      vector(empujeRestante * resto, 0, "F", "∥", 1 - fundido);
      vector(rozamiento * (1 - cancelacionRoce), 0, "f");
      vector(d.resultante, 0, "resultante", "", fundido);
    }

    dibujarVectores(ctx, centro, vectores, ancho, alto);
    etiquetaVector(ctx, `θ = ${numero(d.angulo)}°`, 10, 19, "#dce8e8", "left");
    const marca = ancho - 14, inicioMarca = marca - 40 * pixelesPorNewton;
    linea(ctx, inicioMarca, 19, marca, 19, "#cadbd8", 2);
    linea(ctx, inicioMarca, 15, inicioMarca, 23, "#cadbd8", 2);
    linea(ctx, marca, 15, marca, 23, "#cadbd8", 2);
    etiquetaVector(ctx, "40 N", inicioMarca - 4, 19, "#cadbd8", "right");
    if (paso === 5 && !d.seMueve) etiquetaVector(ctx, "ΣF = 0 N", centro.x, centro.y - 58, colores.resultante);
  }

  window.EscenaPlanos = { dibujar };
})();
