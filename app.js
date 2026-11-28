
const nombreRutina = document.getElementById("nombreRutina");
const crearRutina = document.getElementById("crearRutina");
const formularioRutina = document.getElementById("formularioRutina");
const selectorRutinaBase = document.getElementById("rutinaBase");
const ejerciciosRutinaBase = document.getElementById("ejerciciosRutinaBase");
const opcionesEjerciciosRutina = document.getElementById("opcionesEjerciciosRutina");
const listaRutinas = document.getElementById("listaRutinas");

const detalleRutina = document.getElementById("detalleRutina");
const tituloRutina = document.getElementById("tituloRutina");
const listaEjercicios = document.getElementById("listaEjercicios");

let rutinas = [];
let rutinaSeleccionada = null;

const claveRespaldoAnterior = "respaldoAntesDeSesionV17";
const clavesDatos = ["misRutinas", "historialGym", "entrenamientoActual", "ejercicios", "unidadPesoGym"];

// Conservar los datos originales antes de que esta versión lea o actualice una sesión anterior.
try {
    if (!localStorage.getItem(claveRespaldoAnterior)) {
        const datos = Object.fromEntries(clavesDatos.map(clave => [clave, localStorage.getItem(clave)]));
        if (clavesDatos.slice(0, 4).some(clave => datos[clave] !== null)) {
            const ejercicios = JSON.parse(datos.ejercicios);
            const rutinasAnteriores = JSON.parse(datos.misRutinas) ??
                (ejercicios?.length ? [{ id: "importada", nombre: "Mis ejercicios anteriores", ejercicios }] : []);
            localStorage.setItem(claveRespaldoAnterior, JSON.stringify({
                version: 1,
                aplicacion: "Mi Entrenamiento",
                fechaExportacion: new Date().toISOString(),
                unidadPeso: datos.unidadPesoGym || "kg",
                rutinas: rutinasAnteriores,
                historial: JSON.parse(datos.historialGym) ?? [],
                entrenamientoActual: JSON.parse(datos.entrenamientoActual)
            }));
        } else {
            localStorage.setItem(claveRespaldoAnterior, "null");
        }
    }
} catch (error) {
    console.warn("No se pudo guardar el respaldo previo a la actualización.", error);
}

// Vista concentrada: al abrir una rutina se oculta el resto de la aplicación.
const formularioEjercicio = document.getElementById("formularioEjercicio");
const alternarFormulario = document.getElementById("alternarFormulario");
function cambiarFormulario(mostrar) {
    formularioEjercicio.hidden = !mostrar;
    alternarFormulario.setAttribute("aria-expanded", String(mostrar));
    alternarFormulario.textContent = mostrar ? "✕ Cerrar formulario" : "＋ Agregar ejercicio";
}
alternarFormulario.addEventListener("click", function() {
    cambiarFormulario(formularioEjercicio.hidden);
});
function ajustarVistaRutina() {
    document.querySelector("main").classList.toggle("modo-rutina", Boolean(rutinaSeleccionada));
}


// Los valores internos se conservan en kg para mantener compatibilidad con datos anteriores.
// Cada ejercicio y serie conserva su unidad de visualización por separado.
const FACTOR_LIBRAS = 2.2046226218;
function unidadValida(unidad) { return unidad === "lb" ? "lb" : "kg"; }
function aMostrar(kg, unidad = "kg") {
    return Number((Number(kg) * (unidadValida(unidad) === "lb" ? FACTOR_LIBRAS : 1)).toFixed(2));
}
function aKg(valor, unidad = "kg") { return unidadValida(unidad) === "lb" ? valor / FACTOR_LIBRAS : valor; }
function pesoTexto(kg, unidad = "kg") { return aMostrar(kg, unidad) + " " + unidadValida(unidad); }
const selectorUnidadEjercicio = document.getElementById("unidadPesoEjercicio");

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

function guardarRutinas(datos = rutinas) {
    localStorage.setItem("misRutinas", JSON.stringify(datos));
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
    if (entrenamientoActual && (entrenamientoActual.rutinaId === rutina.id ||
        (!entrenamientoActual.rutinaId && entrenamientoActual.rutina === rutina.nombre))) {
        alert("Finaliza el entrenamiento en curso antes de eliminar esta rutina.");
        return;
    }

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
        ajustarVistaRutina();
        actualizarSesion();
    }

    guardarRutinas();
    mostrarRutinas();

    alert("✅ Rutina eliminada.");
});

tarjeta.append(nombre, cantidad, boton, botonEditar, botonEliminar);
listaRutinas.appendChild(tarjeta);

    });
}

crearRutina.addEventListener("click", () => {
    const mostrar = formularioRutina.hidden;
    formularioRutina.hidden = !mostrar;
    crearRutina.setAttribute("aria-expanded", String(mostrar));
    crearRutina.textContent = mostrar ? "Cancelar creación" : "+ Crear rutina";

    formularioRutina.reset();
    selectorRutinaBase.replaceChildren(new Option("Desde cero", ""));
    if (mostrar) {
        rutinas.forEach(rutina => selectorRutinaBase.add(new Option(rutina.nombre, rutina.id)));
    }
    ejerciciosRutinaBase.hidden = true;
    opcionesEjerciciosRutina.replaceChildren();
    if (mostrar) selectorRutinaBase.focus();
});

let ejerciciosParaCopiar = [];
selectorRutinaBase.addEventListener("change", () => {
    const base = rutinas.find(rutina => String(rutina.id) === selectorRutinaBase.value);
    opcionesEjerciciosRutina.replaceChildren();
    ejerciciosParaCopiar = [];
    ejerciciosRutinaBase.hidden = !base;
    if (!base) return;

    ejerciciosParaCopiar = [...base.ejercicios];
    const nombres = new Set(base.ejercicios.map(ejercicio => ejercicio.nombre.trim().toLowerCase()));
    for (const sesion of historialReciente()) {
        if (!sesionEsDeRutina(sesion, base)) continue;
        for (const ejercicio of sesion.ejercicios ?? []) {
            const nombre = ejercicio.nombre.trim().toLowerCase();
            if (estadoGuardado(ejercicio) !== "realizado" || nombres.has(nombre)) continue;
            ejerciciosParaCopiar.push(ejercicio);
            nombres.add(nombre);
        }
    }

    ejerciciosParaCopiar.forEach((ejercicio, indice) => {
        const etiqueta = document.createElement("label");
        const casilla = document.createElement("input");
        casilla.type = "checkbox";
        casilla.value = indice;
        casilla.checked = indice < base.ejercicios.length;
        const origen = casilla.checked ? "" : " · Del historial";
        etiqueta.append(casilla, ejercicio.nombre + origen);
        opcionesEjerciciosRutina.appendChild(etiqueta);
    });
    if (!ejerciciosParaCopiar.length) {
        opcionesEjerciciosRutina.textContent = "Esta rutina todavía no tiene ejercicios.";
    }
});

