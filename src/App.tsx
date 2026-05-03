import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/layout/Sidebar'
import RiskMap from './pages/RiskMap'
import ModelInsights from './pages/ModelInsights'
import FireRegulation from './pages/FireRegulation'
import HeritagRegistry from './pages/HeritagRegistry'
import SiteAssessment from './pages/SiteAssessment'
import Login from './pages/Login'
import MitigationGuide from './pages/MitigationGuide'

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
        {/* All other routes use the main layout (sidebar + content) */}
        <Route path="/*" element={<MainLayout />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App