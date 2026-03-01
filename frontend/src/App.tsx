import React from 'react';
import {
  createRouter,
  createRoute,
  createRootRoute,
  RouterProvider,
  Outlet,
  redirect,
} from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import InventoryPage from './pages/InventoryPage';
import SalesPage from './pages/SalesPage';
import MenuPage from './pages/MenuPage';
import CustomersPage from './pages/CustomersPage';
import SuppliersPage from './pages/SuppliersPage';
import PurchaseOrdersPage from './pages/PurchaseOrdersPage';
import WasteLogPage from './pages/WasteLogPage';
import AlertsPage from './pages/AlertsPage';
import DiscountsPage from './pages/DiscountsPage';
import TaxConfigPage from './pages/TaxConfigPage';
import SalesReportsPage from './pages/SalesReportsPage';
import CombosPage from './pages/CombosPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import DeliveryCalendarPage from './pages/DeliveryCalendarPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

// Root route with layout
const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

// Login route (no layout)
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});

// Layout wrapper route
const layoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'layout',
  component: () => (
    <Layout>
      <Outlet />
    </Layout>
  ),
});

// Index redirect
const indexRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/dashboard' });
  },
  component: () => null,
});

const dashboardRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/dashboard',
  component: DashboardPage,
});

const inventoryRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/inventory',
  component: InventoryPage,
});

const salesRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/sales',
  component: SalesPage,
});

const menuRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/menu',
  component: MenuPage,
});

const customersRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/customers',
  component: CustomersPage,
});

const suppliersRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/suppliers',
  component: SuppliersPage,
});

const purchaseOrdersRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/purchase-orders',
  component: PurchaseOrdersPage,
});

const wasteLogRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/waste-log',
  component: WasteLogPage,
});

const alertsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/alerts',
  component: AlertsPage,
});

const discountsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/discounts',
  component: DiscountsPage,
});

const taxConfigRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/tax-config',
  component: TaxConfigPage,
});

const salesReportsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/sales-reports',
  component: SalesReportsPage,
});

const combosRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/combos',
  component: CombosPage,
});

const subscriptionsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/subscriptions',
  component: SubscriptionsPage,
});

const deliveryCalendarRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/delivery-calendar',
  component: DeliveryCalendarPage,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  layoutRoute.addChildren([
    indexRoute,
    dashboardRoute,
    inventoryRoute,
    salesRoute,
    menuRoute,
    customersRoute,
    suppliersRoute,
    purchaseOrdersRoute,
    wasteLogRoute,
    alertsRoute,
    discountsRoute,
    taxConfigRoute,
    salesReportsRoute,
    combosRoute,
    subscriptionsRoute,
    deliveryCalendarRoute,
  ]),
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
