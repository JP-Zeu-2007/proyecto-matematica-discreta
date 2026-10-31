// ==========================================
// js/graph.js - Renderizado con Íconos y Viajero
// ==========================================

let network = null; 
let isTijeraMode = false;
let isEnlazando = false;
let nodoOrigenEnlace = null;

function renderGraph() {
  const container = document.getElementById('graph-canvas');
  
  const visNodes = vertices.map(v => {
    const grade = computeGrade(v.name); 
    let borderColor = (grade % 2 === 0) ? '#D4AF37' : '#DC2626';
    
    let labels = [];
    if (showNames) labels.push(v.name);
    if (showId) labels.push(v.code);

    let nodeConfig = {
      id: v.name,
      label: labels.join('\n'),
      color: { 
        background: v.used ? '#10B981' : '#002B49', 
        border: borderColor 
      },
      borderWidth: v.used ? 3 : 2,
      shapeProperties: { borderDashes: v.used ? [6, 4] : false },
      font: { color: '#ffffff', size: 11, face: 'Inter' },
      physics: !v.pinned,
      x: v.x, y: v.y
    };

    // Lógica de Íconos
    if (v.icon && v.icon !== 'circle') {
      // Mapeo de íconos FontAwesome a códigos Unicode
      const iconMap = {
        'plane': '\uf072', 'server': '\uf233', 'building': '\uf1ad', 
        'house': '\uf015', 'star': '\uf005', 'user': '\uf007', 'water': '\uf043'
      };
      
      nodeConfig.shape = 'icon';
      nodeConfig.icon = {
        face: 'FontAwesome',
        code: iconMap[v.icon] || '\uf111', // Círculo por defecto
        size: 40,
        color: v.used ? '#10B981' : '#002B49'
      };
      // Ocultamos la etiqueta o la ponemos debajo si es ícono
      nodeConfig.font = { color: '#1E293B', size: 10, vadjust: 45 };
    } else {
      nodeConfig.shape = 'circle';
      nodeConfig.size = 26;
    }

    return nodeConfig;
  });

  const visEdges = edges.map((e, idx) => ({
    id: `e_${idx}`,
    from: e.a,
    to: e.b,
    arrows: isDirected ? { to: { enabled: true, scaleFactor: 1.2 } } : '',
    color: { color: '#94A3B8', highlight: '#0EA5E9' },
    width: 2
  }));

  const data = { nodes: new vis.DataSet(visNodes), edges: new vis.DataSet(visEdges) };
  const options = {
    physics: { solver: 'forceAtlas2Based', stabilization: { iterations: 150 }, forceAtlas2Based: { springLength: 150 } },
    interaction: { hover: true, dragNodes: true }
  };

  if (network) network.destroy();
  network = new vis.Network(container, data, options);

  // Eventos (Clic, Tijera, Clic derecho...)
  network.on("click", function(params) {
    if (isTijeraMode && params.edges.length > 0) {
      const arista = edges[parseInt(params.edges[0].replace('e_', ''))];
      removeEdge(arista.a, arista.b);
    } else if (isEnlazando && params.nodes.length > 0) {
      if (params.nodes[0] !== nodoOrigenEnlace) {
        addEdge(nodoOrigenEnlace, params.nodes[0]);
        isEnlazando = false; nodoOrigenEnlace = null; container.style.cursor = 'default';
      }
    }
  });

  network.on("oncontext", function (params) {
    if (params.event) params.event.preventDefault();
    if (params.nodes.length > 0) {
      const rect = container.getBoundingClientRect();
      openContextMenu(params.event.clientX - rect.left, params.event.clientY - rect.top, params.nodes[0]);
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

// ==========================================
// ANIMACIÓN DEL VIAJERO (PUNTO 4)
// ==========================================
async function animarViajero(ruta, colorRuta, iconoViajero = 'user') {
  if (!network) return;
  
  // 1. Crear el nodo "Fantasma" que viajará
  const iconMap = { 'user': '\uf007', 'plane': '\uf072', 'car': '\uf1b9' };
  const viajeroId = 'EL_VIAJERO';
  
  network.body.data.nodes.add({
    id: viajeroId,
    shape: 'icon',
    icon: { face: 'FontAwesome', code: iconMap[iconoViajero], size: 35, color: '#F59E0B' },
    physics: false,
    fixed: true
  });

  // 2. Mover el viajero nodo por nodo
  for (let i = 0; i < ruta.length; i++) {
    const nodoActual = ruta[i];
    const pos = network.getPositions([nodoActual])[nodoActual];
    
    // Mover el viajero a la posición
    network.moveNode(viajeroId, pos.x, pos.y);
    
    // Pintar el nodo y la arista
    network.body.data.nodes.update({ id: nodoActual, color: { background: colorRuta, border: '#ffffff' } });
    
    if (i < ruta.length - 1) {
      const a = ruta[i], b = ruta[i+1];
      const edgeIdx = edges.findIndex(e => (e.a === a && e.b === b) || (!isDirected && e.a === b && e.b === a));
      if (edgeIdx !== -1) {
        network.body.data.edges.update({ id: `e_${edgeIdx}`, color: { color: colorRuta }, width: 4 });
      }
    }
    
    await sleep(800); // Velocidad pausada para ver el viaje
  }
  
  // 3. Eliminar al viajero al terminar
  await sleep(500);
  network.body.data.nodes.remove(viajeroId);
}

// Herramientas (sin cambios)
function toggleTijera() { /* ... código de la tijera ... */ }
