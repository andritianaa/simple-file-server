# API Documentation - Simple file server

## Installation et Configuration

### 1. Installation des dépendances

```bash
npm install
```

### 2. Configuration des variables d'environnement

Copiez le fichier d'exemple et configurez vos variables :

```bash
cp .env.example .env
```

Éditez le fichier `.env` avec vos valeurs :

```env
# Port du serveur
PORT=3000

# Domaine du serveur (avec protocole)
DOMAIN=http://localhost:3000

# API Key pour sécuriser les uploads
API_KEY=votre-api-key-super-secret-123

# Dossier de stockage des fichiers
UPLOADS_DIR=uploads

# Taille maximale des fichiers en octets (100MB = 104857600)
MAX_FILE_SIZE=104857600
```

## Vue d'ensemble

Cette API permet de gérer un Simple file server avec upload sécurisé. Elle supporte l'upload d'images, vidéos et autres types de fichiers avec authentification par API key.

**Base URL :** `http://localhost:3000` (configurable via variable d'environnement)

## Authentification

L'API utilise un système d'authentification par API key pour sécuriser les opérations d'upload, listage et suppression de fichiers.

### Méthodes d'authentification

L'API key peut être fournie de deux manières :

1. **Header HTTP (recommandé) :**

   ```
   X-API-Key: votre-api-key-secret
   ```

2. **Paramètre URL :**
   ```
   ?apikey=votre-api-key-secret
   ```

### Endpoints nécessitant une authentification

- `POST /upload`
- `POST /upload/multiple`
- `GET /files` (listage)
- `DELETE /files/:filename`
- `DELETE /delete` (suppression par URL)

### Endpoints publics (pas d'authentification)

- `GET /files/:filename` (téléchargement)
- `GET /` (informations sur l'API)

## Endpoints

### 1. Informations sur l'API

Retourne les informations de base sur l'API et ses endpoints disponibles.

**Endpoint :** `GET /`

**Authentification :** Non requise

**Réponse :**

```json
{
  "name": "Simple file server",
  "version": "1.0.0",
  "endpoints": {
    "upload": "POST /upload (avec API key)",
    "uploadMultiple": "POST /upload/multiple (avec API key)",
    "download": "GET /files/:filename (pas d'API key)",
    "list": "GET /files (avec API key)",
    "delete": "DELETE /files/:filename (avec API key)",
    "deleteByUrl": "DELETE /delete (avec API key + URL dans le body)"
  },
  "apiKey": "Requis dans le header X-API-Key ou paramètre apikey pour l'upload"
}
```

### 2. Upload d'un fichier unique

Upload un seul fichier sur le serveur.

**Endpoint :** `POST /upload`

**Authentification :** Requise

**Content-Type :** `multipart/form-data`

**Paramètres :**

- `file` (fichier, requis) : Le fichier à uploader

**Exemple de requête :**

```bash
curl -X POST \
  -H "X-API-Key: votre-api-key-secret" \
  -F "file=@image.jpg" \
  http://localhost:3000/upload
```

**Réponse de succès (200) :**

```json
{
  "success": true,
  "message": "Fichier uploadé avec succès",
  "data": {
    "originalName": "image.jpg",
    "filename": "image_1703123456789.jpg",
    "size": 1024000,
    "mimetype": "image/jpeg",
    "url": "http://localhost:3000/files/image_1703123456789.jpg",
    "downloadUrl": "http://localhost:3000/files/image_1703123456789.jpg"
  }
}
```

**Erreurs possibles :**

- `400` : Aucun fichier fourni
- `401` : API key manquante
- `403` : API key invalide
- `413` : Fichier trop volumineux (>100MB)
- `500` : Erreur serveur

### 3. Upload de fichiers multiples

Upload plusieurs fichiers simultanément (maximum 10 fichiers).

**Endpoint :** `POST /upload/multiple`

**Authentification :** Requise

**Content-Type :** `multipart/form-data`

**Paramètres :**

- `files` (fichiers, requis) : Les fichiers à uploader (maximum 10)

**Exemple de requête :**

```bash
curl -X POST \
  -H "X-API-Key: votre-api-key-secret" \
  -F "files=@image1.jpg" \
  -F "files=@image2.png" \
  -F "files=@video.mp4" \
  http://localhost:3000/upload/multiple
```

**Réponse de succès (200) :**

```json
{
  "success": true,
  "message": "3 fichier(s) uploadé(s) avec succès",
  "data": [
    {
      "originalName": "image1.jpg",
      "filename": "image1_1703123456789.jpg",
      "size": 1024000,
      "mimetype": "image/jpeg",
      "url": "http://localhost:3000/files/image1_1703123456789.jpg",
      "downloadUrl": "http://localhost:3000/files/image1_1703123456789.jpg"
    },
    {
      "originalName": "image2.png",
      "filename": "image2_1703123456790.png",
      "size": 512000,
      "mimetype": "image/png",
      "url": "http://localhost:3000/files/image2_1703123456790.png",
      "downloadUrl": "http://localhost:3000/files/image2_1703123456790.png"
    }
  ]
}
```

### 4. Téléchargement d'un fichier

Télécharge un fichier spécifique par son nom.

**Endpoint :** `GET /files/:filename`

**Authentification :** Non requise

**Paramètres :**

- `filename` (string, requis) : Le nom du fichier à télécharger

**Exemple de requête :**

```bash
curl http://localhost:3000/files/image_1703123456789.jpg
```

**Réponse de succès (200) :**
Le fichier est retourné avec les headers appropriés.

**Erreurs possibles :**

- `404` : Fichier non trouvé

### 5. Liste des fichiers

Retourne la liste de tous les fichiers disponibles sur le serveur.

**Endpoint :** `GET /files`

**Authentification :** Requise

**Exemple de requête :**

```bash
curl -H "X-API-Key: votre-api-key-secret" \
  http://localhost:3000/files
```

**Réponse de succès (200) :**

```json
{
  "success": true,
  "data": [
    {
      "filename": "image_1703123456789.jpg",
      "size": 1024000,
      "created": "2023-12-21T10:30:56.789Z",
      "modified": "2023-12-21T10:30:56.789Z",
      "url": "http://localhost:3000/files/image_1703123456789.jpg"
    },
    {
      "filename": "video_1703123456790.mp4",
      "size": 50000000,
      "created": "2023-12-21T10:31:56.790Z",
      "modified": "2023-12-21T10:31:56.790Z",
      "url": "http://localhost:3000/files/video_1703123456790.mp4"
    }
  ],
  "count": 2
}
```

### 6. Suppression d'un fichier

Supprime un fichier spécifique du serveur.

**Endpoint :** `DELETE /files/:filename`

**Authentification :** Requise

**Paramètres :**

- `filename` (string, requis) : Le nom du fichier à supprimer

**Exemple de requête :**

```bash
curl -X DELETE \
  -H "X-API-Key: votre-api-key-secret" \
  http://localhost:3000/files/image_1703123456789.jpg
```

**Réponse de succès (200) :**

```json
{
  "success": true,
  "message": "Fichier supprimé avec succès",
  "filename": "image_1703123456789.jpg"
}
```

**Erreurs possibles :**

- `404` : Fichier non trouvé
- `401` : API key manquante
- `403` : API key invalide
- `500` : Erreur serveur

### 7. Suppression d'un fichier par URL complète

Supprime un fichier en fournissant son URL complète dans le body de la requête.

**Endpoint :** `DELETE /delete`

**Authentification :** Requise

**Content-Type :** `application/json`

**Body :**

```json
{
  "url": "http://localhost:3000/files/image_1703123456789.jpg"
}
```

**Exemple de requête :**

```bash
curl -X DELETE \
  -H "X-API-Key: votre-api-key-secret" \
  -H "Content-Type: application/json" \
  -d '{"url": "http://localhost:3000/files/image_1703123456789.jpg"}' \
  http://localhost:3000/delete
```

**Réponse de succès (200) :**

```json
{
  "success": true,
  "message": "Fichier supprimé avec succès",
  "filename": "image_1703123456789.jpg",
  "url": "http://localhost:3000/files/image_1703123456789.jpg"
}
```

**Erreurs possibles :**

- `400` : URL manquante, malformée ou invalide
- `404` : Fichier non trouvé
- `401` : API key manquante
- `403` : API key invalide
- `500` : Erreur serveur

## Codes d'erreur

| Code | Description                                                |
| ---- | ---------------------------------------------------------- |
| 200  | Succès                                                     |
| 400  | Requête invalide (fichier manquant, paramètres incorrects) |
| 401  | Non autorisé (API key manquante)                           |
| 403  | Interdit (API key invalide)                                |
| 404  | Ressource non trouvée (fichier inexistant)                 |
| 413  | Fichier trop volumineux                                    |
| 500  | Erreur serveur interne                                     |

## Format des erreurs

Toutes les erreurs sont retournées dans le format suivant :

```json
{
  "error": "Type d'erreur",
  "message": "Description détaillée de l'erreur"
}
```

## Limitations

- **Taille maximale par fichier :** 100MB
- **Nombre maximum de fichiers simultanés :** 10
- **Types de fichiers :** Tous types acceptés
- **Authentification :** API key requise pour upload/suppression

## Renommage automatique

Pour éviter les conflits de noms, tous les fichiers uploadés sont automatiquement renommés selon le pattern :

```
nom_original_timestamp.extension
```

**Exemple :**

- Fichier original : `image.jpg`
- Fichier sauvegardé : `image_1703123456789.jpg`

## Variables d'environnement

| Variable        | Description                            | Valeur par défaut     |
| --------------- | -------------------------------------- | --------------------- |
| `PORT`          | Port du serveur                        | 3000                  |
| `DOMAIN`        | Domaine du serveur                     | http://localhost:3000 |
| `API_KEY`       | Clé API pour l'authentification        | votre-api-key-secret  |
| `UPLOADS_DIR`   | Dossier de stockage des fichiers       | uploads               |
| `MAX_FILE_SIZE` | Taille maximale des fichiers en octets | 104857600 (100MB)     |

**Note :** Le package `dotenv` est utilisé pour charger automatiquement les variables d'environnement depuis le fichier `.env`.

## Exemples d'utilisation

### JavaScript (Fetch API)

```javascript
// Upload d'un fichier
const formData = new FormData();
formData.append("file", fileInput.files[0]);

fetch("http://localhost:3000/upload", {
  method: "POST",
  headers: {
    "X-API-Key": "votre-api-key-secret",
  },
  body: formData,
})
  .then((response) => response.json())
  .then((data) => console.log(data));

// Suppression par URL
fetch("http://localhost:3000/delete", {
  method: "DELETE",
  headers: {
    "X-API-Key": "votre-api-key-secret",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    url: "http://localhost:3000/files/image_1703123456789.jpg",
  }),
})
  .then((response) => response.json())
  .then((data) => console.log(data));
```

### Python (requests)

```python
import requests

# Upload d'un fichier
files = {'file': open('image.jpg', 'rb')}
headers = {'X-API-Key': 'votre-api-key-secret'}

response = requests.post(
    'http://localhost:3000/upload',
    files=files,
    headers=headers
)

print(response.json())

# Suppression par URL
data = {'url': 'http://localhost:3000/files/image_1703123456789.jpg'}
headers = {
    'X-API-Key': 'votre-api-key-secret',
    'Content-Type': 'application/json'
}

response = requests.delete(
    'http://localhost:3000/delete',
    json=data,
    headers=headers
)

print(response.json())
```

### PHP (cURL)

```php
<?php
// Upload d'un fichier
$ch = curl_init();
$file = new CURLFile('image.jpg');

curl_setopt_array($ch, [
    CURLOPT_URL => 'http://localhost:3000/upload',
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => ['file' => $file],
    CURLOPT_HTTPHEADER => ['X-API-Key: votre-api-key-secret'],
    CURLOPT_RETURNTRANSFER => true
]);

$response = curl_exec($ch);
curl_close($ch);

echo $response;

// Suppression par URL
$ch = curl_init();
$data = json_encode(['url' => 'http://localhost:3000/files/image_1703123456789.jpg']);

curl_setopt_array($ch, [
    CURLOPT_URL => 'http://localhost:3000/delete',
    CURLOPT_CUSTOMREQUEST => 'DELETE',
    CURLOPT_POSTFIELDS => $data,
    CURLOPT_HTTPHEADER => [
        'X-API-Key: votre-api-key-secret',
        'Content-Type: application/json'
    ],
    CURLOPT_RETURNTRANSFER => true
]);

$response = curl_exec($ch);
curl_close($ch);

echo $response;
?>
```

## Support

Pour toute question ou problème, consultez les logs du serveur ou vérifiez la configuration de vos variables d'environnement.
