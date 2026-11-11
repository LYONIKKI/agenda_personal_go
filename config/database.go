package config

import (
	"database/sql"
	"fmt"
	"log"
	"net/url"
	"os"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
)

type AppState struct {
	DB *sql.DB // Única base de datos: PostgreSQL (uei_sistemas)
}

func InitDatabases() *AppState {
	pgHost := getEnv("DB_PG_HOST", "localhost")
	pgPort := getEnv("DB_PG_PORT", "5432")
	pgDB := getEnv("DB_PG_DATABASE", "uei_sistemas")
	pgUser := getEnv("DB_PG_USER", "anhgelo")
	pgPass := getEnv("DB_PG_PASS", "ElRey*")

	pgDSN := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable",
		pgUser, url.QueryEscape(pgPass), pgHost, pgPort, pgDB)

	poolPG, err := sql.Open("pgx", pgDSN)
	if err != nil {
		log.Fatalf("❌ Error crítico en driver PostgreSQL: %v", err)
	}

	poolPG.SetMaxOpenConns(20)
	poolPG.SetMaxIdleConns(5)
	poolPG.SetConnMaxLifetime(5 * time.Minute)

	if err := poolPG.Ping(); err != nil {
		log.Fatalf("❌ Error al conectar a PostgreSQL (%s): %v", pgDB, err)
	}
	log.Println("✅ Conectado a PostgreSQL (uei_sistemas) con éxito")

	return &AppState{
		DB: poolPG,
	}
}

func getEnv(key, defaultVal string) string {
	val := os.Getenv(key)
	if val == "" {
		return defaultVal
	}
	return val
}
