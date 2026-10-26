// ==========================================
// js/euler.js
// Lógica y Animaciones de Euler y Conexidad
// ==========================================

// 1. ANIMACIÓN DFS (Conexidad)
async function animarDFS() {
  if (isAnimating || vertices.length === 0) return;
  isAnimating = true;
  setBtnState('btn-dfs', true);
  document.getElementById('result-dfs').classList.add('hidden');
  
  const edgeDataSet = network.body.data.edges;
  const nodeDataSet = network.body.data.nodes;
  let visited = new Set();
  let stack = [vertices[0].name];
  let recorrido = [];

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
    showResult('result-dfs', '✅ Grafo CONEXO. Listo para Euler/Hamilton.', 'success');
  } else {
    recorrido.forEach(id => edgeDataSet.update({ id, color: { color: '#EF4444' }, width: 4 }));
    vertices.forEach(v => {
      if (visited.has(v.name)) nodeDataSet.update({ id: v.name, color: { background: '#EF4444' } });
      else nodeDataSet.update({ id: v.name, color: { background: '#7F1D1D' } });
    });
    showResult('result-dfs', '❌ Grafo DESCONEXO.<br><span class="text-[10px]">No existe Euler ni Hamilton.</span>', 'error');
  }
  
  isAnimating = false;
  setBtnState('btn-dfs', false);
}

// 2. ANIMACIÓN CAMINO DE EULER (Amarillo)
async function animarEulerCamino() {
  if (isAnimating || vertices.length === 0) return;
  const odd = getOddVertices();
  
  if (odd.length !== 0 && odd.length !== 2) {
    showResult('result-camino', `❌ No hay Camino de Euler.<br><span class="text-[10px]">Hay ${odd.length} vértices impares (debe haber 0 o 2).</span>`, 'error');
    return;
  }
  
  let path = findEulerianPath(odd.length === 2 ? odd[0] : vertices[0].name);
  if (!path) {
    showResult('result-camino', '❌ Error: Grafo desconectado.', 'error');
    return;
  }

  isAnimating = true;
  setBtnState('btn-camino', true);
  document.getElementById('result-camino').classList.add('hidden');
  
  const edgeDataSet = network.body.data.edges;
  const nodeDataSet = network.body.data.nodes;
  logChange(`▶ Animando Camino de Euler: ${path.join(' → ')}`);

  for (let i = 0; i < path.length; i++) {
    nodeDataSet.update({ id: path[i], color: { background: '#F59E0B' } });
    if (i < path.length - 1) {
      const a = path[i], b = path[i + 1];
      const edgeIdx = edges.findIndex(e => (e.a === a && e.b === b) || (!isDirected && e.a === b && e.b === a));
      if (edgeIdx !== -1) edgeDataSet.update({ id: `e_${edgeIdx}`, color: { color: '#F59E0B' }, width: 4 });
    }
    await sleep(500);
  }
  
  showResult('result-camino', `✅ Camino de Euler encontrado.<br><span class="text-[10px]">Recorrido: ${path.join(' → ')}</span>`, 'success');
  isAnimating = false;
  setBtnState('btn-camino', false);
}

// 3. ANIMACIÓN CICLO DE EULER (Morado con cierre)
async function animarEulerCiclo() {
  if (isAnimating || vertices.length === 0) return;
  const odd = getOddVertices();
  
  if (odd.length !== 0) {
    showResult('result-ciclo', `❌ No hay Ciclo de Euler.<br><span class="text-[10px]">Hay ${odd.length} vértices impares (debe haber 0).</span>`, 'error');
    return;
  }

  let path = findEulerianPath(vertices[0].name);
  if (!path || path[0] !== path[path.length - 1]) {
    showResult('result-ciclo', '❌ Error: Grafo desconectado.', 'error');
    return;
  }

  isAnimating = true;
  setBtnState('btn-ciclo', true);
  document.getElementById('result-ciclo').classList.add('hidden');
  
  const edgeDataSet = network.body.data.edges;
  const nodeDataSet = network.body.data.nodes;
  logChange(`▶ Animando Ciclo de Euler: ${path.join(' → ')}`);

  for (let i = 0; i < path.length; i++) {
    nodeDataSet.update({ id: path[i], color: { background: '#A855F7' } });
    if (i < path.length - 1) {
      const a = path[i], b = path[i + 1];
      const edgeIdx = edges.findIndex(e => (e.a === a && e.b === b) || (!isDirected && e.a === b && e.b === a));
      if (edgeIdx !== -1) edgeDataSet.update({ id: `e_${edgeIdx}`, color: { color: '#A855F7' }, width: 4 });
    }
    await sleep(500);
  }

  // Efecto de cierre de ciclo
  const startNode = path[0];
  const endNode = path[path.length - 1];
  
  if (startNode === endNode) {
    await sleep(600);
    nodeDataSet.update({ id: startNode, size: 40, color: { background: '#D946EF', border: '#FDF4FF' } });
    await sleep(400);
    nodeDataSet.update({ id: startNode, size: 26, color: { background: '#A855F7', border: '#10B981' } });
    await sleep(400);
    
    showResult('result-ciclo', `✅ <b>¡Ciclo Cerrado!</b><br><span class="text-[10px]">Inicia y termina en ${startNode}.<br>Ruta: ${path.join(' → ')}</span>`, 'success');
  } else {
    showResult('result-ciclo', `✅ Ciclo de Euler.<br><span class="text-[10px]">Ruta: ${path.join(' → ')}</span>`, 'success');
  }
  
  isAnimating = false;
  setBtnState('btn-ciclo', false);
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
