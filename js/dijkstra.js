// ==========================================
// MÓDULO DE DIJKSTRA - INTEGRANTE 3 (ADDISON)
// ==========================================

// Variables del Editor
// (vertices, edges, isDirected, network, isAnimating... ya están declaradas en main.js y graph.js;
//  volver a declararlas con "let" rompe todo este archivo con un SyntaxError)
let seleccionandoModo = null; // 'origen' | 'destino' | null (lo usa graph.js al hacer clic)
let isWeighted = true;
let currentUnit = 'km';

// Configuración inicial de los controles
document.addEventListener('DOMContentLoaded', () => {
  const unitSelect = document.getElementById('unit-select');
  if (unitSelect) {
    currentUnit = unitSelect.value;
    unitSelect.addEventListener('change', () => { currentUnit = unitSelect.value; renderGraph(); });
  }
  const weighted = document.getElementById('toggle-weighted');
  if (weighted) isWeighted = weighted.checked;
});

// ---- CUADRO DE DIÁLOGO PROPIO ----
// prompt(), alert() y confirm() no funcionan en algunos navegadores (por ejemplo, navegadores
// integrados en otras apps), así que usamos un diálogo dentro de la página.
// tipo: 'pedir' (con campo de texto), 'avisar' (solo Aceptar) o 'confirmar' (Aceptar/Cancelar)
function abrirDialogo(tipo, mensaje, valorInicial = '') {
  return new Promise(resolve => {
    const dialogo = document.getElementById('dialogo');
    const form = document.getElementById('dialogo-form');
    const input = document.getElementById('dialogo-input');
    const btnCancelar = document.getElementById('dialogo-cancelar');

    document.getElementById('dialogo-mensaje').textContent = mensaje;
    input.classList.toggle('hidden', tipo !== 'pedir');
    btnCancelar.classList.toggle('hidden', tipo === 'avisar');
    input.value = valorInicial;
    dialogo.classList.remove('hidden');
    (tipo === 'pedir' ? input : document.getElementById('dialogo-aceptar')).focus();
    if (tipo === 'pedir') input.select();

    function cerrar(resultado) {
      dialogo.classList.add('hidden');
      form.onsubmit = null; btnCancelar.onclick = null; dialogo.onkeydown = null;
      resolve(resultado);
    }
    form.onsubmit = (e) => {
      e.preventDefault();
      cerrar(tipo === 'pedir' ? input.value : true);
    };
    btnCancelar.onclick = () => cerrar(tipo === 'pedir' ? null : false);
    dialogo.onkeydown = (e) => { if (e.key === 'Escape') cerrar(tipo === 'pedir' ? null : false); };
  });
}
const pedirDato = (mensaje, valorInicial) => abrirDialogo('pedir', mensaje, valorInicial);
const avisar = (mensaje) => abrirDialogo('avisar', mensaje);
const confirmar = (mensaje) => abrirDialogo('confirmar', mensaje);

// Versiones de main.js que usaban prompt()/confirm(); se redefinen solo para esta página
async function ctxRenombrar() {
  if (!ctxTarget) return;
  const objetivo = ctxTarget;
  closeContextMenu();
  const nuevoNombre = await pedirDato("Nuevo nombre para el vértice:", objetivo);
  if (nuevoNombre && nuevoNombre.trim() !== '') {
    const nombre = nuevoNombre.trim();
    if (nombre !== objetivo && getVertex(nombre)) {
      await avisar(`Ya existe un vértice llamado "${nombre}".`);
      return;
    }
    const v = getVertex(objetivo);
    v.name = nombre;
    edges.forEach(e => {
      if (e.a === objetivo) e.a = nombre;
      if (e.b === objetivo) e.b = nombre;
    });
    render();
  }
}

async function crearNuevoGrafo() {
  if (await confirmar("¿Limpiar el lienzo actual?")) {
    vertices = [];
    edges = [];
    currentGraphId = null;
    limpiarAnalisisDijkstra();
    render();
  }
}

function onToggleWeighted() {
  isWeighted = document.getElementById('toggle-weighted').checked;
  renderGraph();
}

