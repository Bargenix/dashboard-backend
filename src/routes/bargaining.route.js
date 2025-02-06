import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    setBargainingByCategory,
    setBargainingByProduct,
    setBargainingToAllProducts,
    setMinPrice,
    deleteBargaining,
    getBargainingDetails,
    deactivateAllProducts,
    deactivateByCategory
} from "../controllers/bargaining.controller.js";

const router = Router();

router.route('/set-by-category')
    .post(verifyJWT, setBargainingByCategory);

router.route('/set-all-products')
    .post(verifyJWT, setBargainingToAllProducts);

router.route('/set-by-product')
    .post(verifyJWT, setBargainingByProduct);

router.route('/set-min-price')
    .post(verifyJWT, setMinPrice);

router.route('/delete/:productId')
    .delete(verifyJWT, deleteBargaining);

router.route('/details')
    .get(verifyJWT, getBargainingDetails);

router.route('/deactivate-all')
    .post(verifyJWT, deactivateAllProducts);

router.route('/deactivate-category')
    .post(verifyJWT, deactivateByCategory);

export default router;