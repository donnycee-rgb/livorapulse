import { AnimatePresence } from 'framer-motion'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'

import Layout from './components/Layout'
import RouteTransition from './components/RouteTransition'
import LandingPage from './pages/LandingPage'
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
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={
          <Layout>
            <RouteTransition><Dashboard /></RouteTransition>
          </Layout>
        } />
        <Route path="/physical" element={
          <Layout>
            <RouteTransition><Physical /></RouteTransition>
          </Layout>
        } />
        <Route path="/digital" element={
          <Layout>
            <RouteTransition><Digital /></RouteTransition>
          </Layout>
        } />
        <Route path="/productivity" element={
          <Layout>
            <RouteTransition><Productivity /></RouteTransition>
          </Layout>
        } />
        <Route path="/environment" element={
          <Layout>
            <RouteTransition><Environment /></RouteTransition>
          </Layout>
        } />
        <Route path="/mood" element={
          <Layout>
            <RouteTransition><Mood /></RouteTransition>
          </Layout>
        } />
        <Route path="/profile" element={
          <Layout>
            <RouteTransition><Profile /></RouteTransition>
          </Layout>
        } />
        <Route path="/settings" element={
          <Layout>
            <RouteTransition><Settings /></RouteTransition>
          </Layout>
        } />

        {/* Helpful aliases */}
        <Route path="/home" element={<Navigate to="/" replace />} />

        <Route path="*" element={
          <Layout>
            <RouteTransition><NotFound /></RouteTransition>
          </Layout>
        } />
      </Routes>
    </AnimatePresence>
  )
}
