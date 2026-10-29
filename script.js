// Portafolio Física I · script principal
// Ecuaciones (KaTeX), índice, temas desplegables, gráficas (Chart.js) y simulaciones del salto y del rebote.

// Temas de los próximos avances. Cuando agregue uno a la página:
// 1) copio una <section class="tema"> en index.html,
// 2) agrego su enlace al índice,
// 3) lo borro de esta lista.
const PROXIMOS = [
  "Spring animations en interfaces",
  "Síntesis de sonido y armónicos",
  "Resonancia estructural y Tacoma Narrows",
  "Enfriamiento líquido de un centro de datos",
];

const G_TIERRA = 9.81;
const LOCAL = "es-CR";

document.addEventListener("DOMContentLoaded", () => {
  prepararTemas();
  mostrarEcuaciones();
  prepararEnfoque();
  prepararIndice();
  llenarProximos();
  const sim = prepararSimulacion();
  const rebote = prepararRebote();

  // Las gráficas esperan a que carguen las fuentes para no dibujarse con otra letra.
  const listas = document.fonts ? document.fonts.ready : Promise.resolve();
  listas.then(() => {
    if (window.Chart) crearGraficas();
    sim.dibujar();
    rebote.dibujar();
  });

  // Si el sistema cambia entre modo claro y oscuro, se vuelven a pintar con los colores nuevos.
  const oscuro = window.matchMedia("(prefers-color-scheme: dark)");
  const alCambiar = () => { if (window.Chart) crearGraficas(); sim.dibujar(); rebote.dibujar(); };
  if (oscuro.addEventListener) oscuro.addEventListener("change", () => { prepararBotonTema.texto(); alCambiar(); });
  prepararBotonTema(alCambiar);
});

// ---------- Botón de modo claro / oscuro ----------

function prepararBotonTema(alCambiar) {
  const boton = document.getElementById("botonTema");
  const raiz = document.documentElement;
  const sistemaOscuro = () => window.matchMedia("(prefers-color-scheme: dark)").matches;
  const estaOscuro = () => raiz.dataset.tema ? raiz.dataset.tema === "oscuro" : sistemaOscuro();

  // El switch está "encendido" cuando la página está en modo oscuro.
  const texto = () => {
    boton.setAttribute("aria-checked", String(estaOscuro()));
    boton.title = estaOscuro() ? "Cambiar a modo claro" : "Cambiar a modo oscuro";
  };
  prepararBotonTema.texto = texto;
  texto();

  boton.addEventListener("click", () => {
    raiz.dataset.tema = estaOscuro() ? "claro" : "oscuro";
    try { localStorage.setItem("tema", raiz.dataset.tema); } catch (e) {}
    texto();
    alCambiar();
  });
}

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
    document.getElementById("submenu").classList.remove("abierto");
    boton.setAttribute("aria-expanded", "false");
  };

  // Submenú "Temas": se abre con el mouse (CSS) o tocándolo.
  const botonTemas = document.querySelector(".desplegable-boton");
  const submenu = document.getElementById("submenu");
  botonTemas.addEventListener("click", () => {
    const abierto = submenu.classList.toggle("abierto");
    botonTemas.setAttribute("aria-expanded", String(abierto));
  });
  document.addEventListener("click", e => {
    if (!e.target.closest(".desplegable")) {
      submenu.classList.remove("abierto");
      botonTemas.setAttribute("aria-expanded", "false");
    }
  });

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

// ---------- Temas desplegables ----------

