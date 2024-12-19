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
        return;
    }
    console.log('Conexión exitosa a SQLite');

    // Crear tabla si no existe y asegurar un registro inicial
    db.run(`
        CREATE TABLE IF NOT EXISTS data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            numero INTEGER DEFAULT 0,
            token TEXT DEFAULT '',
            texto1 TEXT DEFAULT '',
            texto2 TEXT DEFAULT '',
            texto3 TEXT DEFAULT '',
            texto4 TEXT DEFAULT '',
            texto5 TEXT DEFAULT '',
            texto6 TEXT DEFAULT '',
            texto7 TEXT DEFAULT '',
            texto8 TEXT DEFAULT '',
            texto9 TEXT DEFAULT '',
            texto10 TEXT DEFAULT ''
        );

        INSERT INTO data (token, numero, texto1, texto2, texto3, texto4, texto5, texto6, texto7, texto8, texto9, texto10) 
        SELECT '', 0, '', '', '', '', '', '', '', '', '', '' 
        WHERE NOT EXISTS (SELECT 1 FROM data WHERE id = 1);
    `, (err) => {
        if (err) {
            console.error('Error al inicializar la tabla:', err.message);
        } else {
            console.log('Tabla "data" creada e inicializada correctamente');
        }
    });
});

// Login
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Lógica hardcodeada para verificar credenciales
    if (username === '123' && password === '123') {
        const token = crypto.randomBytes(16).toString('hex');

        // Verificar si el registro con id = 1 existe
        db.get('SELECT id FROM data WHERE id = 1', (err, row) => {
            if (err) {
                console.error('Error al verificar la existencia del registro:', err.message);
                return res.status(500).json({ error: 'Error del servidor' });
            }

            if (row) {
                // Si el registro existe, actualiza el token
                db.run('UPDATE data SET token = ? WHERE id = 1', [token], function (err) {
                    if (err) {
                        console.error('Error al actualizar el token:', err.message);
                        return res.status(500).json({ error: 'Error al actualizar el token' });
                    }

                    db.get('SELECT * FROM data WHERE id = 1', (err, updatedRow) => {
                        if (err) {
                            console.error('Error al verificar la actualización:', err.message);
                            return res.status(500).json({ error: 'Error al verificar la actualización' });
                        }

                        if (updatedRow && updatedRow.token === token) {
                            res.json({ message: 'Login exitoso', token });
                        } else {
                            console.error('Error: Token no se actualizó correctamente');
                            res.status(500).json({ error: 'Error al actualizar el token' });
                        }
                    });
                });
            } else {
                // Si el registro no existe, créalo
                db.run('INSERT INTO data (id, token) VALUES (1, ?)', [token], function (err) {
                    if (err) {
                        console.error('Error al crear el registro:', err.message);
                        return res.status(500).json({ error: 'Error al crear el registro' });
                    }

                    console.log('Registro creado correctamente');
                    res.json({ message: 'Login exitoso', token });
                });
            }
        });
    } else {
        res.status(401).json({ message: 'Credenciales incorrectas' });
    }
});



app.post('/validate-token', (req, res) => {
    console.log('Request recibido en /validate-token:', new Date().toISOString());
    
    const { token } = req.body;

    if (!token) {
        console.error('Token no proporcionado');
        return res.status(400).json({ message: 'Token no proporcionado' });
    }

    // Verifica que el token exista en la base de datos
    const query = 'SELECT token FROM data WHERE token = ?';
    console.log('Consulta SQL:', query);
    db.get(query, [token], (err, row) => {
        if (err) {
            console.error('Error al buscar token en la base de datos:', err.message);
            return res.status(500).json({ message: 'Error del servidor' });
        }

        if (row) {
            console.log('Token encontrado:', token);
            return res.status(200).json({ valid: true });
        } else {
            console.log('Token no encontrado:', token);
            return res.status(404).json({ valid: false });
        }
    });
});

app.get('/get-data', (req, res) => {
    db.all('SELECT * FROM data', (err, rows) => {
        if (err) {
            console.error('Error al obtener los datos:', err.message);
            return res.status(500).json({ error: 'Error al obtener los datos' });
        }
        if (rows.length === 0) {
            return res.status(404).json({ message: 'No se encontraron registros' });
        }
        res.json(rows);
    });
});

