window.addEventListener('load', () => {
  const presentation = document.getElementById('presentationScreen');
  const gallery = document.getElementById('gallery');

  setTimeout(() => {
    gallery.classList.add('visible');
  }, 3600);

  setTimeout(() => {
    presentation.style.display = 'none';
  }, 5000);
});

// Parallax: la foto de cada globo sigue al cursor (1 actualización por cuadro, solo con mouse)
const balloons = document.querySelector('.balloons');
let cuadroParallax = 0;
let cursorX = 0;
let cursorY = 0;

document.getElementById('gallery').addEventListener('pointermove', (e) => {
  if (e.pointerType !== 'mouse') return;
  cursorX = (e.clientX / window.innerWidth - 0.5) * 2;
  cursorY = (e.clientY / window.innerHeight - 0.5) * 2;
  if (cuadroParallax) return;
  cuadroParallax = requestAnimationFrame(() => {
    cuadroParallax = 0;
    if (document.body.classList.contains('panel-abierto')) return;
    balloons.style.setProperty('--mx', cursorX.toFixed(2));
    balloons.style.setProperty('--my', cursorY.toFixed(2));
  });
});

/* ===== Utilidades ===== */
const $ = (id) => document.getElementById(id);
const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 300));

// img/Fulica_gigantea.webp -> img/thumbs/Fulica_gigantea.webp (lo genera optimizar_imagenes.py)
const miniatura = (foto) =>
  'img/thumbs/' + foto.split('/').pop().replace(/\.[^.]+$/, '').replace(/\s+/g, '_') + '.webp';

/* ===== Selector de vista: lagunas / línea de tiempo ===== */
const botonesVista = document.querySelectorAll('.view-switch button');

function cambiarVista(vista) {
  cerrarPanel(false);
  document.body.dataset.view = vista;
  botonesVista.forEach((b) => {
    const activo = b.dataset.view === vista;
    b.classList.toggle('is-active', activo);
    b.setAttribute('aria-pressed', activo);
  });
  if (vista === 'timeline') {
    construirTimeline();
    tlTrack.scrollLeft = 0;
    pasoObjetivo = 0;
    actualizarContador();
  }
}

botonesVista.forEach((b) => b.addEventListener('click', () => cambiarVista(b.dataset.view)));

/* ===== Panel de la laguna: especies + mapa ===== */
const panel = $('speciesPanel');
const contListas = $('speciesLists');
const fmt = (n) => n.toLocaleString('es-PE', { maximumFractionDigits: 1 });
const listas = {}; // una lista por laguna, se crea una sola vez y se reutiliza
let lagunaActiva = null;
let globoActivo = null;

function crearLista(id) {
  const filas = Object.entries(LAGUNAS[id].registros)
    .map(([esp, [a2025, a2026]]) => ({ ...ESPECIES[esp], a2025, a2026, prom: (a2025 + a2026) / 2 }))
    .sort((x, y) => y.prom - x.prom || x.cientifico.localeCompare(y.cientifico));
  const max = filas[0].prom;

  const ul = document.createElement('ul');
  ul.className = 'species-list';
  ul.hidden = true;
  ul.innerHTML = filas.map((f, i) => `
    <li class="sp" style="--w: ${((f.prom / max) * 100).toFixed(1)}%; --i: ${i}">
      <img class="sp-img" src="${miniatura(f.foto)}" data-full="${encodeURI(f.foto)}" alt="" width="56" height="56" decoding="async" />
      <div class="sp-info">
        <p class="sp-names"><em>${f.cientifico}</em>${f.comun ? `<span>${f.comun}</span>` : ''}</p>
        <div class="sp-bar"><span></span></div>
        <p class="sp-years">2025: ${f.a2025} · 2026: ${f.a2026}</p>
      </div>
      <p class="sp-avg"><strong>${fmt(f.prom)}</strong><small>promedio</small></p>
    </li>`).join('');
  ul.dataset.total = filas.length;
  contListas.appendChild(ul);
  listas[id] = ul;
  return ul;
}

// si no existe la miniatura se usa la foto original; si tampoco carga, se oculta
contListas.addEventListener('error', (e) => {
  const img = e.target;
  if (img.tagName !== 'IMG') return;
  if (img.dataset.full && !img.dataset.usada) {
    img.dataset.usada = '1';
    img.src = img.dataset.full;
  } else {
    img.classList.add('is-broken');
  }
}, true);

// las listas de las 3 lagunas se preparan cuando el navegador está libre
window.addEventListener('load', () => {
  idle(() => Object.keys(LAGUNAS).forEach((id) => listas[id] || crearLista(id)), { timeout: 4000 });
});

