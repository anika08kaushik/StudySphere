import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../services/api'
import AvatarGroup from '../../components/ui/AvatarGroup'
import Overview from './tabs/Overview'
import CollaborativeNotes from '../notes/CollaborativeNotes'
import ResourceLocker from '../resources/ResourceLocker'
import GroupTasks from '../tasks/GroupTasks'
import GroupChat from '../chat/GroupChat'
import GroupFocusRoom from '../focus/GroupFocusRoom'
import Activity from './tabs/Activity'

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'notes', label: 'Notes' },
  { id: 'resources', label: 'Resources' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'chat', label: 'Chat' },
  { id: 'focus', label: 'Focus' },
  { id: 'activity', label: 'Activity' },
]

const tabComponents = {
  overview: Overview,
  notes: CollaborativeNotes,
  resources: ResourceLocker,
  tasks: GroupTasks,
  chat: GroupChat,
  focus: GroupFocusRoom,
  activity: Activity,
}

export default function GroupWorkspace() {
  const { groupId, tab = 'overview' } = useParams()
  const [group, setGroup] = useState(null)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const res = await api.get(`/groups/${groupId}`)
        setGroup(res.data.data.group)
        setMembers(res.data.data.members || [])
      } catch (error) {
        console.error('Failed to fetch group details', error)
      } finally {
        setLoading(false)
      }
    }
    fetchGroup()
  }, [groupId])

  if (loading) return <div className="text-center p-8 text-[#776B88]">Loading workspace...</div>
  if (!group) return <div className="text-center p-8 text-red-500">Group not found</div>

  const TabContent = tabComponents[tab] || Overview

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      <Link to="/groups" className="text-xs font-bold text-[#9B7EDB] hover:underline mb-2 inline-flex items-center gap-1">
        <span>←</span>
        <span>Back to Study Community</span>
      </Link>

      <div className="card-soft p-6 bg-gradient-to-r from-[#F3ECFE] via-white to-[#FDF5F1] border-[#E8E0F2] relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#E9DFFF] text-[#493A63] text-xs font-bold mb-2 border border-[#C9B8E8]">
              <span>👥</span>
              <span>STUDY HALL WORKSPACE</span>
            </div>
            <h1 className="text-2xl font-extrabold text-[#493A63] tracking-tight">{group.name}</h1>
            <p className="text-xs text-[#776B88] mt-1">{group.description}</p>
            <div className="flex items-center gap-3 mt-3">
              <AvatarGroup users={members} max={4} size="sm" />
              <span className="text-xs font-semibold text-[#776B88]">{members.length} active members</span>
            </div>
          </div>

          <Link
            to="/focus"
            className="px-5 py-2.5 rounded-xl bg-[#9B7EDB] hover:bg-[#7A58C1] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-2"
          >
            <span>📚</span>
            <span>Join 3D Focus Room</span>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#E8E0F2] pt-2">
        <nav className="flex gap-2 -mb-px overflow-x-auto">
          {tabs.map((t) => (
            <Link
              key={t.id}
              to={`/groups/${groupId}/${t.id}`}
              className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition-all ${
                tab === t.id
                  ? 'border-[#9B7EDB] text-[#493A63] bg-[#E9DFFF]/40 rounded-t-xl'
                  : 'border-transparent text-[#776B88] hover:text-[#493A63]'
              }`}
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="pt-2">
        {tab === 'chat' ? <GroupChat groupId={groupId} members={members} /> : <TabContent groupId={groupId} group={group} />}
      </div>
    </div>
  )
}

