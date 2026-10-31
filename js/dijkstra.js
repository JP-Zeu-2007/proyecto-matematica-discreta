// ==========================================
// MÓDULO DE DIJKSTRA - INTEGRANTE 3 (ADDISON)
// ==========================================

// Variables del Editor
let dijkstraSource = null;
let dijkstraTarget = null;
let modoSeleccion = null;
let isAnimating = false; 
let network = null;
let vertices = [];
let edges = [];
let isDirected = false;
let showNames = true;
let showId = true;
let ctxTarget = null;

// 1. ALGORITMO CON CAPTURA DE ITERACIONES
function calcularRutaDijkstra(origen, destino) {
  let distancias = {};
  let anteriores = {};
  let noVisitados = new Set();
  let iteraciones = []; // Guardar el paso a paso

  // Inicializar
  vertices.forEach(v => {
    distancias[v.name] = Infinity;
    anteriores[v.name] = null;
    noVisitados.add(v.name);
  });
  
  if (!distancias.hasOwnProperty(origen)) return null; // Nodo no existe
  distancias[origen] = 0;

  let paso = 0;
  while (noVisitados.size > 0) {
    let nodoActual = null;
    noVisitados.forEach(nombre => {
      if (nodoActual === null || distancias[nombre] < distancias[nodoActual]) {
        nodoActual = nombre;
      }
    });

    if (distancias[nodoActual] === Infinity || nodoActual === destino) break;
    noVisitados.delete(nodoActual);
    paso++;

    // Registrar iteración para la tabla
    const nombrePred = anteriores[nodoActual] ? anteriores[nodoActual] : '-';
    const distActual = distancias[nodoActual] === Infinity ? '∞' : distancias[nodoActual];

    iteraciones.push({
      paso: paso,
      nodo: nodoActual,
      distancia: distActual,
      predecesor: nombrePred,
      visitado: 'Sí'
    });

    // Relajación de aristas
    edges.forEach(arista => {
      let vecino = null;
      if (arista.a === nodoActual) vecino = arista.b;
      else if (!isDirected && arista.b === nodoActual) vecino = arista.a;

      if (vecino !== null && noVisitados.has(vecino)) {
        let peso = parseFloat(arista.weight) || 1; // Peso por defecto 1 si no tiene
        let nuevaDistancia = distancias[nodoActual] + peso;
        if (nuevaDistancia < distancias[vecino]) {
          distancias[vecino] = nuevaDistancia;
          anteriores[vecino] = nodoActual;
        }
      }
    });
  }

  // Reconstruir ruta
  let ruta = [];
  let actual = destino;
  if (distancias[destino] !== Infinity) {
    while (actual !== null) {
      ruta.unshift(actual);
      actual = anteriores[actual];
    }
  }

  return { 
    ruta: ruta, 
    costoTotal: distancias[destino], 
    esAlcanzable: distancias[destino] !== Infinity, 
    iteraciones: iteraciones 
  };
}

// 2. CONSTRUIR LA TABLA HTML
function renderizarTablaDijkstra(iteraciones) {
  const contenedor = document.getElementById('dijkstra-tabla');
  const tbody = document.getElementById('dijkstra-tabla-body');
  
  if (!contenedor || !tbody) return;

  tbody.innerHTML = '';
  
  if (iteraciones.length === 0) {
    contenedor.classList.add('hidden');
    return;
  }

  iteraciones.forEach((it, index) => {
    const tr = document.createElement('tr');
    tr.className = index % 2 === 0 ? 'bg-slate-50' : 'bg-white';
    tr.innerHTML = `
      <td class="p-1 border border-slate-200">${it.paso}</td>
      <td class="p-1 border border-slate-200 font-bold">${it.nodo}</td>
      <td class="p-1 border border-slate-200 text-emerald-600">${it.distancia}</td>
      <td class="p-1 border border-slate-200 text-slate-500">${it.predecesor}</td>
      <td class="p-1 border border-slate-200 text-blue-600">${it.visitado}</td>
    `;
    tbody.appendChild(tr);
  });

  contenedor.classList.remove('hidden');
}

// 3. DIBUJAR LA RUTA EN EL GRAFO (DORADO)
function resaltarRutaDijkstra(rutaNombres) {
  if (!network) return;
  
  const edgeDataSet = network.body.data.edges;
  const nodeDataSet = network.body.data.nodes;

  // Limpiar estilos previos
  edgeDataSet.forEach(e => edgeDataSet.update({ id: e.id, color: { color: '#94A3B8' }, width: 1 }));
  nodeDataSet.forEach(n => nodeDataSet.update({ id: n.id, color: { background: '#002B49', border: '#D4AF37' } }));

  // Pintar nodos en Dorado
  rutaNombres.forEach(nombre => {
    nodeDataSet.update({ id: nombre, color: { background: '#D4AF37', border: '#002B49' } });
  });

  // Pintar aristas en Dorado
  for (let i = 0; i < rutaNombres.length - 1; i++) {
    const a = rutaNombres[i];
    const b = rutaNombres[i+1];
    const edgeIdx = edges.findIndex(e => (e.a === a && e.b === b) || (!isDirected && e.a === b && e.b === a));
    
    if (edgeIdx !== -1) {
      edgeDataSet.update({ id: `e_${edgeIdx}`, color: { color: '#D4AF37' }, width: 4 });
    }
  }
}

// 4. EJECUTAR Y MOSTRAR RESULTADOS
async function ejecutarRutaDijkstra() {
  const origen = document.getElementById('input-origen').value;
  const destino = document.getElementById('input-destino').value;

  if (!origen || !destino) {
    alert("Selecciona un nodo de origen y destino con los botones celestes/rosados.");
    return;
  }

  if (isAnimating) return;
  isAnimating = true;

  const result = calcularRutaDijkstra(origen, destino);

  if (result && result.esAlcanzable) {
    // 1. Resaltar en el grafo
    resaltarRutaDijkstra(result.ruta);
    
    // 2. Mostrar la tabla
    renderizarTablaDijkstra(result.iteraciones);
    
    // 3. Mostrar resultado
    const el = document.getElementById('result-dijkstra');
    el.classList.remove('hidden');
    el.className = `text-xs p-2 rounded border text-center font-semibold bg-emerald-50 border-emerald-200 text-emerald-700 mt-2`;
    el.innerHTML = `✅ <b>Ruta Encontrada</b><br><span class="text-[10px]">${result.ruta.join(' ➔ ')}<br><b>Costo Total: ${result.costoTotal}</b></span>`;
  } else {
    const el = document.getElementById('result-dijkstra');
    el.classList.remove('hidden');
    el.className = `text-xs p-2 rounded border text-center font-semibold bg-rose-50 border-rose-200 text-rose-700 mt-2`;
    el.innerHTML = `❌ <b>No hay ruta disponible</b><br><span class="text-[10px]">El destino es inalcanzable.</span>`;
    
    const tabla = document.getElementById('dijkstra-tabla');
    if (tabla) tabla.classList.add('hidden');
  }

  isAnimating = false;
}
