import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ClientsPage from './pages/ClientsPage';
import ClientDetailPage from './pages/ClientDetailPage';
import ClientFormPage from './pages/ClientFormPage';
import OrdersPage from './pages/OrdersPage';
import NotFoundPage from './pages/NotFoundPage';
import { FullPageLoader } from './components/UI';

function ProtectedRoutes() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" state={{ from: `${location.pathname}${location.search}` }} replace />;
  return <Layout />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoutes />}>
        <Route path="/" element={<Navigate to="/painel" replace />} />
        <Route path="/painel" element={<DashboardPage />} />
        <Route path="/clientes" element={<ClientsPage />} />
        <Route path="/clientes/novo" element={<ClientFormPage />} />
        <Route path="/clientes/:id/editar" element={<ClientFormPage />} />
        <Route path="/clientes/:id" element={<ClientDetailPage />} />
        <Route path="/pedidos" element={<OrdersPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
