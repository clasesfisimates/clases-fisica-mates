(() => {
  const { numero, boton, pizarra, grafica, resultados } = window.Mate;
  const { interpretar, limpiar, evaluar, factorizar } = window.ModeloPolinomios;
  const nodo = document.querySelector('[data-simulacion="raices"]');
  let coeficientes = [12, -4, -3, 1];
  let analisis;
  let pendiente;
  const textoPolinomio = (valores, html = true) => {
    const terminos = [];
    for (let i = valores.length - 1; i >= 0; i--) {
      const valor = valores[i];
      if (!valor) continue;
      const potencia = i > 1 ? html ? `x<sup>${i}</sup>` : `x^${i}` : i === 1 ? "x" : "";
      const magnitud = Math.abs(valor) === 1 && i ? "" : html ? numero(Math.abs(valor)) : String(Math.abs(valor));
      terminos.push(`${valor < 0 ? (html ? '−' : '-') : terminos.length ? '+' : ''}${magnitud}${potencia}`);
    }
    return terminos.join(" ") || "0";
  };
  nodo.innerHTML = `<form class="poli-editor-form">
      <label class="mate-control"><span>Polinomio P(x)</span><input type="text" data-polinomio spellcheck="false" autocomplete="off" value="x^3 - 3x^2 - 4x + 12" aria-describedby="poli-formato"></label>
      <button type="submit" class="mate-boton">Representar polinomio</button>
    </form><p class="poli-ayuda" id="poli-formato">Escribe, por ejemplo, 2x^5 − 3x^2 + x − 7. Puedes usar decimales y dejar sin escribir los términos que valen cero.</p>
    <div class="mate-controles poli-grado-controles"><label class="mate-control"><span>Grado que quieres editar</span><input type="number" min="0" step="1" value="3" data-grado></label>${boton('Crear coeficientes', 'data-crear-grado')}</div>
    <div class="poli-coeficientes" role="group" aria-label="Coeficientes del polinomio"></div>
    <p class="poli-editor-estado" role="status"></p>
    <div class="mate-controles poli-ventana">
      <label class="mate-control"><span>Desde x</span><input type="number" value="-5" step="any" data-min-x></label>
      <label class="mate-control"><span>Hasta x</span><input type="number" value="5" step="any" data-max-x></label>
      <label class="mate-control"><span>Desde y</span><input type="number" value="-20" step="any" data-min-y></label>
      <label class="mate-control"><span>Hasta y</span><input type="number" value="20" step="any" data-max-y></label>
      ${boton('Encuadrar raíces en X', 'data-encuadrar')}
    </div><p class="poli-ayuda">Los límites de X e Y se mantienen al cambiar el polinomio. Ajústalos manualmente para ampliar o reducir la vista.</p>
    <p class="poli-editor-estado" data-ventana-estado role="status" hidden></p>
    ${pizarra('<div class="poli-polinomio-actual mate-ecuacion"></div><canvas class="mate-grafica" role="img"></canvas><div data-raices-resultados></div><figcaption data-raices-nota></figcaption>')}`;
  const dibujar = grafica(nodo.querySelector("canvas"));
  const estado = nodo.querySelector(".poli-editor-estado");
  const campoTexto = nodo.querySelector("[data-polinomio]");

  function campos() {
    nodo.querySelector("[data-grado]").value = coeficientes.length - 1;
    nodo.querySelector(".poli-coeficientes").innerHTML = coeficientes.map((valor, grado) =>
      `<label class="mate-control"><span>${grado === 0 ? 'Término independiente' : `Coeficiente de x${grado > 1 ? `<sup>${grado}</sup>` : ''}`}</span><input type="number" step="any" value="${valor}" data-coeficiente="${grado}" aria-label="${grado === 0 ? 'Término independiente' : `Coeficiente de x elevado a ${grado}`}"></label>`).reverse().join("");
  }
  function pintarGrafica() {
    const minX = nodo.querySelector("[data-min-x]").valueAsNumber;
    const maxX = nodo.querySelector("[data-max-x]").valueAsNumber;
    const minY = nodo.querySelector("[data-min-y]").valueAsNumber;
    const maxY = nodo.querySelector("[data-max-y]").valueAsNumber;
    const aviso = nodo.querySelector("[data-ventana-estado]");
    const error = !Number.isFinite(minX) || !Number.isFinite(maxX) || minX >= maxX
      ? "El límite izquierdo de X debe ser menor que el derecho."
      : !Number.isFinite(minY) || !Number.isFinite(maxY) || minY >= maxY
        ? "El límite inferior de Y debe ser menor que el superior." : "";
    aviso.textContent = error;
    aviso.hidden = !error;
    if (error) {
      return;
    }
    const actual = limpiar(coeficientes);
    const marcasX = Array.from({ length: 5 }, (_, i) => minX + (maxX - minX) * i / 4);
    dibujar({ minX, maxX, minY, maxY, marcasX,
      marcasY: Array.from({ length: 5 }, (_, i) => minY + (maxY - minY) * i / 4),
      calcular: (x) => evaluar(actual, x), puntos: (analisis?.raices || []).filter(({ valor }) => valor >= minX && valor <= maxX && minY <= 0 && maxY >= 0).map(({ valor }) => [valor, 0]),
      descripcion: `Gráfica de P(x) = ${textoPolinomio(actual, false)}. Límites de x: ${numero(minX)} a ${numero(maxX)}; límites de y: ${numero(minY)} a ${numero(maxY)}. Las raíces reales visibles están marcadas sobre el eje x.`,
    });
  }
  function actualizar() {
    clearTimeout(pendiente);
    const actual = limpiar(coeficientes);
    campoTexto.value = textoPolinomio(actual, false);
    nodo.querySelector(".poli-polinomio-actual").innerHTML = `P(x) = ${textoPolinomio(actual)}`;
    try {
      analisis = factorizar(actual);
      const cero = actual.length === 1 && actual[0] === 0;
      const grado = actual.length - 1;
      estado.textContent = cero ? "Polinomio nulo: todos los números reales son raíces."
        : `Grado efectivo: ${grado}.${grado < coeficientes.length - 1 ? ' Los coeficientes principales iguales a cero no cuentan para el grado.' : ''}`;
      const lista = analisis.raices.map(({ valor, multiplicidad }) => `r ≈ ${numero(valor)}${multiplicidad > 1 ? ` (multiplicidad ${multiplicidad})` : ''}`).join(" · ");
      const factores = analisis.raices.map(({ valor, multiplicidad }) => `<span class="poli-factor">(x ${valor < 0 ? '+' : '−'} ${numero(Math.abs(valor))})${multiplicidad > 1 ? `<sup>${multiplicidad}</sup>` : ''}</span>`);
      if (analisis.cociente.length > 1) factores.push(`<span class="poli-factor">(${textoPolinomio(analisis.cociente)})</span>`);
      else if (analisis.cociente[0] !== 1 || !factores.length) factores.unshift(numero(analisis.cociente[0]));
      nodo.querySelector("[data-raices-resultados]").innerHTML = resultados([
        ["Raíces reales aproximadas", cero ? "Todos los números reales" : lista || "No tiene raíces reales"],
        ["Factorización a partir de las raíces reales", `P(x) ${analisis.raices.length ? '≈' : '='} ${factores.join(' · ')}`],
      ]);
      const totalMultiplicidades = analisis.raices.reduce((total, r) => total + r.multiplicidad, 0);
      nodo.querySelector("[data-raices-nota]").textContent = cero ? "La gráfica coincide con el eje x. No hay una lista finita de raíces."
        : actual.length === 1 ? "Una constante distinta de cero nunca corta el eje x."
          : `${analisis.raices.length ? 'Cada raíz r aporta un factor (x − r). La multiplicidad indica cuántas veces se repite.' : 'No aparecen factores lineales reales.'} ${totalMultiplicidades < grado ? 'El factor restante se conserva sin descomponer; puede tener raíces complejas.' : 'Se han extraído todos los factores lineales.'} Los cálculos son numéricos; los valores mostrados están redondeados.`;
      pintarGrafica();
    } catch (error) { estado.textContent = error.message; }
  }
  nodo.querySelector("form").addEventListener("submit", (evento) => {
    evento.preventDefault();
    try { coeficientes = interpretar(campoTexto.value); campos(); actualizar(); }
    catch (error) { estado.textContent = error.message; }
  });
  nodo.querySelector("[data-crear-grado]").addEventListener("click", () => {
    const grado = nodo.querySelector("[data-grado]").valueAsNumber;
    if (!Number.isSafeInteger(grado) || grado < 0) { estado.textContent = "El grado debe ser un entero no negativo."; return; }
    const anterior = coeficientes.length - 1;
    coeficientes = Array.from({ length: grado + 1 }, (_, i) => coeficientes[i] || 0);
    if (grado > anterior) coeficientes[grado] = 1;
    campos(); actualizar();
  });
  nodo.querySelector(".poli-coeficientes").addEventListener("input", (evento) => {
    if (!evento.target.matches('[data-coeficiente]')) return;
    const valor = evento.target.valueAsNumber;
    if (!Number.isFinite(valor)) { estado.textContent = "Completa el coeficiente con un número."; return; }
    coeficientes[Number(evento.target.dataset.coeficiente)] = valor;
    clearTimeout(pendiente);
    pendiente = setTimeout(actualizar, 140);
  });
  nodo.querySelectorAll('[data-min-x], [data-max-x], [data-min-y], [data-max-y]').forEach((entrada) => entrada.addEventListener("input", pintarGrafica));
  nodo.querySelector('[data-encuadrar]').addEventListener("click", () => {
    const valores = analisis?.raices.map(({ valor }) => valor) || [];
    if (!valores.length) { estado.textContent = "No hay raíces reales que encuadrar. Puedes ajustar la ventana con los límites de x."; return; }
    const minimo = Math.min(...valores), maximo = Math.max(...valores), margen = Math.max(1, (maximo - minimo) * .2);
    nodo.querySelector('[data-min-x]').value = minimo - margen;
    nodo.querySelector('[data-max-x]').value = maximo + margen;
    pintarGrafica();
  });
  campos(); actualizar();
})();
