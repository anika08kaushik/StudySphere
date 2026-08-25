export default function Input({ label, error, icon, className = '', ...props }) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-xs font-bold text-[#776B88] uppercase mb-1">{label}</label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#776B88]">
            {icon}
          </span>
        )}
        <input
          className={`w-full px-3.5 py-2 text-xs font-semibold rounded-xl border focus:outline-none focus:border-[#9B7EDB] ${
            icon ? 'pl-10' : ''
          } ${error ? 'border-rose-400' : 'border-[#E8E0F2]'} bg-[#F8F5FF] text-[#493A63] placeholder-[#776B88]`}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-rose-500 font-semibold">{error}</p>}
    </div>
  )
}

