import { Router } from "express";
import { testPublication } from "../controllers/publication.js"

const router = Router();

// Definir rutas de publication
router.get("/test-publication", testPublication);

export default router;