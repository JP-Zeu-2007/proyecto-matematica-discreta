// ==========================================
// MÓDULO DE HAMILTON - INTEGRANTE 2 (LUIS OMAR)
// ==========================================

function limpiarHamilton() {
  const resDiv = document.getElementById('result-hamilton');
  if (!resDiv) return;
  resDiv.classList.add('hidden');
  resDiv.innerHTML = '';
  
  if (window.network) {
    const edgeDataSet = window.network.body.data.edges;
    const nodeDataSet = window.network.body.data.nodes;
    if (window.edges) {
      window.edges.forEach((e, idx) => edgeDataSet.update({ id: e.id || `e_${idx}`, color: { color: '#94A3B8' }, width: 1 }));
    }
    if (window.vertices) {
      window.vertices.forEach(v => nodeDataSet.update({ id: v.id, color: { background: '#002B49', border: '#D4AF37' } }));
    }
  }
}

function isGraphConnectedHamilton() {
  if (!window.vertices || window.vertices.length === 0) return false;
  let visited = new Set(); 
  let stack = [window.vertices[0].id];
  
  while (stack.length > 0) {
    let curr = stack.pop();
    if (!visited.has(curr)) {
      visited.add(curr);
      window.edges.forEach(e => {
        if (e.from === curr && !visited.has(e.to)) stack.push(e.to);
        if (e.to === curr && !visited.has(e.from)) stack.push(e.from);
      });
    }
  }
  return visited.size === window.vertices.length;
}

function computeGradeHamilton(id) {
  return window.edges.filter(e => e.from === id || e.to === id).length;
}

function findHamiltonian(nodes, adj) {
  let n = nodes.length;
  let result = { path: null, cycle: null, intentos: 0 };
  
  function solve(curr, visited, path) {
    result.intentos++;
    if (path.length === n) {
      if (!result.path) result.path = [...path];
      if (adj[curr].includes(path[0])) result.cycle = [...path, path[0]];
      return;
    }
    for (let neighbor of adj[curr]) {
      if (!visited[neighbor]) {
        visited[neighbor] = true;
        path.push(neighbor);
        solve(neighbor, visited, path);
        path.pop();
        visited[neighbor] = false;
        if (result.cycle) return;
      }
    }
  }
  
  for (let startNode of nodes) {
    let visited = { [startNode]: true };
    solve(startNode, visited, [startNode]);
    if (result.cycle) break;
  }
  return result;
}

async function animarRecorridoHamilton(path, colorHex) {
  window.isAnimating = true;
  const edgeDataSet = window.network.body.data.edges; 
  const nodeDataSet = window.network.body.data.nodes;
  
  for (let i = 0; i < path.length; i++) {
    nodeDataSet.update({ id: path[i], color: { background: colorHex, border: '#ffffff' } });
    if (i < path.length - 1) {
      const a = path[i], b = path[i+1];
      const edgeIdx = window.edges.findIndex(e => (e.from === a && e.to === b) || (e.from === b && e.to === a));
      if (edgeIdx !== -1) {
        const edgeId = window.edges[edgeIdx].id || `e_${edgeIdx}`;
        edgeDataSet.update({ id: edgeId, color: { color: colorHex }, width: 4 });
      }
    }
    await new Promise(resolve => setTimeout(resolve, 400));
  }
  window.isAnimating = false;
}

function mostrarResultadoHamilton(html, exito) {
  const resDiv = document.getElementById('result-hamilton');
  resDiv.classList.remove('hidden');
  resDiv.className = `text-xs p-2 mt-2 rounded border text-left font-sans leading-relaxed ${exito ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'}`;
  resDiv.innerHTML = html;
}

