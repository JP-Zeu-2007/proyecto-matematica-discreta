// ==========================================
// js/dijkstra.js - Lógica y Ejemplo de Volcanes
// ==========================================

let dijkstraSource = null;
let dijkstraTarget = null;

function calcularRutaDijkstra(origenNombre, destinoNombre) {
  let distancias = {};
  let anteriores = {};
  let noVisitados = new Set();

  vertices.forEach(nodo => {
    distancias[nodo.name] = Infinity;
    anteriores[nodo.name] = null;
    noVisitados.add(nodo.name);
  });
  distancias[origenNombre] = 0;

  while (noVisitados.size > 0) {
    let nodoActual = null;
    noVisitados.forEach(name => {
      if (nodoActual === null || distancias[name] < distancias[nodoActual]) {
        nodoActual = name;
      }
    });

    if (distancias[nodoActual] === Infinity || nodoActual === destinoNombre) break;
    noVisitados.delete(nodoActual);

    edges.forEach(arista => {
      let vecino = null;
      if (arista.a === nodoActual) vecino = arista.b;
      if (!isDirected && arista.b === nodoActual) vecino = arista.a;

      if (vecino !== null && noVisitados.has(vecino)) {
        let peso = arista.weight ? parseFloat(arista.weight) : 1; 
        let nuevaDistancia = distancias[nodoActual] + peso;
        
        if (nuevaDistancia < distancias[vecino]) {
          distancias[vecino] = nuevaDistancia;
          anteriores[vecino] = nodoActual;
        }
      }
    });
  }

  let ruta = [];
  let actual = destinoNombre;
  while (actual !== null) {
    ruta.unshift(actual);
    actual = anteriores[actual];
  }

  return { ruta: ruta, costoTotal: distancias[destinoNombre], esAlcanzable: distancias[destinoNombre] !== Infinity };
}

function inicializarDijkstra() {
  if (isAnimating || vertices.length === 0) return;
  
  document.getElementById('result-dijkstra').classList.add('hidden');
  limpiarAnalisis();
  
  dijkstraSource = null;
  dijkstraTarget = null;
  document.getElementById('dijkstra-status').innerText = "Haz clic en el Volcán de ORIGEN";
  
  network.on("click", function(params) {
    if (isTijeraMode) return; 
    
    if (params.nodes.length > 0) {
      const clickedNode = params.nodes[0];
      
      if (!dijkstraSource) {
        dijkstraSource = clickedNode;
        network.body.data.nodes.update({ id: clickedNode, color: { background: '#10B981', border: '#047857' } });
        document.getElementById('dijkstra-status').innerText = "Ahora haz clic en el Volcán de DESTINO";
      } else if (!dijkstraTarget && clickedNode !== dijkstraSource) {
        dijkstraTarget = clickedNode;
        network.body.data.nodes.update({ id: clickedNode, color: { background: '#EF4444', border: '#B91C1C' } });
        document.getElementById('dijkstra-status').innerText = "Calculando ruta...";
        ejecutarRutaDijkstra();
      }
    }
  });
}

async function ejecutarRutaDijkstra() {
  if (!dijkstraSource || !dijkstraTarget || isAnimating) return;
  
  isAnimating = true;
  const resDiv = document.getElementById('result-dijkstra');
  resDiv.classList.remove('hidden');
  resDiv.className = 'text-xs p-2 rounded border text-sky-700 bg-sky-50 mb-2';
  resDiv.innerHTML = 'Calculando...';
  
  logChange(`▶ Calculando Ruta: ${dijkstraSource} a ${dijkstraTarget}...`);

  const result = calcularRutaDijkstra(dijkstraSource, dijkstraTarget);

  if (result.esAlcanzable) {
    const rutaNombres = result.ruta;
    const edgeDataSet = network.body.data.edges;
    const nodeDataSet = network.body.data.nodes;

    for (let i = 0; i < rutaNombres.length; i++) {
      const nodeName = rutaNombres[i];
      if (nodeName !== dijkstraSource && nodeName !== dijkstraTarget) {
        nodeDataSet.update({ id: nodeName, color: { background: '#0EA5E9' } }); 
      }
      
      if (i < rutaNombres.length - 1) {
        const currentName = rutaNombres[i];
        const nextName = rutaNombres[i + 1];
        const edgeId = edges.findIndex(e => (e.a === currentName && e.b === nextName) || (!isDirected && e.a === nextName && e.b === currentName));
        if (edgeId !== -1) edgeDataSet.update({ id: `e_${edgeId}`, color: { color: '#0EA5E9' }, width: 4 });
      }
      await sleep(600);
    }

    resDiv.className = 'text-xs p-2 rounded border text-center font-semibold bg-emerald-50 border-emerald-200 text-emerald-700 mb-2';
    resDiv.innerHTML = `✅ <b>Ruta Encontrada</b><br><span class="text-[10px]">${rutaNombres.join(' ➔ ')}<br><b>Costo Total: ${result.costoTotal} ${currentUnit}</b></span>`;
    logChange(`✅ Ruta encontrada. Costo: ${result.costoTotal}`);
  } else {
    resDiv.className = 'text-xs p-2 rounded border text-center font-semibold bg-rose-50 border-rose-200 text-rose-700 mb-2';
    resDiv.innerHTML = `❌ <b>No hay ruta disponible</b>`;
    logChange(`❌ No se encontró ruta.`);
  }

  isAnimating = false;
  document.getElementById('dijkstra-status').innerText = "Búsqueda finalizada";
}

