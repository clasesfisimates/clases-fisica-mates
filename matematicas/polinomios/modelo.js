(() => {
  const limpiar = (coeficientes) => {
    const copia = coeficientes.slice();
    while (copia.length > 1 && copia.at(-1) === 0) copia.pop();
    return copia.length ? copia : [0];
  };
  const evaluar = (coeficientes, x) => coeficientes.reduceRight((valor, coeficiente) => valor * x + coeficiente, 0);
  const normalizar = (coeficientes) => {
    const escala = coeficientes.reduce((maximo, c) => Math.max(maximo, Math.abs(c)), 0) || 1;
    return coeficientes.map((c) => c / escala);
  };

  function interpretar(texto) {
    const superindices = "⁰¹²³⁴⁵⁶⁷⁸⁹";
    const expresion = texto.toLowerCase().replace(/x([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g, (_, potencia) =>
      "x^" + [...potencia].map((c) => superindices.indexOf(c)).join(""))
      .replace(/[−–]/g, "-").replace(/[·×]/g, "*").replace(/,/g, ".").replace(/\s/g, "");
    const numero = "(?:\\d+(?:\\.\\d*)?|\\.\\d+)(?:e[+-]?\\d+)?";
    const termino = new RegExp(`([+-]?)(?:(${numero})\\*?x(?:\\^(\\d+))?|x(?:\\^(\\d+))?|(${numero}))`, "y");
    const coeficientes = [0];
    let posicion = 0;
    if (!expresion) throw new Error("Escribe un polinomio, por ejemplo x^3 − 3x^2 − 4x + 12.");
    while (posicion < expresion.length) {
      termino.lastIndex = posicion;
      const parte = termino.exec(expresion);
      if (!parte || (posicion > 0 && !parte[1])) throw new Error("Usa sumas de términos como 2x^4, −3x y 5. Los exponentes deben ser enteros no negativos.");
      const grado = parte[5] !== undefined ? 0 : Number(parte[3] ?? parte[4] ?? 1);
      const valor = Number(parte[2] ?? parte[5] ?? 1) * (parte[1] === "-" ? -1 : 1);
      if (!Number.isSafeInteger(grado) || grado < 0 || !Number.isFinite(valor)) throw new Error("Revisa el exponente y los coeficientes: deben ser números finitos.");
      while (coeficientes.length <= grado) coeficientes.push(0);
      coeficientes[grado] += valor;
      if (!Number.isFinite(coeficientes[grado])) throw new Error("La suma de coeficientes es demasiado grande. Reduce su magnitud.");
      posicion = termino.lastIndex;
    }
    return limpiar(coeficientes);
  }

  // Evalúa P(x) y su escala sin calcular x^n cuando |x| es grande.
  function medida(coeficientes, x) {
    if (Math.abs(x) <= 1) {
      return { valor: evaluar(coeficientes, x), escala: evaluar(coeficientes.map(Math.abs), Math.abs(x)) };
    }
    let valor = 0, escala = 0;
    const inverso = 1 / x;
    for (const c of coeficientes) {
      valor = valor * inverso + c;
      escala = escala * Math.abs(inverso) + Math.abs(c);
    }
    if (x < 0 && (coeficientes.length - 1) % 2) valor = -valor;
    return { valor, escala };
  }
  const esCero = ({ valor, escala }) => Math.abs(valor) <= 2e-12 * Math.max(escala, Number.MIN_VALUE);

  function raicesReales(entrada) {
    const coeficientes = limpiar(entrada);
    const grado = coeficientes.length - 1;
    if (grado === 0) return [];
    const principal = Math.abs(coeficientes[grado]);
    let logCota = -Infinity;
    coeficientes.slice(0, -1).forEach((c, i) => {
      if (c) logCota = Math.max(logCota, (Math.log(Math.abs(c)) - Math.log(principal)) / (grado - i));
    });
    const cota = Math.max(1, 2 * Math.exp(logCota));
    if (!Number.isFinite(cota)) throw new Error("La escala de las raíces supera la precisión disponible. Reduce la diferencia entre los coeficientes.");
    const niveles = [normalizar(coeficientes)];
    while (niveles.at(-1).length > 2) {
      niveles.push(normalizar(niveles.at(-1).slice(1).map((c, i) => c * (i + 1))));
    }
    let raices = [-niveles.at(-1)[0] / niveles.at(-1)[1]].filter((r) => Math.abs(r) <= cota);
    for (let nivel = niveles.length - 2; nivel >= 0; nivel--) {
      const actual = niveles[nivel];
      const limites = [-cota, ...raices.filter((r) => r > -cota && r < cota), cota];
      const encontradas = limites.filter((x) => esCero(medida(actual, x)));
      for (let i = 0; i < limites.length - 1; i++) {
        let izquierda = limites[i], derecha = limites[i + 1];
        let signo = Math.sign(medida(actual, izquierda).valor);
        if (esCero(medida(actual, izquierda)) || esCero(medida(actual, derecha)) || signo === Math.sign(medida(actual, derecha).valor)) continue;
        for (let intento = 0; intento < 100; intento++) {
          const centro = izquierda + (derecha - izquierda) / 2;
          const valor = medida(actual, centro).valor;
          if (valor === 0) { izquierda = derecha = centro; break; }
          if (Math.sign(valor) === signo) izquierda = centro;
          else derecha = centro;
          if (derecha - izquierda < 2e-12 * Math.max(1, Math.abs(centro))) break;
        }
        encontradas.push(izquierda + (derecha - izquierda) / 2);
      }
      raices = encontradas.sort((a, b) => a - b).filter((r, i, todas) => !i || Math.abs(r - todas[i - 1]) > 1e-8 * Math.max(1, Math.abs(r)));
    }
    return raices.map((r) => Math.abs(r - Math.round(r)) < 1e-9 ? (Math.round(r) || 0) : r);
  }

  function dividirPorRaiz(coeficientes, raiz) {
    const cociente = Array(coeficientes.length - 1);
    cociente[cociente.length - 1] = coeficientes.at(-1);
    for (let i = cociente.length - 2; i >= 0; i--) cociente[i] = coeficientes[i + 1] + raiz * cociente[i + 1];
    return { cociente, resto: coeficientes[0] + raiz * cociente[0] };
  }

  function factorizar(entrada) {
    let cociente = limpiar(entrada);
    const raices = [];
    for (const valor of raicesReales(cociente)) {
      let multiplicidad = 0;
      while (cociente.length > 1) {
        const { valor: residuo, escala } = medida(normalizar(cociente), valor);
        if (Math.abs(residuo) > 2e-8 * Math.max(escala, Number.MIN_VALUE)) break;
        cociente = dividirPorRaiz(cociente, valor).cociente;
        multiplicidad++;
      }
      if (multiplicidad) raices.push({ valor, multiplicidad });
    }
    return { raices, cociente: limpiar(cociente) };
  }

  const modelo = { limpiar, evaluar, interpretar, raicesReales, dividirPorRaiz, factorizar };
  if (typeof module === "object" && module.exports) module.exports = modelo;
  else window.ModeloPolinomios = modelo;
})();
