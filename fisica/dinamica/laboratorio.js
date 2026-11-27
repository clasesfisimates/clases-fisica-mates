(() => {
  const g = 9.8;
  const colores = { peso: "#ffba80", normal: "#94caff", aplicada: "#8be9cc", roce: "#e5abff" };
  const superficies = {
    ninguna: { estatico: 0, dinamico: 0 },
    suave: { estatico: 0.15, dinamico: 0.1 },
    rugosa: { estatico: 0.3, dinamico: 0.2 },
    muyRugosa: { estatico: 0.55, dinamico: 0.4 },
  };
  const formatos = new Map([0, 1, 2].map((decimales) => [decimales, new Intl.NumberFormat("es-ES", { maximumFractionDigits: decimales })]));

  function numero(valor, decimales = 2) {
    const precision = 10 ** decimales;
    const redondeado = Math.round(Math.abs(valor) * precision) / precision;
    return (valor < 0 && redondeado > 0 ? "−" : "") + formatos.get(decimales).format(redondeado);
  }

  function resolverFuerzas(empuje, normal, masa, superficie) {
    const limite = superficie.estatico * normal;
    const seMueve = Math.abs(empuje) > limite + 1e-9;
    const rozamiento = seMueve ? -Math.sign(empuje) * superficie.dinamico * normal : -empuje;
    const resultante = seMueve ? empuje + rozamiento : 0;
    return { limite, seMueve, rozamiento, resultante, aceleracion: resultante / masa };
  }

  function lienzo(canvas, dibujar) {
    const ctx = canvas.getContext("2d");
    let datos;
    function pintar() {
      if (!datos || !ctx) return;
      const ancho = canvas.clientWidth;
      const alto = canvas.clientHeight;
      const escala = Math.min(window.devicePixelRatio || 1, 2);
      const pixelesX = Math.round(ancho * escala);
      const pixelesY = Math.round(alto * escala);
      if (canvas.width !== pixelesX) canvas.width = pixelesX;
      if (canvas.height !== pixelesY) canvas.height = pixelesY;
      ctx.setTransform(escala, 0, 0, escala, 0, 0);
      ctx.clearRect(0, 0, ancho, alto);
      dibujar(ctx, ancho, alto, datos);
    }
    new ResizeObserver(pintar).observe(canvas);
    return (nuevosDatos) => { datos = nuevosDatos; pintar(); };
  }

  function linea(ctx, x1, y1, x2, y2, color, grosor = 1) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.lineWidth = grosor;
    ctx.stroke();
  }

  function flecha(ctx, x, y, dx, dy, color, discontinua = false, grosor = discontinua ? 1.8 : 3) {
    const longitud = Math.hypot(dx, dy);
    if (longitud < 0.7) return;
    const punta = Math.min(9, longitud * 0.65);
    const ux = dx / longitud;
    const uy = dy / longitud;
    const baseX = x + dx - punta * ux;
    const baseY = y + dy - punta * uy;
    ctx.save();
    if (discontinua) ctx.setLineDash([4, 4]);
    linea(ctx, x, y, baseX + ux, baseY + uy, color, grosor);
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(x + dx, y + dy);
    ctx.lineTo(baseX - uy * punta * 0.52, baseY + ux * punta * 0.52);
    ctx.lineTo(baseX + uy * punta * 0.52, baseY - ux * punta * 0.52);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }

  function rejilla(ctx, ancho, alto) {
    const fondo = ctx.createLinearGradient(0, 0, 0, alto);
    fondo.addColorStop(0, "#102b32");
    fondo.addColorStop(1, "#23454a");
    ctx.fillStyle = fondo;
    ctx.fillRect(0, 0, ancho, alto);
    for (let x = 0; x < ancho; x += 24) linea(ctx, x, 0, x, alto, x % 96 === 0 ? "#a7d2c33b" : "#a7d2c31c");
    for (let y = 0; y < alto; y += 24) linea(ctx, 0, y, ancho, y, y % 96 === 0 ? "#a7d2c33b" : "#a7d2c31c");
  }

  function bloque(ctx, x, y, ancho, alto, angulo = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angulo);
    ctx.beginPath();
    ctx.roundRect(-ancho / 2, -alto / 2, ancho, alto, 6);
    const color = ctx.createLinearGradient(0, -alto / 2, 0, alto / 2);
    color.addColorStop(0, "#467676");
    color.addColorStop(.3, "#34575d");
    color.addColorStop(1, "#233e48");
    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#cdc8ac";
    ctx.stroke();
    linea(ctx, -ancho / 2 + 5, -alto / 2 + 4, ancho / 2 - 5, -alto / 2 + 4, "#c8daca99");
    linea(ctx, -ancho / 2 + 5, alto / 2 - 3, ancho / 2 - 5, alto / 2 - 3, "#0f293080");
    ctx.restore();
  }

  function texto(ctx, contenido, x, y) {
    ctx.fillStyle = "#cad9ef";
    ctx.font = "600 14px system-ui, sans-serif";
    ctx.fillText(contenido, x, y);
  }

  function salida(id, valor) { document.getElementById(id).textContent = valor; }

  function mostrarRangos(panel, actualizar) {
    panel.addEventListener("input", (evento) => {
      escribirRangos();
      actualizar(evento);
    });
    function escribirRangos() {
      for (const input of panel.querySelectorAll("[data-unidad]")) {
        salida(input.id + "-valor", numero(input.valueAsNumber) + input.dataset.unidad);
      }
    }
    escribirRangos();
  }

  function crearReloj(pintar, nombreInicial = "Iniciar", nombreFinal = "Repetir", leerRitmo = () => 0.5) {
    const boton = document.getElementById("reproducir");
    const estado = document.getElementById("estado");
    let cuadro;
    let ultimoInstante;
    let tiempo = 0;
    let limite = 0;
    let avisoInicial;
    let avisoFinal;

    function pausar() {
      cancelAnimationFrame(cuadro);
      cuadro = undefined;
      ultimoInstante = undefined;
    }

    function reiniciar() {
      pausar();
      tiempo = 0;
      boton.textContent = nombreInicial;
      estado.textContent = avisoInicial;
      pintar(tiempo);
    }

    function avanzar(ahora) {
      const transcurrido = ultimoInstante === undefined ? 0 : Math.min(ahora - ultimoInstante, 50);
      ultimoInstante = ahora;
      tiempo = Math.min(limite, tiempo + transcurrido / 1000 * leerRitmo());
      pintar(tiempo);
      if (tiempo < limite) {
        cuadro = requestAnimationFrame(avanzar);
      } else {
        pausar();
        boton.textContent = nombreFinal;
        estado.textContent = avisoFinal;
      }
    }

    boton.addEventListener("click", () => {
      if (cuadro !== undefined) {
        pausar();
        boton.textContent = "Continuar";
        estado.textContent = "En pausa.";
        return;
      }
      if (tiempo >= limite) reiniciar();
      boton.textContent = "Pausar";
      estado.textContent = "Simulación en marcha.";
      cuadro = requestAnimationFrame(avanzar);
    });
    document.getElementById("reiniciar").addEventListener("click", reiniciar);

    function preparar(duracion, mensajeInicial, mensajeFinal) {
      limite = duracion;
      avisoInicial = mensajeInicial;
      avisoFinal = mensajeFinal;
      reiniciar();
    }

    function irA(instante) {
      pausar();
      tiempo = Math.max(0, Math.min(limite, instante));
      boton.textContent = tiempo === 0 ? nombreInicial : tiempo === limite ? nombreFinal : "Continuar";
      estado.textContent = tiempo === 0 ? avisoInicial : tiempo === limite ? avisoFinal : "En pausa.";
      pintar(tiempo);
    }

    return { preparar, irA, redibujar: () => pintar(tiempo) };
  }

  function bancoDeFuerzas(calcular, dibujar, sentidoPositivo, sentidoNegativo) {
    const panel = document.getElementById("controles");
    const superficie = document.getElementById("superficie");
    const componentes = document.getElementById("componentes");
    const pintar = lienzo(document.getElementById("escena"), dibujar);
    let datos;
    const reloj = crearReloj((tiempo) => {
      const desplazamiento = datos.aceleracion * tiempo ** 2 / 2;
      pintar({ ...datos, desplazamiento, componentes: componentes.checked });
      salida("tiempo", numero(tiempo) + " s");
      salida("velocidad", numero(datos.aceleracion * tiempo) + " m/s");
      salida("distancia", numero(desplazamiento) + " m");
    });

    function actualizar() {
      const material = superficies[superficie.value];
      datos = calcular(material);
      const { aceleracion, seMueve, limite, rozamiento, peso, normal, resultante } = datos;
      salida("coeficientes", "Estático: " + numero(material.estatico) + " · dinámico: " + numero(material.dinamico));
      salida("peso", numero(peso) + " N");
      salida("normal", numero(normal) + " N");
      salida("rozamiento", numero(Math.abs(rozamiento)) + " N");
      salida("resultante", numero(resultante) + " N");
      salida("aceleracion", numero(aceleracion) + " m/s²");
      const sentido = aceleracion >= 0 ? sentidoPositivo : sentidoNegativo;
      let explicacion = "Arranca " + sentido + " porque la fuerza que intenta moverlo supera el límite del rozamiento estático (" + numero(limite) + " N).";
      if (!seMueve) {
        explicacion = rozamiento === 0
          ? "La fuerza resultante es cero. Como el bloque parte del reposo, sigue quieto."
          : "Sigue quieto. El rozamiento estático equilibra la fuerza que intenta moverlo y puede llegar hasta " + numero(limite) + " N.";
      }
      salida("explicacion", explicacion);
      const tiempoDeTramo = Math.sqrt(8 / Math.abs(aceleracion));
      reloj.preparar(
        seMueve ? Math.min(tiempoDeTramo, 4) : 2,
        "Listo para iniciar desde el reposo.",
        seMueve && tiempoDeTramo <= 4 ? "Fin del tramo de 4 m." : "Ensayo terminado.",
      );
    }

    // Mostrar componentes es un cambio de dibujo, no de condiciones físicas.
    mostrarRangos(panel, (evento) => {
      if (evento.target === componentes) reloj.redibujar();
      else actualizar();
    });
    actualizar();
  }

  window.LabDinamica = { g, colores, numero, superficies, resolverFuerzas, lienzo, linea, flecha, rejilla, bloque, texto, salida, mostrarRangos, crearReloj, bancoDeFuerzas };
})();
