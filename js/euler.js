// ==========================================
// js/euler.js
// Lógica y Animaciones de Euler y Conexidad
// ==========================================

// 1. ANIMACIÓN DFS (Conexidad)
async function animarDFS() {
  if (isAnimating || vertices.length === 0) return;
  isAnimating = true;
  document.getElementById('btn-dfs').disabled = true;
  limpiarAnalisis();
  
  const edgeDataSet = network.body.data.edges;
  const nodeDataSet = network.body.data.nodes;
  let visited = new Set();
  let stack = [vertices[0].name];
  let recorrido = [];
  const resDiv = document.getElementById('result-container');
  resDiv.classList.remove('hidden');

  while (stack.length > 0) {
    let current = stack.pop();
    if (!visited.has(current)) {
      visited.add(current);
      nodeDataSet.update({ id: current, color: { background: '#0EA5E9' } });
      
      edges.forEach((e, idx) => {
        let neighbor = null;
        if (e.a === current) neighbor = e.b;
        else if (!isDirected && e.b === current) neighbor = e.a;
        
        if (neighbor && !visited.has(neighbor)) {
          stack.push(neighbor);
          recorrido.push(`e_${idx}`);
          edgeDataSet.update({ id: `e_${idx}`, color: { color: '#38BDF8' }, width: 3 });
        }
      });
      await sleep(400);
    }
  }

  const isConnected = visited.size === vertices.length;
  if (isConnected) {
    recorrido.forEach(id => edgeDataSet.update({ id, color: { color: '#10B981' }, width: 4 }));
    vertices.forEach(v => nodeDataSet.update({ id: v.name, color: { background: '#059669' } }));
    resDiv.className = 'mt-2 text-xs p-2 rounded border text-center font-semibold bg-emerald-50 border-emerald-200 text-emerald-700';
    resDiv.innerHTML = '✅ Grafo CONEXO. Listo para Euler/Hamilton.';
  } else {
    recorrido.forEach(id => edgeDataSet.update({ id, color: { color: '#EF4444' }, width: 4 }));
    vertices.forEach(v => {
      if (visited.has(v.name)) nodeDataSet.update({ id: v.name, color: { background: '#EF4444' } });
      else nodeDataSet.update({ id: v.name, color: { background: '#7F1D1D' } });
    });
    resDiv.className = 'mt-2 text-xs p-2 rounded border text-center font-semibold bg-rose-50 border-rose-200 text-rose-700';
    resDiv.innerHTML = '❌ Grafo DESCONEXO.<br>No existe Euler ni Hamilton.';
  }
  
  isAnimating = false;
  document.getElementById('btn-dfs').disabled = false;
}

// 2. ANIMACIÓN CAMINO DE EULER (Amarillo)
async function animarEulerCamino() {
  if (isAnimating || vertices.length === 0) return;
  const odd = getOddVertices();
  const resDiv = document.getElementById('result-container');
  resDiv.classList.remove('hidden');
  
  if (odd.length !== 0 && odd.length !== 2) {
    resDiv.className = 'mt-2 text-xs p-2 rounded border text-rose-700 bg-rose-50';
    resDiv.innerHTML = `❌ No hay Camino de Euler.<br><span class="text-[10px]">Hay ${odd.length} vértices impares (debe haber 0 o 2).</span>`;
    return;
  }
  
  let path = findEulerianPath(odd.length === 2 ? odd[0] : vertices[0].name);
  if (!path) {
    resDiv.className = 'mt-2 text-xs p-2 rounded border text-rose-700 bg-rose-50';
    resDiv.innerHTML = '❌ Error: Grafo desconectado.';
    return;
  }

  isAnimating = true;
  document.getElementById('btn-camino').disabled = true;
  limpiarAnalisis();
  resDiv.classList.remove('hidden');
  
  // Llamamos al viajero (Amarillo)
  await animarViajero(path, '#F59E0B');
  
  resDiv.className = 'mt-2 text-xs p-2 rounded border text-center font-semibold bg-emerald-50 border-emerald-200 text-emerald-700';
  resDiv.innerHTML = `✅ Camino de Euler encontrado.<br><span class="text-[10px]">Recorrido: ${path.join(' → ')}</span>`;
  isAnimating = false;
  document.getElementById('btn-camino').disabled = false;
}

// 3. ANIMACIÓN CICLO DE EULER (Morado con cierre)
async function animarEulerCiclo() {
  if (isAnimating || vertices.length === 0) return;
  const odd = getOddVertices();
  const resDiv = document.getElementById('result-container');
  resDiv.classList.remove('hidden');
  
  if (odd.length !== 0) {
    resDiv.className = 'mt-2 text-xs p-2 rounded border text-rose-700 bg-rose-50';
    resDiv.innerHTML = `❌ No hay Ciclo de Euler.<br><span class="text-[10px]">Hay ${odd.length} vértices impares (debe haber 0).</span>`;
    return;
  }

  let path = findEulerianPath(vertices[0].name);
  if (!path || path[0] !== path[path.length - 1]) {
    resDiv.className = 'mt-2 text-xs p-2 rounded border text-rose-700 bg-rose-50';
    resDiv.innerHTML = '❌ Error: Grafo desconectado.';
    return;
  }

  isAnimating = true;
  document.getElementById('btn-ciclo').disabled = true;
  limpiarAnalisis();
  resDiv.classList.remove('hidden');

  // Llamamos al viajero (Morado)
  await animarViajero(path, '#A855F7');

  // Efecto de cierre de ciclo
  const startNode = path[0];
  await sleep(400);
  network.body.data.nodes.update({ id: startNode, size: 45, color: { background: '#D946EF', border: '#FDF4FF' } });
  await sleep(400);
  network.body.data.nodes.update({ id: startNode, size: 26, color: { background: '#A855F7', border: '#10B981' } });
  
  resDiv.className = 'mt-2 text-xs p-2 rounded border text-center font-semibold bg-emerald-50 border-emerald-200 text-emerald-700';
  resDiv.innerHTML = `✅ <b>¡Ciclo Cerrado!</b><br><span class="text-[10px]">Inicia y termina en ${startNode}.<br>Ruta: ${path.join(' → ')}</span>`;
  
  isAnimating = false;
  document.getElementById('btn-ciclo').disabled = false;
}

// 4. ALGORITMO DE HIERHOLZER (Cálculo puro)
function findEulerianPath(startNode) {
  let tempEdges = edges.map((e, idx) => ({ ...e, id: `e_${idx}` }));
  let stack = [startNode];
  let path = [];

  while (stack.length > 0) {
    let u = stack[stack.length - 1];
    let edgeIdx = tempEdges.findIndex(e => e.a === u || (!isDirected && e.b === u));
    
    if (edgeIdx !== -1) {
      let edge = tempEdges[edgeIdx];
      tempEdges.splice(edgeIdx, 1);
      let nextNode = (edge.a === u) ? edge.b : edge.a;
      stack.push(nextNode);
    } else {
      path.push(stack.pop());
    }
  }
  
  if (tempEdges.length > 0) return null;
  return path.reverse();
}
