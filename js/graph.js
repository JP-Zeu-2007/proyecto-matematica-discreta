// ==========================================
// js/graph.js
// Manejo visual del Grafo con Vis.js
// ==========================================

let network = null; 

function renderGraph() {
  const container = document.getElementById('graph-canvas');
  
  const visNodes = vertices.map(v => {
    const grade = computeGrade(v.name); 
    const isEven = grade % 2 === 0;
    let borderColor = isEven ? '#D4AF37' : '#DC2626';
    if (v.used) borderColor = '#10B981';

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

  const visEdges = edges.map((e, idx) => {
    // Lógica para mostrar el peso si el grafo es ponderado
    let edgeLabel = '';
    if (isWeighted && e.weight !== undefined && e.weight !== '') {
      edgeLabel = `${e.weight} ${currentUnit === 'custom' ? customUnitText : currentUnit}`;
    }

    return {
      id: `e_${idx}`,
      from: e.a,
      to: e.b,
      label: edgeLabel,
      font: { size: 10, align: 'top', color: '#1E293B', strokeWidth: 2, strokeColor: '#F8FAFC' },
      arrows: isDirected ? 'to' : '',
      color: { color: '#94A3B8' }
    };
  });

  const data = {
    nodes: new vis.DataSet(visNodes),
    edges: new vis.DataSet(visEdges)
  };
  
  const options = {
    physics: { solver: 'forceAtlas2Based', stabilization: { iterations: 150 } },
    interaction: { hover: true, tooltipDelay: 100 }
  };

  if (network) network.destroy();
  network = new vis.Network(container, data, options);

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

  network.on("zoom", closeContextMenu);
  network.on("dragStart", closeContextMenu);
}
