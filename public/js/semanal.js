document.addEventListener('DOMContentLoaded', async () => {
    // 1. Cargar el Sidebar modular y activar enlace
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

    let fechaPivote = new Date();
    const contenedor = document.getElementById('contenedor-dias-semana');
    const labelRango = document.getElementById('label-rango-semana');
    const btnAnt = document.getElementById('btn-semana-ant');
    const btnSig = document.getElementById('btn-semana-sig');

    cargarSemana(fechaPivote);

    btnAnt.addEventListener('click', () => {
        fechaPivote.setDate(fechaPivote.getDate() - 7);
        cargarSemana(fechaPivote);
    });

    btnSig.addEventListener('click', () => {
        fechaPivote.setDate(fechaPivote.getDate() + 7);
        cargarSemana(fechaPivote);
    });

    async function cargarSemana(fecha) {
        const fechaStr = fecha.toISOString().split('T')[0];
        try {
            const res = await fetch(`/api/semanal?fecha=${fechaStr}`);
            const json = await res.json();
            if (json.status === 'ok') {
                labelRango.innerText = `${json.data.semana_inicio} al ${json.data.semana_fin}`;
                renderizarSemana(json.data.dias);
            }
        } catch (_) {
            contenedor.innerHTML = '<p class="text-red-500 col-span-7 text-center">Error al cargar la semana.</p>';
        }
    }

    function formatearHoras(mins) {
        if (!mins || mins <= 0) return '';
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return `${h}h ${m}m`;
    }

    function renderizarSemana(dias) {
        contenedor.innerHTML = dias.map(d => {
            const estiloHoy = d.es_hoy ? 'border-red-500 bg-red-50/20 shadow-md ring-1 ring-red-400' : 'border-gray-200 bg-white';
            const tiempoTotalDia = d.minutos_totales > 0 
                ? `<span class="text-[9px] font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200"><i class="fa-solid fa-stopwatch mr-0.5"></i>${formatearHoras(d.minutos_totales)}</span>` 
                : '';

            return `
                <div class="rounded-xl border ${estiloHoy} p-3 flex flex-col min-h-[450px]">
                    <div class="border-b border-gray-100 pb-2 mb-2 flex justify-between items-start">
                        <div>
                            <p class="font-bold text-xs uppercase text-gray-800">${d.dia_nombre}</p>
                            <p class="font-mono text-[10px] text-gray-400">${d.fecha}</p>
                            <div class="mt-1">${tiempoTotalDia}</div>
                        </div>
                        <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${d.completadas === d.total && d.total > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'}">
                            ${d.completadas}/${d.total}
                        </span>
                    </div>

                    <div class="space-y-2.5 flex-1 overflow-y-auto">
                        ${d.tareas.length === 0 ? '<p class="text-gray-400 italic text-[11px] text-center pt-8">Sin entregables</p>' : ''}
                        ${d.tareas.map(t => `
                            <div class="p-2.5 rounded-lg border border-gray-200 text-xs shadow-sm bg-white hover:border-red-400 transition">
                                <div class="flex items-center justify-between">
                                    <span class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${t.prioridad === 'urgente' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}">${t.prioridad}</span>
                                    ${t.minutos_dia > 0 ? `<span class="text-[9px] font-mono font-bold text-indigo-600">${formatearHoras(t.minutos_dia)}</span>` : ''}
                                </div>
                                <h4 class="font-bold text-gray-800 text-[11px] mt-1 leading-tight">${t.titulo}</h4>
                                
                                ${t.avances_dia && t.avances_dia.length > 0 ? `
                                    <div class="mt-2 pt-1.5 border-t border-dashed border-gray-200 space-y-1">
                                        <span class="text-[9px] font-bold text-indigo-700 uppercase block">Avances técnicos hoy:</span>
                                        ${t.avances_dia.map(av => `
                                            <div class="bg-indigo-50/70 p-1.5 rounded text-[10px] text-gray-700 border border-indigo-100 leading-snug">
                                                <span class="font-mono font-bold text-indigo-800 block">${av.hora_inicio} - ${av.hora_fin}:</span>
                                                <span>${av.nota}</span>
                                            </div>
                                        `).join('')}
                                    </div>
                                ` : ''}

                                <div class="mt-2 flex items-center justify-between text-[10px] text-gray-500 font-mono">
                                    <span>${t.tecnologia}</span>
                                    <span class="font-semibold uppercase ${t.estado === 'completado' ? 'text-emerald-700' : 'text-red-700'}">${t.estado}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');
    }

    function activarRutaSidebar() {
        const pathActual = window.location.pathname;
        const items = document.querySelectorAll('.sidebar-item');
        items.forEach(link => {
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