formularioRutina.addEventListener("submit", function(evento) {
    evento.preventDefault();
    const nombre = nombreRutina.value.trim();

    if (nombre === "") {
        alert("Escribe el nombre de la rutina.");
        nombreRutina.focus();
        return;
    }

    const ejercicios = Array.from(opcionesEjerciciosRutina.querySelectorAll("input:checked"), casilla => {
        const { nombre, series, repeticiones, peso, unidadPeso } = ejerciciosParaCopiar[Number(casilla.value)];
        return { nombre, series, repeticiones, peso, unidadPeso };
    });
    const nuevaRutina = {
        id: "rutina-" + Date.now() + "-" +
            Math.random().toString(36).slice(2, 8),
        nombre: nombre,
        ejercicios
    };

    const nuevasRutinas = [...rutinas, nuevaRutina];
    try {
        guardarRutinas(nuevasRutinas);
    } catch {
        alert("No se pudo guardar la nueva rutina. Inténtalo de nuevo.");
        return;
    }
    rutinas = nuevasRutinas;
    mostrarRutinas();

    crearRutina.click();
    abrirRutina(nuevaRutina.id);
});

function abrirRutina(id) {
    rutinaSeleccionada = rutinas.find(function(rutina) {
        return rutina.id === id;
    });

    if (!rutinaSeleccionada) return;

    tituloRutina.textContent = rutinaSeleccionada.nombre;
    detalleRutina.hidden = false;
    ajustarVistaRutina();
    cambiarFormulario(false);

    mostrarEjercicios();
    actualizarSesion();
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
    const unidad = unidadValida(selectorUnidadEjercicio.value);
    const peso = aKg(Number(pesoTexto), unidad);

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

    const ejercicio = {
        nombre: nombre,
        series: series,
        repeticiones: repeticiones,
        peso: peso,
        unidadPeso: unidad
    };

    if (sesionDeRutinaSeleccionada()) {
        entrenamientoActual.ejercicios.push(prepararSeries([{ ...ejercicio, temporal: true }])[0]);
        guardarSesionActual();
        mostrarRegistroSeries();
    } else {
        rutinaSeleccionada.ejercicios.push(ejercicio);
        guardarRutinas();
        mostrarEjercicios();
        mostrarRutinas();
    }

    document.getElementById("ejercicio").value = "";
    document.getElementById("series").value = "";
    document.getElementById("repeticiones").value = "";
    document.getElementById("peso").value = "";
    cambiarFormulario(false);
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
            pesoTexto(ejercicio.peso, ejercicio.unidadPeso);

        const eliminar = document.createElement("button");
        eliminar.textContent = "Eliminar ejercicio";

        eliminar.addEventListener("click", function() {
            if (sesionDeRutinaSeleccionada()) {
                alert("Durante una sesión puedes añadir ejercicios. Para quitar uno del plan, termina primero la sesión.");
                return;
            }
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
        ajustarVistaRutina();
        actualizarSesion();
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

mostrarRutinas();

// PASO 9: SESIONES E HISTORIAL


// PASO 10: REGISTRO INDIVIDUAL DE SERIES

const botonIniciar = document.getElementById("iniciarEntrenamiento");
const botonFinalizar = document.getElementById("finalizarEntrenamiento");
const botonRepetir = document.getElementById("repetirEntrenamiento");
const resumenSesion = document.getElementById("resumenSesion");
const botonGuardarEjercicio = document.getElementById("guardarEjercicio");
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

function sesionDeRutinaSeleccionada() {
    return Boolean(entrenamientoActual && rutinaSeleccionada && (
        entrenamientoActual.rutinaId === rutinaSeleccionada.id ||
        (!entrenamientoActual.rutinaId && entrenamientoActual.rutina === rutinaSeleccionada.nombre)
    ));
}

function estadoGuardado(ejercicio) {
    if (ejercicio.estado) return ejercicio.estado;
    return ejercicio.seriesRealizadas?.some(serie => serie.completada) ? "realizado" : "no-realizado";
}

function historialReciente() {
    return [...historial].reverse().sort((a, b) => new Date(b.inicio) - new Date(a.inicio));
}

function registrosAnteriores(ejercicio) {
    const nombre = ejercicio.nombre.trim().toLowerCase();
    return historialReciente().flatMap(sesion => {
        const registro = sesion.ejercicios?.find(item => item.nombre.trim().toLowerCase() === nombre);
        return registro ? [registro] : [];
    });
}

function seriesAnteriores(registros) {
    const ultimo = registros.find(registro => estadoGuardado(registro) === "realizado" &&
        registro.seriesRealizadas?.some(serie => serie.completada));
    return ultimo?.seriesRealizadas ?? [];
}

function sugerirAumento(ejercicio, registros) {
    if (registros.length < 2) return false;

    // Comparar dos intentos consecutivos del mismo ejercicio con el objetivo planificado.
    const [ultimo, anterior] = registros;
    return [ultimo, anterior].every(registro =>
        estadoGuardado(registro) === "realizado" &&
        registro.seriesRealizadas?.length >= ejercicio.series &&
        registro.seriesRealizadas.slice(0, ejercicio.series).every((serie, indice) => {
            const pesoAnterior = anterior.seriesRealizadas?.[indice]?.peso;
            return serie.completada && serie.repeticiones >= Math.max(ejercicio.repeticiones, registro.repeticiones) &&
                serie.peso > 0 && serie.peso + 0.01 >= ejercicio.peso &&
                Math.abs(serie.peso - pesoAnterior) < 0.01;
        })
    );
}

function prepararSeries(ejercicios, usarHistorial = true) {
    return ejercicios.map(function(ejercicio) {
        const anteriores = usarHistorial ? seriesAnteriores(registrosAnteriores(ejercicio)) : [];
        const { plegado, ...plan } = ejercicio;
        return {
            ...plan,
            estado: "pendiente",
            seriesRealizadas: Array.from({ length: ejercicio.series }, function(_, indice) {
                const previa = anteriores[indice];
                return {
                    numero: indice + 1,
                    peso: previa?.completada ? previa.peso : ejercicio.peso,
                    unidadPeso: unidadValida(previa?.completada ? previa.unidadPeso || ejercicio.unidadPeso : ejercicio.unidadPeso),
                    repeticiones: previa?.completada ? previa.repeticiones : ejercicio.repeticiones,
                    completada: false
                };
            })
        };
    });
}

function sesionEsDeRutina(sesion, rutina) {
    return sesion.rutinaId === rutina.id ||
        (!sesion.rutinaId && sesion.rutina === rutina.nombre);
}

function ultimaSesionRutina() {
    if (!rutinaSeleccionada) return undefined;
    return historialReciente().find(sesion =>
        sesion.ejercicios?.length && sesionEsDeRutina(sesion, rutinaSeleccionada));
}

function iniciarSesion(ejercicios) {
    if (!rutinaSeleccionada || entrenamientoActual) return;
    if (!ejercicios.length) {
        alert("Primero agrega ejercicios a tu rutina.");
        return;
    }

    entrenamientoActual = {
        id: "sesion-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8),
        rutinaId: rutinaSeleccionada.id,
        rutina: rutinaSeleccionada.nombre,
        inicio: new Date().toISOString(),
        ejercicios: prepararSeries(ejercicios)
    };

    guardarSesionActual();
    actualizarSesion();
}

botonIniciar.addEventListener("click", () => {
    if (rutinaSeleccionada) iniciarSesion(rutinaSeleccionada.ejercicios);
});
botonRepetir.addEventListener("click", () => {
    const anterior = ultimaSesionRutina();
    if (anterior) iniciarSesion(anterior.ejercicios);
});

function actualizarSesion() {
    const activa = entrenamientoActual !== null;
    const mostrandoSesion = sesionDeRutinaSeleccionada();
    sesionActiva.hidden = !mostrandoSesion;
    document.getElementById("seccionEjerciciosPlan").hidden = mostrandoSesion;
    botonIniciar.hidden = mostrandoSesion;
    botonIniciar.disabled = activa;
    botonIniciar.textContent = activa ? "▶ Ya hay un entrenamiento en curso" : "▶ Iniciar entrenamiento";
    botonRepetir.hidden = activa || !ultimaSesionRutina();
    botonGuardarEjercicio.textContent = mostrandoSesion ? "＋ Agregar solo a esta sesión" : "＋ Agregar ejercicio a la rutina";
    document.querySelectorAll(".catalogo-tarjeta button").forEach(boton => {
        boton.textContent = mostrandoSesion ? "Usar en esta sesión" : "Usar en mi rutina";
    });

    if (!mostrandoSesion) {
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

    const realizados = entrenamientoActual.ejercicios.filter(e => e.estado === "realizado").length;
    const omitidos = entrenamientoActual.ejercicios.filter(e => e.estado === "no-realizado").length;
    const pendientes = entrenamientoActual.ejercicios.length - realizados - omitidos;
    resumenSesion.textContent = `${realizados} realizados · ${omitidos} no realizados · ${pendientes} pendientes`;

    entrenamientoActual.ejercicios.forEach(function(ejercicio, indice) {
        const tarjeta = document.createElement("div");
        tarjeta.className = "rutina";

        const estado = ejercicio.estado || "pendiente";
        const cerrado = estado !== "pendiente";
        const plegado = cerrado && ejercicio.plegado !== false;
        const encabezado = document.createElement("button");
        encabezado.type = "button";
        encabezado.className = "encabezado-ejercicio";
        encabezado.dataset.estado = estado;
        encabezado.disabled = !cerrado;
        encabezado.setAttribute("aria-expanded", String(!plegado));

        function actualizarEncabezado() {
            const completas = ejercicio.seriesRealizadas.filter(serie => serie.completada).length;
            const etiqueta = estado === "realizado" ? "✓ Realizado" :
                estado === "no-realizado" ? "✗ No realizado" : "Pendiente";
            const indicador = cerrado ? (plegado ? "▸ " : "▾ ") : "";
            encabezado.textContent = `${indicador}${ejercicio.nombre} · ${etiqueta} (${completas}/${ejercicio.seriesRealizadas.length})`;
        }

        actualizarEncabezado();
        const contenido = document.createElement("div");
        contenido.hidden = plegado;
        encabezado.addEventListener("click", function() {
            ejercicio.plegado = !plegado;
            guardarSesionActual();
            mostrarRegistroSeries();
            registroSeries.querySelectorAll(".encabezado-ejercicio")[indice].focus();
        });
        tarjeta.appendChild(encabezado);

        const objetivo = document.createElement("p");
        objetivo.textContent =
            "Objetivo: " + ejercicio.series +
            " series × " + ejercicio.repeticiones +
            " repeticiones — " + pesoTexto(ejercicio.peso, ejercicio.unidadPeso);
        contenido.appendChild(objetivo);

        const registros = registrosAnteriores(ejercicio);
        const anteriores = seriesAnteriores(registros).filter(serie => serie.completada);
        if (anteriores.length) {
            const referencia = document.createElement("div");
            referencia.className = "referencia-anterior";
            const titulo = document.createElement("strong");
            titulo.textContent = "📊 Último registro de este ejercicio";
            const detalle = document.createElement("p");
            detalle.textContent = anteriores.map(serie =>
                pesoTexto(serie.peso, serie.unidadPeso) + " × " + serie.repeticiones + " reps"
            ).join(" | ");
            referencia.append(titulo, detalle);

            if (sugerirAumento(ejercicio, registros)) {
                const sugerencia = document.createElement("p");
                sugerencia.className = "sugerencia-carga";
                sugerencia.textContent = "Cumpliste el objetivo dos veces seguidas. Considera subir al siguiente peso disponible si puedes mantener la técnica.";
                referencia.appendChild(sugerencia);
            }
            contenido.appendChild(referencia);
        }

        ejercicio.seriesRealizadas.forEach(function(serie) {

            const fila = document.createElement("div");
            fila.className = "fila-serie";

            const numero = document.createElement("label");
            numero.className = "numero-serie";
            numero.textContent = "Serie " + serie.numero;

            const campoPeso = document.createElement("input");
            campoPeso.type = "number";
            campoPeso.min = "0";
            campoPeso.step = "any";
            campoPeso.inputMode = "decimal";
            campoPeso.disabled = cerrado;
            const unidadSerie = unidadValida(serie.unidadPeso || ejercicio.unidadPeso);
            campoPeso.value = aMostrar(serie.peso, unidadSerie);
            campoPeso.setAttribute("aria-label", "Peso de la serie " + serie.numero);

            const selectorSerie = document.createElement("select");
            selectorSerie.className = "selector-unidad-serie";
            selectorSerie.disabled = cerrado;
            selectorSerie.setAttribute("aria-label", "Unidad de peso de la serie " + serie.numero);
            [["kg", "kg"], ["lb", "lb"]].forEach(function(opcion) {
                const elemento = document.createElement("option");
                elemento.value = opcion[0];
                elemento.textContent = opcion[1];
                selectorSerie.appendChild(elemento);
            });
            selectorSerie.value = unidadSerie;
            // Al cambiar de unidad se convierte el número visible sin alterar el peso real.
            selectorSerie.addEventListener("change", function() {
                const unidadAnterior = unidadValida(serie.unidadPeso || ejercicio.unidadPeso);
                const dato = Number(campoPeso.value);
                if (campoPeso.value !== "" && Number.isFinite(dato) && dato >= 0) {
                    serie.peso = aKg(dato, unidadAnterior);
                }
                serie.unidadPeso = selectorSerie.value;
                campoPeso.value = aMostrar(serie.peso, serie.unidadPeso);
                guardarSesionActual();
            });

            const campoReps = document.createElement("input");
            campoReps.type = "number";
            campoReps.min = "0";
            campoReps.step = "1";
            campoReps.inputMode = "numeric";
            campoReps.disabled = cerrado;
            campoReps.value = serie.repeticiones;
            campoReps.setAttribute("aria-label", "Repeticiones");

            const completada = document.createElement("input");
            completada.type = "checkbox";
            completada.checked = serie.completada;
            completada.disabled = cerrado;
            completada.id = "serie-" + indice + "-" + serie.numero;
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
                    campoPeso.value = aMostrar(serie.peso, selectorSerie.value);
                    return;
                }

                serie.peso = aKg(valor, selectorSerie.value);
                serie.unidadPeso = selectorSerie.value;
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

                serie.peso = aKg(peso, selectorSerie.value);
                serie.unidadPeso = selectorSerie.value;
                serie.repeticiones = reps;
                serie.completada = completada.checked;

                guardarSesionActual();
                actualizarEncabezado();
            });

            numero.htmlFor = completada.id;
            fila.appendChild(numero);
            fila.appendChild(campoPeso);
            fila.appendChild(selectorSerie);
            fila.appendChild(campoReps);
            fila.appendChild(completada);

            contenido.appendChild(fila);
        });

        const acciones = document.createElement("div");
        acciones.className = "acciones-ejercicio";
        function agregarAccion(texto, accion) {
            const boton = document.createElement("button");
            boton.type = "button";
            boton.textContent = texto;
            boton.addEventListener("click", accion);
            acciones.appendChild(boton);
        }

        function cambiarEstado(siguiente) {
            ejercicio.estado = siguiente;
            ejercicio.plegado = siguiente !== "pendiente";
            guardarSesionActual();
            mostrarRegistroSeries();
        }

        if (cerrado) {
            agregarAccion("Deshacer y editar", () => cambiarEstado("pendiente"));
        } else {
            agregarAccion("✓ Finalizar ejercicio", () => {
                if (!ejercicio.seriesRealizadas.some(serie => serie.completada)) {
                    alert("Marca al menos una serie como completada.");
                    return;
                }
                cambiarEstado("realizado");
            });
            agregarAccion("✗ No realizado", () => {
                if (ejercicio.seriesRealizadas.some(serie => serie.completada) &&
                    !confirm("Este ejercicio ya tiene series marcadas. ¿Guardarlo como no realizado?")) return;
                cambiarEstado("no-realizado");
            });
        }

        if (ejercicio.temporal) {
            agregarAccion("Quitar de esta sesión", () => {
                if (ejercicio.seriesRealizadas.some(serie => serie.completada) &&
                    !confirm("¿Quitar este ejercicio y sus series de la sesión?")) return;
                entrenamientoActual.ejercicios = entrenamientoActual.ejercicios.filter(item => item !== ejercicio);
                guardarSesionActual();
                mostrarRegistroSeries();
            });
        }
        contenido.appendChild(acciones);
        tarjeta.appendChild(contenido);
        registroSeries.appendChild(tarjeta);
    });
}

// Finalizar entrenamiento
botonFinalizar.addEventListener("click", function() {
    if (!entrenamientoActual) return;

    const ejercicios = entrenamientoActual.ejercicios.map(({ plegado, ...ejercicio }) => ({
        ...ejercicio,
        estado: ejercicio.estado === "pendiente" || !ejercicio.estado ?
            (ejercicio.seriesRealizadas.some(serie => serie.completada) ? "realizado" : "no-realizado") :
            ejercicio.estado
    }));
    const realizados = ejercicios.filter(e => e.estado === "realizado").length;
    const omitidos = ejercicios.length - realizados;
    if (!ejercicios.length) {
        alert("Agrega al menos un ejercicio antes de guardar.");
        return;
    }

    if (!confirm(`Realizados: ${realizados}. No realizados: ${omitidos}. ¿Finalizar y guardar el entrenamiento?`)) return;

    const fin = new Date();
    const inicio = new Date(entrenamientoActual.inicio);
    const sesion = {
        id: entrenamientoActual.id,
        rutinaId: entrenamientoActual.rutinaId ?? rutinaSeleccionada?.id,
        rutina: entrenamientoActual.rutina,
        inicio: entrenamientoActual.inicio,
        ejercicios,
        fin: fin.toISOString(),
        duracionMinutos: Math.max(0, Math.round((fin - inicio) / 60000))
    };
    const nuevoHistorial = historial.some(item => item.id && item.id === sesion.id) ? historial : [...historial, sesion];

    try {
        localStorage.setItem("historialGym", JSON.stringify(nuevoHistorial));
    } catch {
        alert("No se pudo guardar el entrenamiento. La sesión sigue abierta.");
        return;
    }
    historial = nuevoHistorial;
    localStorage.removeItem("entrenamientoActual");
    entrenamientoActual = null;

    actualizarSesion();
    mostrarHistorial();
    cargarSelectorProgreso();
    mostrarGraficaProgreso();

    alert(`Entrenamiento guardado. Realizados: ${realizados}. No realizados: ${omitidos}.`);
});

// Mostrar historial de entrenamientos: cada sesión es plegable por separado.
function mostrarHistorial() {
    historialContenedor.innerHTML = "";

    if (historial.length === 0) {
        historialContenedor.textContent = "Todavía no tienes entrenamientos completados.";
        return;
    }

    let diaAnterior = null;
    historialReciente().forEach(function(sesion) {
        const inicio = new Date(sesion.inicio);
        const dia = inicio.toLocaleDateString("es-MX", {
            weekday: "long", year: "numeric", month: "long", day: "numeric"
        });
        if (dia !== diaAnterior) {
            const fechaHistorial = document.createElement("h3");
            fechaHistorial.className = "fecha-historial";
            fechaHistorial.textContent = dia;
            historialContenedor.appendChild(fechaHistorial);
            diaAnterior = dia;
        }
        const tarjeta = document.createElement("div");
        tarjeta.className = "rutina tarjeta-historial";

        const desplegable = document.createElement("details");
        desplegable.className = "sesion-historial-plegable";
        const encabezado = document.createElement("summary");
        const titulo = document.createElement("strong");
        titulo.textContent = sesion.rutina || "Entrenamiento";
        const fecha = document.createElement("span");
        const total = sesion.ejercicios?.length ?? 0;
        const realizados = sesion.ejercicios?.filter(e => estadoGuardado(e) === "realizado").length ?? 0;
        fecha.textContent = inicio.toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit" }) +
            ` · ${realizados} realizados · ${total - realizados} no realizados`;
        const indicador = document.createElement("span");
        indicador.className = "indicador-sesion";
        indicador.setAttribute("aria-hidden", "true");
        indicador.textContent = "⌄";
        encabezado.append(titulo, fecha, indicador);
        desplegable.appendChild(encabezado);

        const contenido = document.createElement("div");
        contenido.className = "contenido-sesion-historial";
        const duracion = document.createElement("p");
        duracion.textContent = "⏱ Duración: " + sesion.duracionMinutos + " minutos";
        contenido.appendChild(duracion);

        (Array.isArray(sesion.ejercicios) ? sesion.ejercicios : []).forEach(function(ejercicio) {
            const detalle = document.createElement("p");
            if (Array.isArray(ejercicio.seriesRealizadas)) {
                const completadas = ejercicio.seriesRealizadas.filter(serie => serie.completada);
                if (estadoGuardado(ejercicio) === "no-realizado") {
                    detalle.textContent = "✗ " + ejercicio.nombre + " · No realizado";
                } else {
                    detalle.textContent = "✓ " + ejercicio.nombre + " · " + completadas.map(serie =>
                        pesoTexto(serie.peso, serie.unidadPeso || ejercicio.unidadPeso) + " × " +
                        serie.repeticiones + " reps").join(" | ");
                }
            } else {
                detalle.textContent = ejercicio.nombre + ": " + ejercicio.series +
                    " × " + ejercicio.repeticiones + " — " +
                    pesoTexto(ejercicio.peso) + " (planificado)";
            }
            contenido.appendChild(detalle);
        });

        const borrar = document.createElement("button");
        borrar.type = "button";
        borrar.className = "borrar-sesion";
        borrar.textContent = "🗑️ Eliminar entrenamiento";
        borrar.addEventListener("click", () => {
            if (!confirm("¿Eliminar este entrenamiento del historial?")) return;
            const restantes = historial.filter(item => item !== sesion);
            localStorage.setItem("historialGym", JSON.stringify(restantes));
            historial = restantes;
            mostrarHistorial();
            cargarSelectorProgreso();
            mostrarGraficaProgreso();
        });
        contenido.appendChild(borrar);
        desplegable.appendChild(contenido);
        tarjeta.appendChild(desplegable);
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

            return prepararSeries([ejercicio], false)[0];
        });

    // La sesión anterior se conserva en disco hasta que se registre un cambio.
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
            if (estadoGuardado(ejercicio) === "no-realizado") return;
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

            if (estadoGuardado(ejercicio) === "no-realizado") return;
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
        "🏆 Mejor peso: " + pesoTexto(mejorPeso, "kg") +
        " | Sesiones registradas: " + datos.length;

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
                data: datos.map(dato => aMostrar(dato.pesoMaximo, "kg")),
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
        unidadPeso: "kg", // unidad interna; cada serie almacena su unidad elegida
        aplicacion: "Mi Entrenamiento",
        fechaExportacion: new Date().toISOString(),
        rutinas: rutinas,
        historial: historial,
        entrenamientoActual: entrenamientoActual
    };

    descargarRespaldo(JSON.stringify(respaldo, null, 2), "mi-entrenamiento-respaldo.json");
    mensajeRespaldo.textContent = "✅ Respaldo generado correctamente.";
});

