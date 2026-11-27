(function (raiz) {
  "use strict";
  const g = 9.8;
  const alturaInicial = 0.008;
  const frecuencia = 50;
  const duracionCaida = 1.8;
  const duracionContacto = 3.2;
  const duracion = duracionCaida + duracionContacto + 1.6;
  const caidaFisica = Math.sqrt(2 * alturaInicial / g);
  const velocidadContacto = g * caidaFisica;
  const compresionEquilibrio = g / frecuencia ** 2;

  // Compresión y velocidad positivas hacia abajo; resultante y aceleración
  // positivas hacia arriba, como en el diagrama. Suelo como resorte y amortiguador
  // críticamente amortiguado: m*q'' = m*g - (k*q + c*q').
  // k/m y c/m constantes permiten comparar masas con la misma trayectoria.
  // El tiempo de cada tramo se amplía para poder observarlo.
  function calcular(masa, tiempo, sinSuelo = false) {
    const peso = masa * g;
    if (sinSuelo) {
      const t = Math.max(0, tiempo) * 0.18;
      return { fase: 3, peso, normal: 0, resultante: -peso, aceleracion: -g,
        altura: -g * t * t / 2, compresion: 0, velocidad: g * t };
    }
    if (tiempo < duracionCaida) {
      const t = Math.max(0, tiempo) / duracionCaida * caidaFisica;
      return { fase: 0, peso, normal: 0, resultante: -peso, aceleracion: -g,
        altura: alturaInicial - g * t * t / 2, compresion: 0, velocidad: g * t };
    }
    if (tiempo < duracionCaida + duracionContacto) {
      const t = (tiempo - duracionCaida) / duracionContacto * 0.26;
      const a = -compresionEquilibrio;
      const b = velocidadContacto - frecuencia * compresionEquilibrio;
      const exponencial = Math.exp(-frecuencia * t);
      const compresion = compresionEquilibrio + (a + b * t) * exponencial;
      const velocidad = (b - frecuencia * (a + b * t)) * exponencial;
      const normal = Math.max(0, masa * (frecuencia ** 2 * compresion + 2 * frecuencia * velocidad));
      return { fase: 1, peso, normal, resultante: normal - peso,
        aceleracion: (normal - peso) / masa, altura: 0, compresion, velocidad };
    }
    return { fase: 2, peso, normal: peso, resultante: 0, aceleracion: 0,
      altura: 0, compresion: compresionEquilibrio, velocidad: 0 };
  }

  const modelo = { calcular, g, alturaInicial, compresionEquilibrio, duracionCaida, duracionContacto, duracion };
  if (typeof module !== "undefined" && module.exports) module.exports = modelo;
  else raiz.ModeloNormal = modelo;
})(typeof window !== "undefined" ? window : globalThis);
