(() => {
  "use strict";
  const { numero, salida, lienzo } = window.LabDinamica;
  const { calcular } = window.ModeloPlanos;
  const { dibujar } = window.EscenaPlanos;
  const $ = (id) => document.getElementById(id);
  const duraciones = [1.5, 5.2, 2.8, 2.6, 3.2, 1.8];
  const comienzos = duraciones.map((_, i) => duraciones.slice(0, i).reduce((a, b) => a + b, 0));
  const finSuma = duraciones.reduce((a, b) => a + b, 0);
  const botonesPasos = [...document.querySelectorAll("[data-paso]")];
  const reducida = window.matchMedia("(prefers-reduced-motion: reduce)");
  let datos, instante = 0, cuadro, anterior, ultimoPaso = -1, dialogoMostrado = false;
  let iniciado = false, terminado = false, enMarcha = false;

  function leer() {
    const angulo = $("angulo").valueAsNumber * ($("invertir-pendiente").checked ? -1 : 1);
    return calcular({ masa: $("masa").valueAsNumber, angulo,
      fuerza: $("fuerza").valueAsNumber, beta: $("beta").valueAsNumber,
      sentido: Number($("sentido").value), superficie: $("superficie").value });
  }
  function fase() {
    const indice = comienzos.findIndex((inicio, i) => instante < inicio + duraciones[i]);
    const paso = indice < 0 ? 5 : indice;
    return { paso, progreso: Math.min(1, (instante - comienzos[paso]) / duraciones[paso]) };
  }
  const n = (x) => numero(x);
  const suma = (valores) => valores.map((v, i) => (i > 0 && v >= 0 ? "+ " : "") + n(v)).join(" ") + " N";
  function direccion(valor) {
    const lado = valor > 0 ? "derecha" : "izquierda";
    if (datos.angulo === 0) return lado;
    return lado + (valor * datos.angulo > 0 ? " · cuesta arriba" : " · cuesta abajo");
  }
  function relatos() {
    const d = datos;
    const opuestas = d.fuerzaParalela * d.pesoParalelo < 0;
    const dosParalelas = d.fuerzaParalela !== 0 && d.pesoParalelo !== 0;
    const paralelo = opuestas
      ? "La componente del peso y el empuje apuntan en sentidos opuestos. Se cancela la parte que tienen en común."
      : dosParalelas
        ? "Las dos flechas apuntan en el mismo sentido y sus valores se suman. Conservamos el color de cada fuerza para seguirla."
        : "Miramos solo las flechas que van a lo largo del plano. El rozamiento se compensa en el paso siguiente.";
    const componentes = d.pesoParalelo === 0 && d.fuerzaPerpendicular === 0
      ? "El peso ya es perpendicular al plano y el empuje va a lo largo de él. Cada fuerza coincide con una de sus componentes."
      : "Las guías de puntos cierran un triángulo rectángulo: la fuerza completa es su hipotenusa y las componentes son sus catetos. Sigue las flechas del mismo color para ver las dos partes de cada fuerza. En el formulario de abajo puedes girar este triángulo y descubrir por qué usamos seno o coseno.";
    return [
      ["Las fuerzas que actúan", "El peso es vertical; la normal es perpendicular al plano. La fuerza aplicada y el rozamiento también cuentan. Vamos a sumar sus vectores sin mover todavía el bloque.", "El plano horizontal es este mismo sistema con θ = 0°."],
      ["Una fuerza, dos componentes", componentes, `P∥ = ${n(d.pesoParalelo)} N · P⊥ = ${n(d.pesoPerpendicular)} N · F∥ = ${n(d.fuerzaParalela)} N · F⊥ = ${n(d.fuerzaPerpendicular)} N`],
      ["Se equilibran las perpendiculares", d.beta === 0 ? "La normal y la componente perpendicular del peso tienen igual tamaño y sentidos opuestos. Se compensan hasta desaparecer de la suma. El bloque sigue apoyado." : "Sumamos la normal, la componente perpendicular del peso y la del empuje. Al estar en contacto, se equilibran. Empujar contra el plano aumenta N; tirar hacia fuera la reduce.", `ΣF⊥ = ${suma([d.normal, d.fuerzaPerpendicular, d.pesoPerpendicular])} = 0 N`],
      ["Ahora, las fuerzas paralelas", paralelo, `F∥ + P∥ = ${suma([d.fuerzaParalela, d.pesoParalelo])} = ${n(d.motriz)} N`],
      ["¿Cuánto compensa el rozamiento?", d.seMueve ? `La suma de ${n(Math.abs(d.motriz))} N supera el máximo estático de ${n(d.limite)} N. Al deslizar, el rozamiento cinético compensa ${n(Math.abs(d.rozamiento))} N de las fuerzas que quedan.` : `Para mantener el reposo bastan ${n(Math.abs(d.motriz))} N de rozamiento estático. Puede llegar hasta ${n(d.limite)} N y se ajusta a lo necesario. Las flechas restantes se compensan por completo.`, `ΣF∥ = F∥ + P∥ + f = ${suma([d.fuerzaParalela, d.pesoParalelo, d.rozamiento])} = ${n(d.resultante)} N`],
      [d.seMueve ? "Una resultante. Ahora sí, movimiento." : "Resultante cero: sigue en reposo", d.seMueve ? `La flecha amarilla resume la suma. Quedan ${n(Math.abs(d.resultante))} N hacia la ${direccion(d.resultante).replace(" · ", ", ")}. El bloque empieza a acelerar al completar la suma.` : "La resultante es cero. Como el bloque partía del reposo, permanece quieto.", `a = ΣF∥ / m = ${n(d.resultante)} / ${n(d.masa)} = ${n(d.aceleracion)} m/s²`],
    ];
  }

  const pintarLienzo = lienzo($("escena"), dibujar);
  function renderizar() {
    const { paso, progreso } = fase();
    const tiempo = datos.seMueve ? Math.max(0, instante - finSuma) * 0.5 : 0;
    const vistaComponentes = !iniciado && $("componentes").checked;
    $("componentes").disabled = iniciado || !datos.contacto;
    pintarLienzo({
      d: datos, paso, progreso: reducida.matches ? 1 : progreso, tiempo,
      iniciado, componentes: vistaComponentes, reducir: reducida.matches,
    });
    salida("tiempo", n(tiempo) + " s");
    salida("velocidad", n((datos.aceleracion ?? 0) * tiempo) + " m/s");
    salida("distancia", n((datos.aceleracion ?? 0) * tiempo ** 2 / 2) + " m");
    if (paso !== ultimoPaso) {
      const relato = relatos()[vistaComponentes && paso === 0 ? 1 : paso];
      salida("titulo-paso", relato[0]); salida("texto-paso", relato[1]); salida("cuenta-paso", relato[2]);
      botonesPasos.forEach((b, i) => {
        if (i === paso) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current");
        b.dataset.completo = String(i < paso);
      });
      ultimoPaso = paso;
    }
    $("siguiente").disabled = !datos.contacto || paso === 5;
  }

  function detener() {
    cancelAnimationFrame(cuadro); cuadro = undefined; anterior = undefined; enMarcha = false;
  }
  function reiniciar() {
    detener(); instante = 0; ultimoPaso = -1; iniciado = false; terminado = false; dialogoMostrado = false;
    if ($("dialogo-reposo").open) $("dialogo-reposo").close();
    $("reproducir").textContent = "Iniciar";
    salida("estado", datos.contacto ? "Listo. Iniciar compone las fuerzas antes de mover el bloque." : "Ajusta las condiciones para mantener el contacto.");
    renderizar();
  }
  function actualizar() {
    datos = leer();
    salida("angulo-valor", n(datos.angulo) + "°");
    $("angulo").setAttribute("aria-valuetext", n(datos.angulo) + " grados");
    for (const opcion of $("sentido").options) {
      const texto = direccion(Number(opcion.value));
      opcion.textContent = texto[0].toUpperCase() + texto.slice(1);
    }
    for (const control of $("controles").querySelectorAll("[data-unidad]")) salida(control.id + "-valor", n(control.valueAsNumber) + control.dataset.unidad);
    salida("coeficientes", `μs = ${n(datos.material.estatico)} · μk = ${n(datos.material.dinamico)}`);
    for (const [id, valor, unidad] of [["peso", datos.peso, " N"], ["normal", datos.normal, " N"], ["rozamiento", datos.contacto ? Math.abs(datos.rozamiento) : null, " N"], ["limite", datos.limite, " N"], ["resultante", datos.resultante, " N"], ["aceleracion", datos.aceleracion, " m/s²"]]) salida(id, valor === null ? "Sin contacto" : n(valor) + unidad);
    $("aviso-contacto").hidden = datos.contacto;
    salida("aviso-contacto", "Esa fuerza levantaría el bloque. Este ensayo estudia el movimiento en contacto con el plano: reduce F o el ángulo β hacia fuera.");
    $("reproducir").disabled = !datos.contacto;
    botonesPasos.forEach((b) => b.disabled = !datos.contacto);
    reiniciar();
    if (!datos.contacto) {
      salida("titulo-paso", "El bloque perdería el contacto");
      salida("texto-paso", "La componente del empuje hacia fuera supera la del peso hacia el plano. Una superficie no puede tirar del bloque para sujetarlo. Cambia los ajustes para estudiar un movimiento sobre el plano.");
      salida("cuenta-paso", "N = 0 N. No se inicia la composición de equilibrio perpendicular.");
    }
  }

  function mostrarReposo() {
    if (dialogoMostrado || Math.abs(datos.rozamiento) < 1e-9) return;
    dialogoMostrado = true;
    salida("texto-reposo", `La fuerza que intenta mover el bloque es de ${n(Math.abs(datos.motriz))} N. El rozamiento estático puede llegar hasta ${n(datos.limite)} N, pero aquí solo vale ${n(Math.abs(datos.rozamiento))} N, en sentido contrario. Se equilibran exactamente: la resultante es 0 N y el bloque permanece quieto.`);
    $("dialogo-reposo").showModal();
  }
  function avanzar(ahora) {
    const delta = anterior === undefined ? 0 : Math.min((ahora - anterior) / 1000, 0.05);
    anterior = ahora;
    const tiempoMovimiento = datos.seMueve ? Math.min(4, Math.sqrt(8 / Math.abs(datos.aceleracion))) : 0;
    const fin = finSuma + tiempoMovimiento / 0.5;
    instante = Math.min(fin, instante + delta * Number($("ritmo").value));
    renderizar();
    if (instante >= fin) {
      detener(); terminado = true; $("reproducir").textContent = "Repetir";
      salida("estado", datos.seMueve ? "Ensayo terminado. Repite la suma o cambia las condiciones." : "Suma completada: resultante cero. El bloque sigue en reposo.");
      if (!datos.seMueve) mostrarReposo();
    } else cuadro = requestAnimationFrame(avanzar);
  }
  $("reproducir").addEventListener("click", () => {
    if (enMarcha) {
      detener(); $("reproducir").textContent = "Continuar"; salida("estado", "En pausa. Puedes revisar cada paso."); return;
    }
    if (terminado) reiniciar();
    iniciado = true; enMarcha = true; ultimoPaso = -1; $("reproducir").textContent = "Pausar";
    salida("estado", "Composición en marcha. El tiempo de movimiento empieza al terminar la suma.");
    cuadro = requestAnimationFrame(avanzar);
  });
  $("reiniciar").addEventListener("click", reiniciar);
  function irAPaso(paso) {
    if (!datos.contacto) return;
    detener(); iniciado = true; terminado = false;
    instante = comienzos[paso] + duraciones[paso] - 0.001; ultimoPaso = -1;
    $("reproducir").textContent = "Continuar";
    salida("estado", "Paso completado. Continúa para ver la secuencia animada.");
    renderizar();
    if (paso === 5 && !datos.seMueve) mostrarReposo();
  }
  botonesPasos.forEach((b) => b.addEventListener("click", () => irAPaso(Number(b.dataset.paso))));
  $("siguiente").addEventListener("click", () => irAPaso(Math.min(5, fase().paso + 1)));
  $("controles").addEventListener("input", (evento) => {
    if (evento.target.id === "componentes") {
      ultimoPaso = -1; renderizar();
    } else actualizar();
  });
  const casos = {
    horizontal: { angulo: 0, masa: 5, fuerza: 30, superficie: "rugosa", beta: 0, sentido: 1 },
    equilibrio: { angulo: 0, masa: 5, fuerza: 14, superficie: "rugosa", beta: 0, sentido: 1 },
    rampa: { angulo: 30, masa: 10, fuerza: 0, superficie: "suave", beta: 0, sentido: 1 },
    subida: { angulo: 30, masa: 8, fuerza: 70, superficie: "suave", beta: 0, sentido: 1 },
  };
  function aplicarCaso(caso) {
    $("invertir-pendiente").checked = false;
    for (const [id, valor] of Object.entries(casos[caso])) $(id).value = valor;
    actualizar();
  }
  document.querySelectorAll("[data-caso]").forEach((b) => b.addEventListener("click", () => aplicarCaso(b.dataset.caso)));
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && enMarcha) {
      detener(); $("reproducir").textContent = "Continuar"; salida("estado", "En pausa al cambiar de pestaña.");
    }
  });
  const casoInicial = new URLSearchParams(window.location.search).get("caso");
  if (Object.hasOwn(casos, casoInicial)) aplicarCaso(casoInicial); else actualizar();
})();
