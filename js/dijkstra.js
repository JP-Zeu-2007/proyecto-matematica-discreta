// ==========================================
// js/dijkstra.js - Lógica, Ejemplos y Tabla de Rutas
// ==========================================

let dijkstraSource = null;
let dijkstraTarget = null;
let seleccionandoModo = null; // 'origen' o 'destino'

function activarSeleccion(modo) {
  seleccionandoModo = modo;
  if (modo === 'origen') {
    document.getElementById('btn-sel-origen').classList.add('animate-pulse', 'bg-sky-500', 'text-white');
    document.getElementById('btn-sel-destino').classList.remove('animate-pulse', 'bg-rose-500', 'text-white');
  } else {
    document.getElementById('btn-sel-destino').classList.add('animate-pulse', 'bg-rose-500', 'text-white');
    document.getElementById('btn-sel-origen').classList.remove('animate-pulse', 'bg-sky-500', 'text-white');
  }
}

function calcularTodasLasRutas(origenNombre, destinoNombre) {
  let distancias = {};
  let anteriores = {};
  let noVisitados = new Set();
  let todasLasRutas = [];

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

  function explorar(actual, visitados, camino, pesoAcumulado) {
    if (actual === destinoNombre) {
      todasLasRutas.push({ camino: [...camino, actual], peso: pesoAcumulado, saltos: camino.length });
      return;
    }
    visitados.add(actual);
    const vecinos = edges.filter(e => e.a === actual || e.b === actual);
    for (const arista of vecinos) {
      let vecino = arista.a === actual ? arista.b : arista.a;
      if (isDirected && arista.a !== actual) continue;
      if (!visitados.has(vecino)) {
        let pesoArista = arista.weight ? parseFloat(arista.weight) : 1;
        explorar(vecino, visitados, [...camino, actual], pesoAcumulado + pesoArista);
      }
    }
    visitados.delete(actual);
  }
  explorar(origenNombre, new Set(), [], 0);

  let rutaMasCorta = [];
  let actual = destinoNombre;
  while (actual !== null) { rutaMasCorta.unshift(actual); actual = anteriores[actual]; }

  return { distancias, anteriores, rutaDijkstra: rutaMasCorta, esAlcanzable: distancias[destinoNombre] !== Infinity, todasLasRutas };
}