function logDijkstra(msg) {
  const banner = document.getElementById('log-banner');
  if (!banner) return;
  if (banner.querySelector('.italic')) banner.innerHTML = '';
  const p = document.createElement('p');
  p.textContent = `> ${msg}`;
  banner.prepend(p);
}

// Activar el modo para elegir Origen/Destino haciendo clic en un nodo
function activarSeleccion(tipo) {
  if (vertices.length === 0) {
    avisar('Primero agrega vértices al grafo.');
    return;
  }
  seleccionandoModo = tipo;
  const btn = document.getElementById(tipo === 'origen' ? 'btn-sel-origen' : 'btn-sel-destino');
  if (btn) btn.classList.add('animate-pulse', tipo === 'origen' ? 'bg-sky-500' : 'bg-rose-500', 'text-white');
  document.getElementById('dijkstra-status').innerText = `Haz clic en un nodo del grafo para elegir el ${tipo === 'origen' ? 'Origen' : 'Destino'}`;
}

function limpiarAnalisisDijkstra() {
  if (isAnimating) return;
  seleccionandoModo = null;
  document.getElementById('input-origen').value = '';
  document.getElementById('input-destino').value = '';
  document.getElementById('result-dijkstra').classList.add('hidden');
  document.getElementById('dijkstra-tabla').classList.add('hidden');
  document.getElementById('tabla-rutas').innerHTML = '<p class="text-xs text-slate-400 italic text-center">Calcula una ruta en el panel derecho para ver el análisis.</p>';
  document.getElementById('dijkstra-status').innerText = 'Selecciona un Origen y Destino';
  renderGraph();
}

