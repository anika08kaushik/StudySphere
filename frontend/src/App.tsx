import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Groups from './pages/Groups';
import CreateGroup from './pages/CreateGroup';
import GroupDetail from './pages/GroupDetail';

function Navbar() {
  const location = useLocation();
  const token = localStorage.getItem('token');
  return (
    <nav className="bg-blue-600 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">StudySphere</Link>
        <div className="flex gap-4">
          {!token ? (
            <>
              <Link to="/login" className="hover:underline">Login</Link>
              <Link to="/register" className="hover:underline">Register</Link>
            </>
          ) : (
            <>
              <Link to="/groups" className="hover:underline">Groups</Link>
              <Link to="/profile" className="hover:underline">Profile</Link>
              <button onClick={() => { localStorage.removeItem('token'); window.location.href = '/login'; }} className="hover:underline text-red-200">Logout</button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto p-4">
          <Routes>
            <Route path="/" element={<div className="text-center mt-10"><h1 className="text-3xl font-bold">Welcome to StudySphere</h1><p className="mt-4">Login or register to get started.</p></div>} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/groups" element={<Groups />} />
            <Route path="/create-group" element={<CreateGroup />} />
            <Route path="/group/:groupId" element={<GroupDetail />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
