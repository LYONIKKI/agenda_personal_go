document.addEventListener('DOMContentLoaded', async () => {
    let tareasTotales = [];

    // 1. CARGA MODULAR DEL SIDEBAR EXCLUSIVO
    const sidebarContainer = document.getElementById('sidebar-container');
    if (sidebarContainer) {
        try {
            const resp = await fetch('/public/views/layout/sidebar.html');
            if (resp.ok) {
                sidebarContainer.innerHTML = await resp.text();
                
                // === AQUÍ SE LLAMAN LAS DOS FUNCIONES DEL SIDEBAR ===
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

    // Modales y Formularios separados
    const modalCrear = document.getElementById('modal-crear-tarea');
    const formCrear = document.getElementById('form-crear-tarea');
    const btnAbrirCrear = document.getElementById('btn-abrir-crear');
    const btnCerrarCrear = document.getElementById('btn-cerrar-modal-crear');
    const btnCancelarCrear = document.getElementById('btn-cancelar-modal-crear');

    const modalEditar = document.getElementById('modal-editar-tarea');
    const formEditar = document.getElementById('form-editar-tarea');
    const btnCerrarEditar = document.getElementById('btn-cerrar-modal-editar');
    const btnCancelarEditar = document.getElementById('btn-cancelar-modal-editar');

    cargarTareas();

    // Eventos Modal Crear
    if (btnAbrirCrear) {
        btnAbrirCrear.addEventListener('click', () => {
            formCrear.reset();
            const hoy = new Date().toISOString().split('T')[0];
            document.getElementById('crear-fecha').value = hoy;
            document.getElementById('crear-fecha-limite').value = hoy; // Valor inicial igual a hoy
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

    if (btnRecargar) btnRecargar.addEventListener('click', cargarTareas);

    // Submit: Registrar Tarea (Crear)
    formCrear.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            titulo: document.getElementById('crear-titulo').value.trim(),
            modulo: document.getElementById('crear-modulo').value.trim() || 'General',
            tecnologia: document.getElementById('crear-tecnologia').value.trim() || 'General',
            prioridad: document.getElementById('crear-prioridad').value,
            estado: document.getElementById('crear-estado').value,
            fecha_programada: document.getElementById('crear-fecha').value,
            fecha_limite: document.getElementById('crear-fecha-limite').value, // <--- NUEVO
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
                Swal.fire({
                    icon: 'success',
                    title: 'Tarea Registrada',
                    timer: 1300,
                    showConfirmButton: false,
                    background: '#1a0305',
                    color: '#fecaca'
                });
                cargarTareas();
            } else {
                Swal.fire({ icon: 'error', title: 'Error al registrar', confirmButtonColor: '#b91c1c' });
            }
        } catch (_) {
            Swal.fire({ icon: 'error', title: 'Error de red', confirmButtonColor: '#b91c1c' });
        }
    });

    // Submit: Actualizar Tarea (Editar)
    formEditar.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('edit-id').value;
        const payload = {
            titulo: document.getElementById('edit-titulo').value.trim(),
            modulo: document.getElementById('edit-modulo').value.trim() || 'General',
            tecnologia: document.getElementById('edit-tecnologia').value.trim() || 'General',
            prioridad: document.getElementById('edit-prioridad').value,
            estado: document.getElementById('edit-estado').value,
            fecha_programada: document.getElementById('edit-fecha').value,
            fecha_limite: document.getElementById('edit-fecha-limite').value, // <--- NUEVO
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
                Swal.fire({
                    icon: 'success',
                    title: 'Tarea Actualizada',
                    timer: 1300,
                    showConfirmButton: false,
                    background: '#1a0305',
                    color: '#fecaca'
                });
                cargarTareas();
            } else {
                Swal.fire({ icon: 'error', title: 'Error al actualizar', confirmButtonColor: '#b91c1c' });
            }
        } catch (_) {
            Swal.fire({ icon: 'error', title: 'Error de red', confirmButtonColor: '#b91c1c' });
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
                
                // Si la URL viene con /?filtro=hoy, filtra directo por la fecha actual
                const urlParams = new URLSearchParams(window.location.search);
                if (urlParams.get('filtro') === 'hoy') {
                    const hoy = new Date().toISOString().split('T')[0];
                    const filtradas = tareasTotales.filter(t => t.fecha_programada === hoy);
                    renderizarColumnas(filtradas);
                } else {
                    renderizarColumnas(tareasTotales);
                }
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

    function generarCardHTML(t) {
        const colorPrioridad = {
            urgente: 'bg-red-100 text-red-800 border-red-300',
            alta: 'bg-amber-100 text-amber-800 border-amber-300',
            media: 'bg-blue-100 text-blue-800 border-blue-300',
            baja: 'bg-gray-100 text-gray-700 border-gray-300'
        }[t.prioridad] || 'bg-gray-100 text-gray-700 border-gray-300';

        return `
            <div class="tarjeta-tarea p-3 text-xs flex flex-col justify-between space-y-2.5">
                <div>
                    <div class="flex items-center justify-between mb-1">
                        <span class="px-2 py-0.5 rounded-full font-bold uppercase text-[9px] border ${colorPrioridad}">
                            ${t.prioridad}
                        </span>
                        <span class="text-[10px] text-gray-400 font-mono">
                            <i class="fa-regular fa-calendar mr-1"></i>${t.fecha_programada}
                            ${t.fecha_limite ? `<span class="text-red-600 font-bold ml-1" title="Fecha Límite">⌛ ${t.fecha_limite}</span>` : ''}
                        </span>
                    </div>
                    <h4 class="font-bold text-gray-800 leading-snug">${t.titulo}</h4>
                    ${t.descripcion ? `<p class="text-gray-500 mt-1 line-clamp-2 text-[11px]">${t.descripcion}</p>` : ''}
                </div>

                <div class="flex items-center justify-between pt-2 border-t border-gray-100 text-[10px]">
                    <div class="flex items-center space-x-1">
                        <span class="px-1.5 py-0.5 rounded bg-stone-100 text-stone-700 font-semibold font-mono">${t.modulo}</span>
                        <span class="px-1.5 py-0.5 rounded bg-red-100 text-red-800 font-bold font-mono">${t.tecnologia}</span>
                    </div>

                    <div class="flex items-center space-x-1">
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

    // Modal Editar Exclusivo
    window.abrirModalEditar = function(id) {
        const t = tareasTotales.find(item => item.id === id);
        if (!t) return;

        document.getElementById('edit-id').value = t.id;
        document.getElementById('edit-titulo').value = t.titulo;
        document.getElementById('edit-modulo').value = t.modulo;
        document.getElementById('edit-tecnologia').value = t.tecnologia;
        document.getElementById('edit-prioridad').value = t.prioridad;
        document.getElementById('edit-estado').value = t.estado;
        document.getElementById('edit-fecha').value = t.fecha_programada;
        document.getElementById('edit-fecha-limite').value = t.fecha_limite || ''; // <--- NUEVO
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
                    <p><b>Fecha Programada:</b> <span class="font-mono text-purple-700 font-bold">${t.fecha_programada}</span></p>
                    <p><b>Fecha Límite:</b> <span class="font-mono text-red-700 font-bold">${t.fecha_limite || 'Sin fecha límite'}</span></p>
                    <p><b>Estado:</b> <span class="uppercase font-semibold">${t.estado}</span></p>
                    <p><b>Origen:</b> <span class="uppercase font-semibold">${t.origen}</span></p>
                    <hr class="border-gray-200 my-1">
                    <p><b>Descripción:</b></p>
                    <p class="text-gray-600 whitespace-pre-wrap">${t.descripcion || 'Sin descripción detallada.'}</p>
                </div>
            `,
            confirmButtonColor: '#b91c1c',
            confirmButtonText: 'Cerrar'
        });
    };

    // Eliminar
    window.eliminarTarea = async function(id) {
        const confirm = await Swal.fire({
            title: '¿Eliminar tarea?',
            text: 'Esta acción no se puede deshacer.',
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

    // Eventos del Sidebar cargado dinámicamente
    function inicializarEventosSidebar() {
        const sidebarMain = document.getElementById('sidebar-main');
        const sidebarBackdrop = document.getElementById('sidebar-backdrop');
        const btnAbrirSidebar = document.getElementById('btn-abrir-sidebar-movil');
        const btnCerrarSidebar = document.getElementById('btn-cerrar-sidebar-movil');
        const btnFiltroHoy = document.getElementById('btn-filtro-hoy');

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

        if (btnFiltroHoy) {
            btnFiltroHoy.addEventListener('click', () => {
                const hoy = new Date().toISOString().split('T')[0];
                const filtradas = tareasTotales.filter(t => t.fecha_programada === hoy);
                renderizarColumnas(filtradas);
                if (window.innerWidth < 768 && sidebarMain && sidebarBackdrop) {
                    sidebarMain.classList.remove('sidebar-abierto');
                    sidebarBackdrop.classList.remove('active');
                }
            });
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