const botonRespaldoAnterior = document.getElementById("exportarRespaldoAnterior");
const respaldoAnterior = localStorage.getItem(claveRespaldoAnterior);
botonRespaldoAnterior.hidden = !respaldoAnterior || respaldoAnterior === "null";
botonRespaldoAnterior.addEventListener("click", () => {
    descargarRespaldo(respaldoAnterior, "mi-entrenamiento-antes-de-actualizar.json");
    mensajeRespaldo.textContent = "✅ Respaldo previo descargado.";
});

function descargarRespaldo(contenido, nombre) {
    const archivo = new Blob([contenido], {
        type: "application/json"
    });

    const url = URL.createObjectURL(archivo);
    const enlace = document.createElement("a");

    enlace.href = url;
    enlace.download = nombre;

    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();

    setTimeout(function() {
        URL.revokeObjectURL(url);
    }, 1000);
}

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
        if (datos.unidadPeso === "kg" || datos.unidadPeso === "lb") {
            localStorage.setItem("unidadPesoGym", datos.unidadPeso);
        }
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

/* PASO 14: ELIMINAR HISTORIAL Y REINICIAR APP */

(function configurarBorrado() {
  const respaldo = document.getElementById("seccionRespaldo");

  const botonReiniciar = document.createElement("button");
  botonReiniciar.type = "button";
  botonReiniciar.textContent = "🗑️ Restablecer toda la aplicación";
  botonReiniciar.style.background = "#a82323";
  botonReiniciar.style.color = "white";
  botonReiniciar.style.marginTop = "20px";

  respaldo.appendChild(botonReiniciar);

  botonReiniciar.addEventListener("click", () => {
    if (!confirm("¿Eliminar TODAS las rutinas y entrenamientos de este dispositivo?")) return;

    const respuesta = prompt(
      'Escribe BORRAR para confirmar el restablecimiento:'
    );

    if (respuesta !== "BORRAR") return;

    [...clavesDatos, claveRespaldoAnterior].forEach(clave => localStorage.removeItem(clave));

    location.reload();
  });
})();

