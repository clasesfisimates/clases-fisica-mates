(() => {
  const casos = [
    {
      nombre: "Control de fábricas",
      inicio: "Pieza",
      etapas: [
        { nombre: "Fábrica", salidas: ["Fábrica A", "Fábrica B"], pesos: [60] },
        { nombre: "Estado", salidas: ["Defectuosa", "Correcta"], pesos: [10, 25] },
      ],
    },
    {
      nombre: "Preparar un examen",
      inicio: "Estudiante",
      etapas: [
        { nombre: "Clase", salidas: ["Presencial", "En línea"], pesos: [55] },
        { nombre: "Práctica", salidas: ["Practicó", "No practicó"], pesos: [75, 45] },
        { nombre: "Examen", salidas: ["Aprobó", "No aprobó"], pesos: [85, 35] },
      ],
    },
    {
      nombre: "Envío de un paquete",
      inicio: "Paquete",
      etapas: [
        { nombre: "Servicio", salidas: ["Exprés", "Estándar"], pesos: [40] },
        { nombre: "Almacén", salidas: ["Norte", "Sur"], pesos: [75, 35] },
        { nombre: "Traslado", salidas: ["Directo", "Con escala"], pesos: [85, 55] },
        { nombre: "Entrega", salidas: ["A tiempo", "Con retraso"], pesos: [95, 65] },
      ],
    },
    {
      nombre: "Cultivo en un huerto",
      inicio: "Planta",
      etapas: [
        { nombre: "Cultivo", salidas: ["Invernadero", "Aire libre"], pesos: [50] },
        { nombre: "Riego", salidas: ["Regular", "Irregular"], pesos: [80, 50] },
        { nombre: "Humedad", salidas: ["Adecuada", "Baja"], pesos: [85, 30] },
        { nombre: "Brote", salidas: ["Fuerte", "Débil"], pesos: [80, 40] },
        { nombre: "Cosecha", salidas: ["Abundante", "Escasa"], pesos: [90, 40] },
      ],
    },
  ];

  function construirArbol(inicio, etapas) {
    const hojas = [];
    function crear(nombre, rama, acumulada, ruta, anterior, profundidad) {
      const nodo = { nombre, rama, acumulada, ruta, anterior, profundidad, hijos: [] };
      if (profundidad === etapas.length) {
        hojas.push(nodo);
        return nodo;
      }
      const { salidas, pesos } = etapas[profundidad];
      const p = pesos[anterior] / 100;
      nodo.hijos = salidas.map((salida, i) => {
        const probabilidad = i === 0 ? p : 1 - p;
        return crear(salida, probabilidad, acumulada * probabilidad, ruta + i, i, profundidad + 1);
      });
      return nodo;
    }
    const raiz = crear(inicio, 1, 1, "", 0, 0);
    return { raiz, hojas };
  }

  function resumir(hojas, observado, origen) {
    const caminos = hojas.filter(({ anterior }) => anterior === observado);
    const total = caminos.reduce((suma, { acumulada }) => suma + acumulada, 0);
    const conjunto = caminos.reduce((suma, hoja) => suma + (hoja.ruta.startsWith(String(origen)) ? hoja.acumulada : 0), 0);
    return { caminos, total, conjunto, posterior: total > 0 ? conjunto / total : null };
  }

  const colores = [
    { nombre: "Roja", inicial: 3, clase: "roja" },
    { nombre: "Azul", inicial: 4, clase: "azul" },
    { nombre: "Verde", inicial: 5, clase: "verde" },
  ];
  const llenarUrna = () => colores.flatMap(({ inicial }, color) =>
    Array.from({ length: inicial }, (_, id) => ({ color, id: `${color}-${id}` }))
  );
  const contarColores = (bolas) => {
    const cantidades = colores.map(() => 0);
    for (const { color } of bolas) cantidades[color]++;
    return cantidades;
  };
  function sacarBola(bolas, azar = Math.random, conReposicion = false) {
    if (bolas.length === 0) return null;
    const indice = Math.floor(azar() * bolas.length);
    return conReposicion ? bolas[indice] : bolas.splice(indice, 1)[0];
  }

  const modelo = { casos, construirArbol, resumir, colores, llenarUrna, contarColores, sacarBola };
  if (typeof module === "object" && module.exports) module.exports = modelo;
  else window.ModeloProbabilidad = modelo;
})();
