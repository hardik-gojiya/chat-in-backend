import express from "express";
import { Router } from "express";
import {
  getuserfordashboard,
  getmessages,
  sendmessage,
  deleteMsg,
  editMsg,
} from "../controllers/message.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { fileDownload } from "../utils/Cloudnary.js";

const router = express.Router();

router.get("/allusers", protectRoute, getuserfordashboard);
router.get("/chat/:id", protectRoute, getmessages);
router.post(
  "/send/:id",
  protectRoute,
  upload.single("selectedFile"),
  sendmessage
);
router.delete("/delete/:id", protectRoute, deleteMsg);
router.put("/edit/:id", protectRoute, editMsg);
router.post("/filedownload", protectRoute, fileDownload);

export default router;
