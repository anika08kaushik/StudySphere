import express from "express";
import {
  uploadFile,
  getGroupFiles,
  getFileById,
  deleteFile,
  createFolder,
  getGroupFolders,
  deleteFolder,
  shareFile,
  updatePermissions,
  updateFileVersion,
} from "../controllers/fileController.js";
import searchService from "../services/searchService.js";
import upload from "../middleware/uploadMiddleware.js";
import authenticate from "../middleware/authMiddleware.js";
import authorizeGroup from "../middleware/authzMiddleware.js";

const router = express.Router();

// Files
router.post(
  "/upload",
  authenticate,
  authorizeGroup,
  upload.single("file"),
  uploadFile
);

router.get(
  "/group/:groupId",
  authenticate,
  authorizeGroup,
  getGroupFiles
);

// Search
router.get(
  '/search',
  authenticate,
  authorizeGroup,
  searchService.searchFiles,
);

router.get(
  '/search/suggestions',
  authenticate,
  authorizeGroup,
  searchService.getSuggestions,
);

// Folders
router.post(
  "/folders",
  authenticate,
  authorizeGroup,
  createFolder
);

router.get(
  "/folders/group/:groupId",
  authenticate,
  authorizeGroup,
  getGroupFolders
);

router.delete(
  "/folders/:id",
  authenticate,
  authorizeGroup,
  deleteFolder
);

// Generic file routes
router.get(
  "/:id",
  authenticate,
  authorizeGroup,
  getFileById
);

router.delete(
  "/:id",
  authenticate,
  authorizeGroup,
  deleteFile
);

// Sharing and permissions
router.post(
  "/:id/share",
  authenticate,
  authorizeGroup,
  shareFile,
);

router.post(
  "/:id/permissions",
  authenticate,
  authorizeGroup,
  updatePermissions,
);

// File versioning
router.post(
  "/:id/version",
  authenticate,
  authorizeGroup,
  updateFileVersion,
);

export default router;