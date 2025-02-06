import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getBargainInfo, setBargainingByCategory, setBargainingByProduct, setBargainingToAllProducts } from "../controllers/bargaining.controller.js";

const router = Router();

router.route('/set-by-category')
    .post(verifyJWT,setBargainingByCategory)

router.route('/set-all-products')
    .post(verifyJWT,setBargainingToAllProducts)

router.route('/set-by-product')
    .post(verifyJWT,setBargainingByProduct)

router.route('/bargain-info/:id')
    .get(getBargainInfo)

export default router