function abrirPanel(globo) {
  lagunaActiva = globo.dataset.laguna;
  globoActivo = globo;
  const laguna = LAGUNAS[lagunaActiva];
  const ul = listas[lagunaActiva] || crearLista(lagunaActiva);

  Object.values(listas).forEach((l) => { l.hidden = l !== ul; });
  ul.classList.remove('anim');
  void ul.offsetWidth; // reinicia la animación de las barras
  ul.classList.add('anim');
  contListas.scrollTop = 0;

  // el panel toma los colores del globo tocado
  const estilo = getComputedStyle(globo);
  panel.style.setProperty('--c1', estilo.getPropertyValue('--c1'));
  panel.style.setProperty('--c2', estilo.getPropertyValue('--c2'));

  $('speciesTitle').textContent = laguna.nombre;
  $('speciesMeta').textContent = `${ul.dataset.total} especies registradas`;
  $('speciesHeadImg').src = encodeURI(laguna.foto);

  cambiarPestana('especies');
  document.body.classList.add('panel-abierto');
  panel.classList.add('open');
  panel.setAttribute('aria-hidden', 'false');
  panel.querySelector('.species-close').focus();
}

function cerrarPanel(devolverFoco = true) {
  if (!panel.classList.contains('open')) return;
  panel.classList.remove('open');
  panel.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('panel-abierto');
  if (devolverFoco && globoActivo) globoActivo.focus();
}

panel.addEventListener('click', (e) => {
  if (e.target.closest('[data-close]')) cerrarPanel();
});

/* --- pestañas --- */
const pestanas = panel.querySelectorAll('.species-tabs button');

function cambiarPestana(nombre) {
  pestanas.forEach((b) => {
    const activa = b.dataset.tab === nombre;
    b.classList.toggle('is-active', activa);
    b.setAttribute('aria-selected', activa);
  });
  $('paneEspecies').hidden = nombre !== 'especies';
  $('paneMapa').hidden = nombre !== 'mapa';
  if (nombre === 'mapa') mostrarMapa(lagunaActiva);
}

pestanas.forEach((b) => b.addEventListener('click', () => cambiarPestana(b.dataset.tab)));

/* --- mapa (Leaflet se carga solo la primera vez que se abre la pestaña) --- */
const FUENTES_LEAFLET = [
  { css: 'lib/leaflet/leaflet.css', js: 'lib/leaflet/leaflet.js' },
  { css: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css',
    js: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js' }
];
let promesaLeaflet = null;
let mapa = null;
let pin = null;

function cargarScript(src) {
  return new Promise((ok, fallo) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = ok;
    s.onerror = () => { s.remove(); fallo(new Error(src)); };
    document.head.appendChild(s);
  });
}

function cargarLeaflet() {
  if (window.L) return Promise.resolve();
  if (!promesaLeaflet) {
    // primero la copia local (lib/leaflet); si no está, la del CDN
    promesaLeaflet = FUENTES_LEAFLET.reduce((prev, f) => prev.catch(() => {
      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = f.css;
      document.head.appendChild(css);
      return cargarScript(f.js);
    }), Promise.reject()).catch((err) => {
      promesaLeaflet = null;
      throw err;
    });
  }
  return promesaLeaflet;
}

function mensajeMapa(texto) {
  $('mapMsg').textContent = texto;
  $('mapMsg').hidden = !texto;
  $('speciesMap').style.visibility = texto ? 'hidden' : '';
}

function crearMapa() {
  mapa = L.map('speciesMap', { zoomSnap: 0.5 });
  const capas = {
    'Satélite': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19, attribution: 'Imágenes © Esri, Maxar, Earthstar Geographics'
    }),
    'Relieve': L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      maxZoom: 17, subdomains: 'abc', attribution: '© OpenStreetMap · SRTM · © OpenTopoMap (CC-BY-SA)'
    }),
    'Calles': L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '© OpenStreetMap'
    })
  };
  capas['Satélite'].addTo(mapa);
  L.control.layers(capas, null, { collapsed: true }).addTo(mapa);
  L.control.scale({ imperial: false }).addTo(mapa);

  pin = L.marker([0, 0], {
    icon: L.divIcon({ className: 'map-pin', html: '<span></span>', iconSize: [26, 26], iconAnchor: [13, 13] })
  }).addTo(mapa).bindTooltip('', { permanent: true, direction: 'top', offset: [0, -16], className: 'map-tip' });

  Object.values(capas).forEach((capa) => {
    capa.on('tileerror', () => { $('mapAviso').hidden = false; });
    capa.on('tileload', () => { $('mapAviso').hidden = true; });
  });
}

