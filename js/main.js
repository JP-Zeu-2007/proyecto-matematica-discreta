// ==========================================
// js/main.js
// Lógica Central, Historial y Persistencia
// ==========================================

// 1. VARIABLES GLOBALES
let vertices = []; 
let edges = []; 
let isDirected = false; 
let showNames = true;
let ctxTarget = null; 
let isAnimating = false;

// Nuevas variables para Pesos e Historial
let isWeighted = false;
let currentUnit = 'km';
let customUnitText = '';
let savedGraphs = JSON.parse(localStorage.getItem('umg_grafos_history')) || [];
let currentGraphId = null; // ID del grafo que se está editando actualmente

// 2. INICIALIZACIÓN
window.onload = function() {
  actualizarSelectHistorial();
  // Si hay grafos guardados, cargamos el último; si no, empezamos en blanco
  if (savedGraphs.length > 0) {
    cargarGrafoHistorial(savedGraphs[savedGraphs.length - 1].id);
  } else {
    render();
  }
};

// 3. PERSISTENCIA E HISTORIAL
function actualizarSelectHistorial() {
  const select = document.getElementById('history-select');
  select.innerHTML = '<option value="">-- Seleccionar un grafo guardado --</option>';
  savedGraphs.forEach(g => {
    const opt = document.createElement('option');
    opt.value = g.id;
    opt.innerText = `${g.name} (${new Date(g.date).toLocaleDateString()})`;
    if (g.id === currentGraphId) opt.selected = true;
    select.appendChild(opt);
  });
}

function guardarGrafoActual() {
  if (vertices.length === 0) {
    showTempAlert("No hay nada que guardar. Agrega vértices primero.");
    return;
  }

  const nombre = prompt("Dale un nombre a este grafo (ej. Red de Ciudades):", `Grafo ${savedGraphs.length + 1}`);
  if (!nombre) return;

  const nuevoGrafo = {
    id: currentGraphId || Date.now().toString(), // Si ya existía, conserva su ID
    name: nombre,
    date: new Date().toISOString(),
    vertices: JSON.parse(JSON.stringify(vertices)), // Copia profunda
    edges: JSON.parse(JSON.stringify(edges)),
    isDirected: isDirected,
    isWeighted: isWeighted,
    unit: currentUnit,
    customUnit: customUnitText
  };

  // Si ya existía en el historial, lo actualizamos. Si no, lo agregamos.
  const idx = savedGraphs.findIndex(g => g.id === nuevoGrafo.id);
  if (idx !== -1) {
    savedGraphs[idx] = nuevoGrafo;
  } else {
    savedGraphs.push(nuevoGrafo);
  }

  currentGraphId = nuevoGrafo.id;
  localStorage.setItem('umg_grafos_history', JSON.stringify(savedGraphs));
  actualizarSelectHistorial();
  logChange(`Grafo <strong>${nombre}</strong> guardado en el historial.`);
  showTempAlert("✅ Grafo guardado correctamente.");
}

function cargarGrafoHistorial(id) {
  if (!id) return;
  const g = savedGraphs.find(x => x.id === id);
  if (!g) return;

  vertices = JSON.parse(JSON.stringify(g.vertices));
  edges = JSON.parse(JSON.stringify(g.edges));
  isDirected = g.isDirected;
  isWeighted = g.isWeighted;
  currentUnit = g.unit || 'km';
  customUnitText = g.customUnit || '';
  currentGraphId = g.id;

  // Actualizar UI
  document.getElementById('toggle-directed').checked = isDirected;
  document.getElementById('toggle-label').innerText = isDirected ? 'Dirigido' : 'No Dirigido';
  
  document.getElementById('toggle-weighted').checked = isWeighted;
  document.getElementById('toggle-weight-label').innerText = isWeighted ? 'Con Peso' : 'Sin Peso';
  document.getElementById('unit-selector-container').classList.toggle('hidden', !isWeighted);
  document.getElementById('unit-select').value = currentUnit;

  limpiarAnalisis();
  render();
  logChange(`Grafo <strong>${g.name}</strong> cargado del historial.`);
}

function crearNuevoGrafo() {
  if (confirm("¿Crear un nuevo grafo en blanco? (Asegúrate de haber guardado el actual)")) {
    vertices = [];
    edges = [];
    isDirected = false;
    isWeighted = false;
    currentGraphId = null;
    
    document.getElementById('toggle-directed').checked = false;
    document.getElementById('toggle-label').innerText = 'No Dirigido';
    document.getElementById('toggle-weighted').checked = false;
    document.getElementById('toggle-weight-label').innerText = 'Sin Peso';
    document.getElementById('unit-selector-container').classList.add('hidden');

    limpiarAnalisis();
    render();
    document.getElementById('history-select').value = "";
    logChange("Nuevo grafo en blanco creado.");
  }
}