// Al abrir Mi progreso, recalcular el tamaño de la gráfica en su contenedor visible.
const seccionProgresoPlegable = document.getElementById("seccionProgreso");
if (seccionProgresoPlegable) {
    seccionProgresoPlegable.addEventListener("toggle", function() {
        if (this.open && graficaProgreso && typeof graficaProgreso.resize === "function") {
            graficaProgreso.resize();
        }
    });
}


// v9: Catálogo local de ejercicios. No modifica la estructura de rutinas existente.
const CATALOGO_EJERCICIOS = [{"nombre":"Press inclinado con mancuernas","grupo":"Pecho","subgrupo":"Superior","equipo":"Mancuernas"},{"nombre":"Press inclinado con barra","grupo":"Pecho","subgrupo":"Superior","equipo":"Barra y pesos libres"},{"nombre":"Press inclinado en máquina","grupo":"Pecho","subgrupo":"Superior","equipo":"Máquinas"},{"nombre":"Aperturas inclinadas","grupo":"Pecho","subgrupo":"Superior","equipo":"Mancuernas"},{"nombre":"Press de banca plano","grupo":"Pecho","subgrupo":"Medio","equipo":"Barra y pesos libres"},{"nombre":"Press plano con mancuernas","grupo":"Pecho","subgrupo":"Medio","equipo":"Mancuernas"},{"nombre":"Press de pecho sentado","grupo":"Pecho","subgrupo":"Medio","equipo":"Máquinas"},{"nombre":"Aperturas en peck deck","grupo":"Pecho","subgrupo":"Medio","equipo":"Máquinas"},{"nombre":"Cruce de poleas a altura media","grupo":"Pecho","subgrupo":"Medio","equipo":"Poleas"},{"nombre":"Press declinado","grupo":"Pecho","subgrupo":"Inferior","equipo":"Barra y pesos libres"},{"nombre":"Fondos para pecho","grupo":"Pecho","subgrupo":"Inferior","equipo":"Peso corporal"},{"nombre":"Cruce de poleas de arriba hacia abajo","grupo":"Pecho","subgrupo":"Inferior","equipo":"Poleas"},{"nombre":"Jalón al pecho","grupo":"Espalda","subgrupo":"Dorsales","equipo":"Poleas"},{"nombre":"Dominadas","grupo":"Espalda","subgrupo":"Dorsales","equipo":"Peso corporal"},{"nombre":"Remo unilateral con mancuerna","grupo":"Espalda","subgrupo":"Dorsales","equipo":"Mancuernas"},{"nombre":"Remo en máquina","grupo":"Espalda","subgrupo":"Dorsales","equipo":"Máquinas"},{"nombre":"Pullover en polea","grupo":"Espalda","subgrupo":"Dorsales","equipo":"Poleas"},{"nombre":"Remo con barra","grupo":"Espalda","subgrupo":"Romboides y espalda media","equipo":"Barra y pesos libres"},{"nombre":"Remo sentado en polea","grupo":"Espalda","subgrupo":"Romboides y espalda media","equipo":"Poleas"},{"nombre":"Remo pecho apoyado","grupo":"Espalda","subgrupo":"Romboides y espalda media","equipo":"Máquinas"},{"nombre":"Hiperextensiones lumbares","grupo":"Espalda","subgrupo":"Espalda baja","equipo":"Peso corporal"},{"nombre":"Peso muerto convencional","grupo":"Espalda","subgrupo":"Espalda baja","equipo":"Barra y pesos libres"},{"nombre":"Press militar con barra","grupo":"Hombros","subgrupo":"Deltoide anterior","equipo":"Barra y pesos libres"},{"nombre":"Press de hombros con mancuernas","grupo":"Hombros","subgrupo":"Deltoide anterior","equipo":"Mancuernas"},{"nombre":"Press de hombros en máquina","grupo":"Hombros","subgrupo":"Deltoide anterior","equipo":"Máquinas"},{"nombre":"Elevaciones laterales","grupo":"Hombros","subgrupo":"Deltoide lateral","equipo":"Mancuernas"},{"nombre":"Elevación lateral en polea","grupo":"Hombros","subgrupo":"Deltoide lateral","equipo":"Poleas"},{"nombre":"Elevación lateral en máquina","grupo":"Hombros","subgrupo":"Deltoide lateral","equipo":"Máquinas"},{"nombre":"Pájaros con mancuernas","grupo":"Hombros","subgrupo":"Deltoide posterior","equipo":"Mancuernas"},{"nombre":"Face pull","grupo":"Hombros","subgrupo":"Deltoide posterior","equipo":"Poleas"},{"nombre":"Peck deck inverso","grupo":"Hombros","subgrupo":"Deltoide posterior","equipo":"Máquinas"},{"nombre":"Encogimientos con mancuernas","grupo":"Hombros","subgrupo":"Trapecio","equipo":"Mancuernas"},{"nombre":"Encogimientos con barra","grupo":"Hombros","subgrupo":"Trapecio","equipo":"Barra y pesos libres"},{"nombre":"Encogimientos en máquina","grupo":"Hombros","subgrupo":"Trapecio","equipo":"Máquinas"},{"nombre":"Curl con barra","grupo":"Bíceps","subgrupo":"Bíceps","equipo":"Barra y pesos libres"},{"nombre":"Curl alternado con mancuernas","grupo":"Bíceps","subgrupo":"Bíceps","equipo":"Mancuernas"},{"nombre":"Curl en polea","grupo":"Bíceps","subgrupo":"Bíceps","equipo":"Poleas"},{"nombre":"Curl predicador en máquina","grupo":"Bíceps","subgrupo":"Bíceps","equipo":"Máquinas"},{"nombre":"Curl martillo","grupo":"Bíceps","subgrupo":"Braquial","equipo":"Mancuernas"},{"nombre":"Curl martillo con cuerda","grupo":"Bíceps","subgrupo":"Braquial","equipo":"Poleas"},{"nombre":"Extensión por encima de la cabeza con mancuerna","grupo":"Tríceps","subgrupo":"Cabeza larga","equipo":"Mancuernas"},{"nombre":"Extensión por encima de la cabeza en polea","grupo":"Tríceps","subgrupo":"Cabeza larga","equipo":"Poleas"},{"nombre":"Press francés con barra","grupo":"Tríceps","subgrupo":"Cabeza larga","equipo":"Barra y pesos libres"},{"nombre":"Jalón de tríceps con cuerda","grupo":"Tríceps","subgrupo":"Cabeza lateral y medial","equipo":"Poleas"},{"nombre":"Extensión de tríceps con barra en polea","grupo":"Tríceps","subgrupo":"Cabeza lateral y medial","equipo":"Poleas"},{"nombre":"Fondos en banco","grupo":"Tríceps","subgrupo":"Cabeza lateral y medial","equipo":"Peso corporal"},{"nombre":"Máquina de tríceps","grupo":"Tríceps","subgrupo":"Cabeza lateral y medial","equipo":"Máquinas"},{"nombre":"Curl de muñeca con barra","grupo":"Antebrazos","subgrupo":"Flexores","equipo":"Barra y pesos libres"},{"nombre":"Curl de muñeca con mancuerna","grupo":"Antebrazos","subgrupo":"Flexores","equipo":"Mancuernas"},{"nombre":"Curl inverso de muñeca","grupo":"Antebrazos","subgrupo":"Extensores","equipo":"Mancuernas"},{"nombre":"Extensión de muñeca con barra","grupo":"Antebrazos","subgrupo":"Extensores","equipo":"Barra y pesos libres"},{"nombre":"Curl inverso con barra","grupo":"Antebrazos","subgrupo":"Braquiorradial y agarre","equipo":"Barra y pesos libres"},{"nombre":"Caminata del granjero","grupo":"Antebrazos","subgrupo":"Braquiorradial y agarre","equipo":"Mancuernas"},{"nombre":"Suspensión en barra","grupo":"Antebrazos","subgrupo":"Braquiorradial y agarre","equipo":"Peso corporal"},{"nombre":"Sentadilla con barra","grupo":"Pierna","subgrupo":"Cuádriceps","equipo":"Barra y pesos libres"},{"nombre":"Sentadilla goblet","grupo":"Pierna","subgrupo":"Cuádriceps","equipo":"Mancuernas"},{"nombre":"Prensa de piernas","grupo":"Pierna","subgrupo":"Cuádriceps","equipo":"Máquinas"},{"nombre":"Extensión de cuádriceps","grupo":"Pierna","subgrupo":"Cuádriceps","equipo":"Máquinas"},{"nombre":"Sentadilla hack","grupo":"Pierna","subgrupo":"Cuádriceps","equipo":"Máquinas"},{"nombre":"Curl femoral sentado","grupo":"Pierna","subgrupo":"Femorales","equipo":"Máquinas"},{"nombre":"Curl femoral acostado","grupo":"Pierna","subgrupo":"Femorales","equipo":"Máquinas"},{"nombre":"Peso muerto rumano con barra","grupo":"Pierna","subgrupo":"Femorales","equipo":"Barra y pesos libres"},{"nombre":"Peso muerto rumano con mancuernas","grupo":"Pierna","subgrupo":"Femorales","equipo":"Mancuernas"},{"nombre":"Sentadilla búlgara","grupo":"Pierna","subgrupo":"Glúteos","equipo":"Mancuernas"},{"nombre":"Zancadas caminando","grupo":"Pierna","subgrupo":"Glúteos","equipo":"Mancuernas"},{"nombre":"Máquina de aductores","grupo":"Pierna","subgrupo":"Aductores","equipo":"Máquinas"},{"nombre":"Aducción de cadera en polea","grupo":"Pierna","subgrupo":"Aductores","equipo":"Poleas"},{"nombre":"Máquina de abductores","grupo":"Pierna","subgrupo":"Abductores","equipo":"Máquinas"},{"nombre":"Abducción de cadera en polea","grupo":"Pierna","subgrupo":"Abductores","equipo":"Poleas"},{"nombre":"Elevación de talones de pie","grupo":"Pierna","subgrupo":"Pantorrillas","equipo":"Máquinas"},{"nombre":"Elevación de talones sentado","grupo":"Pierna","subgrupo":"Pantorrillas","equipo":"Máquinas"},{"nombre":"Elevación de pantorrillas en prensa","grupo":"Pierna","subgrupo":"Pantorrillas","equipo":"Máquinas"},{"nombre":"Elevación de talones a una pierna","grupo":"Pierna","subgrupo":"Pantorrillas","equipo":"Peso corporal"},{"nombre":"Hip thrust con barra","grupo":"Glúteos","subgrupo":"Glúteo mayor","equipo":"Barra y pesos libres"},{"nombre":"Puente de glúteos","grupo":"Glúteos","subgrupo":"Glúteo mayor","equipo":"Peso corporal"},{"nombre":"Patada de glúteo en polea","grupo":"Glúteos","subgrupo":"Glúteo mayor","equipo":"Poleas"},{"nombre":"Máquina de patada de glúteo","grupo":"Glúteos","subgrupo":"Glúteo mayor","equipo":"Máquinas"},{"nombre":"Sentadilla búlgara para glúteos","grupo":"Glúteos","subgrupo":"Glúteo mayor","equipo":"Mancuernas"},{"nombre":"Abducción de cadera en máquina","grupo":"Glúteos","subgrupo":"Glúteo medio y menor","equipo":"Máquinas"},{"nombre":"Abducción de cadera en polea","grupo":"Glúteos","subgrupo":"Glúteo medio y menor","equipo":"Poleas"},{"nombre":"Caminata lateral con banda","grupo":"Glúteos","subgrupo":"Glúteo medio y menor","equipo":"Otros"},{"nombre":"Elevación lateral de pierna","grupo":"Glúteos","subgrupo":"Glúteo medio y menor","equipo":"Peso corporal"},{"nombre":"Crunch abdominal","grupo":"Abdomen","subgrupo":"Recto abdominal","equipo":"Peso corporal"},{"nombre":"Crunch en máquina","grupo":"Abdomen","subgrupo":"Recto abdominal","equipo":"Máquinas"},{"nombre":"Crunch en polea","grupo":"Abdomen","subgrupo":"Recto abdominal","equipo":"Poleas"},{"nombre":"Elevación de piernas colgado","grupo":"Abdomen","subgrupo":"Recto abdominal","equipo":"Peso corporal"},{"nombre":"Giros rusos con mancuerna","grupo":"Abdomen","subgrupo":"Oblicuos","equipo":"Mancuernas"},{"nombre":"Woodchopper en polea","grupo":"Abdomen","subgrupo":"Oblicuos","equipo":"Poleas"},{"nombre":"Plancha lateral","grupo":"Abdomen","subgrupo":"Oblicuos","equipo":"Peso corporal"},{"nombre":"Plancha abdominal","grupo":"Abdomen","subgrupo":"Transverso y core","equipo":"Peso corporal"},{"nombre":"Dead bug","grupo":"Abdomen","subgrupo":"Transverso y core","equipo":"Peso corporal"},{"nombre":"Pallof press","grupo":"Abdomen","subgrupo":"Transverso y core","equipo":"Poleas"}];
const catalogoGrupo = document.getElementById('catalogoGrupo');
const catalogoSubgrupo = document.getElementById('catalogoSubgrupo');
const catalogoEquipo = document.getElementById('catalogoEquipo');
const catalogoBuscar = document.getElementById('catalogoBuscar');
const catalogoResultados = document.getElementById('catalogoResultados');
const catalogoCantidad = document.getElementById('catalogoCantidad');
const gruposCatalogo = [...new Set(CATALOGO_EJERCICIOS.map(e => e.grupo))];
gruposCatalogo.forEach(grupo => catalogoGrupo.add(new Option(grupo, grupo)));
function actualizarSubgruposCatalogo() {
    const previo = catalogoSubgrupo.value;
    catalogoSubgrupo.replaceChildren(new Option('Todos los subgrupos', ''));
    const subgrupos = [...new Set(CATALOGO_EJERCICIOS.filter(e => !catalogoGrupo.value || e.grupo === catalogoGrupo.value).map(e => e.subgrupo))];
    subgrupos.forEach(sub => catalogoSubgrupo.add(new Option(sub, sub)));
    if (subgrupos.includes(previo)) catalogoSubgrupo.value = previo;
    actualizarCatalogo();
}
function actualizarCatalogo() {
    const busqueda = catalogoBuscar.value.trim().toLocaleLowerCase('es');
    const filtrados = CATALOGO_EJERCICIOS.filter(e =>
        (!catalogoGrupo.value || e.grupo === catalogoGrupo.value) &&
        (!catalogoSubgrupo.value || e.subgrupo === catalogoSubgrupo.value) &&
        (!catalogoEquipo.value || e.equipo === catalogoEquipo.value) &&
        (!busqueda || (e.nombre + ' ' + e.grupo + ' ' + e.subgrupo + ' ' + e.equipo).toLocaleLowerCase('es').includes(busqueda))
    );
    catalogoCantidad.textContent = filtrados.length + ' ejercicio(s) encontrados';
    catalogoResultados.replaceChildren();
    filtrados.forEach(e => {
        const tarjeta = document.createElement('article');
        tarjeta.className = 'catalogo-tarjeta';
        const descripcion = document.createElement('div');
        const titulo = document.createElement('strong');
        titulo.textContent = e.nombre;
        const metadatos = document.createElement('small');
        metadatos.textContent = e.grupo + ' · ' + e.subgrupo + ' · ' + e.equipo;
        descripcion.append(titulo, metadatos);
        const boton = document.createElement('button');
        boton.type = 'button';
        boton.textContent = sesionDeRutinaSeleccionada() ? 'Usar en esta sesión' : 'Usar en mi rutina';
        boton.addEventListener('click', () => {
            if (!rutinaSeleccionada) return;
            document.getElementById('ejercicio').value = e.nombre;
            cambiarFormulario(true);
            document.getElementById('catalogoEjercicios').open = false;
            document.getElementById('series').focus();
        });
        tarjeta.append(descripcion, boton);
        catalogoResultados.appendChild(tarjeta);
    });
    if (!filtrados.length) catalogoResultados.textContent = 'No encontramos ejercicios con esos filtros.';
}
catalogoGrupo.addEventListener('change', actualizarSubgruposCatalogo);
[catalogoSubgrupo, catalogoEquipo, catalogoBuscar].forEach(el => el.addEventListener(el === catalogoBuscar ? 'input' : 'change', actualizarCatalogo));
actualizarSubgruposCatalogo();

