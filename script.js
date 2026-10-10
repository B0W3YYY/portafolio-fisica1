// Portafolio Física I · script principal
// Ecuaciones (KaTeX), índice, gráficas (Chart.js) y simulación del salto.

// Temas de los próximos avances. Cuando agregue uno a la página:
// 1) copio una <section class="tema"> en index.html,
// 2) agrego su enlace al índice,
// 3) lo borro de esta lista.
const PROXIMOS = [
  "Frenado regenerativo en un vehículo eléctrico",
  "El coeficiente de restitución en un motor de videojuego",
  "Ruedas de reacción en satélites",
  "Asistencia gravitatoria de la Voyager",
  "Spring animations en interfaces",
  "Síntesis de sonido y armónicos",
  "Resonancia estructural y Tacoma Narrows",
  "Enfriamiento líquido de un centro de datos",
];

const G_TIERRA = 9.81;
const LOCAL = "es-CR";

document.addEventListener("DOMContentLoaded", () => {
  mostrarEcuaciones();
  prepararIndice();
  llenarProximos();
  const sim = prepararSimulacion();

  // Las gráficas esperan a que carguen las fuentes para no dibujarse con otra letra.
  const listas = document.fonts ? document.fonts.ready : Promise.resolve();
  listas.then(() => {
    if (window.Chart) crearGraficas();
    sim.dibujar();
  });

  // Si el sistema cambia entre modo claro y oscuro, se vuelven a pintar con los colores nuevos.
  const oscuro = window.matchMedia("(prefers-color-scheme: dark)");
  const alCambiar = () => { if (window.Chart) crearGraficas(); sim.dibujar(); };
  if (oscuro.addEventListener) oscuro.addEventListener("change", alCambiar);
});

// ---------- Utilidades ----------

const color = nombre => getComputedStyle(document.documentElement).getPropertyValue(nombre).trim();

// Número con coma decimal: num(2.5, 1) -> "2,5"
function num(valor, decimales = 2) {
  return valor.toLocaleString(LOCAL, {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });
}

// ---------- Ecuaciones ----------

function mostrarEcuaciones() {
  if (!window.renderMathInElement) return;
  renderMathInElement(document.body, {
    delimiters: [
      { left: "$$", right: "$$", display: true },
      { left: "\\(", right: "\\)", display: false },
    ],
    ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code"],
    throwOnError: false,
  });
}

// ---------- Índice ----------

function prepararIndice() {
  const boton = document.querySelector(".indice-boton");
  const lista = document.getElementById("indice-lista");
  const enlaces = [...lista.querySelectorAll("a")];

  const cerrar = () => {
    lista.classList.remove("abierto");
    boton.setAttribute("aria-expanded", "false");
  };

  boton.addEventListener("click", () => {
    const abierto = lista.classList.toggle("abierto");
    boton.setAttribute("aria-expanded", String(abierto));
  });
  enlaces.forEach(a => a.addEventListener("click", cerrar));

  // Marca en el índice la sección que se está leyendo.
  if (!("IntersectionObserver" in window)) return;
  const observador = new IntersectionObserver(entradas => {
    entradas.forEach(e => {
      if (!e.isIntersecting) return;
      enlaces.forEach(a => a.classList.toggle("activo", a.getAttribute("href") === "#" + e.target.id));
    });
  }, { rootMargin: "-35% 0px -60% 0px" });
  document.querySelectorAll("main section[id]").forEach(s => observador.observe(s));
}

// Candado dibujado en SVG (usa el color del texto).
const CANDADO = '<svg class="candado" viewBox="0 0 24 24" aria-hidden="true">' +
  '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';

// Cada tema que falta sale como una caja con "Tema N" y un candado.
// Los nombres siguen en PROXIMOS para saber cuántos son y para cuando los agregue.
function llenarProximos() {
  const ol = document.getElementById("listaProximos");
  const primero = Number(ol.getAttribute("start")) || 6;
  ol.innerHTML = "";
  PROXIMOS.forEach((titulo, i) => {
    const li = document.createElement("li");
    li.innerHTML = `<div><strong>Tema ${primero + i}</strong><span class="pronto">Próximamente</span></div>${CANDADO}`;
    ol.append(li);
  });
}

// ---------- Gráficas ----------

const graficas = [];

