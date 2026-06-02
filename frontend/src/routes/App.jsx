import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { getSession } from '../lib/auth.js';
import Shell from '../ui/Shell.jsx';
import LoginPage from './LoginPage.jsx';
import DashboardPage from './DashboardPage.jsx';
import ProductsPage from './ProductsPage.jsx';
import NewSalePage from './NewSalePage.jsx';
import TransactionsPage from './TransactionsPage.jsx';

function RequireAuth({ children }) {
  const { token } = getSession();
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <RequireAuth>
            <Shell />
          </RequireAuth>
        }
      />
    </Routes>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/products" element={<ProductsPage />} />
      <Route path="/sales/new" element={<NewSalePage />} />
      <Route path="/transactions" element={<TransactionsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

