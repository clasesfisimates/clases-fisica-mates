(() => {
  const gravedad = 9.8;
  const G = 6.6743e-11;

  function poleas({ m1, m2 }) {
    const a = gravedad * (m2 - m1) / (m1 + m2);
    return { m1, m2, a, tension: m1 * (gravedad + a), duracion: Math.min(2, Math.sqrt(2 / Math.abs(a))) };
  }

  function estadoPoleas(datos, progreso) {
    const t = datos.duracion * progreso;
    return { ...datos, t, distancia: datos.a * t * t / 2 };
  }

  function muelles({ k, fuerza: objetivo }) {
    return { k, objetivo, extensionFinal: objetivo / k };
  }

  function estadoMuelle(datos, progreso) {
    const fuerza = datos.objetivo * progreso;
    return { ...datos, fuerza, extension: fuerza / datos.k, t: 2 * progreso };
  }

  function fuerzasGravitatorias(m1, m2, distancia) {
    const fuerza = G * m1 * m2 / distancia ** 2;
    return { fuerza, a1: fuerza / m1, a2: fuerza / m2 };
  }

  function gravitacion({ m1, m2, distancia }) {
    // La separación adimensional comienza en 1. Velocity Verlet integra
    // d²r/du² = −1/r² con u = t √(G (m₁ + m₂) / r₀³).
    const masa1 = m1 * 1e12;
    const masa2 = m2 * 1e12;
    const r0 = distancia * 1000;
    const escalaTiempo = Math.sqrt(r0 ** 3 / (G * (masa1 + masa2)));
    const pasos = 180;
    const du = 0.7 / pasos;
    let r = 1;
    let v = 0;
    let a = -1;
    const separaciones = [r];
    for (let i = 0; i < pasos; i++) {
      r += v * du + a * du * du / 2;
      const siguienteA = -1 / r ** 2;
      v += (a + siguienteA) * du / 2;
      a = siguienteA;
      separaciones.push(r);
    }
    return { m1: masa1, m2: masa2, r0, separaciones, duracion: du * pasos * escalaTiempo };
  }

  function estadoGravedad(datos, progreso) {
    const paso = (datos.separaciones.length - 1) * progreso;
    const indice = Math.floor(paso);
    const actual = datos.separaciones[indice];
    const siguiente = datos.separaciones[indice + 1] ?? actual;
    const r = datos.r0 * (actual + (siguiente - actual) * (paso - indice));
    const total = datos.m1 + datos.m2;
    return {
      ...datos, r, t: datos.duracion * progreso,
      recorrido1: (datos.r0 - r) * datos.m2 / total,
      recorrido2: (datos.r0 - r) * datos.m1 / total,
      ...fuerzasGravitatorias(datos.m1, datos.m2, r),
    };
  }

  function curva({ masa, rapidez, radio, agarre }) {
    const v = rapidez / 3.6;
    const a = v ** 2 / radio;
    const necesaria = masa * a;
    const maxima = agarre * masa * gravedad;
    const gira = necesaria <= maxima + 1e-9;
    return {
      masa, v, radio, a, necesaria, maxima, gira,
      limite: 3.6 * Math.sqrt(agarre * gravedad * radio),
      duracion: (gira ? 1.5 * Math.PI * radio : 105) / v,
    };
  }

  function estadoCurva(datos, progreso) {
    const t = datos.duracion * progreso;
    return { ...datos, t, angulo: -Math.PI / 2 + datos.v * t / datos.radio, recorrido: datos.v * t };
  }

  function rebote({ masa, entrada, salida, contacto }) {
    const vf = -Math.min(entrada, salida);
    const impulso = masa * (vf - entrada);
    return { masa, entrada, vf, contacto, impulso, fuerza: impulso / contacto };
  }

  function estadoRebote(datos, progreso) {
    if (progreso < 0.3) {
      const t = 0.25 * progreso / 0.3;
      return { ...datos, t, fase: "Aproximación", v: datos.entrada, fuerzaActual: 0, separacion: datos.entrada * (0.25 - t), compresion: 0 };
    }
    if (progreso < 0.65) {
      const fraccion = (progreso - 0.3) / 0.35;
      return { ...datos, t: 0.25 + fraccion * datos.contacto, fase: "Contacto", v: datos.entrada + fraccion * (datos.vf - datos.entrada), fuerzaActual: datos.fuerza, separacion: 0, compresion: Math.sin(fraccion * Math.PI) };
    }
    const tSalida = 0.30 * (progreso - 0.65) / 0.35;
    return { ...datos, t: 0.25 + datos.contacto + tSalida, fase: datos.vf === 0 ? "Queda en la pared" : "Rebote", v: datos.vf, fuerzaActual: 0, separacion: -datos.vf * tSalida, compresion: 0 };
  }

  const modelos = { gravedad, G, poleas, estadoPoleas, muelles, estadoMuelle, fuerzasGravitatorias, gravitacion, estadoGravedad, curva, estadoCurva, rebote, estadoRebote };
  if (typeof module === "object") module.exports = modelos;
  else window.ModelosTallerDinamica = modelos;
})();