// Ejemplos precargados
const EJEMPLOS_DIJKSTRA = {
  // 33 volcanes de Guatemala. Las distancias (km) son ilustrativas, no reales.
  // ubicaciones: [longitud, latitud] aproximadas, solo para que el grafo arranque con forma de mapa
  volcanes: {
    icon: 'mountain', unit: 'km',
    nodos: ['Tacaná', 'Tajumulco', 'Lacandón', 'Chicabal', 'Siete Orejas', 'Cerro Quemado', 'Santa María',
            'Santiaguito', 'Zunil', 'Santo Tomás', 'San Pedro', 'Tolimán', 'Atitlán', 'Acatenango', 'Fuego',
            'Agua', 'Pacaya', 'Cerro Redondo', 'Tecuamburro', 'Cruz Quemada', 'Jumaytepeque', 'Monte Rico',
            'Moyuta', 'Tobón', 'Culma', 'Chingo', 'Jumay', 'Alzatate', 'Ipala', 'Suchitán', 'Ixtepeque',
            'Las Víboras', 'Quetzaltepeque'],
    ubicaciones: {
      'Tacaná': [-92.11, 15.13], 'Tajumulco': [-91.90, 15.04], 'Lacandón': [-91.77, 14.81], 'Chicabal': [-91.66, 14.79],
      'Siete Orejas': [-91.62, 14.84], 'Cerro Quemado': [-91.50, 14.82], 'Santa María': [-91.55, 14.76],
      'Santiaguito': [-91.58, 14.72], 'Zunil': [-91.48, 14.72], 'Santo Tomás': [-91.42, 14.69],
      'San Pedro': [-91.27, 14.66], 'Tolimán': [-91.19, 14.62], 'Atitlán': [-91.19, 14.56],
      'Acatenango': [-90.88, 14.50], 'Fuego': [-90.88, 14.45], 'Agua': [-90.74, 14.47], 'Pacaya': [-90.60, 14.38],
      'Cerro Redondo': [-90.45, 14.33], 'Tecuamburro': [-90.41, 14.16], 'Cruz Quemada': [-90.30, 14.15],
      'Jumaytepeque': [-90.27, 14.33], 'Monte Rico': [-90.17, 14.05], 'Moyuta': [-89.98, 14.03],
      'Tobón': [-90.03, 14.25], 'Culma': [-89.80, 14.25], 'Chingo': [-89.73, 14.12], 'Jumay': [-89.99, 14.70],
      'Alzatate': [-89.92, 14.50], 'Ipala': [-89.64, 14.55], 'Suchitán': [-89.78, 14.40],
      'Ixtepeque': [-89.68, 14.42], 'Las Víboras': [-89.58, 14.33], 'Quetzaltepeque': [-89.43, 14.60]
    },
    aristas: [
      ['Tacaná', 'Tajumulco', 18], ['Tacaná', 'Lacandón', 40], ['Tajumulco', 'Lacandón', 30], ['Tajumulco', 'Siete Orejas', 35],
      ['Lacandón', 'Chicabal', 22], ['Chicabal', 'Siete Orejas', 8], ['Siete Orejas', 'Cerro Quemado', 12],
      ['Siete Orejas', 'Santa María', 15], ['Cerro Quemado', 'Santa María', 9], ['Santa María', 'Santiaguito', 4],
      ['Cerro Quemado', 'Zunil', 10], ['Santiaguito', 'Zunil', 14], ['Zunil', 'Santo Tomás', 6],
      ['Santiaguito', 'Santo Tomás', 16], ['Santo Tomás', 'San Pedro', 28], ['Santo Tomás', 'Atitlán', 38],
      ['San Pedro', 'Tolimán', 12], ['San Pedro', 'Atitlán', 15], ['Tolimán', 'Atitlán', 7],
      ['Tolimán', 'Acatenango', 32], ['Atitlán', 'Fuego', 40], ['Acatenango', 'Fuego', 3], ['Acatenango', 'Agua', 16],
      ['Fuego', 'Agua', 14], ['Agua', 'Pacaya', 25], ['Fuego', 'Pacaya', 35], ['Pacaya', 'Cerro Redondo', 18],
      ['Agua', 'Cerro Redondo', 30], ['Pacaya', 'Tecuamburro', 40], ['Cerro Redondo', 'Tecuamburro', 20],
      ['Cerro Redondo', 'Jumaytepeque', 15], ['Tecuamburro', 'Cruz Quemada', 12], ['Tecuamburro', 'Jumaytepeque', 22],
      ['Cruz Quemada', 'Jumaytepeque', 15], ['Cruz Quemada', 'Monte Rico', 25], ['Monte Rico', 'Moyuta', 20],
      ['Jumaytepeque', 'Tobón', 18], ['Tobón', 'Moyuta', 15], ['Tobón', 'Culma', 22], ['Moyuta', 'Chingo', 30],
      ['Culma', 'Chingo', 14], ['Jumaytepeque', 'Jumay', 30], ['Tobón', 'Jumay', 25], ['Jumay', 'Alzatate', 12],
      ['Alzatate', 'Ipala', 20], ['Alzatate', 'Suchitán', 18], ['Jumay', 'Quetzaltepeque', 28],
      ['Ipala', 'Quetzaltepeque', 18], ['Ipala', 'Suchitán', 15], ['Ipala', 'Ixtepeque', 22], ['Suchitán', 'Culma', 18],
      ['Suchitán', 'Chingo', 20], ['Quetzaltepeque', 'Ixtepeque', 14], ['Ixtepeque', 'Las Víboras', 10],
      ['Las Víboras', 'Chingo', 25]
    ]
  },
  vuelos: {
    icon: 'plane', unit: '$',
    nodos: ['GUA', 'MEX', 'MIA', 'SAL', 'BOG', 'MAD'],
    aristas: [['GUA', 'MEX', 250], ['GUA', 'SAL', 120], ['GUA', 'MIA', 380], ['MEX', 'MIA', 300],
              ['SAL', 'BOG', 350], ['MIA', 'MAD', 700], ['BOG', 'MAD', 650], ['MEX', 'MAD', 900]]
  },
  servidores: {
    icon: 'circle', unit: 'm',
    nodos: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'],
    aristas: [['S1', 'S2', 7], ['S1', 'S3', 9], ['S1', 'S6', 14], ['S2', 'S3', 10], ['S2', 'S4', 15],
              ['S3', 'S4', 11], ['S3', 'S6', 2], ['S4', 'S5', 6], ['S5', 'S6', 9]]
  },
  ciudades: {
    icon: 'building', unit: 'km',
    nodos: ['Guatemala', 'Antigua', 'Chimaltenango', 'Escuintla', 'Xela', 'Cobán'],
    aristas: [['Guatemala', 'Antigua', 45], ['Guatemala', 'Chimaltenango', 55], ['Antigua', 'Chimaltenango', 18],
              ['Guatemala', 'Escuintla', 60], ['Chimaltenango', 'Xela', 145], ['Escuintla', 'Xela', 160], ['Guatemala', 'Cobán', 210]]
  }
};

