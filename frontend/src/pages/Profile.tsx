import { useEffect, useState } from 'react';
import axios from 'axios';
import Avatar from '../components/Avatar';

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [department, setDepartment] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'neutral'>('neutral');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const { data } = await axios.get('http://localhost:5000/api/users/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(data);
        setName(data.name);
        setBio(data.profile?.bio || '');
        setDepartment(data.profile?.department || '');
        setGender(data.profile?.gender || 'neutral');
      } catch (err) {
        console.error(err);
      }
    };
    fetchProfile();
  }, []);

  const handleUpdate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.put(
        'http://localhost:5000/api/users/profile',
        { name, profile: { bio, department, gender } },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUser(data);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenderToggle = async () => {
    const nextGender = gender === 'neutral' ? 'male' : gender === 'male' ? 'female' : 'neutral';
    setGender(nextGender);
    
    // Auto-save when toggling gender to make it feel instantly responsive
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        'http://localhost:5000/api/users/profile',
        { profile: { gender: nextGender } },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error("Failed to update gender", err);
    }
  };

  if (!user) return <div className="text-center mt-10">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#e0e5ec] text-gray-700 p-8 relative font-sans">
      <Avatar gender={gender} onEdit={handleGenderToggle} />
      
      <div className="max-w-2xl mx-auto mt-24">
        <div className="neu-flat rounded-[3rem] p-10">
          <div className="flex justify-between items-center mb-10 border-b border-gray-300 pb-4">
            <h2 className="text-3xl font-bold tracking-wider text-gray-500 uppercase">My Profile</h2>
            <button 
              onClick={() => setIsEditing(!isEditing)} 
              className="neu-flat px-6 py-2 rounded-full font-semibold text-gray-600 active:neu-pressed transition-all"
            >
              {isEditing ? 'Cancel' : 'Edit Details'}
            </button>
          </div>

          {!isEditing ? (
            <div className="space-y-6 text-lg px-4">
              <div className="flex items-center">
                <span className="font-semibold w-40 text-gray-500 uppercase tracking-widest text-sm">Name</span> 
                <span className="neu-pressed px-4 py-2 rounded-xl flex-1 text-gray-600">{user.name}</span>
              </div>
              <div className="flex items-center">
                <span className="font-semibold w-40 text-gray-500 uppercase tracking-widest text-sm">Email</span> 
                <span className="neu-pressed px-4 py-2 rounded-xl flex-1 text-gray-600">{user.email}</span>
              </div>
              <div className="flex items-center">
                <span className="font-semibold w-40 text-gray-500 uppercase tracking-widest text-sm">Department</span> 
                <span className="neu-pressed px-4 py-2 rounded-xl flex-1 text-gray-600">{user.profile?.department || 'Not set'}</span>
              </div>
              <div className="flex items-start">
                <span className="font-semibold w-40 text-gray-500 uppercase tracking-widest text-sm mt-3">Bio</span> 
                <span className="neu-pressed px-4 py-3 rounded-xl flex-1 min-h-[100px] text-gray-600">{user.profile?.bio || 'No bio written yet.'}</span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUpdate} className="flex flex-col gap-6 px-4">
              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-500 uppercase tracking-widest">Name</label>
                <input
                  type="text"
                  className="w-full neu-pressed px-4 py-3 rounded-xl focus:outline-none text-gray-600 bg-transparent"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-500 uppercase tracking-widest">Department</label>
                <input
                  type="text"
                  className="w-full neu-pressed px-4 py-3 rounded-xl focus:outline-none text-gray-600 bg-transparent"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-500 uppercase tracking-widest">Bio</label>
                <textarea
                  className="w-full neu-pressed px-4 py-3 rounded-xl focus:outline-none text-gray-600 bg-transparent"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                ></textarea>
              </div>
              <div className="flex justify-end mt-4">
                <button type="submit" className="neu-convex px-8 py-3 rounded-full font-bold text-blue-500 active:neu-pressed transition-all">
                  Save Changes
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
