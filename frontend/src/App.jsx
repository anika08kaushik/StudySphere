import { Link, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import Chat from './components/Chat.jsx'
import './App.css'

const Home = () => (
  <main>
    <h1>StudySphere</h1>
    <p>Shared foundation is ready.</p>
    <nav>
      <Link to="/login">Login</Link>
      <Link to="/register">Register</Link>
      <Link to="/dashboard">Dashboard</Link>
    </nav>
  </main>
)

const Placeholder = ({ title }) => (
  <main>
    <h1>{title}</h1>
    <Link to="/">Back home</Link>
  </main>
)

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Placeholder title="Login" />} />
        <Route path="/register" element={<Placeholder title="Register" />} />
        <Route path="/dashboard" element={<Placeholder title="StudySphere Dashboard" />} />
        <Route
          path="/chat/:groupId"
          element={<Chat />}
        />
      </Routes>
    </AuthProvider>
  )
}

export default App
