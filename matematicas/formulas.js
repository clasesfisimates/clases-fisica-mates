(() => {
  const { controles, rango, opciones, numero, porcentaje } = window.Mate;
  const linea = (nombre, expresion, descripcion, terminos, campos, calcular) =>
    ({ nombre, expresion, descripcion, terminos, campos, calcular });
  const pcm = (id, nombre, valor) => rango(id, nombre + " (%)", 0, 100, valor);
  const entero = (id, nombre, valor, min = 0, max = 10) => rango(id, nombre, min, max, valor);
  const log = (base, valor) => Math.log(valor) / Math.log(base);
  const bases = opciones("b", "Base b", [["2", "2"], ["3", "3"], ["10", "10"], ["0.5", "½"]]);

  const casos = [
    linea("Regla de Laplace", "P(A) = f/n", "Úsala cuando todos los resultados sean igual de probables.",
      [["f", "Resultados favorables a A"], ["n", "Resultados posibles en total"]],
      [entero("n", "Posibles", 10, 1, 20), entero("f", "Favorables", 3, 0, 10)], ({ n, f }, campos) => {
        campos.f.entrada.max = n;
        f = Math.min(f, n);
        campos.f.entrada.value = f;
        return `P(A) = ${f}/${n} ≈ ${porcentaje(f / n)}`;
      }),
    linea("Suceso contrario", "P(A̅) = 1 − P(A)", "A̅ reúne todos los resultados en los que A no ocurre.",
      [["A", "Suceso original"], ["A̅", "Suceso contrario"]],
      [pcm("a", "Probabilidad de A", 35)], ({ a }) => `100 % − ${a} % = ${100 - a} %`),
    linea("Unión de sucesos", "P(A ∪ B) = P(A) + P(B) − P(A ∩ B)", "Al sumar A y B, los resultados comunes se cuentan dos veces. Resta la intersección una vez.",
      [["A ∪ B", "Ocurre A, B o ambos"], ["A ∩ B", "Ocurren ambos"]],
      [pcm("a", "Probabilidad de A", 40), pcm("b", "Probabilidad de B", 50), pcm("c", "Probabilidad de ambos", 20)], ({ a, b, c }, campos) => {
        campos.c.entrada.min = Math.max(0, a + b - 100);
        campos.c.entrada.max = Math.min(a, b);
        c = Math.min(Math.min(a, b), Math.max(Math.max(0, a + b - 100), c));
        campos.c.entrada.value = c;
        return `${a} % + ${b} % − ${c} % = ${a + b - c} %`;
      }),
    linea("Probabilidad condicionada", "P(A | B) = P(A ∩ B)/P(B)", "Si sabes que ha ocurrido B, toma sus resultados como el nuevo total. P(B) debe ser mayor que cero.",
      [["P(A | B)", "Probabilidad de A sabiendo que ocurrió B"], ["P(A ∩ B)", "Probabilidad de los dos sucesos a la vez"]],
      [pcm("b", "Probabilidad de B", 50), pcm("c", "Probabilidad de ambos", 20)], ({ b, c }, campos) => {
        campos.c.entrada.max = b;
        c = Math.min(c, b);
        campos.c.entrada.value = c;
        return b ? `${c}/${b} ≈ ${porcentaje(c / b)}` : "Sin definir porque P(B) = 0.";
      }),
    linea("Independencia", "P(A ∩ B) = P(A) · P(B)", "Comprueba si se cumple la igualdad. Si conoces P(A) y P(B), el producto te dice cuánto debe valer la intersección para que sean independientes.",
      [["P(A) y P(B)", "Probabilidades de cada suceso"], ["P(A ∩ B)", "Probabilidad de que ocurran los dos"]],
      [pcm("a", "Probabilidad de A", 40), pcm("b", "Probabilidad de B", 50)], ({ a, b }) => `Para que sean independientes, P(A ∩ B) debe ser ${porcentaje(a * b / 10000)}.`),
    linea("Probabilidad total", "P(D) = P(A)P(D | A) + P(B)P(D | B)", "Si A y B son dos orígenes excluyentes y cubren todos los casos, suma lo que aporta cada uno al resultado D.",
      [["P(A) y P(B)", "Peso de cada origen"], ["P(D | A) y P(D | B)", "Frecuencia de D en cada origen"]],
      [pcm("a", "Producción de A", 60), pcm("da", "Defectos en A", 10), pcm("db", "Defectos en B", 25)], ({ a, da, db }) => {
        const primero = a * da / 10000;
        const segundo = (100 - a) * db / 10000;
        return `${porcentaje(primero)} + ${porcentaje(segundo)} = ${porcentaje(primero + segundo)}`;
      }),
    linea("Teorema de Bayes", "P(B | D) = P(B)P(D | B)/P(D)", "Entre todos los resultados D, quédate con la parte que llegó por B. Si P(D) vale cero, la condicionada queda sin definir.",
      [["P(B)P(D | B)", "Probabilidad del camino B y D"], ["P(D)", "Suma de todos los caminos que terminan en D"]],
      [pcm("a", "Producción de A", 60), pcm("da", "Defectos en A", 10), pcm("db", "Defectos en B", 25)], ({ a, da, db }) => {
        const b = (100 - a) * db;
        const total = a * da + b;
        return total ? `${porcentaje(b / 10000)} / ${porcentaje(total / 10000)} ≈ ${porcentaje(b / total)}` : "Sin definir porque P(D) = 0.";
      }),
  ];

  const reales = [
    linea("Potencias de igual base", "aᵐ · aⁿ = aᵐ⁺ⁿ ··· aᵐ/aⁿ = aᵐ⁻ⁿ", "En el producto juntas factores. En el cociente cancelas los iguales. Un exponente negativo indica un inverso y la base del cociente debe ser distinta de cero.",
      [["a", "Base común"], ["m y n", "Exponentes de las potencias"]],
      [entero("a", "Base", 2, 2, 5), entero("m", "Exponente m", 3, -3, 5), entero("n", "Exponente n", 2, -3, 5)], ({ a, m, n }) =>
        `Producto: ${a}<sup>${numero(m + n)}</sup>. Cociente: ${a}<sup>${numero(m - n)}</sup>${m < n ? " = 1/" + a ** (n - m) : ""}.`),
    linea("Potencia de una potencia", "(aᵐ)ⁿ = aᵐⁿ", "Repetir un grupo de m factores n veces produce m · n factores.",
      [["a", "Base"], ["m", "Exponente interior"], ["n", "Exponente exterior"]],
      [entero("a", "Base", 2, 2, 5), entero("m", "Exponente interior", 2, 0, 5), entero("n", "Exponente exterior", 3, 0, 5)],
      ({ a, m, n }) => `(${a}<sup>${m}</sup>)<sup>${n}</sup> = ${a}<sup>${m * n}</sup>`),
    linea("Extracción de factores", "ⁿ√(aⁿ · b) = a · ⁿ√b", "Para a y b no negativos, cada grupo de n factores a sale como un solo a. Con índice par y a negativa, sale |a|.",
      [["n", "Índice de la raíz"], ["a", "Factor que sale"], ["b", "Parte que queda en el radical"]],
      [entero("n", "Índice", 2, 2, 4), entero("a", "Factor", 3, 2, 5), entero("b", "Radicando restante", 5, 1, 7)],
      ({ n, a, b }) => `<sup>${n}</sup>√(${a ** n * b}) = ${a} · <sup>${n}</sup>√${b}`),
    linea("Racionalizar con el conjugado", "(√a − √b)(√a + √b) = a − b", "Multiplica numerador y denominador por el conjugado y simplifica. En el ejemplo a y b son positivos y distintos.",
      [["√a − √b", "Denominador original"], ["√a + √b", "Conjugado"]],
      [entero("a", "Radicando a", 5, 5, 10), entero("b", "Radicando b", 3, 1, 4)],
      ({ a, b }) => `1/(√${a} − √${b}) = (√${a} + √${b})/${a - b}`),
    linea("Definición de logaritmo", "log<sub>b</sub>(x) = y ⇔ b<sup>y</sup> = x", "El logaritmo devuelve el exponente. La base debe ser positiva y distinta de 1. El argumento x debe ser positivo.",
      [["b", "Base del logaritmo"], ["x", "Argumento"], ["y", "Exponente al que se eleva b"]],
      [bases, entero("y", "Exponente y", 2, -3, 3)], ({ b, y }) => {
        const potencia = Number(b) ** Math.abs(y);
        const x = y < 0 && Number(b) > 1 ? "1/" + potencia : numero(Number(b) ** y);
        return `${numero(Number(b))}<sup>${numero(y)}</sup> = ${x} ⇒ log<sub>${numero(Number(b))}</sub>(${x}) = ${numero(y)}`;
      }),
    linea("Propiedades de los logaritmos", "log<sub>b</sub>(uv) = log<sub>b</sub>(u) + log<sub>b</sub>(v)", "Un producto dentro se convierte en una suma fuera. Un cociente se convierte en una resta y una potencia convierte su exponente en un multiplicador.",
      [["u y v", "Argumentos positivos"], ["b", "Base positiva distinta de 1"]],
      [bases, entero("u", "Argumento u", 4, 1), entero("v", "Argumento v", 2, 1),
        opciones("op", "Propiedad", [["producto", "Producto"], ["cociente", "Cociente"], ["potencia", "Potencia"]])],
      ({ b, u, v, op }) => {
        const l = `log<sub>${numero(Number(b))}</sub>`;
        if (op === "potencia") return `${l}(${u}<sup>${v}</sup>) = ${v} · ${l}(${u}) ≈ ${numero(v * log(b, u))}`;
        const producto = op === "producto";
        return `${l}(${u} ${producto ? "·" : "/"} ${v}) = ${l}(${u}) ${producto ? "+" : "−"} ${l}(${v}) ≈ ${numero(log(b, producto ? u * v : u / v))}`;
      }),
    linea("Cambio de base", "log<sub>b</sub>(x) = ln(x)/ln(b)", "Puedes usar logaritmos en otra base siempre que sea la misma arriba y abajo. ln es el logaritmo de base e.",
      [["ln(x)", "Logaritmo natural del argumento"], ["ln(b)", "Logaritmo natural de la base"]],
      [bases, entero("x", "Argumento x", 8, 1, 20)], ({ b, x }) =>
        `log<sub>${numero(Number(b))}</sub>(${x}) = ln(${x})/ln(${numero(Number(b))}) ≈ ${numero(log(b, x))}`),
  ];

  const polis = [
    linea("Cuadrado de una suma", "(a + b)² = a² + 2ab + b²", "Multiplica dos veces el mismo paréntesis. Hay dos productos cruzados iguales.",
      [["a² y b²", "Cuadrados de cada término"], ["2ab", "Suma de los dos productos cruzados"]],
      [entero("a", "Valor de a", 4, -5, 8), entero("b", "Valor de b", 2, -5, 8)],
      ({ a, b }) => `(${numero(a + b)})² = ${a ** 2} + (${numero(2 * a * b)}) + ${b ** 2} = ${(a + b) ** 2}`),
    linea("Cuadrado de una diferencia", "(a − b)² = a² − 2ab + b²", "Los dos términos cruzados tienen signo negativo. El cuadrado de −b vale b².",
      [["a² y b²", "Cuadrados de cada término"], ["−2ab", "Suma de los productos cruzados"]],
      [entero("a", "Valor de a", 5, -5, 8), entero("b", "Valor de b", 2, -5, 8)],
      ({ a, b }) => `(${numero(a - b)})² = ${a ** 2} − (${numero(2 * a * b)}) + ${b ** 2} = ${(a - b) ** 2}`),
    linea("Suma por diferencia", "(a + b)(a − b) = a² − b²", "Al multiplicar, ab y −ab se cancelan. La igualdad también permite factorizar una diferencia de cuadrados.",
      [["a + b", "Primer factor"], ["a − b", "Segundo factor"]],
      [entero("a", "Valor de a", 5, -5, 8), entero("b", "Valor de b", 2, -5, 8)],
      ({ a, b }) => `(${numero(a + b)}) · (${numero(a - b)}) = ${a ** 2} − ${b ** 2} = ${numero(a ** 2 - b ** 2)}`),
    linea("Dividendo, cociente y resto", "P(x) = D(x) · C(x) + R(x)", "Comprueba una división evaluando ambos lados. Cuando el resto es cero, el divisor es un factor.",
      [["P", "Dividendo x² + 3x + 4"], ["D", "Divisor x + 1"], ["C", "Cociente x + 2"], ["R", "Resto 2, de grado menor que el divisor"]],
      [entero("x", "Valor de x", 2, -5, 5)], ({ x }) => `P(${numero(x)}) = (${numero(x + 1)}) · (${numero(x + 2)}) + 2 = ${numero(x ** 2 + 3 * x + 4)}`),
    linea("Teorema del factor", "P(r) = 0 ⇔ (x − r) es factor", "Al sustituir x por r, el factor x − r vale cero. En el ejemplo hay otro factor, x + 1, que da otra raíz.",
      [["r", "Posible raíz"], ["x − r", "Factor asociado cuando P(r) = 0"]],
      [entero("r", "Valor de r", 2, -3, 4)], ({ r }) =>
        `P(${numero(r)}) = (${numero(r - 2)}) · (${numero(r + 1)}) = ${numero((r - 2) * (r + 1))}`),
    linea("Raíces de segundo grado", "x = (−b ± √(b² − 4ac)) / (2a)", "Para ax² + bx + c = 0 con a distinto de cero, calcula primero el discriminante Δ. Si es negativo, no hay raíces reales.",
      [["a, b y c", "Coeficientes de la ecuación"], ["Δ = b² − 4ac", "Discriminante"]],
      [entero("a", "Coeficiente a", 1, 1, 5), entero("b", "Coeficiente b", -3, -6, 6), entero("c", "Coeficiente c", 2, -6, 6)],
      ({ a, b, c }) => {
        const d = b ** 2 - 4 * a * c;
        if (d < 0) return `Δ = ${numero(d)}. No hay raíces reales.`;
        if (d === 0) return `Δ = 0. Raíz doble x = ${numero(-b / (2 * a))}.`;
        return `Δ = ${d}. Raíces x₁ ≈ ${numero((-b + Math.sqrt(d)) / (2 * a))} y x₂ ≈ ${numero((-b - Math.sqrt(d)) / (2 * a))}.`;
      }),
    linea("Operar con fracciones", "a/b + c/d = (ad + bc)/(bd)", "Para sumar o restar, busca un denominador común. Para multiplicar, multiplica numeradores y denominadores. Para dividir, invierte la segunda fracción y multiplícala. En fracciones algebraicas, factoriza y conserva las restricciones del dominio.",
      [["a y c", "Numeradores"], ["b y d", "Denominadores distintos de cero"]],
      [entero("a", "Numerador a", 1, 1, 5), entero("b", "Denominador b", 2, 1, 5), entero("c", "Numerador c", 3, 1, 5), entero("d", "Denominador d", 4, 1, 5),
        opciones("op", "Operación", [["suma", "Suma"], ["resta", "Resta"], ["producto", "Producto"], ["división", "División"]])],
      ({ a, b, c, d, op }) => {
        const operaciones = { suma: ["+", a * d + b * c, b * d], resta: ["−", a * d - b * c, b * d], producto: ["·", a * c, b * d], división: ["÷", a * d, b * c] };
        const [signo, n, den] = operaciones[op];
        return `${a}/${b} ${signo} ${c}/${d} = ${numero(n)}/${den} ≈ ${numero(n / den)}`;
      }),
  ];

  const temas = { probabilidad: casos, "numeros-reales": reales, polinomios: polis };
  const lista = document.querySelector("[data-formulario]");
  const dialogo = document.createElement("dialog");
  dialogo.className = "mate-dialogo";
  dialogo.setAttribute("aria-labelledby", "mate-formula-titulo");
  dialogo.innerHTML = `<div class="mate-dialogo-cabecera"><h2 id="mate-formula-titulo"></h2><form method="dialog"><button class="mate-boton" autofocus>Cerrar</button></form></div>
    <p class="mate-ecuacion"></p><p data-descripcion></p><dl></dl><h3>Prueba con tus valores</h3><div data-campos></div><output class="mate-formula-salida"></output>`;
  document.body.append(dialogo);
  lista.className = "mate-formula-lista";

  for (const formula of temas[document.body.dataset.tema]) {
    const boton = document.createElement("button");
    boton.className = "mate-formula";
    boton.type = "button";
    boton.setAttribute("aria-haspopup", "dialog");
    boton.innerHTML = `<span>${formula.nombre}</span><strong>${formula.expresion}</strong>`;
    boton.addEventListener("click", () => {
      dialogo.querySelector("h2").textContent = formula.nombre;
      dialogo.querySelector(".mate-ecuacion").innerHTML = formula.expresion;
      dialogo.querySelector("[data-descripcion]").textContent = formula.descripcion;
      dialogo.querySelector("dl").innerHTML = formula.terminos.map(([simbolo, nombre]) => `<dt>${simbolo}</dt><dd>${nombre}</dd>`).join("");
      const campos = dialogo.querySelector("[data-campos]");
      const salida = dialogo.querySelector(".mate-formula-salida");
      campos.replaceChildren();
      controles(campos, formula.campos, (valores, elementos) => { salida.innerHTML = formula.calcular(valores, elementos); });
      dialogo.showModal();
    });
    lista.append(boton);
  }
})();
