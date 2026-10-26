import File from "../models/file.js";
import Folder from "../models/Folder.js";
import Membership from "../models/Membership.js";
import AuditLog from "../models/AuditLog.js";
import storageService from "../services/storageService.js";
import validateFile from "../services/fileValidationService.js";
import generateStorageKey from "../services/storageKeyService.js";
import { createNotification } from "../services/notificationService.js";

const getAuthorizedGroupId = (request) => request.authorizedGroupId;

const findAuthorizedFile = async (request) => {
  const file = await File.findById(request.params.id);
  return file && String(file.groupId) === getAuthorizedGroupId(request) ? file : null;
};

const canPerformFileAction = (request, file, action) => {
  const userId = request.user.userId || request.user.id;
  const isOwner = String(file.uploadedBy) === String(userId);
  const isGroupLeader = ["leader", "admin"].includes(
    request.authorizedMembership?.role,
  );
  const permissions = file.permissions || ["view", "download"];
  const sharedWith = file.sharedWith || [];
  const isSharedWithRequester = sharedWith.length === 0
    || sharedWith.some((sharedUserId) => String(sharedUserId) === String(userId));
  return isOwner || isGroupLeader || (isSharedWithRequester && permissions.includes(action));
};

const visibilityFilter = (request) => {
  const groupId = getAuthorizedGroupId(request);
  if (["leader", "admin"].includes(request.authorizedMembership?.role)) {
    return { groupId };
  }
  return {
    groupId,
    $and: [
      {
        $or: [
          { permissions: "view" },
          { permissions: { $exists: false } },
          { uploadedBy: request.user.userId || request.user.id },
        ],
      },
      {
        $or: [
          { sharedWith: { $exists: false } },
          { sharedWith: { $size: 0 } },
          { sharedWith: request.user.userId || request.user.id },
          { uploadedBy: request.user.userId || request.user.id },
        ],
      },
    ],
  };
};

const recordAudit = (request, action, targetType, targetId, groupId, details) =>
  AuditLog.create({
    userId: request.user.userId,
    userEmail: request.user.email || "",
    action,
    targetType,
    targetId,
    groupId,
    details,
  });

const notifyGroup = async (
  groupId,
  senderId,
  title,
  message,
  metadata = {},
  type = "general",
) => {
  const memberships = await Membership.find({ groupId, status: "active" })
    .select("userId")
    .lean();

  await Promise.all(
    memberships.map(({ userId }) =>
      createNotification({
        recipient: userId,
        sender: senderId,
        groupId,
        type,
        title,
        message,
        metadata,
      }),
    ),
  );
};

export const uploadFile = async (request, response) => {
  try {
    const groupId = getAuthorizedGroupId(request);
    const { groupId: requestedGroupId, folderId } = request.body || {};

    if (!groupId) {
      return response.status(400).json({ success: false, message: "Authorized group ID is required" });
    }
    if (requestedGroupId && String(requestedGroupId).toLowerCase() !== groupId.toLowerCase()) {
      return response.status(400).json({
        success: false,
        message: "Upload group ID does not match the authorized group",
      });
    }
    if (!request.file) {
      return response.status(400).json({ success: false, message: "File is required" });
    }
    if (folderId && !(await Folder.exists({ _id: folderId, groupId }))) {
      return response.status(400).json({
        success: false,
        message: "Folder does not belong to the authorized group",
      });
    }

    validateFile(request.file);
    const storageKey = generateStorageKey(groupId, request.file.originalname);
    await storageService.uploadFile(request.file, storageKey);

    const file = await File.create({
      name: request.file.originalname,
      originalName: request.file.originalname,
      mimeType: request.file.mimetype,
      size: request.file.size,
      storageKey,
      groupId,
      folderId: folderId || null,
      uploadedBy: request.user.userId || request.user.id,
    });

    await recordAudit(
      request,
      "file_upload",
      "file",
      file._id,
      groupId,
      `File uploaded: ${file.originalName}`,
    );
    await notifyGroup(
      groupId,
      request.user.userId,
      "Resource uploaded",
      `${request.user.name || request.user.email || "A group member"} uploaded ${file.originalName}`,
      { targetType: "file", targetId: String(file._id) },
      "upload",
    );

    return response.status(201).json({
      success: true,
      message: "File uploaded successfully",
      data: file,
    });
  } catch (error) {
    console.error("Upload file error:", error);
    return response.status(500).json({
      success: false,
      message: error.message || "Failed to upload file",
    });
  }
};

export const getGroupFiles = async (request, response) => {
  try {
    const files = await File.find(visibilityFilter(request))
      .populate("uploadedBy", "name email")
      .populate("folderId", "name")
      .sort({ createdAt: -1 });

    return response.status(200).json({
      success: true,
      message: "Files retrieved successfully",
      data: files,
    });
  } catch (error) {
    console.error("Get group files error:", error);
    return response.status(500).json({ success: false, message: "Failed to retrieve files" });
  }
};

