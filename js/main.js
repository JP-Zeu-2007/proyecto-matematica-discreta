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
  do { code = '#'; for (let i = 0; i < 4; i++) code += chars.charAt(Math.floor(Math.random() * chars.length)); attempts++; } 
  while (vertices.some(v => v.code === code) && attempts < 500);
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

function onToggleDirected() {
  isDirected = document.getElementById('toggle-directed').checked;
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
  menu.style.display = 'block';
}

function closeContextMenu() { 
  document.getElementById('context-menu').style.display = 'none'; 
  ctxTarget = null; 
}

function ctxRenombrar() {
  if (!ctxTarget) return;
  const nuevoNombre = prompt("Nuevo nombre:", ctxTarget);
  if (nuevoNombre && nuevoNombre.trim() !== '') {
    const v = getVertex(ctxTarget);
    let oldName = v.name;
    v.name = nuevoNombre.trim();
    edges.forEach(e => {
      if (e.a === oldName) e.a = v.name;
      if (e.b === oldName) e.b = v.name;
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
  const res = document.getElementById('result-container');
  if(res) res.classList.add('hidden');
  
  if (typeof network !== 'undefined' && network) {
    const edgeDataSet = network.body.data.edges; 
    const nodeDataSet = network.body.data.nodes;
    edges.forEach((e, idx) => edgeDataSet.update({ id: `e_${idx}`, color: { color: '#94A3B8' }, width: 2 }));
    vertices.forEach(v => {
      let bColor = (computeGrade(v.name) % 2 === 0) ? '#D4AF37' : '#DC2626';
      if(v.icon !== 'circle') nodeDataSet.update({ id: v.name, color: { background: '#F8FAFC', border: bColor } });
      else nodeDataSet.update({ id: v.name, color: { background: '#002B49', border: bColor } });
    });
  }
}

function guardarGrafoActual() {
  if (vertices.length === 0) return alert("No hay nada que guardar.");
  const nombre = prompt("Nombre del grafo:", `Grafo ${savedGraphs.length + 1}`);
  if (!nombre) return;
  const nuevoGrafo = { id: currentGraphId || Date.now().toString(), name: nombre, date: new Date().toISOString(), vertices, edges, isDirected };
  const idx = savedGraphs.findIndex(g => g.id === nuevoGrafo.id);
  if (idx !== -1) savedGraphs[idx] = nuevoGrafo; else savedGraphs.push(nuevoGrafo);
  currentGraphId = nuevoGrafo.id;
  localStorage.setItem('umg_grafos_history', JSON.stringify(savedGraphs));
  actualizarSelectHistorial();
  alert("✅ Guardado.");
}

function actualizarSelectHistorial() {
  const list = document.getElementById('history-list'); if(!list) return;
  list.innerHTML = '';
  savedGraphs.forEach(g => {
    const btn = document.createElement('button');
    btn.className = 'px-3 py-1 bg-slate-100 border rounded text-xs hover:bg-slate-200 text-left w-full';
    btn.innerHTML = `<strong>${g.name}</strong><br><span class="text-[10px] text-slate-500">${new Date(g.date).toLocaleDateString()}</span>`;
    btn.onclick = () => {
      vertices = g.vertices; edges = g.edges; currentGraphId = g.id;
      document.getElementById('toggle-directed').checked = g.isDirected;
      isDirected = g.isDirected;
      document.getElementById('historial-panel').classList.add('hidden');
      render();
    };
    list.appendChild(btn);
  });
}

function crearNuevoGrafo() {
  if (confirm("¿Limpiar todo?")) { vertices = []; edges = []; currentGraphId = null; limpiarAnalisis(); render(); }
}

function cargarEjemplo(tipo) {
  vertices = []; edges = [];
  if (tipo === 'vuelos') {
    ["Guatemala", "Miami", "Bogota", "Mexico", "Madrid", "Lima", "Santiago", "Buenos Aires", "Panama"].forEach(c => vertices.push({ name: c, code: generateUniqueCode(), icon: 'plane', pinned: false, used: false }));
    const r = (a,b) => edges.push({ a, b, weight: null });
    r("Guatemala","Miami"); r("Guatemala","Mexico"); r("Guatemala","Bogota"); r("Guatemala","Panama"); r("Miami","Madrid"); r("Miami","Bogota"); r("Mexico","Madrid"); r("Mexico","Lima"); r("Bogota","Lima"); r("Bogota","Panama"); r("Lima","Santiago"); r("Santiago","Buenos Aires"); r("Panama","Madrid");
  } else if (tipo === 'servidores') {
    ["Servidor Central", "Router A", "Router B", "PC Admin", "Base Datos", "Firewall", "Cloud", "Backup"].forEach(s => vertices.push({ name: s, code: generateUniqueCode(), icon: 'server', pinned: false, used: false }));
    const r = (a,b) => edges.push({ a, b, weight: null });
    r("Servidor Central","Router A"); r("Servidor Central","Router B"); r("Servidor Central","Firewall"); r("Router A","PC Admin"); r("Router B","Base Datos"); r("Firewall","Cloud"); r("Base Datos","Backup"); r("Cloud","Backup"); r("PC Admin","Base Datos");
  } else if (tipo === 'ciudades') {
    ["Zona 1", "Zona 4", "Zona 10", "Mixco", "Villa Nueva", "Zona 15", "Zona 16", "Carretera", "Zona 2", "Zona 5"].forEach(z => vertices.push({ name: z, code: generateUniqueCode(), icon: 'building', pinned: false, used: false }));
    const r = (a,b) => edges.push({ a, b, weight: null });
    r("Zona 1","Zona 4"); r("Zona 4","Zona 10"); r("Zona 1","Mixco"); r("Mixco","Villa Nueva"); r("Villa Nueva","Zona 10"); r("Zona 10","Zona 15"); r("Zona 15","Zona 16"); r("Zona 16","Carretera"); r("Carretera","Zona 2"); r("Zona 2","Zona 5"); r("Zona 5","Zona 1"); r("Zona 4","Zona 15");
  } else if (tipo === 'tuberias') {
    ["Planta Norte", "Bomba1", "Bomba2", "Bomba3", "Tanque1", "Tanque2", "Tanque3", "Filtro", "Desague"].forEach(p => vertices.push({ name: p, code: generateUniqueCode(), icon: 'water', pinned: false, used: false }));
    const r = (a,b) => edges.push({ a, b, weight: null });
    r("Planta Norte","Bomba1"); r("Planta Norte","Bomba2"); r("Bomba1","Tanque1"); r("Bomba2","Tanque2"); r("Bomba1","Bomba3"); r("Bomba3","Tanque3"); r("Tanque1","Filtro"); r("Tanque2","Filtro"); r("Filtro","Desague"); r("Tanque3","Desague");
  } else if (tipo === 'estrella') {
    vertices.push({ name: "Centro", code: generateUniqueCode(), icon: 'star', pinned: false, used: false });
    for(let i=1; i<=8; i++) { vertices.push({ name: `Hoja ${i}`, code: generateUniqueCode(), icon: 'circle', pinned: false, used: false }); edges.push({ a: "Centro", b: `Hoja ${i}`, weight: null }); }
  }
  limpiarAnalisis(); render();
}
