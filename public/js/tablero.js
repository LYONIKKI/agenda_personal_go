document.addEventListener('DOMContentLoaded', async () => {
    let tareasTotales = [];

    // 1. CARGA MODULAR DEL SIDEBAR EXCLUSIVO
    const sidebarContainer = document.getElementById('sidebar-container');
    if (sidebarContainer) {
        try {
            const resp = await fetch('/public/views/layout/sidebar.html');
            if (resp.ok) {
                sidebarContainer.innerHTML = await resp.text();
                activarRutaSidebar();
                inicializarEventosSidebar();
            }
        } catch (e) {
            console.error('Error cargando sidebar:', e);
        }
    }

    // Elementos Globales
    const inputBuscar = document.getElementById('input-buscar');
    const btnRecargar = document.getElementById('btn-recargar');

    // Modales y Formularios
    const modalCrear = document.getElementById('modal-crear-tarea');
    const formCrear = document.getElementById('form-crear-tarea');
    const btnAbrirCrear = document.getElementById('btn-abrir-crear');
    const btnCerrarCrear = document.getElementById('btn-cerrar-modal-crear');
    const btnCancelarCrear = document.getElementById('btn-cancelar-modal-crear');

    const modalEditar = document.getElementById('modal-editar-tarea');
    const formEditar = document.getElementById('form-editar-tarea');
    const btnCerrarEditar = document.getElementById('btn-cerrar-modal-editar');
    const btnCancelarEditar = document.getElementById('btn-cancelar-modal-editar');

    // Modal Bitácora
    const modalBitacora = document.getElementById('modal-bitacora');
    const formBitacora = document.getElementById('form-bitacora');
    const btnCerrarBitacora = document.getElementById('btn-cerrar-bitacora');

    cargarTareas();

    // Helper para obtener fecha-hora local en formato YYYY-MM-DDTHH:MM
    function obtenerFechaHoraLocalISO(sumarHoras = 0) {
        const ahora = new Date();
        ahora.setHours(ahora.getHours() + sumarHoras);
        const y = ahora.getFullYear();
        const m = String(ahora.getMonth() + 1).padStart(2, '0');
        const d = String(ahora.getDate()).padStart(2, '0');
        const hh = String(ahora.getHours()).padStart(2, '0');
        const mm = String(ahora.getMinutes()).padStart(2, '0');
        return `${y}-${m}-${d}T${hh}:${mm}`;
    }

    // Sincronizar validación min de fechas (Fecha límite >= Fecha inicio)
    const crearFechaInput = document.getElementById('crear-fecha');
    const crearLimiteInput = document.getElementById('crear-fecha-limite');
    crearFechaInput.addEventListener('change', () => {
        crearLimiteInput.min = crearFechaInput.value;
        if (crearLimiteInput.value && crearLimiteInput.value < crearFechaInput.value) {
            crearLimiteInput.value = crearFechaInput.value;
        }
    });

    const editFechaInput = document.getElementById('edit-fecha');
    const editLimiteInput = document.getElementById('edit-fecha-limite');
    editFechaInput.addEventListener('change', () => {
        editLimiteInput.min = editFechaInput.value;
        if (editLimiteInput.value && editLimiteInput.value < editFechaInput.value) {
            editLimiteInput.value = editFechaInput.value;
        }
    });

    // Eventos Modal Crear
    if (btnAbrirCrear) {
        btnAbrirCrear.addEventListener('click', () => {
            formCrear.reset();
            const inicio = obtenerFechaHoraLocalISO(0);
            const limite = obtenerFechaHoraLocalISO(2);
            crearFechaInput.value = inicio;
            crearLimiteInput.min = inicio;
            crearLimiteInput.value = limite;
            modalCrear.classList.add('active');
            modalCrear.classList.remove('hidden');
        });
    }

    const cerrarCrear = () => {
        modalCrear.classList.remove('active');
        modalCrear.classList.add('hidden');
    };
    if (btnCerrarCrear) btnCerrarCrear.addEventListener('click', cerrarCrear);
    if (btnCancelarCrear) btnCancelarCrear.addEventListener('click', cerrarCrear);

    // Eventos Modal Editar
    const cerrarEditar = () => {
        modalEditar.classList.remove('active');
        modalEditar.classList.add('hidden');
    };
    if (btnCerrarEditar) btnCerrarEditar.addEventListener('click', cerrarEditar);
    if (btnCancelarEditar) btnCancelarEditar.addEventListener('click', cerrarEditar);

    // Eventos Modal Bitácora
    const cerrarBitacora = () => {
        modalBitacora.classList.remove('active');
        modalBitacora.classList.add('hidden');
    };
    if (btnCerrarBitacora) btnCerrarBitacora.addEventListener('click', cerrarBitacora);

    if (btnRecargar) btnRecargar.addEventListener('click', cargarTareas);

    // Submit: Crear Tarea
    formCrear.addEventListener('submit', async (e) => {
        e.preventDefault();
        const inicioVal = crearFechaInput.value;
        const limiteVal = crearLimiteInput.value;

        if (limiteVal && limiteVal < inicioVal) {
            Swal.fire({ icon: 'warning', title: 'Fecha inválida', text: 'La fecha y hora límite no puede ser menor a la de inicio.', confirmButtonColor: '#b91c1c' });
            return;
        }

        const payload = {
            titulo: document.getElementById('crear-titulo').value.trim(),
            modulo: document.getElementById('crear-modulo').value.trim() || 'General',
            tecnologia: document.getElementById('crear-tecnologia').value.trim() || 'General',
            prioridad: document.getElementById('crear-prioridad').value,
            estado: document.getElementById('crear-estado').value,
            fecha_programada: inicioVal,
            fecha_limite: limiteVal,
            descripcion: document.getElementById('crear-descripcion').value.trim()
        };

        try {
            const res = await fetch('/api/tareas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                cerrarCrear();
                Swal.fire({ icon: 'success', title: 'Tarea Registrada', timer: 1200, showConfirmButton: false, background: '#1a0305', color: '#fecaca' });
                cargarTareas();
            } else {
                const errJson = await res.json();
                Swal.fire({ icon: 'error', title: 'Error', text: errJson.error || 'Error al registrar', confirmButtonColor: '#b91c1c' });
            }
        } catch (_) {
            Swal.fire({ icon: 'error', title: 'Error de red', confirmButtonColor: '#b91c1c' });
        }
    });

    // Submit: Actualizar Tarea
    formEditar.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('edit-id').value;
        const inicioVal = editFechaInput.value;
        const limiteVal = editLimiteInput.value;

        if (limiteVal && limiteVal < inicioVal) {
            Swal.fire({ icon: 'warning', title: 'Fecha inválida', text: 'La fecha y hora límite no puede ser menor a la de inicio.', confirmButtonColor: '#b91c1c' });
            return;
        }

        const payload = {
            titulo: document.getElementById('edit-titulo').value.trim(),
            modulo: document.getElementById('edit-modulo').value.trim() || 'General',
            tecnologia: document.getElementById('edit-tecnologia').value.trim() || 'General',
            prioridad: document.getElementById('edit-prioridad').value,
            estado: document.getElementById('edit-estado').value,
            fecha_programada: inicioVal,
            fecha_limite: limiteVal,
            descripcion: document.getElementById('edit-descripcion').value.trim()
        };

        try {
            const res = await fetch(`/api/tareas/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                cerrarEditar();
                Swal.fire({ icon: 'success', title: 'Tarea Actualizada', timer: 1200, showConfirmButton: false, background: '#1a0305', color: '#fecaca' });
                cargarTareas();
            } else {
                const errJson = await res.json();
                Swal.fire({ icon: 'error', title: 'Error', text: errJson.error || 'Error al actualizar', confirmButtonColor: '#b91c1c' });
            }
        } catch (_) {
            Swal.fire({ icon: 'error', title: 'Error de red', confirmButtonColor: '#b91c1c' });
        }
    });

    // Submit: Registrar Avance en Bitácora
    formBitacora.addEventListener('submit', async (e) => {
        e.preventDefault();
        const tareaId = document.getElementById('bitacora-tarea-id').value;
        const payload = {
            fecha: document.getElementById('av-fecha').value,
            hora_inicio: document.getElementById('av-inicio').value,
            hora_fin: document.getElementById('av-fin').value,
            nota: document.getElementById('av-nota').value.trim()
        };

        try {
            const res = await fetch(`/api/tareas/${tareaId}/avances`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                document.getElementById('av-nota').value = '';
                await cargarHistorialBitacora(tareaId);
                cargarTareas(); // Actualizar contador de minutos en tarjetas
            } else {
                const errJson = await res.json();
                Swal.fire({ icon: 'warning', title: 'Atención', text: errJson.error || 'Verifica las horas', confirmButtonColor: '#b91c1c' });
            }
        } catch (_) {
            Swal.fire({ icon: 'error', title: 'Error de red' });
        }
    });

    // Filtro reactivo
    if (inputBuscar) {
        inputBuscar.addEventListener('input', (e) => {
            const q = e.target.value.toLowerCase().trim();
            const filtradas = tareasTotales.filter(t => 
                t.titulo.toLowerCase().includes(q) ||
                t.modulo.toLowerCase().includes(q) ||
                t.tecnologia.toLowerCase().includes(q) ||
                t.descripcion.toLowerCase().includes(q)
            );
            renderizarColumnas(filtradas);
        });
    }

    async function cargarTareas() {
        try {
            const res = await fetch('/api/tareas');
            const json = await res.json();
            if (json.status === 'ok') {
                tareasTotales = json.data || [];
                renderizarColumnas(tareasTotales);
            }
        } catch (err) {
            console.error('Error al cargar:', err);
        }
    }

    function renderizarColumnas(lista) {
        const columnas = {
            backlog: document.getElementById('col-backlog'),
            pendiente: document.getElementById('col-pendiente'),
            en_progreso: document.getElementById('col-en_progreso'),
            completado: document.getElementById('col-completado')
        };

        Object.values(columnas).forEach(c => { if(c) c.innerHTML = ''; });
        const conteos = { backlog: 0, pendiente: 0, en_progreso: 0, completado: 0 };

        lista.forEach(t => {
            const estado = t.estado || 'pendiente';
            if (columnas[estado]) {
                conteos[estado]++;
                columnas[estado].innerHTML += generarCardHTML(t);
            }
        });

        document.getElementById('badge-count-backlog').innerText = conteos.backlog;
        document.getElementById('badge-count-pendiente').innerText = conteos.pendiente;
        document.getElementById('badge-count-en_progreso').innerText = conteos.en_progreso;
        document.getElementById('badge-count-completado').innerText = conteos.completado;
    }

    function formatearMinutos(mins) {
        if (!mins || mins <= 0) return '';
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return `${h}h ${m}m`;
    }

    function generarCardHTML(t) {
        const colorPrioridad = {
            urgente: 'bg-red-100 text-red-800 border-red-300',
            alta: 'bg-amber-100 text-amber-800 border-amber-300',
            media: 'bg-blue-100 text-blue-800 border-blue-300',
            baja: 'bg-gray-100 text-gray-700 border-gray-300'
        }[t.prioridad] || 'bg-gray-100 text-gray-700 border-gray-300';

        const tiempoBadge = t.minutos_totales > 0 
            ? `<span class="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono text-[9px] font-bold" title="Tiempo real invertido"><i class="fa-solid fa-stopwatch mr-0.5"></i>${formatearMinutos(t.minutos_totales)}</span>` 
            : '';

        return `
            <div class="tarjeta-tarea p-3 text-xs flex flex-col justify-between space-y-2.5">
                <div>
                    <div class="flex items-center justify-between mb-1.5 gap-1">
                        <span class="px-2 py-0.5 rounded-full font-bold uppercase text-[9px] border ${colorPrioridad}">
                            ${t.prioridad}
                        </span>
                        ${tiempoBadge}
                    </div>
                    <div class="text-[10px] text-gray-500 font-mono mb-1.5 space-y-0.5">
                        <div><i class="fa-regular fa-calendar text-gray-400 mr-1"></i>Ini: ${t.fecha_programada}</div>
                        ${t.fecha_limite ? `<div class="text-red-700 font-bold"><i class="fa-solid fa-hourglass-half mr-1"></i>Fin: ${t.fecha_limite}</div>` : ''}
                    </div>
                    <h4 class="font-bold text-gray-800 leading-snug">${t.titulo}</h4>
                    ${t.descripcion ? `<p class="text-gray-500 mt-1 line-clamp-2 text-[11px]">${t.descripcion}</p>` : ''}
                </div>

                <div class="flex items-center justify-between pt-2 border-t border-gray-100 text-[10px]">
                    <div class="flex items-center space-x-1 truncate mr-1">
                        <span class="px-1.5 py-0.5 rounded bg-stone-100 text-stone-700 font-semibold font-mono truncate">${t.modulo}</span>
                        <span class="px-1.5 py-0.5 rounded bg-red-100 text-red-800 font-bold font-mono">${t.tecnologia}</span>
                    </div>

                    <div class="flex items-center space-x-0.5 flex-shrink-0">
                        <button onclick="abrirBitacora(${t.id})" class="p-1 text-indigo-600 hover:bg-indigo-50 rounded" title="Bitácora de Avances y Tiempo">
                            <i class="fa-solid fa-clock-rotate-left"></i>
                        </button>
                        <button onclick="verTarea(${t.id})" class="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Ver Detalle">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                        <button onclick="abrirModalEditar(${t.id})" class="p-1 text-amber-600 hover:bg-amber-50 rounded" title="Editar / Aplazar">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button onclick="eliminarTarea(${t.id})" class="p-1 text-red-600 hover:bg-red-50 rounded" title="Eliminar">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                        ${t.estado !== 'en_progreso' && t.estado !== 'completado' ? 
                            `<button onclick="moverEstado(${t.id}, 'en_progreso')" class="p-1 text-purple-600 hover:bg-purple-50 rounded" title="Iniciar"><i class="fa-solid fa-play"></i></button>` : ''}
                        ${t.estado !== 'completado' ? 
                            `<button onclick="moverEstado(${t.id}, 'completado')" class="p-1 text-emerald-600 hover:bg-emerald-50 rounded" title="Completar"><i class="fa-solid fa-check"></i></button>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    // Abrir Bitácora Técnica
    window.abrirBitacora = async function(id) {
        const t = tareasTotales.find(item => item.id === id);
        if (!t) return;

        document.getElementById('bitacora-tarea-id').value = t.id;
        document.getElementById('bitacora-titulo-tarea').innerText = `Bitácora #${t.id}: ${t.titulo}`;
        
        const ahora = new Date();
        document.getElementById('av-fecha').value = ahora.toISOString().split('T')[0];
        const hhFin = String(ahora.getHours()).padStart(2, '0') + ':' + String(ahora.getMinutes()).padStart(2, '0');
        ahora.setHours(ahora.getHours() - 1);
        const hhIni = String(ahora.getHours()).padStart(2, '0') + ':' + String(ahora.getMinutes()).padStart(2, '0');
        
        document.getElementById('av-inicio').value = hhIni;
        document.getElementById('av-fin').value = hhFin;
        document.getElementById('av-nota').value = '';

        modalBitacora.classList.add('active');
        modalBitacora.classList.remove('hidden');

        await cargarHistorialBitacora(id);
    };

    async function cargarHistorialBitacora(tareaId) {
        const contenedor = document.getElementById('lista-avances-tarea');
        const labelTotal = document.getElementById('bitacora-tiempo-total');
        contenedor.innerHTML = '<p class="text-gray-400 italic text-center py-2">Cargando historial...</p>';

        try {
            const res = await fetch(`/api/tareas/${tareaId}/avances`);
            const json = await res.json();
            if (json.status === 'ok') {
                const mins = json.total_minutos || 0;
                labelTotal.innerText = `Tiempo acumulado: ${Math.floor(mins / 60)}h ${mins % 60}m (${mins} min)`;

                if (!json.data || json.data.length === 0) {
                    contenedor.innerHTML = '<p class="text-gray-400 italic text-center py-4">Aún no hay sesiones registradas para esta tarea.</p>';
                    return;
                }

                contenedor.innerHTML = json.data.map(av => `
                    <div class="p-3 rounded-xl border border-gray-200 bg-white flex items-start justify-between gap-2">
                        <div class="space-y-1">
                            <div class="flex items-center space-x-2 text-[10px] font-mono">
                                <span class="font-bold text-red-800 bg-red-50 px-2 py-0.5 rounded">${av.fecha}</span>
                                <span class="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">${av.hora_inicio} - ${av.hora_fin} (${av.minutos_invertidos} min)</span>
                            </div>
                            <p class="text-gray-700 text-xs whitespace-pre-wrap">${av.nota}</p>
                        </div>
                        <button onclick="eliminarAvance(${av.id}, ${tareaId})" class="text-red-400 hover:text-red-600 p-1" title="Eliminar registro">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                `).join('');
            }
        } catch (_) {
            contenedor.innerHTML = '<p class="text-red-500 text-center">Error al cargar historial.</p>';
        }
    }

    window.eliminarAvance = async function(avanceId, tareaId) {
        if (!confirm('¿Eliminar este registro de bitácora?')) return;
        await fetch(`/api/avances/${avanceId}`, { method: 'DELETE' });
        await cargarHistorialBitacora(tareaId);
        cargarTareas();
    };

    // Modal Editar
    window.abrirModalEditar = function(id) {
        const t = tareasTotales.find(item => item.id === id);
        if (!t) return;

        document.getElementById('edit-id').value = t.id;
        document.getElementById('edit-titulo').value = t.titulo;
        document.getElementById('edit-modulo').value = t.modulo;
        document.getElementById('edit-tecnologia').value = t.tecnologia;
        document.getElementById('edit-prioridad').value = t.prioridad;
        document.getElementById('edit-estado').value = t.estado;
        
        const iniFormat = t.fecha_programada ? t.fecha_programada.replace(' ', 'T') : '';
        const limFormat = t.fecha_limite ? t.fecha_limite.replace(' ', 'T') : '';
        
        editFechaInput.value = iniFormat;
        editLimiteInput.min = iniFormat;
        editLimiteInput.value = limFormat;
        
        document.getElementById('edit-descripcion').value = t.descripcion;
        document.getElementById('txt-titulo-modal-editar').innerText = `Editar Tarea #${t.id}`;

        modalEditar.classList.add('active');
        modalEditar.classList.remove('hidden');
    };

    // Modal Detalle
    window.verTarea = function(id) {
        const t = tareasTotales.find(item => item.id === id);
        if (!t) return;

        Swal.fire({
            title: `<span class="text-sm font-bold text-gray-800">Tarea #${t.id}</span>`,
            html: `
                <div class="text-left text-xs space-y-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <p><b>Título:</b> <span class="text-gray-900">${t.titulo}</span></p>
                    <p><b>Módulo:</b> <span class="font-mono text-red-700 font-bold">${t.modulo}</span></p>
                    <p><b>Tecnología:</b> <span class="font-mono text-blue-700 font-bold">${t.tecnologia}</span></p>
                    <p><b>Prioridad:</b> <span class="uppercase font-semibold">${t.prioridad}</span></p>
                    <p><b>Inicio:</b> <span class="font-mono text-purple-700 font-bold">${t.fecha_programada}</span></p>
                    <p><b>Límite:</b> <span class="font-mono text-red-700 font-bold">${t.fecha_limite || 'Sin fecha límite'}</span></p>
                    <p><b>Tiempo Invertido:</b> <span class="font-mono text-indigo-700 font-bold">${formatearMinutos(t.minutos_totales) || '0m'}</span></p>
                    <p><b>Estado:</b> <span class="uppercase font-semibold">${t.estado}</span></p>
                    <hr class="border-gray-200 my-1">
                    <p><b>Descripción:</b></p>
                    <p class="text-gray-600 whitespace-pre-wrap">${t.descripcion || 'Sin descripción detallada.'}</p>
                </div>
            `,
            confirmButtonColor: '#b91c1c',
            confirmButtonText: 'Cerrar'
        });
    };

    // Eliminar Tarea
    window.eliminarTarea = async function(id) {
        const confirm = await Swal.fire({
            title: '¿Eliminar tarea?',
            text: 'Se borrará también su historial de bitácora.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (confirm.isConfirmed) {
            try {
                const res = await fetch(`/api/tareas/${id}`, { method: 'DELETE' });
                if (res.ok) {
                    Swal.fire({ icon: 'success', title: 'Eliminado', timer: 1200, showConfirmButton: false });
                    cargarTareas();
                } else {
                    Swal.fire({ icon: 'error', title: 'Error al eliminar' });
                }
            } catch (_) {
                Swal.fire({ icon: 'error', title: 'Error de red' });
            }
        }
    };

    window.moverEstado = async function(id, nuevoEstado) {
        try {
            const res = await fetch(`/api/tareas/${id}/estado`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: nuevoEstado })
            });
            if (res.ok) cargarTareas();
        } catch (_) {
            console.error('Error al mover estado');
        }
    };

    function inicializarEventosSidebar() {
        const sidebarMain = document.getElementById('sidebar-main');
        const sidebarBackdrop = document.getElementById('sidebar-backdrop');
        const btnAbrirSidebar = document.getElementById('btn-abrir-sidebar-movil');
        const btnCerrarSidebar = document.getElementById('btn-cerrar-sidebar-movil');

        if (btnAbrirSidebar && sidebarMain && sidebarBackdrop) {
            btnAbrirSidebar.addEventListener('click', () => {
                sidebarMain.classList.add('sidebar-abierto');
                sidebarBackdrop.classList.add('active');
            });

            const cerrarSidebar = () => {
                sidebarMain.classList.remove('sidebar-abierto');
                sidebarBackdrop.classList.remove('active');
            };

            if (btnCerrarSidebar) btnCerrarSidebar.addEventListener('click', cerrarSidebar);
            sidebarBackdrop.addEventListener('click', cerrarSidebar);
        }
    }

    function activarRutaSidebar() {
        const pathActual = window.location.pathname;
        document.querySelectorAll('.sidebar-item').forEach(link => {
            const dataPath = link.getAttribute('data-path');
            if (dataPath === pathActual) {
                link.classList.add('item-active-vino');
                link.classList.remove('item-hover-vino');
            } else {
                link.classList.remove('item-active-vino');
                link.classList.add('item-hover-vino');
            }
        });
    }
});