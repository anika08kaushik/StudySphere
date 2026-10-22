import mongoose from 'mongoose'
import Note from '../models/Note.js'
import Membership from '../models/Membership.js'
import { createNotification } from '../services/notificationService.js'
import { createActivity } from '../services/activityService.js'

// In-memory fallback store for notes when MongoDB is offline
const devNotesStore = new Map()

const seedDevNotes = (groupId) => {
  const noteId = `note-${groupId || 'g1'}-default`
  devNotesStore.set(noteId, {
    _id: noteId,
    groupId: String(groupId || 'g1'),
    title: 'Convolutional Neural Networks (CNN) Notes',
    content: `# Convolutional Neural Networks (CNN)

## Overview & Core Concepts
CNNs are specialized deep learning architectures designed for processing structured grid data, such as images.

### Key Building Blocks:
1. Convolutional Layer: Applies kernels/filters over the receptive field.
2. Activation Function: Non-linear transformations (ReLU: max(0, x)).
3. Pooling Layer: Dimensionality reduction (Max Pooling / Average Pooling).
4. Fully Connected Layer: Classification head flattening spatial feature maps.

### Formula Reference:
Output dimension = ((W - K + 2P) / S) + 1
- W: Input size
- K: Kernel size
- P: Padding
- S: Stride`,
    author: 'u1',
    authorName: 'You',
    permissions: {
      owner: 'u1',
      editors: ['u2', 'u3'],
      viewers: ['u4'],
      defaultAccess: 'editor',
    },
    versions: [
      {
        _id: 'v1',
        version: 'v1.0',
        title: 'Convolutional Neural Networks (CNN) Notes',
        content: '# Convolutional Neural Networks (CNN)\n\nInitial draft of CNN notes.',
        summary: 'Initial note creation',
        modifiedByName: 'You',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        _id: 'v2',
        version: 'v1.1',
        title: 'Convolutional Neural Networks (CNN) Notes',
        content: '# Convolutional Neural Networks (CNN)\n\nAdded building blocks and pooling details.',
        summary: 'Restructured CNN intro & pooling',
        modifiedByName: 'Anika',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        _id: 'v3',
        version: 'v1.2',
        title: 'Convolutional Neural Networks (CNN) Notes',
        content: '# Convolutional Neural Networks (CNN)\n\nAdded math formulas for convolution layer.',
        summary: 'Added Convolution Layer formulas',
        modifiedByName: 'Rahul',
        createdAt: new Date(Date.now() - 600000).toISOString(),
      },
    ],
    comments: [
      {
        _id: 'c1',
        author: 'u2',
        authorName: 'Rahul',
        content: 'Should we add the ResNet skip connection formula here?',
        section: 'Formula Reference',
        resolved: false,
        replies: [
          {
            _id: 'r1',
            author: 'u3',
            authorName: 'Anika',
            content: 'Yes, let us link it with lecture slides in Resources.',
            createdAt: new Date(Date.now() - 1200000).toISOString(),
          },
        ],
        createdAt: new Date(Date.now() - 1800000).toISOString(),
      },
    ],
    updatedAt: new Date().toISOString(),
  })
}

// Helper to check user permission on note
const checkNotePermission = (note, userId, action = 'edit') => {
  if (process.env.NODE_ENV !== 'production' && !userId) return true
  const uid = String(userId)
  const ownerId = String(note.permissions?.owner || note.author || '')
  if (uid === ownerId) return true

  if (action === 'delete' || action === 'permission') {
    return uid === ownerId
  }

  // Edit action
  const editors = (note.permissions?.editors || []).map(String)
  if (editors.includes(uid)) return true
  if (note.permissions?.defaultAccess === 'editor') return true

  return false
}

export const getNotes = async (request, response) => {
  try {
    const { groupId } = request.params
    const stringGroupId = String(groupId)

    if (mongoose.connection.readyState !== 1) {
      if (devNotesStore.size === 0) seedDevNotes(stringGroupId)
      const list = Array.from(devNotesStore.values()).filter(
        (n) => String(n.groupId) === stringGroupId
      )
      return response.status(200).json({ success: true, data: list })
    }

    const notes = await Note.find({ groupId: stringGroupId })
      .select('title author authorName updatedAt permissions')
      .sort({ updatedAt: -1 })

    response.status(200).json({ success: true, data: notes })
  } catch (error) {
    console.error('Get notes error:', error)
    response.status(500).json({ success: false, message: 'Failed to fetch notes' })
  }
}

