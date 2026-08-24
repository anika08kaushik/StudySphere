import { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';

export default function GroupDetail() {
  const { groupId } = useParams();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`http://localhost:5000/api/groups/${groupId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchGroup();
  }, [groupId]);

  if (!data) return <div className="min-h-screen bg-[#e0e5ec] text-gray-700 flex items-center justify-center font-sans"><div className="neu-pressed px-8 py-4 rounded-full">Loading...</div></div>;

  return (
    <div className="min-h-screen bg-[#e0e5ec] text-gray-700 p-8 font-sans">
      <div className="max-w-4xl mx-auto mt-12">
        <Link to="/groups" className="neu-flat px-6 py-2 rounded-full text-sm font-semibold text-gray-500 hover:text-blue-500 mb-8 inline-block active:neu-pressed transition-all">
          ← Back to Groups
        </Link>

        <div className="neu-flat p-10 rounded-[3rem]">
          <h2 className="text-4xl font-bold tracking-wider text-gray-600 mb-4">{data.group.name}</h2>
          <div className="neu-pressed p-6 rounded-2xl mb-12">
            <p className="text-gray-500 text-lg leading-relaxed">{data.group.description}</p>
          </div>
          
          <div>
            <h3 className="text-2xl font-bold tracking-wider text-gray-500 uppercase mb-8 ml-4">Members</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {data.members.map((m: any) => (
                <li key={m._id} className="neu-flat p-6 rounded-3xl flex justify-between items-center hover:neu-convex transition-all">
                  <div>
                    <div className="font-bold text-gray-600 text-lg">{m.user.name}</div>
                    <div className="text-sm font-medium text-gray-400 mt-1">{m.user.email}</div>
                  </div>
                  <span className={`text-xs px-4 py-2 rounded-full font-bold uppercase tracking-widest ${m.role === 'leader' ? 'neu-convex text-blue-500' : 'neu-pressed text-gray-400'}`}>
                    {m.role}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
