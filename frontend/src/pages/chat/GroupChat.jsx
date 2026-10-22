import { useState, useRef, useEffect } from 'react'
import Avatar from '../../components/ui/Avatar'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../hooks/useAuth'
import chatService from '../../services/chatService'
import socket, {
  connectSocket,
  disconnectSocket,
  joinGroup,
  leaveGroup,
  sendMessage,
  emitTyping,
  reactToMessage,
} from '../../services/socket'
import { messages as initialMockMessages } from '../../mock/messages'

const CHANNELS = [
  { id: 'general', name: '💬 Student Lounge', desc: 'General campus chat & discussions' },
  { id: 'study', name: '📚 Study Help', desc: 'Ask questions & solve homework together' },
  { id: 'tech', name: '💻 Code & Tech', desc: 'Software engineering, algorithms & projects' },
  { id: 'music', name: '🎵 Chill & Lofi', desc: 'Share study playlists & lofi beats' },
]

const EMOJI_OPTIONS = ['👍', '❤️', '💡', '🔥', '👏', '🎉']

export default function GroupChat({ groupId = 'g1', members = [] }) {
  const { avatarConfig } = useApp()
  const { user } = useAuth()
  const [activeChannel, setActiveChannel] = useState('general')
  const [msgList, setMsgList] = useState([])
  const [input, setInput] = useState('')
  const [replyingTo, setReplyingTo] = useState(null)
  const [editingMessageId, setEditingMessageId] = useState(null)
  const [editInput, setEditInput] = useState('')
  const [typingUsers, setTypingUsers] = useState([])
  const [onlineMembers, setOnlineMembers] = useState(members)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeReactionPicker, setActiveReactionPicker] = useState(null)
  const [pinnedMessage, setPinnedMessage] = useState(null)

  // Mentions State
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [selectedMentions, setSelectedMentions] = useState([])

  // Attachments State
  const [attachments, setAttachments] = useState([])
  const fileInputRef = useRef(null)
  const bottomRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  const currentUserId = user?.id || user?._id || 'u1'
  const currentUserName = user?.name || avatarConfig?.name || 'You'

  // Default known members for mention autocompletion
  const availableMembers = members.length > 0 ? members : [
    { id: 'u1', name: 'You', profilePhoto: null },
    { id: 'u2', name: 'Rahul', profilePhoto: null },
    { id: 'u3', name: 'Anika', profilePhoto: null },
    { id: 'u4', name: 'Karan', profilePhoto: null },
    { id: 'u5', name: 'Aryan', profilePhoto: null },
  ]

  useEffect(() => {
    if (!groupId) return undefined

    const loadMessages = async () => {
      try {
        const response = await chatService.getMessages(groupId)
        const data = response.data?.data || []
        if (data.length > 0) {
          setMsgList(data)
          const pinned = data.find((m) => m.pinned)
          if (pinned) setPinnedMessage(pinned.content)
        } else {
          const formattedMocks = initialMockMessages.map((m) => ({
            _id: m._id,
            groupId,
            senderId: {
              _id: m.sender,
              name: m.sender === 'u1' ? currentUserName : m.sender === 'u2' ? 'Rahul' : m.sender === 'u3' ? 'Anika' : 'Aryan',
              profilePhoto: null,
            },
            content: m.content,
            reactions: [],
            pinned: m._id === 'm1',
            createdAt: m.createdAt,
          }))
          setMsgList(formattedMocks)
          setPinnedMessage(formattedMocks[0]?.content)
        }
      } catch (loadError) {
        console.warn('API message load fallback to mock data:', loadError.message)
        const formattedMocks = initialMockMessages.map((m) => ({
          _id: m._id,
          groupId,
          senderId: {
            _id: m.sender,
            name: m.sender === 'u1' ? currentUserName : m.sender === 'u2' ? 'Rahul' : m.sender === 'u3' ? 'Anika' : 'Aryan',
            profilePhoto: null,
          },
          content: m.content,
          reactions: [],
          pinned: m._id === 'm1',
          createdAt: m.createdAt,
        }))
        setMsgList(formattedMocks)
        setPinnedMessage(formattedMocks[0]?.content)
      }
    }

    // Socket Handlers
    const handleNewMessage = (newMsg) => {
      setMsgList((current) => {
        if (current.some((m) => m._id === newMsg._id)) return current
        return [...current, newMsg]
      })
    }

    const handleMessageEdited = ({ messageId, content, isEdited, editedAt }) => {
      setMsgList((current) =>
        current.map((m) => (m._id === messageId ? { ...m, content, isEdited, editedAt } : m))
      )
    }

    const handleMessageDeleted = ({ messageId }) => {
      setMsgList((current) => current.filter((m) => m._id !== messageId))
    }

    const handleMessagePinned = ({ messageId, pinned }) => {
      setMsgList((current) =>
        current.map((m) => {
          if (m._id === messageId) {
            if (pinned) setPinnedMessage(m.content)
            else setPinnedMessage(null)
            return { ...m, pinned }
          }
          return m
        })
      )
    }

    const handleTypingUpdate = (data) => {
      if (String(data.groupId) !== String(groupId)) return
      if (data.userId === currentUserId) return

      setTypingUsers((prev) => {
        if (data.isTyping) {
          if (!prev.includes(data.userName)) return [...prev, data.userName]
          return prev
        }
        return prev.filter((name) => name !== data.userName)
      })
    }

    const handleReactionUpdate = ({ messageId, emoji, userName }) => {
      setMsgList((current) =>
        current.map((msg) => {
          if (msg._id !== messageId) return msg
          const reactions = msg.reactions || []
          const existing = reactions.find((r) => r.emoji === emoji)
          if (existing) {
            existing.count = (existing.count || 1) + 1
            if (!existing.users?.includes(userName)) {
              existing.users = [...(existing.users || []), userName]
            }
          } else {
            reactions.push({ emoji, count: 1, users: [userName] })
          }
          return { ...msg, reactions: [...reactions] }
        })
      )
    }

    const handlePresenceUpdate = (data) => {
      if (data.members && Array.isArray(data.members)) {
        setOnlineMembers(data.members)
      }
    }

    loadMessages()
    connectSocket(user)
    joinGroup(groupId)

    socket.on('message:new', handleNewMessage)
    socket.on('message:edited', handleMessageEdited)
    socket.on('message:deleted', handleMessageDeleted)
    socket.on('message:pinned', handleMessagePinned)
    socket.on('typing:update', handleTypingUpdate)
    socket.on('message:reaction_update', handleReactionUpdate)
    socket.on('presence:update', handlePresenceUpdate)

    return () => {
      socket.off('message:new', handleNewMessage)
      socket.off('message:edited', handleMessageEdited)
      socket.off('message:deleted', handleMessageDeleted)
      socket.off('message:pinned', handleMessagePinned)
      socket.off('typing:update', handleTypingUpdate)
      socket.off('message:reaction_update', handleReactionUpdate)
      socket.off('presence:update', handlePresenceUpdate)
      leaveGroup(groupId)
      disconnectSocket()
    }
  }, [groupId, currentUserId, currentUserName, user])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgList, typingUsers])

  const handleInputChange = (e) => {
    const val = e.target.value
    setInput(val)

    // Check for @ mention trigger
    const lastWord = val.split(' ').pop()
    if (lastWord.startsWith('@')) {
      setShowMentionSuggestions(true)
      setMentionQuery(lastWord.slice(1).toLowerCase())
    } else {
      setShowMentionSuggestions(false)
    }

    if (!typingTimeoutRef.current) {
      emitTyping(groupId, true)
    } else {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      emitTyping(groupId, false)
      typingTimeoutRef.current = null
    }, 1500)
  }

  const handleSelectMention = (member) => {
    const words = input.split(' ')
    words.pop()
    words.push(`@${member.name} `)
    setInput(words.join(' '))
    setSelectedMentions((prev) => [...prev, member.id || member._id])
    setShowMentionSuggestions(false)
  }

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const newAttachment = {
      name: file.name,
      url: URL.createObjectURL(file),
      fileType: file.type.includes('pdf') ? 'pdf' : file.type.includes('image') ? 'image' : 'file',
      size: Math.round(file.size / 1024),
    }
    setAttachments((prev) => [...prev, newAttachment])
  }

  const handleSend = (e) => {
    e.preventDefault()
    if (!input.trim() && attachments.length === 0) return

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
      emitTyping(groupId, false)
    }

    const payloadReply = replyingTo
      ? {
          messageId: replyingTo._id,
          senderName: replyingTo.senderName,
          content: replyingTo.content.slice(0, 80),
        }
      : null

    sendMessage(groupId, input.trim(), payloadReply, selectedMentions, attachments)

    const optimisticMsg = {
      _id: `temp-${Date.now()}`,
      groupId,
      senderId: {
        _id: currentUserId,
        id: currentUserId,
        name: currentUserName,
        profilePhoto: user?.profilePhoto || null,
      },
      content: input.trim(),
      replyTo: payloadReply,
      attachments: [...attachments],
      reactions: [],
      pinned: false,
      isEdited: false,
      createdAt: new Date().toISOString(),
    }

    setMsgList((prev) => [...prev, optimisticMsg])
    setInput('')
    setReplyingTo(null)
    setSelectedMentions([])
    setAttachments([])
  }

  const handleReactionClick = (messageId, emoji) => {
    reactToMessage(groupId, messageId, emoji)
    setMsgList((current) =>
      current.map((msg) => {
        if (msg._id !== messageId) return msg
        const reactions = msg.reactions || []
        const existing = reactions.find((r) => r.emoji === emoji)
        if (existing) {
          existing.count = (existing.count || 1) + 1
          if (!existing.users?.includes(currentUserName)) {
            existing.users = [...(existing.users || []), currentUserName]
          }
        } else {
          reactions.push({ emoji, count: 1, users: [currentUserName] })
        }
        return { ...msg, reactions: [...reactions] }
      })
    )
    setActiveReactionPicker(null)
  }

  const handleSaveEdit = (messageId) => {
    if (!editInput.trim()) return
    socket.emit('message:edit', { groupId, messageId, content: editInput.trim() })
    setMsgList((prev) =>
      prev.map((m) =>
        m._id === messageId
          ? { ...m, content: editInput.trim(), isEdited: true, editedAt: new Date().toISOString() }
          : m
      )
    )
    setEditingMessageId(null)
    setEditInput('')
  }

  const handleDeleteMessage = (messageId) => {
    socket.emit('message:delete', { groupId, messageId })
    setMsgList((prev) => prev.filter((m) => m._id !== messageId))
  }

  const handleTogglePin = (message) => {
    const nextPinState = !message.pinned
    socket.emit('message:pin', { groupId, messageId: message._id, pinned: nextPinState })
    setMsgList((prev) =>
      prev.map((m) => (m._id === message._id ? { ...m, pinned: nextPinState } : m))
    )
    setPinnedMessage(nextPinState ? message.content : null)
  }

  // Filter messages by search
  const filteredMessages = msgList.filter((m) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    const contentMatch = m.content?.toLowerCase().includes(q)
    const authorMatch = m.senderId?.name?.toLowerCase().includes(q)
    const attachmentMatch = m.attachments?.some((a) => a.name.toLowerCase().includes(q))
    return contentMatch || authorMatch || attachmentMatch
  })

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* Top Header Card */}
      <div className="card-soft p-5 bg-white border-[#E8E0F2] flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">💬</span>
            <h1 className="text-xl font-bold text-[#493A63]">Study Collaboration Hub</h1>
            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-[#E9DFFF] text-[#493A63] border border-[#C9B8E8]">
              Live Socket.IO
            </span>
          </div>
          <p className="text-xs text-[#776B88] mt-1">
            Real-time chat, file sharing, mentions, reactions & active peer presence
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Quick Search */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chat or files..."
              className="pl-8 pr-3 py-1.5 rounded-xl border border-[#E8E0F2] bg-[#F8F5FF] text-xs font-medium text-[#493A63] focus:outline-none focus:border-[#9B7EDB] w-40 sm:w-52 transition-all"
            />
            <span className="absolute left-2.5 top-2 text-xs text-[#776B88]">🔍</span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1.5 text-xs text-[#776B88] hover:text-[#493A63]"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 bg-[#F8F5FF] px-3.5 py-1.5 rounded-xl border border-[#E8E0F2]">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-[#493A63]">
              {Math.max(onlineMembers.length, members.length, 1)} Online
            </span>
          </div>
        </div>
      </div>

      {/* Main Chat Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 h-[640px]">
        {/* Left Sidebar: Channels & Peer Presence */}
        <div className="card-soft p-4 bg-white border-[#E8E0F2] flex flex-col justify-between hidden md:flex">
          <div className="space-y-1">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#776B88] px-2 mb-3">
              CHANNELS
            </p>
            {CHANNELS.map((ch) => (
              <button
                key={ch.id}
                onClick={() => setActiveChannel(ch.id)}
                className={`w-full text-left p-3 rounded-xl border text-xs font-bold transition-all ${
                  activeChannel === ch.id
                    ? 'bg-[#E9DFFF] border-[#9B7EDB] text-[#493A63] shadow-xs'
                    : 'bg-white border-transparent hover:bg-[#F8F5FF] text-[#776B88]'
                }`}
              >
                <p>{ch.name}</p>
                <p className="text-[10px] font-normal text-[#776B88] mt-0.5 truncate">{ch.desc}</p>
              </button>
            ))}
          </div>

          {/* Active Students Presence */}
          <div className="pt-4 border-t border-[#E8E0F2]">
            <div className="flex items-center justify-between mb-2 px-1">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#776B88]">
                ACTIVE STUDENTS
              </p>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                Live
              </span>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {(onlineMembers.length > 0 ? onlineMembers : availableMembers).map((member, idx) => (
                <div
                  key={member.id || member._id || idx}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[#F8F5FF] transition-colors"
                >
                  <Avatar name={member.name || 'Student'} size="sm" status="online" src={member.profilePhoto} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#493A63] truncate">{member.name || 'Student'}</p>
                    <p className="text-[10px] text-emerald-600 font-medium">In Lounge</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Area: Messages Stream & Input Box */}
        <div className="md:col-span-3 card-soft bg-white border-[#E8E0F2] flex flex-col h-full overflow-hidden">
          {/* Channel Banner & Pinned Notice */}
          <div className="p-3.5 border-b border-[#E8E0F2] bg-[#F8F5FF] flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-[#493A63]">
                {CHANNELS.find((c) => c.id === activeChannel)?.name}
              </h3>
              <p className="text-[10px] text-[#776B88]">
                {CHANNELS.find((c) => c.id === activeChannel)?.desc}
              </p>
            </div>
            {pinnedMessage && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 animate-fadeIn">
                <span>📌</span>
                <span className="font-semibold truncate max-w-xs">{pinnedMessage}</span>
                <button onClick={() => setPinnedMessage(null)} className="text-amber-600 hover:text-amber-900 ml-1">✕</button>
              </div>
            )}
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#F8F5FF]/30">
            {filteredMessages.length === 0 && (
              <div className="p-8 text-center">
                <span className="text-3xl">💬</span>
                <p className="text-xs font-bold text-[#493A63] mt-2">
                  {searchQuery ? 'No matching messages found' : 'No messages yet in this lounge'}
                </p>
                <p className="text-[11px] text-[#776B88] mt-1">Start collaborating with your study group!</p>
              </div>
            )}

            {filteredMessages.map((message) => {
              const senderId = message.senderId?.id || message.senderId?._id || message.senderId
              const isMe = String(senderId) === String(currentUserId)
              const senderName = message.senderId?.name || (isMe ? currentUserName : 'Student')
              const isPickerOpen = activeReactionPicker === message._id
              const isEditing = editingMessageId === message._id

              return (
                <div
                  key={message._id}
                  className={`group relative flex items-start gap-3 ${isMe ? 'flex-row-reverse' : ''}`}
                >
                  <Avatar name={senderName} size="sm" src={message.senderId?.profilePhoto} />

                  <div className={`max-w-xs sm:max-w-md ${isMe ? 'text-right' : ''}`}>
                    {/* Author & Timestamp */}
                    <div className="flex items-center gap-2 px-1 mb-1">
                      <span className="text-[11px] font-bold text-[#493A63]">{senderName}</span>
                      <span className="text-[9px] text-[#776B88]">
                        {message.createdAt
                          ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : 'Just now'}
                      </span>
                      {message.isEdited && (
                        <span className="text-[9px] text-[#776B88] italic">(edited)</span>
                      )}
                      {message.pinned && <span className="text-[10px]">📌</span>}
                    </div>

                    {/* Replied Context Bubble */}
                    {message.replyTo && (
                      <div
                        className={`text-[10px] p-2 rounded-xl mb-1 border italic text-[#776B88] ${
                          isMe ? 'bg-[#9B7EDB]/20 border-[#9B7EDB]/30 text-left' : 'bg-white border-[#E8E0F2]'
                        }`}
                      >
                        <span className="font-bold text-[#493A63]">Replying to {message.replyTo.senderName}:</span>{' '}
                        <span>"{message.replyTo.content}"</span>
                      </div>
                    )}

                    {/* Message Bubble or Edit Input */}
                    {isEditing ? (
                      <div className="space-y-2 bg-white p-2.5 rounded-2xl border border-[#9B7EDB]">
                        <input
                          type="text"
                          value={editInput}
                          onChange={(e) => setEditInput(e.target.value)}
                          className="w-full text-xs text-[#493A63] p-1.5 rounded-lg border border-[#E8E0F2] focus:outline-none"
                        />
                        <div className="flex items-center justify-end gap-2 text-[10px]">
                          <button
                            onClick={() => setEditingMessageId(null)}
                            className="px-2 py-1 text-[#776B88] hover:text-[#493A63]"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveEdit(message._id)}
                            className="px-3 py-1 bg-[#9B7EDB] text-white rounded-lg font-bold"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-xs font-medium leading-relaxed relative ${
                          isMe
                            ? 'bg-[#9B7EDB] text-white rounded-tr-none shadow-xs'
                            : 'bg-white border border-[#E8E0F2] text-[#493A63] rounded-tl-none shadow-xs'
                        }`}
                      >
                        {/* Highlights @mentions */}
                        {message.content}

                        {/* File Attachments */}
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-2 space-y-1.5 pt-2 border-t border-white/20">
                            {message.attachments.map((att, i) => (
                              <div
                                key={i}
                                className={`flex items-center gap-2 p-2 rounded-xl text-xs ${
                                  isMe ? 'bg-white/20 text-white' : 'bg-[#F8F5FF] text-[#493A63]'
                                }`}
                              >
                                <span>{att.fileType === 'pdf' ? '📄' : att.fileType === 'image' ? '🖼️' : '📎'}</span>
                                <span className="font-bold truncate flex-1">{att.name}</span>
                                <span className="text-[10px] opacity-75">{att.size}KB</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Reactions Display */}
                    {message.reactions && message.reactions.length > 0 && (
                      <div className={`flex flex-wrap gap-1 mt-1.5 ${isMe ? 'justify-end' : ''}`}>
                        {message.reactions.map((r, i) => (
                          <button
                            key={i}
                            onClick={() => handleReactionClick(message._id, r.emoji)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white border border-[#E8E0F2] text-[#493A63] shadow-xs hover:border-[#9B7EDB] transition-all"
                            title={r.users?.join(', ')}
                          >
                            <span>{r.emoji}</span>
                            <span>{r.count || 1}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Action Bar (Reply, React, Edit, Delete, Pin on Hover) */}
                    <div
                      className={`opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 mt-1 text-[11px] ${
                        isMe ? 'justify-end' : ''
                      }`}
                    >
                      <button
                        onClick={() =>
                          setReplyingTo({
                            _id: message._id,
                            senderName,
                            content: message.content,
                          })
                        }
                        className="text-[#776B88] hover:text-[#9B7EDB] font-bold px-1"
                      >
                        ↩ Reply
                      </button>

                      <button
                        onClick={() => setActiveReactionPicker(isPickerOpen ? null : message._id)}
                        className="text-[#776B88] hover:text-[#9B7EDB] font-bold px-1"
                      >
                        😊 React
                      </button>

                      <button
                        onClick={() => handleTogglePin(message)}
                        className={`font-bold px-1 ${
                          message.pinned ? 'text-amber-600' : 'text-[#776B88] hover:text-amber-600'
                        }`}
                      >
                        {message.pinned ? 'Unpin' : '📌 Pin'}
                      </button>

                      {isMe && (
                        <>
                          <button
                            onClick={() => {
                              setEditingMessageId(message._id)
                              setEditInput(message.content)
                            }}
                            className="text-[#776B88] hover:text-[#9B7EDB] font-bold px-1"
                          >
                            ✏ Edit
                          </button>
                          <button
                            onClick={() => handleDeleteMessage(message._id)}
                            className="text-red-400 hover:text-red-600 font-bold px-1"
                          >
                            🗑
                          </button>
                        </>
                      )}
                    </div>

                    {/* Emoji Picker Dropdown */}
                    {isPickerOpen && (
                      <div className="absolute z-10 mt-1 p-1.5 bg-white border border-[#E8E0F2] rounded-2xl shadow-lg flex items-center gap-1.5 animate-fadeIn">
                        {EMOJI_OPTIONS.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => handleReactionClick(message._id, emoji)}
                            className="w-7 h-7 flex items-center justify-center rounded-xl hover:bg-[#F8F5FF] text-sm hover:scale-125 transition-transform"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Live Typing Indicator */}
            {typingUsers.length > 0 && (
              <div className="flex items-center gap-2 text-xs font-semibold text-[#9B7EDB] italic py-1">
                <span className="w-2 h-2 rounded-full bg-[#9B7EDB] animate-bounce" />
                <span>
                  {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                </span>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Mention Autocomplete Suggestions Box */}
          {showMentionSuggestions && (
            <div className="p-2 bg-white border-t border-[#E8E0F2] flex items-center gap-2 overflow-x-auto text-xs">
              <span className="text-[10px] font-bold text-[#776B88] px-2">Mention member:</span>
              {availableMembers
                .filter((m) => m.name.toLowerCase().includes(mentionQuery))
                .slice(0, 4)
                .map((m) => (
                  <button
                    key={m.id || m._id}
                    onClick={() => handleSelectMention(m)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#F8F5FF] hover:bg-[#E9DFFF] text-[#493A63] font-bold transition-colors"
                  >
                    <span>@{m.name}</span>
                  </button>
                ))}
            </div>
          )}

          {/* Attachment Preview Drawer */}
          {attachments.length > 0 && (
            <div className="p-2 bg-[#F8F5FF] border-t border-[#E8E0F2] flex items-center gap-2 overflow-x-auto">
              {attachments.map((att, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-3 py-1 rounded-xl bg-white border border-[#E8E0F2] text-xs font-medium text-[#493A63]"
                >
                  <span>📎 {att.name}</span>
                  <button
                    onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                    className="text-red-500 font-bold ml-1"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Reply Context Banner */}
          {replyingTo && (
            <div className="px-4 py-2 bg-[#F3ECFE] border-t border-[#C9B8E8] flex items-center justify-between text-xs text-[#493A63]">
              <div className="truncate">
                <span className="font-bold">Replying to {replyingTo.senderName}:</span>{' '}
                <span className="text-[#776B88] italic">"{replyingTo.content}"</span>
              </div>
              <button
                onClick={() => setReplyingTo(null)}
                className="font-bold text-[#776B88] hover:text-[#493A63] ml-3"
              >
                ✕ Cancel
              </button>
            </div>
          )}

          {/* Message Input Form */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-[#E8E0F2] flex items-center gap-2">
            {/* File Attachment Hidden Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Attach File / Document"
              className="p-2.5 rounded-xl border border-[#E8E0F2] hover:bg-[#F8F5FF] text-[#776B88] hover:text-[#493A63] transition-colors"
            >
              📎
            </button>

            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder={
                replyingTo
                  ? `Replying to ${replyingTo.senderName}...`
                  : `Message #${activeChannel}... (Use @ to mention)`
              }
              className="flex-1 px-4 py-2.5 rounded-xl border border-[#E8E0F2] bg-[#F8F5FF] text-[#493A63] font-semibold text-xs focus:outline-none focus:border-[#9B7EDB] transition-all"
            />

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#9B7EDB] hover:bg-[#7A58C1] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5"
            >
              <span>Send</span>
              <span>✈</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
