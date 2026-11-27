(() => {
  const numero = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 });
  const numeroPequeno = new Intl.NumberFormat("es-ES", { notation: "scientific", maximumSignificantDigits: 3 });
  let dialogo;

  function formato(valor) {
    return Math.abs(valor) >= 0.01 || valor === 0 ? numero.format(valor) : numeroPequeno.format(valor);
  }

  function crearDialogo() {
    const ventana = document.createElement("dialog");
    ventana.className = "fi-ventana";
    ventana.setAttribute("aria-labelledby", "fi-titulo");
    ventana.innerHTML = `
      <div class="fi-cabecera">
        <h2 id="fi-titulo">Fórmula interactiva</h2>
        <form method="dialog"><button class="fi-cerrar" autofocus>Cerrar</button></form>
      </div>
      <p class="fi-instrucciones">Pulsa una letra para elegir qué variable calcular. Arrastra las otras barras para cambiar sus valores.</p>
      <div class="fi-tablero" aria-label="Variables de la fórmula"></div>
      <p class="fi-escalas">Cada barra usa su propia escala.</p>
      <div class="fi-calculo">
        <p class="fi-objetivo" role="status"></p>
        <p class="fi-despeje"></p>
        <p class="fi-nota"></p>
      </div>`;
    document.body.append(ventana);
    return ventana;
  }

  function crearVariable(variable, operador) {
    const contenedor = document.createElement("div");
    contenedor.className = "fi-variable";
    contenedor.dataset.variable = variable.id;
    contenedor.innerHTML = `
      <div class="fi-grafico">
        <div class="fi-pista" aria-hidden="true"><div class="fi-nivel"></div></div>
        <input class="fi-rango" type="range" step="any">
      </div>
      <div class="fi-letra"><button type="button" class="fi-elegir"></button><span class="fi-operador" aria-hidden="true"></span></div>
      <span class="fi-nombre"></span>
      <output class="fi-valor"></output>
      <span class="fi-escala"></span>`;
    const boton = contenedor.querySelector(".fi-elegir");
    const control = contenedor.querySelector("input");
    const salida = contenedor.querySelector("output");
    boton.textContent = variable.id;
    boton.setAttribute("aria-label", "Calcular " + variable.nombre.toLowerCase() + " (" + variable.id + ")");
    control.setAttribute("aria-label", variable.nombre + " (" + variable.id + ") en " + variable.unidad);
    salida.setAttribute("aria-label", variable.nombre);
    contenedor.querySelector(".fi-operador").textContent = operador ?? "";
    contenedor.querySelector(".fi-nombre").textContent = variable.nombre;
    return {
      variable, contenedor, boton, control, salida,
      escala: contenedor.querySelector(".fi-escala"),
      nivel: contenedor.querySelector(".fi-nivel"),
      min: variable.min ?? 0,
      max: variable.max,
    };
  }

  function pintarVariable(campo, valor, seleccionado) {
    const { contenedor, boton, variable, control, salida, nivel, escala } = campo;
    const valido = Number.isFinite(valor);
    if (valido) {
      // Conserva el resultado exacto si se convierte en un valor editable.
      campo.min = Math.min(campo.min, valor);
      campo.max = Math.max(campo.max, valor);
    }
    const lectura = valido ? formato(valor) + " " + variable.unidad : "—";
    const fraccion = valido ? (valor - campo.min) / (campo.max - campo.min) : 0;
    contenedor.dataset.objetivo = String(seleccionado);
    boton.setAttribute("aria-pressed", String(seleccionado));
    control.disabled = seleccionado;
    control.min = campo.min;
    control.max = campo.max;
    control.value = valido ? valor : campo.min;
    control.setAttribute("aria-valuetext", lectura);
    salida.textContent = lectura;
    escala.textContent = formato(campo.min) + "–" + formato(campo.max) + " " + variable.unidad;
    nivel.style.height = fraccion * 100 + "%";
  }

  function abrir(definicion) {
    dialogo ??= crearDialogo();
    const tablero = dialogo.querySelector(".fi-tablero");
    const objetivoTexto = dialogo.querySelector(".fi-objetivo");
    const despejeTexto = dialogo.querySelector(".fi-despeje");
    const nota = dialogo.querySelector(".fi-nota");
    const valores = { ...definicion.leerValores() };
    let objetivo = definicion.objetivoInicial;

    const campos = definicion.variables.map((variable, indice) => crearVariable(variable, definicion.operadores[indice]));
    tablero.style.setProperty("--cantidad", campos.length);
    tablero.replaceChildren(...campos.map((campo) => campo.contenedor));

    function actualizar() {
      const despeje = definicion.despejes[objetivo];
      const resultado = despeje.calcular(valores);
      const valido = Number.isFinite(resultado);
      if (valido) valores[objetivo] = resultado;
      for (const campo of campos) {
        const seleccionado = campo.variable.id === objetivo;
        pintarVariable(campo, seleccionado ? resultado : valores[campo.variable.id], seleccionado);
        if (seleccionado) objetivoTexto.textContent = "Calculando " + campo.variable.nombre.toLowerCase() + " (" + objetivo + ")";
      }
      despejeTexto.textContent = despeje.expresion;
      nota.textContent = valido ? despeje.nota ?? "" : despeje.error ?? "El resultado no está definido con estos valores.";
      nota.dataset.error = String(!valido);
    }

    for (const campo of campos) {
      campo.boton.addEventListener("click", () => {
        if (!Object.hasOwn(definicion.despejes, campo.variable.id)) return;
        objetivo = campo.variable.id;
        actualizar();
      });
      campo.boton.disabled = !Object.hasOwn(definicion.despejes, campo.variable.id);
      campo.control.addEventListener("input", () => {
        valores[campo.variable.id] = Number(campo.control.valueAsNumber.toFixed(campo.variable.decimales ?? 2));
        actualizar();
      });
    }

    actualizar();
    dialogo.showModal();
  }

  window.FormulaInteractiva = {
    enlazar(boton, definicion) {
      boton.addEventListener("click", () => abrir(definicion));
    },
  };
})();
