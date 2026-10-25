import { useEffect, useState } from 'react'
import taskService from '../../services/taskService'
import api from '../../services/api'

const COLUMNS = [
  {
    id: 'TODO',
    label: 'To Do',
    icon: '📝',
    bg: 'bg-[#F8F5FF]',
    border: 'border-[#C9B8E8]',
    accent: '#9B7EDB',
  },
  {
    id: 'IN_PROGRESS',
    label: 'In Progress',
    icon: '⚡',
    bg: 'bg-[#FCF9EE]',
    border: 'border-[#F6D98B]',
    accent: '#D97706',
  },
  {
    id: 'REVIEW',
    label: 'Review',
    icon: '👀',
    bg: 'bg-[#F3ECFE]',
    border: 'border-[#B193E3]',
    accent: '#7A58C1',
  },
  {
    id: 'COMPLETED',
    label: 'Completed',
    icon: '✅',
    bg: 'bg-[#F2F7F3]',
    border: 'border-[#BFD8C0]',
    accent: '#10B981',
  },
]

const normalizeTask = (task) => ({
  ...task,
  status: task.status || 'TODO',
  priority: String(task.priority || 'MEDIUM').toUpperCase(),
  deadline: task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : '',
  checklist: Array.isArray(task.checklist) ? task.checklist : [],
})

