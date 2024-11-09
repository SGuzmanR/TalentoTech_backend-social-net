import { Router } from "express";
import { testFollow, saveFollow } from "../controllers/follow.js"
import { ensureAuth } from "../middleware/auth.js";

const router = Router();

// Definir rutas de follows
router.get('/test-follow', testFollow);
router.post('/follow', ensureAuth, saveFollow);

export default router;