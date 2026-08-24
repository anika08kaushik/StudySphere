import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Avatar from '../components/Avatar';

export default function Groups() {
  const [groups, setGroups] = useState<any[]>([]);
  const [gender, setGender] = useState<'male' | 'female' | 'neutral'>('neutral');

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const token = localStorage.getItem('token');
        const { data } = await axios.get('http://localhost:5000/api/groups', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setGroups(data);
        
        // Also fetch profile for avatar gender
        const profileRes = await axios.get('http://localhost:5000/api/users/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setGender(profileRes.data.profile?.gender || 'neutral');
      } catch (err) {
        console.error(err);
      }
    };
    fetchGroups();
  }, []);

  const handleGenderToggle = async () => {
    const nextGender = gender === 'neutral' ? 'male' : gender === 'male' ? 'female' : 'neutral';
    setGender(nextGender);
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        'http://localhost:5000/api/users/profile',
        { profile: { gender: nextGender } },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#e0e5ec] text-gray-700 p-8 relative font-sans">
      <Avatar gender={gender} onEdit={handleGenderToggle} />

      <div className="max-w-5xl mx-auto mt-24">
        <div className="flex justify-between items-center mb-12">
          <h2 className="text-3xl font-bold tracking-wider text-gray-500 uppercase ml-4">Study Groups</h2>
          <Link to="/create-group" className="neu-convex px-8 py-3 rounded-full font-bold text-blue-500 active:neu-pressed transition-all">
            + Create Group
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {groups.map(group => (
            <Link key={group._id} to={`/group/${group._id}`} className="block">
              <div className="neu-flat p-8 rounded-[2rem] hover:neu-convex transition-all cursor-pointer h-full flex flex-col">
                <h3 className="text-xl font-bold text-gray-600 mb-4">{group.name}</h3>
                <div className="neu-pressed p-4 rounded-xl flex-1">
                  <p className="text-gray-500 text-sm leading-relaxed">{group.description}</p>
                </div>
                <div className="mt-6 flex justify-end">
                  <span className="neu-flat px-4 py-1 rounded-full text-xs font-semibold text-gray-500">View Details</span>
                </div>
              </div>
            </Link>
          ))}
          {groups.length === 0 && (
            <div className="col-span-full neu-pressed p-10 rounded-[2rem] text-center text-gray-500 font-medium">
              No groups found. Create or join one to get started!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
