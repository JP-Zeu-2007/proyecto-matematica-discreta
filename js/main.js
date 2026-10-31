// ==========================================
// js/main.js
// Lógica Central, Historial, Persistencia y Matriz
// ==========================================

let vertices = []; 
let edges = []; 
let isDirected = false; 
let showNames = true;
let showId = true; 
let ctxTarget = null; 
let isAnimating = false;

let isWeighted = false;
let currentUnit = 'km';
let customUnitText = '';
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

function logChange(msg) {
  const banner = document.getElementById('log-banner');
  if (!banner) return;
  if (banner.querySelector('p.italic')) banner.innerHTML = '';
  const p = document.createElement('p'); 
  p.className = 'text-slate-700';
  p.innerHTML = `<span class="text-umgGold font-bold">[${new Date().toLocaleTimeString()}]</span> ${msg}`;
  banner.prepend(p);
}

function getVertex(name) { return vertices.find(v => v.name === name); }
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

function computeGrade(name) {
  if (isDirected) return edges.filter(e => e.a === name).length;
  return edges.filter(e => e.a === name || e.b === name).length;
}

function countTotalEdges() { return edges.length; }
function sumAllGrades() { return vertices.reduce((acc, v) => acc + computeGrade(v.name), 0); }

function toggleVisibility(tipo) {
  if (tipo === 'name') showNames = document.getElementById('toggle-show-name').checked;
  if (tipo === 'id') showId = document.getElementById('toggle-show-id').checked;
  renderGraph();
}

// ==========================================
// HISTORIAL VISUAL
// ==========================================
function actualizarSelectHistorial() {
  const container = document.getElementById('history-list');
  if (!container) return;
  container.innerHTML = '';
  
  if (savedGraphs.length === 0) {
    container.innerHTML = '<p class="text-xs text-slate-400 italic">No hay grafos guardados aún.</p>';
    return;
  }

  savedGraphs.forEach(g => {
    const div = document.createElement('div');
    div.className = 'flex items-center gap-2 bg-slate-100 border border-slate-300 rounded-lg px-3 py-1.5 hover:bg-slate-200 transition';
    div.innerHTML = `
      <button onclick="cargarGrafoHistorial('${g.id}')" class="text-xs font-bold text-umgNavy hover:underline flex-grow text-left">
        ${g.name}
      </button>
      <button onclick="borrarGrafoHistorial('${g.id}', event)" class="text-rose-500 hover:text-rose-700" title="Eliminar grafo">
        <i class="fa-solid fa-trash-can text-xs"></i>
      </button>
    `;
    container.appendChild(div);
  });
}

function borrarGrafoHistorial(id, event) {
  event.stopPropagation();
  if (!confirm("¿Eliminar este grafo del historial permanentemente?")) return;
  savedGraphs = savedGraphs.filter(g => g.id !== id);
  localStorage.setItem('umg_grafos_history', JSON.stringify(savedGraphs));
  if (currentGraphId === id) currentGraphId = null;
  actualizarSelectHistorial();
}

function guardarGrafoActual() {
  if (vertices.length === 0) {
    alert("No hay nada que guardar. Agrega vértices primero.");
    return;
  }
  const nombre = prompt("Dale un nombre a este grafo (ej. Red de Ciudades):", `Grafo ${savedGraphs.length + 1}`);
  if (!nombre) return;

  const nuevoGrafo = {
    id: currentGraphId || Date.now().toString(), 
    name: nombre,
    date: new Date().toISOString(),
    vertices: JSON.parse(JSON.stringify(vertices)),
    edges: JSON.parse(JSON.stringify(edges)),
    isDirected: isDirected,
    isWeighted: isWeighted,
    unit: currentUnit,
    customUnit: customUnitText
  };

  const idx = savedGraphs.findIndex(g => g.id === nuevoGrafo.id);
  if (idx !== -1) savedGraphs[idx] = nuevoGrafo;
  else savedGraphs.push(nuevoGrafo);

  currentGraphId = nuevoGrafo.id;
  localStorage.setItem('umg_grafos_history', JSON.stringify(savedGraphs));
  
  // Abrir el panel automáticamente al guardar
  const panel = document.getElementById('historial-panel');
  if (panel && panel.classList.contains('hidden')) panel.classList.remove('hidden');
  actualizarSelectHistorial();
  
  alert(`¡Grafo "${nombre}" guardado exitosamente!`);
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

  const td = document.getElementById('toggle-directed');
  if(td) td.checked = isDirected;
  
  limpiarAnalisis();
  render();
}

function crearNuevoGrafo() {
  if (vertices.length > 0) {
    if (!confirm("¿Crear un nuevo grafo en blanco? (Perderás los cambios no guardados)")) return;
  }
  vertices = [];
  edges = [];
  currentGraphId = null;
  render();
  limpiarAnalisis();
}