function cargarEjemploDijkstra(clave) {
  const ej = EJEMPLOS_DIJKSTRA[clave];
  if (!ej) return;
  vertices = ej.nodos.map(n => {
    // Si el ejemplo trae ubicaciones [lon, lat], se convierten a una posición inicial en el lienzo
    const ub = ej.ubicaciones ? ej.ubicaciones[n] : null;
    const x = ub ? Math.round((ub[0] + 90.8) * 600) : undefined;
    const y = ub ? Math.round((14.6 - ub[1]) * 800) : undefined;
    return { name: n, code: generateUniqueCode(), pinned: false, used: false, icon: ej.icon, x, y };
  });
  edges = ej.aristas.map(([a, b, w]) => ({ a, b, weight: w }));

  currentUnit = ej.unit;
  const unitSelect = document.getElementById('unit-select');
  if (unitSelect) unitSelect.value = ej.unit;
  isWeighted = true;
  const weighted = document.getElementById('toggle-weighted');
  if (weighted) weighted.checked = true;

  limpiarAnalisisDijkstra();
  render();
  logDijkstra(`Ejemplo cargado: ${clave}`);
}

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
        let peso = pesoArista(arista);
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

// 2b. TODAS LAS RUTAS POSIBLES (caminos simples, de menor a mayor costo)
// Se usa el algoritmo de Yen: va sacando la 1a, 2a, 3a... ruta más corta.
// Así, aunque haya miles de caminos, las que se muestran son siempre las más cortas.
const MAX_RUTAS = 200; // Límite para no congelar el navegador en grafos grandes

// Peso por defecto 1 si la arista no tiene peso (un 0 sí se respeta como 0)
const pesoArista = (arista) => {
  const p = parseFloat(arista.weight);
  return isNaN(p) ? 1 : p;
};

function pesoEntre(a, b) {
  const arista = edges.find(e => (e.a === a && e.b === b) || (!isDirected && e.a === b && e.b === a));
  return arista ? pesoArista(arista) : Infinity;
}

// Dijkstra simple que puede ignorar algunos nodos y aristas (lo necesita Yen)
function caminoMasCorto(origen, destino, nodosBloqueados, aristasBloqueadas) {
  let dist = {}, prev = {}, pendientes = new Set();
  vertices.forEach(v => {
    if (!nodosBloqueados.has(v.name)) { dist[v.name] = Infinity; pendientes.add(v.name); }
  });
  if (!pendientes.has(origen)) return null;
  dist[origen] = 0;

  while (pendientes.size > 0) {
    let actual = null;
    pendientes.forEach(n => { if (actual === null || dist[n] < dist[actual]) actual = n; });
    if (dist[actual] === Infinity) break;
    if (actual === destino) break;
    pendientes.delete(actual);

    edges.forEach(arista => {
      let vecino = null;
      if (arista.a === actual) vecino = arista.b;
      else if (!isDirected && arista.b === actual) vecino = arista.a;
      if (vecino === null || !pendientes.has(vecino) || aristasBloqueadas.has(`${actual}|${vecino}`)) return;
      const nueva = dist[actual] + pesoArista(arista);
      if (nueva < dist[vecino]) { dist[vecino] = nueva; prev[vecino] = actual; }
    });
  }

  if (dist[destino] === undefined || dist[destino] === Infinity) return null;
  let ruta = [destino];
  while (ruta[0] !== origen) ruta.unshift(prev[ruta[0]]);
  return { ruta: ruta, costo: dist[destino] };
}

