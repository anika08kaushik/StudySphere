import { useState } from 'react'
import { tasks as initialTasks } from '../../mock/tasks'

const COLUMNS = [
  { id: 'todo', label: 'To Do', icon: '📝', bg: 'bg-[#F8F5FF]', border: 'border-[#C9B8E8]' },
  { id: 'in-progress', label: 'In Progress', icon: '⚡', bg: 'bg-[#FCF9EE]', border: 'border-[#F6D98B]' },
  { id: 'review', label: 'Review', icon: '👀', bg: 'bg-[#F3ECFE]', border: 'border-[#9B7EDB]' },
  { id: 'completed', label: 'Completed', icon: '✅', bg: 'bg-[#F2F7F3]', border: 'border-[#BFD8C0]' },
]

export default function Kanban() {
  const [taskList, setTaskList] = useState(initialTasks)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newPriority, setNewPriority] = useState('medium')
  const [newDueDate, setNewDueDate] = useState('')

  const handleAddTask = (e) => {
    e.preventDefault()
    if (!newTitle.trim()) return

    const newTask = {
      _id: `task-${Date.now()}`,
      title: newTitle,
      status: 'todo',
      priority: newPriority,
      dueDate: newDueDate || new Date().toISOString().split('T')[0],
      assignee: 'user-1',
    }

    setTaskList([newTask, ...taskList])
    setNewTitle('')
    setNewPriority('medium')
    setNewDueDate('')
    setShowAddModal(false)
  }

  const moveTaskStatus = (taskId, newStatus) => {
    setTaskList((prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t))
    )
  }

  const deleteTask = (taskId) => {
    setTaskList((prev) => prev.filter((t) => t._id !== taskId))
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Bar */}
      <div className="card-soft p-6 bg-white border-[#E8E0F2] flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📝</span>
            <h1 className="text-xl font-bold text-[#493A63]">Campus Task Board</h1>
          </div>
          <p className="text-xs text-[#776B88] mt-1">
            {taskList.length} total tasks • {taskList.filter((t) => t.status === 'completed').length} completed
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 rounded-xl bg-[#9B7EDB] hover:bg-[#7A58C1] text-white font-bold text-sm shadow-xs transition-all flex items-center gap-2"
        >
          <span>➕</span>
          <span>New Task</span>
        </button>
      </div>

      {/* Kanban Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {COLUMNS.map((col) => {
          const colTasks = taskList.filter((t) => t.status === col.id)
          return (
            <div key={col.id} className={`card-soft p-4 ${col.bg} border ${col.border} flex flex-col h-full min-h-[480px]`}>
              <div className="flex items-center justify-between pb-3 border-b border-[#E8E0F2] mb-3">
                <div className="flex items-center gap-2">
                  <span>{col.icon}</span>
                  <h3 className="text-sm font-bold text-[#493A63]">{col.label}</h3>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-white text-[#493A63] border border-[#E8E0F2]">
                  {colTasks.length}
                </span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                {colTasks.map((task) => (
                  <div
                    key={task._id}
                    className="card-soft p-4 bg-white border-[#E8E0F2] hover:border-[#9B7EDB] transition-all flex flex-col justify-between shadow-xs"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-sm font-bold text-[#493A63] leading-snug">{task.title}</p>
                        <button
                          onClick={() => deleteTask(task._id)}
                          className="text-[#776B88] hover:text-red-500 text-xs transition-colors p-1"
                          title="Delete Task"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-[#776B88] mb-3">
                        <span>📅 {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Today'}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold uppercase ${
                            task.priority === 'high'
                              ? 'bg-rose-50 text-rose-600 border border-rose-200'
                              : task.priority === 'medium'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-50 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {task.priority || 'Medium'}
                        </span>
                      </div>
                    </div>

                    {/* Quick Move Buttons */}
                    <div className="pt-2 border-t border-[#E8E0F2] flex items-center justify-end gap-1">
                      {col.id !== 'todo' && (
                        <button
                          onClick={() => moveTaskStatus(task._id, 'todo')}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold bg-[#F8F5FF] hover:bg-[#E9DFFF] text-[#493A63] border border-[#E8E0F2]"
                        >
                          ← To Do
                        </button>
                      )}
                      {col.id !== 'in-progress' && (
                        <button
                          onClick={() => moveTaskStatus(task._id, 'in-progress')}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold bg-[#FCF9EE] hover:bg-[#F6D98B]/40 text-[#493A63] border border-[#F6EBD0]"
                        >
                          ⚡ Progress
                        </button>
                      )}
                      {col.id !== 'completed' && (
                        <button
                          onClick={() => moveTaskStatus(task._id, 'completed')}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold bg-[#F2F7F3] hover:bg-[#BFD8C0]/50 text-emerald-800 border border-[#D9E8DC]"
                        >
                          Done ✓
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#493A63]/30 backdrop-blur-sm">
          <div className="card-soft p-6 bg-white border-[#E8E0F2] max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E0F2]">
              <h2 className="text-base font-bold text-[#493A63]">Add Campus Task</h2>
              <button onClick={() => setShowAddModal(false)} className="text-[#776B88] font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddTask} className="py-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#776B88] uppercase mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Finish Algorithms Chapter 4 Exercises"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E8E0F2] bg-[#F8F5FF] text-[#493A63] font-semibold text-xs focus:outline-none focus:border-[#9B7EDB]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#776B88] uppercase mb-1">
                  Priority Level
                </label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E8E0F2] bg-[#F8F5FF] text-[#493A63] font-semibold text-xs focus:outline-none focus:border-[#9B7EDB]"
                >
                  <option value="high">🔥 High Priority</option>
                  <option value="medium">⚡ Medium Priority</option>
                  <option value="low">🌱 Low Priority</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#776B88] uppercase mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E8E0F2] bg-[#F8F5FF] text-[#493A63] font-semibold text-xs focus:outline-none focus:border-[#9B7EDB]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#E8E0F2] text-xs font-bold text-[#776B88]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#9B7EDB] hover:bg-[#7A58C1] text-white font-bold text-xs shadow-xs"
                >
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

