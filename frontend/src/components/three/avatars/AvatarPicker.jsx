import { useState } from 'react'
import { useApp } from '../../../context/AppContext'

const PRESETS = [
  { id: 'maya', name: 'Maya', hairColor: '#493A63', skinTone: '#F3C5A5', outfitColor: '#9B7EDB', accessory: 'headphones' },
  { id: 'alex', name: 'Alex', hairColor: '#E58C6B', skinTone: '#FBE4D8', outfitColor: '#8FBA99', accessory: 'glasses' },
  { id: 'sam', name: 'Sam', hairColor: '#2C1810', skinTone: '#8D5B4C', outfitColor: '#F4C9B4', accessory: 'beanie' },
  { id: 'noah', name: 'Noah', hairColor: '#F6D98B', skinTone: '#FBE4D8', outfitColor: '#7A58C1', accessory: 'none' },
]

const HAIR_COLORS = [
  { label: 'Dark Plum', value: '#493A63' },
  { label: 'Blonde', value: '#F6D98B' },
  { label: 'Lavender', value: '#9B7EDB' },
  { label: 'Ginger', value: '#E58C6B' },
  { label: 'Dark Espresso', value: '#2C1810' },
  { label: 'Pastel Pink', value: '#F5C2C7' },
]

const SKIN_TONES = [
  { label: 'Warm Peach', value: '#F3C5A5' },
  { label: 'Fair Porcelain', value: '#FBE4D8' },
  { label: 'Golden Tan', value: '#D49A6A' },
  { label: 'Deep Espresso', value: '#8D5B4C' },
]

const OUTFIT_COLORS = [
  { label: 'Lavender Soft', value: '#9B7EDB' },
  { label: 'Sage Green', value: '#8FBA99' },
  { label: 'Peach Sunrise', value: '#F4C9B4' },
  { label: 'Plum Classic', value: '#493A63' },
  { label: 'Butter Cream', value: '#F6D98B' },
]

const ACCESSORIES = [
  { id: 'none', label: 'None', icon: '❌' },
  { id: 'headphones', label: 'Headphones', icon: '🎧' },
  { id: 'glasses', label: 'Glasses', icon: '👓' },
  { id: 'beanie', label: 'Beanie', icon: '🧢' },
]

