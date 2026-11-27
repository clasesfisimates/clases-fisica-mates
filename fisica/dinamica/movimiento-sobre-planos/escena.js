(() => {
  const { numero, rejilla, linea, flecha, bloque } = window.LabDinamica;
  const colores = { P: "#ffba80", N: "#94caff", F: "#8be9cc", f: "#e5abff", resultante: "#ffe38a" };
  const pixelesPorNewton = 0.75;

  function suavizar(progreso) {
    const t = Math.max(0, Math.min(1, progreso));
    return t * t * (3 - 2 * t);
  }

  function etiqueta(ctx, texto, x, y, color, alineacion = "center") {
    ctx.save();
    ctx.font = "650 14px system-ui, sans-serif";
    ctx.textAlign = alineacion;
    ctx.textBaseline = "middle";
    const ancho = ctx.measureText(texto).width;
    const izquierda = alineacion === "center" ? x - ancho / 2 : alineacion === "right" ? x - ancho : x;
    ctx.fillStyle = "#142f36";
    ctx.fillRect(izquierda - 4, y - 9, ancho + 8, 18);
    ctx.fillStyle = color;
    ctx.fillText(texto, x, y + 0.5);
    ctx.restore();
  }

  function dibujarVectores(ctx, origen, vectores, ancho, alto) {
    vectores.sort((a, b) => b.longitud - a.longitud);
    const etiquetas = [];
    ctx.save();
    ctx.font = "650 14px system-ui, sans-serif";
    ctx.fillStyle = "#dbe7ff";
    ctx.beginPath();
    ctx.arc(origen.x, origen.y, 2.6, 0, Math.PI * 2);
    ctx.fill();
    for (const [i, v] of vectores.entries()) {
      const solapada = vectores.slice(i + 1).some((otra) => (v.x * otra.x + v.y * otra.y) / (v.longitud * otra.longitud) > 0.998);
      ctx.save();
      ctx.globalAlpha = v.alfa;
      flecha(ctx, origen.x, origen.y, v.x, v.y, v.color, false, solapada ? 7 : 3.5);
      ctx.restore();
      if (v.alfa < 0.48) continue;

      const mitad = 5 + ctx.measureText(v.rotulo).width / 2;
      const ux = v.x / v.longitud;
      const uy = v.y / v.longitud;
      const distancia = Math.max(v.longitud + 19, 34 + mitad);
      for (const lateral of [0, -22, 22, -44, 44, -66, 66]) {
        const x = Math.max(mitad + 5, Math.min(ancho - mitad - 5, origen.x + ux * distancia - uy * lateral));
        const y = Math.max(67, Math.min(alto - 13, origen.y + uy * distancia + ux * lateral));
        if (etiquetas.some((e) => Math.abs(e.x - x) < e.mitad + mitad + 4 && Math.abs(e.y - y) < 20)) continue;
        etiquetas.push({ x, y, mitad, vector: v });
        break;
      }
    }
    for (const { x, y, vector: v } of etiquetas) {
      linea(ctx, origen.x + v.x, origen.y + v.y, x, y, v.color + "80");
      etiqueta(ctx, v.rotulo, x, y, v.color);
    }
    ctx.restore();
  }

  function dibujar(ctx, ancho, alto, { d, paso, progreso, tiempo, iniciado, componentes, reducir }) {
    const seno = Math.sin(d.theta);
    const coseno = Math.cos(d.theta);
    const pendiente = Math.abs(seno);
    const detalle = paso === 1 ? suavizar(progreso / 0.18) : paso < 5 ? Number(paso > 1) : 1 - suavizar(progreso);
    const zoom = 1 + (0.83 + 0.34 * pendiente) * detalle;
    const semiplano = Math.min(ancho / 2 - 24, (alto - 134) / (2 * Math.max(pendiente, 0.2)));
    const tramo = Math.min(semiplano * 0.66, Math.max(0, ancho / 2 - 104), 32 / Math.max(pendiente, 0.01));
    const avance = (d.aceleracion ?? 0) * tiempo ** 2 / 8 * tramo;
    const centro = { x: ancho / 2 + avance * coseno, y: alto * 0.51 - avance * seno };
    const base = { x: ancho / 2 + 22 * zoom * seno, y: alto * 0.51 + 22 * zoom * coseno };
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
        vectores.push({ ...punta, longitud, color: colores[nombre], rotulo: nombre === "resultante" ? "ΣF" : nombre + sufijo, alfa });
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
        descomponer(p, pp, "P", p === 0 ? 0 : 0.75);
        descomponer(f, fp, "F", fp === 0 ? 0 : 0.75);
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
      const proyeccion = reducir ? 0.75 : Math.max(0, (progreso - 0.16) / 0.78);
      const separarAmbas = p !== 0 && f !== 0 && fp !== 0;
      const verPeso = separarAmbas && !reducir ? Math.min(1, proyeccion * 2) : proyeccion;
      const verEmpuje = separarAmbas && !reducir ? Math.max(0, proyeccion * 2 - 1) : proyeccion;
      descomponer(p, pp, "P", verPeso);
      descomponer(f, fp, "F", verEmpuje);
      vector(0, d.normal, "N", "", 0.88);
      vector(rozamiento, 0, "f", "", 0.72);
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
    ctx.fillStyle = "#142f36ef";
    ctx.fillRect(0, 0, ancho, 60);
    etiqueta(ctx, `θ = ${numero(d.angulo)}°`, 18, 23, "#dce8ff", "left");
    etiqueta(ctx, "+ hacia la derecha", ancho - 16, 23, "#c1d1f5", "right");
    const marca = ancho - 18;
    const inicioMarca = marca - 40 * pixelesPorNewton;
    linea(ctx, inicioMarca, 47, marca, 47, "#c1d1f5", 2);
    linea(ctx, inicioMarca, 43, inicioMarca, 51, "#c1d1f5", 2);
    linea(ctx, marca, 43, marca, 51, "#c1d1f5", 2);
    etiqueta(ctx, "40 N", inicioMarca - 8, 47, "#c1d1f5", "right");
    if (detalle > 0.4) etiqueta(ctx, "Detalle de fuerzas", 18, 47, "#c1d1f5", "left");
    if (paso === 5 && !d.seMueve) etiqueta(ctx, "ΣF = 0 N", centro.x, centro.y - 64, colores.resultante);
  }

  window.EscenaPlanos = { dibujar };
})();
