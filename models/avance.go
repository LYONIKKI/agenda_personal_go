package models

import "time"

type TareaAvance struct {
	ID                int       `json:"id"`
	TareaID           int       `json:"tarea_id"`
	Fecha             string    `json:"fecha"`       // YYYY-MM-DD
	HoraInicio        string    `json:"hora_inicio"` // HH:MM
	HoraFin           string    `json:"hora_fin"`    // HH:MM
	MinutosInvertidos int       `json:"minutos_invertidos"`
	Nota              string    `json:"nota"`
	CreadoEn          time.Time `json:"creado_en"`
}
