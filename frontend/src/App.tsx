import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
  Outlet,
  redirect,
} from "@tanstack/react-router";
import Layout from "./components/Layout";
import DashboardPage from "./pages/DashboardPage";
import SalesPage from "./pages/SalesPage";
import InventoryPage from "./pages/InventoryPage";
import MenuPage from "./pages/MenuPage";
import CustomersPage from "./pages/CustomersPage";
import CombosPage from "./pages/CombosPage";
import SuppliersPage from "./pages/SuppliersPage";
import PurchaseOrdersPage from "./pages/PurchaseOrdersPage";
import SubscriptionsPage from "./pages/SubscriptionsPage";
import DeliveryCalendarPage from "./pages/DeliveryCalendarPage";
import DiscountsPage from "./pages/DiscountsPage";
import TaxConfigPage from "./pages/TaxConfigPage";
import StaffAccountsPage from "./pages/StaffAccountsPage";
import WasteLogPage from "./pages/WasteLogPage";
import AlertsPage from "./pages/AlertsPage";
import SalesReportsPage from "./pages/SalesReportsPage";
import AuditLogPage from "./pages/AuditLogPage";
import AdminSettingsPage from "./pages/AdminSettingsPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

const rootRoute = createRootRoute({
  component: () => (
    <Layout>
      <Outlet />
    </Layout>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: DashboardPage,
});

const salesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sales",
  component: SalesPage,
});

const inventoryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/inventory",
  component: InventoryPage,
});

const menuRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/menu",
  component: MenuPage,
});

const customersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/customers",
  component: CustomersPage,
});

const combosRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/combos",
  component: CombosPage,
});

const suppliersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/suppliers",
  component: SuppliersPage,
});

const purchaseOrdersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/purchase-orders",
  component: PurchaseOrdersPage,
});

const subscriptionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/subscriptions",
  component: SubscriptionsPage,
});

const deliveryCalendarRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/delivery-calendar",
  component: DeliveryCalendarPage,
});

const discountsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/discounts",
  component: DiscountsPage,
});

const taxConfigRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/tax-config",
  component: TaxConfigPage,
});

const staffAccountsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/staff-accounts",
  component: StaffAccountsPage,
});

const wasteLogRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/waste-log",
  component: WasteLogPage,
});

const alertsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/alerts",
  component: AlertsPage,
});

const salesReportsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sales-reports",
  component: SalesReportsPage,
});

const auditLogRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/audit-log",
  component: AuditLogPage,
});

const adminSettingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin-settings",
  component: AdminSettingsPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  dashboardRoute,
  salesRoute,
  inventoryRoute,
  menuRoute,
  customersRoute,
  combosRoute,
  suppliersRoute,
  purchaseOrdersRoute,
  subscriptionsRoute,
  deliveryCalendarRoute,
  discountsRoute,
  taxConfigRoute,
  staffAccountsRoute,
  wasteLogRoute,
  alertsRoute,
  salesReportsRoute,
  auditLogRoute,
  adminSettingsRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