function mostrarMapa(id) {
  const laguna = LAGUNAS[id];
  $('mapAviso').hidden = true;
  if (!laguna.coords) {
    mensajeMapa('Aún no hay coordenadas para esta laguna. Agrégalas en datos.js (coords: [latitud, longitud]).');
    return;
  }
  mensajeMapa('Cargando mapa…');
  cargarLeaflet().then(() => {
    if (lagunaActiva !== id || $('paneMapa').hidden) return; // el usuario ya cambió de laguna o pestaña
    mensajeMapa('');
    if (!mapa) crearMapa();
    mapa.invalidateSize();
    mapa.setView(laguna.coords, laguna.zoom || 15, { animate: false });
    pin.setLatLng(laguna.coords);
    pin.setTooltipContent(laguna.nombre);
  }).catch(() => mensajeMapa('No se pudo cargar el mapa: falta la carpeta lib/leaflet o la conexión a internet.'));
}

/* --- globos: clic / toque / teclado --- */
document.querySelectorAll('.balloon').forEach((globo) => {
  globo.tabIndex = 0;
  globo.setAttribute('role', 'button');
  globo.setAttribute('aria-label', `Ver especies y mapa de ${LAGUNAS[globo.dataset.laguna].nombre}`);
  globo.addEventListener('click', () => abrirPanel(globo));
  globo.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      abrirPanel(globo);
    }
  });
});

/* ===== Línea de tiempo (se construye la primera vez que se abre) ===== */
const tlTrack = $('timelineTrack');
const tlPrev = $('tlPrev');
const tlNext = $('tlNext');
const tlCount = $('tlCount');
let timelineListo = false;
let pasoObjetivo = 0; // etapa a la que se dirige el scroll (varios clics seguidos no se pierden)

function construirTimeline() {
  if (timelineListo) return;
  timelineListo = true;
  const fragmento = document.createDocumentFragment();
  ETAPAS.forEach((etapa, i) => {
    const paso = document.createElement('li');
    paso.className = 'step';
    paso.innerHTML = `
      <article class="step-card">
        <div class="step-media no-img"><span class="step-num">${i + 1}</span></div>
        <div class="step-body">
          <p class="step-date">${etapa.fecha}</p>
          <h3>${etapa.titulo}</h3>
          <p class="step-desc">${etapa.texto}</p>
        </div>
      </article>`;
    // si la foto existe se muestra; si no, queda el número de etapa
    const media = paso.querySelector('.step-media');
    const foto = new Image();
    foto.alt = etapa.titulo;
    foto.decoding = 'async';
    foto.addEventListener('load', () => {
      media.prepend(foto);
      media.classList.remove('no-img');
    });
    foto.src = encodeURI(etapa.imagen);
    fragmento.appendChild(paso);
  });
  tlTrack.appendChild(fragmento);
}

function anchoPaso() {
  const paso = tlTrack.querySelector('.step');
  return paso ? paso.offsetWidth + parseFloat(getComputedStyle(tlTrack).columnGap) : 0;
}

function actualizarContador() {
  const ancho = anchoPaso();
  if (!ancho) return; // vista oculta o aún sin construir
  const i = Math.min(Math.round(tlTrack.scrollLeft / ancho), ETAPAS.length - 1);
  tlCount.textContent = `${i + 1} / ${ETAPAS.length}`;
  tlPrev.disabled = i === 0;
  tlNext.disabled = i === ETAPAS.length - 1;
}

function irAPaso(delta) {
  pasoObjetivo = Math.max(0, Math.min(ETAPAS.length - 1, pasoObjetivo + delta));
  tlTrack.scrollTo({ left: pasoObjetivo * anchoPaso(), behavior: 'smooth' });
}

tlTrack.addEventListener('scroll', actualizarContador, { passive: true });
tlTrack.addEventListener('scrollend', () => {
  const ancho = anchoPaso();
  if (ancho) pasoObjetivo = Math.min(Math.round(tlTrack.scrollLeft / ancho), ETAPAS.length - 1);
});
tlPrev.addEventListener('click', () => irAPaso(-1));
tlNext.addEventListener('click', () => irAPaso(1));

/* ===== Teclado ===== */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') cerrarPanel();
  if (document.body.dataset.view === 'timeline') {
    if (e.key === 'ArrowRight') tlNext.click();
    if (e.key === 'ArrowLeft') tlPrev.click();
  }
});