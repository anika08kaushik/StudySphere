import { useState } from 'react'
import { folders as mockFolders } from '../../mock/folders'
import { files as initialFiles } from '../../mock/files'

const FILE_ICONS = {
  pdf: { icon: '📄', bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200' },
  pptx: { icon: '📊', bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
  ipynb: { icon: '📓', bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200' },
  doc: { icon: '📝', bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  default: { icon: '📁', bg: 'bg-[#F8F5FF]', text: 'text-[#493A63]', border: 'border-[#E8E0F2]' },
}

export default function ResourceLocker() {
  const [fileList, setFileList] = useState(initialFiles)
  const [activeFolder, setActiveFolder] = useState(null)
  const [search, setSearch] = useState('')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [previewFile, setPreviewFile] = useState(null)

  // Upload Form State
  const [fileName, setFileName] = useState('')
  const [fileType, setFileType] = useState('pdf')
  const [fileSize, setFileSize] = useState('1.8 MB')

  const handleUploadFile = (e) => {
    e.preventDefault()
    if (!fileName.trim()) return

    const newFile = {
      _id: `file-${Date.now()}`,
      name: fileName.includes('.') ? fileName : `${fileName}.${fileType}`,
      type: fileType,
      size: fileSize,
      folderId: activeFolder || 'f1',
      uploadedBy: 'Anika',
      createdAt: new Date().toISOString(),
    }

    setFileList([newFile, ...fileList])
    setFileName('')
    setShowUploadModal(false)
  }

  const handleDeleteFile = (fileId, e) => {
    e.stopPropagation()
    setFileList((prev) => prev.filter((f) => f._id !== fileId))
  }

  const filteredFiles = fileList.filter((f) => {
    const matchesFolder = activeFolder ? f.folderId === activeFolder : true
    const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase())
    return matchesFolder && matchesSearch
  })

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Bar */}
      <div className="card-soft p-6 bg-white border-[#E8E0F2] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📁</span>
            <h1 className="text-xl font-bold text-[#493A63]">Campus Resource Library</h1>
          </div>
          <p className="text-xs text-[#776B88] mt-1">Access notes, lecture slides, past exams, and cheat sheets</p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="px-5 py-2.5 rounded-xl bg-[#9B7EDB] hover:bg-[#7A58C1] text-white font-bold text-sm shadow-xs transition-all flex items-center gap-2"
        >
          <span>📤</span>
          <span>Upload Resource</span>
        </button>
      </div>

      {/* Folders & Search Row */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search study materials & files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-md px-4 py-2.5 rounded-xl border border-[#E8E0F2] bg-white text-[#493A63] font-semibold text-sm focus:outline-none focus:border-[#9B7EDB] shadow-xs"
          />
        </div>

        {/* Folder Chips */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {mockFolders.map((f) => {
            const isSelected = activeFolder === f._id
            return (
              <button
                key={f._id}
                onClick={() => setActiveFolder(isSelected ? null : f._id)}
                className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? 'bg-[#E9DFFF] border-[#9B7EDB] shadow-xs font-bold text-[#493A63]'
                    : 'bg-white border-[#E8E0F2] hover:border-[#C9B8E8] text-[#776B88]'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-white border border-[#E8E0F2] flex items-center justify-center text-base shadow-xs">
                  📁
                </div>
                <span className="text-xs font-bold truncate">{f.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      {activeFolder && (
        <button
          onClick={() => setActiveFolder(null)}
          className="text-xs font-bold text-[#9B7EDB] hover:underline flex items-center gap-1"
        >
          <span>←</span>
          <span>Show all files</span>
        </button>
      )}

      {/* File List */}
      <div className="space-y-3">
        {filteredFiles.map((f) => {
          const style = FILE_ICONS[f.type] || FILE_ICONS.default
          return (
            <div
              key={f._id}
              onClick={() => setPreviewFile(f)}
              className="card-soft p-4 bg-white border-[#E8E0F2] hover:border-[#9B7EDB] transition-all flex items-center justify-between gap-4 cursor-pointer group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className={`w-11 h-11 rounded-2xl ${style.bg} ${style.border} border flex items-center justify-center text-xl shrink-0`}>
                  {style.icon}
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-[#493A63] truncate group-hover:text-[#9B7EDB] transition-colors">
                    {f.name}
                  </h4>
                  <p className="text-xs text-[#776B88] mt-0.5">
                    {f.size || '2.4 MB'} • {f.type?.toUpperCase()} • Uploaded by {f.uploadedBy || 'Student'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setPreviewFile(f)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#F8F5FF] hover:bg-[#E9DFFF] text-[#493A63] border border-[#E8E0F2] text-xs font-bold transition-all"
                >
                  Preview
                </button>
                <button
                  onClick={(e) => handleDeleteFile(f._id, e)}
                  className="p-1.5 rounded-xl hover:bg-rose-50 text-rose-500 transition-colors"
                  title="Delete File"
                >
                  ✕
                </button>
              </div>
            </div>
          )
        })}

        {filteredFiles.length === 0 && (
          <div className="card-soft p-12 text-center bg-white border-[#E8E0F2]">
            <p className="text-sm font-semibold text-[#776B88]">No resources found in this folder.</p>
          </div>
        )}
      </div>

      {/* Upload File Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#493A63]/30 backdrop-blur-sm">
          <div className="card-soft p-6 bg-white border-[#E8E0F2] max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E0F2]">
              <h2 className="text-base font-bold text-[#493A63]">Upload Campus Resource</h2>
              <button onClick={() => setShowUploadModal(false)} className="text-[#776B88] font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadFile} className="py-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#776B88] uppercase mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  required
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="e.g. Data Structures Exam Cheat Sheet"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E8E0F2] bg-[#F8F5FF] text-[#493A63] font-semibold text-xs focus:outline-none focus:border-[#9B7EDB]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#776B88] uppercase mb-1">
                  File Format
                </label>
                <select
                  value={fileType}
                  onChange={(e) => setFileType(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E8E0F2] bg-[#F8F5FF] text-[#493A63] font-semibold text-xs focus:outline-none focus:border-[#9B7EDB]"
                >
                  <option value="pdf">📄 PDF Document</option>
                  <option value="pptx">📊 Presentation (PPTX)</option>
                  <option value="ipynb">📓 Jupyter Notebook</option>
                  <option value="doc">📝 Word Document</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#776B88] uppercase mb-1">
                  File Size (Simulated)
                </label>
                <input
                  type="text"
                  value={fileSize}
                  onChange={(e) => setFileSize(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E8E0F2] bg-[#F8F5FF] text-[#493A63] font-semibold text-xs focus:outline-none focus:border-[#9B7EDB]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#E8E0F2] text-xs font-bold text-[#776B88]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#9B7EDB] hover:bg-[#7A58C1] text-white font-bold text-xs shadow-xs"
                >
                  Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* File Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#493A63]/30 backdrop-blur-sm">
          <div className="card-soft p-6 bg-white border-[#E8E0F2] max-w-lg w-full shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E0F2]">
              <div className="flex items-center gap-2">
                <span>📄</span>
                <h2 className="text-base font-bold text-[#493A63]">{previewFile.name}</h2>
              </div>
              <button onClick={() => setPreviewFile(null)} className="text-[#776B88] font-bold">
                ✕
              </button>
            </div>

            <div className="py-8 text-center space-y-3 bg-[#F8F5FF] rounded-2xl border border-[#E8E0F2] my-4">
              <span className="text-5xl">📄</span>
              <p className="text-xs text-[#776B88] font-semibold">
                Simulated Preview for {previewFile.name}
              </p>
              <p className="text-[11px] text-[#9B7EDB] font-bold">
                Ready for study session downloads on campus
              </p>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setPreviewFile(null)}
                className="px-5 py-2 rounded-xl bg-[#9B7EDB] text-white font-bold text-xs shadow-xs"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

