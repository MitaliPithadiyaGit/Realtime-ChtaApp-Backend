import express from "express";
import { getUser, userLogin, userRegister } from "../Controller/User-Controller.js";
import auth from "../Middleware/Auth-Middleware.js";

const router = express.Router();


router.post("/register",userRegister);
router.post("/login",userLogin);
router.get("/user",auth,getUser);
export default router;