async function ejecutarRutaDijkstra() {
  const origen = document.getElementById('input-origen').value;
  const destino = document.getElementById('input-destino').value;

  if (!origen || !destino) {
    alert("Selecciona el Nodo de Origen y Destino usando los botones azules y rojos.");
    return;
  }
  if (origen === destino) {
    alert("El origen y destino deben ser diferentes.");
    return;
  }
  if (isAnimating) return;
  
  isAnimating = true;
  const resDiv = document.getElementById('result-dijkstra');
  resDiv.classList.remove('hidden');
  resDiv.className = 'text-xs p-2 rounded border text-sky-700 bg-sky-50 mb-2';
  resDiv.innerHTML = 'Calculando...';
  limpiarAnalisis();
  
  logChange(`▶ Calculando Ruta: ${origen} a ${destino}...`);
  const result = calcularTodasLasRutas(origen, destino);

  if (result.esAlcanzable) {
    const rutaNombres = result.rutaDijkstra;
    const edgeDataSet = network.body.data.edges;
    const nodeDataSet = network.body.data.nodes;

    for (let i = 0; i < rutaNombres.length; i++) {
      const nodeName = rutaNombres[i];
      if (nodeName !== origen && nodeName !== destino) {
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

    const unidad = currentUnit ? currentUnit : 'km';
    resDiv.className = 'text-xs p-2 rounded border text-center font-semibold bg-emerald-50 border-emerald-200 text-emerald-700 mb-2';
    resDiv.innerHTML = `✅ <b>Ruta Óptima</b><br><span class="text-[10px]">${rutaNombres.join(' ➔ ')}<br><b>Costo Total: ${result.distancias[destino]} ${unidad}</b></span>`;
    
    generarTablaRutas(result.todasLasRutas, result.rutaDijkstra, unidad);
  } else {
    resDiv.className = 'text-xs p-2 rounded border text-center font-semibold bg-rose-50 border-rose-200 text-rose-700 mb-2';
    resDiv.innerHTML = `❌ No hay ruta disponible.`;
  }
  isAnimating = false;
}

function generarTablaRutas(rutas, mejorRutaDijkstra, unidad) {
  const container = document.getElementById('tabla-rutas');
  if (rutas.length === 0) { container.innerHTML = '<p class="text-xs text-rose-500 font-bold text-center">No se encontraron rutas.</p>'; return; }

  let masBarato = [...rutas].sort((a, b) => a.peso - b.peso)[0];
  let masCorto = [...rutas].sort((a, b) => a.saltos - b.saltos)[0];

  let html = `<table class="w-full text-xs text-left border-collapse">
      <thead class="bg-slate-200 text-slate-700">
        <tr>
          <th class="p-2 border w-12 text-center">Ver</th>
          <th class="p-2 border">Ruta</th>
          <th class="p-2 border text-center">Aristas</th>
          <th class="p-2 border text-center">Peso Total</th>
        </tr>
      </thead><tbody>`;

  rutas.forEach((r, idx) => {
    const esMasBarato = (r.camino.join(',') === masBarato.camino.join(','));
    const esMasCorto = (r.camino.join(',') === masCorto.camino.join(','));
    
    let rowClass = 'border-b border-slate-200 hover:bg-slate-50';
    if (esMasBarato || esMasCorto) rowClass += ' bg-emerald-100 font-bold';

    let caminoTexto = r.camino.map((nodo, i) => {
      if (i === 0) return nodo;
      const prev = r.camino[i-1];
      const edge = edges.find(e => (e.a === prev && e.b === nodo) || (!isDirected && e.b === prev && e.a === nodo));
      return `${nodo}(${edge ? edge.weight : 1})`;
    }).join(' ➔ ');

    let tags = '';
    if (esMasBarato) tags += '<span class="bg-emerald-500 text-white text-[9px] px-1 rounded ml-1">Más Barato</span>';
    if (esMasCorto) tags += '<span class="bg-blue-500 text-white text-[9px] px-1 rounded ml-1">Más Corto</span>';

    let colorBoton = idx % 3 === 0 ? 'text-amber-600' : (idx % 3 === 1 ? 'text-rose-600' : 'text-purple-600');

    html += `
      <tr class="${rowClass}">
        <td class="p-2 border text-center">
          <button onclick='animarRutaEspecifica(${JSON.stringify(r.camino)}, "${colorBoton}")' class="hover:scale-110 transition" title="Ver animación">
            <i class="fa-solid fa-play ${colorBoton}"></i>
          </button>
        </td>
        <td class="p-2 border">${caminoTexto} ${tags}</td>
        <td class="p-2 border text-center">${r.saltos}</td>
        <td class="p-2 border text-center">${r.peso} ${unidad}</td>
      </tr>`;
  });

  container.innerHTML = html + `</tbody></table>`;
}

async function animarRutaEspecifica(camino, color) {
  if (isAnimating) return;
  limpiarAnalisis();
  logChange(`▶ Animando ruta específica (${color})...`);
  
  let colorHex = '#F59E0B'; // Amarillo
  if (color.includes('rose')) colorHex = '#F43F5E'; // Rojo
  if (color.includes('purple')) colorHex = '#A855F7'; // Morado

  await animarViajero(camino, colorHex);
  logChange(`✅ Animación completada.`);
}

function limpiarAnalisisDijkstra() {
  document.getElementById('input-origen').value = "";
  document.getElementById('input-destino').value = "";
  seleccionandoModo = null;
  document.getElementById('result-dijkstra').classList.add('hidden');
  document.getElementById('tabla-rutas').innerHTML = '<p class="text-xs text-slate-400 italic text-center">Calcula una ruta para ver el análisis.</p>';
  limpiarAnalisis();
}

function cargarEjemploDijkstra(tipo) {
  vertices = []; edges = [];
  
  if (tipo === 'volcanes') {
    const volcanes = ["Volcán de Fuego", "Volcán de Agua", "Volcán de Pacaya", "Volcán Acatenango", "Volcán de Atitlán", "Volcán San Pedro", "Volcán Tolimán", "Volcán Tajumulco", "Volcán Tacaná", "Volcán Santa María", "Volcán Santiaguito", "Volcán Cerro Quemado", "Volcán Chicabal", "Volcán Zunil", "Volcán Santo Tomás", "Volcán de Almolonga", "Volcán Cerro de Oro", "Volcán de Ipala", "Volcán Suchitán", "Volcán Tahual", "Volcán de Flores", "Volcán de Moyuta", "Volcán Culma", "Volcán Quetzaltepeque", "Volcán de Cruz Quemada", "Volcán de la Isla", "Volcán del Mico", "Volcán de la Reunión", "Volcán de la Caldera", "Volcán de la Laguna", "Volcán de los Amates", "Volcán Chingo", "Volcán de la Cruz"];
    volcanes.forEach((v) => vertices.push({ name: v, code: generateUniqueCode(), icon: 'mountain', pinned: false, used: false }));
    const r = (a, b, w) => edges.push({ a: volcanes[a], b: volcanes[b], weight: w });
    r(0,1,18); r(0,2,25); r(0,3,12); r(1,4,35); r(1,5,42); r(2,6,30); r(3,7,95); r(3,8,110); r(4,9,28); r(4,10,22); r(5,11,15); r(6,12,40); r(7,13,20); r(8,14,18); r(9,15,33); r(10,16,45); r(11,17,55); r(12,18,60); r(13,19,25); r(14,20,30); r(15,21,48); r(16,22,70); r(17,23,38); r(18,24,50); r(19,25,28); r(20,26,65); r(21,27,52); r(22,28,80); r(23,29,35); r(24,30,90); r(25,31,40); r(26,32,55); r(0,7,120); r(2,9,75); r(5,12,50); r(10,14,60); r(13,18,85); r(17,22,95); r(20,25,70); r(26,30,110); r(27,31,65); r(28,32,45); r(29,31,35);
    isWeighted = true; currentUnit = 'km';

  } else if (tipo === 'vuelos') {
    const cities = ["Guatemala", "Miami", "Bogota", "Mexico", "Madrid", "Lima", "Santiago", "Buenos Aires", "Panama"];
    cities.forEach(c => vertices.push({ name: c, code: generateUniqueCode(), icon: 'plane', pinned: false, used: false }));
    const r = (a,b,w) => edges.push({ a, b, weight: w });
    r("Guatemala","Miami",1600); r("Guatemala","Mexico",900); r("Guatemala","Bogota",1900); r("Guatemala","Panama",1300);
    r("Miami","Madrid",7500); r("Miami","Bogota",2400); r("Mexico","Madrid",9000); r("Mexico","Lima",4200);
    r("Bogota","Lima",1800); r("Bogota","Panama",800); r("Lima","Santiago",2400); r("Santiago","Buenos Aires",1100); r("Panama","Madrid",8500);
    isWeighted = true; currentUnit = 'km';

  } else if (tipo === 'servidores') {
    const servers = ["Servidor Central", "Router A", "Router B", "PC Admin", "Base Datos", "Firewall", "Cloud", "Backup"];
    servers.forEach(s => vertices.push({ name: s, code: generateUniqueCode(), icon: 'server', pinned: false, used: false }));
    const r = (a,b,w) => edges.push({ a, b, weight: w });
    r("Servidor Central","Router A",10); r("Servidor Central","Router B",12); r("Servidor Central","Firewall",5);
    r("Router A","PC Admin",8); r("Router B","Base Datos",15); r("Firewall","Cloud",25);
    r("Base Datos","Backup",30); r("Cloud","Backup",20); r("PC Admin","Base Datos",18);
    isWeighted = true; currentUnit = 'm';

  } else if (tipo === 'ciudades') {
    const zonas = ["Zona 1", "Zona 4", "Zona 10", "Mixco", "Villa Nueva", "Zona 15", "Zona 16", "Carretera", "Zona 2", "Zona 5"];
    zonas.forEach(z => vertices.push({ name: z, code: generateUniqueCode(), icon: 'building', pinned: false, used: false }));
    const r = (a,b,w) => edges.push({ a, b, weight: w });
    r("Zona 1","Zona 4",15); r("Zona 4","Zona 10",20); r("Zona 1","Mixco",35); r("Mixco","Villa Nueva",25);
    r("Villa Nueva","Zona 10",40); r("Zona 10","Zona 15",18); r("Zona 15","Zona 16",22); r("Zona 16","Carretera",50);
    r("Carretera","Zona 2",45); r("Zona 2","Zona 5",30); r("Zona 5","Zona 1",12); r("Zona 4","Zona 15",28);
    isWeighted = true; currentUnit = 'Q';
  }
  
  const toggle = document.getElementById('toggle-weighted');
  if(toggle) toggle.checked = isWeighted;
  const unitSel = document.getElementById('unit-select');
  if(unitSel) unitSel.value = currentUnit;

  limpiarAnalisisDijkstra();
  render();
}
