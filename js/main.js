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
function getOddVertices() { return vertices.filter(v => computeGrade(v.name) % 2 !== 0).map(v => v.name); }

function toggleVisibility(tipo) {
  if (tipo === 'name') showNames = document.getElementById('toggle-show-name').checked;
  if (tipo === 'id') showId = document.getElementById('toggle-show-id').checked;
  renderGraph();
}

function addVertexClick() {
  let i = 1;
  while (getVertex(`V${i}`)) i++;
  const name = `V${i}`;
  const iconSelect = document.getElementById('vertex-icon-select');
  const selectedIcon = iconSelect ? iconSelect.value : 'circle';

  vertices.push({ name, code: generateUniqueCode(), pinned: false, used: false, icon: selectedIcon, x: undefined, y: undefined });
  render();
}

function addEdge(a, b) {
  if (a === b) return;
  if (edges.some(e => (e.a === a && e.b === b) || (!isDirected && e.a === b && e.b === a))) return;
  edges.push({ a, b, weight: null });
  render();
}

function removeEdge(a, b) {
  edges = edges.filter(e => !((e.a === a && e.b === b) || (!isDirected && e.a === b && e.b === a)));
  render();
}

function openContextMenu(x, y, vertexName) {
  ctxTarget = vertexName; 
  const menu = document.getElementById('context-menu');
  menu.style.left = Math.max(5, x) + 'px'; 
  menu.style.top = Math.max(5, y) + 'px'; 
  menu.classList.remove('hidden');
}

function closeContextMenu() { 
  document.getElementById('context-menu').classList.add('hidden'); 
  ctxTarget = null; 
}

function ctxRenombrar() {
  if (!ctxTarget) return;
  const nuevoNombre = prompt("Nuevo nombre para el vértice:", ctxTarget);
  if (nuevoNombre && nuevoNombre.trim() !== '') {
    const v = getVertex(ctxTarget);
    // Renombrar en vértices
    v.name = nuevoNombre.trim();
    // Renombrar en aristas
    edges.forEach(e => {
      if (e.a === ctxTarget) e.a = v.name;
      if (e.b === ctxTarget) e.b = v.name;
    });
    render();
  }
  closeContextMenu();
}

function ctxEnlazar() {
  if (!ctxTarget) return;
  isEnlazando = true;
  nodoOrigenEnlace = ctxTarget;
  document.getElementById('graph-canvas').style.cursor = 'crosshair';
  closeContextMenu();
}

function ctxEliminar() {
  if (!ctxTarget) return;
  vertices = vertices.filter(v => v.name !== ctxTarget);
  edges = edges.filter(e => e.a !== ctxTarget && e.b !== ctxTarget);
  render();
  closeContextMenu();
}

document.addEventListener('click', (e) => { 
  if (!e.target.closest('#context-menu')) closeContextMenu(); 
});

function render() {
  document.getElementById('sum-order').innerText = vertices.length;
  document.getElementById('sum-size').innerText = edges.length;
  document.getElementById('sum-total').innerText = sumAllGrades();
  renderGraph();
}

function limpiarAnalisis() {
  if (isAnimating) return;
  ['result-dfs', 'result-camino', 'result-ciclo', 'result-hamilton'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.classList.add('hidden');
  });
  if (network) {
    const edgeDataSet = network.body.data.edges; 
    const nodeDataSet = network.body.data.nodes;
    edges.forEach((e, idx) => edgeDataSet.update({ id: `e_${idx}`, color: { color: '#94A3B8' }, width: 2 }));
    vertices.forEach(v => nodeDataSet.update({ id: v.name, color: { background: '#002B49', border: (computeGrade(v.name)%2===0)?'#D4AF37':'#DC2626' } }));
  }
}

// --- PERSISTENCIA ---
function guardarGrafoActual() {
  if (vertices.length === 0) { alert("No hay nada que guardar."); return; }
  const nombre = prompt("Nombre del grafo:", `Grafo ${savedGraphs.length + 1}`);
  if (!nombre) return;

  const nuevoGrafo = {
    id: currentGraphId || Date.now().toString(), 
    name: nombre, date: new Date().toISOString(),
    vertices: JSON.parse(JSON.stringify(vertices)), edges: JSON.parse(JSON.stringify(edges)),
    isDirected: isDirected
  };

  const idx = savedGraphs.findIndex(g => g.id === nuevoGrafo.id);
  if (idx !== -1) savedGraphs[idx] = nuevoGrafo; else savedGraphs.push(nuevoGrafo);
  currentGraphId = nuevoGrafo.id;
  localStorage.setItem('umg_grafos_history', JSON.stringify(savedGraphs));
  actualizarSelectHistorial();
  alert("✅ Guardado.");
}

function actualizarSelectHistorial() {
  const list = document.getElementById('history-list');
  if(!list) return;
  list.innerHTML = '';
  savedGraphs.forEach(g => {
    const btn = document.createElement('button');
    btn.className = 'px-3 py-1 bg-slate-100 border border-slate-300 rounded text-xs hover:bg-slate-200 text-left';
    btn.innerHTML = `<strong>${g.name}</strong><br><span class="text-[10px] text-slate-500">${new Date(g.date).toLocaleDateString()}</span>`;
    btn.onclick = () => {
      vertices = JSON.parse(JSON.stringify(g.vertices));
      edges = JSON.parse(JSON.stringify(g.edges));
      currentGraphId = g.id;
      document.getElementById('historial-panel').classList.add('hidden');
      render();
    };
    list.appendChild(btn);
  });
}

function crearNuevoGrafo() {
  if (confirm("¿Limpiar el lienzo actual?")) {
    vertices = []; edges = []; currentGraphId = null; limpiarAnalisis(); render();
  }
}

// --- EJEMPLOS ---
function cargarEjemplo(tipo) {
  vertices = []; edges = [];
  
  if (tipo === 'vuelos') {
    const cities = ["Guatemala", "Miami", "Bogota", "Mexico", "Madrid", "Lima", "Santiago", "Buenos Aires", "Panama"];
    cities.forEach(c => vertices.push({ name: c, code: generateUniqueCode(), icon: 'plane', pinned: false, used: false }));
    const r = (a,b) => edges.push({ a, b, weight: null });
    r("Guatemala","Miami"); r("Guatemala","Mexico"); r("Guatemala","Bogota"); r("Guatemala","Panama");
    r("Miami","Madrid"); r("Miami","Bogota"); r("Mexico","Madrid"); r("Mexico","Lima");
    r("Bogota","Lima"); r("Bogota","Panama"); r("Lima","Santiago"); r("Santiago","Buenos Aires"); r("Panama","
