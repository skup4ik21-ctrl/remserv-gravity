import React, { ReactNode, ErrorInfo } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import MainLayout from './components/layouts/MainLayout';
import Dashboard from './components/pages/Dashboard';
import ServiceOrdersPage from './components/pages/ServiceOrdersPage';
import ClientsPage from './components/pages/ClientsPage';
import CarsPage from './components/pages/CarsPage';
import MastersPage from './components/pages/MastersPage';
import PriceListPage from './components/pages/PriceListPage';
import CarGroupsPage from './components/pages/CarGroupsPage';
import AnalyticsPage from './components/pages/AnalyticsPage';
import CalendarPage from './components/pages/CalendarPage';
import CreateServiceOrderPage from './components/pages/CreateServiceOrderPage';
import ServiceOrderDetailPage from './components/pages/ServiceOrderDetailPage';
import SettingsPage from './components/pages/SettingsPage';
import InventoryPage from './components/pages/InventoryPage';
import LoginPage from './components/pages/LoginPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface ErrorBoundaryProps { children?: ReactNode; }
interface ErrorBoundaryState { hasError: boolean; error: Error | null; }

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState { return { hasError: true, error }; }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) { console.error("Критична помилка додатку:", error, errorInfo); }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-slate-50 p-6 text-center">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Сталася помилка</h1>
          <pre className="text-slate-600 mb-6 bg-slate-100 p-4 rounded-xl text-xs overflow-auto max-w-full">{this.state.error?.message || "Невідома помилка"}</pre>
          <button onClick={() => window.location.reload()} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-colors shadow-lg">Оновити сторінку</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Wrapper for Order Detail to use params
const ServiceOrderDetailWrapper = () => {
  const { orderID } = useParams();
  if (!orderID) return <Navigate to="/orders" />;
  return <ServiceOrderDetailPage />;
};

const AuthenticatedApp: React.FC = () => {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) return <div className="h-screen bg-slate-900 flex items-center justify-center text-white"><ArrowPathIcon className="w-8 h-8 animate-spin mr-3" /> Завантаження...</div>;
  if (!user) return <LoginPage />;

  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="orders" element={<ServiceOrdersPage />} />
        <Route path="orders/:orderID" element={<ServiceOrderDetailWrapper />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="create-order" element={<CreateServiceOrderPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="cars" element={<CarsPage />} />
        <Route path="masters" element={<MastersPage />} />
        <Route path="pricelist" element={<PriceListPage />} />
        <Route path="cargroups" element={<CarGroupsPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

const App: React.FC = () => (
  <ErrorBoundary>
    <AuthProvider>
      <BrowserRouter>
        <AuthenticatedApp />
      </BrowserRouter>
    </AuthProvider>
  </ErrorBoundary>
);
export default App;
