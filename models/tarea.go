package models

import "time"

type Tarea struct {
	ID              int       `json:"id"`
	Titulo          string    `json:"titulo"`
	Descripcion     string    `json:"descripcion"`
	Modulo          string    `json:"modulo"`           // ej: 'Laboratorio', 'Emergencia', 'Infraestructura'
	Tecnologia      string    `json:"tecnologia"`       // ej: 'Rust', 'Go', 'PHP', 'PostgreSQL'
	Estado          string    `json:"estado"`           // 'backlog', 'pendiente', 'en_progreso', 'completado'
	Prioridad       string    `json:"prioridad"`        // 'baja', 'media', 'alta', 'urgente'
	FechaProgramada string    `json:"fecha_programada"` // Formato YYYY-MM-DD
	FechaLimite     string    `json:"fecha_limite"`     // Formato YYYY-MM-DD (Fecha objetivo/culminación)
	Origen          string    `json:"origen"`           // 'web' o 'telegram'
	CreadoEn        time.Time `json:"creado_en"`
}

type CambiarEstadoRequest struct {
	Estado string `json:"estado"`
}

type AplazarTareaRequest struct {
	NuevaFecha string `json:"nueva_fecha"` // YYYY-MM-DD
}
