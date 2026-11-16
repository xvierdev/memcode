import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import CodeDetailsPage from './pages/CodeDetailsPage'
import CodeEditorPage from './pages/CodeEditorPage'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Navigate replace to="/login" />} path="/" />
        <Route element={<LoginPage />} path="/login" />
        <Route element={<RegisterPage />} path="/register" />
        <Route element={<DashboardPage />} path="/dashboard" />
        <Route element={<CodeEditorPage />} path="/codes/new" />
        <Route element={<CodeEditorPage />} path="/codes/:codeId/edit" />
        <Route element={<CodeDetailsPage />} path="/codes/:codeId" />
        <Route element={<Navigate replace to="/login" />} path="*" />
      </Routes>
    </BrowserRouter>
  )
}
