import { AnimatePresence } from 'framer-motion'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'

import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import RouteTransition from './components/RouteTransition'
import AuthPage from './pages/AuthPage'
import LandingPage from './pages/LandingPage'
import Dashboard from './pages/Dashboard'
import Digital from './pages/Digital'
import Environment from './pages/Environment'
import Mood from './pages/Mood'
import Nutrition from './pages/Nutrition'
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
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<Navigate to="/login" replace />} />
        <Route path="/forgot-password" element={<Navigate to="/login" replace />} />

        {/* Protected in-app routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute><Layout><RouteTransition><Dashboard /></RouteTransition></Layout></ProtectedRoute>
        } />
        <Route path="/physical" element={
          <ProtectedRoute><Layout><RouteTransition><Physical /></RouteTransition></Layout></ProtectedRoute>
        } />
        <Route path="/nutrition" element={
          <ProtectedRoute><Layout><RouteTransition><Nutrition /></RouteTransition></Layout></ProtectedRoute>
        } />
        <Route path="/digital" element={
          <ProtectedRoute><Layout><RouteTransition><Digital /></RouteTransition></Layout></ProtectedRoute>
        } />
        <Route path="/productivity" element={
          <ProtectedRoute><Layout><RouteTransition><Productivity /></RouteTransition></Layout></ProtectedRoute>
        } />
        <Route path="/environment" element={
          <ProtectedRoute><Layout><RouteTransition><Environment /></RouteTransition></Layout></ProtectedRoute>
        } />
        <Route path="/mood" element={
          <ProtectedRoute><Layout><RouteTransition><Mood /></RouteTransition></Layout></ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute><Layout><RouteTransition><Profile /></RouteTransition></Layout></ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute><Layout><RouteTransition><Settings /></RouteTransition></Layout></ProtectedRoute>
        } />

        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="*" element={
          <Layout><RouteTransition><NotFound /></RouteTransition></Layout>
        } />
      </Routes>
    </AnimatePresence>
  )
}