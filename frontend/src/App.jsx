import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import ChatIntegration from './components/Chat.jsx'
import './App.css'
import { AppProvider } from './context/AppContext.jsx'
import ProtectedRoute from './components/layout/ProtectedRoute.jsx'
import AppLayout from './components/layout/AppLayout.jsx'
import LoadingSkeleton from './components/shared/LoadingSkeleton.jsx'

const Home = lazy(() => import('./pages/Home.jsx'))
const Login = lazy(() => import('./pages/Login.jsx'))
const Register = lazy(() => import('./pages/Register.jsx'))
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'))
const Profile = lazy(() => import('./pages/Profile.jsx'))
const Groups = lazy(() => import('./pages/groups/Groups.jsx'))
const GroupWorkspace = lazy(() => import('./pages/groups/GroupWorkspace.jsx'))
const Tasks = lazy(() => import('./pages/tasks/Tasks.jsx'))
const FocusRoom = lazy(() => import('./pages/focus/FocusRoom.jsx'))
const Calendar = lazy(() => import('./pages/calendar/Calendar.jsx'))
const Notifications = lazy(() => import('./pages/notifications/Notifications.jsx'))
const Resources = lazy(() => import('./pages/resources/ResourceLocker.jsx'))
const Chat = lazy(() => import('./pages/chat/GroupChat.jsx'))

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <Suspense fallback={<LoadingSkeleton />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/groups" element={<Groups />} />
                <Route path="/groups/:groupId" element={<GroupWorkspace />} />
                <Route path="/groups/:groupId/:tab" element={<GroupWorkspace />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/focus" element={<FocusRoom />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/resources" element={<Resources />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/chat/:groupId" element={<ChatIntegration />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/profile" element={<Profile />} />
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </AppProvider>
    </AuthProvider>
  )
}

export default App