function limpiarAnalisisDijkstra() {
  dijkstraSource = null;
  dijkstraTarget = null;
  document.getElementById('dijkstra-status').innerText = "Haz clic en el Volcán de ORIGEN";
  document.getElementById('result-dijkstra').classList.add('hidden');
  limpiarAnalisis();
}

function cargarEjemploDijkstra(tipo) {
  if (tipo === 'volcanes') {
    vertices = []; 
    edges = [];
    
    // Nodos con el ícono de montaña (fa-mountain = \uf6fc)
    const volcanes = ["Volcán de Fuego", "Volcán de Agua", "Volcán de Pacaya", "Volcán Acatenango", "Volcán de Atitlán", "Volcán San Pedro", "Volcán Tolimán", "Volcán Tajumulco", "Volcán Tacaná", "Volcán Santa María", "Volcán Santiaguito", "Volcán Cerro Quemado", "Volcán Chicabal", "Volcán Zunil", "Volcán Santo Tomás", "Volcán de Almolonga", "Volcán Cerro de Oro", "Volcán de Ipala", "Volcán Suchitán", "Volcán Tahual", "Volcán de Flores", "Volcán de Moyuta", "Volcán Culma", "Volcán Quetzaltepeque", "Volcán de Cruz Quemada", "Volcán de la Isla", "Volcán del Mico", "Volcán de la Reunión", "Volcán de la Caldera", "Volcán de la Laguna", "Volcán de los Amates", "Volcán Chingo", "Volcán de la Cruz"];
    
    volcanes.forEach((v) => {
      vertices.push({ 
        name: v, 
        code: generateUniqueCode(), 
        icon: 'mountain', // Ícono de montaña
        pinned: false, 
        used: false 
      });
    });

    const r = (a, b, w) => edges.push({ a: volcanes[a], b: volcanes[b], weight: w });
    r(0,1,18); r(0,2,25); r(0,3,12); r(1,4,35); r(1,5,42); r(2,6,30); r(3,7,95); r(3,8,110);
    r(4,9,28); r(4,10,22); r(5,11,15); r(6,12,40); r(7,13,20); r(8,14,18); r(9,15,33);
    r(10,16,45); r(11,17,55); r(12,18,60); r(13,19,25); r(14,20,30); r(15,21,48); r(16,22,70);
    r(17,23,38); r(18,24,50); r(19,25,28); r(20,26,65); r(21,27,52); r(22,28,80); r(23,29,35);
    r(24,30,90); r(25,31,40); r(26,32,55);
    r(0,7,120); r(2,9,75); r(5,12,50); r(10,14,60); r(13,18,85); r(17,22,95); r(20,25,70);
    r(26,30,110); r(27,31,65); r(28,32,45); r(29,31,35);

    isWeighted = true;
    currentUnit = 'km';
    
    const toggle = document.getElementById('toggle-weighted');
    if(toggle) toggle.checked = true;
    const unitSel = document.getElementById('unit-select');
    if(unitSel) unitSel.value = 'km';

    limpiarAnalisisDijkstra();
    render();
  }
}
