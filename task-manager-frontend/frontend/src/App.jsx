import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout.jsx'
import { ProtectedRoute } from './components/ProtectedRoute.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Dashboard from './pages/Dashboard.jsx'
import TaskBoard from './pages/TaskBoard.jsx'
import TaskList from './pages/TaskList.jsx'
import TaskForm from './pages/TaskForm.jsx'
import TaskDetails from './pages/TaskDetails.jsx'
import Teams from './pages/Teams.jsx'
import Labels from './pages/Labels.jsx'
import Activities from './pages/Activities.jsx'
import Watchlist from './pages/Watchlist.jsx'
import NotFound from './pages/NotFound.jsx'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/board" element={<TaskBoard />} />
        <Route path="/tareas" element={<TaskList />} />
        <Route path="/tareas/nueva" element={<TaskForm />} />
        <Route path="/tareas/:id" element={<TaskForm />} />
        <Route path="/tareas/:id" element={<TaskForm />} />
        <Route path="/tareas/:id/editar" element={<TaskForm />} />
        <Route path="/tareas/:id" element={<TaskDetails />} />
        <Route path="/equipos" element={<Teams />} />
        <Route path="/etiquetas" element={<Labels />} />
        <Route path="/actividades" element={<Activities />} />
        <Route path="/watchlist" element={<Watchlist />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
