package controllers

import (
	"database/sql"
	"strconv"
	"time"

	"agenda_go/models"

	"github.com/gofiber/fiber/v2"
)

type AvanceController struct {
	DB *sql.DB
}

// Listar avances de una tarea específica
func (ac *AvanceController) ListarPorTarea(c *fiber.Ctx) error {
	tareaID := c.Params("id")

	query := `
		SELECT id, tarea_id, to_char(fecha, 'YYYY-MM-DD'), 
		       to_char(hora_inicio, 'HH24:MI'), to_char(hora_fin, 'HH24:MI'), 
		       COALESCE(minutos_invertidos, 0), nota, creado_en
		FROM agenda_tarea_avances
		WHERE tarea_id = $1
		ORDER BY fecha DESC, hora_inicio DESC`

	rows, err := ac.DB.Query(query, tareaID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	defer rows.Close()

	avances := []models.TareaAvance{}
	totalMinutos := 0
	for rows.Next() {
		var a models.TareaAvance
		if err := rows.Scan(&a.ID, &a.TareaID, &a.Fecha, &a.HoraInicio, &a.HoraFin, &a.MinutosInvertidos, &a.Nota, &a.CreadoEn); err == nil {
			avances = append(avances, a)
			totalMinutos += a.MinutosInvertidos
		}
	}

	return c.JSON(fiber.Map{
		"status":        "ok",
		"total_minutos": totalMinutos,
		"data":          avances,
	})
}

// Registrar un nuevo avance técnico con cálculo de tiempo
func (ac *AvanceController) Crear(c *fiber.Ctx) error {
	tareaID, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "ID de tarea inválido"})
	}

	var a models.TareaAvance
	if err := c.BodyParser(&a); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "JSON inválido"})
	}

	if a.Nota == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "La nota técnica es obligatoria"})
	}
	if a.Fecha == "" {
		a.Fecha = time.Now().Format("2006-01-02")
	}

	// Calcular minutos entre HoraInicio y HoraFin
	tIni, err1 := time.Parse("15:04", a.HoraInicio)
	tFin, err2 := time.Parse("15:04", a.HoraFin)
	if err1 != nil || err2 != nil || !tFin.After(tIni) {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "La hora fin debe ser mayor a la hora inicio"})
	}
	a.MinutosInvertidos = int(tFin.Sub(tIni).Minutes())
	a.TareaID = tareaID

	query := `
		INSERT INTO agenda_tarea_avances (tarea_id, fecha, hora_inicio, hora_fin, minutos_invertidos, nota)
		VALUES ($1, $2::date, $3::time, $4::time, $5, $6)
		RETURNING id`

	err = ac.DB.QueryRow(query, a.TareaID, a.Fecha, a.HoraInicio, a.HoraFin, a.MinutosInvertidos, a.Nota).Scan(&a.ID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"status": "ok", "avance": a})
}

// Eliminar un registro de avance
func (ac *AvanceController) Eliminar(c *fiber.Ctx) error {
	avanceID := c.Params("avanceId")
	_, err := ac.DB.Exec(`DELETE FROM agenda_tarea_avances WHERE id = $1`, avanceID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"status": "ok", "mensaje": "Registro eliminado"})
}
