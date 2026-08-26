import { useEffect, useState } from 'react'
import fileService from '../../services/fileService'

const FILE_ICONS = {
  pdf: { icon: '📄', bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200' },
  pptx: { icon: '📊', bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
  ipynb: { icon: '📓', bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200' },
  doc: { icon: '📝', bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  default: { icon: '📁', bg: 'bg-[#F8F5FF]', text: 'text-[#493A63]', border: 'border-[#E8E0F2]' },
}

export default function ResourceLocker({ groupId }) {
  const [fileList, setFileList] = useState([])
  const [folders, setFolders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeFolder, setActiveFolder] = useState(null)
  const [search, setSearch] = useState('')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [previewFile, setPreviewFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)

  // Upload Form State
  const [selectedFile, setSelectedFile] = useState(null)

  useEffect(() => {
    if (!groupId) return

    const loadResources = async () => {
      setLoading(true)
      setError('')
      try {
        const [filesResponse, foldersResponse] = await Promise.all([
          fileService.getFiles(groupId),
          fileService.getFolders(groupId),
        ])
        setFileList(filesResponse.data.data || [])
        setFolders(foldersResponse.data.data || [])
      } catch (loadError) {
        setError(loadError.response?.data?.message || 'Unable to load resources.')
      } finally {
        setLoading(false)
      }
    }

    loadResources()
  }, [groupId])

  const handleUploadFile = async (e) => {
    e.preventDefault()
    if (!selectedFile || !groupId) return

    const formData = new FormData()
    formData.append('file', selectedFile)
    formData.append('groupId', groupId)
    if (activeFolder) formData.append('folderId', activeFolder)

    try {
      setError('')
      const response = await fileService.uploadFile(formData)
      setFileList((prev) => [response.data.data, ...prev])
      setSelectedFile(null)
      setShowUploadModal(false)
    } catch (uploadError) {
      setError(uploadError.response?.data?.message || 'Unable to upload resource.')
    }
  }

  const handleDeleteFile = async (fileId, e) => {
    e.stopPropagation()
    try {
      await fileService.deleteFile(fileId)
      setFileList((prev) => prev.filter((f) => f._id !== fileId))
    } catch (deleteError) {
      setError(deleteError.response?.data?.message || 'Unable to delete resource.')
    }
  }

  const handlePreviewFile = async (file) => {
    setPreviewFile(file)
    setPreviewUrl('')
    setPreviewLoading(true)
    try {
      const response = await fileService.getFileMeta(file._id)
      setPreviewUrl(URL.createObjectURL(response.data))
    } catch (previewError) {
      setError(previewError.response?.data?.message || 'Unable to retrieve resource.')
      setPreviewFile(null)
    } finally {
      setPreviewLoading(false)
    }
  }

  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewFile(null)
    setPreviewUrl('')
  }

  const filteredFiles = fileList.filter((f) => {
    const folderId = typeof f.folderId === 'object' ? f.folderId?._id : f.folderId
    const matchesFolder = activeFolder ? folderId === activeFolder : true
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
          {folders.map((f) => {
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
        {loading && <div className="card-soft p-12 text-center bg-white border-[#E8E0F2]"><p className="text-sm font-semibold text-[#776B88]">Loading resources...</p></div>}
        {!loading && error && <div className="card-soft p-4 text-center bg-rose-50 border border-rose-200"><p className="text-sm font-semibold text-rose-600">{error}</p></div>}
        {!loading && !error && filteredFiles.map((f) => {
          const fileType = f.mimeType?.split('/').pop() === 'pdf' ? 'pdf' : f.name.split('.').pop()?.toLowerCase()
          const style = FILE_ICONS[fileType] || FILE_ICONS.default
          return (
            <div
              key={f._id}
              onClick={() => handlePreviewFile(f)}
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
                    {typeof f.size === 'number' ? `${(f.size / (1024 * 1024)).toFixed(1)} MB` : f.size || '2.4 MB'} • {fileType?.toUpperCase()} • Uploaded by {f.uploadedBy?.name || f.uploadedBy || 'Student'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handlePreviewFile(f)}
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

        {!loading && !error && filteredFiles.length === 0 && (
          <div className="card-soft p-12 text-center bg-white border-[#E8E0F2]">
            <p className="text-sm font-semibold text-[#776B88]">No resources found in this folder.</p>
          </div>
        )}
      </div>

      {/* Upload File Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pb-24 md:pb-4 bg-[#493A63]/30 backdrop-blur-sm">
          <div className="card-soft p-6 bg-white border-[#E8E0F2] max-w-md w-full max-h-[calc(100vh-2rem)] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E0F2]">
              <h2 className="text-base font-bold text-[#493A63]">Upload Campus Resource</h2>
              <button onClick={() => { setSelectedFile(null); setShowUploadModal(false) }} className="text-[#776B88] font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadFile} className="py-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#776B88] uppercase mb-1">
                  Select File
                </label>
                <input
                  required
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E8E0F2] bg-[#F8F5FF] text-[#493A63] font-semibold text-xs focus:outline-none focus:border-[#9B7EDB]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setSelectedFile(null); setShowUploadModal(false) }}
                  className="px-4 py-2 rounded-xl border border-[#E8E0F2] text-xs font-bold text-[#776B88]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedFile}
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pb-24 md:pb-4 bg-[#493A63]/30 backdrop-blur-sm">
          <div className="card-soft p-6 bg-white border-[#E8E0F2] max-w-lg w-full max-h-[calc(100vh-2rem)] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E0F2]">
              <div className="flex items-center gap-2">
                <span>📄</span>
                <h2 className="text-base font-bold text-[#493A63]">{previewFile.name}</h2>
              </div>
              <button onClick={closePreview} className="text-[#776B88] font-bold">
                ✕
              </button>
            </div>

            <div className="py-8 text-center space-y-3 bg-[#F8F5FF] rounded-2xl border border-[#E8E0F2] my-4">
              {previewLoading && <p className="text-xs text-[#776B88] font-semibold">Retrieving resource...</p>}
              {!previewLoading && previewUrl && previewFile.mimeType === 'application/pdf' && (
                <iframe src={previewUrl} title={previewFile.name} className="w-full h-96 rounded-xl" />
              )}
              {!previewLoading && previewUrl && previewFile.mimeType?.startsWith('image/') && (
                <img src={previewUrl} alt={previewFile.name} className="max-h-96 max-w-full mx-auto rounded-xl" />
              )}
              {!previewLoading && previewUrl && !previewFile.mimeType?.startsWith('image/') && previewFile.mimeType !== 'application/pdf' && (
                <p className="text-xs text-[#776B88] font-semibold">Resource retrieved and ready to download.</p>
              )}
              {previewUrl && (
                <a href={previewUrl} download={previewFile.originalName || previewFile.name} className="inline-block text-[11px] text-[#9B7EDB] font-bold hover:underline">
                  Download {previewFile.name}
                </a>
              )}
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={closePreview}
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

