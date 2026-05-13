import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/layout/Sidebar'
import ProtectedRoute from './components/ProtectedRoute'
import RiskMap from './pages/RiskMap'
import ModelInsights from './pages/ModelInsights'
import FireRegulation from './pages/FireRegulation'
import HeritagRegistry from './pages/HeritagRegistry'
import SiteAssessment from './pages/SiteAssessment'
import Login from './pages/Login'
import MitigationGuide from './pages/MitigationGuide'
import LocalContacts from './pages/LocalContacts'

const MainLayout = () => {
  return (
    <div className="flex h-screen bg-[#F5F0E8]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<RiskMap />} />
          <Route path="/insights" element={<ModelInsights />} />
          <Route path="/regulation" element={<FireRegulation />} />
          <Route path="/mitigation-guide" element={<MitigationGuide />} />
          <Route path="/registry" element={<HeritagRegistry />} />
          <Route path="/assessment" element={<SiteAssessment />} />
          <Route path="/contacts" element={<LocalContacts />} />
        </Routes>
      </main>
    </div>
  )
}

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login page rendered without sidebar layout */}
        <Route path="/login" element={<Login />} />
        {/* All other routes require an authenticated session and share
            the main layout (sidebar + content). Unauthenticated visits
            are redirected to /login by ProtectedRoute. */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App