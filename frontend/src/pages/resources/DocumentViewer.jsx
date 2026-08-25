import Button from '../../components/ui/Button'

export default function DocumentViewer({ file, onClose }) {
  if (!file) return null

  return (
    <div className="bg-white rounded-xl border border-surface-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-surface-900">{file.name}</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>✕ Close</Button>
      </div>
      <div className="bg-surface-100 rounded-lg p-12 text-center">
        <span className="text-4xl mb-4 block">
          {file.type === 'pdf' ? '📄' : file.type === 'pptx' ? '📊' : '📓'}
        </span>
        <p className="text-surface-500">Document viewer coming soon</p>
        <p className="text-xs text-surface-400 mt-1">Protected with watermark and access tracking</p>
      </div>
    </div>
  )
}
