// ==========================================
// js/graph.js
// Manejo visual del Grafo con Vis.js
// ==========================================

let network = null; // Instancia global de Vis.js

// Función para dibujar el grafo en pantalla
function renderGraph() {
  const container = document.getElementById('graph-canvas');
  
  // 1. Crear los nodos visuales
  const visNodes = vertices.map(v => {
    const grade = computeGrade(v.name); 
    const isEven = grade % 2 === 0;
    
    // Colores base: Dorado si es par, Rojo si es impar
    let borderColor = isEven ? '#D4AF37' : '#DC2626';
    if (v.used) borderColor = '#10B981'; // Verde si está "Usado"

    return {
      id: v.name,
      label: showNames ? `${v.code}\n${v.name}` : v.code,
      title: `V(${v.name}): ${grade} (${isEven ? 'Par' : 'Impar'})`,
      shape: 'circle',
      size: Math.max(22 + (v.code.length - 5) * 3, 26),
      color: { background: '#002B49', border: borderColor },
      borderWidth: v.used ? 3 : 2,
      shapeProperties: { borderDashes: v.used ? [6, 4] : false },
      font: { color: '#ffffff', size: 11, face: 'Inter' },
      physics: !v.pinned
    };
  });

  // 2. Crear las aristas visuales
  const visEdges = edges.map((e, idx) => ({
    id: `e_${idx}`,
    from: e.a,
    to: e.b,
    arrows: isDirected ? 'to' : '',
    color: { color: '#94A3B8' }
  }));

  // 3. Empaquetar los datos y las opciones
  const data = {
    nodes: new vis.DataSet(visNodes),
    edges: new vis.DataSet(visEdges)
  };
  
  const options = {
    physics: { solver: 'forceAtlas2Based', stabilization: { iterations: 150 } },
    interaction: { hover: true, tooltipDelay: 100 }
  };

  // 4. Destruir el grafo anterior si existe y crear uno nuevo
  if (network) network.destroy();
  network = new vis.Network(container, data, options);

  // 5. Configurar el menú contextual (Clic Derecho)
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

  // Cerrar el menú al hacer zoom o arrastrar
  network.on("zoom", closeContextMenu);
  network.on("dragStart", closeContextMenu);
}
