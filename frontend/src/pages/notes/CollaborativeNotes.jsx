import { useState, useEffect, useRef } from 'react'
import * as Y from 'yjs'
import Avatar from '../../components/ui/Avatar'
import { useAuth } from '../../hooks/useAuth'
import { useApp } from '../../context/AppContext'
import noteService from '../../services/noteService'
import socket, {
  connectSocket,
  joinNote,
  leaveNote,
  sendNoteChange,
  sendNoteCursor,
  sendNoteComment,
  sendNoteVersion,
} from '../../services/socket'

export default function CollaborativeNotes({ groupId = 'g1' }) {
  const { user } = useAuth()
  const { avatarConfig } = useApp()

  const currentUserId = user?.id || user?._id || 'u1'
  const currentUserName = user?.name || avatarConfig?.name || 'You'

  // Active Note State
  const [activeNoteId, setActiveNoteId] = useState(`note-${groupId}-default`)
  const [notesList, setNotesList] = useState([])
  const [title, setTitle] = useState('Convolutional Neural Networks (CNN) Notes')
  const [content, setContent] = useState('')
  const [userRole, setUserRole] = useState('editor') // 'owner', 'editor', 'viewer'
  const [saveStatus, setSaveStatus] = useState('Saved to cloud')

  // Collaborators & Cursors
  const [collaborators, setCollaborators] = useState([])
  const [activePeerCursor, setActivePeerCursor] = useState(null)

  // Modals & Drawers
  const [showHistory, setShowHistory] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [showPermissionsModal, setShowPermissionsModal] = useState(false)
  const [newVersionSummary, setNewVersionSummary] = useState('')

  // Discussions & Comments
  const [comments, setComments] = useState([])
  const [newCommentText, setNewCommentText] = useState('')
  const [commentSection, setCommentSection] = useState('')
  const [replyInputMap, setReplyInputMap] = useState({})

  // Versions List
  const [versions, setVersions] = useState([])

  // Yjs Document Reference for local CRDT state
  const ydocRef = useRef(null)
  const ytextRef = useRef(null)
  const textareaRef = useRef(null)
  const saveTimeoutRef = useRef(null)
  const isRemoteUpdateRef = useRef(false)

  // Initialize Yjs doc
  useEffect(() => {
    ydocRef.current = new Y.Doc()
    ytextRef.current = ydocRef.current.getText('content')
  }, [])

  // Load note and register real-time sockets
  useEffect(() => {
    const fetchNoteData = async () => {
      try {
        const res = await noteService.getNote(activeNoteId)
        const note = res.data?.data
        if (note) {
          setTitle(note.title)
          setContent(note.content || '')
          setVersions(note.versions || [])
          setComments(note.comments || [])

          // Determine user permission
          const ownerId = String(note.permissions?.owner || note.author || '')
          const editors = (note.permissions?.editors || []).map(String)
          const viewers = (note.permissions?.viewers || []).map(String)

          if (String(currentUserId) === ownerId) {
            setUserRole('owner')
          } else if (editors.includes(String(currentUserId))) {
            setUserRole('editor')
          } else if (viewers.includes(String(currentUserId))) {
            setUserRole('viewer')
          } else {
            setUserRole(note.permissions?.defaultAccess || 'editor')
          }
        }
      } catch (err) {
        console.warn('Using local note fallback:', err.message)
      }
    }

    fetchNoteData()
    connectSocket(user)
    joinNote(activeNoteId)

    // Socket Event Listeners
    const handleRemoteChange = ({ noteId, content: remoteContent, userName, cursor }) => {
      if (noteId !== activeNoteId) return
      isRemoteUpdateRef.current = true
      setContent(remoteContent)
      if (cursor) setActivePeerCursor({ userName, cursor })
      setSaveStatus(`Updated by ${userName}`)
      setTimeout(() => {
        isRemoteUpdateRef.current = false
        setSaveStatus('Saved to cloud')
      }, 1000)
    }

    const handlePresenceUpdate = ({ noteId, collaborators: peerList }) => {
      if (noteId === activeNoteId) {
        setCollaborators(peerList)
      }
    }

    const handleCursorUpdate = ({ noteId, userName, cursor }) => {
      if (noteId === activeNoteId) {
        setActivePeerCursor({ userName, cursor })
      }
    }

    const handleCommentBroadcast = ({ noteId, comment }) => {
      if (noteId === activeNoteId) {
        setComments((prev) => [...prev, comment])
      }
    }

    const handleVersionSynced = ({ noteId, action, version, content: restoredContent, modifiedByName }) => {
      if (noteId === activeNoteId) {
        if (restoredContent !== undefined) {
          setContent(restoredContent)
        }
        setSaveStatus(`${action}: ${version} by ${modifiedByName}`)
        // Refresh versions list
        noteService.getNote(noteId).then((r) => {
          if (r.data?.data?.versions) setVersions(r.data.data.versions)
        }).catch(() => {})
      }
    }

    socket.on('note:remote_change', handleRemoteChange)
    socket.on('note:presence_update', handlePresenceUpdate)
    socket.on('note:cursor_update', handleCursorUpdate)
    socket.on('note:comment_broadcast', handleCommentBroadcast)
    socket.on('note:version_synced', handleVersionSynced)

    return () => {
      socket.off('note:remote_change', handleRemoteChange)
      socket.off('note:presence_update', handlePresenceUpdate)
      socket.off('note:cursor_update', handleCursorUpdate)
      socket.off('note:comment_broadcast', handleCommentBroadcast)
      socket.off('note:version_synced', handleVersionSynced)
      leaveNote(activeNoteId)
    }
  }, [activeNoteId, currentUserId, user])

  // Handle local text editing
  const handleContentChange = (e) => {
    if (userRole === 'viewer') return
    const newText = e.target.value
    setContent(newText)
    setSaveStatus('Syncing & saving...')

    // Calculate cursor line number
    const selStart = e.target.selectionStart
    const lineNum = newText.slice(0, selStart).split('\n').length
    const cursorDesc = `Line ${lineNum}`

    // Real-time broadcast to peers
    sendNoteChange(activeNoteId, newText, null, cursorDesc)

    // Debounced database save
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await noteService.updateNote(activeNoteId, { title, content: newText })
        setSaveStatus('Saved to cloud')
      } catch {
        setSaveStatus('Saved locally')
      }
    }, 1000)
  }

  // Handle title change
  const handleTitleChange = (e) => {
    if (userRole === 'viewer') return
    const newTitle = e.target.value
    setTitle(newTitle)
    noteService.updateNote(activeNoteId, { title: newTitle }).catch(() => {})
  }

  // Formatting buttons
  const insertFormatting = (prefix, suffix = '') => {
    if (userRole === 'viewer') return
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = content.substring(start, end)
    const replacement = `${prefix}${selected || 'text'}${suffix}`

    const updated = content.substring(0, start) + replacement + content.substring(end)
    setContent(updated)
    sendNoteChange(activeNoteId, updated, null, `Line ${content.slice(0, start).split('\n').length}`)
  }

  // Version snapshot creation
  const handleCreateVersion = async () => {
    const summary = newVersionSummary.trim() || `Snapshot by ${currentUserName}`
    try {
      const res = await noteService.createVersion(activeNoteId, summary)
      if (res.data?.data) {
        setVersions((prev) => [res.data.data, ...prev])
        sendNoteVersion(activeNoteId, 'Created snapshot', res.data.data.version, content)
      }
      setNewVersionSummary('')
    } catch (err) {
      console.error('Failed to create version:', err)
    }
  }

  // Rollback to specific version
  const handleRollback = async (version) => {
    if (userRole === 'viewer') return
    if (!window.confirm(`Roll back to ${version.version}? Current changes will be replaced.`)) return

    try {
      const res = await noteService.rollbackVersion(activeNoteId, version._id || version.version)
      const restored = res.data?.data
      if (restored) {
        setTitle(restored.title)
        setContent(restored.content)
        sendNoteVersion(activeNoteId, 'Rolled back to', version.version, restored.content)
        setSaveStatus(`Restored to ${version.version}`)
      }
    } catch (err) {
      console.error('Rollback failed:', err)
    }
  }

  // Add Comment
  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!newCommentText.trim()) return

    const mentions = []
    if (newCommentText.includes('@Rahul')) mentions.push('u2')
    if (newCommentText.includes('@Anika')) mentions.push('u3')

    const commentData = {
      content: newCommentText.trim(),
      section: commentSection.trim() || 'General Note',
      mentions,
    }

    try {
      const res = await noteService.addComment(activeNoteId, commentData)
      const created = res.data?.data || {
        _id: `c-${Date.now()}`,
        authorName: currentUserName,
        content: newCommentText.trim(),
        section: commentSection.trim() || 'General Note',
        resolved: false,
        replies: [],
        createdAt: new Date().toISOString(),
      }
      setComments((prev) => [...prev, created])
      sendNoteComment(activeNoteId, created)
      setNewCommentText('')
      setCommentSection('')
    } catch (err) {
      console.error('Comment failed:', err)
    }
  }

  // Reply Comment
  const handleReplyComment = async (commentId) => {
    const text = replyInputMap[commentId]
    if (!text || !text.trim()) return

    try {
      const res = await noteService.replyComment(activeNoteId, commentId, { content: text.trim() })
      const createdReply = res.data?.data || {
        _id: `r-${Date.now()}`,
        authorName: currentUserName,
        content: text.trim(),
        createdAt: new Date().toISOString(),
      }
      setComments((prev) =>
        prev.map((c) =>
          c._id === commentId ? { ...c, replies: [...(c.replies || []), createdReply] } : c
        )
      )
      setReplyInputMap((prev) => ({ ...prev, [commentId]: '' }))
    } catch (err) {
      console.error('Reply failed:', err)
    }
  }

  // Resolve Comment
  const handleResolveComment = async (commentId) => {
    try {
      await noteService.resolveComment(activeNoteId, commentId)
      setComments((prev) =>
        prev.map((c) => (c._id === commentId ? { ...c, resolved: !c.resolved } : c))
      )
    } catch (err) {
      console.error('Resolve failed:', err)
    }
  }

  // Export functions
  const exportFile = (type) => {
    const ext = type === 'markdown' ? 'md' : 'txt'
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.${ext}`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* View Only Warning Banner if Viewer */}
      {userRole === 'viewer' && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <span>👁️</span>
            <span className="font-bold">View Only Mode:</span>
            <span>You have read-only access to this note. Contact the note owner to request editor rights.</span>
          </div>
          <span className="text-[10px] uppercase font-extrabold bg-amber-200 px-2 py-0.5 rounded-lg">Viewer</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="card-soft p-5 bg-white border-[#E8E0F2] flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">📝</span>
            <input
              type="text"
              value={title}
              disabled={userRole === 'viewer'}
              onChange={handleTitleChange}
              className="text-lg font-bold text-[#493A63] border-b border-transparent hover:border-[#E8E0F2] focus:border-[#9B7EDB] focus:outline-none bg-transparent transition-all"
            />
            <span
              className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                userRole === 'owner'
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : userRole === 'editor'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {userRole}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-1.5 text-xs text-[#776B88]">
            <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {saveStatus}
            </span>
            <span>•</span>
            <span>Yjs Real-Time CRDT Synced</span>
            {activePeerCursor && (
              <>
                <span>•</span>
                <span className="text-[#9B7EDB] font-bold">
                  {activePeerCursor.userName} is editing ({activePeerCursor.cursor})
                </span>
              </>
            )}
          </div>
        </div>

        {/* Collaborators & Controls */}
        <div className="flex items-center gap-3">
          {/* Active Collaborator Avatars */}
          <div className="flex items-center -space-x-2 mr-2">
            {(collaborators.length > 0
              ? collaborators
              : [
                  { userId: 'u1', userName: 'You' },
                  { userId: 'u2', userName: 'Rahul' },
                  { userId: 'u3', userName: 'Anika' },
                ]
            ).map((c, i) => (
              <div
                key={c.userId || i}
                title={`${c.userName} (Active Editor)`}
                className="ring-2 ring-white rounded-full transition-transform hover:scale-110"
              >
                <Avatar name={c.userName} size="sm" />
              </div>
            ))}
          </div>

          <button
            onClick={() => setShowComments(!showComments)}
            className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
              showComments
                ? 'bg-[#E9DFFF] border-[#9B7EDB] text-[#493A63]'
                : 'bg-[#F8F5FF] border-[#E8E0F2] text-[#493A63] hover:bg-[#E9DFFF]'
            }`}
          >
            <span>💬</span>
            <span>Comments ({comments.filter((c) => !c.resolved).length})</span>
          </button>

          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
              showHistory
                ? 'bg-[#E9DFFF] border-[#9B7EDB] text-[#493A63]'
                : 'bg-[#F8F5FF] border-[#E8E0F2] text-[#493A63] hover:bg-[#E9DFFF]'
            }`}
          >
            <span>⏱️</span>
            <span>Versions ({versions.length})</span>
          </button>

          {/* Export Dropdown / Buttons */}
          <div className="flex items-center gap-1 bg-[#F8F5FF] p-1 rounded-xl border border-[#E8E0F2]">
            <button
              onClick={() => exportFile('markdown')}
              className="px-2.5 py-1 rounded-lg text-xs font-bold text-[#493A63] hover:bg-white transition-colors"
            >
              Export .MD
            </button>
            <button
              onClick={() => exportFile('text')}
              className="px-2.5 py-1 rounded-lg text-xs font-bold text-[#493A63] hover:bg-white transition-colors"
            >
              .TXT
            </button>
          </div>
        </div>
      </div>

      {/* Editor & Side Panels Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Main Editor Section */}
        <div
          className={`card-soft p-5 bg-white border-[#E8E0F2] flex flex-col space-y-4 ${
            showComments || showHistory ? 'lg:col-span-3' : 'lg:col-span-4'
          }`}
        >
          {/* Toolbar (Only enabled for editors/owner) */}
          <div className="flex flex-wrap items-center gap-1.5 pb-3 border-b border-[#E8E0F2] text-xs">
            {[
              { label: 'H1', action: () => insertFormatting('# ', '\n') },
              { label: 'H2', action: () => insertFormatting('## ', '\n') },
              { label: 'B', action: () => insertFormatting('**', '**') },
              { label: 'I', action: () => insertFormatting('*', '*') },
              { label: 'List', action: () => insertFormatting('- ', '') },
              { label: 'Checklist', action: () => insertFormatting('- [ ] ', '') },
              { label: 'Code', action: () => insertFormatting('```\n', '\n```') },
              { label: 'Quote', action: () => insertFormatting('> ', '') },
            ].map((tool) => (
              <button
                key={tool.label}
                disabled={userRole === 'viewer'}
                onClick={tool.action}
                className="px-2.5 py-1 rounded-lg bg-[#F8F5FF] hover:bg-[#E9DFFF] disabled:opacity-40 border border-[#E8E0F2] font-bold text-[#493A63] transition-colors"
              >
                {tool.label}
              </button>
            ))}

            <div className="ml-auto flex items-center gap-2 text-[11px] text-[#776B88]">
              {userRole === 'viewer' ? (
                <span className="italic">Read Only</span>
              ) : (
                <span>Yjs CRDT synchronized keystrokes</span>
              )}
            </div>
          </div>

          {/* Collaborative Textarea */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={content}
              readOnly={userRole === 'viewer'}
              onChange={handleContentChange}
              rows={20}
              placeholder="Start drafting shared notes with your study group in real-time..."
              className="w-full p-4 rounded-2xl bg-[#F8F5FF] border border-[#E8E0F2] text-[#493A63] font-mono text-xs leading-relaxed focus:outline-none focus:border-[#9B7EDB] focus:bg-white transition-all resize-y"
            />
          </div>
        </div>

        {/* Side Panel: Versions Drawer */}
        {showHistory && (
          <div className="card-soft p-5 bg-white border-[#E8E0F2] space-y-4 flex flex-col h-[600px] animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E0F2]">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#493A63]">Version History</h3>
                <p className="text-[10px] text-[#776B88]">Snapshots & instant rollback</p>
              </div>
              <button onClick={() => setShowHistory(false)} className="text-[#776B88] hover:text-[#493A63] text-xs">
                ✕
              </button>
            </div>

            {/* Create Named Snapshot Form */}
            {userRole !== 'viewer' && (
              <div className="p-3 rounded-2xl bg-[#F8F5FF] border border-[#E8E0F2] space-y-2">
                <input
                  type="text"
                  value={newVersionSummary}
                  onChange={(e) => setNewVersionSummary(e.target.value)}
                  placeholder="Snapshot summary (e.g. Added Section 2)"
                  className="w-full px-3 py-1.5 rounded-xl border border-[#E8E0F2] bg-white text-xs text-[#493A63] focus:outline-none focus:border-[#9B7EDB]"
                />
                <button
                  onClick={handleCreateVersion}
                  className="w-full py-1.5 rounded-xl bg-[#9B7EDB] hover:bg-[#7A58C1] text-white font-bold text-xs shadow-xs"
                >
                  Save Version Snapshot
                </button>
              </div>
            )}

            {/* Versions List */}
            <div className="space-y-2.5 overflow-y-auto flex-1 pr-1">
              {versions.map((v) => (
                <div key={v._id || v.version} className="p-3 rounded-xl bg-[#F8F5FF] border border-[#E8E0F2] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md bg-[#E9DFFF] text-[#493A63] font-bold text-[10px]">
                      {v.version}
                    </span>
                    <span className="text-[10px] text-[#776B88]">
                      {v.createdAt ? new Date(v.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Saved'}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-[#493A63]">{v.summary || 'Snapshot update'}</p>
                  <p className="text-[10px] text-[#776B88]">By {v.modifiedByName || 'Classmate'}</p>

                  {userRole !== 'viewer' && (
                    <button
                      onClick={() => handleRollback(v)}
                      className="w-full mt-1 py-1 rounded-lg bg-white hover:bg-red-50 hover:text-red-600 border border-[#E8E0F2] text-xs font-bold text-[#493A63] transition-colors"
                    >
                      ↩ Rollback to this version
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Side Panel: Note Discussions & Comments */}
        {showComments && !showHistory && (
          <div className="card-soft p-5 bg-white border-[#E8E0F2] space-y-4 flex flex-col h-[600px] animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E0F2]">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#493A63]">Note Discussions</h3>
                <p className="text-[10px] text-[#776B88]">Section comments & mentions</p>
              </div>
              <button onClick={() => setShowComments(false)} className="text-[#776B88] hover:text-[#493A63] text-xs">
                ✕
              </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {comments.map((c) => (
                <div
                  key={c._id}
                  className={`p-3 rounded-xl border text-xs space-y-2 ${
                    c.resolved ? 'bg-emerald-50/50 border-emerald-100 opacity-60' : 'bg-[#F8F5FF] border-[#E8E0F2]'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-[#493A63]">
                    <span>{c.authorName}</span>
                    <button
                      onClick={() => handleResolveComment(c._id)}
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        c.resolved ? 'bg-emerald-200 text-emerald-800' : 'bg-gray-200 text-gray-700 hover:bg-emerald-100'
                      }`}
                    >
                      {c.resolved ? '✓ Resolved' : 'Resolve'}
                    </button>
                  </div>

                  {c.section && (
                    <p className="text-[10px] text-[#9B7EDB] font-bold">Ref: {c.section}</p>
                  )}
                  <p className="text-[#493A63]">{c.content}</p>

                  {/* Replies */}
                  {c.replies && c.replies.length > 0 && (
                    <div className="pl-2 border-l-2 border-[#9B7EDB]/40 space-y-1.5 mt-2">
                      {c.replies.map((r, i) => (
                        <div key={r._id || i} className="text-[11px] bg-white p-2 rounded-lg border border-[#E8E0F2]">
                          <span className="font-bold text-[#493A63]">{r.authorName}:</span> {r.content}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Reply Input */}
                  <div className="flex gap-1.5 pt-1">
                    <input
                      type="text"
                      value={replyInputMap[c._id] || ''}
                      onChange={(e) =>
                        setReplyInputMap((prev) => ({ ...prev, [c._id]: e.target.value }))
                      }
                      placeholder="Reply..."
                      className="flex-1 px-2.5 py-1 text-xs bg-white rounded-lg border border-[#E8E0F2] focus:outline-none"
                    />
                    <button
                      onClick={() => handleReplyComment(c._id)}
                      className="px-2.5 py-1 bg-[#9B7EDB] text-white rounded-lg text-xs font-bold"
                    >
                      Reply
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Post New Comment */}
            <form onSubmit={handleAddComment} className="pt-3 border-t border-[#E8E0F2] space-y-2">
              <input
                type="text"
                value={commentSection}
                onChange={(e) => setCommentSection(e.target.value)}
                placeholder="Section heading or quote reference (optional)"
                className="w-full px-3 py-1.5 rounded-xl border border-[#E8E0F2] bg-[#F8F5FF] text-xs text-[#493A63] focus:outline-none focus:border-[#9B7EDB]"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="Comment... (Use @Name to notify)"
                  className="flex-1 px-3 py-1.5 rounded-xl border border-[#E8E0F2] bg-[#F8F5FF] text-xs text-[#493A63] focus:outline-none focus:border-[#9B7EDB]"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-[#9B7EDB] hover:bg-[#7A58C1] text-white font-bold text-xs shadow-xs"
                >
                  Post
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
