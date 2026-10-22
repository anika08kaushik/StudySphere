import mongoose from 'mongoose'

const noteCommentSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    authorName: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    section: {
      type: String,
      default: '',
      trim: true,
    },
    resolved: {
      type: Boolean,
      default: false,
    },
    replies: [
      {
        author: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          default: null,
        },
        authorName: {
          type: String,
          required: true,
          trim: true,
        },
        content: {
          type: String,
          required: true,
          trim: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
)

const noteVersionSchema = new mongoose.Schema(
  {
    version: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    summary: {
      type: String,
      default: '',
    },
    modifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    modifiedByName: {
      type: String,
      default: 'Student',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
)

const noteSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudyGroup',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      default: 'Untitled Study Note',
    },
    content: {
      type: String,
      default: '',
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    authorName: {
      type: String,
      default: 'Student',
    },
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    permissions: {
      owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      editors: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      ],
      viewers: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      ],
      defaultAccess: {
        type: String,
        enum: ['viewer', 'editor'],
        default: 'editor',
      },
    },
    versions: [noteVersionSchema],
    comments: [noteCommentSchema],
    yjsState: {
      type: Buffer,
      default: null,
    },
  },
  { timestamps: true }
)

noteSchema.index({ groupId: 1, updatedAt: -1 })

export default mongoose.model('Note', noteSchema)
