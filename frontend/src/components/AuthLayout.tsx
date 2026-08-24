import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
}

export default function AuthLayout({ children, title }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-[#e0e5ec] flex items-center justify-center p-4 font-sans">
      {/* Abstract Neumorphic Sphere */}
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute left-[30%] top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
        style={{
          background: 'linear-gradient(145deg, #f0f5fd, #caced4)',
          boxShadow: '20px 20px 60px rgba(163,177,198,0.6), -20px -20px 60px rgba(255,255,255,0.8)'
        }}
      />

      {/* Floating Triangles (Blue theme) */}
      <motion.div
        animate={{ 
          y: [0, -20, 0],
          rotate: [0, 5, -5, 0]
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute right-[25%] top-[30%] w-0 h-0 z-0"
        style={{
          borderLeft: '60px solid transparent',
          borderRight: '60px solid transparent',
          borderBottom: '100px solid rgba(74, 144, 226, 0.6)', // Blue
          transform: 'rotate(25deg)',
          filter: 'drop-shadow(0 0 15px rgba(74,144,226,0.3))'
        }}
      />
      <motion.div
        animate={{ 
          y: [0, 30, 0],
          rotate: [0, -10, 10, 0]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute right-[20%] top-[35%] w-0 h-0 z-0"
        style={{
          borderLeft: '40px solid transparent',
          borderRight: '40px solid transparent',
          borderBottom: '70px solid rgba(135, 206, 250, 0.7)', // Light Sky Blue
          transform: 'rotate(-15deg)',
          filter: 'drop-shadow(0 0 15px rgba(135,206,250,0.4))'
        }}
      />

      {/* Outer Rings / Planets */}
      <div className="absolute -left-[20%] -top-[20%] w-[80vw] h-[80vw] rounded-full border-[2px] border-white/40 shadow-[0_0_50px_rgba(163,177,198,0.2)]" />
      <div className="absolute -right-[10%] -bottom-[30%] w-[70vw] h-[70vw] rounded-full border-[2px] border-white/40 shadow-[0_0_50px_rgba(163,177,198,0.2)]" />

      {/* Neumorphism Card */}
      <motion.div 
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="relative z-10 w-full max-w-md neu-flat p-10 rounded-[3rem] overflow-hidden"
      >
        <div className="relative z-20">
          <Link to="/" className="flex justify-center mb-8">
            <span className="text-3xl font-bold text-gray-500 tracking-widest uppercase">
              StudySphere
            </span>
          </Link>
          <h2 className="text-xl text-blue-500 font-bold mb-8 text-center uppercase tracking-widest">{title}</h2>
          {children}
        </div>
      </motion.div>
    </div>
  );
}
