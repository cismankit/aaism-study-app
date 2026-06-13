import { Routes, Route } from 'react-router-dom'
import OSINTLayout from './components/OSINTLayout'
import CommandCenter from './pages/CommandCenter'
import Study from './pages/Study'
import CheatSheet from './pages/CheatSheet'
import CramMode from './pages/CramMode'
import KnowledgeHub from './pages/KnowledgeHub'
import KnowledgeBase from './pages/KnowledgeBase'
import AgentDiscovery from './pages/AgentDiscovery'
import IntelHub from './pages/IntelHub'
import ScenarioLab from './pages/ScenarioLab'
import Playbooks from './pages/Playbooks'
import Dashboard from './pages/Dashboard'
import HelpCenter from './pages/HelpCenter'
import Support from './pages/Support'
import Donate from './pages/Donate'

function App() {
  return (
    <Routes>
      <Route path="/" element={<OSINTLayout />}>
        <Route index element={<CommandCenter />} />
        <Route path="study" element={<Study />} />
        <Route path="intel" element={<IntelHub />} />
        <Route path="scenarios" element={<ScenarioLab />} />
        <Route path="agent" element={<AgentDiscovery />} />
        <Route path="playbooks" element={<Playbooks />} />
        <Route path="knowledge" element={<KnowledgeBase />} />
        <Route path="knowledge/visual" element={<KnowledgeHub />} />
        <Route path="cheatsheet" element={<CheatSheet />} />
        <Route path="cram" element={<CramMode />} />
        <Route path="settings" element={<Dashboard />} />
        <Route path="help" element={<HelpCenter />} />
        <Route path="support" element={<Support />} />
        <Route path="donate" element={<Donate />} />
      </Route>
    </Routes>
  )
}

export default App