// v14: pantalla independiente para consultar las laminas de un grupo muscular.
const guiaPantalla = document.getElementById('guiaPantalla');
const volverGuia = document.getElementById('volverGuia');
const tituloGuia = document.getElementById('guiaPantallaTitulo');
const guiaContenedor = document.getElementById('seccionGuia');
let guiaBotonAnterior = null;

function cerrarPantallaGuia() {
    if (guiaPantalla.hidden) return;
    guiaPantalla.hidden = true;
    document.body.classList.remove('guia-pantalla-abierta');
    guiaContenedor.classList.remove('guia-vista-abierta');
    document.querySelectorAll('#seccionGuia [data-guia-panel]').forEach(panel => panel.hidden = true);
    document.querySelectorAll('#seccionGuia [data-guia]').forEach(boton => {
        boton.classList.remove('activo');
        boton.setAttribute('aria-pressed', 'false');
    });
    if (guiaBotonAnterior && guiaBotonAnterior.isConnected) guiaBotonAnterior.focus();
}

document.querySelectorAll('#seccionGuia [data-guia]').forEach(boton => {
    boton.addEventListener('click', () => {
        guiaBotonAnterior = boton;
        const seleccionado = boton.dataset.guia;
        document.querySelectorAll('#seccionGuia [data-guia]').forEach(b => {
            const activo = b.dataset.guia === seleccionado;
            b.classList.toggle('activo', activo);
            b.setAttribute('aria-pressed', String(activo));
        });
        document.querySelectorAll('#seccionGuia [data-guia-panel]').forEach(panel => {
            panel.hidden = panel.dataset.guiaPanel !== seleccionado;
        });
        tituloGuia.textContent = boton.querySelector('strong').textContent;
        guiaContenedor.classList.add('guia-vista-abierta');
        guiaPantalla.hidden = false;
        document.body.classList.add('guia-pantalla-abierta');
        guiaPantalla.scrollTop = 0;
        volverGuia.focus();
    });
});
volverGuia.addEventListener('click', cerrarPantallaGuia);
document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !guiaPantalla.hidden) cerrarPantallaGuia();
});
// Si se cierra la guía principal, restablecer la vista de categorías.
guiaContenedor.addEventListener('toggle', () => {
    if (!guiaContenedor.open) cerrarPantallaGuia();
});
