import express from "express";

import {
  uploadFile,
  getGroupFiles,
  getFileById,
  deleteFile,
  createFolder,
  getGroupFolders,
  deleteFolder,
} from "../controllers/fileController.js";
import upload from "../middleware/uploadMiddleware.js";
import authenticate from "../middleware/authMiddleware.js";

const router = express.Router();

// Files
router.post("/upload", authenticate, upload.single("file"), uploadFile);
router.get("/group/:groupId", getGroupFiles);

// Folders
router.post("/folders", createFolder);
router.get("/folders/group/:groupId", getGroupFolders);
router.delete("/folders/:id", deleteFolder);

// Generic file routes
router.get("/:id", getFileById);
router.delete("/:id", authenticate, deleteFile);

export default router;