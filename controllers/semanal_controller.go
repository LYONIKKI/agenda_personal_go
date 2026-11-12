package controllers

import (
	"database/sql"
	"time"

	"agenda_go/models"

	"github.com/gofiber/fiber/v2"
)

type SemanalController struct {
	DB *sql.DB
}

func (sc *SemanalController) ObtenerSeguimiento(c *fiber.Ctx) error {
	fechaParam := c.Query("fecha", time.Now().Format("2006-01-02"))
	fechaBase, err := time.Parse("2006-01-02", fechaParam)
	if err != nil {
		fechaBase = time.Now()
	}

	offset := int(fechaBase.Weekday())
	if offset == 0 {
		offset = 7
	}
	lunes := fechaBase.AddDate(0, 0, -(offset - 1))
	domingo := lunes.AddDate(0, 0, 6)
	lunesStr := lunes.Format("2006-01-02")
	domingoStr := domingo.Format("2006-01-02")

	// 1. Obtener tareas activas en la semana (casteando timestamp a date)
	queryTareas := `
		SELECT id, titulo, COALESCE(modulo, 'General'), COALESCE(tecnologia, 'General'), 
		       estado, prioridad, to_char(fecha_programada, 'YYYY-MM-DD'), 
		       COALESCE(to_char(fecha_limite, 'YYYY-MM-DD'), '')
		FROM agenda_tareas
		WHERE (DATE(fecha_programada) BETWEEN $1::date AND $2::date) 
		   OR (DATE(fecha_limite) BETWEEN $1::date AND $2::date)
		ORDER BY fecha_programada ASC, id ASC`

	rows, err := sc.DB.Query(queryTareas, lunesStr, domingoStr)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	defer rows.Close()

	var tareas []models.TareaSemanal
	for rows.Next() {
		var t models.TareaSemanal
		if err := rows.Scan(&t.ID, &t.Titulo, &t.Modulo, &t.Tecnologia, &t.Estado, &t.Prioridad, &t.FechaProgramada, &t.FechaLimite); err == nil {
			tareas = append(tareas, t)
		}
	}

	// 2. Obtener todos los avances registrados en esa semana
	queryAvances := `
		SELECT id, tarea_id, to_char(fecha, 'YYYY-MM-DD'), 
		       to_char(hora_inicio, 'HH24:MI'), to_char(hora_fin, 'HH24:MI'), 
		       COALESCE(minutos_invertidos, 0), nota
		FROM agenda_tarea_avances
		WHERE fecha BETWEEN $1::date AND $2::date
		ORDER BY hora_inicio ASC`

	rowsAv, err := sc.DB.Query(queryAvances, lunesStr, domingoStr)
	avancesPorTareaFecha := make(map[string][]models.TareaAvance) // clave: "tareaID_YYYY-MM-DD"
	if err == nil {
		defer rowsAv.Close()
		for rowsAv.Next() {
			var a models.TareaAvance
			if err := rowsAv.Scan(&a.ID, &a.TareaID, &a.Fecha, &a.HoraInicio, &a.HoraFin, &a.MinutosInvertidos, &a.Nota); err == nil {
				clave := time.Now().Format("") // dummy
				_ = clave
				key := formatKey(a.TareaID, a.Fecha)
				avancesPorTareaFecha[key] = append(avancesPorTareaFecha[key], a)
			}
		}
	}

	nombresDias := []string{"Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"}
	hoyStr := time.Now().Format("2006-01-02")
	dias := make([]models.DiaSemana, 7)

	for i := 0; i < 7; i++ {
		diaActual := lunes.AddDate(0, 0, i)
		diaStr := diaActual.Format("2006-01-02")

		tareasDelDia := []models.TareaSemanal{}
		completadas := 0
		minutosDiaTotal := 0

		for _, t := range tareas {
			avancesHoy := avancesPorTareaFecha[formatKey(t.ID, diaStr)]
			if t.FechaProgramada == diaStr || t.FechaLimite == diaStr || len(avancesHoy) > 0 {
				copia := t
				copia.AvancesDia = avancesHoy
				minTarea := 0
				for _, av := range avancesHoy {
					minTarea += av.MinutosInvertidos
				}
				copia.MinutosDia = minTarea
				minutosDiaTotal += minTarea

				tareasDelDia = append(tareasDelDia, copia)
				if copia.Estado == "completado" {
					completadas++
				}
			}
		}

		dias[i] = models.DiaSemana{
			Fecha:          diaStr,
			DiaNombre:      nombresDias[i],
			EsHoy:          diaStr == hoyStr,
			Total:          len(tareasDelDia),
			Completadas:    completadas,
			MinutosTotales: minutosDiaTotal,
			Tareas:         tareasDelDia,
		}
	}

	return c.JSON(fiber.Map{
		"status": "ok",
		"data": models.ResumenSemanalResponse{
			SemanaInicio: lunesStr,
			SemanaFin:    domingoStr,
			Dias:         dias,
		},
	})
}

func formatKey(id int, fecha string) string {
	return string(rune(id)) + "_" + fecha
}
