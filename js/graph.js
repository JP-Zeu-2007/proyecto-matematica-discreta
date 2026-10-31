// ==========================================
// js/graph.js
// Motor del Lienzo Interactivo (Vis.js)
// ==========================================

let network = null; 
let isTijeraMode = false;
let isEnlazando = false;
let nodoOrigenEnlace = null;

function renderGraph() {
  const container = document.getElementById('graph-canvas');
  
  // Configuración visual de los nodos
  const visNodes = vertices.map(v => {
    const grade = computeGrade(v.name); 
    const isEven = grade % 2 === 0;
    let borderColor = isEven ? '#D4AF37' : '#DC2626';
    
    // Etiqueta dinámica según visibilidad
    let labels = [];
    if (showNames) labels.push(v.name);
    if (showId) labels.push(v.code);

    return {
      id: v.name, // Usamos el nombre como ID interno
      label: labels.join('\n'),
      title: `V(${v.name}): ${grade}`,
      shape: 'circle',
      size: 26,
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
  });

  // Configuración visual de aristas
  const visEdges = edges.map((e, idx) => ({
    id: `e_${idx}`,
    from: e.a,
    to: e.b,
    arrows: isDirected ? { to: { enabled: true, scaleFactor: 1.2 } } : '',
    color: { color: '#94A3B8', highlight: '#0EA5E9' },
    width: 2,
    selectionWidth: 3
  }));

  const data = { nodes: new vis.DataSet(visNodes), edges: new vis.DataSet(visEdges) };
  
  const options = {
    physics: { 
      solver: 'forceAtlas2Based', 
      stabilization: { iterations: 150 },
      forceAtlas2Based: { springLength: 150 } 
    },
    interaction: { 
      hover: true, 
      dragNodes: true,
      dragView: true,
      tooltipDelay: 200
    }
  };

  if (network) network.destroy();
  network = new vis.Network(container, data, options);

  // ==========================================
  // EVENTOS DEL LIENZO
  // ==========================================

  // 1. CLIC NORMAL (Tijera o Enlazando)
  network.on("click", function(params) {
    if (isTijeraMode) {
      if (params.edges.length > 0) {
        const edgeId = params.edges[0];
        const idx = parseInt(edgeId.replace('e_', ''));
        const arista = edges[idx];
        removeEdge(arista.a, arista.b);
      }
      return;
    }

    if (isEnlazando && params.nodes.length > 0) {
      const target = params.nodes[0];
      if (target !== nodoOrigenEnlace) {
        addEdge(nodoOrigenEnlace, target);
        isEnlazando = false;
        nodoOrigenEnlace = null;
        container.style.cursor = 'default';
      }
    }
  });

  // 2. DOBLE CLIC EN UNA ARISTA (Invertir dirección)
  network.on("doubleClick", function(params) {
    if (params.edges.length > 0) {
      const edgeId = params.edges[0];
      const idx = parseInt(edgeId.replace('e_', ''));
      const arista = edges[idx];
      
      const temp = arista.a;
      arista.a = arista.b;
      arista.b = temp;
      
      limpiarAnalisis();
      render();
    }
  });

  // 3. CLIC DERECHO (MENÚ CONTEXTUAL) - CORREGIDO
  network.on("oncontext", function (params) {
    if (params.event) params.event.preventDefault(); // Evita el menú del navegador
    
    if (params.nodes.length > 0) {
      // Si se hizo clic sobre un nodo
      const rect = container.getBoundingClientRect();
      
      // Calculamos la posición relativa exacta dentro del contenedor
      const x = params.event.clientX - rect.left;
      const y = params.event.clientY - rect.top;
      
      // Llamamos a la función que dibuja el menú (en main.js)
      if (typeof openContextMenu === 'function') {
        openContextMenu(x, y, params.nodes[0]);
      }
    } else {
      // Si se hace clic en el vacío, cerramos el menú
      if (typeof closeContextMenu === 'function') {
        closeContextMenu();
      }
    }
  });

  // 4. ARRASTRAR (Guardar posición)
  network.on("dragEnd", function(params) {
    if (params.nodes.length > 0) {
      const nodeId = params.nodes[0];
      const pos = network.getPositions([nodeId])[nodeId];
      const v = getVertex(nodeId);
      if (v) {
        v.x = pos.x;
        v.y = pos.y;
      }
    }
  });

  network.on("zoom", closeContextMenu);
  network.on("dragStart", closeContextMenu);
}

// ==========================================
// HERRAMIENTAS (Tijera e inserción)
// ==========================================
function toggleTijera() {
  isTijeraMode = !isTijeraMode;
  isEnlazando = false;
  nodoOrigenEnlace = null;
  
  const btn = document.getElementById('btn-tijera');
  const canvas = document.getElementById('graph-canvas');
  
  if (isTijeraMode) {
    btn.classList.add('bg-rose-500', 'text-white');
    btn.classList.remove('bg-slate-200', 'text-slate-700');
    canvas.style.cursor = 'crosshair';
  } else {
    btn.classList.remove('bg-rose-500', 'text-white');
    btn.classList.add('bg-slate-200', 'text-slate-700');
    canvas.style.cursor = 'default';
  }
}

function addVertexClick() {
  let i = 1;
  while (getVertex(`V${i}`)) i++;
  const name = `V${i}`;
  
  vertices.push({ 
    name, 
    code: generateUniqueCode(), 
    pinned: false, 
    used: false,
    x: undefined, 
    y: undefined
  });
  
  limpiarAnalisis();
  render();
}

// ==========================================
// ACCIONES DEL MENÚ CONTEXTUAL
// ==========================================
function ctxEliminar() {
  removeVertex(ctxTarget);
  closeContextMenu();
}

function ctxRenombrar() {
  const v = getVertex(ctxTarget);
  const nuevoNombre = prompt("Nuevo nombre para el vértice:", v.name);
  if (nuevoNombre && nuevoNombre !== v.name) {
    if (!getVertex(nuevoNombre)) {
      edges.forEach(e => {
        if (e.a === v.name) e.a = nuevoNombre;
        if (e.b === v.name) e.b = nuevoNombre;
      });
      v.name = nuevoNombre;
      limpiarAnalisis();
      render();
    } else {
      alert("Ese nombre ya existe.");
    }
  }
  closeContextMenu();
}

function ctxEnlazar() {
  isEnlazando = true;
  nodoOrigenEnlace = ctxTarget;
  document.getElementById('graph-canvas').style.cursor = 'crosshair';
  closeContextMenu();
}
