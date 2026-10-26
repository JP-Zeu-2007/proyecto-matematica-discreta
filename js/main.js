// ==========================================
// js/main.js
// Lógica Central y Variables Globales
// ==========================================

// 1. VARIABLES GLOBALES
let vertices = []; 
let edges = []; 
let isDirected = false; 
let showNames = true;
let ctxTarget = null; 
let isAnimating = false;

// 2. INICIALIZACIÓN AL CARGAR LA PÁGINA
window.onload = function() {
  render(); // Dibuja todo por primera vez
};

// 3. GENERACIÓN DE CÓDIGO ÚNICO
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

function addVertex() {
  const input = document.getElementById('new-vertex-name'); 
  const name = input.value.trim();
  
  // Usar la validación del archivo validations.js
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

function addEdge(a, b) {
  if (!validarLazo(a, b)) return;
  if (!validarAristaDuplicada(a, b)) return;
  
  edges.push({ a, b }); 
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
  if (!validarAristaDuplicada(vertexName, newTarget)) return;
  
  const idx = edges.findIndex(e => (e.a === vertexName && e.b === oldTarget) || (!isDirected && e.a === oldTarget && e.b === vertexName));
  if (idx !== -1) { 
    edges[idx] = { a: vertexName, b: newTarget }; 
    limpiarAnalisis(); 
    render(); 
  }
}

function addConnection(vertexName) {
  const conns = getConnections(vertexName);
  const available = vertices.find(x => x.name !== vertexName && !conns.includes(x.name));
  if (!available) return; 
  addEdge(vertexName, available.name);
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

    const conns = getConnections(v.name);
    const row = document.createElement('div'); 
    row.className = 'bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2';
    
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
        ${conns.length === 0 ? '<p class="text-[11px] text-slate-400 italic">Sin conexiones.</p>' : ''}
        ${conns.map(target => `
          <div class="flex items-center gap-2 text-xs">
            <span class="text-slate-500">${isDirected ? '→' : '↔'}</span>
            <select onchange="changeEdge('${v.name}', '${target}', this.value)" class="flex-1 p-1.5 border border-slate-300 rounded-lg text-xs bg-white">
              ${vertices.filter(x => x.name !== v.name).map(x => `<option value="${x.name}" ${x.name === target ? 'selected' : ''}>${x.name}</option>`).join('')}
            </select>
            <button onclick="removeEdge('${v.name}', '${target}')" class="w-6 h-6 bg-slate-300 text-slate-700 rounded hover:bg-rose-200"><i class="fa-solid fa-xmark"></i></button>
          </div>
        `).join('')}
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

  renderGraph(); // Llamar a la función del archivo graph.js
}

// 9. HERRAMIENTAS DE LOS BOTONES DE ANÁLISIS
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
