package controllers

import (
	"database/sql"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/session"
)

type AuthController struct {
	Store  *session.Store
	DBAuth *sql.DB
}

type LoginRequest struct {
	Usuario  string `json:"usuario"`
	Password string `json:"password"`
}

func (a *AuthController) Login(c *fiber.Ctx) error {
	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"status":  "error",
			"mensaje": "Parámetros inválidos",
		})
	}

	var nombre string
	query := `SELECT nombre FROM agenda_usuarios WHERE usuario = $1 AND password = $2 AND estado = 1`
	err := a.DBAuth.QueryRow(query, req.Usuario, req.Password).Scan(&nombre)

	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"status":  "error",
			"mensaje": "Usuario o contraseña incorrectos",
		})
	}

	// Iniciar sesión
	sess, err := a.Store.Get(c)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"status": "error", "mensaje": "Error de sesión"})
	}

	sess.Set("autenticado", true)
	sess.Set("usuario", req.Usuario)
	sess.Set("nombre", nombre)
	if err := sess.Save(); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"status": "error", "mensaje": "Error al guardar sesión"})
	}

	return c.JSON(fiber.Map{"status": "ok", "mensaje": "Autenticado con éxito"})
}

func (a *AuthController) Logout(c *fiber.Ctx) error {
	sess, err := a.Store.Get(c)
	if err == nil {
		sess.Destroy()
	}
	return c.Redirect("/login")
}

func (a *AuthController) ProtegerRuta(c *fiber.Ctx) error {
	sess, err := a.Store.Get(c)
	if err != nil || sess.Get("autenticado") != true {
		return c.Redirect("/login")
	}
	return c.Next()
}
