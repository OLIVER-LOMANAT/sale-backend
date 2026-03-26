import express from "express";
import multer from "multer";
import { uploadImage } from "../controllers/upload.controller.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload", upload.single("file"), uploadImage);

export default router;