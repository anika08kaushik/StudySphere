export default function CollaborativeNotes() {
  return (
    <div className="card-soft p-6 bg-white border-[#E8E0F2]">
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E8E0F2]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-[#493A63]">Rahul is live editing notes</span>
          </div>
          <span className="text-[11px] text-[#776B88] font-medium">Auto-saved 2m ago</span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-[#776B88] pb-3 border-b border-[#E8E0F2]">
          {['H1', 'H2', 'B', 'I', 'U', 'List', 'Check', 'Code'].map((btn) => (
            <button
              key={btn}
              className="px-2.5 py-1 rounded-lg bg-[#F8F5FF] hover:bg-[#E9DFFF] border border-[#E8E0F2] font-bold text-[#493A63]"
            >
              {btn}
            </button>
          ))}
        </div>

        <div className="min-h-[280px] p-5 bg-[#F8F5FF] rounded-2xl border border-[#E8E0F2] space-y-3">
          <h2 className="text-lg font-bold text-[#493A63]"># Convolutional Neural Networks</h2>
          <p className="text-xs text-[#776B88] leading-relaxed">
            CNNs are neural networks commonly used for image recognition and computer vision tasks on campus.
          </p>
          <h3 className="text-sm font-bold text-[#493A63]">## Convolution Layer</h3>
          <p className="text-xs text-[#776B88] leading-relaxed">
            The convolution layer applies learnable filters to the input, producing feature maps that capture spatial patterns...
          </p>
        </div>
      </div>
    </div>
  )
}

