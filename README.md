# Agenda Personal & Sprint Manager 🍷

Sistema modular de gestión de tareas, seguimiento semanal y cronograma diario interactivo con vista de almanaque, diseñado para planificación técnica y organización de rutinas.

---

## 🚀 Arquitectura y Tecnologías

- **Backend:** Go (Fiber v2) bajo arquitectura modular MVC.
- **Base de Datos:** PostgreSQL (Pool de conexiones).
- **Frontend:** Vanilla JavaScript, HTML5, Tailwind CSS y FontAwesome.
- **Estilos:** Paleta personalizada *Vino y Rubí Metálico* con soporte responsive móvil/escritorio.
- **Despliegue:** Linux (Ubuntu Server) gestionado con `systemd`.

---

## 📦 Módulos del Sistema

1. **Tablero Kanban (`/`):**
   - Flujo de estados: `Backlog`, `Hoy / Pendiente`, `En Progreso` y `Completado`.
   - Control de fechas programadas y fechas límite (`fecha_limite`).
   - Prioridades categorizadas (`baja`, `media`, `alta`, `urgente`) y filtrado en tiempo real.

2. **Almanaque & Cronograma (`/agenda`):**
   - Panel izquierdo con mini-almanaque mensual interactivo y heat-dots de colores según tipo de actividad.
   - Panel derecho con time-slots de 08:00 a 22:00 sincronizados por día.
   - Categorías operativas: `Personal`, `Desarrollo`, `Guardia` y `Reunión`.

3. **Seguimiento Semanal (`/semanal`):**
   - Matriz horizontal de 7 días (Lunes a Domingo) para balance de carga semanal.
   - Detección reactiva del día actual y porcentaje de completitud.

4. **Sidebar Dinámico:**
   - Detección automática de la ruta activa (`item-active-vino`).

---

## 🗄️ Esquema de Base de Datos (PostgreSQL)

```sql
-- Tabla de Tareas / Kanban
migra desde schemas/schema.sql(se hace esto para que obtengas las tablas)(el ssitema se hizo con postgres)

para migrar crea un .env usa el ejemplo del .env.example

compila de esta manera para eliminar errores

go mod tidy
go build -o agenda_api .
./agenda_api

👤 Autor
Ing. Anhgelo Vega

Especialista en Seguridad TI, Arquitecto de Sistemas, SENIOR DBA, SYSADMIN, Redes y Desarrollo de Software

Colegio de Ingenieros del Perú (CIP 381913)