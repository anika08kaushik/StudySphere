import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Users, Video, MessageCircle, FileText, BookOpen } from 'lucide-react';

const Dashboard = () => {
  return (
    <div className="py-8 text-gray-600 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-500 tracking-widest uppercase mb-2">My Dashboard</h1>
        <p className="text-blue-500 font-medium">Welcome back, Student! Here is your daily control center.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Study Today */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="neu-flat p-6 rounded-3xl"
        >
          <div className="flex items-center gap-4 mb-4 text-blue-500">
            <Clock className="w-8 h-8" />
            <h2 className="text-lg font-bold uppercase tracking-wide">Study Today</h2>
          </div>
          <div className="space-y-4">
            <div className="neu-pressed p-4 rounded-xl flex justify-between items-center">
              <span className="font-medium text-sm">Focus Hours</span>
              <span className="font-bold text-blue-500 text-xl">4h 30m</span>
            </div>
            <div className="neu-pressed p-4 rounded-xl flex justify-between items-center">
              <span className="font-medium text-sm">Sessions Completed</span>
              <span className="font-bold text-blue-500 text-xl">5</span>
            </div>
          </div>
        </motion.div>

        {/* Active Focus Room */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="neu-flat p-6 rounded-3xl"
        >
          <div className="flex items-center gap-4 mb-4 text-purple-500">
            <Users className="w-8 h-8" />
            <h2 className="text-lg font-bold uppercase tracking-wide">Focus Room</h2>
          </div>
          <div className="neu-pressed p-4 rounded-xl mb-4 text-center">
            <div className="w-3 h-3 bg-green-400 rounded-full inline-block mr-2 animate-pulse" />
            <span className="font-bold text-sm">Machine Learning Room Active</span>
          </div>
          <div className="flex justify-center -space-x-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-10 h-10 rounded-full neu-convex border-2 border-[#e0e5ec] flex items-center justify-center">
                <Users className="w-5 h-5 text-gray-400" />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Upcoming Group Sessions */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="neu-flat p-6 rounded-3xl"
        >
          <div className="flex items-center gap-4 mb-4 text-red-500">
            <Video className="w-8 h-8" />
            <h2 className="text-lg font-bold uppercase tracking-wide">Upcoming Sessions</h2>
          </div>
          <div className="space-y-3">
            <div className="neu-pressed p-3 rounded-xl flex justify-between items-center group cursor-pointer hover:neu-convex transition-all">
              <div>
                <h3 className="font-bold text-sm group-hover:text-blue-500 transition-colors">Machine Learning Review</h3>
                <p className="text-xs text-gray-500 font-medium mt-1">Today, 8:00 PM</p>
              </div>
              <button className="text-xs font-bold text-blue-500 bg-[#e0e5ec] px-3 py-1 rounded-full shadow-[2px_2px_5px_rgba(163,177,198,0.5),-2px_-2px_5px_rgba(255,255,255,0.8)] active:shadow-[inset_2px_2px_5px_rgba(163,177,198,0.5),inset_-2px_-2px_5px_rgba(255,255,255,0.8)] transition-all">
                Join
              </button>
            </div>
            <div className="neu-pressed p-3 rounded-xl flex justify-between items-center group cursor-pointer hover:neu-convex transition-all">
              <div>
                <h3 className="font-bold text-sm group-hover:text-orange-500 transition-colors">JavaScript Q&A</h3>
                <p className="text-xs text-gray-500 font-medium mt-1">Tomorrow, 10:00 AM</p>
              </div>
              <button className="text-xs font-bold text-orange-500 bg-[#e0e5ec] px-3 py-1 rounded-full shadow-[2px_2px_5px_rgba(163,177,198,0.5),-2px_-2px_5px_rgba(255,255,255,0.8)] active:shadow-[inset_2px_2px_5px_rgba(163,177,198,0.5),inset_-2px_-2px_5px_rgba(255,255,255,0.8)] transition-all">
                RSVP
              </button>
            </div>
          </div>
        </motion.div>

        {/* Recent Discussions */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="neu-flat p-6 rounded-3xl"
        >
          <div className="flex items-center gap-4 mb-4 text-green-500">
            <MessageCircle className="w-8 h-8" />
            <h2 className="text-lg font-bold uppercase tracking-wide">Discussions</h2>
          </div>
          <div className="space-y-3">
            <div className="neu-pressed p-3 rounded-xl hover:neu-convex cursor-pointer transition-all">
              <p className="text-xs font-bold text-blue-500 mb-1">Study Group Alpha</p>
              <p className="text-sm font-medium line-clamp-1"><span className="font-bold text-gray-600">Alex:</span> Can someone explain closure?</p>
            </div>
            <div className="neu-pressed p-3 rounded-xl hover:neu-convex cursor-pointer transition-all">
              <p className="text-xs font-bold text-green-500 mb-1">ML Beginners</p>
              <p className="text-sm font-medium line-clamp-1"><span className="font-bold text-gray-600">Sarah:</span> I've uploaded the notes for SVM!</p>
            </div>
            <div className="neu-pressed p-3 rounded-xl hover:neu-convex cursor-pointer transition-all">
              <p className="text-xs font-bold text-purple-500 mb-1">General Chat</p>
              <p className="text-sm font-medium line-clamp-1"><span className="font-bold text-gray-600">Mike:</span> Let's do a Pomodoro session at 5.</p>
            </div>
          </div>
        </motion.div>

        {/* Recent Resources & Notes */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="neu-flat p-6 rounded-3xl lg:col-span-2"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4 text-orange-500">
                <FileText className="w-6 h-6" />
                <h2 className="text-md font-bold uppercase tracking-wide">Recent Resources</h2>
              </div>
              <ul className="space-y-2">
                {['Lecture_5_Slides.pdf', 'Dataset_Project.zip', 'Study_Guide.docx'].map((res, i) => (
                  <li key={i} className="neu-pressed p-3 rounded-xl flex items-center justify-between group cursor-pointer hover:neu-convex transition-all">
                    <span className="text-sm font-medium truncate">{res}</span>
                    <span className="text-xs text-gray-400 group-hover:text-blue-500 font-bold">Open</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-4 text-teal-500">
                <BookOpen className="w-6 h-6" />
                <h2 className="text-md font-bold uppercase tracking-wide">Recent Notes</h2>
              </div>
              <ul className="space-y-2">
                {['Machine Learning Intro', 'Backpropagation Formulas', 'Group Project Ideas'].map((note, i) => (
                  <li key={i} className="neu-pressed p-3 rounded-xl flex items-center justify-between group cursor-pointer hover:neu-convex transition-all">
                    <span className="text-sm font-medium truncate">{note}</span>
                    <span className="text-xs text-gray-400 group-hover:text-blue-500 font-bold">Edit</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Lecture Schedule / Syllabus */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-8 neu-flat p-6 rounded-3xl"
      >
        <div className="flex items-center gap-4 mb-6 text-gray-500">
          <BookOpen className="w-8 h-8" />
          <h2 className="text-xl font-bold uppercase tracking-widest">JavaScript Lecture Schedule</h2>
        </div>
        <div className="overflow-x-auto neu-pressed rounded-2xl p-2">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-blue-500 uppercase tracking-wider text-xs border-b border-gray-300">
                <th className="pb-3 px-4 pt-2 font-bold">Lecture Number</th>
                <th className="pb-3 px-4 pt-2 font-bold">Topics</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200/50">
              <tr className="hover:bg-gray-100/30 transition-colors">
                <td className="py-3 px-4 font-bold">1-2</td>
                <td className="py-3 px-4 font-medium">Introduction to JavaScript, Role of JavaScript in Web Development, Variables (var, let, const), Data Types</td>
              </tr>
              <tr className="hover:bg-gray-100/30 transition-colors">
                <td className="py-3 px-4 font-bold">3-4</td>
                <td className="py-3 px-4 font-medium">Type Conversion, Operators (Arithmetic, Assignment, Comparison, Logical), Conditional Statements</td>
              </tr>
              <tr className="hover:bg-gray-100/30 transition-colors">
                <td className="py-3 px-4 font-bold">5-6</td>
                <td className="py-3 px-4 font-medium">Loops (for, while, do-while, for...of, for...in), Practical Programming Exercises</td>
              </tr>
              <tr className="hover:bg-gray-100/30 transition-colors">
                <td className="py-3 px-4 font-bold">7-8</td>
                <td className="py-3 px-4 font-medium">Functions, Function Declaration, Function Expression, Parameters, Arguments, Return Values</td>
              </tr>
              <tr className="hover:bg-gray-100/30 transition-colors">
                <td className="py-3 px-4 font-bold">9-10</td>
                <td className="py-3 px-4 font-medium">Arrow Functions, Scope, Arrays, Creating and Accessing Arrays</td>
              </tr>
              <tr className="hover:bg-gray-100/30 transition-colors">
                <td className="py-3 px-4 font-bold">11-12</td>
                <td className="py-3 px-4 font-medium">Array Methods (push, pop, shift, unshift, splice, slice), Array Iteration</td>
              </tr>
              <tr className="hover:bg-gray-100/30 transition-colors">
                <td className="py-3 px-4 font-bold">13-14</td>
                <td className="py-3 px-4 font-medium">Higher Order Functions (forEach, map, filter, reduce, sort)</td>
              </tr>
              <tr className="hover:bg-gray-100/30 transition-colors">
                <td className="py-3 px-4 font-bold">15-16</td>
                <td className="py-3 px-4 font-medium">Objects, Properties, Methods, Nested Objects, Object Destructuring, JSON</td>
              </tr>
              <tr className="hover:bg-gray-100/30 transition-colors">
                <td className="py-3 px-4 font-bold">17-18</td>
                <td className="py-3 px-4 font-medium">DOM Introduction, Selecting Elements, querySelector(), querySelectorAll(), getElementById()</td>
              </tr>
              <tr className="hover:bg-gray-100/30 transition-colors">
                <td className="py-3 px-4 font-bold">19-20</td>
                <td className="py-3 px-4 font-medium">DOM Manipulation, Styles, Creating and Removing Elements, DOM Traversal</td>
              </tr>
              <tr className="hover:bg-gray-100/30 transition-colors">
                <td className="py-3 px-4 font-bold">21</td>
                <td className="py-3 px-4 font-medium">Event Handling (Mouse, Keyboard, Form Events), Event Object, preventDefault()</td>
              </tr>
              <tr className="hover:bg-gray-100/30 transition-colors">
                <td className="py-3 px-4 font-bold">22</td>
                <td className="py-3 px-4 font-medium">Forms, Form Validation, User Input Handling, Error Messages</td>
              </tr>
              <tr className="hover:bg-gray-100/30 transition-colors">
                <td className="py-3 px-4 font-bold">23</td>
                <td className="py-3 px-4 font-medium">Local Storage, Session Storage, Browser Data Management</td>
              </tr>
              <tr className="hover:bg-gray-100/30 transition-colors">
                <td className="py-3 px-4 font-bold">24</td>
                <td className="py-3 px-4 font-medium">ES6 Features (Template Literals, Spread, Rest, Destructuring, Default Parameters)</td>
              </tr>
              <tr className="hover:bg-gray-100/30 transition-colors">
                <td className="py-3 px-4 font-bold">25-26</td>
                <td className="py-3 px-4 font-medium">Callbacks, Asynchronous JavaScript, Promises, Promise Chaining, Error Handling</td>
              </tr>
              <tr className="hover:bg-gray-100/30 transition-colors">
                <td className="py-3 px-4 font-bold">27-28</td>
                <td className="py-3 px-4 font-medium">Async/Await, Fetch API, REST API Consumption, JSON Handling</td>
              </tr>
              <tr className="hover:bg-gray-100/30 transition-colors">
                <td className="py-3 px-4 font-bold">29-30</td>
                <td className="py-3 px-4 font-medium">JavaScript Mini Project with API Integration, Local Storage, Form Handling</td>
              </tr>
              <tr className="bg-blue-500/10">
                <td colSpan={2} className="py-4 px-4 font-bold text-center text-blue-600 uppercase tracking-wider rounded-b-xl">
                  Continuous Assessment (Lectures 1–30)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
