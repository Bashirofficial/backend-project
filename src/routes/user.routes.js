import { Router } from "express";
import { loginUser, logoutUser, refreshAccessToken, registerUser } from "../controllers/user.controllers.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router()

router.route("/register").post(
    //injecting middlewares
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
    registerUser
    )

router.route("/login").post(loginUser)

//secured routes
router.route("/logout").post(verifyJWT, logoutUser) //For this reaseon we write next() same in 
                                      //auth.middleware.js we have written next() so another 
                                      //middleware in .post( , , ) could execute

 router.route("/refresh-token").post(refreshAccessToken) //already putted in try and catch so we 
                                                        //are not usign verifyJwt middleware

export default router