function crearGraficas() {
  graficas.forEach(g => g.destroy());
  graficas.length = 0;

  Chart.defaults.locale = LOCAL;
  Chart.defaults.font.family = color("--sans") || "sans-serif";
  Chart.defaults.font.size = 13;
  Chart.defaults.color = color("--tenue");
  Chart.defaults.borderColor = color("--linea");
  Chart.defaults.maintainAspectRatio = false;
  Chart.defaults.elements.point.radius = 0;
  Chart.defaults.elements.point.hoverRadius = 4;
  Chart.defaults.elements.line.borderWidth = 2.2;
  Chart.defaults.animation = false;

  graficasTema1();
  graficasTema4();
  graficaTema5();
}

// Gráfica de líneas con ejes lineales. unidad se usa en la etiqueta emergente.
function lineas(id, { ejeX, ejeY, unidad, series, extra = {}, plugins = [] }) {
  const lienzo = document.getElementById(id);
  if (!lienzo) return null;
  const g = new Chart(lienzo, {
    type: "line",
    data: { datasets: series },
    options: {
      parsing: false,
      interaction: { mode: "nearest", axis: "x", intersect: false },
      plugins: {
        legend: {
          position: "bottom",
          labels: { usePointStyle: true, boxWidth: 28, padding: 12, color: color("--tinta") },
        },
        tooltip: {
          callbacks: {
            label: c => ` ${c.dataset.label}: ${num(c.parsed.y, 2)} ${unidad}`,
          },
        },
      },
      scales: {
        x: { type: "linear", title: { display: true, text: ejeX, color: color("--tinta") }, ...(extra.x || {}) },
        y: { title: { display: true, text: ejeY, color: color("--tinta") }, ...(extra.y || {}) },
      },
    },
    plugins,
  });
  graficas.push(g);
  return g;
}

// En la leyenda, las series se muestran como una raya y los puntos sueltos como un círculo.
const serie = (etiqueta, datos, c, mas = {}) =>
  ({ label: etiqueta, data: datos, borderColor: c, backgroundColor: c, pointStyle: "line", ...mas });

// Tema 1: ruta del dron. x(t) = L(3τ² − 2τ³), y(t) = A sen(πτ), τ = t/T
function graficasTema1() {
  const L = 2500, A = 300, T = 150;
  const d = { x: [], y: [], vx: [], vy: [], v: [], ax: [], ay: [], ruta: [] };

  for (let t = 0; t <= T; t++) {
    const s = t / T;
    const x = L * (3 * s * s - 2 * s ** 3);
    const y = A * Math.sin(Math.PI * s);
    const vx = (6 * L / T) * (s - s * s);
    const vy = (Math.PI * A / T) * Math.cos(Math.PI * s);
    const ax = (6 * L / (T * T)) * (1 - 2 * s);
    const ay = -((Math.PI / T) ** 2) * A * Math.sin(Math.PI * s);
    d.x.push({ x: t, y: x });
    d.y.push({ x: t, y });
    d.vx.push({ x: t, y: vx });
    d.vy.push({ x: t, y: vy });
    d.v.push({ x: t, y: Math.hypot(vx, vy) });
    d.ax.push({ x: t, y: ax });
    d.ay.push({ x: t, y: ay });
    d.ruta.push({ x, y });
  }

  const c1 = color("--s1"), c2 = color("--s2"), c3 = color("--s3");
  const punto = { pointRadius: 5, pointHoverRadius: 6, showLine: false, pointStyle: "circle" };

  lineas("g1ruta", {
    ejeX: "x, hacia el este (m)", ejeY: "y, hacia el norte (m)", unidad: "m",
    series: [
      serie("Ruta del dron", d.ruta, c1),
      serie("Bodega (salida)", [{ x: 0, y: 0 }], c3, punto),
      serie("Cliente (entrega)", [{ x: L, y: 0 }], c2, punto),
    ],
    extra: { y: { min: 0, max: 350 } },
  });

  lineas("g1pos", {
    ejeX: "Tiempo, t (s)", ejeY: "Posición (m)", unidad: "m",
    series: [serie("x(t)", d.x, c1), serie("y(t)", d.y, c2)],
  });

  lineas("g1vel", {
    ejeX: "Tiempo, t (s)", ejeY: "Velocidad (m/s)", unidad: "m/s",
    series: [
      serie("vx(t)", d.vx, c1),
      serie("vy(t)", d.vy, c2),
      serie("|v| (rapidez)", d.v, c3, { borderDash: [6, 4] }),
    ],
  });

  lineas("g1acc", {
    ejeX: "Tiempo, t (s)", ejeY: "Aceleración (m/s²)", unidad: "m/s²",
    series: [serie("ax(t)", d.ax, c1), serie("ay(t)", d.ay, c2)],
  });
}

