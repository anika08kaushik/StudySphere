export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && <div className="mb-4 text-surface-400">{icon}</div>}
      <h3 className="text-lg font-medium text-surface-900 mb-1">{title}</h3>
      {description && <p className="text-sm text-surface-500 max-w-sm mb-4">{description}</p>}
      {action}
    </div>
  )
}
