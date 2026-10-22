import { useState, useEffect } from 'react'
import { activities as initialActivities } from '../../../mock/activities'
import activityService from '../../../services/activityService'

export default function Activity({ groupId }) {
  const [activityList, setActivityList] = useState(initialActivities)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await activityService.getActivities(groupId)
        const data = response.data?.data
        if (Array.isArray(data) && data.length > 0) {
          setActivityList(data)
        }
      } catch (err) {
        console.warn('Using local activity feed:', err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()
  }, [groupId])

  const getActionIcon = (type) => {
    switch (type) {
      case 'upload':
        return '📁'
      case 'complete':
        return '✅'
      case 'edit':
      case 'note':
        return '📝'
      case 'focus':
        return '⏱️'
      case 'join':
        return '👋'
      case 'task':
        return '📌'
      default:
        return '✨'
    }
  }

  return (
    <div className="card-soft p-6 bg-white border-[#E8E0F2]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#776B88]">Study Group Activity Stream</h2>
          <p className="text-[11px] text-[#776B88]">Live feed of group actions, assignments, and study updates</p>
        </div>
        <span className="text-[10px] font-bold text-[#493A63] bg-[#E9DFFF] px-2.5 py-1 rounded-full border border-[#C9B8E8]">
          {activityList.length} Events
        </span>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="p-6 text-center text-xs font-semibold text-[#776B88]">Loading activity stream...</div>
        ) : (
          activityList.map((a) => (
            <div
              key={a._id}
              className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-[#F8F5FF] border border-[#E8E0F2] hover:border-[#C9B8E8] transition-all"
            >
              <div className="w-8 h-8 rounded-xl bg-white border border-[#E8E0F2] flex items-center justify-center text-sm shrink-0 shadow-xs">
                {getActionIcon(a.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-[#493A63]">
                  <span className="text-[#9B7EDB]">{a.userName || a.user}</span> {a.action}
                  {a.target && <span className="text-[#776B88] font-normal"> — {a.target}</span>}
                </p>
                <p className="text-[10px] text-[#776B88] mt-0.5">
                  {new Date(a.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
