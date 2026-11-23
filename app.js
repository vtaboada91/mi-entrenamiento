
const nombreRutina = document.getElementById("nombreRutina");
const crearRutina = document.getElementById("crearRutina");
const listaRutinas = document.getElementById("listaRutinas");

const detalleRutina = document.getElementById("detalleRutina");
const tituloRutina = document.getElementById("tituloRutina");
const listaEjercicios = document.getElementById("listaEjercicios");

let rutinas = [];
let rutinaSeleccionada = null;

// Cargar rutinas guardadas
try {
    const datos = JSON.parse(localStorage.getItem("misRutinas"));
    rutinas = Array.isArray(datos) ? datos : [];
} catch (error) {
    rutinas = [];
}

// Recuperar ejercicios de la versión anterior
if (!localStorage.getItem("misRutinas")) {
    try {
        const anteriores = JSON.parse(localStorage.getItem("ejercicios"));

        if (Array.isArray(anteriores) && anteriores.length > 0) {
            rutinas.push({
                id: "importada-" + Date.now(),
                nombre: "Mis ejercicios anteriores",
                ejercicios: anteriores
            });
        }
    } catch (error) {
        console.log("No hay ejercicios anteriores.");
    }
    guardarRutinas();
}

function guardarRutinas() {
    localStorage.setItem("misRutinas", JSON.stringify(rutinas));
}

function mostrarRutinas() {
    listaRutinas.innerHTML = "";

    if (rutinas.length === 0) {
        listaRutinas.textContent = "Todavía no has creado rutinas.";
        return;
    }

    rutinas.forEach(function(rutina) {
        const tarjeta = document.createElement("div");
        tarjeta.className = "rutina";

        const nombre = document.createElement("h3");
        nombre.textContent = rutina.nombre;

        const cantidad = document.createElement("p");
        cantidad.textContent =
            rutina.ejercicios.length + " ejercicios";

        const boton = document.createElement("button");
        boton.textContent = "Ver rutina";
        boton.addEventListener("click", function() {
            abrirRutina(rutina.id);
        });


// Botón para editar el nombre de la rutina
const botonEditar = document.createElement("button");
botonEditar.textContent = "✏️ Editar";
botonEditar.className = "boton-editar";

botonEditar.addEventListener("click", function() {
    const nuevoNombre = prompt(
        "Escribe el nuevo nombre de la rutina:",
        rutina.nombre
    );

    if (nuevoNombre === null) return;

    const nombreLimpio = nuevoNombre.trim();

    if (nombreLimpio === "" || nombreLimpio.length > 60) {
        alert("Escribe un nombre válido de máximo 60 caracteres.");
        return;
    }

    rutina.nombre = nombreLimpio;

    // Actualizar el título si la rutina está abierta
    if (
        rutinaSeleccionada &&
        rutinaSeleccionada.id === rutina.id
    ) {
        tituloRutina.textContent = nombreLimpio;
    }

    guardarRutinas();
    mostrarRutinas();
});

// Botón para eliminar la rutina
const botonEliminar = document.createElement("button");
botonEliminar.textContent = "🗑️ Eliminar";
botonEliminar.className = "boton-eliminar";

botonEliminar.addEventListener("click", function() {

    const confirmar = confirm(
        "¿Seguro que deseas eliminar la rutina '" +
        rutina.nombre +
        "' y todos sus ejercicios?"
    );

    if (!confirmar) return;

    rutinas = rutinas.filter(function(r) {
        return r.id !== rutina.id;
    });

    // Cerrar la rutina si estaba seleccionada
    if (
        rutinaSeleccionada &&
        rutinaSeleccionada.id === rutina.id
    ) {
        rutinaSeleccionada = null;
        detalleRutina.hidden = true;
    }

    guardarRutinas();
    mostrarRutinas();

    alert("✅ Rutina eliminada.");
});

tarjeta.append(nombre, cantidad, boton, botonEditar, botonEliminar);
listaRutinas.appendChild(tarjeta);

    });
}

