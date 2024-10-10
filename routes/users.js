import { Router } from "express";
import { testUser } from "../controllers/user.js"

const router = Router();

// Definir rutas de User
router.get('/test-user', testUser);

export default router;