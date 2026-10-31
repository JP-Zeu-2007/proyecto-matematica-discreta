// ==========================================
// js/graph-dijkstra.js - Renderizado, Íconos, Tijera y Edición de Pesos
// Copia de graph.js exclusiva para dijkstra.html (Euler/Hamilton usan graph.js)
// ==========================================

let network = null; 
let isTijeraMode = false;

function toggleTijera() {
  isTijeraMode = !isTijeraMode;
  const btn = document.getElementById('btn-tijera');
  if (btn) {
    if (isTijeraMode) {
      btn.classList.add('bg-rose-600', 'text-white');
      btn.classList.remove('bg-slate-200', 'text-slate-700');
      document.getElementById('graph-canvas').style.cursor = 'crosshair';
    } else {
      btn.classList.remove('bg-rose-600', 'text-white');
      btn.classList.add('bg-slate-200', 'text-slate-700');
      document.getElementById('graph-canvas').style.cursor = 'default';
    }
  }
}

function renderGraph() {
  const container = document.getElementById('graph-canvas');
  if (!container) return;
  
  const visNodes = vertices.map(v => {
    const grade = computeGrade(v.name); 
    let borderColor = (grade % 2 === 0) ? '#D4AF37' : '#DC2626';
    
    let labels = [];
    if (typeof showNames !== 'undefined' && showNames) labels.push(v.name);
    if (typeof showId !== 'undefined' && showId) labels.push(v.code);

    let nodeConfig = {
      id: v.name,
      label: labels.join('\n'),
      color: { background: v.used ? '#10B981' : '#002B49', border: borderColor },
      borderWidth: v.used ? 3 : 2,
      shapeProperties: { borderDashes: v.used ? [6, 4] : false },
      font: { color: '#ffffff', size: 11, face: 'Inter' },
      physics: !v.pinned,
      x: v.x, 
      y: v.y
    };

    if (v.icon && v.icon !== 'circle') {
      const iconMap = { 
        'plane': '\uf072', 'server': '\uf233', 'building': '\uf1ad', 
        'house': '\uf015', 'star': '\uf005', 'user': '\uf007', 'water': '\uf043',
        'mountain': '\uf6fc' 
      };
      nodeConfig.shape = 'icon';
      nodeConfig.icon = { 
        face: '"Font Awesome 6 Free"',
        weight: '900',
        code: iconMap[v.icon] || '\uf111',
        size: 40, 
        color: v.used ? '#10B981' : '#002B49' 
      };
      nodeConfig.font = { color: '#1E293B', size: 10, face: 'Inter', vadjust: 45, strokeWidth: 3, strokeColor: '#F8FAFC' };
    } else {
      nodeConfig.shape = 'circle';
      nodeConfig.size = 26;
    }
    return nodeConfig;
  });

  const visEdges = edges.map((e, idx) => {
    let edgeLabel = '';
    if (typeof isWeighted !== 'undefined' && isWeighted && e.weight !== null && e.weight !== undefined) {
      edgeLabel = `${e.weight} ${typeof currentUnit !== 'undefined' ? currentUnit : ''}`;
    }
    
    return {
      id: `e_${idx}`, 
      from: e.a, 
      to: e.b,
      label: edgeLabel,
      font: { size: 10, align: 'top', color: '#1E293B', strokeWidth: 2, strokeColor: '#F8FAFC' },
      arrows: isDirected ? { to: { enabled: true, scaleFactor: 1.2 } } : '',
      color: { color: '#94A3B8', highlight: '#0EA5E9' }, 
      width: 2
    };
  });

  const data = { nodes: new vis.DataSet(visNodes), edges: new vis.DataSet(visEdges) };
  const options = { 
    physics: { solver: 'forceAtlas2Based', stabilization: { iterations: 150 } }, 
    interaction: { hover: true, dragNodes: true } 
  };

  if (network) network.destroy();
  network = new vis.Network(container, data, options);

  // EVENTO CLIC (Con selector de Origen/Destino)
  network.on("click", async function(params) {
    if (isTijeraMode && params.edges.length > 0) {
      const edgeIdx = parseInt(params.edges[0].replace('e_', ''));
      const arista = edges[edgeIdx];
      if(arista) removeEdge(arista.a, arista.b);
    } else if (typeof isEnlazando !== 'undefined' && isEnlazando && params.nodes.length > 0) {
      if (params.nodes[0] !== nodoOrigenEnlace) {
        const origen = nodoOrigenEnlace, destino = params.nodes[0];
        isEnlazando = false; nodoOrigenEnlace = null; container.style.cursor = 'default';
        let peso = null;
        if (typeof isWeighted !== 'undefined' && isWeighted) {
          let unidad = (typeof currentUnit !== 'undefined') ? currentUnit : '';
          let entrada = await pedirDato(`Peso de la arista ${origen} -> ${destino} (en ${unidad}):`, "10");
          if (entrada === null) return; // Cancelado: no se crea la arista
          if (entrada.trim() !== '' && !isNaN(parseFloat(entrada))) peso = parseFloat(entrada);
          if (peso !== null && peso < 0) {
            await avisar('❌ Dijkstra no admite pesos negativos. La arista no se creó.');
            return;
          }
        }
        addEdge(origen, destino, peso);
      }
    } else if (typeof seleccionandoModo !== 'undefined' && seleccionandoModo !== null && params.nodes.length > 0) {
      // LÓGICA PARA SELECCIONAR ORIGEN Y DESTINO
      const clickedNode = params.nodes[0];
      
      if (seleccionandoModo === 'origen') {
        document.getElementById('input-origen').value = clickedNode;
        document.getElementById('btn-sel-origen').classList.remove('animate-pulse', 'bg-sky-500', 'text-white');
        network.body.data.nodes.update({ id: clickedNode, color: { background: '#10B981', border: '#047857' } });
      } else if (seleccionandoModo === 'destino') {
        document.getElementById('input-destino').value = clickedNode;
        document.getElementById('btn-sel-destino').classList.remove('animate-pulse', 'bg-rose-500', 'text-white');
        network.body.data.nodes.update({ id: clickedNode, color: { background: '#EF4444', border: '#B91C1C' } });
      }
      seleccionandoModo = null;
    }
  });

  network.on("doubleClick", function(params) {
    if (params.edges.length > 0 && !isTijeraMode) {
      const edgeIdx = parseInt(params.edges[0].replace('e_', ''));
      const arista = edges[edgeIdx];
      if (arista) {
        let temp = arista.a; arista.a = arista.b; arista.b = temp;
        render();
      }
    }
  });

  network.on("oncontext", async function (params) {
    if (params.event) params.event.preventDefault();
    // En "oncontext" vis-network no llena params.nodes/edges con lo que está bajo el cursor,
    // así que hay que buscarlo por la posición del puntero.
    const nodoClic = network.getNodeAt(params.pointer.DOM);
    const aristaClic = nodoClic === undefined ? network.getEdgeAt(params.pointer.DOM) : undefined;
    if (nodoClic !== undefined) {
      const rect = container.getBoundingClientRect();
      openContextMenu(params.event.clientX - rect.left, params.event.clientY - rect.top, nodoClic);
    } else if (aristaClic !== undefined) {
      const edgeIdx = parseInt(aristaClic.replace('e_', ''));
      const arista = edges[edgeIdx];
      if(arista) {
        let unidad = (typeof currentUnit !== 'undefined') ? currentUnit : '';
        let peso = await pedirDato(`Ingresa el peso para la arista ${arista.a} -> ${arista.b} (en ${unidad}):`, arista.weight ?? "10");
        if(peso !== null && peso.trim() !== '' && !isNaN(parseFloat(peso))) {
          if (parseFloat(peso) < 0) {
            await avisar('❌ Dijkstra no admite pesos negativos. El peso no se cambió.');
            return;
          }
          arista.weight = parseFloat(peso);
          render();
        }
      }
    } else { closeContextMenu(); }
  });
  
  network.on("dragEnd", function(params) {
    if (params.nodes.length > 0) {
      const pos = network.getPositions([params.nodes[0]])[params.nodes[0]];
      const v = getVertex(params.nodes[0]);
      if (v) { v.x = pos.x; v.y = pos.y; }
    }
  });
}

