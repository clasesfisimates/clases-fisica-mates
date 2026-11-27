(() => {
  const { porcentaje, rango, boton, pizarra, pieza, controles, resultados, pasos } = window.Mate;
  const { colores, llenarUrna, contarColores, sacarBola } = window.ModeloProbabilidad;
  const panel = (id) => document.querySelector(`[data-simulacion="${id}"]`);

  function sucesos() {
    const nodo = panel("venn");
    if (!nodo) return;
    const regiones = [
      ["Solo A", [1, 9], "a"],
      ["A y B", [3, 5, 7], "ambos"],
      ["Solo B", [2], "b"],
      ["Ni A ni B", [4, 6, 8, 10], "fuera"],
    ];
    const espacio = Array.from({ length: 10 }, (_, i) => i + 1);
    const operaciones = [
      ["Ω · Todos", "Espacio muestral completo", [0, 1, 2, 3]],
      ["A", "Sale un número impar", [0, 1]],
      ["B", "Sale un número primo", [1, 2]],
      ["A ∪ B", "Sale un impar, un primo o un número que cumple las dos cosas", [0, 1, 2]],
      ["A ∩ B", "Sale un número que es impar y primo a la vez", [1]],
      ["A − B", "Sale un número impar que no es primo", [0]],
      ["A̅", "Sale un número que no es impar", [2, 3]],
      ["B̅", "Sale un número que no es primo", [0, 3]],
      ["Ni A ni B", "Sale un número que no es impar ni primo", [3]],
    ];
    const fichas = (bolas) => bolas.map((bola) => {
      const [, , region] = regiones.find(([, miembros]) => miembros.includes(bola));
      return `<span class="prob-ficha" data-bola="${bola}" data-region="${region}">${bola}</span>`;
    }).join("");
    nodo.innerHTML = pizarra(`
      <div class="prob-espacio">
        <div class="prob-titulo-visual"><strong>Ω · Espacio muestral</strong><span>10 resultados posibles</span></div>
        <p class="prob-conjunto">Ω = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10}</p>
        <div class="prob-todas" aria-hidden="true">${fichas(espacio)}</div>
      </div>
      <p class="prob-instruccion">Elige un suceso: toda su región se rellena en dorado.</p>
      <div class="mate-piezas" role="group" aria-label="Suceso a destacar">${operaciones.map(([nombre, descripcion], i) =>
        boton(nombre, `data-operacion="${i}" aria-pressed="false" aria-label="${nombre}. ${descripcion}"`)
      ).join("")}</div>
      <div class="prob-venn" aria-hidden="true">
        <div class="prob-venn-diagrama">
          <svg class="prob-venn-regiones" viewBox="0 0 1000 500" focusable="false">
            <defs>
              <clipPath id="prob-dentro-a"><circle cx="370" cy="250" r="250"/></clipPath>
              <mask id="prob-sin-a" maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="500">
                <rect width="1000" height="500" fill="white"/><circle cx="370" cy="250" r="250" fill="black"/>
              </mask>
              <mask id="prob-sin-b" maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="500">
                <rect width="1000" height="500" fill="white"/><circle cx="630" cy="250" r="250" fill="black"/>
              </mask>
            </defs>
            <g class="prob-venn-base"><circle cx="370" cy="250" r="250"/><circle cx="630" cy="250" r="250"/></g>
            <circle data-zona="a" cx="370" cy="250" r="250" mask="url(#prob-sin-b)"/>
            <circle data-zona="ambos" cx="630" cy="250" r="250" clip-path="url(#prob-dentro-a)"/>
            <circle data-zona="b" cx="630" cy="250" r="250" mask="url(#prob-sin-a)"/>
            <circle class="prob-venn-borde" data-circulo="a" cx="370" cy="250" r="250"/>
            <circle class="prob-venn-borde" data-circulo="b" cx="630" cy="250" r="250"/>
          </svg>
          ${regiones.slice(0, 3).map(([nombre, bolas, region]) =>
            `<div class="prob-venn-grupo" data-region="${region}"><b>${nombre}</b><div>${fichas(bolas)}</div></div>`
          ).join("")}
        </div>
        <div class="prob-venn-fuera"><b>${regiones[3][0]}</b><div>${fichas(regiones[3][1])}</div></div>
      </div>
      <div class="prob-barra" aria-hidden="true"><i></i></div>
      <figcaption class="prob-laplace" aria-live="polite"></figcaption>`);
    const botones = [...nodo.querySelectorAll("[data-operacion]")];
    const bolas = [...nodo.querySelectorAll("[data-bola]")];
    const venn = nodo.querySelector(".prob-venn");
    const escala = nodo.querySelector(".prob-barra i");
    function actualizar(indice) {
      const [nombre, explicacion, indices] = operaciones[indice];
      const favorables = indices.flatMap((i) => regiones[i][1]).sort((a, b) => a - b);
      const cuenta = favorables.length;
      botones.forEach((elemento, i) => elemento.setAttribute("aria-pressed", String(i === indice)));
      for (const bola of bolas) bola.dataset.seleccionada = String(favorables.includes(Number(bola.dataset.bola)));
      regiones.forEach(([, , region], i) => {
        venn.querySelectorAll(`[data-zona="${region}"], .prob-venn-grupo[data-region="${region}"]`)
          .forEach((elemento) => { elemento.dataset.seleccionada = String(indices.includes(i)); });
      });
      venn.dataset.fueraSeleccionada = String(indices.includes(3));
      venn.querySelector('[data-circulo="a"]').dataset.seleccionada = String(indices.includes(0) && indices.includes(1));
      venn.querySelector('[data-circulo="b"]').dataset.seleccionada = String(indices.includes(1) && indices.includes(2));
      nodo.querySelector("figcaption").innerHTML = `<span>${explicacion}. <b>{${favorables.join(", ")}}</b></span>
        <strong>P(${indice === 0 ? "Ω" : nombre}) = <span class="mate-fraccion"><span>${cuenta} favorables</span><span>10 posibles</span></span> = ${porcentaje(cuenta / 10)}</strong>`;
      escala.style.width = `${cuenta * 10}%`;
    }
    botones.forEach((elemento, i) => elemento.addEventListener("click", () => actualizar(i)));
    actualizar(0);
  }

  function condicionada() {
    const nodo = panel("condicionada");
    if (!nodo) return;
    nodo.innerHTML = pizarra(`
      <div class="prob-poblacion-vistas mate-piezas" role="group" aria-label="Personas que cuentan en la comparación">
        ${boton("Ver las 100 personas", 'data-vista="todas" aria-pressed="true"')}
        ${boton("Quedarse solo con B", 'data-vista="b" aria-pressed="false"')}
      </div>
      <p class="prob-poblacion-estado"></p><div class="mate-mosaico" aria-hidden="true"></div>
      <p class="mate-pie" data-resumen></p><div class="prob-comparacion"></div><p class="prob-conclusion" data-veredicto></p>`);
    const cuadricula = nodo.querySelector(".mate-mosaico");
    const casillas = Array.from({ length: 100 }, () => document.createElement("i"));
    const vistas = [...nodo.querySelectorAll("[data-vista]")];
    cuadricula.append(...casillas);
    let grupoB = false;
    let poblacion;
    function pintarVista() {
      cuadricula.dataset.filtro = String(grupoB);
      vistas.forEach((vista) => vista.setAttribute("aria-pressed", String((vista.dataset.vista === "b") === grupoB)));
      nodo.querySelector(".prob-poblacion-estado").textContent = grupoB
        ? `Ahora cuentan solo las ${poblacion.b} personas de B. Busca las que también cumplen A.`
        : "Ahora cuentan las 100 personas. Busca a todas las que cumplen A.";
    }
    function medida(titulo, favorables, total, color) {
      return `<div class="prob-medida"><span>${titulo}</span>
        <strong>${total ? `${favorables}/${total} = ${porcentaje(favorables / total)}` : "Sin definir"}</strong>
        <div class="prob-barra" aria-hidden="true"><i class="${color}" style="width:${total ? favorables / total * 100 : 0}%"></i></div></div>`;
    }
    const deslizador = (id, titulo, valor) => ({ ...rango(id, titulo, 0, 100, valor), clase: "prob-control-" + id });
    controles(nodo, [
      deslizador("a", "Solo A · solo hace deporte", 20),
      deslizador("b", "Solo B · solo va andando", 30),
      deslizador("ambos", "A y B · ambas cosas", 20),
    ], ({ a, b, ambos }, campos) => {
      const ocupadas = a + b + ambos;
      for (const [id, cantidad] of Object.entries({ a, b, ambos })) campos[id].entrada.max = 100 - ocupadas + cantidad;
      poblacion = { a: a + ambos, b: b + ambos };
      const grupos = [["ambos", ambos], ["b", b], ["a", a], ["fuera", 100 - ocupadas]];
      let i = 0;
      for (const [region, cantidad] of grupos) {
        for (let j = 0; j < cantidad; j++) casillas[i++].dataset.region = region;
      }
      pintarVista();
      nodo.querySelector("[data-resumen]").textContent = `Hacen deporte ${poblacion.a} personas. Van andando ${poblacion.b}. De estas últimas, ${ambos} hacen también deporte.`;
      nodo.querySelector(".prob-comparacion").innerHTML =
        medida("P(A) · hacen deporte entre las 100 personas", poblacion.a, 100, "prob-color-a") +
        medida("P(A | B) · hacen deporte entre quienes van andando", ambos, poblacion.b, "prob-color-ambos");
      const independientes = 100 * ambos === poblacion.a * poblacion.b;
      const veredicto = nodo.querySelector("[data-veredicto]");
      const esperadas = porcentaje(poblacion.a * poblacion.b / 10000);
      const direccion = 100 * ambos > poblacion.a * poblacion.b ? "sube" : "baja";
      veredicto.dataset.estado = independientes ? "independiente" : "dependiente";
      veredicto.innerHTML = poblacion.b === 0
        ? "<strong>B está vacío.</strong> No hay personas con las que calcular P(A | B). Para comprobar independencia, P(A ∩ B) y P(A) · P(B) valen cero."
        : independientes
          ? "<strong>Independientes.</strong> Saber que alguien va andando conserva la proporción de personas que hacen deporte."
          : `<strong>Dependientes.</strong> Entre quienes van andando, la proporción que hace deporte ${direccion} de ${poblacion.a} % a ${porcentaje(ambos / poblacion.b)}. Para que fueran independientes, P(A ∩ B) tendría que valer P(A) · P(B) = ${esperadas}. En el mosaico vale ${ambos} %.`;
    });
    for (const vista of vistas) {
      vista.addEventListener("click", () => {
        grupoB = vista.dataset.vista === "b";
        pintarVista();
      });
    }
  }

  function urna() {
    const nodo = panel("urna");
    if (!nodo) return;
    const totalInicial = colores.reduce((total, { inicial }) => total + inicial, 0);
    nodo.innerHTML = `<div class="prob-urna-controles mate-controles">
      <label class="mate-control"><span>Tipo de extracción</span><select data-reposicion>
        <option value="sin" selected>Sin reposición</option><option value="con">Con reposición</option>
      </select></label>
      ${boton("Sacar una bola", "data-extraer")}
      ${boton("Reiniciar urna", "data-reiniciar")}
    </div><p class="prob-urna-ayuda">Al cambiar de modo se reinician la urna y el historial.</p>${pizarra(`
      <p class="prob-urna-regla"></p>
      <div class="prob-urna-tablero">
        <div class="prob-urna-zona"><p class="prob-titulo-visual"><strong>Dentro de la urna</strong><span data-quedan></span></p><div class="prob-bolas" data-dentro></div></div>
        <div class="prob-urna-zona"><p class="prob-titulo-visual"><strong data-titulo-fuera>Bolas extraídas</strong><span data-cuantas></span></p><div class="prob-bolas" data-fuera></div></div>
      </div>
      <p class="mate-pie prob-urna-mensaje" aria-live="polite"></p>
      <div class="prob-urna-probabilidades"></div>`)}`;
    const extraer = nodo.querySelector("[data-extraer]");
    const reiniciar = nodo.querySelector("[data-reiniciar]");
    const reposicion = nodo.querySelector("[data-reposicion]");
    const conReposicion = () => reposicion.value === "con";
    const dentro = nodo.querySelector("[data-dentro]");
    const fuera = nodo.querySelector("[data-fuera]");
    const piezas = new Map();
    const reducirMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)");
    let bolas;
    let cantidad = 0;

    function indicadores(ultima, antes, totalAntes) {
      const quedan = bolas.length;
      const desp = contarColores(bolas);
      nodo.querySelector("[data-quedan]").textContent = `${quedan} de ${totalInicial}`;
      nodo.querySelector("[data-cuantas]").textContent = String(cantidad);
      nodo.querySelector("[data-titulo-fuera]").textContent = conReposicion() ? "Historial de extracciones" : "Bolas extraídas";
      nodo.querySelector(".prob-urna-regla").textContent = conReposicion()
        ? "Con reposición: la bola vuelve a la urna después de sacarla. Siempre hay 12 bolas y las probabilidades se mantienen. Las fichas del historial representan bolas ya devueltas."
        : "Sin reposición: la bola se queda fuera. Hay una bola menos en cada extracción y las probabilidades cambian.";
      extraer.disabled = !quedan;
      reiniciar.disabled = cantidad === 0;
      const consecuencia = conReposicion()
        ? "La bola vuelve a la urna. Las probabilidades de la próxima extracción son las mismas."
        : quedan ? "La bola queda fuera y las probabilidades se actualizan." : "La urna está vacía. Reiníciala para volver a extraer.";
      nodo.querySelector(".prob-urna-mensaje").textContent = ultima
        ? `Extracción ${cantidad}: bola ${colores[ultima.color].nombre.toLowerCase()}. Antes de sacarla había ${antes[ultima.color]} de ese color entre ${totalAntes} ${totalAntes === 1 ? "bola" : "bolas"}. ${consecuencia}`
        : `Las ${totalInicial} bolas están dentro. Todas tienen la misma probabilidad de ser la siguiente en salir.`;
      const titulo = quedan ? "Probabilidad de la próxima bola" : "Ya no puede hacerse otra extracción";
      nodo.querySelector(".prob-urna-probabilidades").innerHTML = `<strong>${titulo}</strong>` + colores.map(({ nombre, clase }, i) => {
        const previo = antes ? `${antes[i]}/${totalAntes}` : "";
        const actual = quedan ? `${desp[i]}/${quedan} ≈ ${porcentaje(desp[i] / quedan)}` : "Sin próxima bola";
        return `<div class="prob-urna-medida"><span class="prob-punto prob-color-${clase}"></span><b>${nombre}</b>
          <span>${previo ? `Antes: ${previo} · ` : ""}<strong>${actual}</strong></span>
          <div class="prob-barra" aria-hidden="true"><i class="prob-color-${clase}" style="width:${quedan ? desp[i] / quedan * 100 : 0}%"></i></div></div>`;
      }).join("");
    }

    function sacar() {
      const antes = contarColores(bolas);
      const totalAntes = bolas.length;
      const bola = sacarBola(bolas, Math.random, conReposicion());
      if (!bola) return;
      cantidad++;
      const original = piezas.get(bola.id);
      const origen = original.getBoundingClientRect();
      const ficha = conReposicion() ? original.cloneNode(true) : original;
      fuera.append(ficha);
      ficha.setAttribute("aria-label", `Extracción ${cantidad}, bola ${colores[bola.color].nombre.toLowerCase()}${conReposicion() ? ", devuelta a la urna" : ""}`);
      fuera.scrollTop = fuera.scrollHeight;
      if (!reducirMovimiento.matches && ficha.animate) {
        const destino = ficha.getBoundingClientRect();
        ficha.animate([
          { transform: `translate(${origen.left - destino.left}px,${origen.top - destino.top}px) rotate(-30deg)`, opacity: .7 },
          { transform: "translate(0,0) rotate(0)", opacity: 1 },
        ], { duration: 340, easing: "cubic-bezier(.25,.75,.3,1)" });
      }
      indicadores(bola, antes, totalAntes);
    }

    function reset() {
      cantidad = 0;
      bolas = llenarUrna();
      fuera.replaceChildren();
      dentro.replaceChildren();
      piezas.clear();
      for (const { color, id } of bolas) {
        const { nombre, clase } = colores[color];
        const ficha = document.createElement("span");
        ficha.className = `prob-bola-urna prob-color-${clase}`;
        ficha.textContent = nombre[0];
        ficha.setAttribute("role", "img");
        ficha.setAttribute("aria-label", `Bola ${nombre.toLowerCase()}`);
        piezas.set(id, ficha);
        dentro.append(ficha);
      }
      indicadores();
    }
    extraer.addEventListener("click", sacar);
    reiniciar.addEventListener("click", reset);
    reposicion.addEventListener("change", reset);
    reset();
  }

  sucesos();
  condicionada();
  urna();
  const barra = (a, b, total) => `<div class="mate-barra-prob" aria-hidden="true">
    <i style="--proporcion:${a / total * 100}%"></i><i style="--proporcion:${b / total * 100}%"></i>
  </div>`;
  pasos(document.querySelector('[data-ejemplo="bayes"]'), [
    ["Separa por fábrica", "P(A) = 60 % · P(B) = 40 %", "Imagina 100 piezas. De ellas, 60 salen de A y 40 de B.", barra(60, 40, 100) + pieza("60 de A") + " " + pieza("40 de B", "mate-ambar")],
    ["Cuenta los defectos de cada origen", "60 · 0,10 = 6 | 40 · 0,25 = 10", "De las 60 que vienen de A, fallan 6. Entre las 40 que vienen de B, fallan 10.", barra(6, 10, 100) + pieza("6 defectos de A") + " " + pieza("10 defectos de B", "mate-ambar")],
    ["Quédate con las defectuosas", "6 + 10 = 16", "Ahora el grupo que nos interesa tiene 16 piezas y ocupa toda la barra. Dentro de ese grupo hay 10 que vienen de B.", barra(6, 10, 16) + pieza("A × 6") + " " + pieza("B × 10", "mate-ambar")],
    ["Divide dentro de ese grupo", "P(B | D) = 10/16 = 62,5 %", "La mayoría de las piezas defectuosas vienen de B, aunque B fabrique menos piezas en total.", resultados([["De B y defectuosas", "10"], ["Defectuosas en total", "16"]])],
  ]);
})();