crearRutina.addEventListener("click", function() {
    const nombre = nombreRutina.value.trim();

    if (nombre === "") {
        alert("Escribe el nombre de la rutina.");
        return;
    }

    const nuevaRutina = {
        id: "rutina-" + Date.now() + "-" +
            Math.random().toString(36).slice(2, 8),
        nombre: nombre,
        ejercicios: []
    };

    rutinas.push(nuevaRutina);
    guardarRutinas();
    mostrarRutinas();

    nombreRutina.value = "";
    abrirRutina(nuevaRutina.id);
});

function abrirRutina(id) {
    rutinaSeleccionada = rutinas.find(function(rutina) {
        return rutina.id === id;
    });

    if (!rutinaSeleccionada) return;

    tituloRutina.textContent = rutinaSeleccionada.nombre;
    detalleRutina.hidden = false;

    mostrarEjercicios();
    detalleRutina.scrollIntoView({ behavior: "smooth" });
}

document.getElementById("guardarEjercicio")
    .addEventListener("click", function() {

    if (!rutinaSeleccionada) return;

    const nombre = document.getElementById("ejercicio").value.trim();
    const seriesTexto = document.getElementById("series").value;
    const repTexto = document.getElementById("repeticiones").value;
    const pesoTexto = document.getElementById("peso").value;

    const series = Number(seriesTexto);
    const repeticiones = Number(repTexto);
    const peso = Number(pesoTexto);

    if (
        nombre === "" ||
        seriesTexto === "" ||
        repTexto === "" ||
        pesoTexto === "" ||
        !Number.isInteger(series) || series <= 0 ||
        !Number.isInteger(repeticiones) || repeticiones <= 0 ||
        !Number.isFinite(peso) || peso < 0
    ) {
        alert("Completa correctamente todos los campos.");
        return;
    }

    rutinaSeleccionada.ejercicios.push({
        nombre: nombre,
        series: series,
        repeticiones: repeticiones,
        peso: peso
    });

    guardarRutinas();
    mostrarEjercicios();
    mostrarRutinas();

    document.getElementById("ejercicio").value = "";
    document.getElementById("series").value = "";
    document.getElementById("repeticiones").value = "";
    document.getElementById("peso").value = "";
});

function mostrarEjercicios() {
    listaEjercicios.innerHTML = "";

    if (!rutinaSeleccionada) return;

    rutinaSeleccionada.ejercicios.forEach(function(ejercicio, indice) {
        const tarjeta = document.createElement("div");
        tarjeta.className = "rutina";

        const titulo = document.createElement("h3");
        titulo.textContent = ejercicio.nombre;

        const detalles = document.createElement("p");
        detalles.textContent =
            ejercicio.series + " series × " +
            ejercicio.repeticiones + " repeticiones — " +
            ejercicio.peso + " kg";

        const eliminar = document.createElement("button");
        eliminar.textContent = "Eliminar ejercicio";

        eliminar.addEventListener("click", function() {
            rutinaSeleccionada.ejercicios.splice(indice, 1);
            guardarRutinas();
            mostrarEjercicios();
            mostrarRutinas();
        });

        tarjeta.append(titulo, detalles, eliminar);
        listaEjercicios.appendChild(tarjeta);
    });

    if (rutinaSeleccionada.ejercicios.length === 0) {
        listaEjercicios.textContent = "Agrega tu primer ejercicio.";
    }
}

