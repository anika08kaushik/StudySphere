import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function CreateGroup() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const navigate = useNavigate();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:5000/api/groups',
        { name, description },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate('/groups');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-8 border rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold mb-6 text-center">CREATE GROUP</h2>
      <form onSubmit={handleCreate} className="flex flex-col gap-4">
        <div>
          <label className="block mb-1 text-sm font-medium">Name</label>
          <input
            type="text"
            className="w-full border px-3 py-2 rounded focus:outline-none focus:border-blue-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g. Machine Learning"
          />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium">Description</label>
          <textarea
            className="w-full border px-3 py-2 rounded focus:outline-none focus:border-blue-500"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={3}
          ></textarea>
        </div>
        <button type="submit" className="bg-green-600 text-white py-2 rounded hover:bg-green-700 transition">
          CREATE
        </button>
      </form>
    </div>
  );
}
