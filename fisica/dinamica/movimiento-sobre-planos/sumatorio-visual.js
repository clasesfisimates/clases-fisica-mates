(() => {
  "use strict";
  const v = window.FormularioVisual;
  const colores = ["#ffba80", "#8be9cc", "#b7b0ff", "#ffabc8", "#94caff", "#ffe38a"];
  const casos = {
    oblicuas: [[70, 20], [45, 140], [40, 205], [60, -25], [45, 90], [30, -90]],
    equilibrio: [[60, 20], [60, 200], [45, 90], [45, -90], [35, 150], [35, -30]],
  };
  const vista = v.crear("su", "Sumar fuerzas: de seis flechas a una", "Este bloque está en el aire: es un esquema para practicar la suma de vectores. Aquí ∥ es la dirección horizontal y ⊥ la vertical. No exigimos que la suma perpendicular sea cero: también puede quedar una resultante vertical.", `
    <div class="fv-layout"><div class="fv-visual">
      <div class="fv-pasos" role="group" aria-label="Pasos del sumatorio"><button type="button" data-suma-paso="0" aria-current="step">Fuerzas</button><button type="button" data-suma-paso="1">Componentes</button><button type="button" data-suma-paso="2">Compensar ∥</button><button type="button" data-suma-paso="3">Compensar ⊥</button><button type="button" data-suma-paso="4">Resultante</button></div>
      <div class="fv-acciones"><button type="button" class="boton" id="su-animar">Ver la suma animada</button><button type="button" class="boton secundario" id="su-reiniciar">Reiniciar</button></div>
      <canvas class="fv-lienzo" id="su-lienzo" role="img" aria-label="Un bloque en el aire recibe seis fuerzas en distintas direcciones."></canvas>
      <div class="fv-relato" role="status" aria-atomic="true"><h3 id="su-estado"></h3><p id="su-relato"></p></div>
      <div class="fv-ecuacion" id="su-cuenta-x"></div><div class="fv-ecuacion" id="su-cuenta-y"></div><div class="fv-ecuacion" id="su-cuenta-r"></div>
    </div><div class="fv-ajustes"><h3>Cambia una fuerza y compara</h3>
      ${v.campo("su-fuerza", "Longitud de F1", 0, 70, 1, 70, " N")}
      ${v.campo("su-angulo", "Dirección de F1", -180, 180, 1, 20, "°")}
      <p class="fv-ayuda">0°: derecha. 90°: arriba. −90°: abajo. Las otras cinco fuerzas mantienen sus valores.</p>
      <div class="fv-ejemplos" role="group" aria-label="Ejemplos de suma vectorial"><button type="button" data-suma-caso="oblicuas">Seis fuerzas oblicuas</button><button type="button" data-suma-caso="equilibrio">Todas se equilibran</button></div>
      <table class="fv-tabla"><caption>Componentes de cada fuerza, en N</caption><thead><tr><th>Fuerza</th><th>∥</th><th>⊥</th></tr></thead><tbody id="su-tabla"></tbody><tfoot><tr><th>Suma</th><td id="su-total-x"></td><td id="su-total-y"></td></tr></tfoot></table>
    </div></div>
    <div class="fv-desarrollo"><h3>Dos sumas sencillas sustituyen una suma complicada</h3><p>Descompón cada fuerza en horizontal y vertical. En cada eje, <strong>suma las que apuntan en el mismo sentido y resta las que apuntan en sentido contrario</strong>. Se compensan cantidades iguales, no necesariamente flechas enteras.</p><p>Las dos componentes que quedan forman la diagonal de un triángulo: esa diagonal es la <strong>fuerza resultante total</strong>. Resume el efecto de las seis fuerzas; no se añade como una séptima fuerza.</p><p class="ecuacion">R∥ = ΣF∥ &nbsp; · &nbsp; R⊥ = ΣF⊥<br>|R| = √(R∥² + R⊥²)</p></div>`);
  const { $, texto, dialogo } = vista;
  const duraciones = [1.3, 5.4, 2.6, 2.6, 2.8];
  const inicios = duraciones.map((_, i) => duraciones.slice(0, i).reduce((a, b) => a + b, 0));
  const fin = duraciones.reduce((a, b) => a + b, 0);
  // Solo el ancho de pantalla cambia la escala. Se mantiene al variar los
  // controles y durante todos los pasos, incluso para las sumas parciales.
  const escalaPara = (ancho) => Math.min(1.15, (ancho / 2 - 18) / 160);
  let fuerzas = [], resultado, tiempo = 0, cuadro = null, anterior = null, activo = false, relatoAnterior = "";
  const suave = (x) => { const t = Math.max(0, Math.min(1, x)); return t * t * (3 - 2 * t); };
  function fase() {
    const indice = inicios.findIndex((inicio, i) => tiempo < inicio + duraciones[i]);
    const paso = indice < 0 ? 4 : indice;
    return { paso, q: Math.min(1, (tiempo - inicios[paso]) / duraciones[paso]) };
  }
  function ejes(ctx, o, ancho, alto) {
    ctx.save(); ctx.setLineDash([2, 5]);
    v.linea(ctx, 15, o.y, ancho - 15, o.y, "#90aed459");
    v.linea(ctx, o.x, 45, o.x, alto - 44, "#90aed459"); ctx.restore();
  }
  function descomponer(ctx, o, f, q, pequeno = false) {
    const escala = escalaPara(ctx.canvas.clientWidth);
    const x = f.x * escala, y = -f.y * escala;
    if (q > 0) {
      ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(o.x + x, o.y); ctx.lineTo(o.x + x, o.y + y); ctx.closePath();
      ctx.fillStyle = f.color + "25"; ctx.fill();
      ctx.save(); ctx.setLineDash([2, 4]);
      v.linea(ctx, o.x + x, o.y, o.x + x, o.y + y, f.color + "99", 1.5);
      v.linea(ctx, o.x, o.y + y, o.x + x, o.y + y, f.color + "99", 1.5); ctx.restore();
      v.flecha(ctx, o.x, o.y, x * q, 0, "#94caff", false, 3.5);
      v.flecha(ctx, o.x, o.y, 0, y * q, "#e5abff", false, 3.5);
    }
    ctx.save(); ctx.globalAlpha = 1 - q * 0.65;
    v.flecha(ctx, o.x, o.y, x, y, f.color, false, 3); ctx.restore();
    if (!pequeno) {
      if (Math.abs(x) > 3) v.rotulo(ctx, f.nombre + "∥", o.x + x + (x < 0 ? -31 : 8), o.y + 25, "#94caff");
      if (Math.abs(y) > 3) v.rotulo(ctx, f.nombre + "⊥", o.x + 10, o.y + y + (y < 0 ? -10 : 22), "#e5abff");
      v.rotulo(ctx, f.nombre, o.x + x + 8, o.y + y - 12, f.color);
    }
  }
  const pintar = v.lienzo($("lienzo"), (ctx, ancho, alto, d) => {
    const escala = escalaPara(ancho);
    const { paso, q, r } = d;
    const o = { x: ancho / 2, y: alto * 0.47 };
    ejes(ctx, o, ancho, alto);
    if (paso === 1 && q >= 0.88) {
      const columnas = ancho < 400 ? 2 : 3, filas = 6 / columnas;
      const celdaX = ancho / columnas, celdaY = (alto - 30) / filas;
      for (const [i, f] of r.componentes.entries()) {
        const col = i % columnas, fila = Math.floor(i / columnas);
        const centro = { x: (col + 0.5) * celdaX, y: 22 + (fila + 0.5) * celdaY };
        descomponer(ctx, centro, f, 1, true);
        v.rotulo(ctx, f.nombre, col * celdaX + 10, 24 + fila * celdaY, f.color, 14);
      }
      v.rotulo(ctx, "Azul: ∥ · Violeta: ⊥", 13, alto - 13, "#dce8ff", 14); return;
    }
    ctx.save(); ctx.globalAlpha = paso < 2 ? 1 : 0.3;
    v.bloque(ctx, o.x, o.y, 38, 38); ctx.restore();
    if (paso === 0) {
      for (const f of r.componentes) {
        const x = f.x * escala, y = -f.y * escala;
        v.flecha(ctx, o.x, o.y, x, y, f.color, false, 3.5);
        const longitud = Math.hypot(x, y);
        if (longitud > 0) v.rotulo(ctx, f.nombre, o.x + x + x / longitud * 19 - 9, o.y + y + y / longitud * 22 + 6, f.color);
      }
      v.rotulo(ctx, "Seis fuerzas sobre un bloque", 14, 29, "#dce8ff", 14);
    } else if (paso === 1) {
      const tramo = Math.min(5.999, q / 0.88 * 6), indice = Math.floor(tramo);
      const actual = r.componentes[indice];
      descomponer(ctx, o, actual, suave((tramo % 1 - 0.1) / 0.75));
      v.rotulo(ctx, `${actual.nombre}: dos componentes`, 14, 29, actual.color, 14);
    } else if (paso === 2 || paso === 3) {
      const horizontal = paso === 2;
      const positiva = horizontal ? r.positivaX : r.positivaY;
      const negativa = horizontal ? r.negativaX : r.negativaY;
      const comun = Math.min(positiva, negativa);
      const restoPositivo = (positiva - comun * suave(q)) * escala;
      const restoNegativo = (negativa - comun * suave(q)) * escala;
      if (horizontal) {
        v.flecha(ctx, o.x, o.y - 9, restoPositivo, 0, "#94caff", false, 5);
        v.flecha(ctx, o.x, o.y + 9, -restoNegativo, 0, "#e5abff", false, 5);
      } else {
        v.flecha(ctx, o.x - 9, o.y, 0, -restoPositivo, "#94caff", false, 5);
        v.flecha(ctx, o.x + 9, o.y, 0, restoNegativo, "#e5abff", false, 5);
        ctx.save(); ctx.globalAlpha = 0.4;
        v.flecha(ctx, o.x, o.y, r.x * escala, 0, "#94caff", false, 3); ctx.restore();
      }
      v.rotulo(ctx, horizontal ? "Derecha contra izquierda" : "Arriba contra abajo", 14, 29, "#dce8ff", 14);
      v.rotulo(ctx, `Opuestas: ${v.n(comun * suave(q))} N por lado`, 14, alto - 27, "#ffe38a", 14);
    } else {
      const x = r.x * escala, y = -r.y * escala;
      const trasladar = suave(q / 0.55), destacar = suave((q - 0.35) / 0.65);
      ctx.save(); ctx.globalAlpha = 1 - destacar * 0.65;
      v.flecha(ctx, o.x, o.y, x, 0, "#94caff", false, 4);
      v.flecha(ctx, o.x + x * trasladar, o.y, 0, y, "#e5abff", false, 4);
      if (Math.abs(x) > 3 && Math.abs(y) > 3) {
        ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(o.x + x, o.y); ctx.lineTo(o.x + x, o.y + y); ctx.closePath();
        ctx.fillStyle = "#ffe38a20"; ctx.fill();
      }
      ctx.restore();
      v.flecha(ctx, o.x, o.y, x * destacar, y * destacar, "#ffe38a", false, 5);
      if (r.modulo < 1e-8) v.rotulo(ctx, "ΣF = 0 N", o.x - 48, o.y + 60, "#ffe38a", 20);
      else if (destacar > 0.2) v.rotulo(ctx, `R = ${v.n(r.modulo)} N`, o.x + x + 10, o.y + y - 18, "#ffe38a");
      v.rotulo(ctx, r.modulo < 1e-8 ? "Equilibrio: resultante cero" : "La diagonal es la resultante", 14, 29, "#dce8ff", 14);
    }
    if (paso < 2) v.rotulo(ctx, "∥ horizontal · ⊥ vertical", 14, alto - 22, "#dce8ff", 14);
  });
  function mostrar() {
    const { paso, q } = fase(), r = resultado;
    pintar({ paso, q, r });
    const parte = paso === 1 ? (q >= 0.88 ? "todas" : String(Math.floor(q / 0.88 * 6))) : "";
    const clave = paso + ":" + parte;
    if (clave !== relatoAnterior) {
      relatoAnterior = clave;
      const relatos = [
        ["Empezamos con seis fuerzas", "Cada flecha tiene longitud, dirección y sentido. No podemos sumar sus longitudes sin mirar hacia dónde apuntan."],
        [q >= 0.88 ? "Ya están separadas las seis fuerzas" : "Descomponemos una fuerza cada vez", "El lado horizontal y el vertical forman un triángulo con la fuerza original. Ahora todas las piezas se pueden agrupar en solo dos ejes. Mira la tabla para seguir cada componente."],
        ["Compensamos las componentes paralelas", `A la derecha suman ${v.n(r.positivaX)} N y a la izquierda ${v.n(r.negativaX)} N. Quitamos la misma cantidad de los dos lados: quedan ${v.n(r.x)} N con signo.`],
        ["Compensamos las componentes perpendiculares", `Hacia arriba suman ${v.n(r.positivaY)} N y hacia abajo ${v.n(r.negativaY)} N. Tras compensar, quedan ${v.n(r.y)} N con signo.`],
        [r.modulo < 1e-8 ? "Las seis fuerzas se equilibran" : "Una única fuerza resume el conjunto", r.modulo < 1e-8 ? "No queda componente en ninguno de los ejes. La resultante es cero y no tiene una dirección definida." : `Unimos las componentes que quedan. La diagonal amarilla es la resultante: ${v.n(r.modulo)} N. Equivale a las seis fuerzas actuando juntas.`],
      ];
      texto("estado", relatos[paso][0]); texto("relato", relatos[paso][1]);
      $("lienzo").setAttribute("aria-label", relatos[paso][0] + ". " + relatos[paso][1]);
      for (const boton of dialogo.querySelectorAll("[data-suma-paso]")) {
        if (Number(boton.dataset.sumaPaso) === paso) boton.setAttribute("aria-current", "step");
        else boton.removeAttribute("aria-current");
      }
    }
  }
  function actualizar() {
    fuerzas[0].magnitud = $("fuerza").valueAsNumber; fuerzas[0].angulo = $("angulo").valueAsNumber;
    resultado = v.modelo.sumar(fuerzas); relatoAnterior = "";
    texto("fuerza-valor", v.n(fuerzas[0].magnitud) + " N"); texto("angulo-valor", v.n(fuerzas[0].angulo) + "°");
    const n = (valor) => v.numero(valor, 2);
    $("tabla").innerHTML = resultado.componentes.map((f) => `<tr><th scope="row" style="--color-fuerza:${f.color}">${f.nombre}</th><td>${n(f.x)}</td><td>${n(f.y)}</td></tr>`).join("");
    texto("total-x", n(resultado.x)); texto("total-y", n(resultado.y));
    texto("cuenta-x", `ΣF∥ = ${n(resultado.positivaX)} − ${n(resultado.negativaX)} ≈ ${n(resultado.x)} N`);
    texto("cuenta-y", `ΣF⊥ = ${n(resultado.positivaY)} − ${n(resultado.negativaY)} ≈ ${n(resultado.y)} N`);
    texto("cuenta-r", `|R| = √[(${n(resultado.x)})² + (${n(resultado.y)})²] ≈ ${n(resultado.modulo)} N`);
    mostrar();
  }
  function detener() {
    activo = false; anterior = null;
    if (cuadro !== null) cancelAnimationFrame(cuadro); cuadro = null;
    texto("animar", v.reducido.matches ? "Paso siguiente" : tiempo > 0 && tiempo < fin ? "Continuar suma" : "Ver la suma animada");
  }
  function reiniciar() { tiempo = 0; detener(); relatoAnterior = ""; mostrar(); }
  function irPaso(paso) { tiempo = inicios[paso] + duraciones[paso] - 0.001; detener(); mostrar(); }
  function avanzar(ahora) {
    if (!activo || !dialogo.open) return;
    if (anterior !== null) tiempo = Math.min(fin, tiempo + Math.min(0.05, (ahora - anterior) / 1000));
    anterior = ahora; mostrar();
    if (tiempo >= fin) detener(); else cuadro = requestAnimationFrame(avanzar);
  }
  $("animar").addEventListener("click", () => {
    if (v.reducido.matches) { irPaso((fase().paso + 1) % 5); return; }
    if (activo) { detener(); return; }
    if (tiempo >= fin) tiempo = 0;
    activo = true; anterior = null; texto("animar", "Pausar suma"); cuadro = requestAnimationFrame(avanzar);
  });
  $("reiniciar").addEventListener("click", reiniciar);
  dialogo.querySelectorAll("[data-suma-paso]").forEach((boton) => boton.addEventListener("click", () => irPaso(Number(boton.dataset.sumaPaso))));
  function aplicarCaso(nombre) {
    fuerzas = casos[nombre].map(([magnitud, angulo], i) => ({ nombre: "F" + (i + 1), magnitud, angulo, color: colores[i] }));
    $("fuerza").value = fuerzas[0].magnitud; $("angulo").value = fuerzas[0].angulo;
    tiempo = 0; detener(); actualizar();
  }
  dialogo.querySelectorAll("[data-suma-caso]").forEach((boton) => boton.addEventListener("click", () => aplicarCaso(boton.dataset.sumaCaso)));
  dialogo.addEventListener("input", () => { tiempo = 0; detener(); actualizar(); });
  dialogo.addEventListener("close", detener);
  document.addEventListener("visibilitychange", () => { if (document.hidden) detener(); });
  v.reducido.addEventListener("change", detener);
  v.enlazar("formula-suma", vista, () => aplicarCaso("oblicuas"));
})();