async function buscarCaminoHamilton() {
  if (window.isAnimating || !window.vertices || window.vertices.length === 0) return;
  limpiarHamilton();
  
  if (window.vertices.length < 3) return mostrarResultadoHamilton("<b>⚠️ Análisis Matemático:</b><br>El grafo tiene menos de 3 nodos.", false);
  if (!isGraphConnectedHamilton()) return mostrarResultadoHamilton("<b>⚠️ Análisis Matemático:</b><br>El grafo está <b>desconectado</b>.", false);
  
  let grados1 = window.vertices.filter(v => computeGradeHamilton(v.id) === 1).length;
  if (grados1 > 2) return mostrarResultadoHamilton(`<b>⚠️ Análisis Matemático:</b><br>Hay <b>${grados1} nodos con grado 1 (hojas)</b>. Máximo permitido: 2.`, false);

  let adj = {}; 
  window.vertices.forEach(v => adj[v.id] = []);
  window.edges.forEach(e => { adj[e.from].push(e.to); adj[e.to].push(e.from); });

  const startTime = performance.now();
  let res = findHamiltonian(window.vertices.map(v => v.id), adj);
  const endTime = performance.now();
  const timeMs = (endTime - startTime).toFixed(2);
  
  // Obtenemos los nombres reales para mostrarlos
  const getName = (id) => window.vertices.find(v => v.id === id)?.name || id;

  if (res.path) {
    let esCiclo = res.cycle ? "<br><i class='text-emerald-600 text-[10px]'>Nota: También forma un Ciclo.</i>" : "";
    let pathNames = res.path.map(getName).join(' → ');
    mostrarResultadoHamilton(`<b>✅ Camino Encontrado</b><br><br>
      <span class="font-mono text-sm bg-white p-1 rounded border inline-block mb-2">${pathNames}</span><br>
      ${esCiclo}<br>
      <span class="text-[10px] text-slate-600"><b>⏱️ Tiempo:</b> ${timeMs} ms | <b>🔄 Intentos:</b> ${res.intentos}</span>`, true);
    await animarRecorridoHamilton(res.path, '#10B981');
  } else {
    mostrarResultadoHamilton(`<b>❌ No existe Camino</b><br><br>
      Exploró ${res.intentos} combinaciones sin éxito.<br>
      <span class="text-[10px] text-slate-600"><b>⏱️ Tiempo:</b> ${timeMs} ms</span>`, false);
  }
}

async function buscarCicloHamilton() {
  if (window.isAnimating || !window.vertices || window.vertices.length === 0) return;
  limpiarHamilton();

  if (window.vertices.length < 3) return mostrarResultadoHamilton("<b>⚠️ Análisis Matemático:</b><br>El grafo tiene menos de 3 nodos.", false);
  if (!isGraphConnectedHamilton()) return mostrarResultadoHamilton("<b>⚠️ Análisis Matemático:</b><br>El grafo está <b>desconectado</b>.", false);

  let grados1 = window.vertices.filter(v => computeGradeHamilton(v.id) === 1).length;
  if (grados1 > 0) return mostrarResultadoHamilton(`<b>⚠️ Análisis Matemático:</b><br>Hay un nodo con grado 1. Imposible cerrar ciclo.`, false);

  let adj = {}; 
  window.vertices.forEach(v => adj[v.id] = []);
  window.edges.forEach(e => { adj[e.from].push(e.to); adj[e.to].push(e.from); });

  const startTime = performance.now();
  let res = findHamiltonian(window.vertices.map(v => v.id), adj);
  const endTime = performance.now();
  const timeMs = (endTime - startTime).toFixed(2);

  const getName = (id) => window.vertices.find(v => v.id === id)?.name || id;

  if (res.cycle) {
    let cycleNames = res.cycle.map(getName).join(' → ');
    mostrarResultadoHamilton(`<b>✅ Ciclo Encontrado</b><br><br>
      <span class="font-mono text-sm bg-white p-1 rounded border inline-block mb-2">${cycleNames}</span><br>
      <span class="text-[10px] text-slate-600"><b>⏱️ Tiempo:</b> ${timeMs} ms | <b>🔄 Intentos:</b> ${res.intentos}</span>`, true);
    await animarRecorridoHamilton(res.cycle, '#0D9488');
  } else {
    mostrarResultadoHamilton(`<b>❌ No existe Ciclo</b><br><br>
      Exploró ${res.intentos} combinaciones sin éxito.<br>
      <span class="text-[10px] text-slate-600"><b>⏱️ Tiempo:</b> ${timeMs} ms</span>`, false);
  }
}// ARCHIVO EN ESPERA PARA SER EDITADO POR EL INTEGRANTE 2 (DESARROLLADOR HAMILTON)
