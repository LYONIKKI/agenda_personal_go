package main

import (
	"log"
	"os"
	"time"

	"agenda_go/config"
	"agenda_go/controllers"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/session"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()

	// 1. Conexión PostgreSQL (uei_sistemas)
	dbState := config.InitDatabases()

	app := fiber.New(fiber.Config{
		AppName: "Agenda & Asistente - Ing. Anhgelo Vega",
	})

	app.Use(logger.New())
	app.Use(cors.New())

	// 2. Sesión
	store := session.New(session.Config{
		Expiration:     30 * 24 * time.Hour,
		CookieHTTPOnly: true,
		CookieSameSite: "Lax",
	})

	// 3. Controladores
	authCtrl := &controllers.AuthController{
		Store:  store,
		DBAuth: dbState.DB,
	}
	tareaCtrl := &controllers.TareaController{
		DB: dbState.DB,
	}
	cronogramaCtrl := &controllers.CronogramaController{
		DB: dbState.DB,
	}
	semanalCtrl := &controllers.SemanalController{
		DB: dbState.DB,
	}

	// 4. Archivos Estáticos
	app.Static("/public", "./public")

	// 5. Rutas Públicas (Login y Logout)
	app.Get("/login", func(c *fiber.Ctx) error {
		return c.SendFile("./public/views/login.html")
	})
	app.Post("/api/login", authCtrl.Login)
	app.Get("/logout", authCtrl.Logout)

	// 6. Rutas Protegidas
	privado := app.Group("/", authCtrl.ProtegerRuta)

	// Vistas HTML
	privado.Get("/", func(c *fiber.Ctx) error {
		return c.SendFile("./public/views/index.html")
	})
	privado.Get("/agenda", func(c *fiber.Ctx) error {
		return c.SendFile("./public/views/cronograma.html")
	})

	privado.Get("/semanal", func(c *fiber.Ctx) error {
		return c.SendFile("./public/views/semanal.html")
	})

	// Endpoints Kanban
	privado.Get("/api/tareas", tareaCtrl.Listar)
	privado.Post("/api/tareas", tareaCtrl.Crear)
	privado.Put("/api/tareas/:id", tareaCtrl.Actualizar)
	privado.Put("/api/tareas/:id/estado", tareaCtrl.CambiarEstado)
	privado.Put("/api/tareas/:id/aplazar", tareaCtrl.Aplazar)
	privado.Delete("/api/tareas/:id", tareaCtrl.Eliminar)

	// Endpoints Cronograma Diaria
	privado.Get("/api/cronograma", cronogramaCtrl.ListarPorFecha)
	privado.Post("/api/cronograma", cronogramaCtrl.Crear)
	privado.Delete("/api/cronograma/:id", cronogramaCtrl.Eliminar)
	privado.Get("/api/cronograma", cronogramaCtrl.ListarPorFecha)
	privado.Get("/api/cronograma/mes", cronogramaCtrl.DiasOcupadosMes) // <--- NUEVO
	privado.Post("/api/cronograma", cronogramaCtrl.Crear)
	privado.Delete("/api/cronograma/:id", cronogramaCtrl.Eliminar)

	privado.Get("/api/semanal", semanalCtrl.ObtenerSeguimiento)

	port := os.Getenv("PORT")
	if port == "" {
		port = "3010"
	}
	log.Fatal(app.Listen(":" + port))
}
