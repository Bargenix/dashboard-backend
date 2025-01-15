import { Router } from "express";
import { changeCurrentPassword, forgotPassword, getCurrentUser, resetPassword, signin, signout, signup, updateUserDetails, verifyUser } from '../controllers/user.controller.js'
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/singup")
    .post(signup)

router.route("/verify-user/:token")
    .put(verifyUser)

router.route("/login-owner")
    .post(signin)

router.route("/logout")
    .get(verifyJWT, signout)

router.route("/current-user")
    .get(verifyJWT, getCurrentUser)

router.route("/change-password")
    .put(verifyJWT, changeCurrentPassword)

router.route("/update-profile")
    .put(verifyJWT,updateUserDetails);

router.route("/forgot-password")
    .post(forgotPassword)

router.route("/reset-password/:token")
    .put(resetPassword)

export default router