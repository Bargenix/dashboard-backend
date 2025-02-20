import { Router } from "express";
import { changeCurrentPassword, forgotPassword, getAllUsers,getCurrentUser, resetPassword, signin, updateUserRole, signout, signup, updateUserDetails, verifyUser } from '../controllers/user.controller.js'
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {getCompanyByUserId} from '../controllers/company.controller.js'
const router = Router();

router.route("/signup")
    .post(signup)

router.route("/verify-user")
    .put(verifyUser)

router.route("/signin")
    .post(signin)

router.route("/signout")
    .get(verifyJWT, signout)

router.route("/current-user")
    .get(verifyJWT, getCurrentUser)

router.route("/change-password")
    .put(verifyJWT, changeCurrentPassword)

router.route("/update-profile")
    .put(verifyJWT, updateUserDetails);

router.route("/forgot-password")
    .post(forgotPassword)

router.route("/reset-password")
    .put(resetPassword)

router.get('/getUser', getAllUsers);
router.get('/companies/:userId', getCompanyByUserId);


export default router