function calcularTodasLasRutas(origen, destino) {
  const primera = caminoMasCorto(origen, destino, new Set(), new Set());
  if (!primera) return { rutas: [], limiteAlcanzado: false };

  let encontradas = [primera];
  let candidatas = [];
  const clave = (ruta) => ruta.join('|');
  const vistas = new Set([clave(primera.ruta)]);

  while (encontradas.length < MAX_RUTAS) {
    const anterior = encontradas[encontradas.length - 1].ruta;

    for (let i = 0; i < anterior.length - 1; i++) {
      const nodoDesvio = anterior[i];
      const raiz = anterior.slice(0, i + 1);

      // Bloquear las aristas que ya usaron las rutas encontradas con la misma raíz
      let aristasBloqueadas = new Set();
      encontradas.forEach(r => {
        if (r.ruta.length > i + 1 && clave(r.ruta.slice(0, i + 1)) === clave(raiz)) {
          aristasBloqueadas.add(`${r.ruta[i]}|${r.ruta[i + 1]}`);
          if (!isDirected) aristasBloqueadas.add(`${r.ruta[i + 1]}|${r.ruta[i]}`);
        }
      });
      // Bloquear los nodos de la raíz (menos el de desvío) para que el camino sea simple
      const nodosBloqueados = new Set(raiz.slice(0, -1));

      const desvio = caminoMasCorto(nodoDesvio, destino, nodosBloqueados, aristasBloqueadas);
      if (!desvio) continue;

      const ruta = raiz.slice(0, -1).concat(desvio.ruta);
      if (vistas.has(clave(ruta))) continue;
      let costoRaiz = 0;
      for (let j = 0; j < raiz.length - 1; j++) costoRaiz += pesoEntre(raiz[j], raiz[j + 1]);
      vistas.add(clave(ruta));
      candidatas.push({ ruta: ruta, costo: costoRaiz + desvio.costo });
    }

    if (candidatas.length === 0) break;
    candidatas.sort((x, y) => x.costo - y.costo || x.ruta.length - y.ruta.length);
    encontradas.push(candidatas.shift());
  }

  return { rutas: encontradas, limiteAlcanzado: encontradas.length >= MAX_RUTAS && candidatas.length > 0 };
}

function renderizarTablaRutas(origen, destino, rutaOptima) {
  const contenedor = document.getElementById('tabla-rutas');
  if (!contenedor) return;

  const { rutas, limiteAlcanzado } = calcularTodasLasRutas(origen, destino);

  if (rutas.length === 0) {
    contenedor.innerHTML = `<p class="text-xs text-rose-600 text-center">No existe ningún camino de <b>${origen}</b> a <b>${destino}</b>.</p>`;
    return;
  }

  const optimaTexto = rutaOptima ? rutaOptima.join('|') : '';
  let html = `<p class="text-[11px] text-slate-500 mb-2">Se encontraron <b>${rutas.length}</b> camino(s) de <b>${origen}</b> a <b>${destino}</b>, ordenados de menor a mayor costo.${limiteAlcanzado ? ` Hay más caminos; se muestran solo los ${MAX_RUTAS} más cortos.` : ''}</p>`;
  html += `<table class="w-full text-[11px] text-center border-collapse">
    <thead class="bg-umgNavy text-white font-bold">
      <tr>
        <th class="p-1 border border-slate-600">#</th>
        <th class="p-1 border border-slate-600">Ruta</th>
        <th class="p-1 border border-slate-600">Aristas</th>
        <th class="p-1 border border-slate-600">Costo Total</th>
      </tr>
    </thead><tbody class="text-slate-700 font-mono">`;

  rutas.forEach((r, i) => {
    const esOptima = r.ruta.join('|') === optimaTexto;
    const clase = esOptima ? 'bg-amber-100 font-bold text-umgNavy' : (i % 2 === 0 ? 'bg-slate-50' : 'bg-white');
    html += `<tr class="${clase}">
      <td class="p-1 border border-slate-200">${i + 1}</td>
      <td class="p-1 border border-slate-200 text-left">${r.ruta.join(' ➔ ')}${esOptima ? ' <span class="text-amber-600">★ Más corta</span>' : ''}</td>
      <td class="p-1 border border-slate-200">${r.ruta.length - 1}</td>
      <td class="p-1 border border-slate-200 text-emerald-700">${r.costo} ${currentUnit}</td>
    </tr>`;
  });

  html += '</tbody></table>';
  contenedor.innerHTML = html;
}

