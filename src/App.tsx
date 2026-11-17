import { Navigate, Route, Routes } from 'react-router-dom'
import { useAppHeight } from './engine/useAppHeight.ts'
import { useTheme } from './engine/useTheme.ts'
import Editor from './screens/Editor.tsx'
import History from './screens/History.tsx'
import Home from './screens/Home.tsx'
import KindPicker from './screens/KindPicker.tsx'
import Run from './screens/Run.tsx'
import Settings from './screens/Settings.tsx'

export default function App() {
  useTheme()
  useAppHeight()

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/chrono/nouveau" element={<KindPicker />} />
      <Route path="/chrono/nouveau/:kind" element={<Editor />} />
      <Route path="/chrono/:id" element={<Editor />} />
      <Route path="/lancer/:id" element={<Run />} />
      <Route path="/historique" element={<History />} />
      <Route path="/reglages" element={<Settings />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
