import express from "express";
import { EditSelectedUser, createMessage, getAllUsers, getMessages, getSelectedUser, getUserById, userLogin, userRegister } from "../Controller/User-Controller.js";
import auth from "../Middleware/Auth-Middleware.js";
import multer from "multer";

const router = express.Router();
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname); 
    }
  });
  
  const upload = multer({ storage: storage });

router.post("/register",upload.single('image'),userRegister);
router.post("/login",userLogin);
router.get("/user/:id",auth,getUserById);
router.get("/users", auth, getAllUsers); 
router.post("/messages", auth, createMessage); 
router.get("/getmessages", auth, getMessages); 
router.get("/getselectedusers", auth, getSelectedUser); 
router.put("/selected-users", auth, EditSelectedUser); 
export default router;