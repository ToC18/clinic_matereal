import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Layout from './components/Layout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import MaterialsPage from './pages/MaterialsPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import RequestPage from './pages/RequestPage.jsx';
import NarcoticJournalPage from './pages/NarcoticJournalPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import UsersPage from './pages/UsersPage.jsx';
import UserProfilePage from './pages/UserProfilePage.jsx';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="materials" element={<MaterialsPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="users/:userId" element={<UserProfilePage />} />
            <Route path="requests" element={<RequestPage />} />
            <Route path="narcotic-journal" element={<NarcoticJournalPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;