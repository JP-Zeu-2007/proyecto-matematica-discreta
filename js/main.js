// ==========================================
// js/main.js - Lógica Central y Ejemplos Expandidos
// ==========================================

let vertices = []; 
let edges = []; 
let isDirected = false; 
let showNames = true;
let showId = true; 
let ctxTarget = null; 
let isAnimating = false;
let savedGraphs = JSON.parse(localStorage.getItem('umg_grafos_history')) || [];
let currentGraphId = null;

function generateUniqueCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'; 
  let code, attempts = 0;
  do { 
    code = '#'; 
    for (let i = 0; i < 4; i++) code += chars.charAt(Math.floor(Math.random() * chars.length)); 
    attempts++; 
  } while (vertices.some(v => v.code === code) && attempts < 500);
  return code;
}

function getVertex(name) { return vertices.find(v => v.name === name); }
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

function computeGrade(name) {
  if (isDirected) return edges.filter(e => e.a === name).length;
  return edges.filter(e => e.a === name || e.b === name).length;
}

function sumAllGrades() { return vertices.reduce((acc, v) => acc + computeGrade(v.name), 0); }

function toggleVisibility(tipo) {
  if (tipo === 'name') showNames = document.getElementById('toggle-show-name').checked;
  if (tipo === 'id') showId = document.getElementById('toggle-show-id').checked;
  renderGraph();
}

// ==========================================
// VÉRTICES (Con soporte para íconos)
// ==========================================
function addVertexClick() {
  let i = 1;
  while (getVertex(`V${i}`)) i++;
  const name = `V${i}`;
  
  // Obtener el ícono del selector (por defecto 'circle')
  const iconSelect = document.getElementById('vertex-icon-select');
  const selectedIcon = iconSelect ? iconSelect.value : 'circle';

  vertices.push({ 
    name, 
    code: generateUniqueCode(), 
    pinned: false, 
    used: false,
    icon: selectedIcon, // <-- NUEVO: Guardamos el ícono
    x: undefined, 
    y: undefined
  });
  
  render();
}

// ==========================================
// EJEMPLOS EXPANDIDOS (8 a 12 nodos)
// ==========================================
function cargarEjemplo(tipo) {
  vertices = [];
  edges = [];
  
  if (tipo === 'vuelos') {
    // 9 Nodos - Ícono de Avión
    const cities = ["Guatemala", "Miami", "Bogota", "Mexico", "Madrid", "Lima", "Santiago", "Buenos Aires", "Panama"];
    cities.forEach(c => vertices.push({ name: c, code: generateUniqueCode(), icon: 'plane', pinned: false, used: false }));
    const r = (a,b) => edges.push({ a, b, weight: Math.floor(Math.random()*2000)+500 });
    r("Guatemala","Miami"); r("Guatemala","Mexico"); r("Guatemala","Bogota"); r("Guatemala","Panama");
    r("Miami","Madrid"); r("Miami","Bogota"); r("Mexico","Madrid"); r("Mexico","Lima");
    r("Bogota","Lima"); r("Bogota","Panama"); r("Lima","Santiago"); r("Santiago","Buenos Aires"); r("Panama","Madrid");

  } else if (tipo === 'servidores') {
    // 8 Nodos - Ícono de Servidor
    const servers = ["Servidor Central", "Router A", "Router B", "PC Admin", "Base Datos", "Firewall", "Cloud", "Backup"];
    servers.forEach(s => vertices.push({ name: s, code: generateUniqueCode(), icon: 'server', pinned: false, used: false }));
    const r = (a,b) => edges.push({ a, b, weight: null });
    r("Servidor Central","Router A"); r("Servidor Central","Router B"); r("Servidor Central","Firewall");
    r("Router A","PC Admin"); r("Router B","Base Datos"); r("Firewall","Cloud");
    r("Base Datos","Backup"); r("Cloud","Backup"); r("PC Admin","Base Datos");

  } else if (tipo === 'ciudades') {
    // 10 Nodos - Ícono de Edificio
    const zonas = ["Zona 1", "Zona 4", "Zona 10", "Mixco", "Villa Nueva", "Zona 15", "Zona 16", "Carretera", "Zona 2", "Zona 5"];
    zonas.forEach(z => vertices.push({ name: z, code: generateUniqueCode(), icon: 'building', pinned: false, used: false }));
    const r = (a,b) => edges.push({ a, b, weight: Math.floor(Math.random()*50)+5 });
    r("Zona 1","Zona 4"); r("Zona 4","Zona 10"); r("Zona 1","Mixco"); r("Mixco","Villa Nueva");
    r("Villa Nueva","Zona 10"); r("Zona 10","Zona 15"); r("Zona 15","Zona 16"); r("Zona 16","Carretera");
    r("Carretera","Zona 2"); r("Zona 2","Zona 5"); r("Zona 5","Zona 1"); r("Zona 4","Zona 15");

  } else if (tipo === 'tuberias') {
    // 9 Nodos - Ícono de Gota (Agua)
    const plantas = ["Planta Norte", "Bomba1", "Bomba2", "Bomba3", "Tanque1", "Tanque2", "Tanque3", "Filtro", "Desague"];
    plantas.forEach(p => vertices.push({ name: p, code: generateUniqueCode(), icon: 'water', pinned: false, used: false }));
    const r = (a,b) => edges.push({ a, b, weight: Math.floor(Math.random()*500)+100 });
    r("Planta Norte","Bomba1"); r("Planta Norte","Bomba2"); r("Bomba1","Tanque1"); r("Bomba2","Tanque2");
    r("Bomba1","Bomba3"); r("Bomba3","Tanque3"); r("Tanque1","Filtro"); r("Tanque2","Filtro");
    r("Filtro","Desague"); r("Tanque3","Desague");

  } else if (tipo === 'estrella') {
    // 9 Nodos (Prueba de fallo)
    const centro = "Centro";
    vertices.push({ name: centro, code: generateUniqueCode(), icon: 'star', pinned: false, used: false });
    for(let i=1; i<=8; i++) {
      vertices.push({ name: `Hoja ${i}`, code: generateUniqueCode(), icon: 'circle', pinned: false, used: false });
      edges.push({ a: centro, b: `Hoja ${i}`, weight: null });
    }
  }
  
  limpiarAnalisis();
  render();
}