// Cada tema queda como un rectángulo cerrado con su número, su título y una flecha.
// Se abre o se cierra al hacer clic en el título o en el borde del rectángulo.
function prepararTemas() {
  const temas = [...document.querySelectorAll("section.tema")];

  temas.forEach(tema => {
    const num = tema.querySelector(".tema-num");
    const titulo = tema.querySelector("h2");

    const cabecera = document.createElement("div");
    cabecera.className = "tema-cabecera";
    cabecera.setAttribute("role", "button");
    cabecera.tabIndex = 0;
    cabecera.setAttribute("aria-expanded", "false");
    const textos = document.createElement("div");
    textos.append(num, titulo);
    const flecha = document.createElement("span");
    flecha.className = "tema-flecha";
    flecha.setAttribute("aria-hidden", "true");
    flecha.innerHTML = '<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>';
    cabecera.append(textos, flecha);

    // Todo lo demás va dentro del cuerpo que se despliega.
    const cuerpo = document.createElement("div");
    cuerpo.className = "tema-cuerpo";
    const contenido = document.createElement("div");
    contenido.className = "tema-contenido";
    while (tema.firstChild) contenido.append(tema.firstChild);
    cuerpo.append(contenido);
    contenido.inert = true;
    tema.append(cabecera, cuerpo);

    cabecera.addEventListener("click", () => alternar(tema));
    cabecera.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); alternar(tema); }
    });
    // Clic en el borde: el clic cae en la propia sección, no en su contenido.
    tema.addEventListener("click", e => { if (e.target === tema) alternar(tema); });
  });

  // Los enlaces del menú (y una dirección con #temaN) abren el tema antes de bajar a él.
  const abrirDesdeHash = () => {
    const destino = document.querySelector(`section.tema${location.hash}`);
    if (destino) abrir(destino);
  };
  document.querySelectorAll('a[href^="#tema"]').forEach(a =>
    a.addEventListener("click", () => {
      const destino = document.querySelector(a.getAttribute("href"));
      if (destino) abrir(destino);
    }));
  window.addEventListener("hashchange", abrirDesdeHash);
  if (location.hash) abrirDesdeHash();
}

// ---------- Resaltar fórmulas ----------

// Al dejar el mouse sobre una fórmula del texto, el resto de la página se oscurece y la fórmula
// queda iluminada. No aplica a gráficas, simulaciones, diagramas ni al menú, ni en pantallas táctiles.
function prepararEnfoque() {
  if (!window.matchMedia("(hover: hover)").matches) return;
  const velo = document.createElement("div");
  velo.className = "velo";
  document.body.append(velo);
  let actual = null, espera = null;

  const formula = el => {
    if (!el.closest || el.closest(".sim, .diagrama, .grafica, .indice, .tema-cabecera")) return null;
    return el.closest(".eq") || el.closest(".katex");
  };
  const quitar = () => {
    if (actual) actual.classList.remove("resaltada");
    actual = null;
    document.body.classList.remove("enfoque");
  };

  document.addEventListener("mouseover", e => {
    const f = formula(e.target);
    if (f === actual) return;
    clearTimeout(espera);
    if (!f) { quitar(); return; }
    // Una pequeña espera para que no parpadee al pasar el mouse de largo.
    espera = setTimeout(() => {
      quitar();
      actual = f;
      f.classList.add("resaltada");
      document.body.classList.add("enfoque");
    }, 120);
  });
  document.addEventListener("mouseleave", () => { clearTimeout(espera); quitar(); });
  window.addEventListener("scroll", () => { clearTimeout(espera); quitar(); }, { passive: true });
}

function abrir(tema) { if (!tema.classList.contains("abierto")) alternar(tema); }

