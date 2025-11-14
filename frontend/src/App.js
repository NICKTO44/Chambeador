import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Páginas
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegistroPage from './pages/RegistroPage';
import PublicarTrabajoPage from './pages/PublicarTrabajoPage';
import MisPublicacionesPage from './pages/MisPublicacionesPage';
import PerfilPage from './pages/PerfilPage';
import AdminPage from './pages/AdminPage';
import ExperienciasPage from './pages/ExperienciasPage';
import PerfilPublico from './pages/PerfilPublico'; // ✨ NUEVO

import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            {/* Rutas públicas */}
            <Route path="/" element={<Navigate to="/trabajos" replace />} />
            <Route path="/trabajos" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/registro" element={<RegistroPage />} />

            {/* Experiencias (pública pero con más funciones si estás autenticado) */}
            <Route path="/experiencias" element={<ExperienciasPage />} />

            {/* ✨ NUEVO: Perfil público (cualquiera puede ver) */}
            <Route path="/perfil-publico/:id" element={<PerfilPublico />} />

            {/* Rutas protegidas - Solo empleadores */}
            <Route 
              path="/publicar-trabajo" 
              element={
                <ProtectedRoute allowedRoles={['empleador', 'admin']}>
                  <PublicarTrabajoPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/mis-publicaciones" 
              element={
                <ProtectedRoute allowedRoles={['empleador']}>
                  <MisPublicacionesPage />
                </ProtectedRoute>
              } 
            />

            {/* Rutas protegidas - Trabajadores y Empleadores */}
            <Route 
              path="/perfil" 
              element={
                <ProtectedRoute allowedRoles={['trabajador', 'empleador']}>
                  <PerfilPage />
                </ProtectedRoute>
              } 
            />

            {/* Rutas protegidas - Solo admin */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminPage />
                </ProtectedRoute>
              } 
            />

            {/* 404 */}
            <Route path="*" element={<Navigate to="/trabajos" replace />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;