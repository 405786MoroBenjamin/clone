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

// Obtener unicamente el numero
app.get("/get-numero", (req, res) => {
    db.get('SELECT numero FROM data WHERE id = 1', (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Error al obtener el número' });
        }
        if (!row) {
            return res.status(404).json({ message: 'No se encontró el número' });
        }
        res.json(row);
    });
});



// ------------------------------------------------------- Update numero

app.put('/update-numero', (req, res) => {
    const { token, numero } = req.body;

    if (typeof numero !== 'number') {
        return res.status(400).json({ error: 'El número debe ser un valor numérico' });
    }

    db.get('SELECT * FROM data WHERE token = ?', [token], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Error al verificar el token' });
        }
        if (!row) {
            return res.status(401).json({ message: 'Token inválido' });
        }

        db.run('UPDATE data SET numero = ? WHERE id = 1', [numero], (err) => {
            if (err) {
                return res.status(500).json({ error: 'Error al actualizar el número' });
            }
            res.json({ message: 'Número actualizado correctamente' });
        });
    });
});




// ------------------------------------------------------- Cosas de las imagenes
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { log } = require('console');

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

app.put('/update-data', upload.array('images', 4), (req, res) => {
    const { token, textos } = req.body;

    if (!Array.isArray(textos) || textos.length !== 10) {
        return res.status(400).json({ error: 'Debe proporcionar exactamente 10 textos' });
    }

    db.get('SELECT * FROM data WHERE token = ?', [token], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Error al verificar el token' });
        }
        if (!row) {
            return res.status(401).json({ message: 'Token inválido' });
        }

        const IMAGE_FOLDER = path.join(__dirname, 'images');

        console.log('Imagenes guardadas:');
        const existingImages = fs.readdirSync(IMAGE_FOLDER).map(fileName => path.basename(fileName, path.extname(fileName)));
        console.log(existingImages);

        // Reemplazar cada imagen si el nombre coincide
        const updateImagePromises = req.files.map((file) => {
            const imageName = Date.now() + path.extname(file.originalname); // Nombre único basado en timestamp
            console.log(`Procesando imagen: ${file.originalname}`);

            const matchingFiles = existingImages.filter(fileBaseName => fileBaseName === imageName);

            if (matchingFiles.length > 0) {
                const currentImagePath = path.join(IMAGE_FOLDER, matchingFiles[0]);
                const newImagePath = path.join(IMAGE_FOLDER, imageName);

                // Borrar la imagen anterior si existe y es del mismo nombre
                try {
                    fs.unlinkSync(currentImagePath); // Eliminar la imagen anterior
                    console.log(`Imagen antigua ${currentImagePath} eliminada`);
                } catch (unlinkError) {
                    console.error(`Error al eliminar la imagen antigua ${currentImagePath}: ${unlinkError.message}`);
                    return Promise.reject({ error: `Error al eliminar la imagen antigua ${currentImagePath}` });
                }

                return new Promise((resolve, reject) => {
                    fs.rename(file.path, newImagePath, (err) => {
                        if (err) {
                            reject({ error: `Error al actualizar la imagen ${file.originalname}` });
                        } else {
                            console.log(`Imagen ${file.originalname} actualizada correctamente`);
                            resolve({ message: `Imagen ${file.originalname} actualizada correctamente` });
                        }
                    });
                });
            } else {
                // Si la imagen no coincide con las imágenes existentes, loggear el nombre no coincide
                console.log(`La imagen ${file.originalname} no coincide con ninguna imagen guardada`);
                return Promise.resolve();
            }
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
                            INSERT INTO data (token, texto1, texto2, texto3, texto4, texto5, texto6, texto7, texto8, texto9, texto10)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `;

                        db.run(insertQuery, [token, ...textos], (err) => {
                            if (err) {
                                return res.status(500).json({ error: 'Error al insertar los datos' });
                            }
                            res.json({ message: 'Datos e imágenes insertados correctamente' });
                        });
                    } else {
                        // Existe, realizar un UPDATE
                        const updateQuery = `
                            UPDATE data SET 
                            texto1 = ?, texto2 = ?, texto3 = ?, texto4 = ?, texto5 = ?, 
                            texto6 = ?, texto7 = ?, texto8 = ?, texto9 = ?, texto10 = ?
                            WHERE id = 1
                        `;

                        db.run(updateQuery, [...textos], (err) => {
                            if (err) {
                                return res.status(500).json({ error: 'Error al actualizar los datos' });
                            }
                            res.json({ message: 'Datos e imágenes actualizados correctamente' });
                        });
                    }
                });
            })
            .catch(err => {
                console.error('Error al actualizar imágenes:', err);
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
