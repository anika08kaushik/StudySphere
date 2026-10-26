import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    originalName: {
      type: String,
      required: true,
      trim: true,
    },

    mimeType: {
      type: String,
      required: true,
    },

    size: {
      type: Number,
      required: true,
    },

    storageKey: {
      type: String,
      default: null,
    },

    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudyGroup",
      required: true,
    },

    folderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Folder",
      default: null,
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    sharedWith: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],

    permissions: {
      type: [String],
      default: ["view", "download"],
    },

    version: {
      type: Number,
      default: 1,
    },

    versionHistory: [
      {
        version: Number,
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        changedAt: {
          type: Date,
          default: Date.now,
        },
        changeType: {
          type: String,
          enum: ["upload", "update", "restore"],
          default: "update",
        },
        comment: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const File = mongoose.model("File", fileSchema);

export default File;