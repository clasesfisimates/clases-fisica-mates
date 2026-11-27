(() => {
  const { rango, opciones, pizarra, pieza, controles, pasos } = window.Mate;
  const panel = (id) => document.querySelector(`[data-simulacion="${id}"]`);
  const fraccion = (n, d) => `<span class="mate-fraccion"><span>${n}</span><span>${d}</span></span>`;
  const anadido = (texto) => `<span class="poli-anadido">${texto}</span>`;
  const denominador = (texto) => `<span class="poli-denominador">${texto}</span>`;

  function fracciones() {
    const nodo = panel("fracciones");
    nodo.innerHTML = pizarra('<div class="poli-fracciones-camino"></div><figcaption aria-live="polite"></figcaption>');
    controles(nodo, [rango("a", "Valor de a", 1, 5, 2)], ({ a }) => {
      const comun = `(x − ${a})`, queda = `(x + ${a})`;
      const tarjeta = (titulo, expresion, nota) => `<div class="poli-fraccion-etapa"><h3>${titulo}</h3><div class="poli-fraccion-expresion mate-ecuacion">${expresion}</div><p>${nota}</p></div>`;
      nodo.querySelector(".poli-fracciones-camino").innerHTML =
        tarjeta("1. Expresión original", fraccion(`x² − ${a * a}`, `x − ${a}`), "Reconocemos una diferencia de cuadrados en el numerador.") +
        '<span class="poli-paso-flecha" aria-hidden="true">→</span>' +
        tarjeta("2. Factorizar", fraccion(pieza(comun) + pieza(queda, "mate-ambar"), pieza(comun)), "El mismo factor rosa aparece arriba y abajo.") +
        '<span class="poli-paso-flecha" aria-hidden="true">→</span>' +
        tarjeta("3. Cancelar el factor común", fraccion(pieza(comun, "mate-cancelado") + pieza(queda, "mate-ambar"), pieza(comun, "mate-cancelado")) + `<span class="poli-fraccion-final">= ${pieza(`x + ${a}`, "mate-ambar")}</span>`, "Cancelamos un factor completo, nunca términos de una suma.");
      nodo.querySelector("figcaption").innerHTML = `<strong>En los tres pasos: x ≠ ${a}.</strong> El denominador original vale cero en x = ${a}; simplificar no recupera ese valor excluido.`;
    });
  }

  function operarFracciones() {
    const nodo = document.createElement("div");
    nodo.className = "mate-subtaller poli-operaciones";
    nodo.innerHTML = '<h3>Operaciones con dos fracciones</h3>' + pizarra('<p class="poli-operacion-clave"></p><ol class="poli-operacion-pasos"></ol><figcaption></figcaption>');
    panel("fracciones").after(nodo);
    controles(nodo, [
      rango("a", "Valor de a", 1, 5, 2),
      opciones("op", "Operación", [["suma", "Sumar"], ["resta", "Restar"], ["producto", "Multiplicar"], ["cociente", "Dividir"]]),
    ], ({ a, op }) => {
      const menor = `(x − ${a})`, mayor = `(x + ${a})`, comun = menor + mayor;
      const signo = op === "resta" ? "−" : "+";
      const sumaOResta = op === "suma" || op === "resta";
      let escenas;
      if (sumaOResta) {
        const final = op === "suma" ? `3x − ${a}` : `−x + ${3 * a}`;
        const desarrollado = op === "suma" ? `x + ${a} + 2x − ${2 * a}` : `x + ${a} − 2x + ${2 * a}`;
        escenas = [
          ["Partimos de las dos fracciones", `${fraccion("1", menor)} ${signo} ${fraccion("2", mayor)}`, "Los denominadores son distintos: primero hay que igualarlos."],
          ["Multiplicamos arriba y abajo por el denominador de la otra fracción", `${fraccion(`1 · ${anadido(mayor)}`, `${menor} · ${anadido(mayor)}`)} ${signo} ${fraccion(`2 · ${anadido(menor)}`, `${mayor} · ${anadido(menor)}`)}`, "Lo amarillo se añade en el numerador y en el denominador. Cada fracción se multiplica por 1, así que su valor se conserva."],
          ["Hacemos los productos y ordenamos los factores", `${fraccion(mayor, denominador(comun))} ${signo} ${fraccion(`2${menor}`, denominador(comun))}`, "El orden de los factores no cambia el producto. Los dos denominadores ya son iguales."],
          ["Conservamos un único denominador y reunimos los numeradores", fraccion(`${mayor} ${signo} 2${menor}`, denominador(comun)), `El denominador común se conserva una sola vez; ${op === 'suma' ? 'sumamos' : 'restamos'} los numeradores completos.`],
          [op === 'resta' ? "Distribuimos el −2 a todo el segundo paréntesis" : "Distribuimos el 2 al segundo paréntesis", fraccion(desarrollado, comun), op === 'resta' ? `−2(x − ${a}) = −2x + ${2 * a}. El segundo signo también cambia.` : `2(x − ${a}) = 2x − ${2 * a}.`],
          ["Reducimos los términos semejantes", fraccion(final, comun), op === 'suma' ? `x + 2x = 3x y ${a} − ${2 * a} = −${a}.` : `x − 2x = −x y ${a} + ${2 * a} = ${3 * a}.`],
        ];
      } else if (op === "producto") {
        escenas = [
          ["Partimos del producto", `${fraccion("1", menor)} · ${fraccion("2", mayor)}`, "Para multiplicar no necesitamos un denominador común."],
          ["Numerador por numerador y denominador por denominador", fraccion(`${anadido('1')} · ${anadido('2')}`, `${denominador(menor)} · ${denominador(mayor)}`), "El producto de los numeradores va arriba; el producto de los denominadores va abajo."],
          ["Calculamos los productos", fraccion("2", comun), "1 · 2 = 2. El denominador se conserva como producto de factores."],
          ["Comprobamos si se puede simplificar", fraccion("2", comun), `El numerador 2 no contiene los factores x − ${a} ni x + ${a}; no hay ningún factor que cancelar.`],
          ["También podemos desarrollar el denominador", fraccion("2", `x² − ${a * a}`), "Suma por diferencia: las formas factorizada y desarrollada son equivalentes."],
        ];
      } else {
        escenas = [
          ["Partimos de la división", `${fraccion("1", menor)} ÷ ${fraccion("2", mayor)}`, "Dividir por una fracción equivale a multiplicar por su inversa."],
          ["Invertimos solo la segunda fracción", `${fraccion("1", menor)} · ${fraccion(anadido(mayor), anadido("2"))}`, "El denominador de la segunda sube y su numerador baja. La primera fracción conserva su posición."],
          ["Multiplicamos numeradores y denominadores", fraccion(`1 · ${mayor}`, `${menor} · 2`), "Ahora aplicamos la regla del producto de fracciones."],
          ["Calculamos y ordenamos los factores", fraccion(mayor, `2${menor}`), `1 · (x + ${a}) = x + ${a}. Abajo escribimos primero el factor numérico 2.`],
          ["Revisamos factores y restricciones", fraccion(mayor, `2${menor}`), "No hay factores comunes que cancelar. La fracción por la que dividimos debe estar definida y ser distinta de cero; aquí su numerador es 2."],
        ];
      }
      nodo.querySelector(".poli-operacion-clave").innerHTML = sumaOResta ? `${anadido('Amarillo: factores añadidos arriba y abajo')} · ${denominador('Azul: el mismo denominador')}` : op === 'cociente' ? anadido('Amarillo: numerador y denominador de la fracción invertida') : "Seguimos el producto sin cambiar el valor de las fracciones.";
      nodo.querySelector(".poli-operacion-pasos").innerHTML = escenas.map(([titulo, expresion, nota], i) => `<li><h4>${i + 1}. ${titulo}</h4><div class="mate-linea mate-ecuacion">${expresion}</div><p>${nota}</p></li>`).join("");
      nodo.querySelector("figcaption").innerHTML = `<strong>Dominio en todo el proceso: x ≠ ${a} y x ≠ −${a}.</strong> Estas restricciones proceden de las dos fracciones originales.`;
    });
    nodo.prepend(nodo.querySelector("h3"));
  }

  fracciones();
  operarFracciones();
  pasos(document.querySelector('[data-ejemplo="fracciones"]'), [
    ["Factoriza el denominador", "x² − 4 = (x − 2)(x + 2)", "La diferencia de cuadrados muestra que 2 y −2 harían cero uno de los denominadores.", pieza("x ≠ 2") + " " + pieza("x ≠ −2", "mate-ambar")],
    ["Multiplica arriba y abajo por el factor que falta", "El primer denominador necesita x + 2", "Multiplicar numerador y denominador por el mismo factor conserva el valor de la fracción.", fraccion(`1 · ${anadido('(x + 2)')}`, `(x − 2) · ${anadido('(x + 2)')}`) + " + " + fraccion('3', '(x − 2)(x + 2)')],
    ["Los denominadores ya coinciden", "Conserva una sola copia del denominador", "Reunimos los numeradores porque se dividen por el mismo producto.", fraccion('(x + 2) + 3', denominador('(x − 2)(x + 2)'))],
    ["Simplifica el numerador", "x + 2 + 3 = x + 5", "Sumamos los términos independientes. El denominador conserva sus factores.", fraccion('x + 5', '(x − 2)(x + 2)')],
    ["Revisa los factores y el dominio", "x ≠ 2 y x ≠ −2", "El numerador x + 5 no comparte factor con el denominador. Mantenemos las restricciones de la expresión original.", fraccion('x + 5', '(x − 2)(x + 2)')],
  ]);
})();
