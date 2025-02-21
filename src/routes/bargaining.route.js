import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    setBargainingByCategory,
    setBargainingByProduct,
    setBargainingToAllProducts,
    deleteBargaining,
    getBargainingDetails,
    deactivateAllProducts,
    deactivateByCategory,
    setBulkMinPrice,  // Add this new import
    sendProductData,
    requestForBargain,
    getBargainRequestsByShop,
    markAsRead,
    getBargainInfo,
    setBargainingForSingleProduct
} from "../controllers/bargaining.controller.js";

const router = Router();

router.route('/set-by-category')
    .post(verifyJWT, setBargainingByCategory);

router.route('/set-all-products')
    .post(verifyJWT, setBargainingToAllProducts);

router.route('/set-by-product')
    .post(verifyJWT, setBargainingByProduct);

router.route('/set-min-price')
    .post(verifyJWT, setBargainingForSingleProduct);

router.route('/set-min-price-bulk')  // Add this new route
    .post(verifyJWT, setBulkMinPrice);

router.route('/delete/:productId')
    .delete(verifyJWT, deleteBargaining);

router.route('/details')
    .get(verifyJWT, getBargainingDetails);

router.route('/deactivate-all')
    .post(verifyJWT, deactivateAllProducts);

router.route('/deactivate-category')
    .post(verifyJWT, deactivateByCategory);

router.route('/bargain-info/:id')
    .get(getBargainInfo)

router.route('/sendData')
    .post(sendProductData)

router.route('/request-bargain')
    .post(requestForBargain)

router.route('/get-bargain-request')
    .post(verifyJWT, getBargainRequestsByShop)

router.route('/request-read/:id')
    .put(verifyJWT, markAsRead)

export default router;