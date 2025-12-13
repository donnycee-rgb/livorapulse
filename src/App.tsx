import { Navigate, Route, Routes } from 'react-router-dom'

import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Digital from './pages/Digital'
import Environment from './pages/Environment'
import Mood from './pages/Mood'
import Physical from './pages/Physical'
import Productivity from './pages/Productivity'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/physical" element={<Physical />} />
        <Route path="/digital" element={<Digital />} />
        <Route path="/productivity" element={<Productivity />} />
        <Route path="/environment" element={<Environment />} />
        <Route path="/mood" element={<Mood />} />

        {/* Helpful aliases */}
        <Route path="/home" element={<Navigate to="/" replace />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  )
}