export const getFileById = async (request, response) => {
  try {
    const file = await findAuthorizedFile(request);
    const action = request.query.download === "true" ? "download" : "view";
    if (!file) {
      return response.status(404).json({
        success: false,
        message: "File not found in the authorized group",
      });
    }
    if (!canPerformFileAction(request, file, action)) {
      return response.status(403).json({
        success: false,
        message: `You do not have permission to ${action} this resource`,
      });
    }
    if (!file.storageKey) {
      return response.status(404).json({
        success: false,
        message: "File storage location not found",
      });
    }

    const storedFile = await storageService.getFile(file.storageKey);
    if (!storedFile?.Body) {
      return response.status(404).json({
        success: false,
        message: "File could not be retrieved from storage",
      });
    }

    await recordAudit(
      request,
      "file_download",
      "file",
      file._id,
      file.groupId,
      `File downloaded: ${file.originalName}`,
    );
    await notifyGroup(
      file.groupId,
      request.user.userId,
      "Resource downloaded",
      `${request.user.name || request.user.email || "A group member"} downloaded ${file.originalName}`,
      { targetType: "file", targetId: String(file._id) },
    );
    response.setHeader("Content-Type", file.mimeType);
    response.setHeader("Content-Length", file.size);
    response.setHeader(
      "Content-Disposition",
      `${action === "download" ? "attachment" : "inline"}; filename="${encodeURIComponent(file.originalName)}"`,
    );
    return storedFile.Body.pipe(response);
  } catch (error) {
    console.error("Get file error:", error);
    return response.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve file",
    });
  }
};

export const deleteFile = async (request, response) => {
  try {
    const file = await findAuthorizedFile(request);
    if (!file) {
      return response.status(404).json({
        success: false,
        message: "File not found in the authorized group",
      });
    }
    if (!canPerformFileAction(request, file, "delete")) {
      return response.status(403).json({
        success: false,
        message: "You do not have permission to delete this resource",
      });
    }

    if (file.storageKey) await storageService.deleteFile(file.storageKey);
    await File.findByIdAndDelete(file._id);
    await recordAudit(
      request,
      "file_delete",
      "file",
      file._id,
      file.groupId,
      `File deleted: ${file.originalName}`,
    );
    await notifyGroup(
      file.groupId,
      request.user.userId,
      "Resource deleted",
      `${request.user.name || request.user.email || "A group member"} deleted ${file.originalName}`,
      { targetType: "file", targetId: String(file._id) },
    );

    return response.status(200).json({ success: true, message: "File deleted successfully" });
  } catch (error) {
    console.error("Delete file error:", error);
    return response.status(500).json({
      success: false,
      message: error.message || "Failed to delete file",
    });
  }
};

export const createFolder = async (request, response) => {
  try {
    const { name, parentFolderId } = request.body || {};
    const groupId = getAuthorizedGroupId(request);

    if (!name?.trim()) {
      return response.status(400).json({ success: false, message: "Folder name is required" });
    }
    if (parentFolderId && !(await Folder.exists({ _id: parentFolderId, groupId }))) {
      return response.status(400).json({
        success: false,
        message: "Parent folder does not belong to the authorized group",
      });
    }

    const folder = await Folder.create({
      name: name.trim(),
      groupId,
      parentFolderId: parentFolderId || null,
      createdBy: request.user.userId || request.user.id,
    });
    await recordAudit(
      request,
      "folder_create",
      "folder",
      folder._id,
      groupId,
      `Folder created: ${folder.name}`,
    );
    await notifyGroup(
      groupId,
      request.user.userId,
      "Folder created",
      `${request.user.name || request.user.email || "A group member"} created ${folder.name}`,
      { targetType: "folder", targetId: String(folder._id) },
    );

    return response.status(201).json({
      success: true,
      message: "Folder created successfully",
      data: folder,
    });
  } catch (error) {
    console.error("Create folder error:", error);
    return response.status(500).json({
      success: false,
      message: error.message || "Failed to create folder",
    });
  }
};

export const getGroupFolders = async (request, response) => {
  try {
    const folders = await Folder.find({ groupId: getAuthorizedGroupId(request) })
      .populate("createdBy", "name email")
      .sort({ name: 1 });

    return response.status(200).json({
      success: true,
      message: "Folders retrieved successfully",
      data: folders,
    });
  } catch (error) {
    console.error("Get group folders error:", error);
    return response.status(500).json({ success: false, message: "Failed to retrieve folders" });
  }
};

export const deleteFolder = async (request, response) => {
  try {
    const folder = await Folder.findOne({
      _id: request.params.id,
      groupId: getAuthorizedGroupId(request),
    });
    if (!folder) {
      return response.status(404).json({
        success: false,
        message: "Folder not found in the authorized group",
      });
    }

    await File.updateMany(
      { folderId: folder._id, groupId: folder.groupId },
      { $set: { folderId: null } },
    );
    await Folder.findByIdAndDelete(folder._id);
    await recordAudit(
      request,
      "folder_delete",
      "folder",
      folder._id,
      folder.groupId,
      `Folder deleted: ${folder.name}`,
    );
    await notifyGroup(
      folder.groupId,
      request.user.userId,
      "Folder deleted",
      `${request.user.name || request.user.email || "A group member"} deleted ${folder.name}`,
      { targetType: "folder", targetId: String(folder._id) },
    );

    return response.status(200).json({ success: true, message: "Folder deleted successfully" });
  } catch (error) {
    console.error("Delete folder error:", error);
    return response.status(500).json({
      success: false,
      message: error.message || "Failed to delete folder",
    });
  }
};

