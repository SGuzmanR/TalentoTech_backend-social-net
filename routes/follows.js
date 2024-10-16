import { Router } from "express";
import testFollow from "../controllers/follow.js"

const router = Router();

// Definir rutas de follows
router.get('/test-follow', testFollow);

export default router;