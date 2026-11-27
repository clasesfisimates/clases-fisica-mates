(() => {
  const graficas = {
    seno: {
      titulo: "y = sen(x)",
      extremosX: [-0.45, 6.85], extremosY: [-1.45, 1.45], tramo: [0, 2 * Math.PI],
      valoresX: [[0, "0"], [Math.PI / 2, "π/2"], [Math.PI, "π"], [3 * Math.PI / 2, "3π/2"], [2 * Math.PI, "2π"]],
      valoresY: [-1, 1], puntos: [Math.PI / 2, 3 * Math.PI / 2], calcular: Math.sin,
      fondo: ["#111b42", "#26204d"], cuadricula: "#3b4c74", ejes: "#8298c5", tinta: "#e2ebff",
      curva: ["#81e8ff", "#c6b2ff", "#ffad9b"], punto: "#fff1e2",
    },
    cuadratica: {
      titulo: "y = x²",
      extremosX: [-2.45, 2.45], extremosY: [-0.6, 4.65], tramo: [-2.04, 2.04],
      valoresX: [[-2, "−2"], [-1, "−1"], [0, "0"], [1, "1"], [2, "2"]],
      valoresY: [1, 2, 3, 4], puntos: [-1, 0, 1, 2], calcular: (x) => x ** 2,
      fondo: ["#471a34", "#652641"], cuadricula: "#835263", ejes: "#c596a7", tinta: "#ffe8e2",
      curva: ["#ff8b91", "#ffae83", "#ffdeae"], punto: "#fff2de",
    },
  };

  function dibujar(lienzo, grafica) {
    const ctx = lienzo.getContext("2d");
    if (!ctx) return;

    const ancho = 500;
    const alto = 280;
    const izquierda = 48;
    const derecha = 451;
    const arriba = 51;
    const abajo = 240;
    const [minX, maxX] = grafica.extremosX;
    const [minY, maxY] = grafica.extremosY;
    const x = (valor) => izquierda + (valor - minX) / (maxX - minX) * (derecha - izquierda);
    const y = (valor) => abajo - (valor - minY) / (maxY - minY) * (abajo - arriba);
    const ejeX = x(0);
    const ejeY = y(0);
    ctx.scale(lienzo.width / ancho, lienzo.height / alto);

    function linea(x1, y1, x2, y2) {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    const fondo = ctx.createLinearGradient(0, 0, ancho, alto);
    fondo.addColorStop(0, grafica.fondo[0]);
    fondo.addColorStop(1, grafica.fondo[1]);
    ctx.fillStyle = fondo;
    ctx.fillRect(0, 0, ancho, alto);

    ctx.strokeStyle = grafica.cuadricula;
    for (const [valor] of grafica.valoresX) linea(x(valor), arriba, x(valor), abajo);
    for (const valor of grafica.valoresY) linea(izquierda, y(valor), derecha, y(valor));

    ctx.strokeStyle = grafica.ejes;
    linea(ejeX, arriba - 2, ejeX, abajo);
    linea(izquierda, ejeY, derecha + 6, ejeY);

    ctx.fillStyle = grafica.tinta;
    ctx.font = "14px system-ui, sans-serif";
    ctx.textAlign = "center";
    for (const [valor, etiqueta] of grafica.valoresX) ctx.fillText(etiqueta, x(valor), ejeY + 21);
    ctx.fillText("x", derecha + 15, ejeY + 4);
    ctx.textAlign = "right";
    for (const valor of grafica.valoresY) ctx.fillText(String(valor).replace("-", "−"), ejeX - 8, y(valor) + 5);
    ctx.fillText("y", ejeX - 8, arriba - 3);
    ctx.font = "650 18px system-ui, sans-serif";
    ctx.fillText(grafica.titulo, derecha, 33);

    const color = ctx.createLinearGradient(izquierda, 0, derecha, 0);
    grafica.curva.forEach((tono, indice) => color.addColorStop(indice / (grafica.curva.length - 1), tono));
    const [inicio, fin] = grafica.tramo;
    ctx.beginPath();
    ctx.moveTo(x(inicio), y(grafica.calcular(inicio)));
    for (let paso = 1; paso <= 200; paso++) {
      const valor = inicio + (fin - inicio) * paso / 200;
      ctx.lineTo(x(valor), y(grafica.calcular(valor)));
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 3.4;
    ctx.shadowColor = grafica.curva[1];
    ctx.shadowBlur = 9;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = grafica.punto;
    for (const valor of grafica.puntos) {
      ctx.beginPath();
      ctx.arc(x(valor), y(grafica.calcular(valor)), 4, 0, 2 * Math.PI);
      ctx.fill();
    }
  }

  for (const lienzo of document.querySelectorAll("[data-grafica]")) dibujar(lienzo, graficas[lienzo.dataset.grafica]);
})();
