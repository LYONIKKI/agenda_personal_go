package controllers

import (
	"database/sql"
	"time"

	"agenda_go/models"

	"github.com/gofiber/fiber/v2"
)

type CronogramaController struct {
	DB *sql.DB
}

// 1. Listar bloques horarios de un día puntual
func (cc *CronogramaController) ListarPorFecha(c *fiber.Ctx) error {
	fecha := c.Query("fecha", time.Now().Format("2006-01-02"))

	query := `
		SELECT id, to_char(fecha, 'YYYY-MM-DD'), to_char(hora_inicio, 'HH24:MI'), 
		       to_char(hora_fin, 'HH24:MI'), actividad, tipo, completado, creado_en
		FROM agenda_cronograma
		WHERE fecha = $1
		ORDER BY hora_inicio ASC`

	rows, err := cc.DB.Query(query, fecha)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	defer rows.Close()

	bloques := []models.BloqueHorario{}
	for rows.Next() {
		var b models.BloqueHorario
		if err := rows.Scan(&b.ID, &b.Fecha, &b.HoraInicio, &b.HoraFin, &b.Actividad, &b.Tipo, &b.Completado, &b.CreadoEn); err != nil {
			continue
		}
		bloques = append(bloques, b)
	}

	return c.JSON(fiber.Map{"status": "ok", "fecha": fecha, "data": bloques})
}

// 2. Obtener resumen de días con actividad en un mes determinado (YYYY-MM)
func (cc *CronogramaController) DiasOcupadosMes(c *fiber.Ctx) error {
	mes := c.Query("mes", time.Now().Format("2006-01")) // ej: 2026-11

	query := `
		SELECT to_char(fecha, 'YYYY-MM-DD') AS dia, ARRAY_AGG(DISTINCT tipo) AS tipos
		FROM agenda_cronograma
		WHERE to_char(fecha, 'YYYY-MM') = $1
		GROUP BY fecha
		ORDER BY fecha ASC`

	rows, err := cc.DB.Query(query, mes)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	defer rows.Close()

	diasOcupados := make(map[string][]string)
	for rows.Next() {
		var dia string
		var tipos []string
		// pq soporta arrays en scan
		if err := rows.Scan(&dia, pqArrayScan(&tipos)); err == nil {
			diasOcupados[dia] = tipos
		}
	}

	return c.JSON(fiber.Map{"status": "ok", "mes": mes, "dias": diasOcupados})
}

// 3. Crear nuevo bloque
func (cc *CronogramaController) Crear(c *fiber.Ctx) error {
	var b models.BloqueHorario
	if err := c.BodyParser(&b); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "JSON inválido"})
	}

	if b.Fecha == "" {
		b.Fecha = time.Now().Format("2006-01-02")
	}

	query := `
		INSERT INTO agenda_cronograma (fecha, hora_inicio, hora_fin, actividad, tipo)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id`

	err := cc.DB.QueryRow(query, b.Fecha, b.HoraInicio, b.HoraFin, b.Actividad, b.Tipo).Scan(&b.ID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"status": "ok", "bloque": b})
}

// 4. Eliminar bloque
func (cc *CronogramaController) Eliminar(c *fiber.Ctx) error {
	id := c.Params("id")
	_, err := cc.DB.Exec(`DELETE FROM agenda_cronograma WHERE id = $1`, id)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"status": "ok", "mensaje": "Bloque eliminado"})
}

// Helper para parsear array text de Postgres de forma estándar sin dependencias extra
func pqArrayScan(dst *[]string) sql.Scanner {
	return &stringArrayScanner{dst}
}

type stringArrayScanner struct {
	dst *[]string
}

func (s *stringArrayScanner) Scan(src interface{}) error {
	if src == nil {
		*s.dst = []string{}
		return nil
	}
	switch v := src.(type) {
	case []byte:
		*s.dst = parsePqArray(string(v))
	case string:
		*s.dst = parsePqArray(v)
	}
	return nil
}

func parsePqArray(str string) []string {
	if len(str) < 2 {
		return []string{}
	}
	str = str[1 : len(str)-1] // quitar { }
	if str == "" {
		return []string{}
	}
	var res []string
	curr := ""
	for _, ch := range str {
		if ch == ',' {
			res = append(res, curr)
			curr = ""
		} else if ch != '"' {
			curr += string(ch)
		}
	}
	if curr != "" {
		res = append(res, curr)
	}
	return res
}
