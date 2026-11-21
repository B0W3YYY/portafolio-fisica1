// Portafolio Física I · script principal
// Ecuaciones (KaTeX), índice, temas desplegables, gráficas (Chart.js) y simulaciones del salto, del rebote,
// del resorte amortiguado y del tanque de Torricelli.

const G_TIERRA = 9.81;
const LOCAL = "es-CR";

document.addEventListener("DOMContentLoaded", () => {
  prepararTemas();
  mostrarEcuaciones();
  prepararEnfoque();
  prepararIndice();
  const sims = [prepararSimulacion(), prepararRebote(), prepararResorte(), prepararTanque()];

  // Las gráficas esperan a que carguen las fuentes para no dibujarse con otra letra.
  const listas = document.fonts ? document.fonts.ready : Promise.resolve();
  listas.then(() => {
    if (window.Chart) crearGraficas();
    sims.forEach(x => x.dibujar());
  });

  // Si el sistema cambia entre modo claro y oscuro, se vuelven a pintar con los colores nuevos.
  const oscuro = window.matchMedia("(prefers-color-scheme: dark)");
  const alCambiar = () => { if (window.Chart) crearGraficas(); sims.forEach(x => x.dibujar()); };
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
    // En las fórmulas en bloque se resalta la fórmula misma, no toda la fila.
    const bloque = el.closest(".eq");
    if (bloque) return bloque.querySelector(".katex-display > .katex");
    return el.closest(".katex");
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
  graficasTema11();
  graficaTema12();
  graficasTema13();
  graficasTema14();
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

// ---------- Temas 10 a 15: utilidades de los lienzos ----------

// Ajusta un lienzo al ancho de su contenedor y a la densidad de la pantalla. altoDe(ancho) da el alto en píxeles.
function ajustarLienzo(lienzo, altoDe) {
  const ctx = lienzo.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const ancho = lienzo.clientWidth || 600;
  const alto = Math.round(altoDe(ancho));
  lienzo.style.height = alto + "px";
  lienzo.width = Math.round(ancho * dpr);
  lienzo.height = Math.round(alto * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, ancho, alto };
}

function pasoRedondo(bruto) {
  const p = Math.pow(10, Math.floor(Math.log10(bruto)));
  const n = bruto / p;
  return (n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10) * p;
}

// Dibuja ejes con cuadrícula en el rectángulo r = {x, y, w, h} y devuelve las funciones de escala.
function ejes(ctx, r, { xMax, yMin = 0, yMax, nombreX, nombreY }) {
  const px = v => r.x + v / xMax * r.w;
  const py = v => r.y + r.h - (v - yMin) / (yMax - yMin) * r.h;
  const tinta = color("--tinta"), tenue = color("--tenue"), linea = color("--linea");
  ctx.font = `12px ${color("--sans") || "sans-serif"}`;
  ctx.lineWidth = 1;
  ctx.strokeStyle = linea;
  ctx.fillStyle = tenue;
  const pX = pasoRedondo(xMax / 6), pY = pasoRedondo((yMax - yMin) / 5);
  ctx.textAlign = "center";
  for (let v = 0; v <= xMax + 1e-9; v += pX) {
    ctx.beginPath(); ctx.moveTo(px(v), r.y); ctx.lineTo(px(v), r.y + r.h); ctx.stroke();
    ctx.fillText(num(v, pX < 1 ? 1 : 0), px(v), r.y + r.h + 15);
  }
  ctx.textAlign = "right";
  for (let v = Math.ceil(yMin / pY) * pY; v <= yMax + 1e-9; v += pY) {
    ctx.beginPath(); ctx.moveTo(r.x, py(v)); ctx.lineTo(r.x + r.w, py(v)); ctx.stroke();
    ctx.fillText(num(v, pY < 1 ? 1 : 0), r.x - 5, py(v) + 4);
  }
  ctx.strokeStyle = tinta;
  ctx.beginPath(); ctx.moveTo(r.x, r.y); ctx.lineTo(r.x, r.y + r.h); ctx.lineTo(r.x + r.w, r.y + r.h); ctx.stroke();
  ctx.fillStyle = tinta;
  ctx.textAlign = "right";
  ctx.fillText(nombreX, r.x + r.w, r.y + r.h + 31);
  ctx.save();
  ctx.translate(r.x - 34, r.y + r.h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = "center";
  ctx.fillText(nombreY, 0, 0);
  ctx.restore();
  return { px, py };
}

function observarTamano(lienzo, fn) {
  if ("ResizeObserver" in window) new ResizeObserver(fn).observe(lienzo.parentElement);
  else window.addEventListener("resize", fn);
}

// ---------- Tema 10: simulación del resorte amortiguado ----------

function prepararResorte() {
  const lienzo = document.getElementById("simResorte");
  const $ = id => document.getElementById(id);
  const control = { k: $("kRes"), c: $("cRes"), m: $("mRes") };
  let animacion = null, tam = null;

  // m x'' = -k (x - 1) - c x', saliendo del reposo en x = 0 (Euler semiimplícito, dt = 1 ms)
  function integrar(k, c, m, tMax) {
    const dt = 0.001, puntos = [];
    let x = 0, v = 0, ultimoFuera = 0, maximo = 0;
    for (let i = 0, t = 0; t <= tMax; i++, t = i * dt) {
      if (i % 5 === 0) puntos.push([t, x]);
      if (Math.abs(x - 1) > 0.01) ultimoFuera = t;
      maximo = Math.max(maximo, x);
      const a = (-k * (x - 1) - c * v) / m;
      v += a * dt;
      x += v * dt;
    }
    return { puntos, asentado: ultimoFuera < tMax - 0.01 ? ultimoFuera : null, sobrepaso: Math.max(0, maximo - 1) };
  }

  const posicion = (puntos, t) => puntos[Math.min(Math.max(Math.round(t / 0.005), 0), puntos.length - 1)][1];

  function dibujar(tAnim = null) {
    if (!tam) tam = ajustarLienzo(lienzo, w => Math.min(Math.max(w * 0.62, 300), 420));
    const { ctx, ancho, alto } = tam;
    const k = +control.k.value, c = +control.c.value, m = +control.m.value;
    const w0 = Math.sqrt(k / m), zeta = c / (2 * Math.sqrt(k * m)), cCrit = 2 * Math.sqrt(k * m);

    const largo = integrar(k, c, m, 12);
    const tFin = Math.min(Math.max((largo.asentado || 12) * 1.25, 1), 6);
    const sim = integrar(k, c, m, tFin);
    const crit = integrar(k, cCrit, m, tFin);

    $("kOut").textContent = num(k, 0) + " N/m";
    $("cOut").textContent = num(c, 1) + " N·s/m";
    $("mOut").textContent = num(m, 1) + " kg";
    $("zetaOut").textContent = num(zeta, 2);
    $("regimenOut").textContent = zeta < 0.995 ? "subamortiguado (rebota)" : zeta <= 1.005 ? "crítico" : "sobreamortiguado (lento, sin rebote)";
    $("w0Out").textContent = num(w0, 2) + " rad/s";
    $("sobrepasoOut").textContent = num(largo.sobrepaso * 100, 1) + " %";
    $("tAsentOut").textContent = largo.asentado === null ? "más de 12 s (casi no se detiene)" : num(largo.asentado, 2) + " s";

    ctx.clearRect(0, 0, ancho, alto);

    // Pista con la tarjeta
    const izq = 54, der = 16, pista = 64;
    const xPista = v => izq + v * (ancho - izq - der - 60);
    const xActual = posicion(sim.puntos, tAnim === null ? tFin : Math.min(tAnim, tFin));
    ctx.strokeStyle = color("--linea");
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    [0, 1].forEach(v => { ctx.beginPath(); ctx.moveTo(xPista(v) + 20, 8); ctx.lineTo(xPista(v) + 20, pista - 4); ctx.stroke(); });
    ctx.setLineDash([]);
    ctx.fillStyle = color("--tenue");
    ctx.font = `12px ${color("--sans") || "sans-serif"}`;
    ctx.textAlign = "center";
    ctx.fillText("inicio", xPista(0) + 20, pista + 8);
    ctx.fillText("meta", xPista(1) + 20, pista + 8);
    ctx.fillStyle = color("--s2");
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(xPista(xActual), 14, 40, 40, 8); else ctx.rect(xPista(xActual), 14, 40, 40);
    ctx.fill();

    // Gráfica de x(t)
    const r = { x: izq, y: pista + 26, w: ancho - izq - der, h: alto - pista - 26 - 40 };
    const yMax = Math.max(1.25, 1 + largo.sobrepaso + 0.1);
    const { px, py } = ejes(ctx, r, { xMax: tFin, yMin: 0, yMax, nombreX: "t (s)", nombreY: "posición x" });
    ctx.strokeStyle = color("--tenue");
    ctx.setLineDash([2, 3]);
    ctx.beginPath(); ctx.moveTo(px(0), py(1)); ctx.lineTo(px(tFin), py(1)); ctx.stroke();
    ctx.setLineDash([]);
    const curva = (pts, col, grosor, guiones) => {
      ctx.strokeStyle = col; ctx.lineWidth = grosor; ctx.setLineDash(guiones);
      ctx.beginPath();
      pts.forEach(([t, x], i) => (i ? ctx.lineTo(px(t), py(x)) : ctx.moveTo(px(t), py(x))));
      ctx.stroke(); ctx.setLineDash([]);
    };
    curva(crit.puntos, color("--tenue"), 1.6, [5, 5]);
    curva(sim.puntos, color("--s1"), 2.6, []);
    if (tAnim !== null && tAnim < tFin) {
      ctx.fillStyle = color("--s2");
      ctx.beginPath(); ctx.arc(px(tAnim), py(xActual), 4.5, 0, 2 * Math.PI); ctx.fill();
    }
    return tFin;
  }

  function animar() {
    cancelAnimationFrame(animacion);
    const tFin = dibujar(0);
    const inicio = performance.now();
    const cuadro = ahora => {
      // el primer cuadro puede traer una hora un poco anterior a "inicio"
      const t = Math.min(Math.max((ahora - inicio) / 1000, 0), tFin);
      dibujar(t);
      if (t < tFin) animacion = requestAnimationFrame(cuadro);
    };
    animacion = requestAnimationFrame(cuadro);
  }

  Object.values(control).forEach(e => e.addEventListener("input", () => { cancelAnimationFrame(animacion); dibujar(); }));
  $("btnAnimar").addEventListener("click", animar);
  lienzo.parentElement.querySelectorAll("[data-zeta]").forEach(b => b.addEventListener("click", () => {
    const k = +control.k.value, m = +control.m.value;
    control.c.value = Math.min(+b.dataset.zeta * 2 * Math.sqrt(k * m), +control.c.max);
    animar();
  }));
  observarTamano(lienzo, () => { tam = null; dibujar(); });
  dibujar();
  return { dibujar: () => { tam = null; dibujar(); } };
}

// ---------- Tema 11: forma de onda y armónicos ----------

const ARMONICOS_A = [1, 0.25, 0.06];
const ARMONICOS_B = Array.from({ length: 20 }, (_, i) => 1 / (i + 1));

function graficasTema11() {
  const f1 = 220;
  const rms = A => Math.sqrt(A.reduce((s, a) => s + a * a, 0) / 2);
  const onda = A => {
    const esc = 1 / rms(A), datos = [];
    for (let i = 0; i <= 500; i++) {
      const t = i / 500 * 2 / f1;
      const y = A.reduce((s, a, n) => s + a * Math.sin(2 * Math.PI * (n + 1) * f1 * t), 0);
      datos.push({ x: t * 1000, y: y * esc });
    }
    return datos;
  };
  lineas("g11onda", {
    ejeX: "Tiempo, t (ms)", ejeY: "Amplitud (relativa)", unidad: "",
    series: [
      serie("Muestra A (suave)", onda(ARMONICOS_A), color("--s1")),
      serie("Muestra B (brillante)", onda(ARMONICOS_B), color("--s2")),
    ],
    extra: { x: { min: 0, max: 2000 / f1 } },
  });

  const lienzo = document.getElementById("g11espectro");
  if (!lienzo) return;
  const n = ARMONICOS_B.length;
  const norma = A => { const e = 1 / rms(A); return Array.from({ length: n }, (_, i) => (A[i] || 0) * e); };
  graficas.push(new Chart(lienzo, {
    type: "bar",
    data: {
      labels: Array.from({ length: n }, (_, i) => String((i + 1) * f1)),
      datasets: [
        { label: "Muestra A (suave)", data: norma(ARMONICOS_A), backgroundColor: color("--s1") },
        { label: "Muestra B (brillante)", data: norma(ARMONICOS_B), backgroundColor: color("--s2") },
      ],
    },
    options: {
      plugins: {
        legend: { position: "bottom", labels: { color: color("--tinta") } },
        tooltip: { callbacks: { title: c => `Armónico ${c[0].dataIndex + 1}: ${c[0].label} Hz`, label: c => ` ${c.dataset.label}: ${num(c.parsed.y, 3)}` } },
      },
      scales: {
        x: { title: { display: true, text: "Frecuencia del armónico (Hz)", color: color("--tinta") } },
        y: { min: 0, title: { display: true, text: "Amplitud Aₙ (relativa)", color: color("--tinta") } },
      },
    },
  }));
}

// ---------- Tema 12: curvas de resonancia ----------

function graficaTema12() {
  const curva = zeta => {
    const d = [];
    for (let i = 0; i <= 1500; i++) {
      const r = i / 1500 * 2.5;
      d.push({ x: r, y: 1 / Math.sqrt((1 - r * r) ** 2 + (2 * zeta * r) ** 2) });
    }
    return d;
  };
  lineas("g12res", {
    ejeX: "Frecuencia de excitación / frecuencia natural, ω/ω₀", ejeY: "Amplitud / amplitud estática", unidad: "veces",
    series: [
      serie("ζ = 0,01 (puente de acero)", curva(0.01), color("--s2")),
      serie("ζ = 0,05", curva(0.05), color("--s1")),
      serie("ζ = 0,2", curva(0.2), color("--s3")),
      serie("ζ = 0,7 (animación del tema 10)", curva(0.7), color("--tenue"), { borderDash: [6, 4] }),
    ],
    extra: {
      x: { min: 0, max: 2.5 },
      y: { type: "logarithmic", min: 0.1, max: 100, ticks: { callback: v => [0.1, 1, 10, 100].some(m => Math.abs(v - m) < 1e-9) ? num(v, v < 1 ? 1 : 0) : "" } },
    },
  });
}

// ---------- Tema 13: circuito de enfriamiento ----------

function graficasTema13() {
  const rho = 997, mu = 0.89e-3, g = G_TIERRA, P0 = 250e3, Qt = 2e-3, N = 18, q = Qt / N;
  const area = D => Math.PI * D * D / 4;
  const friccion = (v, D) => { const Re = rho * v * D / mu; return Re < 2300 ? 64 / Re : 0.316 * Re ** -0.25; };

  // Tramos: largo (m), diámetro (m), caudal (m³/s), altura al inicio y al final (m)
  const tramos = [{ L: 5, D: 0.05, Q: Qt, h0: 0, h1: 0 }, { L: 0.2, D: 0.04, Q: Qt, h0: 0, h1: 0.2 }];
  for (let k = 1; k < N; k++) {
    const h = 0.2 + 0.1 * (k - 1);
    tramos.push({ L: 0.1, D: 0.04, Q: Qt - k * q, h0: h, h1: h + 0.1 });
  }
  tramos.push({ L: 1, D: 0.012, Q: q, h0: 1.9, h1: 1.9 }, { L: 0.3, D: 0.008, Q: q, h0: 1.9, h1: 1.9 });

  const v0 = Qt / area(0.05);
  const vel = [], ideal = [], real = [];
  let x = 0, perdida = 0;
  tramos.forEach(t => {
    const v = t.Q / area(t.D);
    const dPdx = friccion(v, t.D) / t.D * 0.5 * rho * v * v;
    for (let i = 0; i <= 10; i++) {
      const s = i / 10, h = t.h0 + (t.h1 - t.h0) * s;
      const P = P0 + 0.5 * rho * (v0 * v0 - v * v) - rho * g * h;
      const xx = x + s * t.L, pf = perdida + dPdx * s * t.L;
      vel.push({ x: xx, y: v });
      ideal.push({ x: xx, y: P / 1000 });
      real.push({ x: xx, y: (P - pf) / 1000 });
    }
    x += t.L;
    perdida += dPdx * t.L;
  });

  lineas("g13vel", {
    ejeX: "Posición a lo largo del circuito (m)", ejeY: "Velocidad, v (m/s)", unidad: "m/s",
    series: [serie("Velocidad del agua", vel, color("--s1"))],
    extra: { x: { min: 0, max: 8.2 }, y: { min: 0, max: 2.6 } },
    plugins: [rotulos([
      { texto: "principal Ø50", x: 2.5, y: 2.4 },
      { texto: "colector Ø40", x: 5.95, y: 2.4 },
      { texto: "Ø12", x: 7.35, y: 2.4 },
      { texto: "Ø8", x: 8.05, y: 2.4 },
    ])],
  });
  lineas("g13pres", {
    ejeX: "Posición a lo largo del circuito (m)", ejeY: "Presión manométrica (kPa)", unidad: "kPa",
    series: [
      serie("Bernoulli ideal", ideal, color("--s1")),
      serie("Con fricción (Darcy-Weisbach)", real, color("--s2"), { borderDash: [6, 4] }),
    ],
    extra: { x: { min: 0, max: 8.2 }, y: { min: 220, max: 252 } },
  });

  const porDiametro = Q => {
    const d = [];
    for (let D = 5; D <= 80; D += 0.5) d.push({ x: D, y: Q / area(D / 1000) });
    return d;
  };
  lineas("g13diam", {
    ejeX: "Diámetro interno de la tubería, D (mm)", ejeY: "Velocidad, v (m/s)", unidad: "m/s",
    series: [
      serie("Una bandeja: 0,111 L/s (6,7 L/min)", porDiametro(q), color("--s1")),
      serie("Rack completo: 2 L/s (120 L/min)", porDiametro(Qt), color("--s2")),
    ],
    extra: { x: { min: 5, max: 80 }, y: { min: 0, max: 4 } },
    plugins: [{
      id: "rango",
      beforeDatasetsDraw(chart) {
        const { ctx, chartArea: a, scales: { y } } = chart;
        ctx.save();
        ctx.fillStyle = color("--ventana");
        ctx.fillRect(a.left, y.getPixelForValue(2), a.right - a.left, y.getPixelForValue(0.5) - y.getPixelForValue(2));
        ctx.fillStyle = color("--s3");
        ctx.font = `12px ${Chart.defaults.font.family}`;
        ctx.textAlign = "right";
        ctx.fillText("rango razonable (0,5 a 2 m/s)", a.right - 6, y.getPixelForValue(2) - 5);
        ctx.restore();
      },
    }],
  });
}

// ---------- Tema 14: Poiseuille ----------

function graficasTema14() {
  const mu = 0.89e-3, R = 0.5, vProm = 0.5;          // R en mm, v en m/s
  const plano = [], parabola = [];
  for (let i = 0; i <= 100; i++) {
    const r = -R + i / 100 * 2 * R;
    plano.push({ x: r, y: vProm });
    parabola.push({ x: r, y: 2 * vProm * (1 - (r / R) ** 2) });
  }
  lineas("g14perfil", {
    ejeX: "Posición desde el centro del canal, r (mm)", ejeY: "Velocidad, u (m/s)", unidad: "m/s",
    series: [
      serie("Sin viscosidad (Bernoulli): perfil plano", plano, color("--s2"), { borderDash: [6, 4] }),
      serie("Con viscosidad (Navier-Stokes, Poiseuille)", parabola, color("--s1")),
    ],
    extra: { x: { min: -0.5, max: 0.5 }, y: { min: 0, max: 1.15 } },
  });

  const Q = Math.PI * (R / 1000) ** 2 * vProm;
  const caida = [];
  for (let i = 0; i <= 60; i++) {
    const D = 0.3 * Math.pow(10, i / 60);           // de 0,3 a 3 mm
    caida.push({ x: D, y: 128 * mu * Q / (Math.PI * (D / 1000) ** 4) / 1000 });
  }
  const marcas = lista => v => lista.some(m => Math.abs(v - m) < 1e-6 * m) ? num(v, v < 1 ? 1 : 0) : "";
  lineas("g14caida", {
    ejeX: "Diámetro del canal, D (mm)", ejeY: "Caída de presión por metro (kPa/m)", unidad: "kPa/m",
    series: [serie("Hagen-Poiseuille: ΔP/L = 128μQ/(πD⁴)", caida, color("--s1"))],
    extra: {
      x: { type: "logarithmic", min: 0.3, max: 3, ticks: { callback: marcas([0.3, 0.5, 1, 2, 3]) } },
      y: { type: "logarithmic", ticks: { callback: marcas([1, 10, 100, 1000]) } },
    },
  });
}

// ---------- Tema 15: simulación del tanque (Torricelli) ----------

function prepararTanque() {
  const lienzo = document.getElementById("simTanque");
  const $ = id => document.getElementById(id);
  const control = { d: $("dOrif"), h0: $("h0Tanque"), q: $("qEntra"), cd: $("cdReal") };
  const D_TANQUE = 0.5, ALTO_TANQUE = 1.8, BASE = 0.6, A = Math.PI * D_TANQUE ** 2 / 4, g = G_TIERRA;
  let animacion = null, tam = null;

  const valores = () => ({
    d: +control.d.value / 1000, h0: +control.h0.value, q: +control.q.value / 1000, cd: control.cd.checked ? 0.61 : 1,
  });

  // A dh/dt = Q_entra − Cd a √(2gh)
  function integrar({ d, h0, q, cd }) {
    const a = Math.PI * d * d / 4, dt = 0.05, puntos = [[0, h0]];
    const hEq = q > 0 ? (q / (cd * a)) ** 2 / (2 * g) : 0;
    const meta = Math.min(hEq, ALTO_TANQUE);
    let h = h0, t = 0, i = 0, vacio = null, estable = null;
    while (t < 4000) {
      const dh = (q - cd * a * Math.sqrt(2 * g * Math.max(h, 0))) / A;
      h = Math.min(Math.max(h + dh * dt, 0), ALTO_TANQUE);
      t = ++i * dt;
      if (i % 4 === 0) puntos.push([t, h]);
      if (q === 0 && h <= 1e-5) { vacio = t; puntos.push([t, 0]); break; }
      if (q > 0 && estable === null && Math.abs(h - meta) < 0.003) estable = t;
      if (estable !== null && t > estable * 1.3 + 5) break;
    }
    return { puntos, vacio, hEq, a, fin: t };
  }

  const alturaEn = (puntos, t) => {
    const i = puntos.findIndex(p => p[0] >= t);
    if (i < 0) return puntos[puntos.length - 1][1];
    if (i === 0) return puntos[0][1];
    const [t1, h1] = puntos[i - 1], [t2, h2] = puntos[i];
    return h1 + (h2 - h1) * (t - t1) / (t2 - t1);
  };

  function dibujar(tAnim = null) {
    if (!tam) tam = ajustarLienzo(lienzo, w => (w < 560 ? 540 : Math.min(Math.max(w * 0.45, 300), 380)));
    const { ctx, ancho, alto } = tam;
    const val = valores();
    const res = integrar(val);
    const tFin = res.fin;

    $("dOut").textContent = num(val.d * 1000, 0) + " mm";
    $("h0TOut").textContent = num(val.h0, 2) + " m";
    $("qOut").textContent = num(val.q * 1000, 2) + " L/s";
    const v0 = Math.sqrt(2 * g * val.h0);
    $("vSalOut").textContent = num(v0, 2) + " m/s";
    $("qSalOut").textContent = num(val.cd * res.a * v0 * 1000, 2) + " L/s";
    $("tVacOut").textContent = val.q > 0 ? "no se vacía (entra agua)" : num(res.vacio, 0) + " s (" + num(res.vacio / 60, 1) + " min)";
    $("hEqOut").textContent = val.q === 0 ? "0 m (se vacía)"
      : res.hEq > ALTO_TANQUE ? num(res.hEq, 2) + " m: se rebalsa (el tanque mide 1,8 m)" : num(res.hEq, 2) + " m";

    ctx.clearRect(0, 0, ancho, alto);
    const apilado = ancho < 560;
    const zonaT = apilado ? { x: 0, y: 0, w: ancho, h: 250 } : { x: 0, y: 0, w: ancho * 0.45, h: alto };
    const zonaG = apilado
      ? { x: 54, y: 280, w: ancho - 70, h: alto - 280 - 42 }
      : { x: ancho * 0.45 + 56, y: 12, w: ancho * 0.55 - 72, h: alto - 12 - 42 };

    // --- Tanque y chorro (misma escala en x y en y) ---
    const t = tAnim === null ? 0 : tAnim;
    const h = alturaEn(res.puntos, t);
    const esc = Math.min((zonaT.w - 20) / 3.7, (zonaT.h - 20) / 2.75);
    const X = m => zonaT.x + 12 + m * esc;
    const Y = m => zonaT.y + zonaT.h - 10 - m * esc;
    const tinta = color("--tinta");
    ctx.font = `12px ${color("--sans") || "sans-serif"}`;
    ctx.strokeStyle = tinta; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(X(0) - 6, Y(0)); ctx.lineTo(zonaT.x + zonaT.w - 4, Y(0)); ctx.stroke();   // suelo
    ctx.fillStyle = color("--linea");
    ctx.fillRect(X(0.04), Y(BASE), 4, BASE * esc);
    ctx.fillRect(X(D_TANQUE - 0.04) - 4, Y(BASE), 4, BASE * esc);                                         // patas
    ctx.fillStyle = color("--s1"); ctx.globalAlpha = 0.45;
    ctx.fillRect(X(0), Y(BASE + h), D_TANQUE * esc, h * esc);                                              // agua
    ctx.globalAlpha = 1;
    ctx.strokeStyle = tinta; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(X(0), Y(BASE + ALTO_TANQUE)); ctx.lineTo(X(0), Y(BASE)); ctx.lineTo(X(D_TANQUE), Y(BASE));
    ctx.lineTo(X(D_TANQUE), Y(BASE + ALTO_TANQUE)); ctx.stroke();
    ctx.fillStyle = tinta; ctx.textAlign = "center";
    if (h > 0.08) ctx.fillText("h = " + num(h, 2) + " m", X(D_TANQUE / 2), Y(BASE + h / 2) + 4);
    // agua que entra desde un tubo arriba
    if (val.q > 0) {
      ctx.strokeStyle = color("--s1"); ctx.lineWidth = Math.max(1.5, val.q * 3000);
      ctx.beginPath(); ctx.moveTo(X(0.15), Y(BASE + ALTO_TANQUE + 0.2)); ctx.lineTo(X(0.15), Y(BASE + h)); ctx.stroke();
      ctx.strokeStyle = tinta; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(X(0), Y(BASE + ALTO_TANQUE + 0.2)); ctx.lineTo(X(0.18), Y(BASE + ALTO_TANQUE + 0.2)); ctx.stroke();
    }
    // chorro: sale horizontal con v = √(2gh) y cae como tiro parabólico
    if (h > 1e-4) {
      const v = Math.sqrt(2 * g * h), tCaida = Math.sqrt(2 * BASE / g), alcance = v * tCaida;
      ctx.strokeStyle = color("--s1"); ctx.lineWidth = Math.max(1.5, val.d * 1000 / 6);
      ctx.beginPath();
      for (let i = 0; i <= 40; i++) {
        const s = tCaida * i / 40;
        const px = X(D_TANQUE + v * s), py = Y(BASE - 0.5 * g * s * s);
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.stroke();
      ctx.fillStyle = color("--tenue"); ctx.textAlign = "left";
      ctx.fillText("v = " + num(v, 2) + " m/s", X(D_TANQUE) + 6, Y(BASE) - 8);
      ctx.textAlign = "center";
      ctx.fillText("alcance " + num(alcance, 2) + " m", Math.min(X(D_TANQUE + alcance), zonaT.x + zonaT.w - 50), Y(0) - 6);
    }

    // --- Gráfica h(t) ---
    const { px, py } = ejes(ctx, zonaG, { xMax: tFin, yMin: 0, yMax: ALTO_TANQUE, nombreX: "t (s)", nombreY: "altura del agua, h (m)" });
    if (val.q === 0) {
      ctx.strokeStyle = color("--tenue"); ctx.lineWidth = 1.6; ctx.setLineDash([5, 5]);
      ctx.beginPath(); ctx.moveTo(px(0), py(val.h0)); ctx.lineTo(px(res.vacio), py(0)); ctx.stroke(); ctx.setLineDash([]);
    } else if (res.hEq <= ALTO_TANQUE) {
      ctx.strokeStyle = color("--s3"); ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(px(0), py(res.hEq)); ctx.lineTo(px(tFin), py(res.hEq)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = color("--s3"); ctx.textAlign = "right";
      ctx.fillText("equilibrio", px(tFin) - 4, py(res.hEq) - 5);
    }
    ctx.strokeStyle = color("--s1"); ctx.lineWidth = 2.6;
    ctx.beginPath();
    res.puntos.forEach(([tt, hh], i) => (i ? ctx.lineTo(px(tt), py(hh)) : ctx.moveTo(px(tt), py(hh))));
    ctx.stroke();
    if (tAnim !== null) {
      ctx.fillStyle = color("--s2");
      ctx.beginPath(); ctx.arc(px(t), py(h), 4.5, 0, 2 * Math.PI); ctx.fill();
    }
    return tFin;
  }

  function vaciar() {
    cancelAnimationFrame(animacion);
    const tFin = dibujar(0);
    const inicio = performance.now(), DURACION = 8;
    const cuadro = ahora => {
      const p = Math.min((ahora - inicio) / 1000 / DURACION, 1);
      dibujar(p * tFin);
      if (p < 1) animacion = requestAnimationFrame(cuadro);
    };
    animacion = requestAnimationFrame(cuadro);
  }

  [control.d, control.h0, control.q].forEach(e => e.addEventListener("input", () => { cancelAnimationFrame(animacion); dibujar(); }));
  control.cd.addEventListener("change", () => { cancelAnimationFrame(animacion); dibujar(); });
  $("btnVaciar").addEventListener("click", vaciar);
  observarTamano(lienzo, () => { tam = null; dibujar(); });
  dibujar();
  return { dibujar: () => { tam = null; dibujar(); } };
}
