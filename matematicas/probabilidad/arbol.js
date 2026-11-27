(() => {
  const { porcentaje, rango, opciones, boton, pizarra, controles, resultados } = window.Mate;
  const { casos, construirArbol, resumir } = window.ModeloProbabilidad;
  const nodo = document.querySelector('[data-simulacion="arbol"]');
  const elegir = (id, nombre, valores, valor = 0) => ({ ...opciones(id, nombre, valores), valor: String(valor) });
  nodo.innerHTML = `<div data-caso></div><div data-selectores></div><div data-pesos></div>
    ${pizarra(`<div class="prob-arbol-clave">
      <span><i></i>Caminos con el resultado elegido</span><span><i></i>Camino que estás leyendo</span>
    </div>
    <div class="prob-arbol-navegacion mate-piezas">
      ${boton("Ver inicio", "data-ver-inicio")}${boton("Ver fin del camino", "data-ver-fin")}
    </div>
    <div class="prob-arbol-visor" tabindex="0" role="region" aria-label="Árbol de probabilidades. Si no cabe, puedes desplazarte para ver más etapas.">
      <div class="prob-arbol-grafico"><canvas aria-hidden="true"></canvas><div class="prob-arbol-etapas"></div><div data-nodos></div></div>
    </div>
    <p class="mate-pie">Selecciona un resultado al final de una rama para ver su cálculo. Cada nodo muestra la probabilidad del tramo que llega hasta él.</p>
    <div class="prob-arbol-camino" data-camino aria-live="polite"></div>
    <div data-resultados></div><p class="mate-pie" data-explicacion></p>`)}`;

  const visor = nodo.querySelector(".prob-arbol-visor");
  const grafico = nodo.querySelector(".prob-arbol-grafico");
  const nodos = nodo.querySelector("[data-nodos]");
  const canvas = grafico.querySelector("canvas");
  const selectores = nodo.querySelector("[data-selectores]");
  const pesos = nodo.querySelector("[data-pesos]");
  const reducirMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)");
  const configuraciones = structuredClone(casos);
  let caso, etapa, observado, origen, filtro, arbol, resumen, camino, dibujo;

  function actualizarLectura() {
    const hoja = arbol.hojas.find(({ ruta }) => ruta === camino);
    const tramos = [];
    let actual = arbol.raiz;
    for (const opcion of camino) {
      actual = actual.hijos[opcion];
      tramos.push(actual);
    }
    nodo.querySelector("[data-camino]").innerHTML = `<strong>Multiplica los tramos de este camino</strong>
      <div class="prob-tramos">${tramos.map(({ nombre, rama }) => `<span>${nombre}<b>${porcentaje(rama)}</b></span>`).join("<i aria-hidden='true'>×</i>")}
      <i aria-hidden="true">=</i><b>${porcentaje(hoja.acumulada)}</b></div>`;
    const final = caso.etapas.at(-1).salidas[observado];
    const primero = caso.etapas[0].salidas[origen];
    const terminos = resumen.caminos.length <= 4
      ? resumen.caminos.map(({ acumulada }) => acumulada)
      : [resumen.conjunto, resumen.total - resumen.conjunto];
    nodo.querySelector("[data-resultados]").innerHTML = resultados([
      [`Probabilidad total · ${final}`, `${terminos.map(porcentaje).join(" + ")} = ${porcentaje(resumen.total)}`],
      [`Bayes · ${primero} si sabemos «${final}»`, resumen.posterior === null
        ? "Sin definir"
        : `${porcentaje(resumen.conjunto)} / ${porcentaje(resumen.total)} ≈ ${porcentaje(resumen.posterior)}`],
    ]);
    nodo.querySelector("[data-explicacion]").textContent = resumen.posterior === null
      ? `La suma de los caminos resaltados vale 0. Para condicionar hace falta que el resultado «${final}» sea posible.`
      : `Para la probabilidad total suma los ${resumen.caminos.length} caminos que acaban en «${final}».${resumen.caminos.length > 4 ? " La suma se agrupa por el primer paso." : ""} Para Bayes, dentro de ese total, toma solo los que empiezan por «${primero}».`;
  }

  function pintarConexiones() {
    if (!dibujo) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { posiciones, ancho, alto, tarjeta } = dibujo;
    const escala = window.devicePixelRatio || 1;
    canvas.width = Math.round(ancho * escala);
    canvas.height = Math.round(alto * escala);
    ctx.scale(escala, escala);
    for (const [ruta, destino] of posiciones) {
      if (ruta === "") continue;
      const padre = posiciones.get(ruta.slice(0, -1));
      const x1 = padre.x + tarjeta / 2;
      const x2 = destino.x - tarjeta / 2;
      const centro = (x1 + x2) / 2;
      const seleccionado = camino.startsWith(ruta);
      ctx.beginPath();
      ctx.moveTo(x1, padre.y);
      ctx.bezierCurveTo(centro, padre.y, centro, destino.y, x2, destino.y);
      ctx.strokeStyle = seleccionado ? "#ffd297" : destino.resaltado ? "#ed91b0" : "#c3a0b285";
      ctx.lineWidth = seleccionado ? 3 : destino.resaltado ? 1.9 : 1;
      ctx.stroke();
      ctx.fillStyle = ctx.strokeStyle;
      ctx.beginPath();
      ctx.arc(x2 - 2, destino.y, seleccionado ? 3 : 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function elegirCamino(ruta) {
    camino = ruta;
    for (const tarjeta of nodos.querySelectorAll("[data-ruta]")) {
      const actual = ruta.startsWith(tarjeta.dataset.ruta);
      tarjeta.dataset.actual = String(actual);
      if (tarjeta.tagName === "BUTTON") tarjeta.setAttribute("aria-pressed", String(actual));
    }
    pintarConexiones();
    actualizarLectura();
  }

  function dibujar() {
    if (!arbol) return;
    const profundidad = caso.etapas.length;
    const columnas = profundidad + 1;
    const ancho = Math.max(visor.clientWidth, columnas * 142);
    const anchoColumna = ancho / columnas;
    const tarjeta = Math.min(136, anchoColumna - 27);
    const alturaCabecera = 43;
    const salto = 63;
    const visibles = filtro ? resumen.caminos : arbol.hojas;
    const filas = new Map(visibles.map(({ ruta }, i) => [ruta, alturaCabecera + salto * (i + .5)]));
    const posiciones = new Map();
    const ramasResaltadas = new Set(resumen.caminos.flatMap(({ ruta }) =>
      [...ruta].map((_, i) => ruta.slice(0, i + 1))
    ));

    function ubicar(rama, historial = []) {
      const historialNuevo = [...historial, rama.nombre];
      const hijos = rama.hijos.map((hijo) => ubicar(hijo, historialNuevo)).filter((y) => y !== undefined);
      const y = rama.hijos.length ? (hijos.length ? (hijos[0] + hijos.at(-1)) / 2 : undefined) : filas.get(rama.ruta);
      if (y === undefined) return;
      posiciones.set(rama.ruta, {
        rama, y, x: (rama.profundidad + .5) * anchoColumna, historial: historialNuevo,
        resaltado: ramasResaltadas.has(rama.ruta),
      });
      return y;
    }

    ubicar(arbol.raiz);
    const alto = alturaCabecera + salto * visibles.length + 7;
    dibujo = { posiciones, ancho, alto, tarjeta };
    grafico.style.width = ancho + "px";
    grafico.style.height = alto + "px";
    grafico.style.setProperty("--ancho-tarjeta", tarjeta + "px");
    grafico.style.setProperty("--ancho-columna", anchoColumna + "px");
    const titulos = [{ nombre: "Inicio" }, ...caso.etapas];
    const orden = [...posiciones.values()].sort((a, b) => a.rama.profundidad - b.rama.profundidad || a.y - b.y);
    grafico.querySelector(".prob-arbol-etapas").innerHTML = titulos.map(({ nombre }) => `<b>${nombre}</b>`).join("");
    nodos.innerHTML = orden.map(({ rama, x, y, resaltado, historial }) => {
      const esHoja = rama.profundidad === profundidad;
      const etiqueta = esHoja ? "button" : "div";
      const acceso = esHoja
        ? `type="button" aria-label="${historial.join(", ")}. Probabilidad del camino ${porcentaje(rama.acumulada)}."`
        : 'aria-hidden="true"';
      return `<${etiqueta} ${acceso} data-ruta="${rama.ruta}" data-resaltado="${resaltado}" class="prob-arbol-nodo" style="left:${x}px;top:${y}px">
        <span>${rama.nombre}</span><b>${porcentaje(rama.rama)}</b></${etiqueta}>`;
    }).join("");
    elegirCamino(camino);
  }

  function actualizar() {
    arbol = construirArbol(caso.inicio, caso.etapas);
    resumen = resumir(arbol.hojas, observado, origen);
    if (!camino || (filtro && !camino.endsWith(String(observado)))) {
      const delOrigen = resumen.caminos.filter(({ ruta }) => ruta.startsWith(String(origen)));
      camino = delOrigen.reduce((maxima, hoja) => hoja.acumulada > maxima.acumulada ? hoja : maxima).ruta;
    }
    dibujar();
  }

  function montarPesos() {
    pesos.replaceChildren();
    const fase = caso.etapas[etapa];
    const previa = caso.etapas[etapa - 1];
    const campos = fase.pesos.map((valor, i) => rango(
      `p${i}`, previa ? `${fase.salidas[0]} si «${previa.salidas[i]}» (%)` : `${fase.salidas[0]} (%)`,
      0, 100, valor
    ));
    controles(pesos, campos, (valores) => {
      fase.pesos = campos.map(({ id }) => valores[id]);
      actualizar();
    });
  }

  function montarCaso(indice) {
    caso = configuraciones[indice];
    etapa = caso.etapas.length - 1;
    observado = 0;
    origen = 1;
    filtro = caso.etapas.length > 3;
    camino = undefined;
    selectores.replaceChildren();
    pesos.replaceChildren();
    controles(selectores, [
      elegir("etapa", "Etapa a ajustar", caso.etapas.map(({ nombre }, i) => [i, nombre]), etapa),
      elegir("final", "Resultado final destacado", caso.etapas.at(-1).salidas.map((s, i) => [i, s])),
      elegir("origen", "Primer paso para calcular Bayes", caso.etapas[0].salidas.map((s, i) => [i, s]), origen),
      elegir("filtro", "Mostrar caminos", [[0, "Árbol completo"], [1, "Solo los del resultado elegido"]], Number(filtro)),
    ], (valores) => {
      const nuevaEtapa = Number(valores.etapa);
      if (origen !== Number(valores.origen) || observado !== Number(valores.final)) camino = undefined;
      observado = Number(valores.final);
      origen = Number(valores.origen);
      filtro = valores.filtro === "1";
      if (pesos.childElementCount && etapa === nuevaEtapa) actualizar();
      else {
        etapa = nuevaEtapa;
        montarPesos();
      }
    });
    centrar("", false);
  }

  function centrar(ruta, suave = true) {
    const { x, y } = dibujo.posiciones.get(ruta);
    visor.scrollTo({
      left: Math.max(0, x - visor.clientWidth / 2),
      top: Math.max(0, y - visor.clientHeight / 2),
      behavior: suave && !reducirMovimiento.matches ? "smooth" : "instant",
    });
  }

  nodo.querySelector("[data-ver-inicio]").addEventListener("click", () => centrar(""));
  nodo.querySelector("[data-ver-fin]").addEventListener("click", () => centrar(camino));
  nodos.addEventListener("click", (evento) => {
    const hoja = evento.target.closest("button[data-ruta]");
    if (hoja) elegirCamino(hoja.dataset.ruta);
  });
  new ResizeObserver(dibujar).observe(visor);
  controles(nodo.querySelector("[data-caso]"), [
    elegir("caso", "Caso y profundidad", casos.map(({ nombre, etapas }, i) => [i, `${etapas.length} niveles · ${nombre}`])),
  ], ({ caso }) => montarCaso(Number(caso)));
})();
