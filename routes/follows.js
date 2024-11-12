import { Router } from "express";
import { saveFollow, unfollow, following, followers } from "../controllers/follow.js"
import { ensureAuth } from "../middleware/auth.js";

const router = Router();

// Definir rutas de follows
router.post('/follow', ensureAuth, saveFollow);
router.delete('/unfollow/:id', ensureAuth, unfollow);
router.get('/following/:id?/:page?', ensureAuth, following);
router.get('/followers/:id?/:page?', ensureAuth, followers);

export default router;