const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json({ limit: '10mb' }));

app.use(cors({
    origin: '*', // Permite cualquier origen
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Métodos HTTP permitidos
    allowedHeaders: ['Content-Type', 'Authorization'], // Cabeceras permitidas
    credentials: true // Permite enviar cookies con las solicitudes
}));


// Conexión a SQLite
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error('Error al conectar con SQLite:', err.message);
    } else {
        console.log('Conexión exitosa a SQLite');
    }
});

// Crear tabla si no existe
db.run(`
    CREATE TABLE IF NOT EXISTS data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        numero INTEGER DEFAULT 0,
        token TEXT
    )
`);

// Login
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (username === '123' && password === '123') {
        const token = crypto.randomBytes(16).toString('hex');

        // Actualiza el token en el único registro
        db.run('UPDATE data SET token = ? WHERE id = 1', [token], function (err) {
            if (err) {
                return res.status(500).json({ error: 'Error al actualizar el token' });
            }
            res.json({ message: 'Login exitoso', token });
        });
    } else {
        res.status(401).json({ message: 'Credenciales incorrectas' });
    }
});

// Validar token
app.post('/validate-token', (req, res) => {
    const { token } = req.body;

    // Verifica si el token es válido
    db.get('SELECT * FROM data WHERE token = ?', [token], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Error al verificar el token' });
        }
        if (!row) {
            return res.status(401).json({ valid: false, message: 'Token inválido' });
        }
        res.json({ valid: true });
    });
});

// Actualizar número
app.put('/update-numero', (req, res) => {
    const { numero, token } = req.body;

    // Verifica si el token es válido
    db.get('SELECT * FROM data WHERE token = ?', [token], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Error al verificar el token' });
        }
        if (!row) {
            return res.status(401).json({ message: 'Token inválido' });
        }

        // Actualiza el número en el único registro
        db.run('UPDATE data SET numero = ? WHERE id = 1', [numero], function (err) {
            if (err) {
                return res.status(500).json({ error: 'Error al actualizar el número' });
            }
            res.json({ message: 'Número actualizado', numero });
        });
    });
});

// Obtener número
app.get('/get-numero', (req, res) => {
    // Consulta el número desde el único registro
    db.get('SELECT numero FROM data WHERE id = 1', (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Error al obtener el número' });
        }
        if (!row) {
            return res.status(404).json({ message: 'No se encontró el número' });
        }
        res.json({ numero: row.numero });
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
