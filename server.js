const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const cors = require('cors');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const DOMAIN = process.env.DOMAIN || `http://localhost:${PORT}`;

const API_KEY = process.env.API_KEY || 'my-api-key-secret';

const uploadsDir = path.join(__dirname, process.env.UPLOADS_DIR || 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}


// Autoriser CORS pour toutes les origines
app.use(cors({
    origin: [
        'http://localhost:3000',
        'https://tool.teratany.org'
    ]
}));
// Configuration multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        // Extraction le nom et l'extension du fichier
        const ext = path.extname(file.originalname);
        const nameWithoutExt = path.basename(file.originalname, ext);

        // Ajouter un timestamp pour éviter les conflits
        const timestamp = Date.now();
        const newFilename = `${nameWithoutExt}_${timestamp}${ext}`;

        cb(null, newFilename);
    }
});

// Filtrer les types de fichiers autorisés (optionnel)
const fileFilter = (req, file, cb) => {
    // Autoriser tous les types de fichiers
    // Vous pouvez ajouter des restrictions ici si nécessaire
    cb(null, true);
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 100 * 1024 * 1024 // Limite configurable ou 100MB par défaut
    }
});

// Middleware pour vérifier l'API key
const verifyApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'] || req.query.apikey;

    if (!apiKey) {
        return res.status(401).json({
            error: 'API key manquante',
            message: 'Veuillez fournir une API key dans le header X-API-Key ou le paramètre apikey'
        });
    }

    if (apiKey !== API_KEY) {
        return res.status(403).json({
            error: 'API key invalide',
            message: 'L\'API key fournie n\'est pas valide'
        });
    }

    next();
};

// Middleware pour parser le JSON
app.use(express.json());

// Route pour uploader un fichier
app.post('/upload', verifyApiKey, upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: 'Aucun fichier fourni',
                message: 'Veuillez fournir un fichier à uploader'
            });
        }

        const fileUrl = `${DOMAIN}/files/${req.file.filename}`;

        res.json({
            success: true,
            message: 'Fichier uploadé avec succès',
            data: {
                originalName: req.file.originalname,
                filename: req.file.filename,
                size: req.file.size,
                mimetype: req.file.mimetype,
                url: fileUrl,
                downloadUrl: fileUrl
            }
        });

    } catch (error) {
        console.error('Erreur lors de l\'upload:', error);
        res.status(500).json({
            error: 'Erreur serveur',
            message: 'Une erreur est survenue lors de l\'upload du fichier'
        });
    }
});

// Route pour uploader plusieurs fichiers
app.post('/upload/multiple', verifyApiKey, upload.array('files', 10), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                error: 'Aucun fichier fourni',
                message: 'Veuillez fournir au moins un fichier à uploader'
            });
        }

        const uploadedFiles = req.files.map(file => ({
            originalName: file.originalname,
            filename: file.filename,
            size: file.size,
            mimetype: file.mimetype,
            url: `${DOMAIN}/files/${file.filename}`,
            downloadUrl: `${DOMAIN}/files/${file.filename}`
        }));

        res.json({
            success: true,
            message: `${req.files.length} fichier(s) uploadé(s) avec succès`,
            data: uploadedFiles
        });

    } catch (error) {
        console.error('Erreur lors de l\'upload multiple:', error);
        res.status(500).json({
            error: 'Erreur serveur',
            message: 'Une erreur est survenue lors de l\'upload des fichiers'
        });
    }
});

// Route pour servir les fichiers (pas besoin d'API key)
app.get('/files/:filename', (req, res) => {
    const filename = req.params.filename;
    const filepath = path.join(uploadsDir, filename);

    // Vérifier si le fichier existe
    if (!fs.existsSync(filepath)) {
        return res.status(404).json({
            error: 'Fichier non trouvé',
            message: 'Le fichier demandé n\'existe pas'
        });
    }

    // Servir le fichier
    res.sendFile(filepath);
});

