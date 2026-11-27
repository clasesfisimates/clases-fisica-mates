(() => {
  const { numero, rango, opciones, pizarra, pieza, controles, resultados, pasos, grafica } = window.Mate;
  const panel = (id) => document.querySelector(`[data-simulacion="${id}"]`);
  const radical = (n, dentro) => n === 2 ? `√(${dentro})` : `${n === 3 ? "∛" : "∜"}(${dentro})`;
  const bloque = (texto) => `<span class="mate-bloque">${texto}</span>`;

  function potencias() {
    const nodo = panel("potencias");
    if (!nodo) return;
    nodo.innerHTML = pizarra('<div data-factores></div><figcaption></figcaption><div data-resultados></div>');
    controles(nodo, [
      opciones("operacion", "Operación", [["producto", "Producto"], ["cociente", "Cociente"], ["potencia", "Potencia de una potencia"]]),
      rango("b", "Base", 2, 4, 2), rango("m", "Exponente m", 0, 5, 2), rango("n", "Exponente n", 0, 5, 3),
    ], ({ b, m, n, operacion }) => {
      const factores = (cantidad, clase = "") => Array.from({ length: cantidad }, () => pieza(b, clase)).join("") || pieza("1", "mate-crema");
      const unidos = (texto) => `<div class="mate-linea">${texto}</div>`;
      let exponente, expresion, explicacion, visual;
      if (operacion === "producto") {
        [exponente, expresion, explicacion] = [m + n, "m + n", "Cuenta los factores de ambos grupos. Los dos grupos tienen la misma base."];
        visual = unidos(bloque(factores(m)) + " × " + bloque(factores(n, "mate-ambar")));
      } else if (operacion === "cociente") {
        [exponente, expresion, explicacion] = [m - n, "m − n", "Cada factor de arriba cancela uno igual de abajo. Si quedan factores abajo, el exponente es negativo."];
        const comunes = Math.min(m, n);
        const fila = (cantidad) => (comunes ? factores(comunes, "mate-cancelado") : "") + (cantidad > comunes ? factores(cantidad - comunes, "mate-ambar") : "");
        const linea = (cantidad) => cantidad === 0 ? pieza("1", "mate-crema") : fila(cantidad);
        visual = `<div class="mate-fraccion" aria-label="Factores del numerador y el denominador"><div>${linea(m)}</div><div>${linea(n)}</div></div>`;
      } else {
        [exponente, expresion, explicacion] = [m * n, "m · n", "Se repite el grupo interior tantas veces como indica el exponente exterior."];
        visual = unidos(Array.from({ length: n }, () => bloque(factores(m))).join(" × ") || pieza("1", "mate-crema"));
      }
      const inicial = operacion === "potencia" ? `(${b}<sup>${m}</sup>)<sup>${n}</sup>` :
        `${b}<sup>${m}</sup> ${operacion === "producto" ? "×" : "÷"} ${b}<sup>${n}</sup>`;
      nodo.querySelector("[data-factores]").innerHTML = visual;
      nodo.querySelector("figcaption").textContent = explicacion;
      nodo.querySelector("[data-resultados]").innerHTML = resultados([
        [expresion, `${inicial} = ${b}<sup>${numero(exponente)}</sup>${exponente < 0 ? ` = 1/${b ** -exponente}` : ""}`],
      ]);
    });
  }

  function radicales() {
    const nodo = panel("radicales");
    if (!nodo) return;
    nodo.innerHTML = pizarra('<div data-grupos></div><figcaption></figcaption><div data-resultados></div>');
    controles(nodo, [
      rango("n", "Índice de la raíz", 2, 4, 2),
      rango("m", "Cantidad de factores 2", 1, 12, 4),
      opciones("extra", "Factor adicional", [["3", "Un 3"], ["1", "Ninguno"]]),
    ], ({ n, m, extra }) => {
      const grupos = Math.floor(m / n);
      const quedan = m % n;
      const adentro = 2 ** quedan * Number(extra);
      const fuera = 2 ** grupos;
      const sueltos = pieza("2", "mate-ambar").repeat(quedan) + (extra === "3" ? pieza("3", "mate-crema") : "");
      nodo.querySelector("[data-grupos]").innerHTML = `<div class="mate-linea"><b>Dentro</b>${bloque(pieza("2").repeat(n)).repeat(grupos)}${sueltos}</div>
        <div class="mate-linea"><b>Fuera</b>${grupos ? pieza("2").repeat(grupos) : "Ningún grupo completo"}</div>`;
      nodo.querySelector("figcaption").textContent = `Cada bloque de ${n} doses aporta un 2 fuera. Los factores sin grupo completo se quedan dentro.`;
      const resultado = adentro === 1 ? String(fuera) : (fuera === 1 ? "" : fuera + " · ") + radical(n, adentro);
      nodo.querySelector("[data-resultados]").innerHTML = resultados([["Extracción de factores", `${radical(n, 2 ** m * Number(extra))} = ${resultado}`]]);
    });
  }

  function racionalizar() {
    const nodo = panel("racionalizar");
    if (!nodo) return;
    nodo.innerHTML = pizarra('<div data-igualdad></div><div data-resultados></div><figcaption></figcaption>');
    const casos = {
      simple: ["1", "√5", "√5", "√5", "5", "√5 · √5 = 5", "Dos raíces cuadradas iguales forman el número que había dentro."],
      indice: ["2", "∛4", "∛2", "2∛2", "2", "∛4 · ∛2 = ∛8 = 2", "Dentro de la raíz cúbica ya hay dos factores 2. Falta uno para completar el cubo."],
      conjugado: ["1", "√5 − √3", "√5 + √3", "√5 + √3", "2", "(√5 − √3)(√5 + √3) = 5 − 3", "El conjugado conserva los términos y cambia el signo entre ellos. Al multiplicar, los términos cruzados se cancelan."],
    };
    const fraccion = (arriba, abajo) => `<span class="mate-fraccion"><span>${arriba}</span><span>${abajo}</span></span>`;
    controles(nodo, [opciones("tipo", "Forma del denominador", [["simple", "Una raíz cuadrada"], ["indice", "Una raíz cúbica"], ["conjugado", "Una diferencia de raíces"]])], ({ tipo }) => {
      const [a, b, factor, c, d, igualdad, explicacion] = casos[tipo];
      const simplificada = tipo === "indice" ? " = ∛2" : "";
      nodo.querySelector("[data-igualdad]").innerHTML = `<div class="mate-linea mate-ecuacion">${fraccion(a, b)} · ${fraccion(`<strong>${factor}</strong>`, `<strong>${factor}</strong>`)} = ${fraccion(c, d)}${simplificada}</div>`;
      nodo.querySelector("[data-resultados]").innerHTML = resultados([["Lo que pasa en el denominador", igualdad]]);
      nodo.querySelector("figcaption").textContent = explicacion;
    });
  }

  function logaritmos() {
    const nodo = panel("logaritmos");
    if (!nodo) return;
    nodo.innerHTML = pizarra('<canvas class="mate-grafica" role="img"></canvas><div data-resultados></div><figcaption></figcaption>');
    const dibujar = grafica(nodo.querySelector("canvas"));
    controles(nodo, [
      opciones("base", "Base b", [["2", "2"], ["3", "3"], ["10", "10"], ["0.5", "½"]]),
      rango("y", "Exponente y", -2, 2, 1, 0.25),
    ], ({ base, y }) => {
      const b = Number(base);
      const x = b ** y;
      const escala = [1, 2, 5, 10, 20, 50].find((paso) => paso * 4 >= x * 1.15);
      const marcasX = [0, escala, escala * 2, escala * 3, escala * 4];
      const expr = `log<sub>${numero(b)}</sub>(${numero(x)})`;
      const igualdad = Math.abs(x - Number(x.toFixed(4))) < 1e-10 ? "=" : "≈";
      dibujar({
        minX: 0, maxX: marcasX.at(-1), minY: -3, maxY: 3, marcasX, marcasY: [-2, -1, 0, 1, 2],
        calcular: (valor) => Math.log(valor) / Math.log(b), puntos: [[x, y]], muestreo: 3,
        descripcion: `Gráfica del logaritmo en base ${numero(b)}. Punto: x ${numero(x)}, y ${numero(y)}.`,
      });
      nodo.querySelector("[data-resultados]").innerHTML = resultados([
        ["Potencia · calcula x", `${numero(b)}<sup>${numero(y)}</sup> ${igualdad} ${numero(x)}`],
        ["Logaritmo · lee y", `${expr} ${igualdad} ${numero(y)}`],
      ]);
      nodo.querySelector("figcaption").textContent = `El punto se lee como (x, y) = (${numero(x)}, ${numero(y)}). Todas las curvas pasan por (1, 0). Con base entre 0 y 1, la curva desciende.`;
    });
  }

  potencias();
  radicales();
  racionalizar();
  logaritmos();
  pasos(document.querySelector('[data-ejemplo="radicales"]'), [
    ["Busca cuadrados perfectos", "√45 + 2√20 − √5", "Descompón 45 como 9 · 5 y 20 como 4 · 5. Como 9 y 4 son cuadrados perfectos, sus raíces son enteras.", pieza("45 = 9 · 5") + " " + pieza("20 = 4 · 5", "mate-ambar")],
    ["Saca los factores", "3√5 + 2 · 2√5 − √5", "Saca un 3 de la primera raíz y un 2 de la segunda. El 2 que ya multiplicaba a √20 se mantiene.", pieza("√9 = 3") + " " + pieza("√4 = 2", "mate-ambar")],
    ["Agrupa lo que tiene el mismo radical", "(3 + 4 − 1)√5", "Las tres expresiones valen cierto número de veces √5. Opera únicamente sus coeficientes.", pieza("+3") + " " + pieza("+4", "mate-ambar") + " " + pieza("−1", "mate-crema")],
    ["Escribe el resultado", "6√5", "Quedan seis veces √5. El 5 sigue dentro porque es el radicando común.", pieza("6 · √5", "mate-ambar")],
  ]);
})();
