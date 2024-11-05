import { Router } from "express";
import { testUser, register, login } from "../controllers/user.js"

const router = Router();

// Definir rutas de User
router.get('/test-user', testUser);
router.post('/register', register);
router.post('/login', login);

export default router;