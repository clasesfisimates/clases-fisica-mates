(function (raiz) {
  "use strict";
  const g = 9.8;
  const superficies = {
    ninguna: { estatico: 0, dinamico: 0 },
    suave: { estatico: 0.15, dinamico: 0.1 },
    rugosa: { estatico: 0.3, dinamico: 0.2 },
    muyRugosa: { estatico: 0.55, dinamico: 0.4 },
  };

  // + paralelo: derecha. + perpendicular: hacia fuera del plano.
  // Un ángulo positivo sube hacia la derecha; uno negativo baja hacia la derecha.
  // El ensayo siempre empieza desde el reposo, con condiciones constantes.
  function calcular({ masa, angulo, fuerza, beta = 0, sentido = 1, superficie }) {
    const theta = angulo * Math.PI / 180;
    const phi = beta * Math.PI / 180;
    const material = superficies[superficie];
    const peso = masa * g;
    const pesoParalelo = -peso * Math.sin(theta);
    const pesoPerpendicular = -peso * Math.cos(theta);
    const fuerzaParalela = sentido * fuerza * Math.cos(phi);
    const fuerzaPerpendicular = fuerza * Math.sin(phi);
    const apoyo = -pesoPerpendicular - fuerzaPerpendicular;
    const contacto = apoyo >= -1e-9;
    const normal = Math.max(0, apoyo);
    const motriz = fuerzaParalela + pesoParalelo;
    const limite = material.estatico * normal;
    const seMueve = contacto && Math.abs(motriz) > limite + 1e-9;
    const rozamiento = contacto
      ? (seMueve ? -Math.sign(motriz) * material.dinamico * normal : -motriz)
      : 0;
    const resultante = contacto ? (seMueve ? motriz + rozamiento : 0) : null;
    return {
      masa, angulo, fuerza, beta, sentido, theta, phi, material, peso,
      pesoParalelo, pesoPerpendicular, fuerzaParalela, fuerzaPerpendicular,
      normal, contacto, motriz, limite, rozamiento, resultante, seMueve,
      aceleracion: contacto ? resultante / masa : null,
    };
  }

  const modelo = { calcular, superficies, g };
  if (typeof module !== "undefined" && module.exports) module.exports = modelo;
  else raiz.ModeloPlanos = modelo;
})(typeof window !== "undefined" ? window : globalThis);
