import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/layout/Sidebar'
import RiskMap from './pages/RiskMap'
import ModelInsights from './pages/ModelInsights'
import FireRegulation from './pages/FireRegulation'
import HeritagRegistry from './pages/HeritagRegistry'
import SiteAssessment from './pages/SiteAssessment'

const App = () => {
  return (
    <BrowserRouter
    
    >
      <div className="flex h-screen bg-[#F5F0E8]">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<RiskMap />} />
            <Route path="/insights" element={<ModelInsights />} />
            <Route path="/regulation" element={<FireRegulation />} />
            <Route path="/registry" element={<HeritagRegistry />} />
            <Route path="/assessment" element={<SiteAssessment />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App