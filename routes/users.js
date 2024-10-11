import { Router } from "express";
import { testUser, register } from "../controllers/user.js"

const router = Router();

// Definir rutas de User
router.get('/test-user', testUser);
router.get('/register', register);

export default router;