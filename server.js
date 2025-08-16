// server.js - Versión optimizada para Render y local
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const cors = require('cors');

// Configuración inicial
const app = express();
app.use(cors());
app.use(express.json());

// 1. Conexión a la base de datos (con debug)
const dbPath = path.join(__dirname, 'db', 'votaciones.db');
console.log('🛠️  Ruta de la base de datos:', dbPath);

// Verifica si el archivo existe o créalo
if (!fs.existsSync(dbPath)) {
  console.log('⚠️  Archivo de DB no encontrado. Creando uno nuevo...');
  fs.writeFileSync(dbPath, ''); // Crea archivo vacío
}

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error('❌ Error fatal al conectar a SQLite:', err.message);
    process.exit(1); // Fuerza la salida para que Render muestre el error
  }
  console.log('✅ Conectado a la base de datos SQLite');
});

// 2. Crear tabla si no existe
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS votos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      candidato_id INTEGER NOT NULL,
      fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error('Error al crear tabla:', err);
    else console.log('✔  Tabla "votos" verificada');
  });
});

// 3. Rutas de la API
app.get('/api/candidatos', (req, res) => {
  // Datos de ejemplo (reemplaza con tus candidatos reales)
  const candidatos = [
    { id: 1, nombre: "Jorge Quiroga Ramírez", partido: "Alianza Libre" },
    { id: 2, nombre: "Samuel Doria Medina", partido: "Alianza Unidad" }
  ];
  res.json(candidatos);
});

app.post('/api/votar', (req, res) => {
  const { candidatoId } = req.body;
  if (!candidatoId) return res.status(400).json({ error: 'Se requiere candidatoId' });

  db.run(
    'INSERT INTO votos (candidato_id) VALUES (?)',
    [candidatoId],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID });
    }
  );
});

// 4. Iniciar servidor
const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor activo en puerto ${PORT}`);
});

// Manejo de errores del servidor
server.on('error', (err) => {
  console.error('🔥 Error crítico:', err.message);
});

// Manejo de cierre limpio
process.on('SIGTERM', () => {
  console.log('Apagando servidor...');
  db.close();
  server.close();
});