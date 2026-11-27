(() => {
  const raiz = document.currentScript.getAttribute("src").slice(0, -"assets/indice.js".length);
  const lista = document.getElementById("indice-lista");
  const abrirIndice = document.getElementById("abrir-indice");
  const emblema = document.createElement("link");
  emblema.rel = "icon";
  emblema.href = raiz + "assets/ilustraciones/emblema.svg";
  document.head.append(emblema);

  const paginas = [
    { id: "inicio", nombre: "Inicio", ruta: "index.html", icono: "⌂" },
    {
      id: "fisica", nombre: "Física", ruta: "fisica/index.html", icono: "⚛︎", tema: "fisica", abierto: true,
      hijos: [{
        id: "dinamica", nombre: "Dinámica", ruta: "fisica/dinamica/index.html", icono: "ΣF",
        hijos: [
          { id: "peso", nombre: "Masa y peso", ruta: "fisica/dinamica/masa-y-peso/index.html" },
          { id: "planos", nombre: "Movimiento sobre planos", ruta: "fisica/dinamica/movimiento-sobre-planos/index.html" },
          { nombre: "Poleas y tensión", ruta: "fisica/dinamica/poleas/index.html" },
          { nombre: "Muelles", ruta: "fisica/dinamica/muelles/index.html" },
          { nombre: "Gravitación", ruta: "fisica/dinamica/gravedad/index.html" },
          { nombre: "Fuerza centrípeta", ruta: "fisica/dinamica/curva/index.html" },
          { nombre: "Impulso y rebote", ruta: "fisica/dinamica/rebote/index.html" },
          { nombre: "Ejercicios resueltos", ruta: "fisica/dinamica/ejercicios-resueltos/index.html" },
        ],
      }],
    },
    {
      id: "matematicas", nombre: "Matemáticas", ruta: "matematicas/index.html", icono: "ƒx", tema: "matematicas",
      hijos: [
        {
          id: "probabilidad", nombre: "Probabilidad", ruta: "matematicas/probabilidad/index.html",
          hijos: [
            { nombre: "Sucesos y regla de Laplace", ruta: "matematicas/probabilidad/sucesos/index.html" },
            { nombre: "Condicionada e independencia", ruta: "matematicas/probabilidad/condicionada/index.html" },
            { nombre: "Árbol, probabilidad total y Bayes", ruta: "matematicas/probabilidad/arbol/index.html" },
            { nombre: "Extracciones con y sin reposición", ruta: "matematicas/probabilidad/urna/index.html" },
            { nombre: "Ejercicios resueltos", ruta: "matematicas/probabilidad/ejercicios-resueltos/index.html" },
          ],
        },
        {
          id: "numeros-reales", nombre: "Números reales", ruta: "matematicas/numeros-reales/index.html",
          hijos: [
            { nombre: "Potencias", ruta: "matematicas/numeros-reales/potencias/index.html" },
            { nombre: "Radicales", ruta: "matematicas/numeros-reales/radicales/index.html" },
            { nombre: "Racionalización", ruta: "matematicas/numeros-reales/racionalizacion/index.html" },
            { nombre: "Logaritmos", ruta: "matematicas/numeros-reales/logaritmos/index.html" },
            { nombre: "Ejercicios resueltos", ruta: "matematicas/numeros-reales/ejercicios-resueltos/index.html" },
          ],
        },
        {
          id: "polinomios", nombre: "Polinomios y fracciones", ruta: "matematicas/polinomios/index.html",
          hijos: [
            { nombre: "Identidades notables", ruta: "matematicas/polinomios/identidades/index.html" },
            { nombre: "División de polinomios", ruta: "matematicas/polinomios/division/index.html" },
            { nombre: "Raíces y factorización", ruta: "matematicas/polinomios/raices/index.html" },
            { nombre: "Fracciones algebraicas", ruta: "matematicas/polinomios/fracciones/index.html" },
            { nombre: "Ejercicios resueltos", ruta: "matematicas/polinomios/ejercicios-resueltos/index.html" },
          ],
        },
      ],
    },
  ];

  function canonica(ruta) {
    return new URL(ruta, document.baseURI).pathname.replace(/(?:\/index\.html)?\/?$/, "/");
  }

  const actual = canonica(window.location.href);
  function esActual(pagina) { return canonica(raiz + pagina.ruta) === actual; }
  function ramaActiva(pagina) { return esActual(pagina) || pagina.hijos?.some(ramaActiva); }

  function elemento(etiqueta, clase, contenido) {
    const nodo = document.createElement(etiqueta);
    if (clase) nodo.className = clase;
    if (contenido) nodo.textContent = contenido;
    return nodo;
  }

  const trazos = {
    inicio: "m3 11 9-7.5 9 7.5 M5.5 10.5V21h5v-6h3v6h5V10.5",
    fisica: "M16.8 6.8a6 6 0 0 0-9.4 7.4 M7.5 16.4a6 6 0 0 0 10-6.4 M20.9 6.3c1.1 1.6-2 5.2-7.3 8.4s-10 4.6-10.9 3.1 2-5.1 7.1-8.2 10.1-4.9 11.1-3.3Z",
    matematicas: "M3 19.5h18L12 4l-9 15.5Z M9.5 16h5l-2.5-4.3L9.5 16Z M5.4 15.4l2 1.2 M7.3 12.2l2 1.2",
    libro: "M12 6c-2.8-2-5.8-2-9-1v13c3.3-1 6.2-1 9 1 2.8-2 5.7-2 9-1V5c-3.2-1-6.2-1-9 1Z M12 6v13",
  };

  function pictograma(nombre) {
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("class", "pictograma");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "1.6");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("stroke-linecap", "round");
    const linea = document.createElementNS(ns, "path");
    linea.setAttribute("d", trazos[nombre]);
    svg.append(linea);
    return svg;
  }

  function filaPagina(pagina) {
    const punto = elemento("li", pagina.tema);
    const fila = elemento("div", "indice-fila");
    const enlace = elemento("a", "indice-enlace");
    enlace.setAttribute("href", raiz + pagina.ruta);
    if (esActual(pagina)) enlace.setAttribute("aria-current", "page");
    else if (ramaActiva(pagina)) fila.dataset.antecesor = "true";

    const icono = elemento("span", pagina.icono ? "indice-icono" : "indice-punto", pagina.icono);
    if (trazos[pagina.id]) icono.replaceChildren(pictograma(pagina.id));
    icono.setAttribute("aria-hidden", "true");
    enlace.append(icono, elemento("span", "indice-nombre", pagina.nombre));
    fila.append(enlace);
    punto.append(fila);

    if (pagina.hijos) {
      const sublista = elemento("ul", "indice-sublista");
      sublista.id = "indice-" + pagina.id;
      sublista.append(...pagina.hijos.map(filaPagina));

      const boton = elemento("button", "indice-desplegar");
      boton.type = "button";
      boton.setAttribute("aria-label", "Secciones de " + pagina.nombre);
      boton.setAttribute("aria-controls", sublista.id);
      const flecha = elemento("span", "indice-flecha");
      flecha.setAttribute("aria-hidden", "true");
      boton.append(flecha);

      function desplegar(abierto) {
        boton.setAttribute("aria-expanded", String(abierto));
        sublista.hidden = !abierto;
      }

      desplegar(Boolean(pagina.abierto || ramaActiva(pagina) || (pagina.tema && esActual(paginas[0]))));
      boton.addEventListener("click", () => desplegar(sublista.hidden));
      fila.append(boton);
      punto.append(sublista);
    }

    return punto;
  }

  lista.replaceChildren(...paginas.map(filaPagina));
  document.querySelector(".indice-titulo").prepend(pictograma("libro"));

  const asignaturas = elemento("nav", "enlaces-asignaturas");
  asignaturas.setAttribute("aria-label", "Asignaturas");
  for (const pagina of paginas.filter((entrada) => entrada.tema)) {
    const enlace = elemento("a", pagina.tema);
    enlace.href = raiz + pagina.ruta;
    if (ramaActiva(pagina)) enlace.setAttribute("aria-current", esActual(pagina) ? "page" : "location");
    enlace.append(pictograma(pagina.id), pagina.nombre);
    asignaturas.append(enlace);
  }
  document.querySelector(".barra").append(asignaturas);

  // Mantiene los enlaces antiguos a subsecciones que ahora tienen su propia página.
  const seccionAnterior = [...document.querySelectorAll("[data-seccion-anterior]")]
    .find((enlace) => "#" + enlace.dataset.seccionAnterior === window.location.hash);
  if (seccionAnterior) window.location.replace(seccionAnterior.href);

  const columna = lista.closest(".columna-indice");
  columna.dataset.plegable = "true";
  abrirIndice.hidden = false;

  function desplegarIndice(abierto) { abrirIndice.setAttribute("aria-expanded", String(abierto)); }
  abrirIndice.addEventListener("click", () => desplegarIndice(abrirIndice.getAttribute("aria-expanded") === "false"));
  columna.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || abrirIndice.getAttribute("aria-expanded") !== "true" || !abrirIndice.getClientRects().length) return;
    desplegarIndice(false);
    abrirIndice.focus();
  });
})();
