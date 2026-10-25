import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  userEmail: {
    type: String,
    required: true,
  },
  action: {
    type: String,
    required: true,
    enum: [
      "file_upload",
      "file_download",
      "file_delete",
      "file_share",
      "file_permission_update",
      "file_version_update",
      "folder_create",
      "folder_delete",
      "folder_rename",
    ],
  },
  targetType: {
    type: String,
    enum: ["file", "folder"],
    required: true,
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "StudyGroup",
  },
  details: String,
  ipAddress: String,
  userAgent: String,
}, { timestamps: true });

export default mongoose.model("AuditLog", auditLogSchema);