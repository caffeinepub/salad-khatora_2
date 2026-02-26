import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
  Outlet,
  redirect,
} from '@tanstack/react-router';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import InventoryPage from './pages/InventoryPage';
import MenuPage from './pages/MenuPage';
import SalesPage from './pages/SalesPage';
import CustomersPage from './pages/CustomersPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import AlertsPage from './pages/AlertsPage';
import SuppliersPage from './pages/SuppliersPage';
import PurchaseOrdersPage from './pages/PurchaseOrdersPage';
import WasteLogPage from './pages/WasteLogPage';
import CombosPage from './pages/CombosPage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import DeliveryCalendarPage from './pages/DeliveryCalendarPage';

const queryClient = new QueryClient();

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});

const layoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'layout',
  component: () => (
    <Layout>
      <Outlet />
    </Layout>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/dashboard' });
  },
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

const menuRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/menu',
  component: MenuPage,
});

const combosRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/combos',
  component: CombosPage,
});

const salesRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/sales',
  component: SalesPage,
});

const customersRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/customers',
  component: CustomersPage,
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

const alertsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/alerts',
  component: AlertsPage,
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

const adminSettingsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/admin-settings',
  component: AdminSettingsPage,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  layoutRoute.addChildren([
    indexRoute,
    dashboardRoute,
    inventoryRoute,
    menuRoute,
    combosRoute,
    salesRoute,
    customersRoute,
    subscriptionsRoute,
    deliveryCalendarRoute,
    alertsRoute,
    suppliersRoute,
    purchaseOrdersRoute,
    wasteLogRoute,
    adminSettingsRoute,
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
    <ThemeProvider attribute="class" defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster richColors position="top-right" />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
