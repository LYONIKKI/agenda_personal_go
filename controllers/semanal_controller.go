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

	// Calcular el Lunes de esa semana
	offset := int(fechaBase.Weekday())
	if offset == 0 {
		offset = 7 // Domingo es 7
	}
	lunes := fechaBase.AddDate(0, 0, -(offset - 1))
	domingo := lunes.AddDate(0, 0, 6)

	// Consultar tareas de esa semana (por fecha_programada o fecha_limite)
	query := `
		SELECT id, titulo, COALESCE(modulo, 'General'), COALESCE(tecnologia, 'General'), 
		       estado, prioridad, to_char(fecha_programada, 'YYYY-MM-DD'), 
		       COALESCE(to_char(fecha_limite, 'YYYY-MM-DD'), '')
		FROM agenda_tareas
		WHERE (fecha_programada BETWEEN $1 AND $2) OR (fecha_limite BETWEEN $1 AND $2)
		ORDER BY fecha_programada ASC, id ASC`

	rows, err := sc.DB.Query(query, lunes.Format("2006-01-02"), domingo.Format("2006-01-02"))
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

	nombresDias := []string{"Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"}
	hoyStr := time.Now().Format("2006-01-02")
	dias := make([]models.DiaSemana, 7)

	for i := 0; i < 7; i++ {
		diaActual := lunes.AddDate(0, 0, i)
		diaStr := diaActual.Format("2006-01-02")

		tareasDelDia := []models.TareaSemanal{}
		completadas := 0
		for _, t := range tareas {
			if t.FechaProgramada == diaStr || t.FechaLimite == diaStr {
				tareasDelDia = append(tareasDelDia, t)
				if t.Estado == "completado" {
					completadas++
				}
			}
		}

		dias[i] = models.DiaSemana{
			Fecha:       diaStr,
			DiaNombre:   nombresDias[i],
			EsHoy:       diaStr == hoyStr,
			Total:       len(tareasDelDia),
			Completadas: completadas,
			Tareas:      tareasDelDia,
		}
	}

	return c.JSON(fiber.Map{
		"status": "ok",
		"data": models.ResumenSemanalResponse{
			SemanaInicio: lunes.Format("2006-01-02"),
			SemanaFin:    domingo.Format("2006-01-02"),
			Dias:         dias,
		},
	})
}