document.getElementById("cerrarRutina")
    .addEventListener("click", function() {
        detalleRutina.hidden = true;
        rutinaSeleccionada = null;
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

mostrarRutinas();

// PASO 9: SESIONES E HISTORIAL


// PASO 10: REGISTRO INDIVIDUAL DE SERIES

const botonIniciar = document.getElementById("iniciarEntrenamiento");
const botonFinalizar = document.getElementById("finalizarEntrenamiento");
const sesionActiva = document.getElementById("sesionActiva");
const tiempoInicio = document.getElementById("tiempoInicio");
const registroSeries = document.getElementById("registroSeries");
const historialContenedor = document.getElementById("historialEntrenamientos");

let entrenamientoActual = null;
let historial = [];

// Recuperar historial anterior
try {
    const datos = JSON.parse(localStorage.getItem("historialGym"));
    historial = Array.isArray(datos) ? datos : [];
} catch (error) {
    historial = [];
}

// Recuperar entrenamiento en curso
try {
    entrenamientoActual = JSON.parse(
        localStorage.getItem("entrenamientoActual")
    );
} catch (error) {
    entrenamientoActual = null;
}

function guardarSesionActual() {
    localStorage.setItem(
        "entrenamientoActual",
        JSON.stringify(entrenamientoActual)
    );
}

// Crear estructura de series individuales
function prepararSeries(ejercicios) {
    return ejercicios.map(function(ejercicio) {
        return {
            ...ejercicio,
            seriesRealizadas: Array.from(
                { length: ejercicio.series },
                function(_, indice) {
                    return {
                        numero: indice + 1,
                        peso: ejercicio.peso,
                        repeticiones: ejercicio.repeticiones,
                        completada: false
                    };
                }
            )
        };
    });
}

// Iniciar entrenamiento
botonIniciar.addEventListener("click", function() {
    if (!rutinaSeleccionada) return;

    if (entrenamientoActual) {
        alert("Ya tienes un entrenamiento en curso.");
        return;
    }

    if (rutinaSeleccionada.ejercicios.length === 0) {
        alert("Primero agrega ejercicios a tu rutina.");
        return;
    }

    entrenamientoActual = {
        id: "sesion-" + Date.now(),
        rutina: rutinaSeleccionada.nombre,
        inicio: new Date().toISOString(),
        ejercicios: prepararSeries(
            rutinaSeleccionada.ejercicios
        )
    };

    guardarSesionActual();
    actualizarSesion();
});

// Mostrar entrenamiento en curso
function actualizarSesion() {
    const activa = entrenamientoActual !== null;

    sesionActiva.hidden = !activa;
    botonIniciar.disabled = activa;

    if (!activa) {
        registroSeries.innerHTML = "";
        return;
    }

    tiempoInicio.textContent =
        "Inicio: " +
        new Date(entrenamientoActual.inicio)
            .toLocaleString("es-MX");

    mostrarRegistroSeries();
}

// Mostrar los ejercicios y sus series
function mostrarRegistroSeries() {
    registroSeries.innerHTML = "";

    entrenamientoActual.ejercicios.forEach(
        function(ejercicio) {

        const tarjeta = document.createElement("div");
        tarjeta.className = "rutina";

        const titulo = document.createElement("h3");
        titulo.textContent = ejercicio.nombre;
        tarjeta.appendChild(titulo);

        const objetivo = document.createElement("p");
        objetivo.textContent =
            "Objetivo: " + ejercicio.series +
            " series × " + ejercicio.repeticiones +
            " repeticiones — " + ejercicio.peso + " kg";

        tarjeta.appendChild(objetivo);

        // Buscar el último registro de este ejercicio
        const sesionAnterior = [...historial].reverse().find(
            function(sesion) {
                return Array.isArray(sesion.ejercicios) &&
                    sesion.ejercicios.some(function(e) {
                        return e.nombre.trim().toLowerCase() ===
                            ejercicio.nombre.trim().toLowerCase() &&
                            Array.isArray(e.seriesRealizadas) &&
                            e.seriesRealizadas.some(s => s.completada);
                    });
            }
        );

        if (sesionAnterior) {
            const ejercicioAnterior =
                sesionAnterior.ejercicios.find(function(e) {
                    return e.nombre.trim().toLowerCase() ===
                        ejercicio.nombre.trim().toLowerCase() &&
                        Array.isArray(e.seriesRealizadas) &&
                        e.seriesRealizadas.some(s => s.completada);
                });

            const anteriores = ejercicioAnterior.seriesRealizadas
                .filter(serie => serie.completada);

            const referencia = document.createElement("div");
            referencia.className = "referencia-anterior";

            const tituloAnterior = document.createElement("strong");
            tituloAnterior.textContent = "📊 Último entrenamiento";

            const detalleAnterior = document.createElement("p");
            detalleAnterior.textContent = anteriores
                .map(serie =>
                    serie.peso + " kg × " +
                    serie.repeticiones + " reps"
                )
                .join(" | ");

            referencia.append(tituloAnterior, detalleAnterior);
            tarjeta.appendChild(referencia);
        }

        ejercicio.seriesRealizadas.forEach(function(serie) {

            const fila = document.createElement("div");
            fila.className = "fila-serie";

            const numero = document.createElement("span");
            numero.textContent = "Serie " + serie.numero;

            const campoPeso = document.createElement("input");
            campoPeso.type = "number";
            campoPeso.min = "0";
            campoPeso.step = "0.5";
            campoPeso.value = serie.peso;
            campoPeso.setAttribute("aria-label", "Peso en kg");

            const campoReps = document.createElement("input");
            campoReps.type = "number";
            campoReps.min = "0";
            campoReps.step = "1";
            campoReps.value = serie.repeticiones;
            campoReps.setAttribute("aria-label", "Repeticiones");

            const completada = document.createElement("input");
            completada.type = "checkbox";
            completada.checked = serie.completada;
            completada.setAttribute(
                "aria-label",
                "Serie completada"
            );

            // Guardar cambios de peso
            campoPeso.addEventListener("change", function() {
                const valor = Number(campoPeso.value);

                if (
                    campoPeso.value === "" ||
                    !Number.isFinite(valor) ||
                    valor < 0
                ) {
                    campoPeso.value = serie.peso;
                    return;
                }

                serie.peso = valor;
                guardarSesionActual();
            });

            // Guardar cambios de repeticiones
            campoReps.addEventListener("change", function() {
                const valor = Number(campoReps.value);

                if (
                    campoReps.value === "" ||
                    !Number.isInteger(valor) ||
                    valor < 0
                ) {
                    campoReps.value = serie.repeticiones;
                    return;
                }

                serie.repeticiones = valor;
                guardarSesionActual();
            });

            // Marcar serie completada
            completada.addEventListener("change", function() {
                const peso = Number(campoPeso.value);
                const reps = Number(campoReps.value);

                if (
                    campoPeso.value === "" ||
                    !Number.isFinite(peso) ||
                    peso < 0 ||
                    campoReps.value === "" ||
                    !Number.isInteger(reps) ||
                    reps < 0
                ) {
                    alert("Revisa el peso y las repeticiones.");
                    completada.checked = serie.completada;
                    return;
                }

                serie.peso = peso;
                serie.repeticiones = reps;
                serie.completada = completada.checked;

                guardarSesionActual();
            });

            fila.appendChild(numero);
            fila.appendChild(campoPeso);
            fila.appendChild(campoReps);
            fila.appendChild(completada);

            tarjeta.appendChild(fila);
        });

        registroSeries.appendChild(tarjeta);
    });
}

// Finalizar entrenamiento
botonFinalizar.addEventListener("click", function() {
    if (!entrenamientoActual) return;

    const total = entrenamientoActual.ejercicios.reduce(
        function(acumulado, ejercicio) {
            return acumulado + ejercicio.seriesRealizadas.length;
        }, 0
    );

    const realizadas = entrenamientoActual.ejercicios.reduce(
        function(acumulado, ejercicio) {
            return acumulado +
                ejercicio.seriesRealizadas.filter(
                    serie => serie.completada
                ).length;
        }, 0
    );

    if (realizadas === 0) {
        alert("Marca al menos una serie como completada.");
        return;
    }

    const confirmar = confirm(
        "Completaste " + realizadas + " de " + total +
        " series. ¿Finalizar y guardar?"
    );

    if (!confirmar) return;

    const fin = new Date();
    const inicio = new Date(entrenamientoActual.inicio);

    const duracion = Math.round(
        (fin - inicio) / 60000
    );

    historial.push({
        ...entrenamientoActual,
        fin: fin.toISOString(),
        duracionMinutos: duracion
    });

    localStorage.setItem(
        "historialGym",
        JSON.stringify(historial)
    );

    entrenamientoActual = null;
    localStorage.removeItem("entrenamientoActual");

    actualizarSesion();
    mostrarHistorial();

    alert("✅ ¡Entrenamiento guardado!");
});

// Mostrar historial de entrenamientos
function mostrarHistorial() {
    historialContenedor.innerHTML = "";

    if (historial.length === 0) {
        historialContenedor.textContent =
            "Todavía no tienes entrenamientos completados.";
        return;
    }

    [...historial].reverse().forEach(function(sesion) {
        const tarjeta = document.createElement("div");
        tarjeta.className = "rutina";

        const titulo = document.createElement("h3");
        titulo.textContent = sesion.rutina;

        const fecha = document.createElement("p");
        fecha.textContent =
            "📅 " + new Date(sesion.inicio)
                .toLocaleString("es-MX");

        const duracion = document.createElement("p");
        duracion.textContent =
            "⏱ Duración: " +
            sesion.duracionMinutos + " minutos";

        tarjeta.append(titulo, fecha, duracion);

        sesion.ejercicios.forEach(function(ejercicio) {
            const detalle = document.createElement("p");

            if (Array.isArray(ejercicio.seriesRealizadas)) {
                const completadas = ejercicio.seriesRealizadas
                    .filter(serie => serie.completada);

                detalle.textContent =
                    ejercicio.nombre + ": " +
                    completadas.map(serie =>
                        serie.peso + " kg × " +
                        serie.repeticiones + " reps"
                    ).join(" | ");

                if (completadas.length === 0) {
                    detalle.textContent =
                        ejercicio.nombre + ": Sin series completadas";
                }
            } else {
                // Compatibilidad con sesiones anteriores
                detalle.textContent =
                    ejercicio.nombre + ": " +
                    ejercicio.series + " × " +
                    ejercicio.repeticiones + " — " +
                    ejercicio.peso + " kg (planificado)";
            }

            tarjeta.appendChild(detalle);
        });

        historialContenedor.appendChild(tarjeta);
    });
}

// Compatibilidad con sesiones iniciadas en el Paso 9
if (
    entrenamientoActual &&
    Array.isArray(entrenamientoActual.ejercicios)
) {
    entrenamientoActual.ejercicios =
        entrenamientoActual.ejercicios.map(function(ejercicio) {
            if (Array.isArray(ejercicio.seriesRealizadas)) {
                return ejercicio;
            }

            return prepararSeries([ejercicio])[0];
        });

    guardarSesionActual();
}

actualizarSesion();
mostrarHistorial();

// PASO 12: GRÁFICAS DE PROGRESO

const selectorProgreso = document.getElementById("seleccionarEjercicio");
const resumenProgreso = document.getElementById("resumenProgreso");
const mensajeProgreso = document.getElementById("mensajeProgreso");
const canvasProgreso = document.getElementById("graficaProgreso");

let graficaProgreso = null;

// Obtener ejercicios que tengan series registradas
function obtenerEjerciciosProgreso() {
    const nombres = new Map();

    historial.forEach(function(sesion) {
        if (!Array.isArray(sesion.ejercicios)) return;

        sesion.ejercicios.forEach(function(ejercicio) {
            if (!Array.isArray(ejercicio.seriesRealizadas)) return;

            const tieneSeries = ejercicio.seriesRealizadas.some(
                serie => serie.completada
            );

            if (!tieneSeries) return;

            const nombre = ejercicio.nombre.trim();
            const clave = nombre.toLowerCase();

            if (!nombres.has(clave)) {
                nombres.set(clave, nombre);
            }
        });
    });

    return [...nombres.values()].sort();
}

// Llenar selector
function cargarSelectorProgreso() {
    const seleccionAnterior = selectorProgreso.value;

    selectorProgreso.innerHTML = "";

    const inicial = document.createElement("option");
    inicial.value = "";
    inicial.textContent = "Seleccionar ejercicio";
    selectorProgreso.appendChild(inicial);

    obtenerEjerciciosProgreso().forEach(function(nombre) {
        const opcion = document.createElement("option");
        opcion.value = nombre;
        opcion.textContent = nombre;
        selectorProgreso.appendChild(opcion);
    });

    if ([...selectorProgreso.options].some(
        opcion => opcion.value === seleccionAnterior
    )) {
        selectorProgreso.value = seleccionAnterior;
    }
}

// Obtener el peso máximo por sesión
function obtenerDatosProgreso(nombreEjercicio) {
    const resultados = [];

    historial.forEach(function(sesion) {
        if (!Array.isArray(sesion.ejercicios)) return;

        const pesos = [];

        sesion.ejercicios.forEach(function(ejercicio) {
            if (
                ejercicio.nombre.trim().toLowerCase() !==
                nombreEjercicio.trim().toLowerCase()
            ) return;

            if (!Array.isArray(ejercicio.seriesRealizadas)) return;

            ejercicio.seriesRealizadas.forEach(function(serie) {
                const peso = Number(serie.peso);

                if (
                    serie.completada &&
                    Number.isFinite(peso) &&
                    peso >= 0
                ) {
                    pesos.push(peso);
                }
            });
        });

        if (pesos.length === 0) return;

        resultados.push({
            fecha: sesion.inicio,
            pesoMaximo: Math.max(...pesos)
        });
    });

    resultados.sort((a, b) =>
        new Date(a.fecha) - new Date(b.fecha)
    );

    return resultados;
}

// Dibujar gráfica
function mostrarGraficaProgreso() {
    const nombre = selectorProgreso.value;

    if (graficaProgreso) {
        graficaProgreso.destroy();
        graficaProgreso = null;
    }

    resumenProgreso.innerHTML = "";
    mensajeProgreso.textContent = "";

    if (!nombre) {
        mensajeProgreso.textContent =
            "Selecciona un ejercicio para ver tu progreso.";
        return;
    }

    const datos = obtenerDatosProgreso(nombre);

    if (datos.length === 0) {
        mensajeProgreso.textContent =
            "Todavía no hay sesiones registradas.";
        return;
    }

    const mejorPeso = Math.max(
        ...datos.map(dato => dato.pesoMaximo)
    );

    const resumen = document.createElement("p");
    resumen.textContent =
        "🏆 Mejor peso: " + mejorPeso +
        " kg | Sesiones registradas: " + datos.length;

    resumenProgreso.appendChild(resumen);

    if (typeof Chart === "undefined") {
        mensajeProgreso.textContent =
            "No se pudo cargar la biblioteca de gráficas. Comprueba tu conexión a internet.";
        return;
    }

    const etiquetas = datos.map(function(dato) {
        return new Date(dato.fecha).toLocaleDateString("es-MX", {
            day: "2-digit",
            month: "short"
        });
    });

    graficaProgreso = new Chart(canvasProgreso, {
        type: "line",
        data: {
            labels: etiquetas,
            datasets: [{
                label: "Peso máximo (kg)",
                data: datos.map(dato => dato.pesoMaximo),
                borderColor: "#60a5fa",
                backgroundColor: "rgba(96, 165, 250, 0.15)",
                borderWidth: 3,
                tension: 0.3,
                pointRadius: 5,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: "#ffffff"
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: "#cbd5e1" },
                    grid: { color: "#334155" }
                },
                y: {
                    beginAtZero: true,
                    ticks: { color: "#cbd5e1" },
                    grid: { color: "#334155" }
                }
            }
        }
    });
}

selectorProgreso.addEventListener(
    "change",
    mostrarGraficaProgreso
);

// Actualizar gráficas cuando se guarde una sesión
const mostrarHistorialOriginal = mostrarHistorial;

mostrarHistorial = function() {
    mostrarHistorialOriginal();
    cargarSelectorProgreso();
    mostrarGraficaProgreso();
};

cargarSelectorProgreso();
mostrarGraficaProgreso();

// PASO 13: EXPORTAR E IMPORTAR RESPALDOS

const botonExportar = document.getElementById("exportarDatos");
const botonImportar = document.getElementById("importarDatos");
const archivoRespaldo = document.getElementById("archivoRespaldo");
const mensajeRespaldo = document.getElementById("mensajeRespaldo");

botonExportar.addEventListener("click", function() {
    const respaldo = {
        version: 1,
        aplicacion: "Mi Entrenamiento",
        fechaExportacion: new Date().toISOString(),
        rutinas: rutinas,
        historial: historial,
        entrenamientoActual: entrenamientoActual
    };

    const contenido = JSON.stringify(respaldo, null, 2);

    const archivo = new Blob([contenido], {
        type: "application/json"
    });

    const url = URL.createObjectURL(archivo);
    const enlace = document.createElement("a");

    enlace.href = url;
    enlace.download = "mi-entrenamiento-respaldo.json";

    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();

    setTimeout(function() {
        URL.revokeObjectURL(url);
    }, 1000);

    mensajeRespaldo.textContent =
        "✅ Respaldo generado correctamente.";
});

botonImportar.addEventListener("click", async function() {
    const archivo = archivoRespaldo.files[0];

    if (!archivo) {
        mensajeRespaldo.textContent =
            "⚠️ Primero selecciona un archivo.";
        return;
    }

    try {
        const contenido = await archivo.text();
        const datos = JSON.parse(contenido);

        // Verificar formato básico del respaldo
        if (
            datos.aplicacion !== "Mi Entrenamiento" ||
            datos.version !== 1 ||
            !Array.isArray(datos.rutinas) ||
            !Array.isArray(datos.historial) ||
            !(
                datos.entrenamientoActual === null ||
                (
                    datos.entrenamientoActual &&
                    typeof datos.entrenamientoActual === "object" &&
                    !Array.isArray(datos.entrenamientoActual)
                )
            )
        ) {
            throw new Error("Formato de respaldo no válido.");
        }

        // Validar estructuras principales
        const rutinasValidas = datos.rutinas.every(r =>
            r && typeof r.id === "string" &&
            typeof r.nombre === "string" &&
            Array.isArray(r.ejercicios)
        );

        const historialValido = datos.historial.every(s =>
            s && typeof s.rutina === "string" &&
            typeof s.inicio === "string" &&
            Array.isArray(s.ejercicios)
        );

        if (!rutinasValidas || !historialValido) {
            throw new Error("El respaldo contiene datos incompletos.");
        }

        const confirmar = confirm(
            "⚠️ Importar reemplazará todas tus rutinas e historial actuales. " +
            "¿Deseas continuar?"
        );

        if (!confirmar) return;

        // Guardar los datos importados
        localStorage.setItem(
            "misRutinas",
            JSON.stringify(datos.rutinas)
        );

        localStorage.setItem(
            "historialGym",
            JSON.stringify(datos.historial)
        );

        if (datos.entrenamientoActual) {
            localStorage.setItem(
                "entrenamientoActual",
                JSON.stringify(datos.entrenamientoActual)
            );
        } else {
            localStorage.removeItem("entrenamientoActual");
        }

        mensajeRespaldo.textContent =
            "✅ Respaldo importado. Actualizando...";

        // Recargar para actualizar todas las variables
        location.reload();

    } catch (error) {
        mensajeRespaldo.textContent =
            "❌ No se pudo importar: " + error.message;
    }
});
