import { AnimatePresence } from 'framer-motion'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'

import Layout from './components/Layout'
import RouteTransition from './components/RouteTransition'
import Dashboard from './pages/Dashboard'
import Digital from './pages/Digital'
import Environment from './pages/Environment'
import Mood from './pages/Mood'
import Physical from './pages/Physical'
import Productivity from './pages/Productivity'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import NotFound from './pages/NotFound'

export default function App() {
  const location = useLocation()

  return (
    <Layout>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<RouteTransition><Dashboard /></RouteTransition>} />
          <Route path="/physical" element={<RouteTransition><Physical /></RouteTransition>} />
          <Route path="/digital" element={<RouteTransition><Digital /></RouteTransition>} />
          <Route path="/productivity" element={<RouteTransition><Productivity /></RouteTransition>} />
          <Route path="/environment" element={<RouteTransition><Environment /></RouteTransition>} />
          <Route path="/mood" element={<RouteTransition><Mood /></RouteTransition>} />
          <Route path="/profile" element={<RouteTransition><Profile /></RouteTransition>} />
          <Route path="/settings" element={<RouteTransition><Settings /></RouteTransition>} />

          {/* Helpful aliases */}
          <Route path="/home" element={<Navigate to="/" replace />} />

          <Route path="*" element={<RouteTransition><NotFound /></RouteTransition>} />
        </Routes>
      </AnimatePresence>
    </Layout>
  )
}
