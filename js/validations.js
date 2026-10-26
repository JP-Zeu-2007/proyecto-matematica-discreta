// ==========================================
// js/validations.js
// Validaciones Globales de la Aplicación
// ==========================================

// 1. Validar si el nombre del vértice ya existe
function validarNombreVertice(nombre) {
  if (!nombre || nombre.trim() === '') {
    alert('El nombre del vértice no puede estar vacío.');
    return false;
  }
  
  const existe = vertices.find(v => v.name.toLowerCase() === nombre.toLowerCase());
  if (existe) {
    // Preguntar al usuario si desea sobrescribir
    const confirmar = confirm(`Ya existe un vértice llamado "${existe.name}" (Código: ${existe.code}).\n\n¿Deseas sobrescribirlo? (Se eliminarán sus aristas actuales)`);
    if (confirmar) {
      // Eliminar el vértice viejo y sus aristas
      edges = edges.filter(e => e.a !== existe.name && e.b !== existe.name);
      vertices = vertices.filter(v => v.name !== existe.name);
      return true; // Permitir agregar el nuevo
    } else {
      return false; // Cancelar la operación
    }
  }
  
  return true; // No existe, se puede agregar
}

// 2. Validar si se intenta crear un lazo (A - A)
function validarLazo(nodoA, nodoB) {
  if (nodoA === nodoB) {
    alert('❌ Error: No se permiten lazos (un vértice no puede conectarse a sí mismo).');
    return false;
  }
  return true;
}

// 3. Validar si la arista ya existe (A - B o B - A)
function validarAristaDuplicada(nodoA, nodoB) {
  const existe = edges.some(e => 
    (e.a === nodoA && e.b === nodoB) || 
    (!isDirected && e.a === nodoB && e.b === nodoA)
  );
  
  if (existe) {
    alert(`❌ Error: La arista ${nodoA} - ${nodoB} ya existe en el grafo.`);
    return false;
  }
  return true;
}

// 4. Validar entrada vacía en general
function validarEntradaVacia(valor) {
  if (!valor || valor.trim() === '') {
    alert('❌ Error: El campo no puede estar vacío.');
    return false;
  }
  return true;
}
