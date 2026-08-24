import File from "../models/File.js";
import Folder from "../models/Folder.js";
import storageService from "../services/storageService.js";
import validateFile from "../services/fileValidationService.js";
import generateStorageKey from "../services/storageKeyService.js";

export const uploadFile = async (req, res) => {
  try {
    const { groupId, folderId } = req.body || {};

    if (!groupId) {
      return res.status(400).json({
        success: false,
        message: "groupId is required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "File is required",
      });
    }

    validateFile(req.file);

    const storageKey = generateStorageKey(groupId, req.file.originalname);

    await storageService.uploadFile(req.file, storageKey);

    const file = await File.create({
      name: req.file.originalname,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      storageKey,
      groupId,
      folderId: folderId || null,
      uploadedBy: req.user.userId || req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: "File uploaded successfully",
      data: file,
    });
  } catch (error) {
    console.error("Upload file error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to upload file",
    });
  }
};

export const getGroupFiles = async (req, res) => {
  try {
    const { groupId } = req.params;

    const files = await File.find({ groupId })
      .populate("uploadedBy", "name email")
      .populate("folderId", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Files retrieved successfully",
      data: files,
    });
  } catch (error) {
    console.error("Get group files error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve files",
    });
  }
};

export const getFileById = async (req, res) => {
  try {
    const { id } = req.params;

    const file = await File.findById(id)
      .populate("uploadedBy", "name email")
      .populate("folderId", "name");

    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "File retrieved successfully",
      data: file,
    });
  } catch (error) {
    console.error("Get file error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve file",
    });
  }
};

export const deleteFile = async (req, res) => {
  try {
    const { id } = req.params;

    const file = await File.findById(id);

    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    if (file.storageKey) {
      await storageService.deleteFile(file.storageKey);
    }

    await File.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    console.error("Delete file error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete file",
    });
  }
};

export const createFolder = async (req, res) => {
  try {
    const { name, groupId, parentFolderId } = req.body;

    if (!name || !groupId) {
      return res.status(400).json({
        success: false,
        message: "Folder name and groupId are required",
      });
    }

    const folder = await Folder.create({
      name,
      groupId,
      parentFolderId: parentFolderId || null,
      createdBy: req.user?.id,
    });

    return res.status(201).json({
      success: true,
      message: "Folder created successfully",
      data: folder,
    });
  } catch (error) {
    console.error("Create folder error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create folder",
    });
  }
};

export const getGroupFolders = async (req, res) => {
  try {
    const { groupId } = req.params;

    const folders = await Folder.find({ groupId })
      .populate("createdBy", "name email")
      .sort({ name: 1 });

    return res.status(200).json({
      success: true,
      message: "Folders retrieved successfully",
      data: folders,
    });
  } catch (error) {
    console.error("Get group folders error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve folders",
    });
  }
};

export const deleteFolder = async (req, res) => {
  try {
    const { id } = req.params;

    const folder = await Folder.findById(id);

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: "Folder not found",
      });
    }

    await Folder.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Folder deleted successfully",
    });
  } catch (error) {
    console.error("Delete folder error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete folder",
    });
  }
};