// Plugin: sombrea una franja vertical entre dos valores de x, con un texto arriba.
function franja(desde, hasta, texto, relleno, colorTexto) {
  return {
    id: "franja",
    beforeDatasetsDraw(chart) {
      const { ctx, chartArea: a, scales: { x } } = chart;
      const x1 = x.getPixelForValue(desde), x2 = x.getPixelForValue(hasta);
      ctx.save();
      ctx.fillStyle = relleno;
      ctx.fillRect(x1, a.top, x2 - x1, a.bottom - a.top);
      ctx.fillStyle = colorTexto;
      ctx.font = `12px ${Chart.defaults.font.family}`;
      ctx.textAlign = "center";
      ctx.fillText(texto, (x1 + x2) / 2, a.top + 14);
      ctx.restore();
    },
  };
}

// Plugin: textos fijos dentro del área de la gráfica (por ejemplo "llanta fría").
function rotulos(lista) {
  return {
    id: "rotulos",
    afterDatasetsDraw(chart) {
      const { ctx, scales: { x, y } } = chart;
      ctx.save();
      ctx.font = `12px ${Chart.defaults.font.family}`;
      ctx.fillStyle = color("--tenue");
      lista.forEach(r => {
        ctx.textAlign = r.alinear || "center";
        ctx.fillText(r.texto, x.getPixelForValue(r.x), y.getPixelForValue(r.y));
      });
      ctx.restore();
    },
  };
}

// Plugin: línea vertical punteada en x = valor, con etiqueta.
function lineaVertical(valor, texto) {
  return {
    id: "lineaVertical",
    afterDatasetsDraw(chart) {
      const { ctx, chartArea: a, scales: { x } } = chart;
      const px = x.getPixelForValue(valor);
      ctx.save();
      ctx.strokeStyle = color("--tenue");
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(px, a.top);
      ctx.lineTo(px, a.bottom);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = color("--tenue");
      ctx.font = `12px ${Chart.defaults.font.family}`;
      ctx.textAlign = "right";
      ctx.fillText(texto, px - 5, a.top + 14);
      ctx.restore();
    },
  };
}

// Tema 4: agarre según temperatura y fuerza lateral según carga (datos aproximados).
function graficasTema4() {
  const c1 = color("--s1"), c2 = color("--s2");

  // Curva ilustrativa con máximo en 100 °C, el centro de la ventana del C5 de 2019 (85 a 115 °C).
  const temperatura = [];
  for (let T = 40; T <= 150; T += 2) {
    const mu = 0.9 + 0.8 * Math.exp(-(((T - 100) / 25) ** 2));
    temperatura.push({ x: T, y: mu });
  }
  lineas("g4temp", {
    ejeX: "Temperatura de la llanta (°C)", ejeY: "Agarre, μ", unidad: "",
    series: [serie("μ aproximado (compuesto blando)", temperatura, c1)],
    extra: { x: { min: 40, max: 150 }, y: { min: 0.6, max: 1.9 } },
    plugins: [
      franja(85, 115, "ventana C5 (2019)", color("--ventana"), color("--s3")),
      rotulos([
        { texto: "llanta fría", x: 58, y: 0.75 },
        { texto: "sobrecalentada", x: 135, y: 0.75 },
      ]),
    ],
  });

  // μ(Fz) = μ0 − k·Fz  frente al modelo de clase con μ fijo
  const mu0 = 1.8, k = 0.00008;
  const real = [], simple = [];
  for (let Fz = 0; Fz <= 8000; Fz += 250) {
    real.push({ x: Fz, y: (mu0 - k * Fz) * Fz });
    simple.push({ x: Fz, y: mu0 * Fz });
  }
  lineas("g4carga", {
    ejeX: "Carga vertical, Fz (N)", ejeY: "Fy máxima (N)", unidad: "N",
    series: [
      serie("Modelo de clase: μ fijo = 1,8", simple, c2, { borderDash: [6, 4] }),
      serie("Llanta real: μ baja con la carga", real, c1),
    ],
    extra: { x: { min: 0, max: 8000 } },
  });
}

