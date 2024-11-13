import { Router } from "express";
import { register, login, profile, listUsers, updateUser, uploadAvatar, avatar, counters } from "../controllers/user.js"
import { ensureAuth } from "../middleware/auth.js";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import pkg from 'cloudinary';
const { v2: cloudinary } = pkg;

// Configuracion de subida de archivos a Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'avatars',
    allowedFormats: ['jpg', 'png', 'jpeg', 'gif'],
    public_id: (req, file) => 'avatar-' + Date.now(),
  }
});

// Configurar Multer con limites de tamaño de archivos
const uploads = multer({
  storage: storage,
  limits: { fileSize: 1 * 1024 * 1024 } // Limitar tamaño a 1MB
});

const router = Router();
router.get('/profile/:id', ensureAuth, profile);
router.get('/list/:page?', ensureAuth, listUsers);
router.get('/avatar/:id', avatar);
router.get('/counters/:id?', ensureAuth, counters);
router.post('/register', register);
router.post('/login', login);
router.post('/upload-avatar', ensureAuth, uploads.single("file0"), uploadAvatar);
router.put('/update', ensureAuth, updateUser);
export default router;