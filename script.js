/* ===== Utilidades globales ===== */
const $ = (id) => document.getElementById(id);
const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 300));
const miniatura = (foto) => 'img/thumbs/' + foto.split('/').pop().replace(/\.[^.]+$/, '').replace(/\s+/g, '_') + '.webp';

let globoPendiente = null;
let audioVideoPausedAt = 0;
let audioDebeReanudar = false;

function pausarMusicaPorVideo() {
  const audio = document.getElementById('ambientAudio');
  if (!audio || audio.paused) return;
  audioVideoPausedAt = audio.currentTime;
  audio.pause();
  audioDebeReanudar = true;
}

function reanudarMusicaTrasVideo() {
  const audio = document.getElementById('ambientAudio');
  if (!audio || !audioDebeReanudar) return;
  audio.currentTime = audioVideoPausedAt;
  audio.play().catch(() => {});
  audioDebeReanudar = false;
}

function activarVideoAudio() {
  const video = document.querySelector('#paneVideo video');
  if (!video) return;

  video.muted = false;
  video.volume = 1;
  video.playsInline = true;

  const intentar = () => {
    video.play().catch(() => setTimeout(intentar, 200));
  };

  intentar();
}

/* ===== INYECCIÓN DE POP-UP, PESTAÑA DE VIDEO Y SISTEMA DE ME GUSTA ===== */
document.addEventListener('DOMContentLoaded', () => {
  // 1. Inyectar Pop-up de Avistamiento (Solo Foto y Texto)
  const estilosPopup = document.createElement('style');
  estilosPopup.innerHTML = `
    .avist-overlay { position: fixed; inset: 0; background: rgba(4, 18, 14, 0.95); z-index: 9999; display: grid; place-items: center; padding: 1rem; opacity: 0; visibility: hidden; transition: 0.3s ease; }
    .avist-overlay.is-active { opacity: 1; visibility: visible; }
    .avist-modal { background: linear-gradient(160deg, #102d22, #081a14); border: 2px solid #f9c85d; border-radius: 1.2rem; max-width: 420px; width: 100%; padding: 1.8rem; color: #fff; text-align: center; transform: translateY(20px) scale(0.95); transition: 0.3s cubic-bezier(0.2, 0.9, 0.3, 1.1); box-shadow: 0 20px 50px rgba(0,0,0,0.6), 0 0 40px -10px rgba(249, 200, 93, 0.3); }
    .avist-overlay.is-active .avist-modal { transform: translateY(0) scale(1); }
    .avist-modal h3 { color: #f9c85d; margin-bottom: 1rem; font-size: 1.6rem; line-height: 1.1; }
    .avist-modal img { width: 100%; height: 220px; object-fit: cover; border-radius: 0.8rem; margin-bottom: 1.2rem; border: 2px solid rgba(255,255,255,0.15); box-shadow: 0 8px 20px rgba(0,0,0,0.3); }
    .avist-modal p { font-size: 0.95rem; line-height: 1.5; margin-bottom: 1.5rem; color: #eaf7ee; opacity: 0.9; }
    .avist-btn { background: #f9c85d; color: #10251d; border: none; padding: 0.8rem 1.8rem; font-size: 1.05rem; font-weight: bold; border-radius: 2rem; cursor: pointer; transition: 0.25s ease; width: 100%; }
    .avist-btn:hover { background: #ffd861; transform: translateY(-2px); box-shadow: 0 6px 15px rgba(249, 200, 93, 0.3); }
  `;
  document.head.appendChild(estilosPopup);

  const htmlPopup = `
    <div id="avistOverlay" class="avist-overlay">
      <div class="avist-modal">
        <h3 id="avistTitle"></h3>
        <img id="avistImg" src="" alt="Especie destacada" style="display:none;">
        <p id="avistText"></p>
        <button id="avistBtn" class="avist-btn">Ver todas las especies</button>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', htmlPopup);

  // 2. Inyectar Pestaña de Video en el Panel
  const tabsContainer = document.querySelector('.species-tabs');
  const dialogContainer = document.querySelector('.species-dialog');

  if (tabsContainer && dialogContainer) {
    tabsContainer.insertAdjacentHTML('beforeend', `
      <button type="button" role="tab" id="tabBtnVideo" data-tab="video" aria-selected="false" aria-controls="paneVideo" style="display: none;">
        Video
      </button>
    `);

    dialogContainer.insertAdjacentHTML('beforeend', `
      <div class="species-pane" id="paneVideo" role="tabpanel" aria-labelledby="tabBtnVideo" hidden>
        <div style="padding: 1.5rem; text-align: center; overflow-y: auto; height: 100%; display: flex; flex-direction: column; align-items: center;">
          <h3 style="color: #f9c85d; margin-bottom: 1.5rem; font-size: clamp(1.2rem, 3vw, 1.8rem);">Explicación de la Laguna</h3>
          <div id="vidMedia" style="width: 100%; max-width: 650px; border-radius: 0.8rem; overflow: hidden; border: 2px solid rgba(255,255,255,0.15); background: #000; box-shadow: 0 10px 30px rgba(0,0,0,0.4);"></div>
        </div>
      </div>
    `);

    tabsContainer.addEventListener('click', (event) => {
      const tabBtn = event.target.closest('[data-tab]');
      if (!tabBtn || !tabBtn.closest('.species-tabs')) return;
      cambiarPestana(tabBtn.dataset.tab);
    });
  }

  // 3. INYECCIÓN DEL SISTEMA DE "ME GUSTA" (MARGEN IZQUIERDO)
  const estilosMeGusta = document.createElement('style');
  estilosMeGusta.innerHTML = `
    .like-sidebar { position: fixed; left: 16px; top: 50%; transform: translateY(-50%); z-index: 99; display: flex; flex-direction: column; align-items: center; gap: 8px; font-family: sans-serif; background: rgba(8, 30, 22, 0.9); border: 1px solid rgba(249, 200, 93, 0.25); border-radius: 50px; padding: 14px 10px; box-shadow: 0 12px 32px rgba(0,0,0,0.4); backdrop-filter: blur(8px); transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
    .like-sidebar:hover { border-color: #f9c85d; }
    .like-btn { border: none; background: linear-gradient(135deg, #ff4757, #ff6b81); width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; color: white; font-size: 24px; box-shadow: 0 4px 12px rgba(255, 71, 87, 0.4); user-select: none; transition: transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.4); animation: heartbeat 1.8s infinite alternate; }
    .like-btn:active { transform: scale(0.85); animation: none; }
    .like-btn.bursting { animation: burst 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.6) !important; }
    .like-stats { display: flex; flex-direction: column; align-items: center; gap: 1px; color: #fff; }
    .like-count { font-size: 15px; font-weight: 800; color: #f9c85d; transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.6); text-shadow: 0 2px 4px rgba(0,0,0,0.4); }
    .like-count.bump { transform: scale(1.3) rotate(5deg); color: #ff6b81; }
    .like-label { font-size: 9px; text-transform: uppercase; font-weight: 700; opacity: 0.7; letter-spacing: 0.05em; color: #eaf7ee; }
    
    /* Pequeños globos / combos */
    .combo-badge { position: absolute; left: 64px; top: 12px; background: #ffd861; color: #10251d; padding: 3px 8px; border-radius: 12px; font-size: 10px; font-weight: 800; opacity: 0; pointer-events: none; transform: translateX(-10px) scale(0.8); transition: all 0.25s ease; box-shadow: 0 4px 8px rgba(0,0,0,0.2); white-space: nowrap; }
    .combo-badge.active { opacity: 1; transform: translateX(0) scale(1); }

    /* Partículas de corazones flotantes */
    .flying-heart { position: fixed; pointer-events: none; z-index: 10000; font-size: var(--size); color: var(--color); transform: translate(-50%, -50%) rotate(var(--rot)); animation: flyAway var(--time) cubic-bezier(0.1, 0.8, 0.3, 1) forwards; }

    @keyframes heartbeat {
      0% { transform: scale(1); }
      20% { transform: scale(1.08); }
      40% { transform: scale(1); }
      60% { transform: scale(1.06); }
      80%, 100% { transform: scale(1); }
    }
    @keyframes burst {
      0% { transform: scale(0.85); }
      50% { transform: scale(1.25) rotate(-8deg); }
      100% { transform: scale(1) rotate(0); }
    }
    @keyframes flyAway {
      0% { opacity: 1; transform: translate(-50%, -50%) translate(0, 0) scale(1) rotate(var(--rot)); }
      100% { opacity: 0; transform: translate(-50%, -50%) translate(var(--tx), var(--ty)) scale(0.5) rotate(calc(var(--rot) * 1.5)); }
    }

    @media (max-width: 720px) {
      .like-sidebar { left: 8px; top: auto; bottom: 80px; transform: scale(0.85); }
      .combo-badge { left: auto; right: 64px; transform: translateX(10px) scale(0.8); }
    }
  `;
  document.head.appendChild(estilosMeGusta);

  const htmlMeGusta = `
    <div class="like-sidebar" id="likeSidebar">
      <button class="like-btn" id="likeBtn" aria-label="Dar un corazón">❤️</button>
      <div class="like-stats">
        <span class="like-count" id="likeCount">142</span>
        <span class="like-label">Likes</span>
      </div>
      <div class="combo-badge" id="comboBadge">¡Gracias! 🙌</div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', htmlMeGusta);

  /* LÓGICA DEL SISTEMA DE ME GUSTA */
  const likeBtn = $('likeBtn');
  const likeCountEl = $('likeCount');
  const comboBadge = $('comboBadge');

  // Reset a cero para el push final
  let currentLikes = 0;
  localStorage.setItem('espinar_likes', '0');
  likeCountEl.textContent = currentLikes;

  let clickCombo = 0;
  let comboTimeout = null;

  const runLikeAnimation = (x, y) => {
    // Generar 12-15 corazoncitos y destellos que explotan
    const particleCount = Math.floor(Math.random() * 6) + 12;
    const colors = ['#ff4757', '#ff6b81', '#ff4757', '#ffd226', '#f3a683', '#ff9f43', '#ffffff'];
    const icons = ['❤️', '💖', '✨', '💕', '🧡', '⭐️', '💝', '🫶'];

    for (let i = 0; i < particleCount; i++) {
      const p = document.createElement('div');
      p.className = 'flying-heart';
      p.textContent = icons[Math.floor(Math.random() * icons.length)];
      
      // Estilos CSS aleatorios utilizando custom variables inline
      p.style.setProperty('--size', `${Math.floor(Math.random() * 14) + 12}px`);
      p.style.setProperty('--color', colors[Math.floor(Math.random() * colors.length)]);
      p.style.setProperty('--rot', `${Math.floor(Math.random() * 90) - 45}deg`);
      p.style.setProperty('--time', `${0.6 + Math.random() * 0.9}s`);
      
      // Expulsión de partículas hacia la derecha, arriba y abajo
      const angle = (Math.random() * Math.PI * 2); // 360 grados
      const distance = 40 + Math.random() * 120;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance - (30 + Math.random() * 60); // Sesgar más hacia arriba

      p.style.setProperty('--tx', `${tx}px`);
      p.style.setProperty('--ty', `${ty}px`);
      
      p.style.left = `${x}px`;
      p.style.top = `${y}px`;

      document.body.appendChild(p);
      setTimeout(() => p.remove(), 1500);
    }
  };

  likeBtn.addEventListener('click', (e) => {
    currentLikes++;
    localStorage.setItem('espinar_likes', currentLikes);
    
    // Sumarle animación visual al contador
    likeCountEl.textContent = currentLikes;
    likeCountEl.classList.add('bump');
    setTimeout(() => likeCountEl.classList.remove('bump'), 200);

    // Animación explosión del botón
    likeBtn.classList.add('bursting');
    setTimeout(() => likeBtn.classList.remove('bursting'), 400);

    // Detectar posición de clic para disparar los corazones voladores
    const rect = likeBtn.getBoundingClientRect();
    const clickX = e.clientX || rect.left + rect.width / 2;
    const clickY = e.clientY || rect.top + rect.height / 2;
    runLikeAnimation(clickX, clickY);

    // Sistema de COMBOS divertido
    clickCombo++;
    clearTimeout(comboTimeout);
    
    let comboMsg = "¡Gracias! 🙌";
    if (clickCombo > 30) comboMsg = "¡¿Qué pasión?! 🔥🤯";
    else if (clickCombo > 20) comboMsg = "¡Insuperable! ✨🏆";
    else if (clickCombo > 15) comboMsg = "¡Qué locura! ❤️🔥";
    else if (clickCombo > 10) comboMsg = "¡Mucho amor! 😍";
    else if (clickCombo > 5) comboMsg = "¡Esoooo! 🚀";

    comboBadge.textContent = comboMsg;
    comboBadge.classList.add('active');

    comboTimeout = setTimeout(() => {
      clickCombo = 0;
      comboBadge.classList.remove('active');
    }, 1800);
  });

  // Lógica del botón de continuar del Pop-up
  $('avistBtn').addEventListener('click', () => {$('avistOverlay').classList.remove('is-active');
    if (globoPendiente) {
      setTimeout(() => {
        abrirPanel(globoPendiente);
        globoPendiente = null;
      }, 300);
    }
  });
});

/* ===== Presentación Inicial ===== */
window.addEventListener('load', () => {
  const presentation = document.getElementById('presentationScreen');
  const gallery = document.getElementById('gallery');

  setTimeout(() => { gallery.classList.add('visible'); }, 3600);
  setTimeout(() => { presentation.style.display = 'none'; }, 5000);
});

/* ===== Parallax de globos ===== */
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

/* ===== Panel de la laguna: especies, mapa y video ===== */
const panel = $('speciesPanel');
const contListas = $('speciesLists');
const fmt = (n) => n.toLocaleString('es-PE', { maximumFractionDigits: 1 });
const listas = {}; 
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
  void ul.offsetWidth; 
  ul.classList.add('anim');
  contListas.scrollTop = 0;

  const estilo = getComputedStyle(globo);
  panel.style.setProperty('--c1', estilo.getPropertyValue('--c1'));
  panel.style.setProperty('--c2', estilo.getPropertyValue('--c2'));

  $('speciesTitle').textContent = laguna.nombre;
  $('speciesMeta').textContent = `${ul.dataset.total} especies registradas`;
  $('speciesHeadImg').src = encodeURI(laguna.foto);

  // === CONFIGURAR PESTAÑA DE VIDEO ===
  const tabVideo = $('tabBtnVideo');
  const vidMedia = $('vidMedia');

  if (tabVideo && vidMedia) {
    if (laguna.video) {
      tabVideo.style.display = 'inline-block';
      vidMedia.innerHTML = `<video controls playsinline style="width: 100%; display: block; max-height: 50vh;"><source src="${laguna.video}" type="video/mp4"></video>`;

      const video = vidMedia.querySelector('video');
      if (video) {
        video.muted = false;
        video.volume = 1;
        video.preload = 'auto';
        video.playsInline = true;
        video.addEventListener('play', () => pausarMusicaPorVideo());
        video.addEventListener('ended', () => reanudarMusicaTrasVideo());
        video.addEventListener('pause', () => {
          if (!video.ended && document.getElementById('paneVideo')?.hidden) {
            reanudarMusicaTrasVideo();
          }
        });
      }
    } else {
      tabVideo.style.display = 'none';
      vidMedia.innerHTML = '';
    }
  }

  cambiarPestana('especies'); // Siempre abre en Especies por defecto
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
  
  // Detener el video si se estaba reproduciendo
  const vid = $('paneVideo')?.querySelector('video');
  if (vid) vid.pause();
  reanudarMusicaTrasVideo();

  if (devolverFoco && globoActivo) globoActivo.focus();
}

panel.addEventListener('click', (e) => {
  if (e.target.closest('[data-close]')) cerrarPanel();
});

/* --- Lógica de Pestañas (Especies, Mapa, Video) --- */
function cambiarPestana(nombre) {
  const pestanas = panel.querySelectorAll('.species-tabs button');
  pestanas.forEach((b) => {
    const activa = b.dataset.tab === nombre;
    b.classList.toggle('is-active', activa);
    b.setAttribute('aria-selected', activa);
  });
  
  if ($('paneEspecies'))$('paneEspecies').hidden = nombre !== 'especies';
  if ($('paneMapa'))$('paneMapa').hidden = nombre !== 'mapa';
  if ($('paneVideo')) {$('paneVideo').hidden = nombre !== 'video';
    const vid = $('paneVideo').querySelector('video');
    if (nombre !== 'video') {
      if (vid) vid.pause();
      reanudarMusicaTrasVideo();
    } else if (vid) {
      requestAnimationFrame(() => activarVideoAudio());
    }
  }

  if (nombre === 'mapa') mostrarMapa(lagunaActiva);
}

/* --- Mapa Leaflet --- */
const FUENTES_LEAFLET = [
  { css: 'lib/leaflet/leaflet.css', js: 'lib/leaflet/leaflet.js' },
  { css: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css', js: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js' }
];
let promesaLeaflet = null;
let mapa = null;
let pin = null;

function cargarScript(src) {
  return new Promise((ok, fallo) => {
    const s = document.createElement('script');
    s.src = src; s.onload = ok;
    s.onerror = () => { s.remove(); fallo(new Error(src)); };
    document.head.appendChild(s);
  });
}

function cargarLeaflet() {
  if (window.L) return Promise.resolve();
  if (!promesaLeaflet) {
    promesaLeaflet = FUENTES_LEAFLET.reduce((prev, f) => prev.catch(() => {
      const css = document.createElement('link');
      css.rel = 'stylesheet'; css.href = f.css;
      document.head.appendChild(css);
      return cargarScript(f.js);
    }), Promise.reject()).catch((err) => { promesaLeaflet = null; throw err; });
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
    'Satélite': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19 }),
    'Relieve': L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', { maxZoom: 17, subdomains: 'abc' }),
    'Calles': L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 })
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
  if (!laguna.coords) { mensajeMapa('Aún no hay coordenadas'); return; }
  mensajeMapa('Cargando mapa…');
  cargarLeaflet().then(() => {
    if (lagunaActiva !== id || $('paneMapa').hidden) return; 
    mensajeMapa('');
    if (!mapa) crearMapa();
    mapa.invalidateSize();
    mapa.setView(laguna.coords, laguna.zoom || 15, { animate: false });
    pin.setLatLng(laguna.coords);
    pin.setTooltipContent(laguna.nombre);
  }).catch(() => mensajeMapa('No se pudo cargar el mapa.'));
}

/* ===== Eventos de Globos (Interceptar para el Pop-up) ===== */
function procesarClickGlobo(globo) {
  const id = globo.dataset.laguna;
  const laguna = LAGUNAS[id];
  
  if (laguna.avistamiento_popup) {
    globoPendiente = globo; 
    
    // Llenar Pop-up con nombre y foto
    $('avistTitle').textContent = laguna.avistamiento_popup.titulo;
    $('avistText').textContent = laguna.avistamiento_popup.texto;
    
    if (laguna.avistamiento_popup.imagen) {
      $('avistImg').src = laguna.avistamiento_popup.imagen;
      $('avistImg').style.display = 'block';
    } else {
      $('avistImg').style.display = 'none';
    }
    
    $('avistOverlay').classList.add('is-active');
  } else {
    // Si no hay avistamiento raro, abre directo
    abrirPanel(globo);
  }
}

document.querySelectorAll('.balloon').forEach((globo) => {
  globo.tabIndex = 0;
  globo.setAttribute('role', 'button');
  globo.setAttribute('aria-label', `Ver especies y mapa de ${LAGUNAS[globo.dataset.laguna].nombre}`);
  
  globo.addEventListener('click', () => procesarClickGlobo(globo));

  globo.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      procesarClickGlobo(globo);
    }
  });
});

/* ===== Línea de tiempo ===== */
const tlTrack = $('timelineTrack');
const tlPrev = $('tlPrev');
const tlNext = $('tlNext');
const tlCount = $('tlCount');
let timelineListo = false;
let pasoObjetivo = 0; 

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
  if (!ancho) return; 
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
  if (e.key === 'Escape') {
    cerrarPanel();
    $('avistOverlay')?.classList.remove('is-active');
  }
  if (document.body.dataset.view === 'timeline') {
    if (e.key === 'ArrowRight') tlNext.click();
    if (e.key === 'ArrowLeft') tlPrev.click();
  }
});