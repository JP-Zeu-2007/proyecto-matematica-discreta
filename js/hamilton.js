// ==========================================
// MÓDULO DE HAMILTON - INTEGRANTE 2 (LUIS OMAR)
// Adaptado a la nueva arquitectura por Integrante 1
// ==========================================

// Limpia los resultados anteriores
function limpiarHamilton() {
  const resDivCamino = document.getElementById('result-hamilton-camino');
  const resDivCiclo = document.getElementById('result-hamilton-ciclo');
  
  if (resDivCamino) { resDivCamino.classList.add('hidden'); resDivCamino.innerHTML = ''; }
  if (resDivCiclo) { resDivCiclo.classList.add('hidden'); resDivCiclo.innerHTML = ''; }
}

// Verifica si el grafo está conectado antes de buscar
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

// Calcula el grado para las validaciones previas
function computeGradeHamilton(name) {
  return edges.filter(e => e.a === name || e.b === name).length;
}

// Algoritmo de Backtracking
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

// Muestra el resultado en el contenedor correcto
function mostrarResultadoHamilton(html, exito, tipo) {
  const resDiv = document.getElementById(tipo === 'ciclo' ? 'result-hamilton-ciclo' : 'result-hamilton-camino');
  if(!resDiv) return;
  
  resDiv.classList.remove('hidden');
  resDiv.className = `text-xs p-2 rounded border text-left font-sans leading-relaxed mt-2 ${exito ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'}`;
  resDiv.innerHTML = html;
}

// Botón 4: Camino de Hamilton
async function buscarCaminoHamilton() {
  if (isAnimating || !vertices || vertices.length === 0) return;
  
  isAnimating = true;
  const btn = document.getElementById('btn-hamilton-camino');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Buscando...';
  
  limpiarHamilton();
  if(typeof limpiarAnalisis === 'function') limpiarAnalisis();
  
  if (vertices.length < 3) {
    mostrarResultadoHamilton("<b>⚠️ Análisis Matemático:</b><br>El grafo tiene menos de 3 nodos.", false, 'camino');
    isAnimating = false; btn.disabled = false; btn.innerHTML = '4. Camino de Hamilton'; return;
  }
  
  if (!isGraphConnectedHamilton()) {
    mostrarResultadoHamilton("<b>⚠️ Análisis Matemático:</b><br>El grafo está <b>desconectado</b>.", false, 'camino');
    isAnimating = false; btn.disabled = false; btn.innerHTML = '4. Camino de Hamilton'; return;
  }
  
  let grados1 = vertices.filter(v => computeGradeHamilton(v.name) === 1).length;
  if (grados1 > 2) {
    mostrarResultadoHamilton(`<b>⚠️ Análisis Matemático:</b><br>Hay <b>${grados1} nodos con grado 1 (hojas)</b>. Máximo permitido: 2.`, false, 'camino');
    isAnimating = false; btn.disabled = false; btn.innerHTML = '4. Camino de Hamilton'; return;
  }

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
      <span class="text-[10px] text-slate-600"><b>⏱️ Tiempo:</b> ${timeMs} ms | <b>🔄 Intentos:</b> ${res.intentos}</span>`, true, 'camino');
    
    // Animación
    await animarViajero(res.path, '#10B981');
    
  } else {
    mostrarResultadoHamilton(`<b>❌ No existe Camino</b><br><br>
      Exploró ${res.intentos} combinaciones sin éxito.<br>
      <span class="text-[10px] text-slate-600"><b>⏱️ Tiempo:</b> ${timeMs} ms</span>`, false, 'camino');
  }
  
  isAnimating = false;
  btn.disabled = false;
  btn.innerHTML = '4. Camino de Hamilton';
}

// Botón 5: Ciclo de Hamilton
async function buscarCicloHamilton() {
  if (isAnimating || !vertices || vertices.length === 0) return;
  
  isAnimating = true;
  const btn = document.getElementById('btn-hamilton-ciclo');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Buscando...';
  
  limpiarHamilton();
  if(typeof limpiarAnalisis === 'function') limpiarAnalisis();

  if (vertices.length < 3) {
    mostrarResultadoHamilton("<b>⚠️ Análisis Matemático:</b><br>El grafo tiene menos de 3 nodos.", false, 'ciclo');
    isAnimating = false; btn.disabled = false; btn.innerHTML = '5. Ciclo de Hamilton'; return;
  }
  
  if (!isGraphConnectedHamilton()) {
    mostrarResultadoHamilton("<b>⚠️ Análisis Matemático:</b><br>El grafo está <b>desconectado</b>.", false, 'ciclo');
    isAnimating = false; btn.disabled = false; btn.innerHTML = '5. Ciclo de Hamilton'; return;
  }

  let grados1 = vertices.filter(v => computeGradeHamilton(v.name) === 1).length;
  if (grados1 > 0) {
    mostrarResultadoHamilton(`<b>⚠️ Análisis Matemático:</b><br>Hay un nodo con grado 1. Imposible cerrar ciclo.`, false, 'ciclo');
    isAnimating = false; btn.disabled = false; btn.innerHTML = '5. Ciclo de Hamilton'; return;
  }

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
      <span class="text-[10px] text-slate-600"><b>⏱️ Tiempo:</b> ${timeMs} ms | <b>🔄 Intentos:</b> ${res.intentos}</span>`, true, 'ciclo');
    
    // Animación
    await animarViajero(res.cycle, '#0D9488');
    
  } else {
    mostrarResultadoHamilton(`<b>❌ No existe Ciclo</b><br><br>
      Exploró ${res.intentos} combinaciones sin éxito.<br>
      <span class="text-[10px] text-slate-600"><b>⏱️ Tiempo:</b> ${timeMs} ms</span>`, false, 'ciclo');
  }
  
  isAnimating = false;
  btn.disabled = false;
  btn.innerHTML = '5. Ciclo de Hamilton';
}