export default function AvatarPicker({ onSave, onClose }) {
  const { avatarConfig, updateAvatar } = useApp()
  const [config, setConfig] = useState(avatarConfig)

  const handleSelectPreset = (preset) => {
    const updated = {
      ...config,
      preset: preset.id,
      name: preset.name,
      hairColor: preset.hairColor,
      skinTone: preset.skinTone,
      outfitColor: preset.outfitColor,
      accessory: preset.accessory,
    }
    setConfig(updated)
  }

  const handleSave = () => {
    updateAvatar(config)
    if (onSave) onSave(config)
    if (onClose) onClose()
  }

  return (
    <div className="card-soft p-6 bg-white border-[#E8E0F2] max-w-xl mx-auto shadow-xl">
      <div className="flex items-center justify-between pb-4 border-b border-[#E8E0F2]">
        <div className="flex items-center gap-2">
          <span className="text-xl">🧑🎓</span>
          <h2 className="text-lg font-bold text-[#493A63]">Choose Your Study Avatar</h2>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-[#776B88] hover:text-[#493A63] font-bold">
            ✕
          </button>
        )}
      </div>

      {/* Preset Characters */}
      <div className="py-4 border-b border-[#E8E0F2]">
        <p className="text-xs font-bold text-[#776B88] uppercase tracking-wider mb-3">CHARACTER PRESETS</p>
        <div className="grid grid-cols-4 gap-3">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => handleSelectPreset(p)}
              className={`p-3 rounded-2xl flex flex-col items-center gap-2 transition-all border ${
                config.preset === p.id
                  ? 'bg-[#E9DFFF] border-[#9B7EDB] shadow-sm scale-105'
                  : 'bg-[#F8F5FF] border-transparent hover:border-[#C9B8E8]'
              }`}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-xs"
                style={{ backgroundColor: p.outfitColor }}
              >
                <span className="text-white font-bold">{p.name[0]}</span>
              </div>
              <span className="text-xs font-bold text-[#493A63]">{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Customization Options */}
      <div className="py-4 space-y-4 border-b border-[#E8E0F2]">
        {/* Name Input */}
        <div>
          <label className="block text-xs font-bold text-[#776B88] uppercase tracking-wider mb-1">
            Avatar Name
          </label>
          <input
            type="text"
            value={config.name}
            onChange={(e) => setConfig({ ...config, name: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-[#E8E0F2] bg-[#F8F5FF] text-[#493A63] font-semibold text-sm focus:outline-none focus:border-[#9B7EDB]"
            placeholder="Enter your student name"
          />
        </div>

        {/* Hair Colors */}
        <div>
          <label className="block text-xs font-bold text-[#776B88] uppercase tracking-wider mb-2">
            Hair Color
          </label>
          <div className="flex flex-wrap gap-2">
            {HAIR_COLORS.map((h) => (
              <button
                key={h.value}
                onClick={() => setConfig({ ...config, hairColor: h.value })}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                  config.hairColor === h.value
                    ? 'border-[#9B7EDB] bg-[#E9DFFF] text-[#493A63]'
                    : 'border-[#E8E0F2] bg-white text-[#776B88]'
                }`}
              >
                <span className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ backgroundColor: h.value }} />
                {h.label}
              </button>
            ))}
          </div>
        </div>

        {/* Skin Tone */}
        <div>
          <label className="block text-xs font-bold text-[#776B88] uppercase tracking-wider mb-2">
            Skin Tone
          </label>
          <div className="flex flex-wrap gap-2">
            {SKIN_TONES.map((s) => (
              <button
                key={s.value}
                onClick={() => setConfig({ ...config, skinTone: s.value })}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                  config.skinTone === s.value
                    ? 'border-[#9B7EDB] bg-[#E9DFFF] text-[#493A63]'
                    : 'border-[#E8E0F2] bg-white text-[#776B88]'
                }`}
              >
                <span className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ backgroundColor: s.value }} />
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Outfit Color */}
        <div>
          <label className="block text-xs font-bold text-[#776B88] uppercase tracking-wider mb-2">
            Outfit Style & Color
          </label>
          <div className="flex flex-wrap gap-2">
            {OUTFIT_COLORS.map((o) => (
              <button
                key={o.value}
                onClick={() => setConfig({ ...config, outfitColor: o.value })}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                  config.outfitColor === o.value
                    ? 'border-[#9B7EDB] bg-[#E9DFFF] text-[#493A63]'
                    : 'border-[#E8E0F2] bg-white text-[#776B88]'
                }`}
              >
                <span className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ backgroundColor: o.value }} />
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* Accessories */}
        <div>
          <label className="block text-xs font-bold text-[#776B88] uppercase tracking-wider mb-2">
            Accessory
          </label>
          <div className="grid grid-cols-4 gap-2">
            {ACCESSORIES.map((a) => (
              <button
                key={a.id}
                onClick={() => setConfig({ ...config, accessory: a.id })}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  config.accessory === a.id
                    ? 'border-[#9B7EDB] bg-[#E9DFFF] text-[#493A63]'
                    : 'border-[#E8E0F2] bg-white text-[#776B88]'
                }`}
              >
                <span>{a.icon}</span>
                <span>{a.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-4 flex items-center justify-end gap-3">
        <button
          onClick={handleSave}
          className="w-full py-3 rounded-xl bg-[#9B7EDB] hover:bg-[#7A58C1] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
        >
          <span>✨</span>
          <span>Save Avatar & Enter Library</span>
        </button>
      </div>
    </div>
  )
}
