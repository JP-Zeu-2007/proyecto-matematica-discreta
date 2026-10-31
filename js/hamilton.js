// ==========================================
// MÓDULO DE HAMILTON - INTEGRANTE 2 (LUIS OMAR)
// Adaptado a la nueva arquitectura del lienzo
// ==========================================

function limpiarHamilton() {
  const resDiv = document.getElementById('result-hamilton');
  if (!resDiv) return;
  resDiv.classList.add('hidden');
  resDiv.innerHTML = '';
  
  if (network) {
    const edgeDataSet = network.body.data.edges;
    const nodeDataSet = network.body.data.nodes;
    edges.forEach((e, idx) => edgeDataSet.update({ id: `e_${idx}`, color: { color: '#94A3B8' }, width: 2 }));
    vertices.forEach(v => nodeDataSet.update({ id: v.name, color: { background: v.used ? '#10B981' : '#002B49' } }));
  }
}

function isGraphConnectedHamilton() {
  if (!vertices || vertices.length === 0) return false;
  let visited = new Set(); 
  let stack = [vertices[0].name];
  
  while (stack.length > 0) {
    let curr = stack.pop();
    if (!visited.has(curr)) {
      visited.add(curr);
      edges.forEach(e => {
        if (e.a === curr && !visited.has(e.b)) stack.push(e.b);
        if (e.b === curr && !visited.has(e.a)) stack.push(e.a);
      });
    }
  }
  return visited.size === vertices.length;
}

function computeGradeHamilton(name) {
  return edges.filter(e => e.a === name || e.b === name).length;
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
  isAnimating = true;
  const edgeDataSet = network.body.data.edges; 
  const nodeDataSet = network.body.data.nodes;
  
  for (let i = 0; i < path.length; i++) {
    nodeDataSet.update({ id: path[i], color: { background: colorHex, border: '#ffffff' } });
    if (i < path.length - 1) {
      const a = path[i], b = path[i+1];
      const edgeIdx = edges.findIndex(e => (e.a === a && e.b === b) || (e.a === b && e.b === a));
      if (edgeIdx !== -1) {
        edgeDataSet.update({ id: `e_${edgeIdx}`, color: { color: colorHex }, width: 4 });
      }
    }
    await sleep(400);
  }
  isAnimating = false;
}

function mostrarResultadoHamilton(html, exito) {
  const resDiv = document.getElementById('result-hamilton');
  resDiv.classList.remove('hidden');
  resDiv.className = `text-xs p-2 mt-2 rounded border text-left font-sans leading-relaxed ${exito ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'}`;
  resDiv.innerHTML = html;
}

async function buscarCaminoHamilton() {
  if (isAnimating || !vertices || vertices.length === 0) return;
  limpiarHamilton();
  
  if (vertices.length < 3) return mostrarResultadoHamilton("<b>⚠️ Análisis Matemático:</b><br>El grafo tiene menos de 3 nodos.", false);
  if (!isGraphConnectedHamilton()) return mostrarResultadoHamilton("<b>⚠️ Análisis Matemático:</b><br>El grafo está <b>desconectado</b>.", false);
  
  let grados1 = vertices.filter(v => computeGradeHamilton(v.name) === 1).length;
  if (grados1 > 2) return mostrarResultadoHamilton(`<b>⚠️ Análisis Matemático:</b><br>Hay <b>${grados1} nodos con grado 1 (hojas)</b>. Máximo permitido: 2.`, false);

  let adj = {}; 
  vertices.forEach(v => adj[v.name] = []);
  edges.forEach(e => { adj[e.a].push(e.b); adj[e.b].push(e.a); });

  const startTime = performance.now();
  let res = findHamiltonian(vertices.map(v => v.name), adj);
  const endTime = performance.now();
  const timeMs = (endTime - startTime).toFixed(2);
  
  if (res.path) {
    let esCiclo = res.cycle ? "<br><i class='text-emerald-600 text-[10px]'>Nota: También forma un Ciclo.</i>" : "";
    mostrarResultadoHamilton(`<b>✅ Camino Encontrado</b><br><br>
      <span class="font-mono text-sm bg-white p-1 rounded border inline-block mb-2">${res.path.join(' → ')}</span><br>
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
  if (isAnimating || !vertices || vertices.length === 0) return;
  limpiarHamilton();

  if (vertices.length < 3) return mostrarResultadoHamilton("<b>⚠️ Análisis Matemático:</b><br>El grafo tiene menos de 3 nodos.", false);
  if (!isGraphConnectedHamilton()) return mostrarResultadoHamilton("<b>⚠️ Análisis Matemático:</b><br>El grafo está <b>desconectado</b>.", false);

  let grados1 = vertices.filter(v => computeGradeHamilton(v.name) === 1).length;
  if (grados1 > 0) return mostrarResultadoHamilton(`<b>⚠️ Análisis Matemático:</b><br>Hay un nodo con grado 1. Imposible cerrar ciclo.`, false);

  let adj = {}; 
  vertices.forEach(v => adj[v.name] = []);
  edges.forEach(e => { adj[e.a].push(e.b); adj[e.b].push(e.a); });

  const startTime = performance.now();
  let res = findHamiltonian(vertices.map(v => v.name), adj);
  const endTime = performance.now();
  const timeMs = (endTime - startTime).toFixed(2);

  if (res.cycle) {
    mostrarResultadoHamilton(`<b>✅ Ciclo Encontrado</b><br><br>
      <span class="font-mono text-sm bg-white p-1 rounded border inline-block mb-2">${res.cycle.join(' → ')}</span><br>
      <span class="text-[10px] text-slate-600"><b>⏱️ Tiempo:</b> ${timeMs} ms | <b>🔄 Intentos:</b> ${res.intentos}</span>`, true);
    await animarRecorridoHamilton(res.cycle, '#0D9488');
  } else {
    mostrarResultadoHamilton(`<b>❌ No existe Ciclo</b><br><br>
      Exploró ${res.intentos} combinaciones sin éxito.<br>
      <span class="text-[10px] text-slate-600"><b>⏱️ Tiempo:</b> ${timeMs} ms</span>`, false);
  }
}
