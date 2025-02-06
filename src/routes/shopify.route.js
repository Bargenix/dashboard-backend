import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getAllProducts, getAllProductsByCategory, getTotalOrders, setShopifyCred, updateShopifyCred } from "../controllers/shopify.controller.js";

const router = Router();

router.route('/all-orders')
    .get(verifyJWT, getTotalOrders)

router.route('/all-products')
    .get(verifyJWT, getAllProducts)

router.route('/all-products-category')
    .get(verifyJWT, getAllProductsByCategory)

router.route('/set-shopify-cred')
    .post(verifyJWT, setShopifyCred)

router.route('/update-shopify-cred')
    .put(verifyJWT, updateShopifyCred)

export default router