export const getNoteById = async (request, response) => {
  try {
    const { noteId } = request.params

    if (mongoose.connection.readyState !== 1) {
      if (!devNotesStore.has(noteId)) seedDevNotes()
      const note = devNotesStore.get(noteId) || Array.from(devNotesStore.values())[0]
      return response.status(200).json({ success: true, data: note })
    }

    const note = await Note.findById(noteId)
    if (!note) {
      return response.status(404).json({ success: false, message: 'Note not found' })
    }

    response.status(200).json({ success: true, data: note })
  } catch (error) {
    console.error('Get note error:', error)
    response.status(500).json({ success: false, message: 'Failed to fetch note' })
  }
}

export const createNote = async (request, response) => {
  try {
    const { groupId } = request.params
    const { title, content } = request.body
    const userId = request.user?.userId || 'u1'
    const userName = request.user?.name || 'Classmate'
    const stringGroupId = String(groupId)

    if (!title || !title.trim()) {
      return response.status(400).json({ success: false, message: 'Title is required' })
    }

    if (mongoose.connection.readyState !== 1) {
      const newId = `note-${Date.now()}`
      const noteObj = {
        _id: newId,
        groupId: stringGroupId,
        title: title.trim(),
        content: content || '',
        author: userId,
        authorName: userName,
        permissions: {
          owner: userId,
          editors: [],
          viewers: [],
          defaultAccess: 'editor',
        },
        versions: [
          {
            _id: `v-${Date.now()}`,
            version: 'v1.0',
            title: title.trim(),
            content: content || '',
            summary: 'Initial note creation',
            modifiedByName: userName,
            createdAt: new Date().toISOString(),
          },
        ],
        comments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      devNotesStore.set(newId, noteObj)

      createActivity({
        userId,
        userName,
        groupId: stringGroupId,
        type: 'note',
        action: `created note "${title.trim()}"`,
        target: 'Collaborative Notes',
      })

      return response.status(201).json({ success: true, data: noteObj })
    }

    const note = await Note.create({
      groupId: stringGroupId,
      title: title.trim(),
      content: content || '',
      author: userId,
      authorName: userName,
      permissions: {
        owner: userId,
        defaultAccess: 'editor',
      },
      versions: [
        {
          version: 'v1.0',
          title: title.trim(),
          content: content || '',
          summary: 'Initial note creation',
          modifiedBy: userId,
          modifiedByName: userName,
        },
      ],
    })

    createActivity({
      userId,
      userName,
      groupId: stringGroupId,
      type: 'note',
      action: `created note "${title.trim()}"`,
      target: 'Collaborative Notes',
    })

    response.status(201).json({ success: true, data: note })
  } catch (error) {
    console.error('Create note error:', error)
    response.status(500).json({ success: false, message: 'Failed to create note' })
  }
}

export const updateNote = async (request, response) => {
  try {
    const { noteId } = request.params
    const { title, content } = request.body
    const userId = request.user?.userId || 'u1'
    const userName = request.user?.name || 'Classmate'

    if (mongoose.connection.readyState !== 1) {
      const note = devNotesStore.get(noteId) || Array.from(devNotesStore.values())[0]
      if (!note) return response.status(404).json({ success: false, message: 'Note not found' })

      if (!checkNotePermission(note, userId, 'edit')) {
        return response.status(403).json({ success: false, message: 'You only have view access for this note' })
      }

      if (title !== undefined) note.title = title.trim()
      if (content !== undefined) note.content = content
      note.lastModifiedBy = userId
      note.updatedAt = new Date().toISOString()

      return response.status(200).json({ success: true, data: note })
    }

    const note = await Note.findById(noteId)
    if (!note) return response.status(404).json({ success: false, message: 'Note not found' })

    if (!checkNotePermission(note, userId, 'edit')) {
      return response.status(403).json({ success: false, message: 'You only have view access for this note' })
    }

    if (title !== undefined) note.title = title.trim()
    if (content !== undefined) note.content = content
    note.lastModifiedBy = userId
    await note.save()

    response.status(200).json({ success: true, data: note })
  } catch (error) {
    console.error('Update note error:', error)
    response.status(500).json({ success: false, message: 'Failed to update note' })
  }
}

export const createNoteVersion = async (request, response) => {
  try {
    const { noteId } = request.params
    const { summary } = request.body
    const userId = request.user?.userId || 'u1'
    const userName = request.user?.name || 'Classmate'

    if (mongoose.connection.readyState !== 1) {
      const note = devNotesStore.get(noteId) || Array.from(devNotesStore.values())[0]
      if (!note) return response.status(404).json({ success: false, message: 'Note not found' })

      const nextVerNum = (note.versions.length + 1).toFixed(1)
      const versionObj = {
        _id: `v-${Date.now()}`,
        version: `v1.${note.versions.length}`,
        title: note.title,
        content: note.content,
        summary: summary || `Snapshot by ${userName}`,
        modifiedByName: userName,
        createdAt: new Date().toISOString(),
      }
      note.versions.unshift(versionObj)
      return response.status(201).json({ success: true, data: versionObj })
    }

    const note = await Note.findById(noteId)
    if (!note) return response.status(404).json({ success: false, message: 'Note not found' })

    const versionStr = `v1.${note.versions.length}`
    note.versions.unshift({
      version: versionStr,
      title: note.title,
      content: note.content,
      summary: summary || `Snapshot by ${userName}`,
      modifiedBy: userId,
      modifiedByName: userName,
    })
    await note.save()

    response.status(201).json({ success: true, data: note.versions[0] })
  } catch (error) {
    console.error('Create version error:', error)
    response.status(500).json({ success: false, message: 'Failed to create note version' })
  }
}

export const rollbackNoteVersion = async (request, response) => {
  try {
    const { noteId } = request.params
    const { versionId } = request.body
    const userId = request.user?.userId || 'u1'

    if (!versionId) {
      return response.status(400).json({ success: false, message: 'versionId is required for rollback' })
    }

    if (mongoose.connection.readyState !== 1) {
      const note = devNotesStore.get(noteId) || Array.from(devNotesStore.values())[0]
      if (!note) return response.status(404).json({ success: false, message: 'Note not found' })

      if (!checkNotePermission(note, userId, 'edit')) {
        return response.status(403).json({ success: false, message: 'You do not have permission to rollback this note' })
      }

      const targetVersion = note.versions.find((v) => v._id === versionId || v.version === versionId)
      if (!targetVersion) {
        return response.status(404).json({ success: false, message: 'Target version not found' })
      }

      note.title = targetVersion.title
      note.content = targetVersion.content
      note.updatedAt = new Date().toISOString()

      return response.status(200).json({
        success: true,
        message: `Restored to ${targetVersion.version}`,
        data: note,
      })
    }

    const note = await Note.findById(noteId)
    if (!note) return response.status(404).json({ success: false, message: 'Note not found' })

    if (!checkNotePermission(note, userId, 'edit')) {
      return response.status(403).json({ success: false, message: 'You do not have permission to rollback this note' })
    }

    const targetVersion = note.versions.id(versionId) || note.versions.find((v) => v.version === versionId)
    if (!targetVersion) {
      return response.status(404).json({ success: false, message: 'Target version not found' })
    }

    note.title = targetVersion.title
    note.content = targetVersion.content
    note.lastModifiedBy = userId
    await note.save()

    response.status(200).json({
      success: true,
      message: `Restored to ${targetVersion.version}`,
      data: note,
    })
  } catch (error) {
    console.error('Rollback error:', error)
    response.status(500).json({ success: false, message: 'Failed to rollback note' })
  }
}

export const addNoteComment = async (request, response) => {
  try {
    const { noteId } = request.params
    const { content, section, mentions = [] } = request.body
    const userId = request.user?.userId || 'u1'
    const userName = request.user?.name || 'Classmate'

    if (!content || !content.trim()) {
      return response.status(400).json({ success: false, message: 'Comment content is required' })
    }

    if (mongoose.connection.readyState !== 1) {
      const note = devNotesStore.get(noteId) || Array.from(devNotesStore.values())[0]
      if (!note) return response.status(404).json({ success: false, message: 'Note not found' })

      const commentObj = {
        _id: `c-${Date.now()}`,
        author: userId,
        authorName: userName,
        content: content.trim(),
        section: section || '',
        resolved: false,
        replies: [],
        createdAt: new Date().toISOString(),
      }
      note.comments.push(commentObj)

      // Notify mentioned peers
      for (const recipientId of mentions) {
        createNotification({
          recipient: recipientId,
          sender: userId,
          groupId: note.groupId,
          type: 'note',
          title: 'Note Discussion Mention',
          message: `${userName} mentioned you on "${note.title}": "${content.slice(0, 50)}"`,
        })
      }

      return response.status(201).json({ success: true, data: commentObj })
    }

    const note = await Note.findById(noteId)
    if (!note) return response.status(404).json({ success: false, message: 'Note not found' })

    const newComment = {
      author: userId,
      authorName: userName,
      content: content.trim(),
      section: section || '',
      replies: [],
    }
    note.comments.push(newComment)
    await note.save()

    const createdComment = note.comments[note.comments.length - 1]

    for (const recipientId of mentions) {
      createNotification({
        recipient: recipientId,
        sender: userId,
        groupId: note.groupId,
        type: 'note',
        title: 'Note Discussion Mention',
        message: `${userName} mentioned you on "${note.title}": "${content.slice(0, 50)}"`,
      })
    }

    response.status(201).json({ success: true, data: createdComment })
  } catch (error) {
    console.error('Add comment error:', error)
    response.status(500).json({ success: false, message: 'Failed to add comment' })
  }
}

export const replyNoteComment = async (request, response) => {
  try {
    const { noteId, commentId } = request.params
    const { content } = request.body
    const userId = request.user?.userId || 'u1'
    const userName = request.user?.name || 'Classmate'

    if (!content || !content.trim()) {
      return response.status(400).json({ success: false, message: 'Reply content is required' })
    }

    if (mongoose.connection.readyState !== 1) {
      const note = devNotesStore.get(noteId) || Array.from(devNotesStore.values())[0]
      const comment = note?.comments?.find((c) => c._id === commentId)
      if (!comment) return response.status(404).json({ success: false, message: 'Comment not found' })

      const replyObj = {
        _id: `r-${Date.now()}`,
        author: userId,
        authorName: userName,
        content: content.trim(),
        createdAt: new Date().toISOString(),
      }
      comment.replies.push(replyObj)
      return response.status(201).json({ success: true, data: replyObj })
    }

    const note = await Note.findById(noteId)
    if (!note) return response.status(404).json({ success: false, message: 'Note not found' })

    const comment = note.comments.id(commentId)
    if (!comment) return response.status(404).json({ success: false, message: 'Comment not found' })

    const replyObj = {
      author: userId,
      authorName: userName,
      content: content.trim(),
    }
    comment.replies.push(replyObj)
    await note.save()

    response.status(201).json({ success: true, data: comment.replies[comment.replies.length - 1] })
  } catch (error) {
    console.error('Reply comment error:', error)
    response.status(500).json({ success: false, message: 'Failed to reply to comment' })
  }
}

export const resolveNoteComment = async (request, response) => {
  try {
    const { noteId, commentId } = request.params

    if (mongoose.connection.readyState !== 1) {
      const note = devNotesStore.get(noteId) || Array.from(devNotesStore.values())[0]
      const comment = note?.comments?.find((c) => c._id === commentId)
      if (!comment) return response.status(404).json({ success: false, message: 'Comment not found' })
      comment.resolved = !comment.resolved
      return response.status(200).json({ success: true, data: comment })
    }

    const note = await Note.findById(noteId)
    if (!note) return response.status(404).json({ success: false, message: 'Note not found' })

    const comment = note.comments.id(commentId)
    if (!comment) return response.status(404).json({ success: false, message: 'Comment not found' })

    comment.resolved = !comment.resolved
    await note.save()

    response.status(200).json({ success: true, data: comment })
  } catch (error) {
    console.error('Resolve comment error:', error)
    response.status(500).json({ success: false, message: 'Failed to resolve comment' })
  }
}

export const updateNotePermissions = async (request, response) => {
  try {
    const { noteId } = request.params
    const { defaultAccess, editors, viewers } = request.body
    const userId = request.user?.userId || 'u1'

    if (mongoose.connection.readyState !== 1) {
      const note = devNotesStore.get(noteId) || Array.from(devNotesStore.values())[0]
      if (!note) return response.status(404).json({ success: false, message: 'Note not found' })

      if (!checkNotePermission(note, userId, 'permission')) {
        return response.status(403).json({ success: false, message: 'Only the note owner can update permissions' })
      }

      if (defaultAccess) note.permissions.defaultAccess = defaultAccess
      if (editors) note.permissions.editors = editors
      if (viewers) note.permissions.viewers = viewers
      return response.status(200).json({ success: true, data: note.permissions })
    }

    const note = await Note.findById(noteId)
    if (!note) return response.status(404).json({ success: false, message: 'Note not found' })

    if (!checkNotePermission(note, userId, 'permission')) {
      return response.status(403).json({ success: false, message: 'Only the note owner can update permissions' })
    }

    if (defaultAccess) note.permissions.defaultAccess = defaultAccess
    if (editors) note.permissions.editors = editors
    if (viewers) note.permissions.viewers = viewers
    await note.save()

    response.status(200).json({ success: true, data: note.permissions })
  } catch (error) {
    console.error('Permissions update error:', error)
    response.status(500).json({ success: false, message: 'Failed to update note permissions' })
  }
}
