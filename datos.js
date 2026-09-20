/* =====================================================
   DATOS DEL PROYECTO  (edita aquí, no en script.js)
   ===================================================== */

/* Especies: nombre científico, nombre común (opcional) y foto.
   Deja "comun" vacío ('') si aún no lo confirmas. */
const ESPECIES = {
  fulica:          { cientifico: 'Fulica gigantea',            comun: 'Gallareta gigante',       foto: 'img/Fulica_gigantea.webp' },
  chloephaga:      { cientifico: 'Chloephaga melanoptera',     comun: 'Ganso andino',            foto: 'img/Clhoephaga_melanoptera.jpg' },
  lessonia:        { cientifico: 'Lessonia oreas',             comun: 'Negrito andino',          foto: 'img/Lessonia_oreas.jpg' },
  orochelidon:     { cientifico: 'Orochelidon andecola',       comun: 'Golondrina andina',       foto: 'img/Orochelidon_andecola.jpeg' },
  plegadis:        { cientifico: 'Plegadis ridgwayi',          comun: 'Ibis de la puna',         foto: 'img/Plegadis_ridgwayi.jpg' },
  colaptes:        { cientifico: 'Colaptes rupicola',          comun: 'Carpintero andino',       foto: 'img/Colaptes_rupicola.jpg' },
  anas:            { cientifico: 'Anas puna',                  comun: '',                        foto: 'img/Anas_puna.jpg' },
  falco:           { cientifico: 'Falco sparverius',           comun: 'Cernícalo americano',     foto: 'img/Falco_sparverius.jpg' },
  metriopelia:     { cientifico: 'Metriopelia ceciliae',       comun: 'Tortolita moteada',       foto: 'img/Metriopelia_ceciliae.jpg' },
  nothoprocta:     { cientifico: 'Nothoprocta ornata',         comun: '',                        foto: 'img/Nothoprocta_ornata.jpg' },
  columba:         { cientifico: 'Columba livia',              comun: 'Paloma doméstica',        foto: 'img/Columbia_livia.webp' },
  bubo:            { cientifico: 'Bubo virginianus',           comun: 'Búho americano',          foto: 'img/Buho_virginianus.jpg' },
  vanellus:        { cientifico: 'Vanellus resplendens',       comun: 'Avefría andina',          foto: 'img/Vanellus_resplendens.jpg' },
  phoenicopterus:  { cientifico: 'Phoenicopterus chilensis',   comun: 'Flamenco chileno',        foto: 'img/Phoenicopterus_chilensis.jpg' },
  zonotrichia:     { cientifico: 'Zonotrichia capensis',       comun: 'Gorrión de collar rufo',  foto: 'img/Zonotrichia_capensis.jpg' },
  ardea:           { cientifico: 'Ardea alba',                 comun: 'Garza grande',            foto: 'img/Ardea_alba.jpg' },
  phalcoboenus:    { cientifico: 'Phalcoboenus megalopterus',  comun: 'Caracara cordillerano',   foto: 'img/Phalcoboenus_megalopterus.jpg' },
  chroicocephalus: { cientifico: 'Chroicocephalus serranus',   comun: 'Gaviota andina',          foto: 'img/Chroicocephalus_serranus.jpg' },
  rollandia:       { cientifico: 'Rollandia rolland',          comun: '',                        foto: 'img/Rollandia_rolland.jpg' },
  conirostrum:     { cientifico: 'Conirostrum cinereum',       comun: 'Pico de cono cinéreo',    foto: 'img/Conirostrum_cinereum.jpg' },
  circus:          { cientifico: 'Circus cinereus',            comun: 'Gavilán ceniciento',      foto: 'img/Circus_cinereus.jpg' },
  oxyura:          { cientifico: 'Oxyura jamaicensis',         comun: '',                        foto: 'img/Oxyura_jamaicensis.jpg' }
};