export default function Kanban() {
  const [taskList, setTaskList] = useState([])
  const [groups, setGroups] = useState([])
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [groupMembers, setGroupMembers] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Add Task Modal State
  const [showAddModal, setShowAddModal] = useState(false)
  const [addStatus, setAddStatus] = useState('TODO')
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newPriority, setNewPriority] = useState('MEDIUM')
  const [newDeadline, setNewDeadline] = useState('')
  const [newAssignedTo, setNewAssignedTo] = useState('')
  const [newChecklist, setNewChecklist] = useState([])
  const [newChecklistInput, setNewChecklistInput] = useState('')
  const [savingTask, setSavingTask] = useState(false)

  // Edit Task Modal State
  const [editingTask, setEditingTask] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editStatus, setEditStatus] = useState('TODO')
  const [editPriority, setEditPriority] = useState('MEDIUM')
  const [editDeadline, setEditDeadline] = useState('')
  const [editAssignedTo, setEditAssignedTo] = useState('')
  const [editChecklist, setEditChecklist] = useState([])
  const [editChecklistInput, setEditChecklistInput] = useState('')
  const [updatingTask, setUpdatingTask] = useState(false)

  // Expanded checklist map for in-card view
  const [expandedCardChecklist, setExpandedCardChecklist] = useState({})

  // Load Groups
  useEffect(() => {
    const loadGroups = async () => {
      try {
        setError('')
        let loadedGroups = []
        try {
          const resMe = await api.get('/groups/me')
          loadedGroups = resMe.data?.data || []
        } catch {
          // fallback to all groups
          const resAll = await api.get('/groups')
          loadedGroups = resAll.data?.data || []
        }

        if (loadedGroups.length === 0) {
          const resAll = await api.get('/groups')
          loadedGroups = resAll.data?.data || []
        }

        setGroups(loadedGroups)
        if (loadedGroups.length > 0) {
          setSelectedGroupId(String(loadedGroups[0]._id))
        }
      } catch (err) {
        console.error('Unable to load groups:', err)
        setError(err.response?.data?.message || 'Unable to load study groups')
      }
    }

    loadGroups()
  }, [])

  // Load group members when selected group changes
  useEffect(() => {
    if (!selectedGroupId) {
      setGroupMembers([])
      return
    }

    const loadMembers = async () => {
      try {
        const res = await api.get(`/groups/${selectedGroupId}/members`)
        const membersData = res.data?.data?.members || []
        setGroupMembers(membersData)
      } catch (err) {
        console.warn('Unable to load members for group:', err.message)
        setGroupMembers([])
      }
    }

    loadMembers()
  }, [selectedGroupId])

  // Load Tasks whenever selected group changes
  const fetchTasks = async (groupId = selectedGroupId) => {
    try {
      setLoading(true)
      setError('')

      const response = await taskService.getTasks(groupId)
      const tasks = response.data?.data || []
      setTaskList(tasks.map(normalizeTask))
    } catch (err) {
      console.error('Unable to load tasks:', err)
      setError(err.response?.data?.message || 'Unable to load tasks')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedGroupId) {
      fetchTasks(selectedGroupId)
    } else {
      setTaskList([])
      setLoading(false)
    }
  }, [selectedGroupId])

  // Add task checklist item helper
  const handleAddChecklistItem = (e) => {
    e.preventDefault()
    if (!newChecklistInput.trim()) return
    setNewChecklist((prev) => [...prev, { text: newChecklistInput.trim(), completed: false }])
    setNewChecklistInput('')
  }

  const removeChecklistItem = (index) => {
    setNewChecklist((prev) => prev.filter((_, i) => i !== index))
  }

  // Edit task checklist item helpers
  const handleEditAddChecklistItem = (e) => {
    e.preventDefault()
    if (!editChecklistInput.trim()) return
    setEditChecklist((prev) => [...prev, { text: editChecklistInput.trim(), completed: false }])
    setEditChecklistInput('')
  }

  const removeEditChecklistItem = (index) => {
    setEditChecklist((prev) => prev.filter((_, i) => i !== index))
  }

  const toggleEditChecklistItem = (index) => {
    setEditChecklist((prev) =>
      prev.map((item, i) => (i === index ? { ...item, completed: !item.completed } : item))
    )
  }

  // Open Add Task Modal
  const openAddModal = (columnStatus = 'TODO') => {
    setAddStatus(columnStatus)
    setNewTitle('')
    setNewDescription('')
    setNewPriority('MEDIUM')
    setNewDeadline('')
    setNewAssignedTo('')
    setNewChecklist([])
    setNewChecklistInput('')
    setShowAddModal(true)
  }

  // Submit Add Task
  const handleAddTask = async (e) => {
    e.preventDefault()
    if (!newTitle.trim()) return

    if (!selectedGroupId) {
      setError('Please join or select a study group first')
      return
    }

    try {
      setSavingTask(true)
      setError('')

      const taskData = {
        title: newTitle.trim(),
        description: newDescription.trim(),
        groupId: selectedGroupId,
        status: addStatus,
        priority: newPriority,
        deadline: newDeadline || null,
        assignedTo: newAssignedTo || null,
        checklist: newChecklist,
      }

      const response = await taskService.createTask(taskData)
      const createdTask = response.data?.data

      if (createdTask) {
        setTaskList((prev) => [normalizeTask(createdTask), ...prev])
      }

      setShowAddModal(false)
    } catch (err) {
      console.error('Unable to create task:', err)
      setError(err.response?.data?.message || 'Unable to create task')
    } finally {
      setSavingTask(false)
    }
  }

  // Open Edit Task Modal
  const openEditModal = (task) => {
    setEditingTask(task)
    setEditTitle(task.title || '')
    setEditDescription(task.description || '')
    setEditStatus(task.status || 'TODO')
    setEditPriority(task.priority || 'MEDIUM')
    setEditDeadline(task.deadline || '')
    setEditAssignedTo(task.assignedTo?._id || task.assignedTo || '')
    setEditChecklist(task.checklist || [])
    setEditChecklistInput('')
  }

  // Submit Edit Task
  const handleSaveEditTask = async (e) => {
    e.preventDefault()
    if (!editTitle.trim() || !editingTask) return

    try {
      setUpdatingTask(true)
      setError('')

      const updates = {
        title: editTitle.trim(),
        description: editDescription.trim(),
        status: editStatus,
        priority: editPriority,
        deadline: editDeadline || null,
        assignedTo: editAssignedTo || null,
        checklist: editChecklist,
      }

      const response = await taskService.updateTask(editingTask._id, updates)
      const updated = response.data?.data

      if (updated) {
        setTaskList((prev) =>
          prev.map((t) => (t._id === editingTask._id ? normalizeTask(updated) : t))
        )
      }

      setEditingTask(null)
    } catch (err) {
      console.error('Unable to update task:', err)
      setError(err.response?.data?.message || 'Unable to update task')
    } finally {
      setUpdatingTask(false)
    }
  }

  // Quick Move Task Status
  const moveTaskStatus = async (taskId, newStatus) => {
    try {
      setError('')
      // Optimistic update
      setTaskList((prev) =>
        prev.map((task) => (task._id === taskId ? { ...task, status: newStatus } : task))
      )

      const response = await taskService.updateTask(taskId, { status: newStatus })
      const updatedTask = response.data?.data

      if (updatedTask) {
        setTaskList((prev) =>
          prev.map((task) => (task._id === taskId ? normalizeTask(updatedTask) : task))
        )
      }
    } catch (err) {
      console.error('Unable to update task status:', err)
      setError(err.response?.data?.message || 'Unable to update task status')
      // Re-fetch to rollback
      fetchTasks()
    }
  }

  // In-Card Checklist Item Toggle
  const toggleCardChecklistItem = async (task, itemIndex) => {
    const updatedChecklist = task.checklist.map((item, idx) =>
      idx === itemIndex ? { ...item, completed: !item.completed } : item
    )

    // Optimistic update
    setTaskList((prev) =>
      prev.map((t) => (t._id === task._id ? { ...t, checklist: updatedChecklist } : t))
    )

    try {
      await taskService.updateTask(task._id, { checklist: updatedChecklist })
    } catch (err) {
      console.error('Unable to update checklist:', err)
      fetchTasks()
    }
  }

  // Delete Task
  const deleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return

    try {
      setError('')
      await taskService.deleteTask(taskId)
      setTaskList((prev) => prev.filter((task) => task._id !== taskId))
    } catch (err) {
      console.error('Unable to delete task:', err)
      setError(err.response?.data?.message || 'Unable to delete task')
    }
  }

  const selectedGroup = groups.find((g) => String(g._id) === String(selectedGroupId))

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 md:px-4 py-2">
      {/* Top Header Card */}
      <div className="card-soft p-5 bg-white border-[#E8E0F2] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-2xl p-2 rounded-xl bg-[#F3ECFE] border border-[#C9B8E8]">📝</span>
            <div>
              <h1 className="text-xl font-bold text-[#493A63] tracking-tight">
                Productivity & Focus Kanban Board
              </h1>
              <p className="text-xs text-[#776B88] mt-0.5">
                {taskList.length} total tasks •{' '}
                {taskList.filter((task) => task.status === 'COMPLETED').length} completed
                {selectedGroup && (
                  <span className="ml-2 font-semibold text-[#7A58C1]">
                    • Group: {selectedGroup.name}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Group Selector & Action Buttons */}
        <div className="flex items-center flex-wrap gap-2.5">
          {groups.length > 0 && (
            <div className="flex items-center gap-2">
              <label htmlFor="group-select" className="text-xs font-bold text-[#776B88] whitespace-nowrap">
                Study Group:
              </label>
              <select
                id="group-select"
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="px-3 py-2 rounded-xl border border-[#E8E0F2] bg-[#F8F5FF] text-[#493A63] font-bold text-xs focus:outline-none focus:border-[#9B7EDB] shadow-2xs"
              >
                {groups.map((group) => (
                  <option key={group._id} value={group._id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => fetchTasks(selectedGroupId)}
            title="Refresh Board"
            className="p-2 rounded-xl border border-[#E8E0F2] bg-[#F8F5FF] hover:bg-[#F3ECFE] text-[#493A63] text-xs font-bold transition-all shadow-2xs"
          >
            🔄 Sync
          </button>

          <button
            onClick={() => openAddModal('TODO')}
            disabled={!selectedGroupId}
            className="px-4 py-2 rounded-xl bg-[#9B7EDB] hover:bg-[#7A58C1] disabled:opacity-50 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>➕</span>
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3.5 text-xs flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError('')}
            className="text-red-500 font-bold hover:text-red-700 text-sm px-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* No Groups Empty State */}
      {groups.length === 0 && !loading && (
        <div className="card-soft bg-white p-12 text-center max-w-md mx-auto space-y-3">
          <span className="text-4xl">👥</span>
          <h3 className="text-base font-bold text-[#493A63]">No Study Groups Found</h3>
          <p className="text-xs text-[#776B88]">
            You must be an active member of at least one study group to create and view collaborative tasks.
          </p>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {COLUMNS.map((col) => (
            <div
              key={col.id}
              className={`card-soft p-4 ${col.bg} border ${col.border} min-h-[460px] animate-pulse space-y-3`}
            >
              <div className="h-6 bg-white/70 rounded-md w-3/4"></div>
              <div className="h-28 bg-white/60 rounded-xl"></div>
              <div className="h-28 bg-white/60 rounded-xl"></div>
            </div>
          ))}
        </div>
      ) : groups.length > 0 ? (
        /* Kanban 4 Columns Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {COLUMNS.map((col) => {
            const colTasks = taskList.filter((task) => task.status === col.id)

            return (
              <div
                key={col.id}
                className={`card-soft p-4 ${col.bg} border ${col.border} flex flex-col h-full min-h-[500px] shadow-2xs transition-all`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 border-b border-[#E8E0F2] mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{col.icon}</span>
                    <h2 className="text-xs font-black uppercase tracking-wider text-[#493A63]">
                      {col.label}
                    </h2>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-white text-[#493A63] border border-[#E8E0F2] shadow-2xs">
                      {colTasks.length}
                    </span>
                    <button
                      onClick={() => openAddModal(col.id)}
                      title={`Add task to ${col.label}`}
                      className="p-1 rounded-lg hover:bg-white text-[#776B88] hover:text-[#9B7EDB] text-xs font-black transition-colors"
                    >
                      ➕
                    </button>
                  </div>
                </div>

                {/* Column Body / Tasks list */}
                <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                  {colTasks.length === 0 ? (
                    /* Column Empty State */
                    <div className="h-44 border-2 border-dashed border-[#E8E0F2] rounded-xl flex flex-col items-center justify-center p-4 text-center">
                      <span className="text-2xl mb-1 opacity-60">{col.icon}</span>
                      <p className="text-xs font-bold text-[#776B88]">No tasks in {col.label}</p>
                      <button
                        onClick={() => openAddModal(col.id)}
                        className="mt-2 text-[11px] font-bold text-[#9B7EDB] hover:text-[#7A58C1] underline"
                      >
                        + Add a task
                      </button>
                    </div>
                  ) : (
                    colTasks.map((task) => {
                      const completedChecklistCount = task.checklist.filter((i) => i.completed).length
                      const hasChecklist = task.checklist.length > 0
                      const isChecklistExpanded = Boolean(expandedCardChecklist[task._id])
                      const isOverdue =
                        task.deadline &&
                        task.status !== 'COMPLETED' &&
                        new Date(task.deadline) < new Date(new Date().setHours(0, 0, 0, 0))

                      return (
                        <div
                          key={task._id}
                          className="card-soft p-3.5 bg-white border-[#E8E0F2] hover:border-[#9B7EDB] transition-all flex flex-col justify-between shadow-xs group"
                        >
                          <div>
                            {/* Card Header: Title & Actions */}
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <h3 className="text-xs font-bold text-[#493A63] leading-snug break-words">
                                {task.title}
                              </h3>

                              <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity shrink-0">
                                <button
                                  onClick={() => openEditModal(task)}
                                  className="text-[#776B88] hover:text-[#7A58C1] text-xs p-1 rounded-md hover:bg-[#F3ECFE] transition-colors"
                                  title="Edit Task"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => deleteTask(task._id)}
                                  className="text-[#776B88] hover:text-red-500 text-xs p-1 rounded-md hover:bg-red-50 transition-colors"
                                  title="Delete Task"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>

                            {/* Description preview */}
                            {task.description && (
                              <p className="text-[11px] text-[#776B88] line-clamp-2 mb-2">
                                {task.description}
                              </p>
                            )}

                            {/* Assignee & Priority Badges */}
                            <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                              {/* Assignee */}
                              <div className="flex items-center gap-1.5">
                                {task.assignedTo ? (
                                  <div
                                    className="flex items-center gap-1 bg-[#F8F5FF] border border-[#E8E0F2] px-2 py-0.5 rounded-full text-[10px] font-semibold text-[#493A63]"
                                    title={`Assigned to: ${task.assignedTo.name || task.assignedTo.email || 'Member'}`}
                                  >
                                    <span className="w-4 h-4 rounded-full bg-[#9B7EDB] text-white flex items-center justify-center text-[9px] font-bold">
                                      {(task.assignedTo.name || 'M').charAt(0).toUpperCase()}
                                    </span>
                                    <span className="max-w-[70px] truncate">
                                      {task.assignedTo.name || 'Member'}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-[#9789B0] italic bg-[#F8F5FF] px-2 py-0.5 rounded-full border border-[#E8E0F2]">
                                    Unassigned
                                  </span>
                                )}
                              </div>

                              {/* Priority Badge */}
                              <span
                                className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wide border ${
                                  task.priority === 'HIGH'
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : task.priority === 'MEDIUM'
                                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                }`}
                              >
                                {task.priority === 'HIGH' ? '🔥 High' : task.priority === 'MEDIUM' ? '⚡ Med' : '🌱 Low'}
                              </span>
                            </div>

                            {/* Deadline info */}
                            {task.deadline && (
                              <div className="flex items-center justify-between text-[10px] text-[#776B88] mb-2 font-medium">
                                <span>📅 Due {task.deadline}</span>
                                {isOverdue && (
                                  <span className="text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-200">
                                    Overdue
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Checklist widget */}
                            {hasChecklist && (
                              <div className="mb-2 bg-[#F8F5FF] border border-[#E8E0F2] rounded-xl p-2 text-[11px]">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedCardChecklist((prev) => ({
                                      ...prev,
                                      [task._id]: !prev[task._id],
                                    }))
                                  }
                                  className="w-full flex items-center justify-between text-[#493A63] font-bold text-[10px] cursor-pointer"
                                >
                                  <span>
                                    ☑️ Checklist ({completedChecklistCount}/{task.checklist.length})
                                  </span>
                                  <span>{isChecklistExpanded ? '▲' : '▼'}</span>
                                </button>

                                {/* Progress bar */}
                                <div className="w-full bg-[#E8E0F2] h-1.5 rounded-full overflow-hidden mt-1.5">
                                  <div
                                    className="bg-[#9B7EDB] h-full transition-all duration-300"
                                    style={{
                                      width: `${(completedChecklistCount / task.checklist.length) * 100}%`,
                                    }}
                                  ></div>
                                </div>

                                {/* Expandable checklist items */}
                                {isChecklistExpanded && (
                                  <div className="mt-2 space-y-1 pt-1 border-t border-[#E8E0F2]">
                                    {task.checklist.map((item, idx) => (
                                      <label
                                        key={idx}
                                        className="flex items-center gap-1.5 cursor-pointer text-[10px] text-[#493A63] hover:text-[#7A58C1]"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={Boolean(item.completed)}
                                          onChange={() => toggleCardChecklistItem(task, idx)}
                                          className="rounded text-[#9B7EDB] focus:ring-[#9B7EDB] cursor-pointer"
                                        />
                                        <span className={item.completed ? 'line-through text-[#9789B0]' : ''}>
                                          {item.text}
                                        </span>
                                      </label>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Quick Status Move Buttons */}
                          <div className="pt-2 border-t border-[#E8E0F2] flex items-center justify-end gap-1 flex-wrap">
                            {col.id !== 'TODO' && (
                              <button
                                onClick={() => moveTaskStatus(task._id, 'TODO')}
                                className="px-1.5 py-0.5 rounded-lg text-[9px] font-bold bg-[#F8F5FF] hover:bg-[#E9DFFF] text-[#493A63] border border-[#E8E0F2] cursor-pointer"
                              >
                                ← To Do
                              </button>
                            )}

                            {col.id !== 'IN_PROGRESS' && (
                              <button
                                onClick={() => moveTaskStatus(task._id, 'IN_PROGRESS')}
                                className="px-1.5 py-0.5 rounded-lg text-[9px] font-bold bg-[#FCF9EE] hover:bg-[#F6D98B]/50 text-[#78350F] border border-[#F6EBD0] cursor-pointer"
                              >
                                ⚡ In Prog
                              </button>
                            )}

                            {col.id !== 'REVIEW' && (
                              <button
                                onClick={() => moveTaskStatus(task._id, 'REVIEW')}
                                className="px-1.5 py-0.5 rounded-lg text-[9px] font-bold bg-[#F3ECFE] hover:bg-[#E9DFFF] text-[#493A63] border border-[#C9B8E8] cursor-pointer"
                              >
                                👀 Review
                              </button>
                            )}

                            {col.id !== 'COMPLETED' && (
                              <button
                                onClick={() => moveTaskStatus(task._id, 'COMPLETED')}
                                className="px-1.5 py-0.5 rounded-lg text-[9px] font-bold bg-[#F2F7F3] hover:bg-[#BFD8C0]/60 text-emerald-800 border border-[#D9E8DC] cursor-pointer"
                              >
                                Done ✓
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : null}

      {/* ========================================= */}
      {/* ADD TASK MODAL                            */}
      {/* ========================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#493A63]/40 backdrop-blur-xs">
          <div className="card-soft p-6 bg-white border-[#E8E0F2] max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E0F2]">
              <div className="flex items-center gap-2">
                <span className="text-lg">✨</span>
                <h2 className="text-base font-bold text-[#493A63]">Add New Task</h2>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#776B88] hover:text-[#493A63] font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddTask} className="py-4 space-y-3.5">
              {/* Task Title */}
              <div>
                <label className="block text-xs font-bold text-[#776B88] uppercase mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Implement ResNet-50 feature extractor"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E8E0F2] bg-[#F8F5FF] text-[#493A63] font-semibold text-xs focus:outline-none focus:border-[#9B7EDB]"
                />
              </div>

              {/* Task Description */}
              <div>
                <label className="block text-xs font-bold text-[#776B88] uppercase mb-1">
                  Description
                </label>
                <textarea
                  rows="2"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Detailed specifications, notes, or links..."
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E8E0F2] bg-[#F8F5FF] text-[#493A63] font-semibold text-xs focus:outline-none focus:border-[#9B7EDB]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Column Status */}
                <div>
                  <label className="block text-xs font-bold text-[#776B88] uppercase mb-1">
                    Initial Status
                  </label>
                  <select
                    value={addStatus}
                    onChange={(e) => setAddStatus(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E8E0F2] bg-[#F8F5FF] text-[#493A63] font-semibold text-xs focus:outline-none focus:border-[#9B7EDB]"
                  >
                    <option value="TODO">📝 To Do</option>
                    <option value="IN_PROGRESS">⚡ In Progress</option>
                    <option value="REVIEW">👀 Review</option>
                    <option value="COMPLETED">✅ Completed</option>
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-xs font-bold text-[#776B88] uppercase mb-1">
                    Priority
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E8E0F2] bg-[#F8F5FF] text-[#493A63] font-semibold text-xs focus:outline-none focus:border-[#9B7EDB]"
                  >
                    <option value="HIGH">🔥 High Priority</option>
                    <option value="MEDIUM">⚡ Medium Priority</option>
                    <option value="LOW">🌱 Low Priority</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Deadline */}
                <div>
                  <label className="block text-xs font-bold text-[#776B88] uppercase mb-1">
                    Deadline / Due Date
                  </label>
                  <input
                    type="date"
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E8E0F2] bg-[#F8F5FF] text-[#493A63] font-semibold text-xs focus:outline-none focus:border-[#9B7EDB]"
                  />
                </div>

                {/* Assignee */}
                <div>
                  <label className="block text-xs font-bold text-[#776B88] uppercase mb-1">
                    Assigned To
                  </label>
                  <select
                    value={newAssignedTo}
                    onChange={(e) => setNewAssignedTo(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E8E0F2] bg-[#F8F5FF] text-[#493A63] font-semibold text-xs focus:outline-none focus:border-[#9B7EDB]"
                  >
                    <option value="">-- Unassigned --</option>
                    {groupMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name || member.email}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Checklist Builder */}
              <div>
                <label className="block text-xs font-bold text-[#776B88] uppercase mb-1">
                  Checklist Items
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newChecklistInput}
                    onChange={(e) => setNewChecklistInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddChecklistItem(e)
                      }
                    }}
                    placeholder="Add step or checklist item..."
                    className="flex-1 px-3 py-1.5 rounded-xl border border-[#E8E0F2] bg-[#F8F5FF] text-[#493A63] text-xs focus:outline-none focus:border-[#9B7EDB]"
                  />
                  <button
                    type="button"
                    onClick={handleAddChecklistItem}
                    className="px-3 py-1.5 rounded-xl bg-[#F3ECFE] hover:bg-[#E9DFFF] text-[#493A63] font-bold text-xs border border-[#C9B8E8] cursor-pointer"
                  >
                    + Add
                  </button>
                </div>

                {newChecklist.length > 0 && (
                  <div className="space-y-1 max-h-32 overflow-y-auto bg-[#F8F5FF] p-2 rounded-xl border border-[#E8E0F2]">
                    {newChecklist.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs text-[#493A63]">
                        <span>• {item.text}</span>
                        <button
                          type="button"
                          onClick={() => removeChecklistItem(idx)}
                          className="text-red-500 hover:text-red-700 font-bold px-1"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-[#E8E0F2] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#E8E0F2] text-xs font-bold text-[#776B88] hover:bg-[#F8F5FF] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTask || !newTitle.trim()}
                  className="px-5 py-2 rounded-xl bg-[#9B7EDB] hover:bg-[#7A58C1] disabled:opacity-50 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  {savingTask ? 'Saving...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* EDIT TASK MODAL                           */}
      {/* ========================================= */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#493A63]/40 backdrop-blur-xs">
          <div className="card-soft p-6 bg-white border-[#E8E0F2] max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E0F2]">
              <div className="flex items-center gap-2">
                <span className="text-lg">✏️</span>
                <h2 className="text-base font-bold text-[#493A63]">Edit Task</h2>
              </div>
              <button
                onClick={() => setEditingTask(null)}
                className="text-[#776B88] hover:text-[#493A63] font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditTask} className="py-4 space-y-3.5">
              {/* Task Title */}
              <div>
                <label className="block text-xs font-bold text-[#776B88] uppercase mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E8E0F2] bg-[#F8F5FF] text-[#493A63] font-semibold text-xs focus:outline-none focus:border-[#9B7EDB]"
                />
              </div>

              {/* Task Description */}
              <div>
                <label className="block text-xs font-bold text-[#776B88] uppercase mb-1">
                  Description
                </label>
                <textarea
                  rows="2"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E8E0F2] bg-[#F8F5FF] text-[#493A63] font-semibold text-xs focus:outline-none focus:border-[#9B7EDB]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Column Status */}
                <div>
                  <label className="block text-xs font-bold text-[#776B88] uppercase mb-1">
                    Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E8E0F2] bg-[#F8F5FF] text-[#493A63] font-semibold text-xs focus:outline-none focus:border-[#9B7EDB]"
                  >
                    <option value="TODO">📝 To Do</option>
                    <option value="IN_PROGRESS">⚡ In Progress</option>
                    <option value="REVIEW">👀 Review</option>
                    <option value="COMPLETED">✅ Completed</option>
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-xs font-bold text-[#776B88] uppercase mb-1">
                    Priority
                  </label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E8E0F2] bg-[#F8F5FF] text-[#493A63] font-semibold text-xs focus:outline-none focus:border-[#9B7EDB]"
                  >
                    <option value="HIGH">🔥 High Priority</option>
                    <option value="MEDIUM">⚡ Medium Priority</option>
                    <option value="LOW">🌱 Low Priority</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Deadline */}
                <div>
                  <label className="block text-xs font-bold text-[#776B88] uppercase mb-1">
                    Deadline / Due Date
                  </label>
                  <input
                    type="date"
                    value={editDeadline}
                    onChange={(e) => setEditDeadline(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E8E0F2] bg-[#F8F5FF] text-[#493A63] font-semibold text-xs focus:outline-none focus:border-[#9B7EDB]"
                  />
                </div>

                {/* Assignee */}
                <div>
                  <label className="block text-xs font-bold text-[#776B88] uppercase mb-1">
                    Assigned To
                  </label>
                  <select
                    value={editAssignedTo}
                    onChange={(e) => setEditAssignedTo(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E8E0F2] bg-[#F8F5FF] text-[#493A63] font-semibold text-xs focus:outline-none focus:border-[#9B7EDB]"
                  >
                    <option value="">-- Unassigned --</option>
                    {groupMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name || member.email}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Checklist Editor */}
              <div>
                <label className="block text-xs font-bold text-[#776B88] uppercase mb-1">
                  Checklist Items
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={editChecklistInput}
                    onChange={(e) => setEditChecklistInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleEditAddChecklistItem(e)
                      }
                    }}
                    placeholder="Add step or checklist item..."
                    className="flex-1 px-3 py-1.5 rounded-xl border border-[#E8E0F2] bg-[#F8F5FF] text-[#493A63] text-xs focus:outline-none focus:border-[#9B7EDB]"
                  />
                  <button
                    type="button"
                    onClick={handleEditAddChecklistItem}
                    className="px-3 py-1.5 rounded-xl bg-[#F3ECFE] hover:bg-[#E9DFFF] text-[#493A63] font-bold text-xs border border-[#C9B8E8] cursor-pointer"
                  >
                    + Add
                  </button>
                </div>

                {editChecklist.length > 0 && (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto bg-[#F8F5FF] p-2.5 rounded-xl border border-[#E8E0F2]">
                    {editChecklist.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs text-[#493A63]">
                        <label className="flex items-center gap-2 cursor-pointer flex-1">
                          <input
                            type="checkbox"
                            checked={Boolean(item.completed)}
                            onChange={() => toggleEditChecklistItem(idx)}
                            className="rounded text-[#9B7EDB] focus:ring-[#9B7EDB] cursor-pointer"
                          />
                          <span className={item.completed ? 'line-through text-[#9789B0]' : ''}>
                            {item.text}
                          </span>
                        </label>
                        <button
                          type="button"
                          onClick={() => removeEditChecklistItem(idx)}
                          className="text-red-500 hover:text-red-700 font-bold px-1 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[#E8E0F2] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="px-4 py-2 rounded-xl border border-[#E8E0F2] text-xs font-bold text-[#776B88] hover:bg-[#F8F5FF] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingTask || !editTitle.trim()}
                  className="px-5 py-2 rounded-xl bg-[#9B7EDB] hover:bg-[#7A58C1] disabled:opacity-50 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  {updatingTask ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}