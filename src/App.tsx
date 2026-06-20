import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import OSINTLayout from './components/OSINTLayout'
import CommandCenter from './pages/CommandCenter'
import Study from './pages/Study'
import CheatSheet from './pages/CheatSheet'
import CramMode from './pages/CramMode'
import KnowledgeHub from './pages/KnowledgeHub'
import KnowledgeBase from './pages/KnowledgeBase'
import IntelHub from './pages/IntelHub'
import OSINTArsenal from './pages/OSINTArsenal'
import ScenarioLab from './pages/ScenarioLab'
import OpsLab from './pages/OpsLab'
import Playbooks from './pages/Playbooks'
import Dashboard from './pages/Dashboard'
import HelpCenter from './pages/HelpCenter'
import Privacy from './pages/Privacy'
import Support from './pages/Support'
import Donate from './pages/Donate'
import DonateSuccess from './pages/DonateSuccess'
import DonateCancel from './pages/DonateCancel'
import FeatureRequest from './pages/FeatureRequest'
import MyUpdates from './pages/MyUpdates'

const Exam = lazy(() => import('./pages/Exam'))
const ContentStudio = lazy(() => import('./pages/ContentStudio'))
const AgentTeamPacks = lazy(() => import('./pages/AgentTeamPacks'))
const AgentDiscovery = lazy(() => import('./pages/AgentDiscovery'))

function RouteFallback() {
  return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<OSINTLayout />}>
        <Route index element={<CommandCenter />} />
        <Route path="study" element={<Study />} />
        <Route path="exam" element={<Suspense fallback={<RouteFallback />}><Exam /></Suspense>} />
        <Route path="intel" element={<IntelHub />} />
        <Route path="osint" element={<OSINTArsenal />} />
        <Route path="scenarios" element={<ScenarioLab />} />
        <Route path="ops" element={<OpsLab />} />
        <Route path="packs" element={<Suspense fallback={<RouteFallback />}><AgentTeamPacks /></Suspense>} />
        <Route path="agent" element={<Suspense fallback={<RouteFallback />}><AgentDiscovery /></Suspense>} />
        <Route path="playbooks" element={<Playbooks />} />
        <Route path="knowledge" element={<KnowledgeBase />} />
        <Route path="knowledge/visual" element={<KnowledgeHub />} />
        <Route path="cheatsheet" element={<CheatSheet />} />
        <Route path="cram" element={<CramMode />} />
        <Route path="settings" element={<Dashboard />} />
        <Route path="help" element={<HelpCenter />} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="support" element={<Support />} />
        <Route path="donate" element={<Donate />} />
        <Route path="donate/success" element={<DonateSuccess />} />
        <Route path="donate/cancel" element={<DonateCancel />} />
        <Route path="feature-request" element={<FeatureRequest />} />
        <Route path="my-updates" element={<MyUpdates />} />
        <Route path="studio" element={<Suspense fallback={<RouteFallback />}><ContentStudio /></Suspense>} />
      </Route>
    </Routes>
  )
}

export default App