function alternar(tema) {
  clearTimeout(tema.fijar);
  tema.classList.remove("fijo");
  const abierto = tema.classList.toggle("abierto");
  tema.querySelector(".tema-cabecera").setAttribute("aria-expanded", String(abierto));
  tema.querySelector(".tema-contenido").inert = !abierto;
  // Por si el navegador pausa la animación, al terminar el tema queda fijo en su altura completa.
  if (abierto) tema.fijar = setTimeout(() => tema.classList.add("fijo"), 400);
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
    li.innerHTML = `<strong>Tema ${primero + i}</strong>${CANDADO}`;
    ol.append(li);

    // También en el menú, bloqueado y sin enlace.
    const item = document.createElement("li");
    item.className = "bloqueado";
    item.innerHTML = `<span><span class="n"></span>Tema ${primero + i}</span>${CANDADO}`;
    document.getElementById("submenu").append(item);
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
  if (typeof UDDS_MPH !== "undefined") graficasTema6();
  if (typeof VOYAGER2 !== "undefined") graficaTema9();
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

// Plugin: varias líneas verticales punteadas con su etiqueta (por ejemplo, los encuentros de la Voyager).
function lineasVerticales(lista) {
  return {
    id: "lineasVerticales",
    afterDatasetsDraw(chart) {
      const { ctx, chartArea: a, scales: { x } } = chart;
      ctx.save();
      ctx.strokeStyle = color("--tenue");
      ctx.fillStyle = color("--tenue");
      ctx.font = `12px ${Chart.defaults.font.family}`;
      ctx.textAlign = "center";
      ctx.setLineDash([4, 4]);
      lista.forEach(l => {
        const px = x.getPixelForValue(l.x);
        ctx.beginPath(); ctx.moveTo(px, a.top + 18); ctx.lineTo(px, a.bottom); ctx.stroke();
        ctx.fillText(l.texto, px, a.top + 12);
      });
      ctx.restore();
    },
  };
}

// Tema 6: balance de energía en el ciclo UDDS de la EPA (datos en datos/udds.js).
// Valores aproximados del carro; están explicados en la nota de la figura.
function graficasTema6() {
  const m = 1800, g = G_TIERRA, Crr = 0.010, rho = 1.2, CdA = 0.23 * 2.22, eta = 0.80;
  const v = UDDS_MPH.map(mph => mph * 0.44704); // m/s
  const rapidez = [], traccion = [], frenado = [], recuperada = [], perdidas = [];
  let Etr = 0, Ef = 0, Ep = 0;

  for (let t = 0; t < v.length; t++) {
    rapidez.push({ x: t, y: v[t] * 3.6 });
    if (t > 0) {
      const vm = (v[t - 1] + v[t]) / 2;          // rapidez media en ese segundo
      const a = v[t] - v[t - 1];                 // aceleración (Δt = 1 s)
      const Fr = (vm > 0 ? Crr * m * g : 0) + 0.5 * rho * CdA * vm * vm;
      const P = (m * a + Fr) * vm;               // potencia en las ruedas (W)
      if (P > 0) Etr += P; else Ef += -P;        // energía en J (P · 1 s)
      Ep += Fr * vm;
    }
    traccion.push({ x: t, y: Etr / 1000 });
    frenado.push({ x: t, y: Ef / 1000 });
    recuperada.push({ x: t, y: eta * Ef / 1000 });
    perdidas.push({ x: t, y: Ep / 1000 });
  }

  lineas("g6vel", {
    ejeX: "Tiempo, t (s)", ejeY: "Rapidez (km/h)", unidad: "km/h",
    series: [serie("Rapidez del ciclo UDDS", rapidez, color("--s1"))],
    extra: { x: { min: 0, max: 1369 }, y: { min: 0 } },
  });

  lineas("g6energia", {
    ejeX: "Tiempo, t (s)", ejeY: "Energía acumulada (kJ)", unidad: "kJ",
    series: [
      serie("Entregada a las ruedas (tracción)", traccion, color("--s1")),
      serie("Quitada al frenar", frenado, color("--s2")),
      serie("Recuperada a la batería (η = 0,80)", recuperada, color("--s3")),
      serie("Perdida en aire y rodadura", perdidas, color("--tenue"), { borderDash: [6, 4] }),
    ],
    extra: { x: { min: 0, max: 1369 }, y: { min: 0 } },
  });
}

// Tema 9: rapidez de la Voyager 2 respecto al Sol (datos de JPL Horizons en datos/voyager2.js).
function graficaTema9() {
  const rapidez = VOYAGER2.map(([t, v]) => ({ x: t, y: v }));
  const escape = VOYAGER2.map(([t, , ve]) => ({ x: t, y: ve }));
  lineas("g9vel", {
    ejeX: "Año", ejeY: "Rapidez respecto al Sol (km/s)", unidad: "km/s",
    series: [
      serie("Rapidez de la Voyager 2", rapidez, color("--s1")),
      serie("Velocidad de escape del Sol en su posición", escape, color("--s2"), { borderDash: [6, 4] }),
    ],
    extra: {
      x: { min: 1977.6, max: 1990, ticks: { stepSize: 1, callback: v => String(Math.round(v)) } },
      y: { min: 0, max: 45 },
    },
    plugins: [lineasVerticales([
      { x: 1979.52, texto: "Júpiter" },
      { x: 1981.65, texto: "Saturno" },
      { x: 1986.07, texto: "Urano" },
      { x: 1989.65, texto: "Neptuno" },
    ])],
  });
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

// ---------- Tema 7: simulación del rebote ----------

function prepararRebote() {
  const lienzo = document.getElementById("simRebote");
  const ctx = lienzo.getContext("2d");
  const $ = id => document.getElementById(id);
  const control = { e: $("eRest"), h0: $("h0Rebote"), umbral: $("umbral") };
  const UMBRAL = 1;      // m/s, choques más lentos no rebotan (como Box2D)
  const T_MAX = 15;      // s, tiempo máximo que se dibuja
  let animacion = null;
  let ancho = 0, alto = 0;

  function ajustarTamano() {
    const dpr = window.devicePixelRatio || 1;
    ancho = lienzo.clientWidth || 600;
    alto = Math.round(Math.min(Math.max(ancho * 0.5, 230), 360));
    lienzo.style.height = alto + "px";
    lienzo.width = Math.round(ancho * dpr);
    lienzo.height = Math.round(alto * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // Calcula los tramos de caída libre entre choques. En cada choque v' = -e·v.
  function trayectoria(e, h0, conUmbral) {
    const g = G_TIERRA;
    const tramos = [];               // { t0, y0, v0, dur }
    const alturas = [];              // altura máxima después de cada rebote
    let t = 0, y = h0, v = 0, quieta = null;
    for (let n = 0; n < 300 && t < T_MAX; n++) {
      const dur = (v + Math.sqrt(v * v + 2 * g * y)) / g;   // tiempo hasta tocar el piso
      tramos.push({ t0: t, y0: y, v0: v, dur });
      t += dur;
      const choque = Math.abs(v - g * dur);                   // rapidez al llegar al piso
      if (conUmbral && choque < UMBRAL) { quieta = t; break; }
      v = e * choque; y = 0;
      const h = v * v / (2 * g);
      if (h < 0.0005) { quieta = t; break; }
      alturas.push(h);
    }
    return { tramos, alturas, quieta };
  }

  const altura = (tr, t) => {
    for (const s of tr.tramos) {
      if (t <= s.t0 + s.dur) {
        const u = t - s.t0;
        return Math.max(s.y0 + s.v0 * u - 0.5 * G_TIERRA * u * u, 0);
      }
    }
    return 0;
  };

  function pasoBonito(bruto) {
    const p = Math.pow(10, Math.floor(Math.log10(bruto)));
    const n = bruto / p;
    return (n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10) * p;
  }

  function dibujar(tAnim = null) {
    if (!ancho) ajustarTamano();
    const e = +control.e.value, h0 = +control.h0.value, conUmbral = control.umbral.checked;
    const tr = trayectoria(e, h0, conUmbral);
    const ideal = trayectoria(e, h0, false);

    // Resultados
    $("eOut").textContent = num(e, 2);
    $("h0Out").textContent = num(h0, 1) + " m";
    $("h1Out").textContent = num(e * e * h0, 2) + " m";
    $("perdidaOut").textContent = e <= 1
      ? num((1 - e * e) * 100, 0) + " %"
      : "gana " + num((e * e - 1) * 100, 0) + " % (no es físico)";
    const rebotes = tr.alturas.filter(h => h >= 0.01).length;
    $("nOut").textContent = tr.quieta === null ? "nunca se detiene" : String(rebotes);
    $("tParOut").textContent = tr.quieta === null ? "nunca se detiene" : num(tr.quieta, 2) + " s";

    // Escalas
    const fin = Math.max(tr.quieta || 0, ideal.quieta || 0);
    const tFin = tr.quieta === null ? T_MAX : Math.min(fin * 1.08 + 0.3, T_MAX);
    const yMax = Math.max(h0, ...tr.alturas.slice(0, 40)) * 1.12;
    const m = { izq: 46, der: 16, arr: 14, aba: 36 };
    const px = t => m.izq + t / tFin * (ancho - m.izq - m.der);
    const py = y => alto - m.aba - y / yMax * (alto - m.arr - m.aba);

    const tinta = color("--tinta"), tenue = color("--tenue"), linea = color("--linea");
    ctx.clearRect(0, 0, ancho, alto);
    ctx.font = `12px ${color("--sans") || "sans-serif"}`;
    ctx.lineWidth = 1;

    // Cuadrícula y números de los ejes
    ctx.strokeStyle = linea;
    ctx.fillStyle = tenue;
    const pasoT = pasoBonito(tFin / 7), pasoY = pasoBonito(yMax / 5);
    ctx.textAlign = "center";
    for (let t = 0; t <= tFin + 1e-9; t += pasoT) {
      ctx.beginPath(); ctx.moveTo(px(t), py(0)); ctx.lineTo(px(t), m.arr); ctx.stroke();
      ctx.fillText(num(t, pasoT < 1 ? 1 : 0), px(t), py(0) + 16);
    }
    ctx.textAlign = "right";
    for (let y = pasoY; y <= yMax + 1e-9; y += pasoY) {
      ctx.beginPath(); ctx.moveTo(m.izq, py(y)); ctx.lineTo(ancho - m.der, py(y)); ctx.stroke();
      ctx.fillText(num(y, pasoY < 1 ? 1 : 0), m.izq - 6, py(y) + 4);
    }

    // Piso y nombres de los ejes
    ctx.strokeStyle = tinta;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(m.izq, py(0)); ctx.lineTo(ancho - m.der, py(0)); ctx.stroke();
    ctx.fillStyle = tinta;
    ctx.textAlign = "right";
    ctx.fillText("t (s)", ancho - m.der, alto - 6);
    ctx.save();
    ctx.translate(13, m.arr + (alto - m.arr - m.aba) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.fillText("altura (m)", 0, 0);
    ctx.restore();

    // Curvas: la ideal punteada (solo si el umbral cambia algo) y la elegida continua
    const curva = (tray, c, grosor, guiones) => {
      ctx.strokeStyle = c;
      ctx.lineWidth = grosor;
      ctx.setLineDash(guiones);
      ctx.beginPath();
      const pasos = 600;
      for (let i = 0; i <= pasos; i++) {
        const t = tFin * i / pasos;
        const X = px(t), Y = py(altura(tray, t));
        if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    };
    if (conUmbral) curva(ideal, tenue, 1.6, [5, 5]);
    curva(tr, color("--s1"), 2.4, []);

    // Pelota
    const t = tAnim === null ? 0 : tAnim;
    ctx.fillStyle = color("--s2");
    ctx.beginPath(); ctx.arc(px(t), py(altura(tr, t)) - 7, 7, 0, 2 * Math.PI); ctx.fill();
  }

  function soltar() {
    cancelAnimationFrame(animacion);
    const tr = trayectoria(+control.e.value, +control.h0.value, control.umbral.checked);
    const tFin = tr.quieta === null ? T_MAX : tr.quieta;
    const inicio = performance.now();
    const cuadro = ahora => {
      const t = Math.min((ahora - inicio) / 1000, tFin); // en tiempo real
      dibujar(t);
      if (t < tFin) animacion = requestAnimationFrame(cuadro);
    };
    animacion = requestAnimationFrame(cuadro);
  }

  [control.e, control.h0].forEach(c => c.addEventListener("input", () => {
    cancelAnimationFrame(animacion);
    dibujar();
  }));
  control.umbral.addEventListener("change", () => {
    cancelAnimationFrame(animacion);
    dibujar();
  });
  $("btnSoltar").addEventListener("click", soltar);

  if ("ResizeObserver" in window) {
    new ResizeObserver(() => { ajustarTamano(); dibujar(); }).observe(lienzo.parentElement);
  } else {
    window.addEventListener("resize", () => { ajustarTamano(); dibujar(); });
  }

  ajustarTamano();
  dibujar();
  return { dibujar: () => { ajustarTamano(); dibujar(); } };
}
