(() => {
  "use strict";
  const lab = window.LabDinamica;
  const reducido = window.matchMedia("(prefers-reduced-motion: reduce)");
  function crear(id, titulo, introduccion, contenido) {
    const dialogo = document.createElement("dialog");
    dialogo.id = id; dialogo.className = "fv-dialogo";
    dialogo.setAttribute("aria-labelledby", id + "-titulo");
    dialogo.setAttribute("aria-describedby", id + "-intro");
    dialogo.innerHTML = `<header class="fv-cabecera"><h2 id="${id}-titulo">${titulo}</h2><form method="dialog"><button class="boton secundario" autofocus>Cerrar</button></form></header><div class="fv-cuerpo"><p class="fv-intro" id="${id}-intro">${introduccion}</p>${contenido}</div>`;
    document.body.append(dialogo);
    return { dialogo, $: (sufijo) => dialogo.querySelector("#" + id + "-" + sufijo),
      texto: (sufijo, texto) => { dialogo.querySelector("#" + id + "-" + sufijo).textContent = texto; } };
  }
  function campo(id, nombre, min, max, paso, valor, unidad = "") {
    return `<div class="campo"><div class="control-rango"><label for="${id}">${nombre}</label><output id="${id}-valor" for="${id}">${lab.numero(valor)}${unidad}</output></div><input type="range" id="${id}" min="${min}" max="${max}" step="${paso}" value="${valor}"></div>`;
  }
  function fondo(ctx, ancho, alto) {
    const gradiente = ctx.createLinearGradient(0, 0, ancho, alto);
    gradiente.addColorStop(0, "#101c3b"); gradiente.addColorStop(1, "#283d65");
    ctx.fillStyle = gradiente; ctx.fillRect(0, 0, ancho, alto);
    for (let x = 18; x < ancho; x += 26) for (let y = 18; y < alto; y += 26) {
      ctx.fillStyle = "#b5d2ff22"; ctx.fillRect(x, y, 1.5, 1.5);
    }
  }
  function rotulo(ctx, texto, x, y, color = "#d9e8ff", tamano = 16) {
    ctx.save(); ctx.font = `650 ${tamano}px system-ui, sans-serif`;
    const ancho = ctx.measureText(texto).width;
    x = Math.max(9, Math.min(ctx.canvas.clientWidth - ancho - 9, x));
    y = Math.max(22, Math.min(ctx.canvas.clientHeight - 12, y));
    ctx.fillStyle = "#132347ed"; ctx.fillRect(x - 3, y - tamano, ancho + 6, tamano + 6);
    ctx.fillStyle = color; ctx.fillText(texto, x, y); ctx.restore();
  }
  function lienzo(canvas, dibujar) {
    return lab.lienzo(canvas, (ctx, ancho, alto, datos) => {
      if (ancho < 1 || alto < 1) return;
      fondo(ctx, ancho, alto); dibujar(ctx, ancho, alto, datos);
    });
  }
  function ensayo() {
    const $ = (id) => document.getElementById(id);
    return window.ModeloPlanos.calcular({ masa: $("masa").valueAsNumber,
      angulo: $("angulo").valueAsNumber * ($("invertir-pendiente").checked ? -1 : 1),
      fuerza: $("fuerza").valueAsNumber, beta: $("beta").valueAsNumber,
      sentido: Number($("sentido").value), superficie: $("superficie").value });
  }
  function enlazar(botonId, vista, preparar) {
    const boton = document.getElementById(botonId);
    boton.setAttribute("aria-controls", vista.dialogo.id);
    boton.addEventListener("click", () => { vista.dialogo.showModal(); preparar(); vista.dialogo.scrollTop = 0; });
  }
  window.FormularioVisual = { ...lab, crear, campo, lienzo, rotulo, ensayo, enlazar, reducido,
    modelo: window.FormularioVisualModelo, n: (valor) => lab.numero(valor, 1) };
})();
