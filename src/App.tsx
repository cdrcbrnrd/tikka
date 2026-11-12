import { Navigate, Route, Routes } from 'react-router-dom'
import { useTheme } from './engine/useTheme.ts'
import Editor from './screens/Editor.tsx'
import History from './screens/History.tsx'
import Home from './screens/Home.tsx'
import Run from './screens/Run.tsx'

export default function App() {
  useTheme()

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/chrono/nouveau" element={<Editor />} />
      <Route path="/chrono/:id" element={<Editor />} />
      <Route path="/lancer/:id" element={<Run />} />
      <Route path="/historique" element={<History />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
