(function (raiz) {
  "use strict";
  const limpiar = (valor) => Math.abs(valor) < 1e-9 ? 0 : valor;
  function normal(peso, angulo, perpendicular) {
    const pesoPerpendicular = peso * Math.cos(angulo * Math.PI / 180);
    const requerida = limpiar(pesoPerpendicular - perpendicular);
    return { pesoPerpendicular, requerida, normal: Math.max(0, requerida), contacto: requerida >= 0 };
  }
  function rozamiento(empuje, normal, coeficiente) {
    const limite = normal * coeficiente;
    const desliza = empuje > limite + 1e-9;
    // La analogía usa un coeficiente cinético menor que el estático.
    const resistencia = desliza ? 0.7 * limite : empuje;
    return { limite, desliza, resistencia, resultante: limpiar(empuje - resistencia) };
  }
  function sumar(fuerzas) {
    const componentes = fuerzas.map((f) => ({ ...f,
      x: limpiar(f.magnitud * Math.cos(f.angulo * Math.PI / 180)),
      y: limpiar(f.magnitud * Math.sin(f.angulo * Math.PI / 180)),
    }));
    const total = (eje, signo) => componentes.reduce((suma, f) => suma + (f[eje] * signo > 0 ? Math.abs(f[eje]) : 0), 0);
    const positivaX = total("x", 1), negativaX = total("x", -1);
    const positivaY = total("y", 1), negativaY = total("y", -1);
    const x = limpiar(positivaX - negativaX), y = limpiar(positivaY - negativaY);
    return { componentes, positivaX, negativaX, positivaY, negativaY, x, y,
      modulo: Math.hypot(x, y), angulo: x === 0 && y === 0 ? null : Math.atan2(y, x) * 180 / Math.PI };
  }
  const modelo = { normal, rozamiento, sumar };
  if (typeof module !== "undefined" && module.exports) module.exports = modelo;
  else raiz.FormularioVisualModelo = modelo;
})(typeof window !== "undefined" ? window : globalThis);