async function animarViajero(ruta, colorRuta) {
  if (!network) return;
  
  const viajeroSelect = document.getElementById('viajero-select');
  const tipoViajero = viajeroSelect ? viajeroSelect.value : 'user';
  const iconMap = { 'user': '\uf007', 'plane': '\uf072', 'car': '\uf1b9' };
  const viajeroId = 'EL_VIAJERO';
  const nodos = network.body.data.nodes;
  const DURACION_TRAMO = 900; // ms que tarda en recorrer cada arista

  // Congelar el grafo para que los nodos no se muevan mientras pasa el viajero
  network.setOptions({ physics: false });
  if (nodos.get(viajeroId)) nodos.remove(viajeroId);

  const inicio = network.getPositions([ruta[0]])[ruta[0]];
  nodos.add({
    id: viajeroId, shape: 'icon', x: inicio.x, y: inicio.y,
    icon: { face: '"Font Awesome 6 Free"', weight: '900', code: iconMap[tipoViajero] || '\uf007', size: 38, color: '#F59E0B' },
    shadow: { enabled: true, color: 'rgba(0,0,0,0.35)', size: 8 },
    physics: false, fixed: true, chosen: false
  });

  pintarNodoRuta(ruta[0], colorRuta);

  for (let i = 0; i < ruta.length - 1; i++) {
    const a = ruta[i], b = ruta[i + 1];
    const pa = network.getPositions([a])[a];
    const pb = network.getPositions([b])[b];
    const edgeIdx = edges.findIndex(e => (e.a === a && e.b === b) || (!isDirected && e.a === b && e.b === a));

    // Movimiento suave de un nodo al siguiente
    await new Promise(resolve => {
      const t0 = performance.now();
      function paso(ahora) {
        const t = Math.min((ahora - t0) / DURACION_TRAMO, 1);
        const suave = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; // acelera y frena
        network.moveNode(viajeroId, pa.x + (pb.x - pa.x) * suave, pa.y + (pb.y - pa.y) * suave);
        if (t < 1) requestAnimationFrame(paso); else resolve();
      }
      requestAnimationFrame(paso);
    });

    if (edgeIdx !== -1) network.body.data.edges.update({ id: `e_${edgeIdx}`, color: { color: colorRuta }, width: 4 });
    pintarNodoRuta(b, colorRuta);
    await sleep(150);
  }

  await sleep(600);
  nodos.remove(viajeroId);
  network.setOptions({ physics: { enabled: true } });
}

// Pinta un nodo de la ruta; los nodos con \u00edcono se colorean cambiando el color del \u00edcono
function pintarNodoRuta(id, color) {
  const nodos = network.body.data.nodes;
  const nodo = nodos.get(id);
  if (!nodo) return;
  if (nodo.shape === 'icon') nodos.update({ id, icon: { ...nodo.icon, color: color } });
  else nodos.update({ id, color: { background: color, border: '#002B49' } });
}
