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
router.post(
  "/upload",
  authenticate,
  upload.single("file"),
  uploadFile
);

router.get(
  "/group/:groupId",
  authenticate,
  getGroupFiles
);

// Folders
router.post(
  "/folders",
  authenticate,
  createFolder
);

router.get(
  "/folders/group/:groupId",
  authenticate,
  getGroupFolders
);

router.delete(
  "/folders/:id",
  authenticate,
  deleteFolder
);

// Generic file routes
router.get(
  "/:id",
  authenticate,
  getFileById
);

router.delete(
  "/:id",
  authenticate,
  deleteFile
);

export default router;