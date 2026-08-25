import { activities } from '../../../mock/activities'

export default function Activity() {
  return (
    <div className="card-soft p-6 bg-white border-[#E8E0F2]">
      <h2 className="text-xs font-bold uppercase tracking-wider text-[#776B88] mb-4">Activity Stream</h2>
      <div className="space-y-4">
        {activities.map((a) => (
          <div key={a._id} className="flex items-start gap-3.5 p-3 rounded-2xl bg-[#F8F5FF] border border-[#E8E0F2]">
            <div className="w-8 h-8 rounded-xl bg-white border border-[#E8E0F2] flex items-center justify-center text-sm shrink-0 shadow-xs">
              ✨
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-[#493A63]">
                <span>{a.user}</span> {a.action}
                {a.target && <span className="text-[#776B88]"> — {a.target}</span>}
              </p>
              <p className="text-[10px] text-[#776B88] mt-0.5">
                {new Date(a.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

