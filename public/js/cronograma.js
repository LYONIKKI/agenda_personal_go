document.addEventListener('DOMContentLoaded', async () => {
    // 1. CARGA MODULAR DEL SIDEBAR
    const sidebarContainer = document.getElementById('sidebar-container');
    if (sidebarContainer) {
        try {
            const resp = await fetch('/public/views/layout/sidebar.html');
            if (resp.ok) {
                sidebarContainer.innerHTML = await resp.text();
                activarRutaSidebar();
                inicializarSidebarMovil();
            }
        } catch (_) {}
    }

    // 2. ESTADO DEL ALMANAQUE
    let fechaSeleccionada = new Date(); // Día activo para el timeline
    let mesVisualizado = new Date();    // Mes que se muestra en el calendario

    let diasOcupadosMap = {}; // { '2026-11-12': ['Personal', 'Desarrollo'] }

    // Elementos DOM
    const tituloMes = document.getElementById('titulo-mes-almanaque');
    const grillaAlmanaque = document.getElementById('grilla-almanaque');
    const labelDiaSeleccionado = document.getElementById('label-dia-seleccionado');
    const contenedorSlots = document.getElementById('contenedor-time-slots');
    const btnMesAnt = document.getElementById('btn-mes-anterior');
    const btnMesSig = document.getElementById('btn-mes-siguiente');
    const btnIrHoy = document.getElementById('btn-ir-hoy');

    const modalBloque = document.getElementById('modal-bloque');
    const formBloque = document.getElementById('form-bloque');
    const btnCerrarModal = document.getElementById('btn-cerrar-modal-bloque');
    const btnCancelarModal = document.getElementById('btn-cancelar-bloque');

    // Inicializar
    await cargarDiasOcupadosDelMes();
    renderizarAlmanaque();
    cargarCronogramaDia(formatearFechaISO(fechaSeleccionada));

    // Navegación meses
    btnMesAnt.addEventListener('click', async () => {
        mesVisualizado.setMonth(mesVisualizado.getMonth() - 1);
        await cargarDiasOcupadosDelMes();
        renderizarAlmanaque();
    });

    btnMesSig.addEventListener('click', async () => {
        mesVisualizado.setMonth(mesVisualizado.getMonth() + 1);
        await cargarDiasOcupadosDelMes();
        renderizarAlmanaque();
    });

    btnIrHoy.addEventListener('click', async () => {
        fechaSeleccionada = new Date();
        mesVisualizado = new Date();
        await cargarDiasOcupadosDelMes();
        renderizarAlmanaque();
        cargarCronogramaDia(formatearFechaISO(fechaSeleccionada));
    });

    // Modales
    const cerrarModal = () => {
        modalBloque.classList.remove('active');
        modalBloque.classList.add('hidden');
    };
    btnCerrarModal.addEventListener('click', cerrarModal);
    btnCancelarModal.addEventListener('click', cerrarModal);

    // Guardar bloque horario
    formBloque.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            fecha: document.getElementById('b-fecha').value,
            actividad: document.getElementById('b-actividad').value.trim(),
            hora_inicio: document.getElementById('b-inicio').value,
            hora_fin: document.getElementById('b-fin').value,
            tipo: document.getElementById('b-tipo').value
        };

        try {
            const res = await fetch('/api/cronograma', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                cerrarModal();
                await cargarDiasOcupadosDelMes();
                renderizarAlmanaque();
                cargarCronogramaDia(payload.fecha);
            }
        } catch (_) {
            Swal.fire({ icon: 'error', title: 'Error al guardar actividad' });
        }
    });

    // 3. FUNCIONES DEL ALMANAQUE
    async function cargarDiasOcupadosDelMes() {
        const year = mesVisualizado.getFullYear();
        const month = String(mesVisualizado.getMonth() + 1).padStart(2, '0');
        const mesStr = `${year}-${month}`;

        try {
            const res = await fetch(`/api/cronograma/mes?mes=${mesStr}`);
            const json = await res.json();
            diasOcupadosMap = json.dias || {};
        } catch (_) {
            diasOcupadosMap = {};
        }
    }

    function renderizarAlmanaque() {
        const year = mesVisualizado.getFullYear();
        const month = mesVisualizado.getMonth();

        // Título del mes
        const nombreMes = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(mesVisualizado);
        tituloMes.innerText = nombreMes;

        // Primer día del mes y total de días
        const primerDia = new Date(year, month, 1);
        const ultimoDia = new Date(year, month + 1, 0);
        const totalDias = ultimoDia.getDate();

        // Ajustar offset Lunes = 0, Domingo = 6
        let diaInicioSemana = primerDia.getDay() - 1;
        if (diaInicioSemana === -1) diaInicioSemana = 6;

        grillaAlmanaque.innerHTML = '';

        // Celdas vacías del mes anterior
        for (let i = 0; i < diaInicioSemana; i++) {
            const vacio = document.createElement('div');
            vacio.className = 'h-10 sm:h-12';
            grillaAlmanaque.appendChild(vacio);
        }

        const hoyISO = formatearFechaISO(new Date());
        const seleccionadoISO = formatearFechaISO(fechaSeleccionada);

        // Generar días del mes
        for (let d = 1; d <= totalDias; d++) {
            const fechaActual = new Date(year, month, d);
            const fechaISO = formatearFechaISO(fechaActual);

            const esHoy = fechaISO === hoyISO;
            const esSeleccionado = fechaISO === seleccionadoISO;
            const actividadesDelDia = diasOcupadosMap[fechaISO] || [];

            const btnDia = document.createElement('button');
            btnDia.type = 'button';
            btnDia.className = `h-10 sm:h-12 rounded-xl flex flex-col items-center justify-center relative transition text-xs font-mono font-bold
                ${esSeleccionado ? 'bg-red-950 text-white shadow-md ring-2 ring-red-500 font-black' : 
                  esHoy ? 'bg-red-50 text-red-700 border border-red-200' : 'hover:bg-gray-100 text-gray-700'}`;

            // Puntos de color por tipo
            let dotsHTML = '';
            if (actividadesDelDia.length > 0) {
                dotsHTML = `<div class="flex space-x-0.5 mt-0.5">` + 
                    actividadesDelDia.slice(0, 3).map(tipo => {
                        const color = {
                            Personal: 'bg-purple-500',
                            Desarrollo: 'bg-blue-500',
                            Guardia: 'bg-red-600',
                            Reunión: 'bg-amber-500'
                        }[tipo] || 'bg-gray-400';
                        return `<span class="w-1.5 h-1.5 rounded-full ${color}"></span>`;
                    }).join('') + `</div>`;
            }

            btnDia.innerHTML = `<span>${d}</span>${dotsHTML}`;

            btnDia.addEventListener('click', () => {
                fechaSeleccionada = fechaActual;
                renderizarAlmanaque();
                cargarCronogramaDia(fechaISO);
            });

            grillaAlmanaque.appendChild(btnDia);
        }
    }

    // 4. FUNCIONES DEL TIMELINE
    async function cargarCronogramaDia(fechaISO) {
        const opciones = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
        const fechaObj = new Date(fechaISO + 'T00:00:00');
        labelDiaSeleccionado.innerText = fechaObj.toLocaleDateString('es-ES', opciones);

        try {
            const res = await fetch(`/api/cronograma?fecha=${fechaISO}`);
            const json = await res.json();
            renderizarGrillaHoras(json.data || [], fechaISO);
        } catch (_) {
            contenedorSlots.innerHTML = '<p class="text-center text-red-500 py-4">Error al cargar cronograma.</p>';
        }
    }

    function renderizarGrillaHoras(bloques, fechaISO) {
        contenedorSlots.innerHTML = '';

        for (let h = 8; h <= 22; h++) {
            const horaPad = String(h).padStart(2, '0') + ':00';
            const horaSiguiente = String(h + 1).padStart(2, '0') + ':00';

            const actividad = bloques.find(b => b.hora_inicio.startsWith(String(h).padStart(2, '0')));

            const divSlot = document.createElement('div');
            divSlot.className = 'flex items-center p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition text-xs bg-white';

            if (actividad) {
                const colorBadge = {
                    Personal: 'bg-purple-100 text-purple-800 border-purple-200',
                    Desarrollo: 'bg-blue-100 text-blue-800 border-blue-200',
                    Guardia: 'bg-red-100 text-red-800 border-red-200',
                    Reunión: 'bg-amber-100 text-amber-800 border-amber-200'
                }[actividad.tipo] || 'bg-gray-100 text-gray-800 border-gray-200';

                divSlot.innerHTML = `
                    <span class="w-24 font-mono font-bold text-gray-500">${actividad.hora_inicio} - ${actividad.hora_fin}</span>
                    <div class="flex-1 px-3 flex items-center justify-between">
                        <span class="font-bold text-gray-800">${actividad.actividad}</span>
                        <span class="px-2 py-0.5 rounded-full border text-[10px] font-semibold ${colorBadge}">${actividad.tipo}</span>
                    </div>
                    <button onclick="eliminarBloque(${actividad.id}, '${fechaISO}')" class="text-red-500 hover:bg-red-50 p-1.5 rounded transition" title="Eliminar"><i class="fa-solid fa-trash-can"></i></button>
                `;
            } else {
                divSlot.innerHTML = `
                    <span class="w-24 font-mono text-gray-400">${horaPad}</span>
                    <span class="flex-1 text-gray-400 italic">Espacio libre</span>
                    <button onclick="abrirReserva('${fechaISO}', '${horaPad}', '${horaSiguiente}')" class="text-red-700 hover:bg-red-50 px-2 py-1 rounded font-bold transition">+ Reservar</button>
                `;
            }

            contenedorSlots.appendChild(divSlot);
        }
    }

    // Modal reserva prellenado con la fecha que tocaste en el almanaque
    window.abrirReserva = function(fecha, inicio, fin) {
        formBloque.reset();
        document.getElementById('b-fecha').value = fecha;
        document.getElementById('b-inicio').value = inicio;
        document.getElementById('b-fin').value = fin;
        modalBloque.classList.add('active');
        modalBloque.classList.remove('hidden');
    };

    window.eliminarBloque = async function(id, fechaISO) {
        if (confirm('¿Eliminar esta actividad?')) {
            await fetch(`/api/cronograma/${id}`, { method: 'DELETE' });
            await cargarDiasOcupadosDelMes();
            renderizarAlmanaque();
            cargarCronogramaDia(fechaISO);
        }
    };

    function formatearFechaISO(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
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

    function inicializarSidebarMovil() {
        const sidebar = document.getElementById('sidebar-main');
        const backdrop = document.getElementById('sidebar-backdrop');
        const btnAbrir = document.getElementById('btn-abrir-sidebar-movil');
        const btnCerrar = document.getElementById('btn-cerrar-sidebar-movil');

        if (btnAbrir && sidebar && backdrop) {
            btnAbrir.addEventListener('click', () => {
                sidebar.classList.add('sidebar-abierto');
                backdrop.classList.add('active');
            });
            const cerrar = () => {
                sidebar.classList.remove('sidebar-abierto');
                backdrop.classList.remove('active');
            };
            if (btnCerrar) btnCerrar.addEventListener('click', cerrar);
            backdrop.addEventListener('click', cerrar);
        }
    }
});