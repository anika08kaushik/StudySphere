import { useState, useEffect } from 'react'
import Avatar from '../../components/ui/Avatar'

const MOCK_ACTIVE_COLLABORATORS = [
  { id: 'u1', name: 'You', color: '#9B7EDB', status: 'editing', cursor: 'Line 18' },
  { id: 'u2', name: 'Rahul', color: '#38BDF8', status: 'editing', cursor: 'Line 24' },
  { id: 'u3', name: 'Anika', color: '#34D399', status: 'viewing', cursor: 'Line 5' },
]

const VERSION_HISTORY = [
  { id: 'v3', version: 'v1.3', author: 'Rahul', time: '10 mins ago', summary: 'Added Convolution Layer formulas' },
  { id: 'v2', version: 'v1.2', author: 'Anika', time: '1 hour ago', summary: 'Restructured CNN intro & pooling' },
  { id: 'v1', version: 'v1.0', author: 'You', time: 'Yesterday', summary: 'Initial note creation' },
]

export default function CollaborativeNotes() {
  const [title, setTitle] = useState('Convolutional Neural Networks (CNN) Notes')
  const [content, setContent] = useState(
`# Convolutional Neural Networks (CNN)

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
- S: Stride`
  )
  const [savedStatus, setSavedStatus] = useState('All changes saved')
  const [showHistory, setShowHistory] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState([
    { id: 'c1', author: 'Rahul', text: 'Should we add the ResNet skip connection formula here?', time: '25m ago' },
    { id: 'c2', author: 'Anika', text: 'Yes, and let us link the lecture slides from Resources.', time: '12m ago' },
  ])
  const [newComment, setNewComment] = useState('')
  const [copyFeedback, setCopyFeedback] = useState(false)

  // Simulate auto-save on content change
  useEffect(() => {
    setSavedStatus('Saving changes...')
    const timer = setTimeout(() => {
      setSavedStatus('Auto-saved to cloud')
    }, 800)
    return () => clearTimeout(timer)
  }, [content, title])

  const insertFormat = (prefix, suffix = '') => {
    setContent((prev) => `${prev}\n${prefix} ${suffix}`)
  }

  const handleCopyMarkdown = () => {
    navigator.clipboard?.writeText(content)
    setCopyFeedback(true)
    setTimeout(() => setCopyFeedback(false), 2000)
  }

  const handleAddComment = (e) => {
    e.preventDefault()
    if (!newComment.trim()) return
    setComments((prev) => [
      ...prev,
      {
        id: `c-${Date.now()}`,
        author: 'You',
        text: newComment.trim(),
        time: 'Just now',
      },
    ])
    setNewComment('')
  }

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* Top Header Card */}
      <div className="card-soft p-5 bg-white border-[#E8E0F2] flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">📝</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg font-bold text-[#493A63] border-b border-transparent hover:border-[#E8E0F2] focus:border-[#9B7EDB] focus:outline-none bg-transparent transition-all"
            />
          </div>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-[#776B88]">
            <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {savedStatus}
            </span>
            <span>•</span>
            <span>Study Group: Machine Learning & AI</span>
            <span>•</span>
            <span>Yjs CRDT Realtime Ready</span>
          </div>
        </div>

        {/* Collaborators & Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Active Collaborators Bar */}
          <div className="flex items-center -space-x-2 mr-2">
            {MOCK_ACTIVE_COLLABORATORS.map((collab) => (
              <div
                key={collab.id}
                title={`${collab.name} (${collab.status} at ${collab.cursor})`}
                className="ring-2 ring-white rounded-full transition-transform hover:scale-110"
              >
                <Avatar name={collab.name} size="sm" />
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
            <span>Notes Chat ({comments.length})</span>
          </button>

          <button
            onClick={() => setShowHistory(!showHistory)}
            className="px-3.5 py-1.5 rounded-xl border border-[#E8E0F2] bg-[#F8F5FF] hover:bg-[#E9DFFF] text-[#493A63] font-bold text-xs transition-all flex items-center gap-1.5"
          >
            <span>⏱️</span>
            <span>History</span>
          </button>

          <button
            onClick={handleCopyMarkdown}
            className="px-3.5 py-1.5 rounded-xl bg-[#9B7EDB] hover:bg-[#7A58C1] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5"
          >
            <span>{copyFeedback ? '✓ Copied!' : 'Export MD'}</span>
          </button>
        </div>
      </div>

      {/* Editor & Side Panels Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Main Editor */}
        <div className={`card-soft p-5 bg-white border-[#E8E0F2] flex flex-col space-y-4 ${
          showComments || showHistory ? 'lg:col-span-3' : 'lg:col-span-4'
        }`}>
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-1.5 pb-3 border-b border-[#E8E0F2] text-xs">
            {[
              { label: 'H1', action: () => insertFormat('# Heading 1') },
              { label: 'H2', action: () => insertFormat('## Heading 2') },
              { label: 'B', action: () => insertFormat('**Bold Text**') },
              { label: 'I', action: () => insertFormat('*Italic Text*') },
              { label: 'List', action: () => insertFormat('- List item') },
              { label: 'Checklist', action: () => insertFormat('- [ ] To study') },
              { label: 'Code', action: () => insertFormat('```python\n# Code snippet\n```') },
              { label: 'Quote', action: () => insertFormat('> Important takeaway:') },
            ].map((tool) => (
              <button
                key={tool.label}
                onClick={tool.action}
                className="px-2.5 py-1 rounded-lg bg-[#F8F5FF] hover:bg-[#E9DFFF] border border-[#E8E0F2] font-bold text-[#493A63] transition-colors"
              >
                {tool.label}
              </button>
            ))}

            <div className="ml-auto flex items-center gap-2 text-[11px] text-[#776B88]">
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              <span>Rahul is editing near line 24</span>
            </div>
          </div>

          {/* Textarea Editor Area */}
          <div className="relative">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={18}
              className="w-full p-4 rounded-2xl bg-[#F8F5FF] border border-[#E8E0F2] text-[#493A63] font-mono text-xs leading-relaxed focus:outline-none focus:border-[#9B7EDB] focus:bg-white transition-all resize-y"
              placeholder="Start drafting shared notes with your study group..."
            />
          </div>
        </div>

        {/* Side Panel: Version History or Comments */}
        {(showComments || showHistory) && (
          <div className="card-soft p-5 bg-white border-[#E8E0F2] space-y-4 flex flex-col h-[520px]">
            {showComments && (
              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-[#E8E0F2] mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#493A63]">Note Discussions</h3>
                  <button onClick={() => setShowComments(false)} className="text-[#776B88] hover:text-[#493A63] text-xs">✕</button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3">
                  {comments.map((c) => (
                    <div key={c.id} className="p-3 rounded-xl bg-[#F8F5FF] border border-[#E8E0F2] text-xs">
                      <div className="flex items-center justify-between font-bold text-[#493A63]">
                        <span>{c.author}</span>
                        <span className="text-[10px] text-[#776B88] font-normal">{c.time}</span>
                      </div>
                      <p className="text-[#776B88] mt-1 text-[11px]">{c.text}</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddComment} className="mt-3 pt-3 border-t border-[#E8E0F2] flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add comment..."
                    className="flex-1 px-3 py-1.5 rounded-xl border border-[#E8E0F2] text-xs bg-[#F8F5FF] text-[#493A63] focus:outline-none focus:border-[#9B7EDB]"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-xl bg-[#9B7EDB] text-white font-bold text-xs"
                  >
                    Post
                  </button>
                </form>
              </div>
            )}

            {showHistory && (
              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-[#E8E0F2] mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#493A63]">Version History</h3>
                  <button onClick={() => setShowHistory(false)} className="text-[#776B88] hover:text-[#493A63] text-xs">✕</button>
                </div>

                <div className="space-y-3 overflow-y-auto flex-1">
                  {VERSION_HISTORY.map((v) => (
                    <div key={v.id} className="p-3 rounded-xl bg-[#F8F5FF] border border-[#E8E0F2]">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-md bg-[#E9DFFF] text-[#493A63] font-bold text-[10px]">
                          {v.version}
                        </span>
                        <span className="text-[10px] text-[#776B88]">{v.time}</span>
                      </div>
                      <p className="text-xs font-semibold text-[#493A63] mt-1.5">{v.summary}</p>
                      <p className="text-[10px] text-[#776B88] mt-0.5">Author: {v.author}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
