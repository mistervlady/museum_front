import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import WelcomePage from './pages/WelcomePage'
import ExcursionTypePage from './pages/ExcursionTypePage'
import ReadyExcursionPage from './pages/ReadyExcursionPage'
import PersonalExcursionPage from './pages/PersonalExcursionPage'
import InfinityExcursionPage from './pages/InfinityExcursionPage'
import AdminPage from './pages/AdminPage'
import NotFoundPage from './pages/NotFoundPage'
import StaffLoginPage from './pages/StaffLoginPage'
import StaffDashboardPage from './pages/StaffDashboardPage'
import ProtectedRoute from './auth/ProtectedRoute'

export default function App() {
  return (
    <BrowserRouter>
      <AnimatePresence mode="wait">
        <Routes>
          {/* Public */}
          <Route path="/" element={<WelcomePage />} />
          <Route path="/excursion-type" element={<ExcursionTypePage />} />
          <Route path="/excursion/ready" element={<ReadyExcursionPage />} />
          <Route path="/excursion/personal" element={<PersonalExcursionPage />} />
          <Route path="/excursion/infinity" element={<InfinityExcursionPage />} />

          {/* Admin */}
          <Route path="/admin" element={<AdminPage />} />

          {/* Staff */}
          <Route path="/staff/login" element={<StaffLoginPage />} />
          <Route
            path="/staff"
            element={
              <ProtectedRoute>
                <StaffDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Fallbacks */}
          <Route path="/excursion" element={<Navigate to="/excursion-type" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AnimatePresence>
    </BrowserRouter>
  )
}
