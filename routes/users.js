import { Router } from "express";
import { testUser, register, login, profile, listUsers } from "../controllers/user.js"
import { ensureAuth } from "../middleware/auth.js";

const router = Router();

// Definir rutas de User
router.get('/test-user', ensureAuth, testUser);
router.get('/profile/:id', ensureAuth, profile);
router.get('/list/:page?', ensureAuth, listUsers);
router.post('/register', register);
router.post('/login', login);

export default router;