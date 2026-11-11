package models

import "time"

type BloqueHorario struct {
	ID         int       `json:"id"`
	Fecha      string    `json:"fecha"`       // Formato YYYY-MM-DD
	HoraInicio string    `json:"hora_inicio"` // Formato HH:MM
	HoraFin    string    `json:"hora_fin"`    // Formato HH:MM
	Actividad  string    `json:"actividad"`
	Tipo       string    `json:"tipo"` // 'Personal', 'Desarrollo', 'Guardia', 'Reunión'
	Completado bool      `json:"completado"`
	CreadoEn   time.Time `json:"creado_en"`
}

// Representa el resumen de días ocupados para pintar los puntos en el calendario mensual
type DiaActivoMes struct {
	Fecha string   `json:"fecha"`
	Tipos []string `json:"tipos"`
}