// Tema 5: fuerza del gatillo por tramos.
function graficaTema5() {
  const k1 = 0.3, k2 = 2.5, xp = 6;
  const tramos = [], hooke = [];
  for (let x = 0; x <= 10.001; x += 0.25) {
    const F = x < xp ? k1 * x : k1 * xp + k2 * (x - xp);
    tramos.push({ x, y: F });
    hooke.push({ x, y: k1 * x });
  }
  lineas("g5hooke", {
    ejeX: "Desplazamiento del gatillo, x (mm)", ejeY: "Fuerza, |F| (N)", unidad: "N",
    series: [
      serie("Resorte virtual por tramos (arco)", tramos, color("--s1")),
      serie("Hooke con una sola k: |F| = k₁x", hooke, color("--s2"), { borderDash: [6, 4] }),
    ],
    extra: { x: { min: 0, max: 10 }, y: { min: 0 } },
    plugins: [lineaVertical(xp, "xp = 6 mm")],
  });
}

// ---------- Tema 2: simulación del salto ----------

function prepararSimulacion() {
  const lienzo = document.getElementById("simSalto");
  const ctx = lienzo.getContext("2d");
  const $ = id => document.getElementById(id);
  const control = { v0: $("v0"), g: $("grav"), vx: $("vx") };
  let animacion = null;
  let ancho = 0, alto = 0;

  // El lienzo se ajusta al ancho real y a la densidad de la pantalla, así el texto no sale borroso ni diminuto.
  function ajustarTamano() {
    const dpr = window.devicePixelRatio || 1;
    ancho = lienzo.clientWidth || 600;
    alto = Math.round(Math.min(Math.max(ancho * 0.5, 230), 380));
    lienzo.style.height = alto + "px";
    lienzo.width = Math.round(ancho * dpr);
    lienzo.height = Math.round(alto * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  const valores = () => ({ v0: +control.v0.value, g: +control.g.value, vx: +control.vx.value });

  // Paso "redondo" para las marcas de los ejes: 1, 2 o 5 por una potencia de 10.
  function pasoBonito(bruto) {
    const p = Math.pow(10, Math.floor(Math.log10(bruto)));
    const n = bruto / p;
    return (n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10) * p;
  }

  function dibujar(progreso = null) {
    if (!ancho) ajustarTamano();
    const { v0, g, vx } = valores();

    // Resultados con las fórmulas de caída libre
    const h = v0 * v0 / (2 * g), tAire = 2 * v0 / g, alcance = vx * tAire;
    const hT = v0 * v0 / (2 * G_TIERRA), tT = 2 * v0 / G_TIERRA, alcanceT = vx * tT;

    $("v0Out").textContent = num(v0, 1) + " m/s";
    $("gOut").textContent = num(g, 2) + " m/s²";
    $("vxOut").textContent = num(vx, 1) + " m/s";
    $("hOut").textContent = num(h, 2) + " m";
    $("tOut").textContent = num(tAire, 2) + " s";
    $("rOut").textContent = num(alcance, 2) + " m";
    $("ratioOut").textContent = num(g / G_TIERRA, 2) + " veces";

    // Escala: misma cantidad de píxeles por metro en x y en y
    const m = { izq: 46, der: 16, arr: 14, aba: 36 };
    const anchoUtil = ancho - m.izq - m.der, altoUtil = alto - m.arr - m.aba;
    const xMax = Math.max(alcance, alcanceT) * 1.06;
    const yMax = Math.max(h, hT) * 1.18;
    const esc = Math.min(anchoUtil / xMax, altoUtil / yMax);
    const px = x => m.izq + x * esc;
    const py = y => alto - m.aba - y * esc;
    const verX = anchoUtil / esc, verY = altoUtil / esc;
    const paso = pasoBonito(Math.max(verX, verY) / 7);
    const dec = paso < 1 ? Math.ceil(-Math.log10(paso)) : 0;

    const tinta = color("--tinta"), tenue = color("--tenue"), linea = color("--linea");
    const fuente = color("--sans") || "sans-serif";
    ctx.clearRect(0, 0, ancho, alto);
    ctx.font = `12px ${fuente}`;
    ctx.lineWidth = 1;

    // Cuadrícula y números de los ejes
    ctx.strokeStyle = linea;
    ctx.fillStyle = tenue;
    ctx.textAlign = "center";
    for (let x = 0; x <= verX + 1e-9; x += paso) {
      ctx.beginPath(); ctx.moveTo(px(x), py(0)); ctx.lineTo(px(x), m.arr); ctx.stroke();
      ctx.fillText(num(x, dec), px(x), py(0) + 16);
    }
    ctx.textAlign = "right";
    for (let y = 0; y <= verY + 1e-9; y += paso) {
      ctx.beginPath(); ctx.moveTo(m.izq, py(y)); ctx.lineTo(ancho - m.der, py(y)); ctx.stroke();
      if (y > 0) ctx.fillText(num(y, dec), m.izq - 6, py(y) + 4);
    }

    // Suelo
    ctx.strokeStyle = tinta;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(m.izq, py(0)); ctx.lineTo(ancho - m.der, py(0)); ctx.stroke();

    // Nombres de los ejes
    ctx.fillStyle = tinta;
    ctx.textAlign = "right";
    ctx.fillText("x (m)", ancho - m.der, alto - 6);
    ctx.save();
    ctx.translate(13, m.arr + altoUtil / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.fillText("y (m)", 0, 0);
    ctx.restore();

    // Parábolas: la de la Tierra punteada, la elegida continua
    parabola(v0, G_TIERRA, vx, tT, tenue, 1.6, [5, 5]);
    parabola(v0, g, vx, tAire, color("--s1"), 2.6, []);

    // Punto más alto
    const xCima = vx * tAire / 2;
    ctx.fillStyle = color("--acento");
    ctx.beginPath(); ctx.arc(px(xCima), py(h), 3.5, 0, 2 * Math.PI); ctx.fill();
    const rotulo = `h máx = ${num(h, 2)} m`;
    const anchoRotulo = ctx.measureText(rotulo).width;
    const aLaIzquierda = px(xCima) + 8 + anchoRotulo > ancho - m.der;
    ctx.textAlign = aLaIzquierda ? "right" : "left";
    ctx.fillText(rotulo, px(xCima) + (aLaIzquierda ? -8 : 8), Math.max(py(h) - 6, m.arr + 10));

    // Personaje: un cuadrado que sigue la trayectoria
    const t = progreso === null ? 0 : progreso * tAire;
    const cx = vx * t, cy = Math.max(v0 * t - 0.5 * g * t * t, 0);
    const lado = 14;
    ctx.fillStyle = color("--s2");
    ctx.fillRect(px(cx) - lado / 2, py(cy) - lado, lado, lado);

    function parabola(v0, g, vx, tTotal, c, grosor, guiones) {
      ctx.strokeStyle = c;
      ctx.lineWidth = grosor;
      ctx.setLineDash(guiones);
      ctx.beginPath();
      const pasos = 160;
      for (let i = 0; i <= pasos; i++) {
        const t = tTotal * i / pasos;
        const X = px(vx * t), Y = py(v0 * t - 0.5 * g * t * t);
        if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  function saltar() {
    cancelAnimationFrame(animacion);
    const { v0, g } = valores();
    const tAire = 2 * v0 / g;
    const inicio = performance.now();
    const cuadro = ahora => {
      const p = Math.min((ahora - inicio) / 1000 / tAire, 1); // en tiempo real
      dibujar(p);
      if (p < 1) animacion = requestAnimationFrame(cuadro);
    };
    animacion = requestAnimationFrame(cuadro);
  }

  Object.values(control).forEach(c => c.addEventListener("input", () => {
    cancelAnimationFrame(animacion);
    dibujar();
  }));
  $("btnSaltar").addEventListener("click", saltar);
  $("btnTierra").addEventListener("click", () => {
    control.g.value = G_TIERRA;
    cancelAnimationFrame(animacion);
    dibujar();
  });

  if ("ResizeObserver" in window) {
    new ResizeObserver(() => { ajustarTamano(); dibujar(); }).observe(lienzo.parentElement);
  } else {
    window.addEventListener("resize", () => { ajustarTamano(); dibujar(); });
  }

  ajustarTamano();
  dibujar();
  return { dibujar: () => { ajustarTamano(); dibujar(); } };
}
