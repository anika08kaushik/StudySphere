import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import socket, {
  connectSocket,
  disconnectSocket,
  joinGroup,
  leaveGroup,
  sendMessage,
} from '../services/socket.js'
import api from '../services/api.js'

const Chat = () => {
  const { groupId } = useParams()
  const [messages, setMessages] = useState([])
  const [content, setContent] = useState('')

  useEffect(() => {
    if (!groupId) return

    const loadMessages = async () => {
      try {
        const response = await api.get(`/groups/${groupId}/messages`)
        setMessages(response.data.data)
      } catch (error) {
        console.error('Failed to load messages:', error)
      }
    }

    loadMessages()

    connectSocket()
    joinGroup(groupId)

    const handleNewMessage = (message) => {
      setMessages((current) => [...current, message])
    }

    socket.on('message:new', handleNewMessage)

    return () => {
      socket.off('message:new', handleNewMessage)
      leaveGroup(groupId)
      disconnectSocket()
    }
  }, [groupId])

  const handleSend = (event) => {
    event.preventDefault()

    if (!content.trim()) return

    sendMessage(groupId, content)
    setContent('')
  }

  return (
    <div>
      <h2>Group Chat</h2>

      <div>
        {messages.map((message) => (
          <div key={message._id}>
            <strong>{message.senderId?.name}</strong>
            <p>{message.content}</p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSend}>
        <input
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  )
}

export default Chat
