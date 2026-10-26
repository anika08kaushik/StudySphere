import { useEffect, useState } from 'react'
import fileService from '../../services/fileService'
import Button from '../../components/ui/Button'

export default function DocumentViewer({ file, onClose }) {
  const [previewUrl, setPreviewUrl] = useState('')
  const [previewError, setPreviewError] = useState('')
  const groupId = typeof file?.groupId === 'object' ? file.groupId?._id : file?.groupId
  const fileId = file?._id

  const handleDownload = async () => {
    try {
      const response = await fileService.downloadFile(fileId, groupId)
      const downloadUrl = URL.createObjectURL(response.data)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = file.originalName || file.name
      link.click()
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000)
    } catch (error) {
      setPreviewError(error.response?.data?.message || error.message || 'Failed to download resource')
    }
  }

  useEffect(() => {
    if (!fileId) return undefined

    let cancelled = false
    let objectUrl = ''
    fileService.getFileMeta(fileId, groupId)
      .then((response) => {
        if (cancelled) return
        objectUrl = URL.createObjectURL(response.data)
        setPreviewUrl(objectUrl)
        setPreviewError('')
      })
      .catch((error) => {
        if (!cancelled) {
          setPreviewError(error.response?.data?.message || error.message || 'Failed to load preview')
        }
      })

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [fileId, groupId])

  if (!file) return null

  const isPdf = file.mimeType === 'application/pdf'
  const isImage = file.mimeType?.startsWith('image/')

  return (
    <div className="bg-white rounded-xl border border-surface-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-surface-900">{file.name}</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>✕ Close</Button>
      </div>

      {previewError && <p role="alert" className="text-center text-rose-600">{previewError}</p>}
      {!previewUrl && !previewError && <p className="text-center text-surface-400">Loading preview...</p>}

      {previewUrl && (
        <>
          <div className="bg-surface-100 rounded-lg p-8 mb-6">
            {isPdf && (
              <iframe
                src={previewUrl}
                title={file.name}
                className="w-full h-64 rounded-lg"
              />
            )}
            {isImage && (
              <img
                src={previewUrl}
                alt={file.name}
                className="w-full h-64 rounded-lg object-cover"
              />
            )}
            {!isPdf && !isImage && (
              <p className="text-surface-500">
                {file.mimeType?.toUpperCase()} documents are ready to download.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleDownload}
            className="px-4 py-2 rounded-xl bg-[#9B7EDB] hover:bg-[#7A58C1] text-white text-sm"
          >
            Download
          </button>
        </>
      )}
    </div>
  )
}
