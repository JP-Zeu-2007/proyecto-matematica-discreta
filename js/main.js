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

// Variables para Pesos e Historial
let isWeighted = false;
let currentUnit = 'km';
let customUnitText = '';
let savedGraphs = JSON.parse(localStorage.getItem('umg_grafos_history')) || [];
let currentGraphId = null;

// 2. INICIALIZACIÓN
window.onload = function() {
  actualizarSelectHistorial();
  if (savedGraphs.length > 0) {
    // Cargar el último grafo guardado automáticamente
    cargarGrafoHistorial(savedGraphs[savedGraphs.length - 1].id);
  } else {
    render();
  }

  // Inicializar el evento del selector de unidades
  const unitSelect = document.getElementById('unit-select');
  if(unitSelect) {
    unitSelect.addEventListener('change', function() {
      currentUnit = this.value;
      if (currentUnit === 'custom') {
        const custom = prompt("Escribe la unidad personalizada (ej. galones, nudos):");
        customUnitText = custom || 'u';
      }
      render();
    });
  }
};

// 3. GENERACIÓN DE CÓDIGO ÚNICO (¡ESTA ERA LA QUE FALTABA!)
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

// 4. PERSISTENCIA E HISTORIAL
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
    event.target.value = '';
  };
  reader.readAsText(file);
}

// 5. UTILIDADES
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

// 6. CÁLCULO DE GRADOS
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

// 7. ACCIONES
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

function changeEdge(vertexName, oldTarget, newTarget) {
  if (!newTarget || oldTarget === newTarget) return;
  const idx = edges.findIndex(e => (e.a === vertexName && e.b === oldTarget) || (!isDirected && e.a === oldTarget && e.b === vertexName));
  if (idx !== -1) { 
    edges[idx].b = newTarget; 
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
    if (weight === null) return; 
  }
  
  addEdge(vertexName, available.name, weight);
}

// 8. MENÚ CONTEXTUAL
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

// 9. RENDERIZADO DEL PANEL
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
    
    let connsHTML = '';
    if (conns.length === 0) {
      connsHTML = '<p class="text-[11px] text-slate-400 italic">Sin conexiones.</p>';
    } else {
      connsHTML = conns.map(e => {
        const target = e.a === v.name ? e.b : e.a;
        const edgeWeight = e.weight || '';
        
        let weightInput = '';
        if (isWeighted) {
          weightInput = `<input type="number" value="${edgeWeight}" onchange="changeWeight('${v.name}', '${target}', this.value)" class="w-16 p-1 border border-slate-300 rounded text-xs text-center" placeholder="Peso">`;
        }

        return `
          <div class="flex items-center gap-2 text-xs">
            <span class="text-slate-500">${isDirected ? '→' : '↔'}</span>
            <select onchange="changeEdge('${v.name}', '${target}', this.value)" class="flex-1 p-1.5 border border-slate-300 rounded-lg text-xs bg-white">
              ${vertices.filter(x => x.name !== v.name).map(x => `<option value="${x.name}" ${x.name === target ? 'selected' : ''}>${x.name}</option>`).join('')}
            </select>
            ${weightInput}
            <button onclick="removeEdge('${v.name}', '${target}')" class="w-6 h-6 bg-slate-300 text-slate-700 rounded hover:bg-rose-200"><i class="fa-solid fa-xmark"></i></button>
          </div>
        `;
      }).join('');
    }
    
    row.innerHTML = `
      <div class="flex justify-between items-center">
        <div class="flex items-center gap-2">
          <span class="px-2 py-1 rounded-full bg-umgNavy text-white font-bold text-[11px] font-mono">${v.code}</span>
          <span class="text-sm font-bold text-slate-800">${v.name}</span>
          <span class="text-[11px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">V(${v.name}): ${grade}</span>
          <span class="text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${isEven ? 'bg-indigo-100 text-indigo-800' : 'bg-rose-100 text-rose-800'}">${isEven ? 'PAR' : 'IMPAR'}</span>
        </div>
        <div class="flex gap-1">
          <button onclick="addConnection('${v.name}')" class="w-7 h-7 bg-emerald-500 text-white rounded text-xs"><i class="fa-solid fa-plus"></i></button>
          <button onclick="removeVertex('${v.name}')" class="w-7 h-7 bg-rose-500 text-white rounded text-xs"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
      <div class="space-y-1.5 pl-2">
        ${connsHTML}
      </div>
    `;
    container.appendChild(row);
  });

  document.getElementById('sum-order').innerText = vertices.length;
  document.getElementById('sum-size').innerText = countTotalEdges();
  document.getElementById('grades-list').innerHTML = vertices.map(v => `<p class="flex justify-between border-b border-dashed border-slate-100 pb-1"><span class="text-slate-600">V(${v.name}):</span><span class="font-bold text-emerald-700">${computeGrade(v.name)}</span></p>`).join('');
  document.getElementById('summary-even').innerText = evenVerts.join(', ') || 'Ninguno';
  document.getElementById('summary-odd').innerText = oddVerts.join(', ') || 'Ninguno';
  document.getElementById('sum-total').innerText = sumAllGrades();

  renderGraph();
}

// 10. HERRAMIENTAS DE LOS BOTONES
function setBtnState(btnId, active) {
  const btn = document.getElementById(btnId);
  btn.disabled = active;
  btn.classList.toggle('opacity-50', active);
}

function showResult(resId, html, type) {
  const el = document.getElementById(resId);
  el.classList.remove('hidden');
  el.className = `text-xs p-2 rounded border text-center font-semibold ${type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`;
  el.innerHTML = html;
}

function limpiarAnalisis() {
  if (isAnimating) return;
  ['result-dfs', 'result-camino', 'result-ciclo'].forEach(id => {
    document.getElementById(id).classList.add('hidden');
  });
  if (network) {
    const edgeDataSet = network.body.data.edges; 
    const nodeDataSet = network.body.data.nodes;
    edges.forEach((e, idx) => edgeDataSet.update({ id: `e_${idx}`, color: { color: '#94A3B8' }, width: 1 }));
    vertices.forEach(v => nodeDataSet.update({ id: v.name, color: { background: '#002B49' } }));
  }
  logChange('Análisis limpiado.');
}
