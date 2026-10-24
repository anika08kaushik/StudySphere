import { useState, useEffect, useRef, useCallback } from 'react'
import privateChatService from '../../services/privateChatService'
import socket, {
  onChatRequestNew,
  offChatRequestNew,
  onChatRequestUpdate,
  offChatRequestUpdate,
  onDmNew,
  offDmNew,
} from '../../services/socket'

// Phase 9: Explore People - discover room members, connect, chat live.
// Requests and messages are persisted server-side, so history survives refresh.
export default function ExplorePeoplePanel({ participants, selectedGroupId, onClose }) {
  const [incoming, setIncoming] = useState([])
  const [partners, setPartners] = useState([])
  const [connectingId, setConnectingId] = useState(null)
  const [error, setError] = useState('')

  // Chat view state
  const [activePeer, setActivePeer] = useState(null) // { _id, name, profilePhoto }
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [sending, setSending] = useState(false)
  const chatBottomRef = useRef(null)
  const activePeerRef = useRef(null)
  useEffect(() => {
    activePeerRef.current = activePeer
  }, [activePeer])

  // Load requests + connected partners
  const reloadRequests = useCallback(async () => {
    try {
      const res = await privateChatService.getRequests()
      const data = res.data?.data || {}
      setIncoming(data.incoming || [])
      setPartners(data.partners || [])
    } catch (err) {
      setError('Unable to load connections')
      console.warn('getRequests failed:', err?.message)
    }
  }, [])

  useEffect(() => {
    reloadRequests()
  }, [reloadRequests])

  const connectTo = async (user) => {
    setConnectingId(String(user._id))
    setError('')
    try {
      await privateChatService.sendRequest(String(user._id), selectedGroupId)
      await reloadRequests()
    } catch (err) {
      const msg = err?.response?.data?.message || 'Unable to send request'
      setError(msg)
      console.warn('sendRequest failed:', msg)
    } finally {
      setConnectingId(null)
    }
  }

  const respond = async (requestId, action) => {
    setError('')
    try {
      await privateChatService.respondToRequest(requestId, action)
      setIncoming((prev) => prev.filter((r) => String(r._id) !== String(requestId)))
      await reloadRequests()
    } catch (err) {
      const msg = err?.response?.data?.message || 'Unable to respond'
      setError(msg)
      console.warn('respond failed:', msg)
    }
  }

  const openChat = async (partner) => {
    setActivePeer({ _id: String(partner.id), name: partner.name, profilePhoto: partner.profilePhoto })
    setChatMessages([])
    try {
      const res = await privateChatService.getMessages(String(partner.id))
      setChatMessages(res.data?.data || [])
    } catch (err) {
      console.warn('getMessages failed:', err?.message)
    }
  }

  // Live delivery of private messages (also fires for own sends)
  const handleDmNew = useCallback((payload) => {
    if (!payload?.message) return
    const peer = activePeerRef.current
    if (
      peer &&
      String(payload.peerId) === String(peer._id) &&
      String(payload.message.senderId) !== socket.auth?.userId
    ) {
      setChatMessages((prev) => [...prev, payload.message])
    }
  }, [])

  useEffect(() => {
    const handleUpdate = () => {
      reloadRequests()
    }
    onChatRequestUpdate(handleUpdate)
    onDmNew(handleDmNew)
    return () => {
      offChatRequestUpdate(handleUpdate)
      offDmNew(handleDmNew)
    }
  }, [reloadRequests])

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const handleSendChat = async (e) => {
    e.preventDefault()
    const content = chatInput.trim()
    if (!content || !activePeer) return
    setSending(true)
    setChatInput('')
    try {
      const res = await privateChatService.sendMessage(activePeer._id, content)
      const saved = res.data?.data
      if (saved) {
        setChatMessages((prev) => [
          ...prev,
          { ...saved, senderId: socket.auth?.userId, senderName: socket.auth?.userName },
        ])
      }
    } catch (err) {
      console.warn('sendMessage failed:', err?.message)
    } finally {
      setSending(false)
    }
  }

  // People currently in the same room (excluding me)
  const roomPeople = participants.filter(
    (p) => p.socketId !== socket.id && p.userId !== socket.auth?.userId
  )
  const connectedIds = new Set(partners.map((p) => String(p.id)))
  const incomingIds = new Set(incoming.map((r) => String(r.peer?.id)))

  // Chat view
  if (activePeer) {
    return (
      <div className="absolute top-4 right-4 z-30 rounded-3xl bg-white/95 backdrop-blur-md border border-[#E8E0F2] shadow-xl w-80 flex flex-col">
        <div className="flex items-center gap-2 p-4 pb-3 border-b border-[#E8E0F2]">
          <button
            onClick={() => {
              setActivePeer(null)
              setChatMessages([])
            }}
            className="text-xs font-bold text-[#776B88] hover:text-[#493A63] cursor-pointer"
          >
            ←
          </button>
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold"
            style={{ backgroundColor: '#8FBA99' }}
          >
            {activePeer.name?.[0]?.toUpperCase() || 'S'}
          </div>
          <div className="flex-1">
            <h3 className="text-xs font-bold text-[#493A63] leading-tight">{activePeer.name}</h3>
            <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Private Chat
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#776B88] hover:text-[#493A63] font-bold text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="p-3 space-y-2 overflow-y-auto max-h-80 min-h-40">
          {chatMessages.length === 0 ? (
            <p className="text-center text-[11px] text-[#776B88] py-6">
              Say hi to {activePeer.name} - messages persist forever
            </p>
          ) : (
            chatMessages.map((m) => (
              <div
                key={m._id}
                className={`flex ${String(m.senderId) === socket.auth?.userId ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`px-3 py-2 rounded-2xl max-w-[75%] text-xs ${
                    String(m.senderId) === socket.auth?.userId
                      ? 'bg-[#9B7EDB] text-white rounded-br-md'
                      : 'bg-[#F8F5FF] text-[#493A63] rounded-bl-md border border-[#E8E0F2]'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.content}</p>
                  <p
                    className={`text-[9px] mt-0.5 text-right ${
                      String(m.senderId) === socket.auth?.userId ? 'text-white/70' : 'text-[#776B88]'
                    }`}
                  >
                    {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={chatBottomRef} />
        </div>

        <form onSubmit={handleSendChat} className="p-3 pt-0 flex items-center gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 rounded-xl border border-[#E8E0F2] bg-[#F8F5FF] text-[#493A63] text-xs font-semibold focus:outline-none focus:border-[#9B7EDB]"
          />
          <button
            type="submit"
            disabled={sending || !chatInput.trim()}
            className="w-9 h-9 rounded-xl bg-[#9B7EDB] hover:bg-[#7A58C1] disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center cursor-pointer transition-all"
          >
            ➤
          </button>
        </form>
      </div>
    )
  }

  // Explore / Connect view
  return (
    <div className="absolute top-4 right-4 z-30 p-4 rounded-3xl bg-white/95 backdrop-blur-md border border-[#E8E0F2] shadow-xl w-80 max-h-[480px] overflow-y-auto space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-[#E8E0F2]">
        <h3 className="text-xs font-bold text-[#493A63]">🧭 Explore People</h3>
        <button
          onClick={onClose}
          className="text-[#776B88] hover:text-[#493A63] font-bold text-xs cursor-pointer"
        >
          ✕
        </button>
      </div>

      {error && (
        <p className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      {/* Incoming requests (live) */}
      {incoming.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-black uppercase tracking-wider text-[#9B7EDB]">
            Connection Requests
          </p>
          {incoming.map((r) => (
            <div
              key={r._id}
              className="flex items-center justify-between bg-[#F3ECFE] p-2.5 rounded-xl border border-[#C9B8E8]"
            >
              <div className="flex items-center gap-2 text-xs">
                <div className="w-6 h-6 rounded-full bg-[#9B7EDB] flex items-center justify-center text-white text-[10px] font-bold">
                  {r.peer?.name?.[0]?.toUpperCase() || 'S'}
                </div>
                <span className="font-bold text-[#493A63]">{r.peer?.name || 'Student'}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => respond(r._id, 'accept')}
                  className="px-2 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold cursor-pointer"
                >
                  Accept
                </button>
                <button
                  onClick={() => respond(r._id, 'decline')}
                  className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* People in this room right now */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-black uppercase tracking-wider text-[#9B7EDB]">
          In This Room ({roomPeople.length})
        </p>
        {roomPeople.length === 0 ? (
          <p className="text-[11px] text-[#776B88] text-center py-3">
            No one else here yet - share the room invite
          </p>
        ) : (
          roomPeople.map((p, idx) => (
            <div
              key={p.socketId || idx}
              className="flex items-center justify-between bg-[#F8F5FF] p-2 rounded-xl border border-[#E8E0F2] text-xs"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                  style={{ backgroundColor: p.avatarConfig?.outfitColor || '#8FBA99' }}
                >
                  {(p.userName || 'S').charAt(0).toUpperCase()}
                </div>
                <span className="font-bold text-[#493A63]">{p.userName || 'Student'}</span>
              </div>
              {connectedIds.has(String(p.userId)) ? (
                <button
                  onClick={() => openChat({ id: p.userId, name: p.userName })}
                  className="px-2 py-1 rounded-lg bg-[#E9DFFF] text-[#7A58C1] text-[10px] font-bold cursor-pointer"
                >
                  Chat 💬
                </button>
              ) : incomingIds.has(String(p.userId)) ? (
                <span className="text-[9px] font-bold text-[#776B88] uppercase">Asked you</span>
              ) : (
                <button
                  onClick={() => connectTo({ _id: p.userId, name: p.userName })}
                  disabled={connectingId === String(p.userId)}
                  className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-bold cursor-pointer disabled:opacity-50"
                >
                  {connectingId === String(p.userId) ? '...' : 'Connect'}
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Accepted connections (always chat-able, persist across sessions) */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-black uppercase tracking-wider text-[#9B7EDB]">
          Your Connections ({partners.length})
        </p>
        {partners.length === 0 ? (
          <p className="text-[11px] text-[#776B88] text-center py-3">
            No connections yet - explore people in the room
          </p>
        ) : (
          partners.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between bg-[#F8F5FF] p-2 rounded-xl border border-[#E8E0F2] text-xs"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#9B7EDB] flex items-center justify-center text-white text-[10px] font-bold">
                  {p.name?.[0]?.toUpperCase() || 'S'}
                </div>
                <span className="font-bold text-[#493A63]">{p.name}</span>
              </div>
              <button
                onClick={() => openChat(p)}
                className="px-2 py-1 rounded-lg bg-[#E9DFFF] text-[#7A58C1] text-[10px] font-bold cursor-pointer"
              >
                Chat 💬
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