// ------------------------------------------------------- Cosas de las imagenes
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const IMAGE_FOLDER = path.join(__dirname, 'images');
        if (!fs.existsSync(IMAGE_FOLDER)) {
            fs.mkdirSync(IMAGE_FOLDER, { recursive: true });
        }
        cb(null, IMAGE_FOLDER);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage });

app.put('/update-data', upload.array('images', 10), (req, res) => {
    const { token, numero, textos, currentImageNames } = req.body;

    console.log(req.body); // Este log mostrará todos los datos recibidos
    console.log(req.body.textos); // Verifica si `textos` tiene la longitud esperada
    console.log(req.body.currentImageNames); // Verifica si `currentImageNames` tiene la longitud esperada

    if (!Array.isArray(textos) || textos.length !== 10) {
        return res.status(400).json({ error: 'Debe proporcionar exactamente 10 textos' });
    }

    if (!Array.isArray(currentImageNames) || currentImageNames.length !== req.files.length) {
        return res.status(400).json({ error: 'Debe proporcionar exactamente 10 nombres de imágenes' });
    }

    db.get('SELECT * FROM data WHERE token = ?', [token], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Error al verificar el token' });
        }
        if (!row) {
            return res.status(401).json({ message: 'Token inválido' });
        }

        const IMAGE_FOLDER = path.join(__dirname, 'images');

        // Reemplazar cada imagen
        const updateImagePromises = req.files.map((file, index) => {
            const currentImageBaseName = path.basename(currentImageNames[index], path.extname(currentImageNames[index]));
            const matchingFiles = fs.readdirSync(IMAGE_FOLDER).filter(fileName => {
                const fileBaseName = path.basename(fileName, path.extname(fileName));
                return fileBaseName === currentImageBaseName;
            });

            if (matchingFiles.length === 0) {
                return Promise.reject({ message: `La imagen actual ${currentImageNames[index]} no existe, no se realizó ningún cambio` });
            }

            const currentImagePath = path.join(IMAGE_FOLDER, matchingFiles[0]);
            const currentImageExtension = path.extname(matchingFiles[0]);
            const newImagePath = path.join(IMAGE_FOLDER, currentImageBaseName + currentImageExtension);

            return new Promise((resolve, reject) => {
                fs.rename(file.path, newImagePath, (err) => {
                    if (err) {
                        reject({ error: `Error al actualizar la imagen ${currentImageNames[index]}` });
                    } else {
                        resolve({ message: `Imagen ${currentImageNames[index]} actualizada correctamente` });
                    }
                });
            });
        });

        // Esperar todas las promesas de actualización de imágenes
        Promise.all(updateImagePromises)
            .then(() => {
                // Verificar si el registro existe
                db.get('SELECT * FROM data WHERE id = 1', (err, existingRow) => {
                    if (err) {
                        return res.status(500).json({ error: 'Error al verificar los registros existentes' });
                    }

                    if (!existingRow) {
                        // No existe, realizar un INSERT
                        const insertQuery = `
                            INSERT INTO data (numero, token, texto1, texto2, texto3, texto4, texto5, texto6, texto7, texto8, texto9, texto10)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `;

                        db.run(insertQuery, [numero, token, ...textos], (err) => {
                            if (err) {
                                return res.status(500).json({ error: 'Error al insertar los datos' });
                            }
                            res.json({ message: 'Datos e imágenes insertados correctamente' });
                        });
                    } else {
                        // Existe, realizar un UPDATE
                        const updateQuery = `
                            UPDATE data SET numero = ?, 
                            texto1 = ?, texto2 = ?, texto3 = ?, texto4 = ?, texto5 = ?, 
                            texto6 = ?, texto7 = ?, texto8 = ?, texto9 = ?, texto10 = ?
                            WHERE id = 1
                        `;

                        db.run(updateQuery, [numero, ...textos], (err) => {
                            if (err) {
                                return res.status(500).json({ error: 'Error al actualizar los datos' });
                            }
                            res.json({ message: 'Datos e imágenes actualizados correctamente' });
                        });
                    }
                });
            })
            .catch(err => {
                res.status(500).json(err);
            });
    });
});


// Error 404
app.use((req, res) => {
    res.status(404).json({ message: 'No encontrado' });
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
