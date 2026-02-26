import React, { useEffect } from 'react';
import { createRouter, createRoute, createRootRoute, RouterProvider, Outlet } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import InventoryPage from './pages/InventoryPage';
import MenuPage from './pages/MenuPage';
import SalesPage from './pages/SalesPage';
import CustomersPage from './pages/CustomersPage';
import AlertsPage from './pages/AlertsPage';
import SuppliersPage from './pages/SuppliersPage';
import PurchaseOrdersPage from './pages/PurchaseOrdersPage';
import WasteLogPage from './pages/WasteLogPage';
import CombosPage from './pages/CombosPage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import SalesReportsPage from './pages/SalesReportsPage';
import StaffAccountsPage from './pages/StaffAccountsPage';
import AuditLogPage from './pages/AuditLogPage';

const queryClient = new QueryClient();

function IndexRedirect() {
  useEffect(() => {
    window.location.replace('/dashboard');
  }, []);
  return null;
}

function ProtectedLayout() {
  const { identity, isInitializing } = useInternetIdentity();

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  if (!identity) {
    return <LoginPage />;
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

const rootRoute = createRootRoute({ component: ProtectedLayout });

const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: IndexRedirect });
const dashboardRoute = createRoute({ getParentRoute: () => rootRoute, path: '/dashboard', component: DashboardPage });
const inventoryRoute = createRoute({ getParentRoute: () => rootRoute, path: '/inventory', component: InventoryPage });
const menuRoute = createRoute({ getParentRoute: () => rootRoute, path: '/menu', component: MenuPage });
const salesRoute = createRoute({ getParentRoute: () => rootRoute, path: '/sales', component: SalesPage });
const customersRoute = createRoute({ getParentRoute: () => rootRoute, path: '/customers', component: CustomersPage });
const alertsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/alerts', component: AlertsPage });
const suppliersRoute = createRoute({ getParentRoute: () => rootRoute, path: '/suppliers', component: SuppliersPage });
const purchaseOrdersRoute = createRoute({ getParentRoute: () => rootRoute, path: '/purchase-orders', component: PurchaseOrdersPage });
const wasteLogRoute = createRoute({ getParentRoute: () => rootRoute, path: '/waste-log', component: WasteLogPage });
const combosRoute = createRoute({ getParentRoute: () => rootRoute, path: '/combos', component: CombosPage });
const adminSettingsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/admin-settings', component: AdminSettingsPage });
const salesReportsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/sales-reports', component: SalesReportsPage });
const staffRoute = createRoute({ getParentRoute: () => rootRoute, path: '/staff', component: StaffAccountsPage });
const auditLogRoute = createRoute({ getParentRoute: () => rootRoute, path: '/audit-log', component: AuditLogPage });

const routeTree = rootRoute.addChildren([
  indexRoute,
  dashboardRoute,
  inventoryRoute,
  menuRoute,
  salesRoute,
  customersRoute,
  alertsRoute,
  suppliersRoute,
  purchaseOrdersRoute,
  wasteLogRoute,
  combosRoute,
  adminSettingsRoute,
  salesReportsRoute,
  staffRoute,
  auditLogRoute,
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  useEffect(() => {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