/* Lagunas: coords = punto del mapa (Leaflet); registros = { especie: [conteo 2025, conteo 2026] } (de Aves.md) */
const LAGUNAS = {
  apanta: {
    nombre: 'Laguna de Apanta',
    coords: [-14.560944, -71.588806],   // TU COORDENADA: [latitud, longitud], ej. [-14.123456, -71.123456]
    zoom: 15,       // acercamiento inicial del mapa (1 lejos ... 19 cerca)
    foto: 'img/Apanta_parado.jpg',
    registros: {
      fulica: [8, 15], chloephaga: [18, 5], lessonia: [34, 0], orochelidon: [32, 4],
      plegadis: [0, 5], colaptes: [8, 10], anas: [8, 0], vanellus: [2, 4],
      phoenicopterus: [3, 3], zonotrichia: [15, 6], phalcoboenus: [6, 5],
      conirostrum: [34, 0], circus: [1, 0], falco: [1, 2], oxyura: [3, 0],
      chroicocephalus: [7, 0]
    }
  },
  apacheta: {
    nombre: 'Laguna de Huaylla Apacheta',
    coords: [-14.589917, -71.706167],   // TU COORDENADA: [latitud, longitud], ej. [-14.123456, -71.123456]
    zoom: 15,       // acercamiento inicial del mapa (1 lejos ... 19 cerca)
    foto: 'img/Huayalla_Apacheta_parado.jpg',
    registros: {
      fulica: [15, 9], chloephaga: [2, 2], lessonia: [4, 0], orochelidon: [1, 0],
      plegadis: [2, 0], colaptes: [4, 1], anas: [6, 3], falco: [0, 5],
      metriopelia: [0, 1], nothoprocta: [0, 1], columba: [0, 3]
    }
  },
  qochapata: {
    nombre: 'Laguna de Qochapata',
    coords: [-14.758972, -71.447306],   // TU COORDENADA: [latitud, longitud], ej. [-14.123456, -71.123456]
    zoom: 15,       // acercamiento inicial del mapa (1 lejos ... 19 cerca)
    foto: 'img/Qochapata_parado.jpg',
    registros: {
      fulica: [5, 32], chloephaga: [1, 0], lessonia: [6, 22], orochelidon: [0, 3],
      bubo: [0, 1], plegadis: [10, 7], colaptes: [15, 5], anas: [12, 2],
      vanellus: [10, 2], phoenicopterus: [42, 31], zonotrichia: [7, 7], ardea: [6, 0],
      phalcoboenus: [0, 4], falco: [0, 1], chroicocephalus: [0, 15], rollandia: [0, 1],
      columba: [0, 3]
    }
  }
};

/* Línea de tiempo. "imagen": pon la foto en img/linea/ con ese nombre
   (si el archivo no existe, la tarjeta muestra solo el número de etapa). */
const ETAPAS = [
  { fecha: 'Ago – Set 2015',          titulo: 'Estudio base',
    texto: 'Estudio previo (Huamani et al.): 22 especies registradas en Espinar.',
    imagen: 'img/fondo_presentacion.jpg' },
  { fecha: 'Jul 2024 – Ene 2025',     titulo: 'Marco normativo',
    texto: 'Ley Nro 3299 y DS 002-2025 MINAM: protección de humedales del Perú.',
    imagen: 'img/Ley.jpg' },
  { fecha: 'Jul – Ago 2025',          titulo: 'Etapa 1 · Planificación',
    texto: 'Revisión bibliográfica y diseño del plan de indagación EUREKA.',
    imagen: 'img/Plan_Accion.jpeg' },
  { fecha: 'Agosto 2025',             titulo: 'Etapa 2 · Capacitación',
    texto: 'Taller de identificación y taxonomía con la metodología TICAV.',
    imagen: 'img/Capacitacion.jpg' },
  { fecha: '8, 15 y 18 Set 2025',     titulo: 'Etapa 3 · Campo, fase 1',
    texto: 'Tres salidas de campo independientes: Qochapata, Apacheta y Apanta.',
    imagen: 'img/Campo1.jpg' },
  { fecha: '31 Jul – 2 Ago 2026',     titulo: 'Etapa 3 · Campo, fase 2',
    texto: 'Monitoreo simultáneo en las 3 zonas, con apoyo de UNSAAC y Women Birders.',
    imagen: 'img/Apoyo.jpg' },
  { fecha: '1 – 9 Ago 2026',          titulo: 'Etapa 4 · Gabinete',
    texto: 'Análisis Shannon-Wiener (H = 2.61) y redacción del informe final.',
    imagen: 'img/linea/07_gabinete.jpg' }
];