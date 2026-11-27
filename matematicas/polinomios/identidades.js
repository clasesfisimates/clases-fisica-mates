(() => {
  const { rango, opciones, controles, pizarra, boton } = window.Mate;
  const nodo = document.querySelector('[data-simulacion="identidades"]');
  const termino = (texto, color) => `<span class="poli-termino poli-color-${color}">${texto}</span>`;
  let paso = 0;
  let estado;
  nodo.innerHTML = pizarra(`<div class="poli-identidad-comparacion"><div class="poli-identidad-geometria"><div class="poli-identidad-figuras"></div>
    <div class="poli-identidad-clave"></div></div><div class="poli-identidad-algebra">
    <p class="poli-ayuda-oscura">Sigue el desarrollo o pulsa una línea para volver a ella. Los colores conectan las áreas con los términos.</p>
    <ol class="poli-desarrollo"></ol></div></div>
    <div class="mate-controles poli-identidad-navegacion">${boton("Paso anterior", 'data-id-anterior')}${boton("Paso siguiente", 'data-id-siguiente')}<span data-id-progreso></span></div>
    <figcaption class="poli-identidad-calculo" aria-live="polite"></figcaption>`);

  function dibujoCuadrado(a, b, tipo) {
    const suma = tipo === "suma";
    const lado = suma ? a + b : a;
    const unidad = 280 / lado;
    const principal = (suma ? a : a - b) * unidad;
    const pequeno = b * unidad;
    const inicio = 62;
    const texto = (x, y, valor, clase = "") => `<text x="${x}" y="${y}" class="${clase}">${valor}</text>`;
    const rectangulo = (x, y, ancho, alto, clase, etiqueta, valor) => {
      const estrecho = ancho < 45 && alto > 70;
      const centroX = x + ancho / 2, centroY = y + alto / 2;
      return `<g><rect x="${x}" y="${y}" width="${ancho}" height="${alto}" class="${clase}"/>
        <text x="${centroX}" y="${centroY}" class="poli-area-texto${Math.min(ancho, alto) < 45 ? ' poli-area-pequena' : ''}" ${estrecho ? `transform="rotate(-90 ${centroX} ${centroY})"` : ""}>${etiqueta}${Math.min(ancho, alto) >= 50 ? `<tspan x="${centroX}" dy="23">${valor}</tspan>` : ""}</text></g>`;
    };
    const piezas = suma
      ? rectangulo(inicio, inicio, principal, principal, "poli-rect-a", "a²", a * a) +
        rectangulo(inicio + principal, inicio, pequeno, principal, "poli-rect-ab", "ab", a * b) +
        rectangulo(inicio, inicio + principal, principal, pequeno, "poli-rect-ab", "ab", a * b) +
        rectangulo(inicio + principal, inicio + principal, pequeno, pequeno, "poli-rect-b", "b²", b * b)
      : rectangulo(inicio, inicio, 280, 280, "poli-rect-a", "", "") +
        `<rect x="${inicio + principal}" y="${inicio}" width="${pequeno}" height="280" class="poli-tira"/>
         <rect x="${inicio}" y="${inicio + principal}" width="280" height="${pequeno}" class="poli-tira"/>` +
        texto(inicio + principal / 2, inicio + principal / 2, "(a − b)²", "poli-area-texto") +
        rectangulo(inicio + principal, inicio + principal, pequeno, pequeno, "poli-rect-b", "+b²", b * b) +
        `<text x="${inicio + principal + pequeno / 2}" y="${inicio + principal / 2}" class="poli-area-texto poli-area-pequena" transform="rotate(-90 ${inicio + principal + pequeno / 2} ${inicio + principal / 2})">−ab</text>` +
        texto(inicio + principal / 2, inicio + principal + pequeno / 2, "−ab", "poli-area-texto poli-area-pequena");
    return `<svg class="poli-area-svg" viewBox="0 0 380 390" role="img" aria-label="${suma ? `Cuadrado de lado a más b: un cuadrado a², dos rectángulos ab y un cuadrado b².` : `Cuadrado a²: se restan dos tiras ab que se solapan en b². Se repone ese solapamiento y queda el cuadrado de lado a menos b.`}">
      <path class="poli-cota" d="M62 48V36H${inicio + principal}V48 M${inicio + principal} 48V36H342V48 M48 62H36V${inicio + principal}H48 M48 ${inicio + principal}H36V342H48"/>
      ${texto(inicio + principal / 2, 25, suma ? `a = ${a}` : `a − b = ${a - b}`)}
      ${texto(inicio + principal + pequeno / 2, 25, `b`)}
      <text x="20" y="${inicio + principal / 2}" transform="rotate(-90 20 ${inicio + principal / 2})">${suma ? "a" : "a − b"}</text>
      <text x="20" y="${inicio + principal + pequeno / 2}">b</text>
      ${piezas}<rect x="62" y="62" width="280" height="280" class="poli-area-contorno"/>
      ${texto(202, 373, `${suma ? 'Lado completo a + b' : 'Lado del cuadrado inicial a'} = ${lado}`)}
    </svg>`;
  }

  function diferencia(a, b) {
    const s = a - b, u = 240 / a, principal = s * u, pequeno = b * u;
    const pieza = (x, y, w, h, clase, texto) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" class="${clase}"/><text x="${x + w / 2}" y="${y + h / 2}" class="poli-area-texto poli-area-pequena">${texto}</text>`;
    const rectU = 300 / (a + b), alto = s * rectU;
    return `<div class="poli-identidad-par">
      <div><p>De a² quitamos b²</p><svg class="poli-area-svg" viewBox="0 0 340 310" role="img" aria-label="Cuadrado de lado a, con el cuadrado b² retirado de una esquina">
        ${pieza(50, 20, principal, principal, "poli-rect-a", "(a − b)²")}
        ${pieza(50 + principal, 20, pequeno, principal, "poli-rect-a", "")}
        ${pieza(50, 20 + principal, principal, pequeno, "poli-rect-a", "")}
        ${pieza(50 + principal, 20 + principal, pequeno, pequeno, "poli-rect-b poli-area-retirada", "b²")}
        <rect x="50" y="20" width="240" height="240" class="poli-area-contorno"/>
        <text x="170" y="290">Área inicial a² = ${a * a}</text>
      </svg></div>
      <div><p>Recolocamos las tres piezas</p><svg class="poli-area-svg" viewBox="0 0 340 310" role="img" aria-label="Las mismas tres piezas forman un rectángulo de lados a más b y a menos b">
        ${pieza(20, 130 - alto / 2, s * rectU, alto, "poli-rect-a", "(a − b)²")}
        ${pieza(20 + s * rectU, 130 - alto / 2, b * rectU, alto, "poli-rect-a", "")}
        ${pieza(20 + a * rectU, 130 - alto / 2, b * rectU, alto, "poli-rect-a", "")}
        <text x="170" y="${158 + alto / 2}">a + b = ${a + b}</text>
        <text x="170" y="${100 - alto / 2}">Altura a − b = ${s}</text>
      </svg></div></div>`;
  }

  function pintar() {
    const { a, b, tipo } = estado;
    const foco = document.activeElement?.dataset.identidadPaso;
    nodo.querySelector('.poli-identidad-comparacion').dataset.identidad = tipo;
    const A = termino("a²", "a"), AB = termino("ab", "ab"), B = termino("b²", "b");
    const desarrollos = {
      suma: [
        ["Escribe el cuadrado como un producto", "(a + b)² = (a + b)(a + b)"],
        ["Distribuye cada término del primer paréntesis", "= a(a + b) + b(a + b)"],
        ["Multiplica: una pieza por cada producto", `= ${A} + ${AB} + ${AB} + ${B}`],
        ["Reúne los dos rectángulos iguales", `= ${A} + ${termino("2ab", "ab")} + ${B}`],
      ],
      resta: [
        ["Escribe el cuadrado como un producto", "(a − b)² = (a − b)(a − b)"],
        ["Distribuye a y después −b", "= a(a − b) − b(a − b)"],
        ["Multiplica: menos por menos da más", `= ${A} − ${AB} − ${AB} + ${B}`],
        ["El área que queda tiene lado a − b", `(a − b)² = ${A} − ${termino("2ab", "ab")} + ${B}`],
      ],
      diferencia: [
        ["Multiplica una suma por una diferencia", "(a + b)(a − b)"],
        ["Distribuye cada término", "= a(a − b) + b(a − b)"],
        ["Desarrolla los cuatro productos", `= ${A} − ${AB} + ${AB} − ${B}`],
        ["Los productos −ab y +ab se anulan", `= ${A} ${termino('−ab + ab', 'ab')} − ${B} = ${A} − ${B}`],
      ],
    };
    nodo.querySelector(".poli-identidad-figuras").innerHTML = tipo === "diferencia" ? diferencia(a, b) : dibujoCuadrado(a, b, tipo);
    nodo.querySelector(".poli-identidad-clave").innerHTML = `${termino(`a² = ${a * a}`, 'a')} ${termino(`ab = ${a * b}`, 'ab')} ${termino(`b² = ${b * b}`, 'b')}`;
    nodo.querySelector(".poli-desarrollo").innerHTML = desarrollos[tipo].map(([titulo, expresion], i) =>
      `<li><button type="button" data-identidad-paso="${i}" aria-current="${i === paso ? 'step' : 'false'}"><span>${i + 1}. ${titulo}</span><span class="mate-ecuacion">${expresion}</span></button></li>`).join("");
    nodo.querySelector("[data-id-anterior]").disabled = paso === 0;
    nodo.querySelector("[data-id-siguiente]").disabled = paso === 3;
    nodo.querySelector("[data-id-progreso]").textContent = `Paso ${paso + 1} de 4`;
    if (foco !== undefined) nodo.querySelector(`[data-identidad-paso="${foco}"]`).focus({ preventScroll: true });
    const numerica = tipo === "suma" ? `(${a} + ${b})² = ${a * a} + ${a * b} + ${a * b} + ${b * b} = ${(a + b) ** 2}`
      : tipo === "resta" ? `(${a} − ${b})² = ${a * a} − ${a * b} − ${a * b} + ${b * b} = ${(a - b) ** 2}`
        : `(${a} + ${b})(${a} − ${b}) = ${a * a} − ${a * b} + ${a * b} − ${b * b} = ${a * a - b * b}`;
    nodo.querySelector("figcaption").innerHTML = `<strong>Con a = ${a} y b = ${b}</strong><br>${numerica}${tipo === 'resta' ? '<br>En el dibujo partimos de a² y quitamos dos tiras de área ab. Sumamos el solapamiento azul b² para no restarlo dos veces.' : tipo === 'diferencia' ? '<br>Quitamos el cuadrado azul b² del cuadrado inicial a². Las dos piezas estrechas miden b por a − b; al recolocarlas obtenemos un rectángulo de lados a + b y a − b. En el desarrollo, los productos amarillos −ab y +ab se anulan.' : ''}`;
  }
  controles(nodo, [
    opciones("tipo", "Identidad", [["suma", "Cuadrado de una suma"], ["resta", "Cuadrado de una diferencia"], ["diferencia", "Suma por diferencia"]]),
    rango("a", "Longitud a", 3, 10, 5), rango("b", "Longitud b", 1, 4, 2),
  ], ({ a, b, tipo }, campos) => {
    campos.b.entrada.max = a - 1;
    campos.b.entrada.value = b = Math.min(b, a - 1);
    estado = { a, b, tipo };
    pintar();
  });
  nodo.addEventListener("click", (evento) => {
    const linea = evento.target.closest("[data-identidad-paso]");
    if (linea) paso = Number(linea.dataset.identidadPaso);
    else if (evento.target.closest("[data-id-anterior]")) paso = Math.max(0, paso - 1);
    else if (evento.target.closest("[data-id-siguiente]")) paso = Math.min(3, paso + 1);
    else return;
    pintar();
  });
})();
