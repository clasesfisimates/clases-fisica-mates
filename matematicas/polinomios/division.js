(() => {
  const { boton, pizarra } = window.Mate;
  const nodo = document.querySelector('[data-simulacion="division"]');
  const escenas = [
    ["Ordenamos por grados", "Cada potencia ocupa una columna: x³, x², x y el término independiente. Dividimos entre x² + x + 1.", "Dividendo ÷ divisor"],
    ["Miramos los términos de mayor grado", "Tomamos x³ del dividendo y x² del divisor. Sus exponentes nos dicen por dónde empezar.", "x³ ÷ x²"],
    ["Dividimos los primeros términos", "Al dividir potencias de la misma base restamos sus exponentes: 3 − 2 = 1.", "x³ ÷ x² = x"],
    ["El resultado pasa al cociente", "Colocamos x en el cociente. Ahora hay que multiplicarlo por todos los términos del divisor.", "Primer término del cociente: x"],
    ["Multiplicamos x por todo el divisor", "x · x² = x³; x · x = x²; x · 1 = x. Cada producto se coloca debajo de su mismo grado.", "x(x² + x + 1) = x³ + x² + x"],
    ["Para restar, cambiamos todos los signos", "Restar el producto entero significa sumar sus opuestos. El cambio afecta a los tres términos.", "−(x³ + x² + x) = −x³ − x² − x"],
    ["Restamos columna por columna", "x³ − x³ = 0; 6x² − x² = 5x²; 8x − x = 7x. Bajamos el +7.", "Resto parcial: 5x² + 7x + 7"],
    ["Volvemos al mayor grado del resto", "Ahora comparamos 5x² con el primer término del divisor, x².", "5x² ÷ x²"],
    ["Obtenemos el siguiente término", "Los coeficientes dan 5 ÷ 1 y las potencias x² se cancelan.", "5x² ÷ x² = 5"],
    ["Añadimos +5 al cociente", "Ya tenemos x + 5. Falta multiplicar el divisor por 5 y volver a restar.", "Cociente: x + 5"],
    ["Multiplicamos 5 por todo el divisor", "5 · x² = 5x²; 5 · x = 5x; 5 · 1 = 5. Alineamos otra vez las potencias.", "5(x² + x + 1) = 5x² + 5x + 5"],
    ["Cambiamos los signos del nuevo producto", "Restamos todos sus términos, incluidos el término con x y el independiente.", "−(5x² + 5x + 5) = −5x² − 5x − 5"],
    ["Restamos y obtenemos el resto", "5x² − 5x² = 0; 7x − 5x = 2x; 7 − 5 = 2.", "Resto: 2x + 2"],
    ["Sabemos cuándo parar", "El resto tiene grado 1 y el divisor grado 2. Ya no podemos continuar la división de polinomios.", "Cociente = x + 5 · Resto = 2x + 2"],
    ["Comprobamos la igualdad", "Divisor por cociente, más resto, debe devolver el dividendo original.", "x³ + 6x² + 8x + 7 = (x² + x + 1)(x + 5) + (2x + 2)"],
  ];
  nodo.innerHTML = `${pizarra(`<div class="poli-video-cabecera"><span>División en la pizarra</span><span data-div-contador></span></div>
    <h3 data-div-titulo></h3><div class="poli-division-escena"></div>
    <figcaption data-div-explicacion aria-live="polite"></figcaption>`)}
    <div class="poli-video-controles">
      <div class="mate-controles">${boton("Reproducir", 'data-div-play')}${boton("Anterior", 'data-div-anterior')}${boton("Siguiente", 'data-div-siguiente')}${boton("Reiniciar", 'data-div-reset')}
        <label class="mate-control poli-video-velocidad"><span>Velocidad</span><select data-div-velocidad><option value="0.65">Lenta</option><option value="1" selected>Normal</option><option value="1.5">Rápida</option></select></label>
      </div><label class="mate-control"><span>Momento de la división</span><input type="range" min="0" max="14" step="1" value="0" data-div-tiempo></label>
    </div>`;
  const pantalla = nodo.querySelector(".poli-division-escena");
  const reducir = window.matchMedia("(prefers-reduced-motion: reduce)");
  const duracion = 5200;
  let indice = 0, tiempo = 0, anteriorTiempo = 0, jugando = false, frame;
  let animaciones = [];
  const ficha = (texto, id, origen = "", clase = "") => `<span class="poli-div-termino ${clase}" data-ficha="${id}" ${origen ? `data-origen="${origen}"` : ""}>${texto || ' '}</span>`;
  function fila(nombre, terminos, prefijo, fuentes = [], clase = "") {
    return `<div class="poli-div-fila ${clase}"><span class="poli-div-etiqueta">${nombre}</span><div class="poli-div-columnas">${terminos.map((t, i) => ficha(t, `${prefijo}${i}`, fuentes[i])).join("")}</div></div>`;
  }

  function pintar(animar = true) {
    const posiciones = new Map([...pantalla.querySelectorAll("[data-ficha]")].map((e) => [e.dataset.ficha, e.getBoundingClientRect()]));
    animaciones.forEach((a) => a.cancel());
    const [titulo, explicacion, ecuacion] = escenas[indice];
    const producto1 = indice >= 5 ? ["−x³", "−x²", "−x", ""] : ["x³", "+x²", "+x", ""];
    const producto2 = indice >= 11 ? ["", "−5x²", "−5x", "−5"] : ["", "5x²", "+5x", "+5"];
    const q1 = indice >= 3 ? ficha("x", "q1", "", "poli-div-cociente") : '<span class="poli-div-hueco">…</span>';
    const q2 = indice >= 9 ? ficha("+ 5", "q2", "", "poli-div-cociente") : "";
    pantalla.innerHTML = `<div class="poli-division-caja">
      <div class="poli-div-cuenta">
        <div class="poli-div-grados"><span>x³</span><span>x²</span><span>x</span><span>1</span></div>
        ${fila("Dividendo", ["x³", "+6x²", "+8x", "+7"], "d", [], indice === 1 || indice === 2 ? 'poli-div-mira-d' : '')}
        ${indice >= 4 ? fila(indice === 4 ? "Producto de x por el divisor" : "Restamos todo el producto", producto1, "p", ["v0", "v1", "v2"], indice >= 5 ? 'poli-div-restar' : '') : '<div class="poli-div-reserva"></div>'}
        ${indice >= 6 ? fila("Resto parcial", ["0", "5x²", "+7x", "+7"], "r", ["d0", "d1", "d2", "d3"], indice === 7 || indice === 8 ? 'poli-div-mira-r' : '') : '<div class="poli-div-reserva"></div>'}
        ${indice >= 10 ? fila(indice === 10 ? "Producto de 5 por el divisor" : "Restamos todo el producto", producto2, "s", ["", "v0", "v1", "v2"], indice >= 11 ? 'poli-div-restar' : '') : '<div class="poli-div-reserva"></div>'}
        ${indice >= 12 ? fila("Resto final", ["", "0", "2x", "+2"], "f", ["", "r1", "r2", "r3"], "poli-div-final") : '<div class="poli-div-reserva"></div>'}
      </div>
      <div class="poli-division-lado"><div><span class="poli-div-etiqueta">Divisor</span><div class="poli-divisor">${ficha("x²", "v0", "", indice === 1 || indice === 2 || indice === 7 || indice === 8 ? 'poli-div-elegido' : '')}${ficha("+ x", "v1")}${ficha("+ 1", "v2")}</div></div>
        <div><span class="poli-div-etiqueta">Cociente</span><div class="poli-div-resultado">${q1}${q2}</div></div></div>
    </div><div class="poli-div-operacion">${indice === 2 ? `${ficha('x³', 'calc-d', 'd0')} ÷ ${ficha('x²', 'calc-v', 'v0')} = ${ficha('x', 'q1', '', 'poli-div-cociente')}`
      : indice === 8 ? `${ficha('5x²', 'calc-r', 'r1')} ÷ ${ficha('x²', 'calc-v2', 'v0')} = ${ficha('5', 'q2', '', 'poli-div-cociente')}` : ecuacion}</div>`;
    nodo.querySelector("[data-div-titulo]").textContent = titulo;
    nodo.querySelector("[data-div-explicacion]").textContent = explicacion;
    nodo.querySelector("[data-div-contador]").textContent = `${indice + 1} / ${escenas.length}`;
    nodo.querySelector("[data-div-tiempo]").value = indice;
    nodo.querySelector("[data-div-anterior]").disabled = indice === 0;
    nodo.querySelector("[data-div-siguiente]").disabled = indice === escenas.length - 1;
    animaciones = [];
    if (animar && !reducir.matches) {
      for (const elemento of pantalla.querySelectorAll("[data-ficha]")) {
        const origen = posiciones.get(elemento.dataset.ficha) || posiciones.get(elemento.dataset.origen);
        if (!origen || !elemento.textContent.trim()) continue;
        const destino = elemento.getBoundingClientRect();
        const dx = origen.left - destino.left, dy = origen.top - destino.top;
        if (Math.abs(dx) + Math.abs(dy) < 2) continue;
        animaciones.push(elemento.animate([
          { transform: `translate(${dx}px, ${dy}px) scale(1.08)`, background: "#ffe5a6", color: "#371b2a", zIndex: 3 },
          { transform: "translate(0, 0) scale(1)", zIndex: 3 },
        ], { duration: 1100 / Number(nodo.querySelector('[data-div-velocidad]').value), easing: "cubic-bezier(.25,.65,.25,1)" }));
      }
    }
    pintarBoton();
  }
  function pintarBoton() {
    const botonPlay = nodo.querySelector("[data-div-play]");
    botonPlay.textContent = jugando ? "Pausar" : indice === escenas.length - 1 ? "Volver a reproducir" : tiempo ? "Continuar" : "Reproducir";
    botonPlay.setAttribute("aria-pressed", String(jugando));
  }
  function parar() { jugando = false; cancelAnimationFrame(frame); animaciones.forEach((a) => a.pause()); pintarBoton(); }
  function avanzar(ahora) {
    if (!jugando) return;
    tiempo += (ahora - anteriorTiempo) * Number(nodo.querySelector('[data-div-velocidad]').value);
    anteriorTiempo = ahora;
    const nuevo = Math.min(escenas.length - 1, Math.floor(tiempo / duracion));
    if (nuevo !== indice) { indice = nuevo; pintar(); }
    if (indice === escenas.length - 1) { jugando = false; pintarBoton(); return; }
    frame = requestAnimationFrame(avanzar);
  }
  function ir(nuevo) { parar(); indice = nuevo; tiempo = indice * duracion; pintar(); }
  nodo.querySelector("[data-div-play]").addEventListener("click", () => {
    if (jugando) return parar();
    if (indice === escenas.length - 1) { indice = 0; tiempo = 0; pintar(false); }
    jugando = true; anteriorTiempo = performance.now(); animaciones.forEach((a) => a.play()); pintarBoton(); frame = requestAnimationFrame(avanzar);
  });
  nodo.querySelector("[data-div-anterior]").addEventListener("click", () => ir(Math.max(0, indice - 1)));
  nodo.querySelector("[data-div-siguiente]").addEventListener("click", () => ir(Math.min(escenas.length - 1, indice + 1)));
  nodo.querySelector("[data-div-reset]").addEventListener("click", () => ir(0));
  nodo.querySelector("[data-div-tiempo]").addEventListener("input", (e) => ir(Number(e.target.value)));
  document.addEventListener("visibilitychange", () => { if (document.hidden && jugando) parar(); });
  pintar(false);
})();
