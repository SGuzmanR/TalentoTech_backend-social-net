import { Router } from "express";
import { savePublication, showPublication, deletePublication, publicationsUser, uploadMedia, showMedia, feed } from "../controllers/publication.js";
import { ensureAuth } from "../middleware/auth.js";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import pkg from 'cloudinary';
const { v2: cloudinary } = pkg;

// Configuracion de subida de archivos en Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'publications',
    allowedFormats: ['jpg', 'png', 'jpeg', 'gif'],
    public_id: (req, file) => 'publication-' + Date.now()
  }
});

// Configurar multer con limites de tamaño de archivos
const uploads = multer({
  storage: storage,
  limits: { fileSize: 1 * 1024 * 1024 } // Limitar tamaño a 1MB
});

const router = Router();

// Definir rutas de publication
router.get("/show-publication/:id", ensureAuth, showPublication);
router.get('/media/:id', showMedia);
router.get('/feed/:page?', ensureAuth, feed);
router.get('/publications-user/:id/:page?', ensureAuth, publicationsUser);
router.post("/new-publication", ensureAuth, savePublication);
router.post('/upload-media/:id', [ensureAuth, uploads.single("file0")], uploadMedia);
router.delete("/delete-publication/:id", ensureAuth, deletePublication);


export default router;