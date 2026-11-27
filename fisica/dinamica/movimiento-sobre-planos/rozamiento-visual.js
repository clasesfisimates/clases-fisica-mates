(() => {
  "use strict";
  const v = window.FormularioVisual;
  const vista = v.crear("fr", "El límite estático: aguantar hasta cierto punto", "Imagina que el rozamiento es un monigote que sujeta una caja con una cuerda. Aumenta el empuje hacia la derecha: primero puede aguantar; después, la caja lo arrastra y él sigue siendo un lastre.", `
    <div class="fv-layout"><div class="fv-visual">
      <div class="fv-acciones"><button type="button" class="boton" id="fr-animar">Reproducir comparación</button><button type="button" class="boton secundario" id="fr-reiniciar">Reiniciar</button></div>
      <canvas class="fv-lienzo" id="fr-lienzo" role="img" aria-label="Un monigote sujeta con una cuerda una caja empujada hacia la derecha."></canvas>
      <div class="fv-leyenda"><span style="--color-fuerza:#8be9cc">Empuje hacia la derecha</span><span style="--color-fuerza:#e5abff">Resistencia hacia la izquierda</span></div>
      <dl class="fv-medidas"><div><dt>Empuje</dt><dd id="fr-empuje-lectura"></dd></div><div><dt>Resistencia real</dt><dd id="fr-resistencia"></dd></div><div><dt>Fuerza que queda</dt><dd id="fr-resto"></dd></div></dl>
      <div class="fv-relato" role="status" aria-atomic="true"><h3 id="fr-estado"></h3><p id="fr-relato"></p></div>
    </div><div class="fv-ajustes"><h3>¿Cuánto puede aguantar?</h3>
      ${v.campo("fr-empuje", "Empuje sobre la caja · F", 0, 150, 0.1, 15, " N")}
      <div class="fv-ejemplos" role="group" aria-label="Comparar el límite de rozamiento"><button type="button" id="fr-antes">Antes del límite</button><button type="button" id="fr-despues">Superar el límite</button></div>
      ${v.campo("fr-normal", "Apoyo del plano · N", 0, 120, 0.1, 60, " N")}
      ${v.campo("fr-coeficiente", "Agarre de las superficies · μs", 0, 1, 0.05, 0.5)}
      <div class="fv-ecuacion" id="fr-limite"></div>
      <div class="fv-medidor" id="fr-medidor" aria-hidden="true"><span id="fr-llenado"></span></div>
      <p class="fv-ayuda" id="fr-margen"></p>
      <p class="fv-ayuda">Más N o más μs hacen más difícil empezar a mover la caja.</p>
    </div></div>
    <div class="fv-desarrollo"><h3>El máximo y el valor real son cosas distintas</h3><p><strong>Antes de arrancar:</strong> el monigote tiene capacidad de sobra y solo necesita igualar el empuje. La resistencia real crece con él; no se aplica siempre el máximo.</p><p><strong>Después de superar el límite:</strong> la caja se mueve. La resistencia sigue apuntando hacia atrás, pero ya no compensa todo el empuje.</p></div>
    <p class="fv-nota">El monigote es una analogía de la resistencia: el rozamiento real nace del contacto entre superficies. La animación exagera el arrastre. Para representar el deslizamiento usa μk = 0,7 · μs.</p>`);
  const { $, texto, dialogo } = vista;
  let cuadro = null, anterior = null, activo = false, tiempo = 0, distancia = 0, modo = "comparar", estadoAnterior = "";
  function leer() {
    const empuje = $("empuje").valueAsNumber, normal = $("normal").valueAsNumber, coeficiente = $("coeficiente").valueAsNumber;
    return { empuje, normal, coeficiente, ...v.modelo.rozamiento(empuje, normal, coeficiente), distancia, tiempo };
  }
  const pintar = v.lienzo($("lienzo"), (ctx, ancho, alto, d) => {
    const suelo = alto * 0.76;
    const avance = Math.min(d.distancia, ancho * 0.045);
    const caja = ancho * 0.61 + avance, persona = caja - 102;
    v.linea(ctx, 0, suelo, ancho, suelo, "#9ab5db", 3);
    ctx.fillStyle = "#344a6b"; ctx.fillRect(0, suelo + 2, ancho, alto - suelo);
    const desplazamiento = d.distancia - avance;
    for (let x = -40; x < ancho + 40; x += 36) {
      const marca = x - desplazamiento % 36;
      v.linea(ctx, marca, suelo + 15, marca + 14, suelo + 15, "#6e8db5", 2);
    }
    const patada = d.desliza ? Math.sin(d.tiempo * 8) * 4 : 0;
    const cabeza = { x: persona - 9, y: suelo - 77 + patada * 0.12 };
    ctx.save(); ctx.strokeStyle = "#e4d4ff"; ctx.lineWidth = 4; ctx.lineCap = "round";
    ctx.beginPath(); ctx.arc(cabeza.x, cabeza.y, 9, 0, Math.PI * 2); ctx.stroke();
    v.linea(ctx, persona - 6, suelo - 66, persona + 4, suelo - 31, "#e4d4ff", 4);
    v.linea(ctx, persona - 3, suelo - 56, persona + 2, suelo - 43, "#e4d4ff", 4);
    v.linea(ctx, persona + 2, suelo - 43, persona + 19, suelo - 43, "#e4d4ff", 4);
    v.linea(ctx, persona + 4, suelo - 31, persona - 13, suelo - 16 + patada, "#e4d4ff", 4);
    v.linea(ctx, persona - 13, suelo - 16 + patada, persona - 24, suelo - 2, "#e4d4ff", 4);
    v.linea(ctx, persona + 4, suelo - 31, persona + (d.desliza ? -8 : 12), suelo - 14 - patada, "#e4d4ff", 4);
    v.linea(ctx, persona + (d.desliza ? -8 : 12), suelo - 14 - patada, persona + (d.desliza ? -15 : 19), suelo - 2, "#e4d4ff", 4);
    ctx.restore();
    v.linea(ctx, persona + 19, suelo - 43, caja - 27, suelo - 28, "#ffdc98", 3);
    ctx.beginPath(); ctx.roundRect(caja - 27, suelo - 52, 54, 50, 5);
    ctx.fillStyle = "#c48f53"; ctx.fill(); ctx.strokeStyle = "#ffdfb5"; ctx.lineWidth = 2; ctx.stroke();
    v.linea(ctx, caja - 23, suelo - 47, caja + 23, suelo - 7, "#986235", 3);
    v.linea(ctx, caja - 23, suelo - 7, caja + 23, suelo - 47, "#986235", 3);
    // Escala fija para cada ancho de pantalla; reserva también el avance
    // máximo de la caja para que quepa el empuje de 150 N en móvil.
    const escala = Math.min(0.8, (ancho * 0.345 - 14) / 150);
    const empuje = d.empuje * escala, roce = d.resistencia * escala;
    const yEmpuje = suelo - 66, yRoce = suelo + 14;
    if (empuje > 0) {
      v.linea(ctx, caja, suelo - 52, caja, yEmpuje, "#d6e4e68c");
      v.flecha(ctx, caja, yEmpuje, empuje, 0, "#8be9cc");
      v.etiquetaVector(ctx, "Empuje →", caja + empuje / 2, yEmpuje - 18, "#8be9cc");
    }
    if (roce > 0) {
      v.flecha(ctx, caja, yRoce, -roce, 0, "#e5abff");
      v.etiquetaVector(ctx, "← Rozamiento", caja - roce / 2, yRoce + 19, "#e5abff");
    }
    v.rotulo(ctx, d.desliza ? "¡La caja me arrastra!" : "Puedo aguantar", 16, 36, "#e5abff");
    v.rotulo(ctx, d.desliza ? "Frena, pero ya no basta" : "Se equilibran: no arranca", 14, alto - 24, "#dce8ff", 14);
  });
  function mostrar() {
    const d = leer();
    for (const [id, valor, unidad] of [["normal", d.normal, " N"], ["empuje", d.empuje, " N"], ["coeficiente", d.coeficiente, ""]]) texto(id + "-valor", v.numero(valor, 2) + unidad);
    texto("limite", `fₛ,máx = ${v.numero(d.coeficiente, 2)} × ${v.n(d.normal)} ≈ ${v.n(d.limite)} N`);
    texto("empuje-lectura", v.n(d.empuje) + " N →"); texto("resistencia", v.n(d.resistencia) + " N ←");
    texto("resto", v.n(d.resultante) + " N" + (d.resultante > 0 ? " →" : ""));
    $("llenado").style.width = Math.min(100, d.limite > 0 ? d.empuje / d.limite * 100 : d.empuje > 0 ? 100 : 0) + "%";
    $("medidor").dataset.superado = String(d.desliza);
    texto("margen", d.desliza ? `El empuje supera el límite de ${v.n(d.limite)} N.` : `Aún puede aguantar ${v.n(Math.max(0, d.limite - d.empuje))} N más antes de superar su límite.`);
    const estado = d.desliza ? "La caja arrastra al monigote" : "La caja permanece quieta";
    if (estado !== estadoAnterior) {
      estadoAnterior = estado; texto("estado", estado);
      texto("relato", d.desliza ? "El empuje ha vencido la capacidad de aguantar. La persona es arrastrada y sigue tirando hacia atrás: queda una fuerza hacia la derecha."
        : "La persona todavía puede oponerse lo suficiente. Ajusta su resistencia al empuje, ambas fuerzas se equilibran y la caja no arranca.");
      $("lienzo").setAttribute("aria-label", estado + ". El monigote representa la resistencia hacia la izquierda y el empuje actúa hacia la derecha.");
    }
    pintar(d);
  }
  function detener() {
    activo = false; anterior = null;
    if (cuadro !== null) cancelAnimationFrame(cuadro); cuadro = null;
    texto("animar", tiempo > 0 && tiempo < 7 ? "Continuar comparación" : "Reproducir comparación");
  }
  function avanzar(ahora) {
    if (!activo || !dialogo.open) return;
    const delta = anterior === null ? 0 : Math.min(0.05, (ahora - anterior) / 1000);
    anterior = ahora; tiempo = Math.min(7, tiempo + delta);
    if (modo === "comparar") {
      const limite = $("normal").valueAsNumber * $("coeficiente").valueAsNumber;
      const objetivo = Math.min(150, limite + Math.max(25, limite * 0.25));
      $("empuje").value = objetivo * Math.min(1, tiempo / 5);
    }
    const d = leer();
    if (d.desliza) distancia += Math.max(10, d.resultante * 1.8) * delta;
    mostrar();
    if (tiempo >= 7) detener(); else cuadro = requestAnimationFrame(avanzar);
  }
  function iniciar(nuevoModo) {
    detener(); modo = nuevoModo; tiempo = 0; distancia = 0;
    if (v.reducido.matches) {
      if (modo === "comparar") $("empuje").value = Math.min(150, leer().limite + 25);
      distancia = 18; mostrar(); return;
    }
    activo = true; texto("animar", "Pausar comparación"); cuadro = requestAnimationFrame(avanzar);
  }
  $("animar").addEventListener("click", () => {
    if (activo) { detener(); return; }
    if (tiempo > 0 && tiempo < 7 && !v.reducido.matches) { activo = true; anterior = null; texto("animar", "Pausar comparación"); cuadro = requestAnimationFrame(avanzar); }
    else iniciar("comparar");
  });
  function antes() { detener(); tiempo = 0; distancia = 0; $("empuje").value = Math.round(leer().limite * 6) / 10; texto("animar", "Reproducir comparación"); mostrar(); }
  $("antes").addEventListener("click", antes); $("reiniciar").addEventListener("click", antes);
  $("despues").addEventListener("click", () => { $("empuje").value = Math.min(150, leer().limite + 25); iniciar("arrastrar"); mostrar(); });
  dialogo.addEventListener("input", () => {
    detener(); tiempo = 0; distancia = 0; texto("animar", "Reproducir comparación"); mostrar();
    if (leer().desliza) iniciar("arrastrar");
  });
  dialogo.addEventListener("close", detener);
  document.addEventListener("visibilitychange", () => { if (document.hidden) detener(); });
  v.reducido.addEventListener("change", () => { detener(); if (dialogo.open) mostrar(); });
  v.enlazar("formula-limite", vista, () => {
    detener(); const d = v.ensayo(); $("normal").value = Math.min(120, d.normal); $("coeficiente").value = d.material.estatico;
    estadoAnterior = ""; antes();
  });
})();
