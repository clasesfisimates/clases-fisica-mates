(() => {
  const { g, colores, numero, lienzo, linea, flecha, texto, salida, mostrarRangos, crearReloj } = window.LabDinamica;
  const alturaInicial = 10;
  const comparar = document.getElementById("comparar");
  const masaA = document.getElementById("masa");
  const masaB = document.getElementById("masa-b");
  const masaMaxima = Number(masaA.max);
  const gravedadPersonalizada = document.getElementById("gravedad");
  const ritmo = document.getElementById("ritmo");
  const elementosComparacion = document.querySelectorAll("[data-comparacion]");
  const reducirMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)");

  const mundos = [
    {
      id: "tierra", gravedad: g, cielo: "#174181", horizonte: "#2788a5", luz: "#7bf6e9",
      lejano: "#327c98", cercano: "#1b566f", terreno: "#144f60", profundidad: "#102e45",
    },
    {
      id: "luna", gravedad: 1.6, cielo: "#382b59", horizonte: "#885d75", luz: "#ffd0a4",
      lejano: "#8c6780", cercano: "#614b70", terreno: "#56425f", profundidad: "#2d2943",
    },
    {
      id: "personalizado", cielo: "#54288a", horizonte: "#9944b6", luz: "#efacff",
      lejano: "#963fc1", cercano: "#71359c", terreno: "#633597", profundidad: "#33215f",
    },
  ].map((mundo) => {
    const canvas = document.getElementById(mundo.id);
    return { ...mundo, tarjeta: canvas.closest(".mundo"), pintar: lienzo(canvas, dibujar) };
  });

  let ensayo;

  function dibujarCielo(ctx, ancho, suelo, mundo) {
    const fondo = ctx.createLinearGradient(0, 0, 0, suelo);
    fondo.addColorStop(0, "#0b1532");
    fondo.addColorStop(0.65, mundo.cielo);
    fondo.addColorStop(1, mundo.horizonte);
    ctx.fillStyle = fondo;
    ctx.fillRect(0, 0, ancho, suelo);
    const halo = ctx.createRadialGradient(ancho * 0.7, suelo * 0.84, 0, ancho * 0.7, suelo * 0.84, ancho * 0.56);
    halo.addColorStop(0, mundo.luz + "42");
    halo.addColorStop(1, mundo.luz + "00");
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, ancho, suelo);

    const estrellas = [[0.08, 0.16], [0.14, 0.55], [0.24, 0.32], [0.37, 0.12], [0.42, 0.43], [0.53, 0.27], [0.61, 0.53], [0.68, 0.16], [0.82, 0.31], [0.91, 0.09], [0.95, 0.66]];
    for (const [indice, [x, y]] of estrellas.entries()) {
      ctx.fillStyle = indice % 3 === 0 ? "#e9f6ffc9" : "#cfe7ff78";
      const tamano = indice % 3 === 0 ? 2 : 1;
      ctx.fillRect(x * ancho, y * suelo, tamano, tamano);
    }
  }

  function perfilTerreno(ctx, ancho, suelo, altura, picos, color) {
    ctx.beginPath();
    ctx.moveTo(0, suelo);
    for (const [x, y] of picos) ctx.lineTo(ancho * x, suelo - altura * y);
    ctx.lineTo(ancho, suelo);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  function dibujarTerreno(ctx, ancho, alto, suelo, mundo) {
    perfilTerreno(ctx, ancho, suelo, suelo * 0.36, [[0, 0.2], [0.13, 0.58], [0.27, 0.31], [0.52, 1], [0.72, 0.43], [0.91, 0.69], [1, 0.36]], mundo.lejano);
    perfilTerreno(ctx, ancho, suelo, suelo * 0.25, [[0, 0.45], [0.2, 0.93], [0.41, 0.48], [0.56, 0.63], [0.77, 0.19], [1, 0.67]], mundo.cercano);

    const fondo = ctx.createLinearGradient(0, suelo, 0, alto);
    fondo.addColorStop(0, mundo.terreno);
    fondo.addColorStop(1, mundo.profundidad);
    ctx.fillStyle = fondo;
    ctx.fillRect(0, suelo, ancho, alto - suelo);
    for (let y = suelo + 14; y < alto; y += 15) linea(ctx, 0, y, ancho, y, mundo.luz + "17");
    linea(ctx, 0, suelo, ancho, suelo, mundo.luz, 1.4);
  }

  function dibujarCapsula(ctx, x, y, ancho, alto, ficha, peso) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x - ancho / 2, y - alto / 2, ancho, alto, Math.min(5, ancho * 0.23));
    const esmalte = ctx.createLinearGradient(x, y - alto / 2, x, y + alto / 2);
    esmalte.addColorStop(0, ficha.luz);
    esmalte.addColorStop(1, ficha.fondo);
    ctx.fillStyle = esmalte;
    ctx.fill();
    ctx.strokeStyle = ficha.borde;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.fillStyle = "#f4faff";
    ctx.font = "700 " + Math.min(14, ancho * 0.62) + "px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(ficha.letra, x, y + 1);
    ctx.restore();
    flecha(ctx, x, y + alto / 2, 0, peso * 0.02, colores.peso);
  }

  function dibujar(ctx, ancho, alto, { mundo, gravedad, altura, tiempo, capsulas }) {
    const suelo = alto * 0.62;
    const centroX = ancho / 2;
    const anchoMaximo = Math.min(44, ancho * 0.33);
    const carrera = suelo - Math.max(40, anchoMaximo + 5);
    const separacion = Math.min(ancho * 0.22, 43);
    dibujarCielo(ctx, ancho, suelo, mundo);
    dibujarTerreno(ctx, ancho, alto, suelo, mundo);

    if (ancho >= 175) {
      for (const nivel of [0, 5, 10]) texto(ctx, nivel + " m", 8, suelo - nivel / alturaInicial * carrera);
    }

    for (const [indice, capsula] of capsulas.entries()) {
      const anchoCapsula = anchoMaximo * Math.cbrt(capsula.masa / masaMaxima);
      const altoCapsula = anchoCapsula * 0.82;
      const x = centroX + (capsulas.length === 1 ? 0 : (2 * indice - 1) * separacion);
      const y = suelo - altoCapsula / 2 - altura / alturaInicial * carrera;
      ctx.save();
      ctx.setLineDash([3, 5]);
      linea(ctx, x, suelo - carrera, x, suelo, "#e7efff72");
      ctx.restore();
      if (tiempo > 0 && altura > 0 && !reducirMovimiento.matches) {
        const cola = Math.min(gravedad * tiempo * 2.2, 33);
        const estela = ctx.createLinearGradient(0, y - altoCapsula / 2 - cola, 0, y - altoCapsula / 2);
        estela.addColorStop(0, capsula.borde + "00");
        estela.addColorStop(1, capsula.borde + "86");
        ctx.fillStyle = estela;
        ctx.fillRect(x - anchoCapsula * 0.18, y - altoCapsula / 2 - cola, anchoCapsula * 0.36, cola);
      }
      dibujarCapsula(ctx, x, y, anchoCapsula, altoCapsula, capsula, capsula.masa * gravedad);
    }
  }

  const reloj = crearReloj((tiempo) => {
    for (const mundo of ensayo.mundos) {
      const tiempoDeCaida = Math.min(tiempo, mundo.duracion);
      const altura = tiempo >= mundo.duracion ? 0 : alturaInicial - mundo.gravedad * tiempoDeCaida ** 2 / 2;
      const estado = altura === 0 ? "suelo" : tiempo > 0 ? "aire" : "listo";
      if (mundo.tarjeta.dataset.estado !== estado) mundo.tarjeta.dataset.estado = estado;
      mundo.pintar({ mundo, gravedad: mundo.gravedad, altura, tiempo: tiempoDeCaida, capsulas: ensayo.capsulas });
      salida("altura-" + mundo.id, numero(altura) + " m");
      salida("tiempo-" + mundo.id, numero(tiempoDeCaida) + " s");
    }
  }, "Soltar", "Volver a soltar", () => ritmo.valueAsNumber);

  function preparar() {
    const doble = comparar.checked;
    const gravedad = gravedadPersonalizada.valueAsNumber;
    const capsulas = [{ letra: "A", masa: masaA.valueAsNumber, luz: "#489cf4", fondo: "#204caa", borde: "#c1e7ff" }];
    if (doble) capsulas.push({ letra: "B", masa: masaB.valueAsNumber, luz: "#25bfa4", fondo: "#126b69", borde: "#bcffdf" });

    ensayo = {
      capsulas,
      mundos: mundos.map((mundo) => {
        const valor = mundo.gravedad ?? gravedad;
        return { ...mundo, gravedad: valor, duracion: Math.sqrt(2 * alturaInicial / valor) };
      }),
    };

    for (const elemento of elementosComparacion) elemento.hidden = !doble;
    salida("gravedad-personalizado", numero(gravedad) + " m/s²");
    for (const mundo of ensayo.mundos) {
      salida("peso-" + mundo.id, numero(masaA.valueAsNumber * mundo.gravedad) + " N");
      salida("peso-b-" + mundo.id, numero(masaB.valueAsNumber * mundo.gravedad) + " N");
    }

    reloj.preparar(
      Math.max(...ensayo.mundos.map((mundo) => mundo.duracion)),
      doble ? "A y B están listas a 10 m en los tres mundos." : "La cápsula A está lista a 10 m en los tres mundos.",
      doble ? "A y B han llegado juntas en cada mundo." : "La cápsula A ha llegado al suelo en los tres mundos.",
    );
  }

  ritmo.addEventListener("input", () => salida("ritmo-valor", numero(ritmo.valueAsNumber) + "×"));
  mostrarRangos(document.getElementById("controles"), preparar);
  preparar();
})();
