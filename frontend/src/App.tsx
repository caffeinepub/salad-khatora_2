import React, { useEffect } from 'react';
import { createRouter, createRoute, createRootRoute, RouterProvider, Outlet } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import InventoryPage from './pages/InventoryPage';
import MenuPage from './pages/MenuPage';
import SalesPage from './pages/SalesPage';
import CustomersPage from './pages/CustomersPage';
import AlertsPage from './pages/AlertsPage';
import WasteLogPage from './pages/WasteLogPage';
import CombosPage from './pages/CombosPage';
import SalesReportsPage from './pages/SalesReportsPage';
import DiscountsPage from './pages/DiscountsPage';
import TaxConfigPage from './pages/TaxConfigPage';
import SuppliersPage from './pages/SuppliersPage';

const queryClient = new QueryClient();

function AppLayout() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

function IndexRedirect() {
  useEffect(() => {
    window.location.replace('/dashboard');
  }, []);
  return null;
}

const rootRoute = createRootRoute({ component: AppLayout });

const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: IndexRedirect });
const dashboardRoute = createRoute({ getParentRoute: () => rootRoute, path: '/dashboard', component: DashboardPage });
const inventoryRoute = createRoute({ getParentRoute: () => rootRoute, path: '/inventory', component: InventoryPage });
const menuRoute = createRoute({ getParentRoute: () => rootRoute, path: '/menu', component: MenuPage });
const salesRoute = createRoute({ getParentRoute: () => rootRoute, path: '/sales', component: SalesPage });
const customersRoute = createRoute({ getParentRoute: () => rootRoute, path: '/customers', component: CustomersPage });
const alertsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/alerts', component: AlertsPage });
const wasteLogRoute = createRoute({ getParentRoute: () => rootRoute, path: '/waste-log', component: WasteLogPage });
const combosRoute = createRoute({ getParentRoute: () => rootRoute, path: '/combos', component: CombosPage });
const salesReportsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/sales-reports', component: SalesReportsPage });
const discountsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/discounts', component: DiscountsPage });
const taxConfigRoute = createRoute({ getParentRoute: () => rootRoute, path: '/tax-config', component: TaxConfigPage });
const suppliersRoute = createRoute({ getParentRoute: () => rootRoute, path: '/suppliers', component: SuppliersPage });

const routeTree = rootRoute.addChildren([
  indexRoute,
  dashboardRoute,
  inventoryRoute,
  menuRoute,
  salesRoute,
  customersRoute,
  alertsRoute,
  wasteLogRoute,
  combosRoute,
  salesReportsRoute,
  discountsRoute,
  taxConfigRoute,
  suppliersRoute,
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
