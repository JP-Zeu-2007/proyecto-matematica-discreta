// ==========================================
// js/euler.js
// Lógica y Animaciones de Euler y Conexidad
// ==========================================

// 1. ANIMACIÓN DFS (Conexidad)
async function animarDFS() {
  if (isAnimating || vertices.length === 0) return;
  isAnimating = true;
  const btn = document.getElementById('btn-dfs');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Analizando...';
  
  limpiarAnalisis();
  const resDiv = document.getElementById('result-dfs');
  resDiv.classList.remove('hidden');
  resDiv.className = 'text-xs p-2 rounded border text-indigo-700 bg-indigo-50 mb-2';
  resDiv.innerHTML = 'Ejecutando DFS...';
  
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
    resDiv.className = 'text-xs p-2 rounded border text-center font-semibold bg-emerald-50 border-emerald-200 text-emerald-700 mb-2';
    resDiv.innerHTML = '✅ Grafo CONEXO.';
  } else {
    recorrido.forEach(id => edgeDataSet.update({ id, color: { color: '#EF4444' }, width: 4 }));
    vertices.forEach(v => {
      if (visited.has(v.name)) nodeDataSet.update({ id: v.name, color: { background: '#EF4444' } });
      else nodeDataSet.update({ id: v.name, color: { background: '#7F1D1D' } });
    });
    resDiv.className = 'text-xs p-2 rounded border text-center font-semibold bg-rose-50 border-rose-200 text-rose-700 mb-2';
    resDiv.innerHTML = '❌ Grafo DESCONEXO.<br>No existe Euler ni Hamilton.';
  }
  
  isAnimating = false;
  btn.disabled = false;
  btn.innerHTML = '1. Conexidad (DFS)';
}

// 2. ANIMACIÓN CAMINO DE EULER (Amarillo)
async function animarEulerCamino() {
  if (isAnimating || vertices.length === 0) return;
  const odd = getOddVertices();
  const resDiv = document.getElementById('result-camino');
  resDiv.classList.remove('hidden');
  
  if (odd.length !== 0 && odd.length !== 2) {
    resDiv.className = 'text-xs p-2 rounded border text-rose-700 bg-rose-50 mb-2';
    resDiv.innerHTML = `❌ No hay Camino de Euler.<br><span class="text-[10px]">Hay ${odd.length} vértices impares (debe haber 0 o 2).</span>`;
    return;
  }
  
  let path = findEulerianPath(odd.length === 2 ? odd[0] : vertices[0].name);
  if (!path) {
    resDiv.className = 'text-xs p-2 rounded border text-rose-700 bg-rose-50 mb-2';
    resDiv.innerHTML = '❌ Error: Grafo desconectado.';
    return;
  }

  isAnimating = true;
  const btn = document.getElementById('btn-camino');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Viajando...';
  
  limpiarAnalisis();
  resDiv.classList.remove('hidden');
  resDiv.className = 'text-xs p-2 rounded border text-indigo-700 bg-indigo-50 mb-2';
  resDiv.innerHTML = 'Calculando ruta...';
  
  // Animación del viajero (Color Amarillo #F59E0B)
  await animarViajero(path, '#F59E0B');
  
  resDiv.className = 'text-xs p-2 rounded border text-center font-semibold bg-emerald-50 border-emerald-200 text-emerald-700 mb-2';
  resDiv.innerHTML = `✅ Camino de Euler encontrado.<br><span class="text-[10px]">Recorrido: ${path.join(' → ')}</span>`;
  
  isAnimating = false;
  btn.disabled = false;
  btn.innerHTML = '2. Camino de Euler';
}

