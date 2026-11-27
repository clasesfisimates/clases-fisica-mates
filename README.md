# La cueva del conocimiento

Material interactivo para las clases. Abre `index.html` con doble clic y elige Física o Matemáticas. Cada asignatura tendrá su propio índice de temas, siguiendo el orden en que se trabajen en clase.

## Añadir materiales

1. Crea una carpeta para el tema dentro de `fisica/` o `matematicas/` y añade un `index.html` para enlazar sus actividades. Añade un enlace al tema desde el índice de la asignatura.
2. Dentro del tema, crea una carpeta por simulación o actividad con su propio `index.html`. Guarda junto a él el JavaScript y el CSS que sean específicos de esa actividad. El CSS común está en `assets/estilos.css`.
3. Usa enlaces relativos que apunten al archivo `index.html` correspondiente. Para que las actividades funcionen con doble clic, carga JavaScript con `<script src="simulacion.js" defer></script>` y evita `fetch()` y los módulos de JavaScript para cargar archivos locales.

Usa HTML, CSS y JavaScript del navegador. Los controles y gráficos de las simulaciones deben indicar qué magnitud se está cambiando y sus unidades cuando corresponda.

En cada gráfica con vectores, mantén fija la longitud por unidad al cambiar los controles o avanzar la animación. Elige los rangos de los deslizadores para que quepan todas las flechas, incluidas las componentes y la resultante.

Aplica la clase `fisica` o `matematicas` al `<body>` de cada página de asignatura. La paleta, la navegación, las portadas y las tarjetas se definen en `assets/estilos.css`. Usa `cabecera-visual` para mantener el aspecto común de las portadas.

Añade las nuevas páginas al árbol en `assets/indice.js`. El mismo árbol alimenta el índice lateral de toda la web, con rutas relativas y la página actual resaltada.

Cada tema enlaza a su propia página `ejercicios-resueltos/index.html`. Usa `assets/ejercicios.css` para los esquemas y las resoluciones desplegables. Indica la ficha o el ejercicio de origen y marca las variantes cuando cambien el enunciado.

## Fórmulas interactivas

Carga `assets/formula-interactiva.css` y `assets/formula-interactiva.js` desde la página de la actividad con rutas relativas. Cada botón del formulario se conecta con `FormulaInteractiva.enlazar(boton, definicion)`. La definición indica el orden de las variables, sus unidades y escalas iniciales, y cómo calcular cada variable que se puede elegir como resultado. La ventana trabaja con una copia de los valores iniciales de la actividad.

La fórmula de Masa y peso es el primer ejemplo, en `fisica/dinamica/masa-y-peso/formula-peso.js`.

La misma página incluye debajo de los planetas una animación de la fuerza normal: caída, contacto con un suelo elástico idealizado y equilibrio. Permite pausar, elegir un paso, cambiar la masa y retirar el suelo. Los desplazamientos se amplían y las flechas conservan una escala fija de fuerza. Para comprobar su modelo: `node --test tests/normal.test.cjs`.

## Movimiento sobre planos

`fisica/dinamica/movimiento-sobre-planos/index.html` reúne el plano horizontal (θ = 0°) y el inclinado. Al iniciar, primero se descomponen y compensan los vectores; el reloj físico y el movimiento comienzan después de obtener la resultante. Se puede pausar, recorrer los pasos y cambiar el ritmo. Los enlaces de las dos actividades anteriores llevan a la sección nueva.

El modelo parte del reposo, usa rozamiento estático hasta su máximo y cinético al deslizar. El ángulo β del empuje se mide respecto al plano: positivo hacia fuera, negativo hacia dentro. Las condiciones que levantarían el bloque se señalan y no se simulan como movimiento sobre el plano.

El formulario incluye un taller visual de componentes: compara el peso en una rampa con un empuje oblicuo, construye sus triángulos y relaciona seno/coseno con el cateto opuesto/adyacente. Permite ajustar ángulo y magnitud o traer los valores del ensayo sin cambiarlo. Los dibujos mantienen una escala fija y explican los casos 0°, 45° y 90°. Los ejemplos numéricos de peso, normal, rozamiento y aceleración siguen los controles del ensayo; los signos y las fórmulas de movimiento se explican en apartados desplegables.

Las fórmulas de normal, límite estático y suma de fuerzas abren explicaciones visuales propias. La normal muestra el equilibrio perpendicular y la pérdida de contacto. El límite estático usa una analogía de un monigote sujetando una caja: aguanta hasta el máximo, luego es arrastrado y sigue oponiéndose. El sumatorio descompone seis fuerzas oblicuas, compensa cada eje y construye la resultante; incluye un caso de equilibrio. Las animaciones permiten pausa y se detienen al cerrar la ventana; con movimiento reducido usan estados estáticos o pasos. Sus cálculos se comprueban con `node --test tests/formulario-visual.test.cjs`.

Para comprobar el modelo físico: `node --test tests/planos.test.cjs`.

## Laboratorios de Dinámica

Poleas, muelles, gravitación, curvas y rebotes comparten los controles de reproducción de `fisica/dinamica/taller.js`. Cada escena y su formulario viven en el `simulacion.js` de la actividad. Los modelos se comprueban con `node --test tests/talleres-dinamica.test.cjs`.

## Polinomios y fracciones algebraicas

El taller permite escribir polinomios con términos como `2x^5 − 3x² + 1` o crear sus coeficientes a partir del grado. Calcula raíces reales aproximadas, detecta multiplicidades y conserva el factor restante sin descomponer. La división incluye una pizarra animada con pausa y navegación por escenas. Las identidades conectan áreas y fórmulas por colores y las fracciones muestran las transformaciones completas.

Para comprobar el modelo de polinomios: `node --test tests/polinomios.test.cjs`.

## GitHub Pages

Para publicarlo, selecciona la raíz (`/`) de la rama principal como origen de GitHub Pages. Esa carpeta ya contiene el `index.html` que sirve de portada y el archivo `.nojekyll` para servir los archivos directamente.
