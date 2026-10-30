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
      physics: !v.pinned, // Si está fijado, desactiva la física
      x: v.x, y: v.y // Mantener posición si está fijado
    };
  });

  // Configuración visual de aristas
  const visEdges = edges.map((e, idx) => ({
    id: `e_${idx}`,
    from: e.a,
    to: e.b,
    arrows: isDirected ? { to: { enabled: true, scaleFactor: 1.2 } } : '', // Flechas si es dirigido
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
      dragNodes: true, // Permite arrastrar nodos
      dragView: true,
      tooltipDelay: 200
    }
  };

  if (network) network.destroy();
  network = new vis.Network(container, data, options);

  // ==========================================
  // EVENTOS DEL LIENZO
  // ==========================================

  // 1. CLIC EN EL LIENZO (Tijera o Enlazando)
  network.on("click", function(params) {
    // Si estamos en modo tijera
    if (isTijeraMode) {
      if (params.edges.length > 0) {
        const edgeId = params.edges[0];
        const idx = parseInt(edgeId.replace('e_', ''));
        const arista = edges[idx];
        removeEdge(arista.a, arista.b);
        logChange(`✂️ Arista cortada: ${arista.a} - ${arista.b}`);
      }
      return;
    }

    // Si estamos en modo enlazando
    if (isEnlazando && params.nodes.length > 0) {
      const target = params.nodes[0];
      if (target !== nodoOrigenEnlace) {
        addEdge(nodoOrigenEnlace, target);
        isEnlazando = false;
        nodoOrigenEnlace = null;
        document.getElementById('graph-canvas').style.cursor = 'default';
        logChange(`🔗 Enlace creado.`);
      }
    }
  });

  // 2. DOBLE CLIC EN UNA ARISTA (Invertir dirección)
  network.on("doubleClick", function(params) {
    if (params.edges.length > 0) {
      const edgeId = params.edges[0];
      const idx = parseInt(edgeId.replace('e_', ''));
      const arista = edges[idx];
      
      // Invertir la arista
      const temp = arista.a;
      arista.a = arista.b;
      arista.b = temp;
      
      limpiarAnalisis();
      render();
      logChange(`🔄 Dirección invertida: ${arista.b} → ${arista.a}`);
    }
  });

  // 3. CLIC DERECHO (Menú Contextual)
  network.on("oncontext", function (params) {
    if (params.event) params.event.preventDefault();
    if (params.nodes.length > 0) {
      const rect = container.getBoundingClientRect();
      openContextMenu(
        params.event.clientX - rect.left,
        params.event.clientY - rect.top,
        params.nodes[0]
      );
    } else {
      closeContextMenu();
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
// FUNCIONES DE LAS HERRAMIENTAS
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
    logChange("✂️ Modo Tijera ACTIVADO. Haz clic en una línea para cortarla.");
  } else {
    btn.classList.remove('bg-rose-500', 'text-white');
    btn.classList.add('bg-slate-200', 'text-slate-700');
    canvas.style.cursor = 'default';
    logChange("Modo Tijera desactivado.");
  }
}

function addVertexClick() {
  // Insertar un vértice en el centro de la vista con un nombre genérico
  let i = 1;
  while (getVertex(`V${i}`)) i++;
  const name = `V${i}`;
  
  vertices.push({ 
    name, 
    code: generateUniqueCode(), 
    pinned: false, 
    used: false,
    x: undefined, // Física libre
    y: undefined
  });
  
  logChange(`+ Vértice <strong>${name}</strong> agregado.`);
  render();
}

// ==========================================
// MENÚ CONTEXTUAL
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
      // Actualizar aristas
      edges.forEach(e => {
        if (e.a === v.name) e.a = nuevoNombre;
        if (e.b === v.name) e.b = nuevoNombre;
      });
      v.name = nuevoNombre;
      limpiarAnalisis();
      render();
      logChange(`Vértice renombrado a <strong>${nuevoNombre}</strong>.`);
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
  logChange(`🔗 Selecciona el vértice de destino para enlazar desde <strong>${ctxTarget}</strong>...`);
  closeContextMenu();
}