// ==========================================
// VÉRTICES Y ARISTAS
// ==========================================
function addVertexClick() {
  let i = 1;
  while (getVertex(`V${i}`)) i++;
  const name = `V${i}`;
  
  vertices.push({ name, code: generateUniqueCode(), pinned: false, used: false });
  limpiarAnalisis(); 
  render();
}

function removeVertex(name) {
  if (!getVertex(name)) return;
  edges = edges.filter(e => e.a !== name && e.b !== name);
  vertices = vertices.filter(x => x.name !== name);
  limpiarAnalisis(); 
  render();
}

function addEdge(a, b) {
  if (a === b) return alert('No se permiten lazos.');
  if (edges.some(e => (e.a === a && e.b === b) || (!isDirected && e.a === b && e.b === a))) return alert('Esa arista ya existe.');
  
  edges.push({ a, b, weight: null }); 
  limpiarAnalisis(); 
  render();
}

function removeEdge(a, b) {
  edges = edges.filter(e => !((e.a === a && e.b === b) || (!isDirected && e.a === b && e.b === a)));
  limpiarAnalisis(); 
  render();
}

function limpiarTodo() {
  if(confirm("¿Seguro que deseas borrar todo el grafo actual?")) {
    vertices = [];
    edges = [];
    render();
    limpiarAnalisis();
  }
}

// ==========================================
// RENDERIZADO DEL PANEL (MATRIZ Y CONTADORES)
// ==========================================
function render() {
  // 1. ACTUALIZAR LOS CONTADORES SIEMPRE
  const sumOrderEl = document.getElementById('sum-order');
  const sumSizeEl = document.getElementById('sum-size');
  const sumTotalEl = document.getElementById('sum-total');
  
  if (sumOrderEl) sumOrderEl.innerText = vertices.length;
  if (sumSizeEl) sumSizeEl.innerText = countTotalEdges();
  if (sumTotalEl) sumTotalEl.innerText = sumAllGrades();

  // 2. MATRIZ DE ADYACENCIA
  let matrizHTML = '';
  const containerMatriz = document.getElementById('matriz-container');
  
  if (containerMatriz) {
    if (vertices.length > 0) {
      matrizHTML += `<table class="w-full text-[9px] font-mono border-collapse text-center">`;
      matrizHTML += `<thead><tr><th class="p-1"></th>`;
      vertices.forEach(v => { matrizHTML += `<th class="p-1 font-bold text-umgNavy">${v.name}</th>`; });
      matrizHTML += `<th class="p-1 font-bold text-umgGold border-l border-slate-300">V</th>`;
      matrizHTML += `</tr></thead><tbody>`;

      vertices.forEach(vRow => {
        matrizHTML += `<tr>`;
        matrizHTML += `<td class="p-1 text-right font-bold text-umgNavy pr-2 border-r border-slate-200">${vRow.name}</td>`;
        vertices.forEach(vCol => {
          let isConnected = edges.some(e => 
            (e.a === vRow.name && e.b === vCol.name) || 
            (!isDirected && e.a === vCol.name && e.b === vRow.name)
          );
          let bgColor = isConnected ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400';
          let val = isConnected ? '1' : '0';
          matrizHTML += `<td class="border border-slate-200 ${bgColor}" style="width: 20px; height: 20px;">${val}</td>`;
        });
        matrizHTML += `<td class="p-1 font-bold text-emerald-700 border-l border-slate-200">${computeGrade(vRow.name)}</td>`;
        matrizHTML += `</tr>`;
      });
      matrizHTML += `</tbody></table>`;
      
      containerMatriz.innerHTML = matrizHTML;
    } else {
      containerMatriz.innerHTML = `<p class="text-slate-400 italic text-center">Agrega vértices para ver la matriz.</p>`;
    }
  }

  // 3. Renderizar el grafo
  renderGraph();
}

function limpiarResultados() {
  ['result-dfs', 'result-camino', 'result-ciclo', 'result-hamilton'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.classList.add('hidden');
  });
  limpiarAnalisis();
}

function limpiarAnalisis() {
  if (isAnimating) return;
  if (network) {
    const edgeDataSet = network.body.data.edges; 
    const nodeDataSet = network.body.data.nodes;
    edges.forEach((e, idx) => edgeDataSet.update({ id: `e_${idx}`, color: { color: '#94A3B8' }, width: 2 }));
    vertices.forEach(v => nodeDataSet.update({ id: v.name, color: { background: v.used ? '#10B981' : '#002B49' } }));
  }
}

// Inicio
window.onload = function() {
  render();
};
