import { useState } from 'react'
import { Link } from 'react-router-dom'
import { groups as initialGroups } from '../../mock/groups'
import { users } from '../../mock/users'

export default function Groups() {
  const [groupList, setGroupList] = useState(initialGroups)
  const [search, setSearch] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)

  // New Group Form State
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupDesc, setNewGroupDesc] = useState('')
  const [newGroupSubject, setNewGroupSubject] = useState('')

  const handleCreateGroup = (e) => {
    e.preventDefault()
    if (!newGroupName.trim()) return

    const newGroup = {
      _id: `group-${Date.now()}`,
      name: newGroupName,
      shortName: newGroupName.slice(0, 3).toUpperCase(),
      description: newGroupDesc || 'A cozy new study group on campus.',
      members: ['user-1'],
      joined: true,
      onlineCount: 1,
      isStudying: false,
      coverGradient: 'from-purple-500 to-indigo-500',
      subjects: newGroupSubject ? [newGroupSubject] : ['General Study'],
    }

    setGroupList([newGroup, ...groupList])
    setNewGroupName('')
    setNewGroupDesc('')
    setNewGroupSubject('')
    setShowCreateModal(false)
  }

  const toggleJoin = (groupId, e) => {
    e.preventDefault()
    e.stopPropagation()
    setGroupList((prev) =>
      prev.map((g) => {
        if (g._id === groupId) {
          const isJoined = g.joined
          return {
            ...g,
            joined: !isJoined,
            onlineCount: isJoined ? Math.max(0, g.onlineCount - 1) : g.onlineCount + 1,
          }
        }
        return g
      })
    )
  }

  const filtered = groupList.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    g.subjects?.some((s) => s.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="card-soft p-6 bg-white border-[#E8E0F2] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">👥</span>
            <h1 className="text-xl font-bold text-[#493A63]">Study Community</h1>
          </div>
          <p className="text-xs text-[#776B88] mt-1">
            {groupList.length} study groups • {groupList.filter((g) => g.isStudying).length} currently studying in room
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-2.5 rounded-xl bg-[#9B7EDB] hover:bg-[#7A58C1] text-white font-bold text-sm shadow-xs transition-all flex items-center gap-2"
        >
          <span>➕</span>
          <span>Create Study Group</span>
        </button>
      </div>

      {/* Search Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search study groups or subjects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-[#E8E0F2] bg-white text-[#493A63] font-semibold text-sm focus:outline-none focus:border-[#9B7EDB] shadow-xs"
          />
        </div>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((group) => {
          const groupMembers = users.filter((u) => group.members?.includes(u._id))
          return (
            <Link key={group._id} to={`/groups/${group._id}`}>
              <div className="card-soft overflow-hidden hover:border-[#9B7EDB] transition-all flex flex-col h-full group bg-white">
                {/* Banner */}
                <div className="h-24 bg-gradient-to-br from-[#E9DFFF] via-[#F3ECFE] to-[#FDF5F1] relative p-4 flex items-center justify-between border-b border-[#E8E0F2]">
                  <div className="w-12 h-12 rounded-2xl bg-white text-[#493A63] font-extrabold text-base flex items-center justify-center shadow-xs border border-[#E8E0F2]">
                    {group.shortName}
                  </div>
                  {group.isStudying && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      Studying Now
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-[#493A63] group-hover:text-[#9B7EDB] transition-colors">
                      {group.name}
                    </h3>
                    <p className="text-xs text-[#776B88] mt-1 line-clamp-2">{group.description}</p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-[#E8E0F2] flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-[#776B88]">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span>{group.onlineCount || groupMembers.length} online</span>
                    </div>

                    <button
                      onClick={(e) => toggleJoin(group._id, e)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        group.joined
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-[#F8F5FF] hover:bg-[#E9DFFF] text-[#493A63] border border-[#E8E0F2]'
                      }`}
                    >
                      {group.joined ? '✓ Joined' : '+ Join'}
                    </button>
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#493A63]/30 backdrop-blur-sm">
          <div className="card-soft p-6 bg-white border-[#E8E0F2] max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E0F2]">
              <h2 className="text-base font-bold text-[#493A63]">Create New Study Group</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-[#776B88] font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="py-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#776B88] uppercase mb-1">
                  Group Name
                </label>
                <input
                  type="text"
                  required
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g. Computer Science 101 Study Sync"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E8E0F2] bg-[#F8F5FF] text-[#493A63] font-semibold text-xs focus:outline-none focus:border-[#9B7EDB]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#776B88] uppercase mb-1">
                  Subject Tag
                </label>
                <input
                  type="text"
                  value={newGroupSubject}
                  onChange={(e) => setNewGroupSubject(e.target.value)}
                  placeholder="e.g. Algorithms, Mathematics, Biology"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E8E0F2] bg-[#F8F5FF] text-[#493A63] font-semibold text-xs focus:outline-none focus:border-[#9B7EDB]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#776B88] uppercase mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  placeholder="Describe your study group's focus and goals..."
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E8E0F2] bg-[#F8F5FF] text-[#493A63] font-semibold text-xs focus:outline-none focus:border-[#9B7EDB]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#E8E0F2] text-xs font-bold text-[#776B88]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#9B7EDB] hover:bg-[#7A58C1] text-white font-bold text-xs shadow-xs"
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

