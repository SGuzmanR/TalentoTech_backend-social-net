import { Router } from "express";

const router = Router();

// Definir rutas de publication
router.get("/test-publication", testPublication);

export default router;