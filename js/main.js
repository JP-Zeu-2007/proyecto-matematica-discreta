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

function showTempAlert(msg) {
  const banner = document.getElementById('log-banner');
  if (!banner) return;
  const p = document.createElement('p'); 
  p.className = 'text-rose-600 font-bold';
  p.innerHTML = `<i class="fa-solid fa-circle-exclamation mr-1"></i>${msg}`;
  banner.prepend(p); 
  setTimeout(() => { if (p.parentNode) p.remove(); }, 3500);
}

function getVertex(name) { return vertices.find(v => v.name === name); }
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

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

function toggleVisibilidad(tipo) {
  if (tipo === 'name') showNames = document.getElementById('chk-show-name').checked;
  if (tipo === 'id') showId = document.getElementById('chk-show-id').checked;
  renderGraph();
}

function onToggleDirected() {
  isDirected = document.getElementById('toggle-directed').checked;
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
  logChange("🗑️ Grafo eliminado del historial.");
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
  if (idx !== -1) savedGraphs[idx] = nuevoGrafo;
  else savedGraphs.push(nuevoGrafo);

  currentGraphId = nuevoGrafo.id;
  localStorage.setItem('umg_grafos_history', JSON.stringify(savedGraphs));
  actualizarSelectHistorial();
  logChange(`💾 Grafo <strong>${nombre}</strong> guardado.`);
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
  
  const tw = document.getElementById('toggle-weighted');
  if(tw) tw.checked = isWeighted;
  
  const twLabel = document.getElementById('toggle-weight-label');
  if(twLabel) twLabel.innerText = isWeighted ? 'Con Peso' : 'Sin Peso';
  
  const usc = document.getElementById('unit-selector-container');
  if(usc) usc.classList.toggle('hidden', !isWeighted);
  
  const us = document.getElementById('unit-select');
  if(us) us.value = currentUnit;

  limpiarAnalisis();
  render();
  logChange(`📂 Grafo <strong>${g.name}</strong> cargado.`);
}

