import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Study from './pages/Study'
import CheatSheet from './pages/CheatSheet'
import CramMode from './pages/CramMode'
import KnowledgeHub from './pages/KnowledgeHub'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="study" element={<Study />} />
        <Route path="cheatsheet" element={<CheatSheet />} />
        <Route path="cram" element={<CramMode />} />
        <Route path="knowledge" element={<KnowledgeHub />} />
      </Route>
    </Routes>
  )
}

export default App
