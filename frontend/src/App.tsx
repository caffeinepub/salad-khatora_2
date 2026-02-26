import { RouterProvider, createRouter, createRoute, createRootRoute, redirect, Outlet } from '@tanstack/react-router';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import InventoryPage from './pages/InventoryPage';

// Root route with layout wrapper
const rootRoute = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return <Outlet />;
}

// Login route (no layout)
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});

// Protected layout route
const protectedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'protected',
  component: ProtectedLayout,
});

function ProtectedLayout() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

// Index redirect
const indexRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/dashboard' });
  },
  component: () => null,
});

// Dashboard route
const dashboardRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/dashboard',
  component: DashboardPage,
});

// Inventory route
const inventoryRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/inventory',
  component: InventoryPage,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  protectedRoute.addChildren([
    indexRoute,
    dashboardRoute,
    inventoryRoute,
  ]),
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
