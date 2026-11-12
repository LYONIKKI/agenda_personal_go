package models

import "time"

type Tarea struct {
	ID              int       `json:"id"`
	Titulo          string    `json:"titulo"`
	Descripcion     string    `json:"descripcion"`
	Modulo          string    `json:"modulo"`
	Tecnologia      string    `json:"tecnologia"`
	Estado          string    `json:"estado"`
	Prioridad       string    `json:"prioridad"`
	FechaProgramada string    `json:"fecha_programada"` // Formato YYYY-MM-DD HH:MM
	FechaLimite     string    `json:"fecha_limite"`     // Formato YYYY-MM-DD HH:MM
	MinutosTotales  int       `json:"minutos_totales"`  // Suma de avances registrados
	Origen          string    `json:"origen"`
	CreadoEn        time.Time `json:"creado_en"`
}

type CambiarEstadoRequest struct {
	Estado string `json:"estado"`
}

type AplazarTareaRequest struct {
	NuevaFecha string `json:"nueva_fecha"`
}