// 3. ANIMACIÓN CICLO DE EULER (Morado)
async function animarEulerCiclo() {
  if (isAnimating || vertices.length === 0) return;
  const odd = getOddVertices();
  const resDiv = document.getElementById('result-ciclo');
  resDiv.classList.remove('hidden');
  
  if (odd.length !== 0) {
    resDiv.className = 'text-xs p-2 rounded border text-rose-700 bg-rose-50 mb-2';
    resDiv.innerHTML = `❌ No hay Ciclo de Euler.<br><span class="text-[10px]">Hay ${odd.length} vértices impares (debe haber 0).</span>`;
    return;
  }

  let path = findEulerianPath(vertices[0].name);
  if (!path || path[0] !== path[path.length - 1]) {
    resDiv.className = 'text-xs p-2 rounded border text-rose-700 bg-rose-50 mb-2';
    resDiv.innerHTML = '❌ Error: Grafo desconectado.';
    return;
  }

  isAnimating = true;
  const btn = document.getElementById('btn-ciclo');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Viajando...';
  
  limpiarAnalisis();
  resDiv.classList.remove('hidden');
  resDiv.className = 'text-xs p-2 rounded border text-purple-700 bg-purple-50 mb-2';
  resDiv.innerHTML = 'Calculando ruta...';
  
  // Animación del viajero (Color Morado #A855F7)
  await animarViajero(path, '#A855F7');

  // Efecto visual de cierre de ciclo
  const startNode = path[0];
  await sleep(400);
  network.body.data.nodes.update({ id: startNode, size: 45, color: { background: '#D946EF', border: '#FDF4FF' } });
  await sleep(400);
  network.body.data.nodes.update({ id: startNode, size: 26, color: { background: '#A855F7', border: '#10B981' } });
  
  resDiv.className = 'text-xs p-2 rounded border text-center font-semibold bg-emerald-50 border-emerald-200 text-emerald-700 mb-2';
  resDiv.innerHTML = `✅ <b>¡Ciclo Cerrado!</b><br><span class="text-[10px]">Inicia y termina en ${startNode}.<br>Ruta: ${path.join(' → ')}</span>`;
  
  isAnimating = false;
  btn.disabled = false;
  btn.innerHTML = '3. Ciclo de Euler';
}

// 5. EJEMPLOS PRECARGADOS
// Cada ejemplo muestra un caso distinto de Euler/Hamilton para poder comparar
const EJEMPLOS_EULER = {
  // K5: todos los grados son 4 (pares) -> Ciclo de Euler y Ciclo de Hamilton
  vuelos: {
    icon: 'plane',
    nodos: ['GUA', 'MEX', 'MIA', 'BOG', 'SAL'],
    aristas: [['GUA', 'MEX'], ['MEX', 'MIA'], ['MIA', 'BOG'], ['BOG', 'SAL'], ['SAL', 'GUA'],
              ['GUA', 'MIA'], ['MIA', 'SAL'], ['SAL', 'MEX'], ['MEX', 'BOG'], ['BOG', 'GUA']]
  },
  // "Casita": 2 vértices impares -> Camino de Euler (no ciclo) y Ciclo de Hamilton
  servidores: {
    icon: 'server',
    nodos: ['S1', 'S2', 'S3', 'S4', 'S5'],
    aristas: [['S1', 'S2'], ['S2', 'S3'], ['S3', 'S4'], ['S4', 'S1'], ['S1', 'S5'], ['S2', 'S5']]
  },
  // Hexágono con 2 diagonales: 4 vértices impares -> sin Euler, pero con Ciclo de Hamilton
  ciudades: {
    icon: 'building',
    nodos: ['Guatemala', 'Antigua', 'Chimaltenango', 'Xela', 'Escuintla', 'Cobán'],
    aristas: [['Guatemala', 'Antigua'], ['Antigua', 'Chimaltenango'], ['Chimaltenango', 'Xela'], ['Xela', 'Escuintla'],
              ['Escuintla', 'Cobán'], ['Cobán', 'Guatemala'], ['Guatemala', 'Xela'], ['Antigua', 'Escuintla']]
  },
  // Línea recta: Camino de Euler y Camino de Hamilton, pero ningún ciclo
  tuberias: {
    icon: 'water',
    nodos: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'],
    aristas: [['T1', 'T2'], ['T2', 'T3'], ['T3', 'T4'], ['T4', 'T5'], ['T5', 'T6']]
  },
  // Estrella: 5 hojas -> ni Euler ni Hamilton
  estrella: {
    icon: 'star',
    nodos: ['Centro', 'P1', 'P2', 'P3', 'P4', 'P5'],
    aristas: [['Centro', 'P1'], ['Centro', 'P2'], ['Centro', 'P3'], ['Centro', 'P4'], ['Centro', 'P5']]
  }
};

function cargarEjemplo(clave) {
  const ej = EJEMPLOS_EULER[clave];
  if (!ej || isAnimating) return;

  vertices = ej.nodos.map(n => ({ name: n, code: generateUniqueCode(), pinned: false, used: false, icon: ej.icon, x: undefined, y: undefined }));
  edges = ej.aristas.map(([a, b]) => ({ a, b, weight: null }));
  currentGraphId = null;

  // Los ejemplos son grafos no dirigidos
  isDirected = false;
  const toggle = document.getElementById('toggle-directed');
  if (toggle) toggle.checked = false;

  limpiarAnalisis();
  if (typeof limpiarHamilton === 'function') limpiarHamilton();
  render();
}

// 4. ALGORITMO DE HIERHOLZER (Cálculo puro de la ruta)
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
