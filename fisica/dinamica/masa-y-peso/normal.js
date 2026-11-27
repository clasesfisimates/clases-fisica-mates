(() => {
  "use strict";
  const modelo = window.ModeloNormal;
  const { numero, lienzo, flecha, etiquetaVector, linea, bloque } = window.LabDinamica;
  const canvas = document.getElementById("normal-lienzo");
  const masa = document.getElementById("normal-masa");
  const reproducir = document.getElementById("normal-reproducir");
  const suelo = document.getElementById("normal-suelo");
  const pasos = [...document.querySelectorAll("[data-normal-paso]")];
  const movimientoReducido = window.matchMedia("(prefers-reduced-motion: reduce)");
  const momentos = [0.65, modelo.duracionCaida + 0.3, modelo.duracion];
  const relatos = [
    ["Sin contacto", "El peso actúa sin tocar el suelo", "La Tierra atrae al objeto hacia abajo. Mientras está en el aire, el suelo no puede empujarlo: N = 0. Como solo actúa el peso, el objeto acelera hacia abajo."],
    ["Contacto y frenado", "El suelo se deforma y frena la caída", "Al tocarse, el objeto comprime ligeramente la superficie y esta lo empuja hacia arriba. Durante el frenado, la normal puede superar al peso: hace falta una resultante hacia arriba para reducir la velocidad de caída."],
    ["En equilibrio", "La normal evita que siga hundiéndose", "Una vez en reposo, el suelo ejerce tanta fuerza hacia arriba como el peso hacia abajo. La resultante es cero y el objeto permanece apoyado."],
    ["Sin suelo · N = 0", "Sin contacto, desaparece la normal", "El peso sigue actuando, pero ya no hay una superficie que empuje al objeto hacia arriba. N = 0, la resultante apunta hacia abajo y el objeto cae cada vez más deprisa."],
  ];
  let tiempo = modelo.duracion;
  let sinSuelo = false;
  let reproduciendo = false;
  let anterior = null;
  let fotograma = null;
  let faseAnterior = -1;

  function escribir(id, valor) { document.getElementById(id).textContent = valor; }
  function etiqueta(ctx, texto, x, y, color = "#d4e5ff") {
    ctx.font = "650 16px system-ui, sans-serif";
    ctx.fillStyle = color;
    ctx.fillText(texto, x, y);
  }

  const pintar = lienzo(canvas, (ctx, ancho, alto, datos) => {
    const fondo = ctx.createLinearGradient(0, 0, 0, alto);
    fondo.addColorStop(0, "#101b3c"); fondo.addColorStop(1, "#223b61");
    ctx.fillStyle = fondo; ctx.fillRect(0, 0, ancho, alto);
    for (let x = 20; x < ancho; x += 28) for (let y = 65; y < alto; y += 28) {
      ctx.fillStyle = "#8fb8ed20"; ctx.fillRect(x, y, 1.5, 1.5);
    }
    const x = ancho / 2;
    const nivel = alto * 0.72;
    const deformacion = datos.compresion / modelo.compresionEquilibrio * 7;
    const base = sinSuelo ? nivel + 7 - datos.altura * 330
      : nivel + deformacion - datos.altura / modelo.alturaInicial * 96;

    if (!sinSuelo) {
      const superficie = (posicion) => nivel + deformacion * Math.exp(-(((posicion - x) / 70) ** 2));
      ctx.beginPath(); ctx.moveTo(0, alto);
      for (let px = 0; px <= ancho + 4; px += 4) ctx.lineTo(px, superficie(px));
      ctx.lineTo(ancho, alto); ctx.closePath(); ctx.fillStyle = "#3a5278"; ctx.fill();
      ctx.beginPath();
      for (let px = 0; px <= ancho + 4; px += 4) {
        if (px === 0) ctx.moveTo(px, superficie(px)); else ctx.lineTo(px, superficie(px));
      }
      ctx.strokeStyle = "#a8d0fb"; ctx.lineWidth = 2.5; ctx.stroke();
      for (let fila = 0; fila < 2; fila++) for (let px = 15; px < ancho; px += 24) {
        ctx.beginPath(); ctx.arc(px, superficie(px) + 17 + fila * 23, 4, 0, Math.PI * 2);
        ctx.fillStyle = datos.fase !== 0 && Math.abs(px - x) < 60 ? "#9acbff" : "#7b9dc1";
        ctx.fill();
      }
      etiqueta(ctx, "Suelo · deformación ampliada", 16, alto - 17);
    } else {
      ctx.save(); ctx.setLineDash([6, 7]);
      linea(ctx, 0, nivel, ancho, nivel, "#9ab7dd60"); ctx.restore();
      etiqueta(ctx, "Ya no hay superficie de apoyo", 16, nivel - 15);
    }

    if (base < alto + 80) {
      // El pico al primer contacto con la masa máxima es de unos 396 N.
      const escalaFuerza = Math.min((nivel - 36) / 400, (alto - nivel - 6) / 98);
      bloque(ctx, x, base - 32, 92, 64);
      etiqueta(ctx, numero(masa.valueAsNumber) + " kg", x - 21, base - 38, "#fff");
      flecha(ctx, x - 22, base - 25, 0, datos.peso * escalaFuerza, "#ffba80", 4);
      if (base < alto) etiquetaVector(ctx, "Peso", x - 32, base - 25 + datos.peso * escalaFuerza, "#ffba80", "right");
      if (datos.normal > 0.1) {
        flecha(ctx, x + 24, base, 0, -datos.normal * escalaFuerza, "#94caff", 4);
        etiquetaVector(ctx, "Normal", x + 34, base - datos.normal * escalaFuerza, "#94caff", "left");
        linea(ctx, x + 24, base, x + 37, base, "#bcdcff", 2);
        linea(ctx, x + 37, base, x + 37, base - 13, "#bcdcff", 2);
        etiqueta(ctx, "90°", x + 58, base + 7, "#bcdcff");
      }
    } else {
      etiquetaVector(ctx, "↓ El bloque sigue cayendo", x, alto - 32, "#d4e5ff");
    }
  });

  function actualizarBoton() {
    reproducir.textContent = movimientoReducido.matches ? "Paso siguiente"
      : reproduciendo ? "Pausar" : tiempo >= modelo.duracion || sinSuelo ? "Ver animación" : "Continuar";
  }

  function mostrar() {
    const datos = modelo.calcular(masa.valueAsNumber, tiempo, sinSuelo);
    pintar(datos);
    escribir("normal-masa-valor", numero(masa.valueAsNumber) + " kg");
    escribir("normal-peso", numero(datos.peso, 1) + " N");
    escribir("normal-fuerza", numero(datos.normal, 1) + " N");
    const magnitud = Math.abs(datos.resultante);
    const direccion = magnitud < 0.05 ? "" : datos.resultante > 0 ? " ↑" : " ↓";
    escribir("normal-resultante", numero(magnitud, 1) + " N" + direccion);
    if (datos.fase !== faseAnterior) {
      faseAnterior = datos.fase;
      const relato = relatos[datos.fase];
      escribir("normal-insignia", relato[0]);
      escribir("normal-relato-titulo", relato[1]);
      escribir("normal-relato-texto", relato[2]);
      canvas.setAttribute("aria-label", relato[2]);
      for (const [indice, boton] of pasos.entries()) {
        if (indice === datos.fase) boton.setAttribute("aria-current", "step");
        else boton.removeAttribute("aria-current");
      }
    }
    suelo.textContent = sinSuelo ? "Reponer el suelo" : "Quitar el suelo";
    suelo.setAttribute("aria-pressed", String(sinSuelo));
    actualizarBoton();
  }

  function pausar() {
    reproduciendo = false; anterior = null;
    if (fotograma !== null) cancelAnimationFrame(fotograma);
    fotograma = null;
    actualizarBoton();
  }
  function avanzar(ahora) {
    if (!reproduciendo) return;
    if (anterior !== null) tiempo += Math.min((ahora - anterior) / 1000, 0.05);
    anterior = ahora;
    if (tiempo >= modelo.duracion) { tiempo = modelo.duracion; pausar(); }
    mostrar();
    if (reproduciendo) fotograma = requestAnimationFrame(avanzar);
  }
  function iniciar() {
    reproduciendo = true; anterior = null; actualizarBoton();
    fotograma = requestAnimationFrame(avanzar);
  }
  function irAPaso(indice) {
    pausar(); sinSuelo = false; tiempo = momentos[indice]; mostrar();
  }

  reproducir.addEventListener("click", () => {
    if (movimientoReducido.matches) {
      irAPaso(sinSuelo ? 0 : (modelo.calcular(masa.valueAsNumber, tiempo).fase + 1) % 3);
      return;
    }
    if (reproduciendo) { pausar(); return; }
    if (sinSuelo || tiempo >= modelo.duracion) { sinSuelo = false; tiempo = 0; }
    mostrar(); iniciar();
  });
  document.getElementById("normal-reiniciar").addEventListener("click", () => {
    pausar(); sinSuelo = false; tiempo = 0; mostrar();
  });
  pasos.forEach((boton, indice) => boton.addEventListener("click", () => irAPaso(indice)));
  masa.addEventListener("input", mostrar);
  suelo.addEventListener("click", () => {
    pausar(); sinSuelo = !sinSuelo; tiempo = sinSuelo ? 0 : modelo.duracion;
    // Con movimiento reducido, mostrar directamente el objeto ya en caída.
    if (sinSuelo && movimientoReducido.matches) tiempo = 1.5;
    mostrar();
    if (sinSuelo && !movimientoReducido.matches) iniciar();
  });
  document.addEventListener("visibilitychange", () => { if (document.hidden) pausar(); });
  movimientoReducido.addEventListener("change", () => { pausar(); mostrar(); });
  mostrar();
})();