function exportarJSON() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(savedGraphs, null, 2));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", "historial_grafos_umg.json");
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
}

function importarJSON(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (Array.isArray(imported)) {
        // Fusionar historiales sin duplicar IDs
        imported.forEach(newG => {
          if (!savedGraphs.some(oldG => oldG.id === newG.id)) {
            savedGraphs.push(newG);
          }
        });
        localStorage.setItem('umg_grafos_history', JSON.stringify(savedGraphs));
        actualizarSelectHistorial();
        alert("✅ Historial importado correctamente.");
      } else {
        alert("❌ El archivo JSON no tiene el formato correcto.");
      }
    } catch (err) {
      alert("❌ Error al leer el archivo JSON.");
    }
    event.target.value = ''; // Limpiar input
  };
  reader.readAsText(file);
}

// 4. UTILIDADES (LOG Y ALERTAS)
function logChange(msg) {
  const banner = document.getElementById('log-banner');
  if (banner.querySelector('p.italic')) banner.innerHTML = '';
  const p = document.createElement('p'); 
  p.className = 'text-slate-700';
  p.innerHTML = `<span class="text-umgGold font-bold">[${new Date().toLocaleTimeString()}]</span> ${msg}`;
  banner.prepend(p);
}

function showTempAlert(msg) {
  const banner = document.getElementById('log-banner');
  const p = document.createElement('p'); 
  p.className = 'text-rose-600 font-bold';
  p.innerHTML = `<i class="fa-solid fa-circle-exclamation mr-1"></i>${msg}`;
  banner.prepend(p); 
  setTimeout(() => { if (p.parentNode) p.remove(); }, 3500);
}

function getVertex(name) { return vertices.find(v => v.name === name); }
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

// 5. CÁLCULO DE GRADOS Y ARISTAS
function computeGrade(name) {
  if (isDirected) return edges.filter(e => e.a === name).length;
  return edges.filter(e => e.a === name || e.b === name).length;
}

function getConnections(name) {
  return edges.filter(e => e.a === name || e.b === name).map(e => e.a === name ? e.b : e.a);
}

function countTotalEdges() { return edges.length; }
function sumAllGrades() { return vertices.reduce((acc, v) => acc + computeGrade(v.name), 0); }
function getOddVertices() { return vertices.filter(v => computeGrade(v.name) % 2 !== 0).map(v => v.name); }

// 6. ACCIONES DE LOS VÉRTICES
function toggleShowNames() {
  showNames = !showNames;
  document.getElementById('btn-toggle-names-label').innerText = showNames ? 'Ocultar Nombres' : 'Mostrar Nombres';
  renderGraph(); 
}

function onToggleDirected() {
  isDirected = document.getElementById('toggle-directed').checked;
  document.getElementById('toggle-label').innerText = isDirected ? 'Dirigido' : 'No Dirigido';
  limpiarAnalisis(); 
  render();
}

function onToggleWeighted() {
  isWeighted = document.getElementById('toggle-weighted').checked;
  document.getElementById('toggle-weight-label').innerText = isWeighted ? 'Con Peso' : 'Sin Peso';
  document.getElementById('unit-selector-container').classList.toggle('hidden', !isWeighted);
  limpiarAnalisis(); 
  render();
}

// Selector de unidades
document.addEventListener('DOMContentLoaded', () => {
  const unitSelect = document.getElementById('unit-select');
  if(unitSelect) {
    unitSelect.addEventListener('change', function() {
      currentUnit = this.value;
      if (currentUnit === 'custom') {
        const custom = prompt("Escribe la unidad personalizada (ej. galones, nudos, etc.):");
        customUnitText = custom || 'u';
      }
      render();
    });
  }
});

function addVertex() {
  const input = document.getElementById('new-vertex-name'); 
  const name = input.value.trim();
  
  if (!validarNombreVertice(name)) return; 
  
  vertices.push({ name, code: generateUniqueCode(), pinned: false, used: false });
  input.value = ''; 
  logChange(`Vértice <strong>${name}</strong> agregado.`); 
  limpiarAnalisis(); 
  render();
}

function removeVertex(name) {
  if (!getVertex(name)) return;
  edges = edges.filter(e => e.a !== name && e.b !== name);
  vertices = vertices.filter(x => x.name !== name);
  logChange(`Eliminado <strong>${name}</strong>.`); 
  limpiarAnalisis(); 
  render();
}

