import Avatar from '../../../components/ui/Avatar'
import { users } from '../../../mock/users'
import { tasks } from '../../../mock/tasks'
import { activities } from '../../../mock/activities'

export default function Overview({ group }) {
  const members = users.slice(0, group.memberCount || 5)
  const groupTasks = tasks.filter((t) => t.groupId === group._id)
  const completed = groupTasks.filter((t) => t.status === 'completed').length

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="card-soft p-6 bg-white border-[#E8E0F2]">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#776B88] mb-2">About Group</h2>
          <p className="text-sm font-semibold text-[#493A63]">{group.description}</p>
        </div>

        <div className="card-soft p-6 bg-white border-[#E8E0F2]">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#776B88] mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {activities.filter((a) => a.type !== 'focus').slice(0, 4).map((a) => (
              <div key={a._id} className="flex items-start gap-3 p-3 rounded-xl bg-[#F8F5FF] border border-[#E8E0F2]">
                <span className="text-base">✨</span>
                <div>
                  <p className="text-xs font-bold text-[#493A63]">
                    <span>{a.user}</span> {a.action}
                  </p>
                  <p className="text-[10px] text-[#776B88] mt-0.5">{new Date(a.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="card-soft p-6 bg-white border-[#E8E0F2]">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#776B88] mb-4">
            Members ({members.length})
          </h2>
          <div className="space-y-3">
            {members.map((m) => (
              <div key={m._id} className="flex items-center gap-3">
                <Avatar name={m.name} size="sm" />
                <div>
                  <p className="text-xs font-bold text-[#493A63]">{m.name}</p>
                  <p className="text-[11px] text-[#776B88]">{m.skills.slice(0, 2).join(', ')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card-soft p-6 bg-white border-[#E8E0F2]">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#776B88] mb-3">Group Stats</h2>
          <div className="space-y-2 text-xs font-semibold">
            <div className="flex justify-between py-1 border-b border-[#E8E0F2]">
              <span className="text-[#776B88]">Tasks completed</span>
              <span className="font-bold text-[#493A63]">{completed}/{groupTasks.length || 4}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#E8E0F2]">
              <span className="text-[#776B88]">Focus hours</span>
              <span className="font-bold text-[#493A63]">12h 30m</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#776B88]">Files shared</span>
              <span className="font-bold text-[#493A63]">6 resources</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