export const shareFile = async (request, response) => {
  try {
    const file = await findAuthorizedFile(request);
    const { userId } = request.body || {};
    if (!file) {
      return response.status(404).json({
        success: false,
        message: "File not found in the authorized group",
      });
    }
    if (!canPerformFileAction(request, file, "share")) {
      return response.status(403).json({
        success: false,
        message: "You do not have permission to share this resource",
      });
    }
    if (!userId) {
      return response.status(400).json({ success: false, message: "User ID is required" });
    }

    const recipientMembership = await Membership.findOne({
      userId,
      groupId: file.groupId,
      status: "active",
    });
    if (!recipientMembership) {
      return response.status(400).json({
        success: false,
        message: "The selected user is not an active member of this group",
      });
    }

    await File.updateOne({ _id: file._id }, { $addToSet: { sharedWith: userId } });
    await recordAudit(
      request,
      "file_share",
      "file",
      file._id,
      file.groupId,
      `File shared: ${file.originalName} with user ${userId}`,
    );
    await createNotification({
      recipient: userId,
      sender: request.user.userId,
      groupId: file.groupId,
      type: "general",
      title: "Resource shared",
      message: `${request.user.name || request.user.email || "A group member"} shared ${file.originalName}`,
      metadata: { targetType: "file", targetId: String(file._id) },
    });

    return response.status(200).json({ success: true, message: "File shared successfully" });
  } catch (error) {
    console.error("Share file error:", error);
    return response.status(500).json({
      success: false,
      message: error.message || "Failed to share file",
    });
  }
};

export const updatePermissions = async (request, response) => {
  try {
    const file = await findAuthorizedFile(request);
    const { allowedActions } = request.body || {};
    if (!file) {
      return response.status(404).json({
        success: false,
        message: "File not found in the authorized group",
      });
    }
    if (!canPerformFileAction(request, file, "update")) {
      return response.status(403).json({
        success: false,
        message: "You do not have permission to update this resource",
      });
    }
    if (!Array.isArray(allowedActions)) {
      return response.status(400).json({
        success: false,
        message: "allowedActions array is required",
      });
    }
    const validActions = new Set(["view", "download", "delete", "share", "update"]);
    if (allowedActions.some((action) => !validActions.has(action))) {
      return response.status(400).json({ success: false, message: "Invalid permission action" });
    }

    const membership = await Membership.findOne({
      userId: request.user.userId,
      groupId: file.groupId,
      status: "active",
    });
    if (!membership || !["leader", "admin"].includes(membership.role)) {
      return response.status(403).json({
        success: false,
        message: "Only group leaders and admins can change permissions",
      });
    }

    file.permissions = [...new Set(allowedActions)];
    await file.save();
    await recordAudit(
      request,
      "file_permission_update",
      "file",
      file._id,
      file.groupId,
      `Permissions updated for: ${file.originalName}`,
    );
    await notifyGroup(
      file.groupId,
      request.user.userId,
      "Resource permissions updated",
      `${request.user.name || request.user.email || "A group member"} updated permissions for ${file.originalName}`,
      { targetType: "file", targetId: String(file._id) },
    );

    return response.status(200).json({
      success: true,
      message: "Permissions updated successfully",
      data: { permissions: file.permissions },
    });
  } catch (error) {
    console.error("Update permissions error:", error);
    return response.status(500).json({
      success: false,
      message: error.message || "Failed to update permissions",
    });
  }
};

export const updateFileVersion = async (request, response) => {
  try {
    const file = await findAuthorizedFile(request);
    if (!file) {
      return response.status(404).json({
        success: false,
        message: "File not found in the authorized group",
      });
    }
    if (!canPerformFileAction(request, file, "update")) {
      return response.status(403).json({
        success: false,
        message: "You do not have permission to update this resource",
      });
    }

    const version = (file.version || 1) + 1;
    file.version = version;
    file.versionHistory.push({
      version,
      uploadedBy: request.user.userId,
      changeType: "update",
      comment: request.body?.comment || "File updated",
    });
    await file.save();
    await recordAudit(
      request,
      "file_version_update",
      "file",
      file._id,
      file.groupId,
      `Version ${version} recorded for: ${file.originalName}`,
    );
    await notifyGroup(
      file.groupId,
      request.user.userId,
      "Resource version updated",
      `${request.user.name || request.user.email || "A group member"} updated ${file.originalName} to version ${version}`,
      { targetType: "file", targetId: String(file._id) },
    );

    return response.status(200).json({
      success: true,
      message: "File version updated",
      data: { version, versionHistory: file.versionHistory },
    });
  } catch (error) {
    console.error("Update file version error:", error);
    return response.status(500).json({
      success: false,
      message: error.message || "Failed to update file version",
    });
  }
};