function crearNuevoGrafo() {
  if (confirm("¿Crear un nuevo grafo en blanco? (Asegúrate de haber guardado el actual)")) {
    vertices = [];
    edges = [];
    isDirected = false;
    isWeighted = false;
    currentGraphId = null;
    
    const td = document.getElementById('toggle-directed');
    if(td) td.checked = false;
    
    const tw = document.getElementById('toggle-weighted');
    if(tw) tw.checked = false;
    
    const twl = document.getElementById('toggle-weight-label');
    if(twl) twl.innerText = 'Sin Peso';

    limpiarAnalisis();
    render();
    logChange("✨ Nuevo grafo en blanco creado.");
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
          if (!savedGraphs.some(oldG => oldG.id === newG.id)) savedGraphs.push(newG);
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

// ==========================================
// VÉRTICES Y ARISTAS
// ==========================================
function addVertex(name = null, isClick = false) {
  if (isClick) {
    let i = 1;
    while (getVertex(`V${i}`)) i++;
    name = `V${i}`;
  } else {
    const input = document.getElementById('new-vertex-name'); 
    name = input.value.trim();
    if (!validarNombreVertice(name)) return; 
    input.value = ''; 
  }
  
  vertices.push({ 
    name, 
    code: generateUniqueCode(), 
    pinned: false, 
    used: false,
    x: undefined, 
    y: undefined
  });
  
  logChange(`+ Vértice <strong>${name}</strong> agregado.`); 
  limpiarAnalisis(); 
  render();
}

function removeVertex(name) {
  if (!getVertex(name)) return;
  edges = edges.filter(e => e.a !== name && e.b !== name);
  vertices = vertices.filter(x => x.name !== name);
  logChange(`🗑️ Eliminado vértice <strong>${name}</strong>.`); 
  limpiarAnalisis(); 
  render();
}

function addEdge(a, b, weight = null) {
  if (!validarLazo(a, b)) return;
  if (!validarAristaDuplicada(a, b)) return;
  
  edges.push({ a, b, weight: isWeighted ? weight : null }); 
  logChange(`🔗 Arista: <strong>${a}${isDirected ? '→' : '↔'}${b}</strong>.`); 
  limpiarAnalisis(); 
  render();
}

function removeEdge(a, b) {
  edges = edges.filter(e => !((e.a === a && e.b === b) || (!isDirected && e.a === b && e.b === a)));
  logChange(`✂️ Arista eliminada.`); 
  limpiarAnalisis(); 
  render();
}

// ==========================================
// MENÚ CONTEXTUAL
// ==========================================
function openContextMenu(x, y, vertexName) {
  ctxTarget = vertexName; 
  const menu = document.getElementById('context-menu'), wrap = document.getElementById('graph-container-wrap');
  
  let left = x, top = y;
  if (left + 170 > wrap.clientWidth) left = wrap.clientWidth - 175;
  if (top + 140 > wrap.clientHeight) top = wrap.clientHeight - 145;
  
  menu.style.left = Math.max(5, left) + 'px'; 
  menu.style.top = Math.max(5, top) + 'px'; 
  menu.style.display = 'block';
}

function closeContextMenu() { 
  const menu = document.getElementById('context-menu');
  if(menu) menu.style.display = 'none'; 
  ctxTarget = null; 
}

document.addEventListener('click', (e) => { 
  if (!e.target.closest('#context-menu')) closeContextMenu(); 
});

// ==========================================
// RENDERIZADO DEL PANEL DERECHO (MATRIZ)
// ==========================================
function render() {
  let evenVerts = [], oddVerts = [];

  vertices.forEach(v => {
    const grade = computeGrade(v.name); 
    const isEven = grade % 2 === 0;
    if (isEven) evenVerts.push(v.name); else oddVerts.push(v.name);
  });

  // 1. Contadores Superiores
  document.getElementById('sum-order').innerText = vertices.length;
  document.getElementById('sum-size').innerText = countTotalEdges();

  // 2. Matriz de Adyacencia
  let matrizHTML = '';
  
  if (vertices.length > 0) {
    matrizHTML += `<div class="overflow-x-auto custom-scrollbar pb-2">`;
    matrizHTML += `<table class="text-[10px] font-mono border-collapse">`;
    
    // Encabezados
    matrizHTML += `<thead><tr><th class="p-1"></th>`;
    vertices.forEach(v => {
      matrizHTML += `<th class="p-1 text-center font-bold text-umgNavy border-b border-slate-300">${v.name}</th>`;
    });
    matrizHTML += `<th class="p-1 text-center font-bold text-umgGold border-b border-slate-300 border-l-2">Grado</th>`;
    matrizHTML += `</tr></thead><tbody>`;

    // Filas
    vertices.forEach(vRow => {
      matrizHTML += `<tr>`;
      // Nombre a la izquierda
      matrizHTML += `<td class="p-1 text-right font-bold text-umgNavy border-r border-slate-300 pr-2">${vRow.name}</td>`;
      
      vertices.forEach(vCol => {
        // Verificar conexión
        let isConnected = edges.some(e => 
          (e.a === vRow.name && e.b === vCol.name) || 
          (!isDirected && e.a === vCol.name && e.b === vRow.name)
        );
        
        // Colores: 1 negro, 0 gris
        let bgColor = isConnected ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400';
        let val = isConnected ? '1' : '0';
        
        matrizHTML += `<td class="p-1 text-center border border-slate-200 ${bgColor}">${val}</td>`;
      });

      // Grado a la derecha
      const grade = computeGrade(vRow.name);
      matrizHTML += `<td class="p-1 text-center font-bold text-emerald-700 border-l-2 border-slate-300">${grade}</td>`;
      
      matrizHTML += `</tr>`;
    });

    matrizHTML += `</tbody></table></div>`;
    matrizHTML += `<hr class="my-2 border-slate-200">`;
  } else {
    matrizHTML = `<p class="text-slate-400 italic text-center py-2">Aún sin vértices para calcular matriz.</p>`;
  }

  document.getElementById('grades-list').innerHTML = matrizHTML;

  // 3. Resumen Pares/Impares y Suma Total
  document.getElementById('summary-even').innerText = evenVerts.join(', ') || 'Ninguno';
  document.getElementById('summary-odd').innerText = oddVerts.join(', ') || 'Ninguno';
  document.getElementById('sum-total').innerText = sumAllGrades();

  // 4. Renderizar el grafo
  renderGraph();
}

function setBtnState(btnId, active) {
  const btn = document.getElementById(btnId);
  if(!btn) return;
  btn.disabled = active;
  btn.classList.toggle('opacity-50', active);
}

function showResult(resId, html, type) {
  const el = document.getElementById(resId);
  if(!el) return;
  el.classList.remove('hidden');
  el.className = `text-xs p-2 rounded border text-center font-semibold ${type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`;
  el.innerHTML = html;
}

function limpiarAnalisis() {
  if (isAnimating) return;
  ['result-dfs', 'result-camino', 'result-ciclo'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.classList.add('hidden');
  });
  if (network) {
    const edgeDataSet = network.body.data.edges; 
    const nodeDataSet = network.body.data.nodes;
    edges.forEach((e, idx) => edgeDataSet.update({ id: `e_${idx}`, color: { color: '#94A3B8' }, width: 2 }));
    vertices.forEach(v => nodeDataSet.update({ id: v.name, color: { background: v.used ? '#10B981' : '#002B49' } }));
  }
}

// ==========================================
// CARGA INICIAL
// ==========================================
window.onload = function() {
  actualizarSelectHistorial();
  if (savedGraphs.length > 0) {
    cargarGrafoHistorial(savedGraphs[savedGraphs.length - 1].id);
  } else {
    render();
  }
};