// Route pour lister les fichiers (avec API key)
app.get('/files', verifyApiKey, (req, res) => {
    try {
        const files = fs.readdirSync(uploadsDir);
        const fileList = files.map(filename => {
            const filepath = path.join(uploadsDir, filename);
            const stats = fs.statSync(filepath);

            return {
                filename: filename,
                size: stats.size,
                created: stats.birthtime,
                modified: stats.mtime,
                url: `${DOMAIN}/files/${filename}`
            };
        });

        res.json({
            success: true,
            data: fileList,
            count: fileList.length
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des fichiers:', error);
        res.status(500).json({
            error: 'Erreur serveur',
            message: 'Une erreur est survenue lors de la récupération de la liste des fichiers'
        });
    }
});

// Route pour supprimer un fichier (avec API key)
app.delete('/files/:filename', verifyApiKey, (req, res) => {
    try {
        const filename = req.params.filename;
        const filepath = path.join(uploadsDir, filename);

        if (!fs.existsSync(filepath)) {
            return res.status(404).json({
                error: 'Fichier non trouvé',
                message: 'Le fichier à supprimer n\'existe pas'
            });
        }

        fs.unlinkSync(filepath);

        res.json({
            success: true,
            message: 'Fichier supprimé avec succès',
            filename: filename
        });

    } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        res.status(500).json({
            error: 'Erreur serveur',
            message: 'Une erreur est survenue lors de la suppression du fichier'
        });
    }
});

// Route pour supprimer un fichier via URL complète (avec API key)
app.delete('/delete', verifyApiKey, (req, res) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({
                error: 'URL manquante',
                message: 'Veuillez fournir l\'URL du fichier à supprimer dans le body de la requête'
            });
        }

        // Extraire le nom du fichier de l'URL
        let filename;
        try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;

            // Vérifier que l'URL correspond au pattern /files/filename
            if (!pathname.startsWith('/files/')) {
                return res.status(400).json({
                    error: 'URL invalide',
                    message: 'L\'URL doit être au format: domaine/files/nom_du_fichier'
                });
            }

            filename = pathname.replace('/files/', '');

            // Validation basique du nom de fichier
            if (!filename || filename.includes('..') || filename.includes('/')) {
                return res.status(400).json({
                    error: 'Nom de fichier invalide',
                    message: 'Le nom du fichier extrait de l\'URL est invalide'
                });
            }

        } catch (urlError) {
            return res.status(400).json({
                error: 'URL malformée',
                message: 'L\'URL fournie n\'est pas valide'
            });
        }

        const filepath = path.join(uploadsDir, filename);

        if (!fs.existsSync(filepath)) {
            return res.status(404).json({
                error: 'Fichier non trouvé',
                message: 'Le fichier à supprimer n\'existe pas'
            });
        }

        fs.unlinkSync(filepath);

        res.json({
            success: true,
            message: 'Fichier supprimé avec succès',
            filename: filename,
            url: url
        });

    } catch (error) {
        console.error('Erreur lors de la suppression via URL:', error);
        res.status(500).json({
            error: 'Erreur serveur',
            message: 'Une erreur est survenue lors de la suppression du fichier'
        });
    }
});

// Route d'information sur le serveur
app.get('/', (req, res) => {
    res.json({
        name: 'Simple file server',
        version: '1.0.0',
        endpoints: {
            upload: 'POST /upload (avec API key)',
            uploadMultiple: 'POST /upload/multiple (avec API key)',
            download: 'GET /files/:filename (pas d\'API key)',
            list: 'GET /files (avec API key)',
            delete: 'DELETE /files/:filename (avec API key)',
            deleteByUrl: 'DELETE /delete (avec API key + URL dans le body)'
        },
        apiKey: 'Requis dans le header X-API-Key ou paramètre apikey pour l\'upload'
    });
});

// Gestion des erreurs
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                error: 'Fichier trop volumineux',
                message: 'La taille du fichier dépasse la limite autorisée (100MB)'
            });
        }
    }

    console.error('Erreur non gérée:', error);
    res.status(500).json({
        error: 'Erreur serveur',
        message: 'Une erreur inattendue est survenue'
    });
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`🚀 Simple file server démarré sur le port ${PORT}`);
    console.log(`📁 Domain: ${DOMAIN}`);
    console.log(`🔑 API Key: ${API_KEY}`);
    console.log(`📂 Dossier uploads: ${uploadsDir}`);
    console.log(`\n📋 Endpoints disponibles:`);
    console.log(`   POST ${DOMAIN}/upload (avec API key)`);
    console.log(`   POST ${DOMAIN}/upload/multiple (avec API key)`);
    console.log(`   GET  ${DOMAIN}/files/:filename`);
    console.log(`   GET  ${DOMAIN}/files (avec API key)`);
    console.log(`   DELETE ${DOMAIN}/files/:filename (avec API key)`);
    console.log(`   DELETE ${DOMAIN}/delete (avec API key + URL dans le body)`);
});

module.exports = app;