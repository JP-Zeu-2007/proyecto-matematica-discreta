// ==========================================
// MÓDULO DE DIJKSTRA - INTEGRANTE 3 (ADDISON)
// TEMA: VOLCANES DE GUATEMALA (33 VÉRTICES)
// ==========================================

// 1. DATOS DE LA RED (33 VOLCANES)
const DIJKSTRA_NODES = [
  { id: 1, label: "Volcán de Fuego" }, { id: 2, label: "Volcán de Agua" }, { id: 3, label: "Volcán de Pacaya" },
  { id: 4, label: "Volcán Acatenango" }, { id: 5, label: "Volcán de Atitlán" }, { id: 6, label: "Volcán San Pedro" },
  { id: 7, label: "Volcán Tolimán" }, { id: 8, label: "Volcán Tajumulco" }, { id: 9, label: "Volcán Tacaná" },
  { id: 10, label: "Volcán Santa María" }, { id: 11, label: "Volcán Santiaguito" }, { id: 12, label: "Volcán Cerro Quemado" },
  { id: 13, label: "Volcán Chicabal" }, { id: 14, label: "Volcán Zunil" }, { id: 15, label: "Volcán Santo Tomás" },
  { id: 16, label: "Volcán de Almolonga" }, { id: 17, label: "Volcán Cerro de Oro" }, { id: 18, label: "Volcán de Ipala" },
  { id: 19, label: "Volcán Suchitán" }, { id: 20, label: "Volcán Tahual" }, { id: 21, label: "Volcán de Flores" },
  { id: 22, label: "Volcán de Moyuta" }, { id: 23, label: "Volcán Culma" }, { id: 24, label: "Volcán Quetzaltepeque" },
  { id: 25, label: "Volcán de Cruz Quemada" }, { id: 26, label: "Volcán de la Isla" }, { id: 27, label: "Volcán del Mico" },
  { id: 28, label: "Volcán de la Reunión" }, { id: 29, label: "Volcán de la Caldera" }, { id: 30, label: "Volcán de la Laguna" },
  { id: 31, label: "Volcán de los Amates" }, { id: 32, label: "Volcán Chingo" }, { id: 33, label: "Volcán de la Cruz" }
];

// 2. ARISTAS (Distancias ficticias en km entre volcanes)
const DIJKSTRA_EDGES = [
  { from: 1, to: 2, weight: 18 }, { from: 1, to: 3, weight: 25 }, { from: 1, to: 4, weight: 12 },
  { from: 2, to: 5, weight: 35 }, { from: 2, to: 6, weight: 42 }, { from: 3, to: 7, weight: 30 },
  { from: 4, to: 8, weight: 95 }, { from: 4, to: 9, weight: 110 }, { from: 5, to: 10, weight: 28 },
  { from: 5, to: 11, weight: 22 }, { from: 6, to: 12, weight: 15 }, { from: 7, to: 13, weight: 40 },
  { from: 8, to: 14, weight: 20 }, { from: 9, to: 15, weight: 18 }, { from: 10, to: 16, weight: 33 },
  { from: 11, to: 17, weight: 45 }, { from: 12, to: 18, weight: 55 }, { from: 13, to: 19, weight: 60 },
  { from: 14, to: 20, weight: 25 }, { from: 15, to: 21, weight: 30 }, { from: 16, to: 22, weight: 48 },
  { from: 17, to: 23, weight: 70 }, { from: 18, to: 24, weight: 38 }, { from: 19, to: 25, weight: 50 },
  { from: 20, to: 26, weight: 28 }, { from: 21, to: 27, weight: 65 }, { from: 22, to: 28, weight: 52 },
  { from: 23, to: 29, weight: 80 }, { from: 24, to: 30, weight: 35 }, { from: 25, to: 31, weight: 90 },
  // Conexiones para los nuevos volcanes (32 y 33)
  { from: 26, to: 32, weight: 40 }, { from: 27, to: 33, weight: 55 },
  
  // Conexiones extra para crear rutas alternativas
  { from: 1, to: 8, weight: 120 }, { from: 3, to: 10, weight: 75 }, { from: 6, to: 13, weight: 50 },
  { from: 11, to: 15, weight: 60 }, { from: 14, to: 19, weight: 85 }, { from: 18, to: 23, weight: 95 },
  { from: 21, to: 26, weight: 70 }, { from: 27, to: 31, weight: 110 }, { from: 28, to: 32, weight: 65 },
  { from: 29, to: 33, weight: 45 }, { from: 30, to: 32, weight: 35 }
];

