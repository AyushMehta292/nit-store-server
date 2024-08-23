import { Router } from "express";
import {
    signUp,
    signIn,
    verifyOTP,
    signOut,
    // changePassword,
    // editProfile,
    // testing
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/signup").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        }, 
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    signUp
)
router.route("/verify-otp").post(upload.none(),verifyOTP)

router.route("/signin").post(upload.none(), signIn)

// router.route("/testing").get(testing)

//secure routes
router.route("/signout").post(verifyJWT, signOut)

export default router