function addEdge(a, b, weight = null) {
  if (!validarLazo(a, b)) return;
  if (!validarAristaDuplicada(a, b)) return;
  
  edges.push({ a, b, weight: isWeighted ? weight : null }); 
  logChange(`Arista: <strong>${a}${isDirected ? '→' : '↔'}${b}</strong>.`); 
  limpiarAnalisis(); 
  render();
}

function removeEdge(a, b) {
  edges = edges.filter(e => !((e.a === a && e.b === b) || (!isDirected && e.a === b && e.b === a)));
  logChange(`Arista eliminada.`); 
  limpiarAnalisis(); 
  render();
}

function changeEdge(vertexName, oldTarget, newTarget, oldWeight, newWeight) {
  if (!newTarget || oldTarget === newTarget) return;
  
  const idx = edges.findIndex(e => (e.a === vertexName && e.b === oldTarget) || (!isDirected && e.a === oldTarget && e.b === vertexName));
  if (idx !== -1) { 
    // Validar si el nuevo destino ya existe en otra arista de este nodo
    if (validarAristaDuplicada(vertexName, newTarget) && oldTarget !== newTarget) {
      edges[idx].b = newTarget; 
    }
    
    // Actualizar peso si aplica
    if (isWeighted && newWeight !== null) {
      edges[idx].weight = newWeight;
    }
    
    limpiarAnalisis(); 
    render(); 
  }
}

function changeWeight(vertexName, targetName, newWeight) {
  const idx = edges.findIndex(e => (e.a === vertexName && e.b === targetName) || (!isDirected && e.a === targetName && e.b === vertexName));
  if (idx !== -1) {
    edges[idx].weight = newWeight;
    limpiarAnalisis();
    render();
  }
}

function addConnection(vertexName) {
  const conns = getConnections(vertexName);
  const available = vertices.find(x => x.name !== vertexName && !conns.includes(x.name));
  if (!available) return; 
  
  let weight = null;
  if (isWeighted) {
    weight = prompt(`Ingresa el peso para la arista ${vertexName} -> ${available.name} (en ${currentUnit === 'custom' ? customUnitText : currentUnit}):`, "10");
    if (weight === null) return; // Canceló
  }
  
  addEdge(vertexName, available.name, weight);
}

// 7. MENÚ CONTEXTUAL
function openContextMenu(x, y, vertexName) {
  ctxTarget = vertexName; 
  const menu = document.getElementById('context-menu'), wrap = document.getElementById('graph-container-wrap'), v = getVertex(vertexName);
  document.getElementById('ctx-pin-text').innerText = v.pinned ? 'Desanclar' : 'Fijar';
  document.getElementById('ctx-used-text').innerText = v.used ? 'Quitar Usado' : 'Marcar Usado';
  
  let left = x, top = y;
  if (left + 170 > wrap.clientWidth) left = wrap.clientWidth - 175;
  if (top + 140 > wrap.clientHeight) top = wrap.clientHeight - 145;
  menu.style.left = Math.max(5, left) + 'px'; 
  menu.style.top = Math.max(5, top) + 'px'; 
  menu.style.display = 'block';
}

function closeContextMenu() { 
  document.getElementById('context-menu').style.display = 'none'; 
  ctxTarget = null; 
}

function ctxPin() { const v = getVertex(ctxTarget); v.pinned = !v.pinned; closeContextMenu(); render(); }
function ctxUsed() { const v = getVertex(ctxTarget); v.used = !v.used; closeContextMenu(); render(); }
function ctxDelete() { const name = ctxTarget; closeContextMenu(); removeVertex(name); }

document.addEventListener('click', (e) => { if (!e.target.closest('#context-menu')) closeContextMenu(); });

// 8. RENDERIZADO DEL PANEL VISUAL
function render() {
  const container = document.getElementById('vertex-list'); 
  container.innerHTML = '';
  let evenVerts = [], oddVerts = [];

  vertices.forEach(v => {
    const grade = computeGrade(v.name); 
    const isEven = grade % 2 === 0;
    if (isEven) evenVerts.push(v.name); else oddVerts.push(v.name);

    const conns = edges.filter(e => e.a === v.name || e.b === v.name);
    const row = document.createElement('div'); 
    row.className = 'bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2';
    
    // Generar UI de conexiones
    let connsHTML = '';
    if (conns.length === 0) {
      connsHTML = '<p class="text-[11px] text-slate-400 italic">Sin conexiones.</p>';
    } else {
      connsHTML = conns.map(e => {
        const target = e.a === v.name ? e.b : e.a;
        const edgeWeight = e.weight || '';
        
        let weightInput = '';
        if (isWeighted) {
          weightInput = `<input type="number" value="${edgeWeight}" onchange="