// 3. LÓGICA DEL ALGORITMO (DIJKSTRA)
function calcularRutaDijkstra(origen, destino) {
  let distancias = {};
  let anteriores = {};
  let noVisitados = new Set();

  // Inicializar
  DIJKSTRA_NODES.forEach(nodo => {
    distancias[nodo.id] = Infinity;
    anteriores[nodo.id] = null;
    noVisitados.add(nodo.id);
  });
  distancias[origen] = 0;

  while (noVisitados.size > 0) {
    // Buscar el nodo con menor distancia acumulada
    let nodoActual = null;
    noVisitados.forEach(id => {
      if (nodoActual === null || distancias[id] < distancias[nodoActual]) {
        nodoActual = id;
      }
    });

    // Si llegamos al destino o no hay camino
    if (distancias[nodoActual] === Infinity || nodoActual === destino) break;
    noVisitados.delete(nodoActual);

    // Revisar vecinos
    DIJKSTRA_EDGES.forEach(arista => {
      let vecino = null;
      if (arista.from === nodoActual) vecino = arista.to;
      if (arista.to === nodoActual) vecino = arista.from;

      if (vecino !== null && noVisitados.has(vecino)) {
        let nuevaDistancia = distancias[nodoActual] + arista.weight;
        if (nuevaDistancia < distancias[vecino]) {
          distancias[vecino] = nuevaDistancia;
          anteriores[vecino] = nodoActual;
        }
      }
    });
  }

  // Reconstruir la ruta
  let ruta = [];
  let actual = destino;
  while (actual !== null) {
    ruta.unshift(actual);
    actual = anteriores[actual];
  }

  return {
    ruta: ruta,
    costoTotal: distancias[destino],
    esAlcanzable: distancias[destino] !== Infinity
  };
}

// 4. VALIDACIÓN (BLOQUEO DE PESOS NEGATIVOS)
function validarPesoNegativo(peso) {
  if (peso < 0) {
    alert("⚠️ ERROR TEÓRICO: El algoritmo de Dijkstra NO permite pesos negativos. Esto se debe a que el algoritmo es 'voraz' y asume que sumar un paso siempre aumenta la distancia total. Con pesos negativos, el algoritmo podría caer en un ciclo infinito.");
    return false;
  }
  return true;
}

// ==========================================
// 5. BLOQUE DE PRUEBA (EJECUCIÓN LOCAL)
// ==========================================
console.log("=== INICIANDO PRUEBA DE DIJKSTRA (33 VOLCANES) ===");

// Probaremos la ruta desde Volcán de Fuego (id: 1) hasta Volcán de la Cruz (id: 33)
const resultado = calcularRutaDijkstra(1, 33);

if (resultado.esAlcanzable) {
    console.log("✅ Ruta encontrada:");
    console.log("   Nodos:", resultado.ruta.join(" → "));
    console.log("   Costo Total:", resultado.costoTotal, "km");
} else {
    console.log("❌ No se encontró una ruta.");
}

// Prueba extra: Origen igual a Destino
const resultadoMismo = calcularRutaDijkstra(5, 5);
console.log("\n=== PRUEBA ORIGEN = DESTINO ===");
console.log("   Ruta:", resultadoMismo.ruta, "| Costo:", resultadoMismo.costoTotal, "km");
