(() => {
  "use strict";
  const v = window.FormularioVisual;
  const vista = v.crear("fn", "Normal: el empuje del plano", "La normal es perpendicular a la superficie. Su valor se ajusta para equilibrar las fuerzas que acercan o alejan al objeto del plano, mientras sigue apoyado.", `
    <div class="fv-layout"><div class="fv-visual">
      <canvas class="fv-lienzo" id="fn-lienzo" role="img" aria-label="Bloque con las fuerzas perpendiculares al plano."></canvas>
      <div class="fv-leyenda"><span style="--color-fuerza:#94caff">Normal N</span><span style="--color-fuerza:#ffba80">Peso perpendicular P · cos θ</span><span style="--color-fuerza:#8be9cc">Empuje perpendicular F⊥</span></div>
      <p class="fv-ayuda">El esquema separa las flechas para que se vean. Todas actúan sobre el mismo bloque y comparten una misma escala.</p>
      <div class="fv-ecuacion" id="fn-cuenta"></div>
      <div class="fv-relato" role="status" aria-atomic="true"><h3 id="fn-estado"></h3><p id="fn-relato"></p></div>
    </div><div class="fv-ajustes"><h3>Prueba qué cambia la normal</h3>
      <div class="fv-ejemplos" role="group" aria-label="Ejemplos de fuerza normal"><button type="button" data-normal-ejemplo="apoyado">Solo el apoyo</button><button type="button" data-normal-ejemplo="fuera">Tirar hacia fuera</button><button type="button" data-normal-ejemplo="dentro">Empujar hacia dentro</button></div>
      ${v.campo("fn-peso", "Peso completo · P", 0, 100, 0.1, 60, " N")}
      ${v.campo("fn-angulo", "Inclinación · θ", 0, 60, 1, 0, "°")}
      ${v.campo("fn-empuje", "Empuje perpendicular · F⊥", -80, 80, 0.1, 0, " N")}
      <p class="fv-ayuda">F⊥ positivo: tiras hacia fuera. Negativo: empujas contra el plano.</p>
      <label class="casilla"><input type="checkbox" id="fn-completo"> Ver también el peso vertical P</label>
      <button type="button" class="boton secundario" id="fn-traer">Traer valores del ensayo</button>
    </div></div>
    <div class="fv-desarrollo"><h3>La fórmula sale de equilibrar una dirección</h3>
      <p><span class="fv-peso">P · cos θ empuja hacia el plano.</span> <span class="fv-normal">N empuja hacia fuera.</span> F⊥ puede ayudar a uno u otro lado.</p>
      <p class="ecuacion">N + F⊥ − P · cos θ = 0<br>N = P · cos θ − F⊥</p>
      <p>En horizontal y sin otro empuje vertical: <strong>N = P</strong>. En una rampa solo se compensa la parte perpendicular del peso. La parte paralela se estudia al calcular el movimiento.</p>
    </div>`);
  const { $, texto, dialogo } = vista;
  const pintar = v.lienzo($("lienzo"), (ctx, ancho, alto, d) => {
    const theta = d.angulo * Math.PI / 180;
    const u = { x: Math.cos(theta), y: -Math.sin(theta) };
    const fuera = { x: -Math.sin(theta), y: -Math.cos(theta) };
    const centro = { x: ancho / 2, y: alto * 0.48 };
    const contacto = { x: centro.x - fuera.x * 16, y: centro.y - fuera.y * 16 };
    const izquierda = { x: contacto.x - u.x * ancho, y: contacto.y - u.y * ancho };
    const derecha = { x: contacto.x + u.x * ancho, y: contacto.y + u.y * ancho };
    ctx.beginPath(); ctx.moveTo(izquierda.x, izquierda.y); ctx.lineTo(derecha.x, derecha.y);
    ctx.lineTo(ancho, alto); ctx.lineTo(0, alto); ctx.closePath(); ctx.fillStyle = "#344e73"; ctx.fill();
    v.linea(ctx, izquierda.x, izquierda.y, derecha.x, derecha.y, "#aecbfa", 3);
    const altura = d.contacto ? 0 : 30;
    const objeto = { x: centro.x + fuera.x * altura, y: centro.y + fuera.y * altura };
    v.bloque(ctx, objeto.x, objeto.y, 50, 28, -theta);
    function fuerza(valor, origen, simbolo, color) {
      if (Math.abs(valor) < 0.1) return;
      const punta = { x: origen.x + fuera.x * valor * 0.8, y: origen.y + fuera.y * valor * 0.8 };
      v.flecha(ctx, origen.x, origen.y, punta.x - origen.x, punta.y - origen.y, color, 4);
      v.rotulo(ctx, simbolo, punta.x + (valor > 0 ? -18 : 8), punta.y + (valor > 0 ? -10 : 23), color);
    }
    fuerza(d.normal, contacto, "N", "#94caff");
    const pesoCoincide = d.completo && d.angulo === 0;
    fuerza(-d.pesoPerpendicular, { x: objeto.x - u.x * 20, y: objeto.y - u.y * 20 }, pesoCoincide ? "P = P⊥" : "P⊥", "#ffba80");
    fuerza(d.empuje, { x: objeto.x + u.x * 25, y: objeto.y + u.y * 25 }, "F⊥", "#8be9cc");
    if (d.completo && !pesoCoincide && d.peso > 0) {
      v.flecha(ctx, objeto.x, objeto.y, 0, d.peso * 0.8, "#ffd1a8", 2.5);
      v.rotulo(ctx, "P", objeto.x + 9, objeto.y + d.peso * 0.8 + 22, "#ffd1a8");
    }
    const esquina = { x: contacto.x + u.x * 12, y: contacto.y + u.y * 12 };
    v.linea(ctx, esquina.x, esquina.y, esquina.x + fuera.x * 12, esquina.y + fuera.y * 12, "#dce8ff", 1.5);
    v.linea(ctx, esquina.x + fuera.x * 12, esquina.y + fuera.y * 12, contacto.x + fuera.x * 12, contacto.y + fuera.y * 12, "#dce8ff", 1.5);
    v.rotulo(ctx, "Siempre perpendicular: 90°", 14, 30, "#dce8ff", 14);
    v.rotulo(ctx, d.contacto ? "El plano empuja hacia fuera" : "Sin contacto: N = 0", 14, alto - 20, "#dce8ff", 14);
  });
  function actualizar() {
    const peso = $("peso").valueAsNumber, angulo = $("angulo").valueAsNumber, empuje = $("empuje").valueAsNumber;
    const d = { ...v.modelo.normal(peso, angulo, empuje), peso, angulo, empuje, completo: $("completo").checked };
    for (const [id, valor, unidad] of [["peso", peso, " N"], ["angulo", angulo, "°"], ["empuje", empuje, " N"]]) texto(id + "-valor", v.n(valor) + unidad);
    texto("cuenta", d.contacto ? `N = ${v.n(peso)} · cos ${v.n(angulo)}° − (${v.n(empuje)}) ≈ ${v.n(d.normal)} N`
      : `La cuenta pide ${v.n(d.requerida)} N. El plano no puede tirar: N = 0 N.`);
    texto("estado", !d.contacto ? "El bloque pierde el apoyo" : empuje > 0 ? "Tirar hacia fuera alivia el apoyo" : empuje < 0 ? "Empujar hacia dentro carga el apoyo" : "El plano sostiene la parte perpendicular del peso");
    texto("relato", !d.contacto ? "Has tirado hacia fuera más de lo que el peso empuja contra la superficie. Ya no hay equilibrio apoyado: el bloque se separa."
      : empuje > 0 ? `El peso aporta ${v.n(d.pesoPerpendicular)} N hacia el plano y tu tirón ayuda a sostenerlo. El plano solo necesita aportar ${v.n(d.normal)} N.`
        : empuje < 0 ? `A los ${v.n(d.pesoPerpendicular)} N del peso se añaden ${v.n(Math.abs(empuje))} N de empuje hacia dentro. El plano responde con ${v.n(d.normal)} N hacia fuera.`
          : `La normal equilibra ${v.n(d.pesoPerpendicular)} N hacia el plano. Eso no borra el peso: hace cero la resultante perpendicular.`);
    $("lienzo").setAttribute("aria-label", `Bloque en un plano de ${v.n(angulo)} grados. Peso perpendicular ${v.n(d.pesoPerpendicular)} N; empuje perpendicular ${v.n(empuje)} N; normal ${v.n(d.normal)} N.`);
    pintar(d);
  }
  function traer() {
    const d = v.ensayo(); $("peso").value = d.peso; $("angulo").value = Math.abs(d.angulo);
    $("empuje").value = Math.round(d.fuerzaPerpendicular * 10) / 10; actualizar();
  }
  dialogo.addEventListener("input", actualizar);
  dialogo.querySelectorAll("[data-normal-ejemplo]").forEach((boton) => boton.addEventListener("click", () => {
    $("peso").value = 60; $("angulo").value = 0;
    $("empuje").value = { apoyado: 0, fuera: 25, dentro: -25 }[boton.dataset.normalEjemplo]; actualizar();
  }));
  $("traer").addEventListener("click", traer);
  v.enlazar("formula-normal", vista, traer);
})();
