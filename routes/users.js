import { Router } from "express";
import { testUser, register, login, profile, listUsers, updateUser } from "../controllers/user.js"
import { ensureAuth } from "../middleware/auth.js";

const router = Router();

// Definir rutas de User
router.get('/test-user', ensureAuth, testUser);
router.get('/profile/:id', ensureAuth, profile);
router.get('/list/:page?', ensureAuth, listUsers);
router.post('/register', register);
router.post('/login', login);
router.put('/update', ensureAuth, updateUser);
export default router;