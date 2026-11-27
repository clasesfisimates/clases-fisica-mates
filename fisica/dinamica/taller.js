(() => {
  const { lienzo, crearReloj, mostrarRangos, numero, salida } = window.LabDinamica;
  const duracion = 7;
  const cientifico = new Intl.NumberFormat("es-ES", { notation: "scientific", maximumSignificantDigits: 3 });

  function unidades(valor, unidad, decimales = 2) {
    const texto = Math.abs(valor) > 0 && Math.abs(valor) < 0.01 ? cientifico.format(valor) : numero(valor, decimales);
    return texto + " " + unidad;
  }

  function rotulo(ctx, texto, x, y, color = "#e9f1ff", alinear = "center") {
    ctx.font = "650 12px system-ui, sans-serif";
    ctx.textAlign = alinear;
    ctx.textBaseline = "middle";
    ctx.fillStyle = color;
    ctx.fillText(texto, x, y);
  }

  function disco(ctx, x, y, radio, relleno, borde) {
    ctx.beginPath();
    ctx.arc(x, y, radio, 0, Math.PI * 2);
    ctx.fillStyle = relleno;
    ctx.fill();
    if (borde) {
      ctx.strokeStyle = borde;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  function montar({ calcular, instante, dibujar, medidas, formulas, ajustar }) {
    const panel = document.getElementById("controles");
    const controles = Object.fromEntries([...panel.querySelectorAll("input[type=range]")].map(campo => [campo.id, campo]));
    const recorrido = document.getElementById("recorrido");
    const velocidad = document.getElementById("ritmo");
    const controlesVectores = [...document.querySelectorAll("[data-vector]")];
    const visibles = Object.fromEntries(controlesVectores.map(campo => [campo.dataset.vector, campo.checked]));
    const salidas = [...document.querySelectorAll("[data-medida]")];
    const pintar = lienzo(document.getElementById("escena"), dibujar);
    let datos;
    let actual;
    const reloj = crearReloj((tiempo) => {
      const progreso = tiempo / duracion;
      actual = instante(datos, progreso);
      const lecturas = medidas(actual);
      for (const nodo of salidas) nodo.textContent = lecturas[nodo.dataset.medida];
      salida("tiempo-ensayo", unidades(actual.t, "s"));
      recorrido.value = String(Math.round(progreso * 1000));
      recorrido.setAttribute("aria-valuetext", unidades(actual.t, "segundos"));
      pintar({ ...actual, progreso, visibles });
    }, "Iniciar", "Repetir", () => Number(velocidad.value));

    function leerControles() {
      return Object.fromEntries(Object.entries(controles).map(([id, campo]) => [id, campo.valueAsNumber]));
    }

    function actualizar() {
      datos = calcular(leerControles());
      reloj.preparar(duracion, "Listo para iniciar.", "Ensayo terminado.");
    }

    panel.addEventListener("input", () => ajustar?.(controles));
    mostrarRangos(panel, actualizar);
    for (const boton of document.querySelectorAll("[data-preajuste]")) {
      boton.addEventListener("click", () => {
        const valores = JSON.parse(boton.dataset.preajuste);
        for (const [id, valor] of Object.entries(valores)) {
          controles[id].value = valor;
          ajustar?.(controles);
        }
        const primero = Object.keys(valores)[0];
        controles[primero].dispatchEvent(new Event("input", { bubbles: true }));
      });
    }
    for (const boton of document.querySelectorAll("[data-instante]")) {
      boton.addEventListener("click", () => reloj.irA(duracion * Number(boton.dataset.instante)));
    }
    recorrido.addEventListener("input", () => reloj.irA(duracion * recorrido.valueAsNumber / 1000));
    for (const campo of controlesVectores) campo.addEventListener("change", () => {
      visibles[campo.dataset.vector] = campo.checked;
      reloj.redibujar();
    });
    for (const [id, definicion] of Object.entries(formulas)) {
      const boton = document.getElementById(id);
      window.FormulaInteractiva.enlazar(boton, { ...definicion, leerValores: () => definicion.valores(actual) });
    }
    ajustar?.(controles);
    actualizar();
  }

  window.TallerDinamica = { montar, unidades, rotulo, disco };
})();
