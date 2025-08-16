// server.js - Versión definitiva para Render
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const cors = require('cors');

// 1. Configuración inicial
const app = express();
app.use(cors());
app.use(express.json());

// 2. Conexión a la base de datos (con validación)
const dbPath = path.join(__dirname, 'db', 'votaciones.db');
console.log('🛠️  Ruta de la base de datos:', dbPath);

// Crear archivo de DB si no existe
if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, '');
  console.log('⚠️  Archivo de DB creado.');
}

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error('❌ Error al conectar a SQLite:', err.message);
    process.exit(1);
  }
  console.log('✅ Conectado a SQLite.');
});

// 3. Crear tabla de votos (si no existe)
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS votos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      candidato_id INTEGER NOT NULL,
      fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error('Error al crear tabla:', err);
    else console.log('✔  Tabla "votos" lista.');
  });
});

// 4. Rutas de la API
// Ruta raíz (¡SOLUCIÓN AL ERROR "Cannot GET /"!)
app.get('/', (req, res) => {
  res.send(`
    <h1>Sistema de Votaciones 2025</h1>
    <p>API operativa. Endpoints:</p>
    <ul>
      <li><a href="/api/candidatos">GET /api/candidatos</a></li>
      <li>POST /api/votar (body: {"candidatoId": number})</li>
    </ul>
  `);
});

// Obtener candidatos
app.get('/api/candidatos', (req, res) => {
  const candidatos = [
    { id: 1, nombre: "Jorge Quiroga Ramírez", partido: "Alianza Libre" },
    { id: 2, nombre: "Samuel Doria Medina", partido: "Alianza Unidad" }
  ];
  res.json(candidatos);
});

// Registrar voto
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

// 5. Iniciar servidor (¡CON MANEJO DE ERRORES!)
const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor activo en http://localhost:${PORT}`);
});

server.on('error', (err) => {
  console.error('🔥 Error crítico:', err.message);
});

// Manejo de cierre (para Render)
process.on('SIGTERM', () => {
  console.log('Apagando servidor...');
  db.close();
  server.close();
});