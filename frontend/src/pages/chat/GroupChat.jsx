import { useState, useRef, useEffect } from 'react'
import Avatar from '../../components/ui/Avatar'
import { messages as initialMessages } from '../../mock/messages'
import { users } from '../../mock/users'
import { useApp } from '../../context/AppContext'

const CHANNELS = [
  { id: 'general', name: '💬 Student Lounge', desc: 'General campus chat & discussions' },
  { id: 'study', name: '📚 Study Help', desc: 'Ask questions & solve homework together' },
  { id: 'tech', name: '💻 Code & Tech', desc: 'Software engineering, algorithms & projects' },
  { id: 'music', name: '🎵 Chill & Lofi', desc: 'Share study playlists & lofi beats' },
]

export default function GroupChat() {
  const { avatarConfig } = useApp()
  const [activeChannel, setActiveChannel] = useState('general')
  const [msgList, setMsgList] = useState(initialMessages)
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgList, isTyping])

  const handleSend = (e) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMsg = {
      _id: `msg-${Date.now()}`,
      sender: 'user-1',
      senderName: avatarConfig?.name || 'Anika',
      content: input.trim(),
      createdAt: new Date().toISOString(),
    }

    setMsgList((prev) => [...prev, userMsg])
    const textSent = input
    setInput('')

    // Simulate peer response after 1.5s
    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
      const botReplies = [
        `Great point about ${textSent.slice(0, 15)}! Are you joining the library session later?`,
        'Sounds good! Let’s meet at Desk 02 in the 3D Library.',
        'Thanks for sharing that! Added it to my study task board.',
      ]
      const replyMsg = {
        _id: `msg-${Date.now() + 1}`,
        sender: 'u2',
        senderName: 'Maya',
        content: botReplies[Math.floor(Math.random() * botReplies.length)],
        createdAt: new Date().toISOString(),
      }
      setMsgList((prev) => [...prev, replyMsg])
    }, 1800)
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Bar */}
      <div className="card-soft p-6 bg-white border-[#E8E0F2] flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">💬</span>
            <h1 className="text-xl font-bold text-[#493A63]">Student Lounge</h1>
          </div>
          <p className="text-xs text-[#776B88] mt-1">Live campus chat room & peer presence</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-[#493A63]">8 Students Online</span>
        </div>
      </div>

      {/* Main Chat Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 h-[580px]">
        {/* Channel List Sidebar */}
        <div className="card-soft p-4 bg-white border-[#E8E0F2] flex flex-col justify-between hidden md:flex">
          <div className="space-y-1">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#776B88] px-2 mb-3">
              LOUNGE CHANNELS
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

          <div className="pt-4 border-t border-[#E8E0F2]">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#776B88] mb-2">
              ACTIVE STUDENTS
            </p>
            <div className="space-y-2">
              {users.slice(0, 4).map((u) => (
                <div key={u._id} className="flex items-center gap-2">
                  <Avatar name={u.name} size="sm" status={u.status} />
                  <span className="text-xs font-semibold text-[#493A63] truncate">{u.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Active Chat Window */}
        <div className="md:col-span-3 card-soft bg-white border-[#E8E0F2] flex flex-col h-full overflow-hidden">
          {/* Channel Banner Header */}
          <div className="p-4 border-b border-[#E8E0F2] bg-[#F8F5FF] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#493A63]">
                {CHANNELS.find((c) => c.id === activeChannel)?.name}
              </h3>
              <p className="text-[11px] text-[#776B88]">
                {CHANNELS.find((c) => c.id === activeChannel)?.desc}
              </p>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#F8F5FF]/30">
            {msgList.map((m) => {
              const isMe = m.sender === 'user-1'
              return (
                <div key={m._id} className={`flex items-start gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                  <Avatar name={m.senderName || 'Student'} size="sm" />
                  <div className={`max-w-xs md:max-w-md ${isMe ? 'text-right' : ''}`}>
                    <span className="text-[11px] font-bold text-[#776B88] px-1">
                      {m.senderName || 'Student'}
                    </span>
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-xs font-semibold mt-1 ${
                        isMe
                          ? 'bg-[#9B7EDB] text-white rounded-tr-none shadow-xs'
                          : 'bg-white border border-[#E8E0F2] text-[#493A63] rounded-tl-none shadow-xs'
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                </div>
              )
            })}

            {isTyping && (
              <div className="flex items-center gap-2 text-xs font-semibold text-[#9B7EDB] italic">
                <span className="w-2 h-2 rounded-full bg-[#9B7EDB] animate-bounce" />
                <span>Maya is typing a response...</span>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Message Input Box */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-[#E8E0F2] flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Send a message to the lounge..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-[#E8E0F2] bg-[#F8F5FF] text-[#493A63] font-semibold text-xs focus:outline-none focus:border-[#9B7EDB]"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#9B7EDB] hover:bg-[#7A58C1] text-white font-bold text-xs shadow-xs transition-all"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