// 3. DIBUJAR LA RUTA EN EL GRAFO (DORADO)
function resaltarRutaDijkstra(rutaNombres) {
  if (!network) return;
  
  const edgeDataSet = network.body.data.edges;

  quitarResaltado();

  // Pintar nodos en Dorado
  rutaNombres.forEach(nombre => pintarNodoRuta(nombre, '#D4AF37'));

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

// Devuelve aristas y nodos a sus colores normales (sin redibujar el grafo)
function quitarResaltado() {
  if (!network) return;
  const edgeDataSet = network.body.data.edges;
  const nodeDataSet = network.body.data.nodes;
  edgeDataSet.forEach(e => edgeDataSet.update({ id: e.id, color: { color: '#94A3B8', highlight: '#0EA5E9' }, width: 2 }));
  nodeDataSet.forEach(n => {
    if (n.shape === 'icon') nodeDataSet.update({ id: n.id, icon: { ...n.icon, color: '#002B49' } });
    else nodeDataSet.update({ id: n.id, color: { background: '#002B49', border: (computeGrade(n.id) % 2 === 0) ? '#D4AF37' : '#DC2626' } });
  });
}

// 4. EJECUTAR Y MOSTRAR RESULTADOS
async function ejecutarRutaDijkstra() {
  const origen = document.getElementById('input-origen').value;
  const destino = document.getElementById('input-destino').value;

  if (!origen || !destino) {
    avisar("Selecciona un nodo de origen y destino con los botones celestes/rosados.");
    return;
  }

  // Dijkstra no funciona con pesos negativos (por si alguno quedó de antes)
  const negativa = edges.find(e => pesoArista(e) < 0);
  if (negativa) {
    avisar(`❌ La arista ${negativa.a} - ${negativa.b} tiene peso negativo (${negativa.weight}). Dijkstra solo admite pesos ≥ 0.`);
    return;
  }

  if (isAnimating) return;
  isAnimating = true;
  const btn = document.getElementById('btn-dijkstra');
  btn.disabled = true;
  btn.classList.add('opacity-60', 'cursor-wait');

  const result = calcularRutaDijkstra(origen, destino);
  renderizarTablaRutas(origen, destino, result && result.esAlcanzable ? result.ruta : null);

  if (result && result.esAlcanzable) {
    // 1. Mostrar la tabla de iteraciones y el resultado
    renderizarTablaDijkstra(result.iteraciones);

    const el = document.getElementById('result-dijkstra');
    el.classList.remove('hidden');
    el.className = `text-xs p-2 rounded border text-center font-semibold bg-emerald-50 border-emerald-200 text-emerald-700 mt-2`;
    el.innerHTML = `✅ <b>Ruta Encontrada</b><br><span class="text-[10px]">${result.ruta.join(' ➔ ')}<br><b>Costo Total: ${result.costoTotal} ${currentUnit}</b></span>`;
    logDijkstra(`Ruta ${origen} → ${destino}: ${result.costoTotal} ${currentUnit}`);

    // 2. Animación: el avatar elegido recorre la ruta más corta
    document.getElementById('dijkstra-status').innerText = `Recorriendo la ruta de ${origen} a ${destino}...`;
    document.getElementById('graph-container-wrap').scrollIntoView({ behavior: 'smooth', block: 'center' });
    quitarResaltado();
    try {
      await animarViajero(result.ruta, '#D4AF37');
    } catch (err) {
      console.error('Error en la animación:', err); // Si falla, igual se muestra la ruta
    }
    // 3. Dejar la ruta resaltada en dorado
    resaltarRutaDijkstra(result.ruta);
    document.getElementById('dijkstra-status').innerText = `Ruta de ${origen} a ${destino}`;
  } else {
    const el = document.getElementById('result-dijkstra');
    el.classList.remove('hidden');
    el.className = `text-xs p-2 rounded border text-center font-semibold bg-rose-50 border-rose-200 text-rose-700 mt-2`;
    el.innerHTML = `❌ <b>No hay ruta disponible</b><br><span class="text-[10px]">El destino es inalcanzable.</span>`;
    
    const tabla = document.getElementById('dijkstra-tabla');
    if (tabla) tabla.classList.add('hidden');
  }

  isAnimating = false;
  btn.disabled = false;
  btn.classList.remove('opacity-60', 'cursor-wait');
}
