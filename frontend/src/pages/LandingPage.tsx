import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Play, Users, LayoutDashboard, Globe2, BookOpen, VolumeX } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen w-full bg-[#fbf5eb] font-sans overflow-x-hidden text-[#333]">
      {/* Floating Header */}
      <header className="fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-6xl bg-[#fbf5eb] rounded-full shadow-lg z-50 px-6 py-3 flex items-center justify-between border-4 border-white/50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-400 rounded-full flex items-center justify-center shadow-inner overflow-hidden border-2 border-white">
            <span className="text-2xl font-bold text-white">F</span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest leading-none">Never Focus Alone</p>
            <h1 className="text-2xl font-black tracking-tight text-[#4a3f35]">Focustown</h1>
          </div>
        </div>
        <Link to="/login" className="px-6 py-2 rounded-full border-2 border-[#d4c3b3] font-bold text-[#4a3f35] hover:bg-[#eae0d5] transition-colors flex items-center gap-2">
          <span>]</span> Sign in
        </Link>
      </header>

      {/* Hero Section */}
      <section className="relative w-full h-[85vh] bg-[url('/assets/hero-bg.png')] bg-cover bg-center pt-24 pb-8 px-8 flex flex-col justify-end">
        {/* Top Gradient Overlay for readability if needed */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
        
        <div className="relative z-10 max-w-7xl mx-auto w-full flex justify-between items-end h-full pb-10">
          
          {/* Left Hero Content */}
          <div className="flex flex-col items-start gap-6 max-w-lg pb-10">
            <h1 className="text-7xl font-black text-white leading-[1.1] drop-shadow-xl" style={{ textShadow: '2px 4px 10px rgba(0,0,0,0.5)' }}>
              Never Focus Alone
            </h1>
            <p className="text-xl font-bold text-white drop-shadow-md">
              Join live rooms with students focusing around the world.
            </p>
            <Link to="/login" className="px-8 py-4 bg-[#7eb6ff] hover:bg-[#6ca4ed] text-white font-bold rounded-full text-lg shadow-lg flex items-center gap-3 transition-transform hover:scale-105 active:scale-95 border-2 border-white/20">
              Join FocusTown &rarr;
            </Link>
          </div>

          {/* Right Activity Feed */}
          <div className="hidden lg:flex flex-col items-end gap-3 w-96 pb-10">
            <div className="flex items-center gap-2 mb-2 text-white font-bold drop-shadow-md bg-black/20 px-4 py-1 rounded-full backdrop-blur-sm">
              <span className="w-2 h-2 bg-pink-400 rounded-full animate-pulse" /> Live around the world
            </div>
            {[
              { cc: 'ES', name: 'Carmen from Spain', action: 'organizing class notes', time: '27m ago', img: '👩🏽' },
              { cc: 'IT', name: 'Giulia from Italy', action: 'reading a research paper', time: '20m ago', img: '👩🏼' },
              { cc: 'AU', name: 'Matilda from Australia', action: 'timing a practice test', time: '13m ago', img: '🐨' },
              { cc: 'GB', name: 'Oliver from United Kingdom', action: 'reviewing lecture slides', time: '6m ago', img: '👦🏻' }
            ].map((user, i) => (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                key={i} 
                className="w-full bg-[#fbf5eb] rounded-full px-4 py-2 flex items-center gap-3 shadow-lg border-2 border-white/50"
              >
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-xl shadow-inner border border-gray-100">{user.img}</div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-[#4a3f35]"><span className="text-[10px] text-gray-400 mr-1">{user.cc}</span>{user.name}</p>
                  <p className="text-[10px] font-semibold text-[#8b7a69]">{user.action} &bull; {user.time}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom Floating Stats & Mute Button */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-6xl flex justify-between items-end z-20">
          {/* Stats Bar */}
          <div className="bg-[#fbf5eb] rounded-[2rem] px-8 py-4 flex items-center gap-12 shadow-xl border-4 border-white/50 w-auto">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-400 text-white rounded-2xl flex items-center justify-center shadow-inner">
                <Users className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#8b7a69] uppercase tracking-widest leading-none">live users now</p>
                <p className="text-3xl font-black text-[#4a3f35]">6,236</p>
              </div>
            </div>
            <div className="w-px h-12 bg-gray-200" />
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 text-green-500 rounded-2xl flex items-center justify-center">
                <LayoutDashboard className="w-8 h-8" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#8b7a69] uppercase tracking-widest leading-none">rooms</p>
                <p className="text-3xl font-black text-[#4a3f35]">1,198</p>
              </div>
            </div>
            <div className="w-px h-12 bg-gray-200" />
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 text-blue-400 rounded-2xl flex items-center justify-center">
                <Globe2 className="w-8 h-8" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#8b7a69] uppercase tracking-widest leading-none">countries</p>
                <p className="text-3xl font-black text-[#4a3f35]">134</p>
              </div>
            </div>
          </div>
          
          <button className="bg-[#fbf5eb] w-14 h-14 rounded-full flex items-center justify-center shadow-lg border-2 border-white/50 text-[#8b7a69] hover:bg-[#eae0d5] transition-colors">
            <VolumeX className="w-6 h-6" />
          </button>
        </div>
      </section>

      {/* Marquee Section */}
      <section className="py-8 bg-[#fbf5eb] border-y-2 border-white/50 shadow-sm overflow-hidden whitespace-nowrap flex items-center">
        <div className="flex gap-16 items-center animate-[marquee_20s_linear_infinite] opacity-60">
          {['Yale', 'University of Cambridge', 'Penn', 'UCLA', 'University of Chicago', 'Google', 'Meta', 'Seoul National University', 'Stanford', 'Harvard', 'Oxford', 'UTokyo', 'Princeton', 'MIT', 'Berkeley'].map((logo, i) => (
            <span key={i} className="text-xl font-bold text-[#8b7a69]">{logo}</span>
          ))}
        </div>
      </section>

      {/* Popular Live Rooms */}
      <section className="py-16 px-8 max-w-7xl mx-auto text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <BookOpen className="text-blue-400 w-6 h-6" />
          <h2 className="text-2xl font-black text-[#4a3f35]">Popular live rooms</h2>
        </div>
        <p className="text-sm font-bold text-[#8b7a69] mb-10">Find the a room and focus together</p>

        <div className="flex justify-center gap-6 overflow-x-auto pb-8 snap-x">
          {/* Room Card 1 */}
          <div className="bg-[#fbf5eb] rounded-3xl w-80 shrink-0 shadow-lg border-4 border-white/50 overflow-hidden text-left snap-center">
            <div className="h-40 bg-[#e6ded5] relative m-2 rounded-2xl flex items-center justify-center">
              <span className="absolute top-3 left-3 bg-red-400 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> LIVE
              </span>
              <span className="text-6xl">🏛️</span>
            </div>
            <div className="p-4">
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-black text-lg text-[#4a3f35]">National Library</h3>
              </div>
              <p className="text-xs font-bold text-[#8b7a69] mb-4">98 rooms</p>
              <div className="flex justify-between items-center bg-[#f0e8dd] px-3 py-2 rounded-xl">
                 <div className="flex -space-x-2">
                    {['👩🏽','👱🏼‍♂️','👦🏻'].map((e,i)=><div key={i} className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-[10px] border border-gray-200">{e}</div>)}
                 </div>
                 <span className="text-xs font-bold text-[#4a3f35]">416</span>
              </div>
            </div>
          </div>

          {/* Room Card 2 */}
          <div className="bg-[#fbf5eb] rounded-3xl w-80 shrink-0 shadow-lg border-4 border-white/50 overflow-hidden text-left snap-center">
            <div className="h-40 bg-[#d8e8f2] relative m-2 rounded-2xl flex items-center justify-center">
              <span className="absolute top-3 left-3 bg-red-400 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> LIVE
              </span>
              <span className="text-6xl">✈️</span>
            </div>
            <div className="p-4">
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-black text-lg text-[#4a3f35]">Focus Plane</h3>
              </div>
              <p className="text-xs font-bold text-[#8b7a69] mb-4">52 rooms</p>
              <div className="flex justify-between items-center bg-[#f0e8dd] px-3 py-2 rounded-xl">
                 <div className="flex -space-x-2">
                    {['🧑🏾','👱🏼‍♀️','👨🏻'].map((e,i)=><div key={i} className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-[10px] border border-gray-200">{e}</div>)}
                 </div>
                 <span className="text-xs font-bold text-[#4a3f35]">284</span>
              </div>
            </div>
          </div>
          
          {/* Room Card 3 */}
          <div className="bg-[#fbf5eb] rounded-3xl w-80 shrink-0 shadow-lg border-4 border-white/50 overflow-hidden text-left snap-center">
            <div className="h-40 bg-[#e8f2d8] relative m-2 rounded-2xl flex items-center justify-center">
              <span className="absolute top-3 left-3 bg-red-400 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> LIVE
              </span>
              <span className="text-6xl">📚</span>
            </div>
            <div className="p-4">
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-black text-lg text-[#4a3f35]">Boston Library</h3>
              </div>
              <p className="text-xs font-bold text-[#8b7a69] mb-4">120 rooms</p>
              <div className="flex justify-between items-center bg-[#f0e8dd] px-3 py-2 rounded-xl">
                 <div className="flex -space-x-2">
                    {['👨🏽‍🦱','👩🏻‍🦰','👨🏼'].map((e,i)=><div key={i} className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-[10px] border border-gray-200">{e}</div>)}
                 </div>
                 <span className="text-xs font-bold text-[#4a3f35]">1,024</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dreams Section */}
      <section className="py-16 bg-[#f5ecdf] border-t-2 border-white/50 shadow-inner">
        <div className="text-center mb-10">
          <p className="text-[10px] font-bold text-[#7eb6ff] uppercase tracking-widest mb-1">What we study for</p>
          <h2 className="text-2xl font-black text-[#4a3f35] mb-2">The dreams behind the focus.</h2>
          <p className="text-sm font-bold text-[#8b7a69]">Postcards from real FocusTown students about why they show up.</p>
        </div>
        
        <div className="flex gap-6 overflow-x-auto px-8 pb-8 snap-x">
          {[
            { img: '🧑🏽', name: 'Hugo', loc: 'ES', txt: 'My dream is to direct films that feel like Sunday morning mornings. Cinema is my whole heart.' },
            { img: '👱🏼‍♂️', name: 'Alex', loc: 'UK', txt: 'My dream is to design rockets at JAXA. The night sky has been calling me since I was small.' },
            { img: '👩🏻', name: 'Lina', loc: 'US', txt: 'My dream is to study medicine and open a clinic in my hometown. I want to take care of my parents.' },
            { img: '👨🏾', name: 'Noah', loc: 'AU', txt: 'My dream is to build climate tech that actually saves the world. I want my kids to see snow.' },
            { img: '👱🏼‍♀️', name: 'Sam', loc: 'CA', txt: 'My dream is to write the kind of music that makes strangers cry on the train. Just one time would be enough.' }
          ].map((card, i) => (
            <div key={i} className="bg-[#fbf5eb] w-72 shrink-0 rounded-xl p-5 shadow-md border border-white snap-center relative">
               <span className="absolute top-4 right-4 text-[10px] font-bold text-gray-300 uppercase tracking-widest">Postcard</span>
               <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-inner border border-gray-100">{card.img}</div>
                  <div>
                     <p className="text-xs font-black text-[#4a3f35] leading-none">{card.name}</p>
                     <p className="text-[10px] font-bold text-[#8b7a69] uppercase tracking-wider">{card.loc}</p>
                  </div>
               </div>
               <p className="text-sm text-[#5a4f45] font-serif italic leading-relaxed">"{card.txt}"</p>
            </div>
          ))}
        </div>
      </section>

      {/* Global styles for animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
      `}} />
    </div>
  );
};

export default LandingPage;
