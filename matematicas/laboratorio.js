(() => {
  const numeroES = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 4 });
  const numero = (valor) => numeroES.format(Math.abs(valor) < 1e-10 ? 0 : valor).replace("-", "−");
  const porcentaje = (valor) => numero(valor * 100) + " %";
  const rango = (id, nombre, min, max, valor, paso = 1) => ({ id, nombre, min, max, valor, paso });
  const opciones = (id, nombre, valores) => ({ id, nombre, opciones: valores });
  const boton = (texto, atributos = "") => `<button class="mate-boton" type="button" ${atributos}>${texto}</button>`;
  const pizarra = (contenido) => `<figure class="mate-pizarra">${contenido}</figure>`;
  const pieza = (texto, clase = "") => `<span class="mate-pieza ${clase}">${texto}</span>`;

  function controles(contenedor, campos, actualizar) {
    const entradas = document.createElement("div");
    entradas.className = "mate-controles";
    const elementos = {};
    for (const campo of campos) {
      const etiqueta = document.createElement("label");
      etiqueta.className = "mate-control";
      if (campo.clase) etiqueta.classList.add(campo.clase);
      const titulo = document.createElement("span");
      titulo.textContent = campo.nombre;
      etiqueta.append(titulo);
      if (campo.opciones) {
        const select = document.createElement("select");
        for (const [valor, texto] of campo.opciones) select.add(new Option(texto, valor));
        if (campo.valor !== undefined) select.value = campo.valor;
        elementos[campo.id] = { entrada: select };
        etiqueta.append(select);
      } else {
        const input = document.createElement("input");
        Object.assign(input, { type: "range", min: campo.min, max: campo.max, step: campo.paso, value: campo.valor });
        input.setAttribute("aria-label", campo.nombre);
        const lectura = document.createElement("output");
        lectura.setAttribute("aria-hidden", "true");
        titulo.append(lectura);
        elementos[campo.id] = { entrada: input, lectura };
        etiqueta.append(input);
      }
      entradas.append(etiqueta);
    }
    contenedor.prepend(entradas);

    function pintar() {
      const valores = {};
      for (const [id, { entrada }] of Object.entries(elementos)) {
        valores[id] = entrada.type === "range" ? entrada.valueAsNumber : entrada.value;
      }
      actualizar(valores, elementos);
      for (const { entrada, lectura } of Object.values(elementos)) {
        if (lectura) lectura.value = numero(entrada.valueAsNumber);
      }
    }

    entradas.addEventListener("input", (evento) => {
      if (evento.target.matches("input, select")) pintar();
    });
    pintar();
  }

  function resultados(datos) {
    return `<div class="mate-resultados">${datos.map(([titulo, valor]) =>
      `<div class="mate-resultado"><span>${titulo}</span><strong>${valor}</strong></div>`
    ).join("")}</div>`;
  }

  function pasos(nodo, escenas) {
    if (!nodo) return;
    nodo.innerHTML = `${pizarra('<div class="mate-paso" aria-live="polite"></div>')}
      <div class="mate-controles mate-pasos-controles">
        ${boton("Anterior", "data-anterior")}
        ${boton("Siguiente", "data-siguiente")}
        ${boton("Reproducir", "data-reproducir")}
        <span class="mate-progreso"></span>
      </div>`;
    const pantalla = nodo.querySelector(".mate-paso");
    const anterior = nodo.querySelector("[data-anterior]");
    const siguiente = nodo.querySelector("[data-siguiente]");
    const reproducir = nodo.querySelector("[data-reproducir]");
    let paso = 0;
    let reloj;
    function pintar() {
      const [titulo, expresion, explicacion, visual = ""] = escenas[paso];
      pantalla.innerHTML = `<div class="mate-paso-cuerpo"><h3>${titulo}</h3><p class="mate-ecuacion">${expresion}</p><p>${explicacion}</p>${visual}</div>`;
      anterior.disabled = paso === 0;
      siguiente.disabled = paso === escenas.length - 1;
      nodo.querySelector(".mate-progreso").textContent = `Paso ${paso + 1} de ${escenas.length}`;
      reproducir.textContent = reloj ? "Pausar" : paso === escenas.length - 1 ? "Volver a reproducir" : paso ? "Continuar" : "Reproducir";
    }
    function detener() {
      clearInterval(reloj);
      reloj = undefined;
    }
    anterior.addEventListener("click", () => { detener(); paso--; pintar(); });
    siguiente.addEventListener("click", () => { detener(); paso++; pintar(); });
    reproducir.addEventListener("click", () => {
      if (reloj) { detener(); pintar(); return; }
      if (paso === escenas.length - 1) paso = 0;
      reloj = setInterval(() => {
        paso++;
        if (paso === escenas.length - 1) detener();
        pintar();
      }, 4000);
      pintar();
    });
    pintar();
  }

  function grafica(canvas) {
    let vista;
    function pintar() {
      if (!vista) return;
      const { width, height } = canvas.getBoundingClientRect();
      const ctx = canvas.getContext("2d");
      if (!width || !height || !ctx) return;
      const escala = window.devicePixelRatio || 1;
      canvas.width = Math.round(width * escala);
      canvas.height = Math.round(height * escala);
      ctx.scale(escala, escala);
      const { minX, maxX, minY, maxY, marcasX, marcasY, calcular, puntos, muestreo = 1 } = vista;
      const left = 40, right = width - 18, top = 16, bottom = height - 27;
      const x = (v) => left + (v - minX) * (right - left) / (maxX - minX);
      const y = (v) => bottom - (v - minY) * (bottom - top) / (maxY - minY);
      function linea(x1, y1, x2, y2, color) {
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      ctx.font = "13px system-ui, sans-serif";
      ctx.fillStyle = "#ffe3db";
      ctx.textAlign = "center";
      for (const marca of marcasX) {
        linea(x(marca), top, x(marca), bottom, "#eab5bc37");
        ctx.fillText(numero(marca), x(marca), bottom + 17);
      }
      ctx.textAlign = "right";
      for (const marca of marcasY) {
        linea(left, y(marca), right, y(marca), "#eab5bc37");
        ctx.fillText(numero(marca), left - 6, y(marca) + 4);
      }
      linea(left, y(0), right, y(0), "#f0d6b0");
      linea(x(0), top, x(0), bottom, "#f0d6b0");
      ctx.textAlign = "left";
      ctx.fillText("x", right + 5, y(0) + 4);
      ctx.fillText("y", x(0) + 5, top - 3);
      ctx.save();
      ctx.beginPath();
      ctx.rect(left, top, right - left, bottom - top);
      ctx.clip();
      ctx.strokeStyle = "#ffd18c";
      ctx.lineWidth = 3;
      ctx.lineJoin = "round";
      ctx.beginPath();
      let trazando = false;
      for (let i = 0; i <= 300; i++) {
        const valorX = minX + (maxX - minX) * (i / 300) ** muestreo;
        const valorY = calcular(valorX);
        if (!Number.isFinite(valorY)) { trazando = false; continue; }
        if (trazando) ctx.lineTo(x(valorX), y(valorY));
        else ctx.moveTo(x(valorX), y(valorY));
        trazando = true;
      }
      ctx.stroke();
      ctx.lineWidth = 1;
      for (const [px, py] of puntos) {
        ctx.setLineDash([4, 3]);
        linea(x(0), y(py), x(px), y(py), "#ffcfb8");
        linea(x(px), y(0), x(px), y(py), "#ffcfb8");
        ctx.setLineDash([]);
      }
      ctx.restore();
      ctx.fillStyle = "#fff4df";
      ctx.strokeStyle = "#542f26";
      ctx.lineWidth = 2;
      for (const [px, py] of puntos) {
        ctx.beginPath();
        ctx.arc(x(px), y(py), 4.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      canvas.setAttribute("aria-label", vista.descripcion);
    }
    new ResizeObserver(pintar).observe(canvas);
    return (nuevaVista) => { vista = nuevaVista; pintar(); };
  }

  window.Mate = { numero, porcentaje, rango, opciones, boton, pizarra, pieza, controles, resultados, pasos, grafica };
})();
