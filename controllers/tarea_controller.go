package controllers

import (
	"database/sql"
	"time"

	"agenda_go/models"

	"github.com/gofiber/fiber/v2"
)

type TareaController struct {
	DB *sql.DB
}

// 1. Listar tareas
func (tc *TareaController) Listar(c *fiber.Ctx) error {
	query := `
		SELECT id, titulo, COALESCE(descripcion, ''), COALESCE(modulo, 'General'), 
		       COALESCE(tecnologia, 'General'), estado, prioridad, 
		       to_char(fecha_programada, 'YYYY-MM-DD'), 
		       COALESCE(to_char(fecha_limite, 'YYYY-MM-DD'), ''), 
		       origen, creado_en
		FROM agenda_tareas 
		ORDER BY id DESC`

	rows, err := tc.DB.Query(query)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	defer rows.Close()

	var tareas []models.Tarea
	for rows.Next() {
		var t models.Tarea
		if err := rows.Scan(&t.ID, &t.Titulo, &t.Descripcion, &t.Modulo,
			&t.Tecnologia, &t.Estado, &t.Prioridad,
			&t.FechaProgramada, &t.FechaLimite, &t.Origen, &t.CreadoEn); err != nil {
			continue
		}
		tareas = append(tareas, t)
	}

	return c.JSON(fiber.Map{"status": "ok", "data": tareas})
}

// 2. Crear nueva tarea
func (tc *TareaController) Crear(c *fiber.Ctx) error {
	var t models.Tarea
	if err := c.BodyParser(&t); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "JSON inválido"})
	}

	if t.Titulo == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "El título es obligatorio"})
	}
	if t.Estado == "" {
		t.Estado = "pendiente"
	}
	if t.FechaProgramada == "" {
		t.FechaProgramada = time.Now().Format("2006-01-02")
	}
	if t.Origen == "" {
		t.Origen = "web"
	}

	query := `
		INSERT INTO agenda_tareas (titulo, descripcion, modulo, tecnologia, estado, prioridad, fecha_programada, fecha_limite, origen)
		VALUES ($1, $2, $3, $4, $5, $6, $7, NULLIF($8, '')::date, $9)
		RETURNING id`

	err := tc.DB.QueryRow(query, t.Titulo, t.Descripcion, t.Modulo, t.Tecnologia,
		t.Estado, t.Prioridad, t.FechaProgramada, t.FechaLimite, t.Origen).Scan(&t.ID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"status": "ok", "tarea": t})
}

// 3. Cambiar estado rápido
func (tc *TareaController) CambiarEstado(c *fiber.Ctx) error {
	id := c.Params("id")
	var req models.CambiarEstadoRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Cuerpo inválido"})
	}

	query := `UPDATE agenda_tareas SET estado = $1, actualizado_en = NOW() WHERE id = $2`
	_, err := tc.DB.Exec(query, req.Estado, id)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"status": "ok", "mensaje": "Estado actualizado"})
}

// 4. Aplazar tarea a otra fecha
func (tc *TareaController) Aplazar(c *fiber.Ctx) error {
	id := c.Params("id")
	var req models.AplazarTareaRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Cuerpo inválido"})
	}

	query := `UPDATE agenda_tareas SET fecha_programada = $1, estado = 'pendiente', actualizado_en = NOW() WHERE id = $2`
	_, err := tc.DB.Exec(query, req.NuevaFecha, id)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"status": "ok", "mensaje": "Tarea aplazada con éxito"})
}

// 5. Actualizar tarea completa
func (tc *TareaController) Actualizar(c *fiber.Ctx) error {
	id := c.Params("id")
	var t models.Tarea
	if err := c.BodyParser(&t); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "JSON inválido"})
	}

	query := `
		UPDATE agenda_tareas 
		SET titulo = $1, modulo = $2, tecnologia = $3, prioridad = $4, 
		    estado = $5, fecha_programada = $6, fecha_limite = NULLIF($7, '')::date, 
		    descripcion = $8, actualizado_en = NOW()
		WHERE id = $9`

	_, err := tc.DB.Exec(query, t.Titulo, t.Modulo, t.Tecnologia, t.Prioridad,
		t.Estado, t.FechaProgramada, t.FechaLimite, t.Descripcion, id)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"status": "ok", "mensaje": "Tarea actualizada correctamente"})
}

// 6. Eliminar tarea
func (tc *TareaController) Eliminar(c *fiber.Ctx) error {
	id := c.Params("id")
	query := `DELETE FROM agenda_tareas WHERE id = $1`
	_, err := tc.DB.Exec(query, id)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"status": "ok", "mensaje": "Tarea eliminada"})
}
