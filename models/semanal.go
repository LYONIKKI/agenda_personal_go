package models

type TareaSemanal struct {
	ID              int           `json:"id"`
	Titulo          string        `json:"titulo"`
	Modulo          string        `json:"modulo"`
	Tecnologia      string        `json:"tecnologia"`
	Estado          string        `json:"estado"`
	Prioridad       string        `json:"prioridad"`
	FechaProgramada string        `json:"fecha_programada"`
	FechaLimite     string        `json:"fecha_limite"`
	MinutosDia      int           `json:"minutos_dia"`
	AvancesDia      []TareaAvance `json:"avances_dia"`
}

type DiaSemana struct {
	Fecha          string         `json:"fecha"`
	DiaNombre      string         `json:"dia_nombre"`
	EsHoy          bool           `json:"es_hoy"`
	Total          int            `json:"total"`
	Completadas    int            `json:"completadas"`
	MinutosTotales int            `json:"minutos_totales"`
	Tareas         []TareaSemanal `json:"tareas"`
}

type ResumenSemanalResponse struct {
	SemanaInicio string      `json:"semana_inicio"`
	SemanaFin    string      `json:"semana_fin"`
	Dias         []DiaSemana `json:"dias"`
}
