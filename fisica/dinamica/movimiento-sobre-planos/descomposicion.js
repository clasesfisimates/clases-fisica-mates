(() => {
  "use strict";
  const { numero, lienzo, flecha, linea, bloque } = window.LabDinamica;
  const $ = (id) => document.getElementById(id);
  const escribir = (id, texto) => { $(id).textContent = texto; };
  const n = (valor) => numero(valor, 1);
  const ejemplos = { peso: { angulo: 30, magnitud: 100 }, aplicada: { angulo: 30, magnitud: 100 } };
  const reducido = window.matchMedia("(prefers-reduced-motion: reduce)");
  let tipo = "peso", progreso = 1, cuadro = null, anterior = null, activo = false;
  const azul = "#94caff", violeta = "#e5abff";
  const escala = 1.5; // Píxeles por newton: fija en ambos dibujos y para todos los ajustes.

  function datos() {
    const ejemplo = ejemplos[tipo];
    const peso = tipo === "peso";
    const radianes = ejemplo.angulo * Math.PI / 180;
    return { ...ejemplo, peso, radianes, simbolo: peso ? "P" : "F", anguloSimbolo: peso ? "θ" : "β",
      adyacente: Math.abs(ejemplo.magnitud * Math.cos(radianes)) < 1e-9 ? 0 : ejemplo.magnitud * Math.cos(radianes),
      opuesto: Math.abs(ejemplo.magnitud * Math.sin(radianes)) < 1e-9 ? 0 : ejemplo.magnitud * Math.sin(radianes),
      ladoAdyacente: peso ? "P⊥" : "F∥", ladoOpuesto: peso ? "P∥" : "F⊥",
      color: peso ? "#ffba80" : "#8be9cc" };
  }
  function rotulo(ctx, texto, x, y, color = "#dce9ff", tamano = 16) {
    ctx.save(); ctx.font = `650 ${tamano}px system-ui, sans-serif`;
    const anchoTexto = ctx.measureText(texto).width;
    x = Math.max(8, Math.min(ctx.canvas.clientWidth - anchoTexto - 8, x));
    y = Math.max(20, Math.min(ctx.canvas.clientHeight - 14, y));
    ctx.fillStyle = "#132347e8"; ctx.fillRect(x - 3, y - 16, anchoTexto + 6, 21);
    ctx.fillStyle = color; ctx.fillText(texto, x, y); ctx.restore();
  }
  const punto = (o, v) => ({ x: o.x + v.x, y: o.y + v.y });

  function dibujar(ctx, ancho, alto, d, recto) {
    const fondo = ctx.createLinearGradient(0, 0, ancho, alto);
    fondo.addColorStop(0, "#101c3b"); fondo.addColorStop(1, "#253b65");
    ctx.fillStyle = fondo; ctx.fillRect(0, 0, ancho, alto);
    for (let x = 18; x < ancho; x += 24) for (let y = 18; y < alto; y += 24) {
      ctx.fillStyle = "#99bdf322"; ctx.fillRect(x, y, 1.5, 1.5);
    }
    const largo = d.magnitud * escala;
    const origen = recto ? { x: (ancho - 150) / 2, y: d.peso ? 66 : alto - 66 }
      : d.peso ? { x: ancho * 0.49, y: 72 } : { x: (ancho - 150) / 2, y: alto - 74 };
    const adyacente = recto || !d.peso ? { x: d.adyacente * escala, y: 0 }
      : { x: d.adyacente * escala * Math.sin(d.radianes), y: d.adyacente * escala * Math.cos(d.radianes) };
    const opuesto = recto ? { x: 0, y: (d.peso ? 1 : -1) * d.opuesto * escala }
      : d.peso ? { x: -d.opuesto * escala * Math.cos(d.radianes), y: d.opuesto * escala * Math.sin(d.radianes) }
        : { x: 0, y: -d.opuesto * escala };
    const a = punto(origen, adyacente);
    const b = punto(a, opuesto);
    const c = punto(origen, opuesto);
    const crecimiento = Math.max(0, Math.min(1, (d.progreso - 0.16) / 0.54));
    const triangulo = Math.max(0, Math.min(1, (d.progreso - 0.66) / 0.24));

    if (!recto) {
      const theta = d.peso ? d.radianes : 0;
      const u = { x: Math.cos(theta), y: -Math.sin(theta) };
      const base = { x: origen.x + 27 * Math.sin(theta), y: origen.y + 27 * Math.cos(theta) };
      linea(ctx, base.x - 240 * u.x, base.y - 240 * u.y, base.x + 400 * u.x, base.y + 400 * u.y, "#6e8eb9", 3);
      bloque(ctx, origen.x, origen.y, 46, 40, -theta);
      if (d.peso && d.angulo > 0 && d.angulo < 90) {
        const pie = { x: base.x - 105 * u.x, y: base.y - 105 * u.y };
        ctx.save(); ctx.setLineDash([2, 5]); linea(ctx, pie.x, pie.y, pie.x + 75, pie.y, "#c9d6f2"); ctx.restore();
        ctx.beginPath(); ctx.arc(pie.x, pie.y, 35, -theta, 0); ctx.strokeStyle = "#ffe38a"; ctx.lineWidth = 2; ctx.stroke();
        rotulo(ctx, "θ", pie.x + 45 * Math.cos(theta / 2), pie.y - 45 * Math.sin(theta / 2), "#ffe38a");
      }
    }
    if (largo < 0.5) { rotulo(ctx, d.simbolo + " = 0 N", ancho / 2 - 40, alto / 2, d.color); return; }

    if (triangulo > 0) {
      ctx.save(); ctx.globalAlpha = triangulo;
      ctx.beginPath(); ctx.moveTo(origen.x, origen.y); ctx.lineTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.closePath();
      ctx.fillStyle = "#a690f52c"; ctx.fill(); ctx.restore();
    }
    if (crecimiento > 0) {
      if (!recto) {
        ctx.save(); ctx.globalAlpha = crecimiento * 0.8; ctx.setLineDash([2, 5]);
        linea(ctx, a.x, a.y, b.x, b.y, violeta, 2);
        linea(ctx, c.x, c.y, b.x, b.y, azul, 2); ctx.restore();
      }
      flecha(ctx, origen.x, origen.y, adyacente.x * crecimiento, adyacente.y * crecimiento, azul, false, 4);
      const inicioOpuesto = recto ? a : origen;
      flecha(ctx, inicioOpuesto.x, inicioOpuesto.y, opuesto.x * crecimiento, opuesto.y * crecimiento, violeta, false, 4);
      if (crecimiento > 0.9) {
        if (d.adyacente > 3) rotulo(ctx, d.ladoAdyacente, (origen.x + a.x) / 2 + (recto ? -12 : 12), (origen.y + a.y) / 2 + (recto && !d.peso ? 26 : -12), azul);
        if (d.opuesto > 3) rotulo(ctx, d.ladoOpuesto, (inicioOpuesto.x + (recto ? b.x : c.x)) / 2 + (recto ? 16 : -43), (inicioOpuesto.y + (recto ? b.y : c.y)) / 2 + (recto ? 6 : 23), violeta);
      }
    }
    flecha(ctx, origen.x, origen.y, b.x - origen.x, b.y - origen.y, d.color, false, 3);
    rotulo(ctx, d.simbolo, b.x + 10, b.y + (d.peso ? 22 : -12), d.color);

    if (triangulo > 0 && d.adyacente * escala > 12 && d.opuesto * escala > 12) {
      const ua = { x: adyacente.x / (d.adyacente * escala), y: adyacente.y / (d.adyacente * escala) };
      const uo = { x: opuesto.x / (d.opuesto * escala), y: opuesto.y / (d.opuesto * escala) };
      const esquina1 = { x: a.x - ua.x * 10, y: a.y - ua.y * 10 };
      const esquina2 = { x: esquina1.x + uo.x * 10, y: esquina1.y + uo.y * 10 };
      linea(ctx, esquina1.x, esquina1.y, esquina2.x, esquina2.y, "#dce9ff", 1.5);
      linea(ctx, esquina2.x, esquina2.y, a.x + uo.x * 10, a.y + uo.y * 10, "#dce9ff", 1.5);
    }
    if (triangulo > 0 && d.angulo > 0) {
      const inicio = Math.atan2(adyacente.y, adyacente.x);
      const giro = (d.peso ? 1 : -1) * d.radianes;
      const radio = Math.min(30, largo * 0.38);
      ctx.beginPath(); ctx.arc(origen.x, origen.y, radio, inicio, inicio + giro, giro < 0);
      ctx.strokeStyle = "#ffe38a"; ctx.lineWidth = 2; ctx.stroke();
      rotulo(ctx, d.anguloSimbolo, origen.x + (radio + 17) * Math.cos(inicio + giro / 2), origen.y + (radio + 17) * Math.sin(inicio + giro / 2) + 6, "#ffe38a");
    }
    rotulo(ctx, recto ? "Azul: junto · Violeta: enfrente" : "Flechas: fuerzas · Puntos: guías", 12, alto - 17, "#dce9ff", 14);
  }
  const contexto = lienzo($("triangulo-contexto"), (ctx, ancho, alto, d) => dibujar(ctx, ancho, alto, d, false));
  const recto = lienzo($("triangulo-recto"), (ctx, ancho, alto, d) => dibujar(ctx, ancho, alto, d, true));
  function pintar() {
    const d = { ...datos(), progreso };
    contexto(d); recto(d);
    const paso = progreso < 0.17 ? 0 : progreso < 0.78 ? 1 : 2;
    for (const boton of document.querySelectorAll("[data-triangulo-paso]")) {
      if (Number(boton.dataset.trianguloPaso) === paso) boton.setAttribute("aria-current", "step");
      else boton.removeAttribute("aria-current");
    }
  }
  function actualizar() {
    const d = datos(), s = d.simbolo, a = d.anguloSimbolo;
    escribir("triangulo-angulo-valor", n(d.angulo) + "°"); escribir("triangulo-magnitud-valor", n(d.magnitud) + " N");
    escribir("triangulo-label-angulo", d.peso ? "Inclinación del plano · θ (theta)" : "Ángulo desde el plano · β (beta)");
    escribir("triangulo-label-magnitud", d.peso ? "Valor del peso · P" : "Valor de la fuerza aplicada · F");
    escribir("triangulo-contexto-titulo", d.peso ? "En la rampa" : "Fuerza aplicada sobre un plano horizontal");
    escribir("triangulo-contexto-nota", d.peso ? "El peso es vertical. Fíjate en el ángulo entre el peso y la dirección perpendicular al plano." : "β se mide desde el plano. Fíjate en que ahora el lado junto al ángulo es el paralelo.");
    const clave = d.peso ? "El plano y su perpendicular giran el mismo ángulo θ. Por eso θ también aparece entre el peso y la perpendicular al plano."
      : "El ángulo β parte de la dirección paralela. Por eso ahora la paralela usa coseno y la perpendicular usa seno. La regla del triángulo sigue siendo la misma.";
    escribir("triangulo-clave", clave);
    for (const [id, nombre, lado, valor, funcion, explicacion] of [
      ["adyacente", d.peso ? "Perpendicular" : "Paralela", d.ladoAdyacente, d.adyacente, "cos", d.peso ? "Esta parte del peso presiona contra el plano." : "Esta parte de la fuerza tira a lo largo del plano."],
      ["opuesto", d.peso ? "Paralela" : "Perpendicular", d.ladoOpuesto, d.opuesto, "sen", d.peso ? "Esta parte del peso tira cuesta abajo." : "En este ejemplo, esta parte de la fuerza tira hacia fuera del plano."],
    ]) {
      escribir("triangulo-" + id + "-titulo", nombre + " · " + (id === "adyacente" ? "junto al ángulo" : "enfrente del ángulo"));
      escribir("triangulo-" + id + "-lado", "Cateto " + id + " · longitud de " + lado);
      escribir("triangulo-" + id + "-formula", s + " · " + funcion + " " + a);
      escribir("triangulo-" + id + "-cuenta", n(d.magnitud) + " × " + funcion + " " + n(d.angulo) + "° = " + n(valor) + " N");
      escribir("triangulo-" + id + "-explicacion", explicacion);
    }
    escribir("triangulo-comprueba", `Pitágoras: ${n(d.adyacente)}² + ${n(d.opuesto)}² ≈ ${n(d.magnitud)}². Son lados de un triángulo rectángulo: no sumes sus longitudes como si apuntaran en la misma dirección. Valores redondeados.`);
    const reto = d.magnitud === 0 ? "Con una fuerza de 0 N no hay flecha ni componentes. Sube el valor de la fuerza para construir el triángulo."
      : d.angulo === 0 ? "Con 0°, el lado enfrente desaparece: sen 0° = 0. Toda la fuerza coincide con el lado junto al ángulo: cos 0° = 1. El triángulo queda reducido a una línea."
        : d.angulo === 90 ? "Con 90°, desaparece el lado junto al ángulo: cos 90° = 0. Toda la fuerza coincide con el lado enfrente: sen 90° = 1. El triángulo queda reducido a una línea."
          : d.angulo === 45 ? "Con 45°, los dos catetos tienen la misma longitud. Comprueba que ninguno vale la mitad de la fuerza completa."
            : "Prueba 0°, 45° y 90°. ¿Qué lado crece al aumentar el ángulo? ¿Qué lado se acorta?";
    escribir("triangulo-reto", reto);
    const descripcion = `${s} = ${n(d.magnitud)} N; ${a} = ${n(d.angulo)} grados. Longitudes: ${d.ladoAdyacente} = ${n(d.adyacente)} N, junto al ángulo; ${d.ladoOpuesto} = ${n(d.opuesto)} N, enfrente del ángulo.`;
    $("triangulo-contexto").setAttribute("aria-label", descripcion);
    $("triangulo-recto").setAttribute("aria-label", "Triángulo rectángulo. " + descripcion);
    for (const boton of document.querySelectorAll("[data-triangulo-angulo]")) boton.setAttribute("aria-pressed", String(Number(boton.dataset.trianguloAngulo) === d.angulo));
    pintar();
  }
  function detener() {
    if (cuadro !== null) cancelAnimationFrame(cuadro);
    cuadro = null; anterior = null; activo = false;
    escribir("triangulo-animar", progreso > 0 && progreso < 1 ? "Continuar construcción" : "Ver construcción");
  }
  function completar() { detener(); progreso = 1; actualizar(); escribir("triangulo-animar", "Ver construcción"); }
  function avanzar(ahora) {
    if (!activo) return;
    if (anterior !== null) progreso = Math.min(1, progreso + Math.min((ahora - anterior) / 1000, 0.05) / 4);
    anterior = ahora; pintar();
    if (progreso === 1) detener(); else cuadro = requestAnimationFrame(avanzar);
  }
  $("triangulo-animar").addEventListener("click", () => {
    if (reducido.matches) { completar(); return; }
    if (activo) { detener(); return; }
    if (progreso >= 1) progreso = 0;
    activo = true; anterior = null; escribir("triangulo-animar", "Pausar construcción"); pintar();
    cuadro = requestAnimationFrame(avanzar);
  });
  for (const boton of document.querySelectorAll("[data-triangulo-paso]")) boton.addEventListener("click", () => {
    progreso = [0, 0.69, 1][Number(boton.dataset.trianguloPaso)]; detener(); pintar();
  });
  for (const campo of ["angulo", "magnitud"]) $("triangulo-" + campo).addEventListener("input", () => {
    ejemplos[tipo][campo] = $("triangulo-" + campo).valueAsNumber;
    escribir("triangulo-fuente", "Ejemplo del triángulo: longitudes positivas. Los sentidos se añaden después."); completar();
  });
  for (const boton of document.querySelectorAll("[data-triangulo-angulo]")) boton.addEventListener("click", () => {
    ejemplos[tipo].angulo = Number(boton.dataset.trianguloAngulo); $("triangulo-angulo").value = ejemplos[tipo].angulo;
    escribir("triangulo-fuente", "Ejemplo del triángulo: longitudes positivas. Los sentidos se añaden después."); completar();
  });
  for (const boton of document.querySelectorAll("[data-triangulo-tipo]")) boton.addEventListener("click", () => {
    tipo = boton.dataset.trianguloTipo;
    for (const opcion of document.querySelectorAll("[data-triangulo-tipo]")) opcion.setAttribute("aria-pressed", String(opcion === boton));
    $("triangulo-angulo").value = ejemplos[tipo].angulo; $("triangulo-magnitud").value = ejemplos[tipo].magnitud;
    escribir("triangulo-fuente", "Ejemplo del triángulo: longitudes positivas. Los sentidos se añaden después."); completar();
  });
  function leerEnsayo() {
    return window.ModeloPlanos.calcular({ masa: $("masa").valueAsNumber,
      angulo: $("angulo").valueAsNumber * ($("invertir-pendiente").checked ? -1 : 1),
      fuerza: $("fuerza").valueAsNumber, beta: $("beta").valueAsNumber,
      sentido: Number($("sentido").value), superficie: $("superficie").value });
  }
  $("triangulo-traer").addEventListener("click", () => {
    const d = leerEnsayo();
    const angulo = tipo === "peso" ? d.angulo : d.beta;
    ejemplos[tipo] = { angulo: Math.abs(angulo), magnitud: tipo === "peso" ? d.peso : d.fuerza };
    $("triangulo-angulo").value = ejemplos[tipo].angulo; $("triangulo-magnitud").value = ejemplos[tipo].magnitud;
    escribir("triangulo-fuente", `Valores traídos del ensayo: ${tipo === "peso" ? "θ" : "β"} = ${n(angulo)}°. El triángulo estudia la longitud del ángulo (${n(Math.abs(angulo))}°) y de las componentes; los signos se explican más abajo.`);
    completar();
  });
  function resumenEnsayo() {
    const d = leerEnsayo();
    const valor = (x) => numero(x, 2);
    escribir("formulario-ejemplo-peso", `En tu ensayo: ${valor(d.masa)} kg × 9,8 m/s² = ${valor(d.peso)} N.`);
    escribir("formulario-ejemplo-normal", d.contacto ? `En tu ensayo: ${valor(d.peso)} × cos (${valor(d.angulo)}°) − (${valor(d.fuerzaPerpendicular)}) ≈ ${valor(d.normal)} N.` : "En tu ensayo se perdería el contacto. La normal es 0 N y este modelo no calcula el movimiento separado del plano.");
    escribir("formulario-ejemplo-roce", !d.contacto ? "Sin contacto, el plano no ejerce rozamiento." : `En tu ensayo: límite = ${valor(d.material.estatico)} × ${valor(d.normal)} ≈ ${valor(d.limite)} N. ${d.seMueve ? "Se supera el límite y desliza" : "Permanece en reposo"}; el rozamiento real vale ${valor(Math.abs(d.rozamiento))} N.`);
    escribir("formulario-ejemplo-resultante", d.contacto ? `En tu ensayo: resultante = ${valor(d.resultante)} N. Aceleración = ${valor(d.resultante)} ÷ ${valor(d.masa)} ≈ ${valor(d.aceleracion)} m/s².` : "Recupera el contacto para calcular el movimiento sobre el plano.");
  }
  $("controles").addEventListener("input", resumenEnsayo);
  document.querySelector(".casos").addEventListener("click", resumenEnsayo);
  document.addEventListener("visibilitychange", () => { if (document.hidden) detener(); });
  reducido.addEventListener("change", completar);
  actualizar(); resumenEnsayo();
})();
