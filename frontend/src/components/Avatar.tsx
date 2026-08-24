import React from 'react';
import { motion } from 'framer-motion';

interface AvatarProps {
  gender: 'male' | 'female' | 'neutral';
  onEdit?: () => void;
}

export default function Avatar({ gender, onEdit }: AvatarProps) {
  // Use a 3D-style avatar API (Dicebear Micah style has a nice clay/3D look)
  const getSeed = () => {
    switch (gender) {
      case 'male': return 'Felix';
      case 'female': return 'Mia';
      default: return 'Aneka';
    }
  };

  const avatarUrl = `https://api.dicebear.com/9.x/micah/svg?seed=${getSeed()}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;

  return (
    <div className="absolute top-8 left-8 flex flex-col items-center z-50">
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="w-32 h-32 rounded-full neu-convex p-2 flex items-center justify-center relative overflow-visible"
      >
        <div className="w-full h-full rounded-full overflow-hidden neu-pressed p-1 bg-[#e0e5ec]">
           <img src={avatarUrl} alt="3D Avatar" className="w-full h-full object-cover rounded-full" />
        </div>
      </motion.div>
      
      {onEdit && (
        <button 
          onClick={onEdit}
          className="mt-4 px-4 py-1 text-sm font-semibold text-gray-600 rounded-full neu-flat active:neu-pressed hover:text-blue-500 transition-all"
        >
          Edit Avatar
        </button>
      )}
    </div>
  );
}
