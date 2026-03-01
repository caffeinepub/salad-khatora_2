import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type {
  SaleOrder,
  SaleOrderItem,
  TaxBreakdown,
  PaymentMode,
  Customer,
  DiscountCode,
  DiscountCodeInput,
  TaxConfig,
  TaxConfigInput,
  TaxAppliesTo as TaxAppliesToType,
  LoyaltyTransaction,
  StaffAccount,
  StaffRole,
  AuditLog,
  UserProfile,
} from '../backend';
import { TaxAppliesTo } from '../backend';
import { Principal } from '@dfinity/principal';

// ─── Re-exports ────────────────────────────────────────────────────────────────
export { TaxAppliesTo };
export type { TaxAppliesToType };
export type { PaymentMode, TaxBreakdown, SaleOrderItem, TaxConfig, TaxConfigInput };

// ─── SubscriptionStatus ────────────────────────────────────────────────────────
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled';
export const SubscriptionStatus = {
  active: 'active' as SubscriptionStatus,
  paused: 'paused' as SubscriptionStatus,
  cancelled: 'cancelled' as SubscriptionStatus,
};

// ─── SalesReportPeriod ─────────────────────────────────────────────────────────
export type SalesReportPeriod = 'daily' | 'weekly';

// ─── Local types ───────────────────────────────────────────────────────────────
export interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  sellingPrice: number;
  category: string;
  isAvailable: boolean;
  imageUrl?: string;
  costPerServing?: number;
  ingredients?: number[];
  availableFromHour?: number;
  availableToHour?: number;
  availableDays?: number[];
}

export interface Combo {
  id: number;
  name: string;
  description: string;
  price: number;
  bundlePrice?: number;
  items: { menuItemId: number; quantity: number }[];
  menuItemIds?: number[];
  isAvailable: boolean;
  imageUrl?: string;
  savings?: number;
  totalIndividualPrice?: number;
}

export interface Supplier {
  id: number;
  name: string;
  contactName: string;
  contactPerson?: string;
  phone: string;
  email: string;
  address: string;
  leadTimeDays?: number;
  notes?: string;
  ingredients?: number[];
  createdAt: number;
}

export interface Ingredient {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  minStockLevel: number;
  lowStockThreshold?: number;
  costPerUnit: number;
  costPrice?: number;
  supplierId?: number;
  expiryDate?: number;
  createdAt: number;
}

export interface CreateIngredientRequest {
  name: string;
  quantity: number;
  unit: string;
  minStockLevel: number;
  costPerUnit: number;
  supplierId?: number;
  expiryDate?: number;
}

export interface UpdateIngredientRequest extends CreateIngredientRequest {
  id: number;
}

export interface PurchaseOrder {
  id: number;
  supplierId: number;
  supplierName: string;
  items: { ingredientId: number; ingredientName: string; quantity: number; unit: string; costPerUnit: number }[];
  totalCost: number;
  status: PurchaseOrderStatus;
  createdAt: number;
  expectedDelivery?: number;
  notes?: string;
}

export type PurchaseOrderStatus = 'pending' | 'confirmed' | 'delivered' | 'cancelled';
export const PurchaseOrderStatusValues: PurchaseOrderStatus[] = ['pending', 'confirmed', 'delivered', 'cancelled'];

export interface WasteLog {
  id: number;
  ingredientId: number;
  ingredientName: string;
  quantity: number;
  unit: string;
  reason: string;
  costLoss: number;
  createdAt: number;
}

export type AlertType = 'low_stock' | 'expiry' | 'order' | 'system';

export interface Alert {
  id: number;
  type: AlertType;
  alertType?: AlertType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: number;
}

export interface Subscription {
  id: number;
  customerId: number;
  customerName: string;
  planName: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  frequencyDays?: number;
  totalAmount: number;
  totalPrice?: number;
  status: SubscriptionStatus;
  startDate: number;
  nextRenewalDate: number;
  note?: string;
  menuItemIds?: number[];
  createdAt: number;
}

export interface SalesReportEntry {
  date: string;
  revenue: number;
  orders: number;
  totalRevenue?: number;
  totalOrders?: number;
  avgOrderValue: number;
}

export interface SalesStats {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
}

export interface TaxConfigLocal {
  id: number;
  name: string;
  rate: number;
  isActive: boolean;
  appliesTo: TaxAppliesToType;
  createdAt: number;
}

// ─── localStorage helpers ──────────────────────────────────────────────────────
function lsGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function lsSet<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// ─── Menu Items ────────────────────────────────────────────────────────────────
export function useMenuItems() {
  return useQuery<MenuItem[]>({
    queryKey: ['menuItems'],
    queryFn: () => lsGet<MenuItem[]>('menuItems', []),
  });
}

export function useCreateMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: Omit<MenuItem, 'id'>) => {
      const items = lsGet<MenuItem[]>('menuItems', []);
      const newItem: MenuItem = { ...item, id: Date.now() };
      lsSet('menuItems', [...items, newItem]);
      return newItem;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['menuItems'] }),
  });
}

export function useUpdateMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: MenuItem) => {
      const items = lsGet<MenuItem[]>('menuItems', []);
      lsSet('menuItems', items.map(i => (i.id === item.id ? item : i)));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['menuItems'] }),
  });
}

export function useDeleteMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const items = lsGet<MenuItem[]>('menuItems', []);
      lsSet('menuItems', items.filter(i => i.id !== id));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['menuItems'] }),
  });
}

export function useToggleMenuItemAvailability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const items = lsGet<MenuItem[]>('menuItems', []);
      lsSet('menuItems', items.map(i => (i.id === id ? { ...i, isAvailable: !i.isAvailable } : i)));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['menuItems'] }),
  });
}

// ─── Combos ────────────────────────────────────────────────────────────────────
export function useCombos() {
  return useQuery<Combo[]>({
    queryKey: ['combos'],
    queryFn: () => lsGet<Combo[]>('combos', []),
  });
}

export function useCreateCombo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (combo: Omit<Combo, 'id'>) => {
      const combos = lsGet<Combo[]>('combos', []);
      const newCombo: Combo = { ...combo, id: Date.now() };
      lsSet('combos', [...combos, newCombo]);
      return newCombo;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['combos'] }),
  });
}

// Alias for backward compat
export const useCreateComboDeal = useCreateCombo;

export function useUpdateCombo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (combo: Combo) => {
      const combos = lsGet<Combo[]>('combos', []);
      lsSet('combos', combos.map(c => (c.id === combo.id ? combo : c)));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['combos'] }),
  });
}

// Alias for backward compat
export const useUpdateComboDeal = useUpdateCombo;

export function useDeleteCombo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const combos = lsGet<Combo[]>('combos', []);
      lsSet('combos', combos.filter(c => c.id !== id));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['combos'] }),
  });
}

// Alias for backward compat
export const useDeleteComboDeal = useDeleteCombo;

export function useToggleComboDealAvailability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const combos = lsGet<Combo[]>('combos', []);
      lsSet('combos', combos.map(c => (c.id === id ? { ...c, isAvailable: !c.isAvailable } : c)));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['combos'] }),
  });
}

// ComboDeal type alias
export type ComboDeal = Combo;

// ─── Suppliers ─────────────────────────────────────────────────────────────────
export function useSuppliers() {
  return useQuery<Supplier[]>({
    queryKey: ['suppliers'],
    queryFn: () => lsGet<Supplier[]>('suppliers', []),
  });
}

export function useCreateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (supplier: Omit<Supplier, 'id' | 'createdAt'>) => {
      const suppliers = lsGet<Supplier[]>('suppliers', []);
      const newSupplier: Supplier = { ...supplier, id: Date.now(), createdAt: Date.now() };
      lsSet('suppliers', [...suppliers, newSupplier]);
      return newSupplier;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }),
  });
}

export function useUpdateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (supplier: Supplier) => {
      const suppliers = lsGet<Supplier[]>('suppliers', []);
      lsSet('suppliers', suppliers.map(s => (s.id === supplier.id ? supplier : s)));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }),
  });
}

export function useDeleteSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const suppliers = lsGet<Supplier[]>('suppliers', []);
      lsSet('suppliers', suppliers.filter(s => s.id !== id));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }),
  });
}

// ─── Ingredients ───────────────────────────────────────────────────────────────
export function useIngredients() {
  return useQuery<Ingredient[]>({
    queryKey: ['ingredients'],
    queryFn: () => lsGet<Ingredient[]>('ingredients', []),
  });
}

export function useCreateIngredient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (req: CreateIngredientRequest) => {
      const ingredients = lsGet<Ingredient[]>('ingredients', []);
      const newIngredient: Ingredient = { ...req, id: Date.now(), createdAt: Date.now() };
      lsSet('ingredients', [...ingredients, newIngredient]);
      return newIngredient;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ingredients'] }),
  });
}

export function useUpdateIngredient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (req: UpdateIngredientRequest) => {
      const ingredients = lsGet<Ingredient[]>('ingredients', []);
      lsSet('ingredients', ingredients.map(i => (i.id === req.id ? { ...i, ...req } : i)));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ingredients'] }),
  });
}

export function useDeleteIngredient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const ingredients = lsGet<Ingredient[]>('ingredients', []);
      lsSet('ingredients', ingredients.filter(i => i.id !== id));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ingredients'] }),
  });
}

// ─── Purchase Orders ───────────────────────────────────────────────────────────
export function usePurchaseOrders() {
  return useQuery<PurchaseOrder[]>({
    queryKey: ['purchaseOrders'],
    queryFn: () => lsGet<PurchaseOrder[]>('purchaseOrders', []),
  });
}

export function useCreatePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (order: Omit<PurchaseOrder, 'id' | 'createdAt'>) => {
      const orders = lsGet<PurchaseOrder[]>('purchaseOrders', []);
      const newOrder: PurchaseOrder = { ...order, id: Date.now(), createdAt: Date.now() };
      lsSet('purchaseOrders', [...orders, newOrder]);
      return newOrder;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['purchaseOrders'] }),
  });
}

// Alias for backward compat
export const useAutoGeneratePurchaseOrders = useCreatePurchaseOrder;

export function useUpdatePurchaseOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: PurchaseOrderStatus }) => {
      const orders = lsGet<PurchaseOrder[]>('purchaseOrders', []);
      lsSet('purchaseOrders', orders.map(o => (o.id === id ? { ...o, status } : o)));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['purchaseOrders'] }),
  });
}

export function useDeletePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const orders = lsGet<PurchaseOrder[]>('purchaseOrders', []);
      lsSet('purchaseOrders', orders.filter(o => o.id !== id));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['purchaseOrders'] }),
  });
}

// ─── Waste Logs ────────────────────────────────────────────────────────────────
export function useWasteLogs() {
  return useQuery<WasteLog[]>({
    queryKey: ['wasteLogs'],
    queryFn: () => lsGet<WasteLog[]>('wasteLogs', []),
  });
}

export function useCreateWasteLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ingredientId, quantity, reason }: { ingredientId: number; quantity: number; reason: string }) => {
      const ingredients = lsGet<Ingredient[]>('ingredients', []);
      const ingredient = ingredients.find(i => i.id === ingredientId);
      const logs = lsGet<WasteLog[]>('wasteLogs', []);
      const newLog: WasteLog = {
        id: Date.now(),
        ingredientId,
        ingredientName: ingredient?.name ?? 'Unknown',
        quantity,
        unit: ingredient?.unit ?? '',
        reason,
        costLoss: quantity * (ingredient?.costPerUnit ?? 0),
        createdAt: Date.now(),
      };
      lsSet('wasteLogs', [...logs, newLog]);
      return newLog;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wasteLogs'] }),
  });
}

export function useWasteStats() {
  const { data: logs = [] } = useWasteLogs();
  const totalCostLoss = logs.reduce((sum, l) => sum + l.costLoss, 0);
  const totalItems = logs.reduce((sum, l) => sum + l.quantity, 0);
  return { totalCostLoss, totalItems, count: logs.length };
}

// ─── Alerts ────────────────────────────────────────────────────────────────────
export function useAlerts() {
  return useQuery<Alert[]>({
    queryKey: ['alerts'],
    queryFn: () => {
      const alerts = lsGet<Alert[]>('alerts', []);
      // Normalize: ensure alertType mirrors type
      return alerts.map(a => ({ ...a, alertType: a.alertType ?? a.type }));
    },
  });
}

export function useMarkAlertRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const alerts = lsGet<Alert[]>('alerts', []);
      lsSet('alerts', alerts.map(a => (a.id === id ? { ...a, isRead: true } : a)));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
  });
}

export function useMarkAllAlertsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: number[]) => {
      const alerts = lsGet<Alert[]>('alerts', []);
      lsSet('alerts', alerts.map(a => (ids.includes(a.id) ? { ...a, isRead: true } : a)));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
  });
}

export function useCreateAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (alert: Omit<Alert, 'id' | 'createdAt' | 'isRead'>) => {
      const alerts = lsGet<Alert[]>('alerts', []);
      const newAlert: Alert = { ...alert, alertType: alert.type, id: Date.now(), createdAt: Date.now(), isRead: false };
      lsSet('alerts', [...alerts, newAlert]);
      return newAlert;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
  });
}

// ─── Subscriptions ─────────────────────────────────────────────────────────────
export function useSubscriptions() {
  return useQuery<Subscription[]>({
    queryKey: ['subscriptions'],
    queryFn: () => lsGet<Subscription[]>('subscriptions', []),
  });
}

export function useCreateSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sub: Omit<Subscription, 'id' | 'createdAt'>) => {
      const subs = lsGet<Subscription[]>('subscriptions', []);
      const newSub: Subscription = { ...sub, id: Date.now(), createdAt: Date.now() };
      lsSet('subscriptions', [...subs, newSub]);
      return newSub;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subscriptions'] }),
  });
}

export function useUpdateSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sub: Subscription) => {
      const subs = lsGet<Subscription[]>('subscriptions', []);
      lsSet('subscriptions', subs.map(s => (s.id === sub.id ? sub : s)));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subscriptions'] }),
  });
}

// Aliases for pause/resume/cancel
export function usePauseSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const subs = lsGet<Subscription[]>('subscriptions', []);
      lsSet('subscriptions', subs.map(s => (s.id === id ? { ...s, status: 'paused' as SubscriptionStatus } : s)));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subscriptions'] }),
  });
}

export function useResumeSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const subs = lsGet<Subscription[]>('subscriptions', []);
      lsSet('subscriptions', subs.map(s => (s.id === id ? { ...s, status: 'active' as SubscriptionStatus } : s)));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subscriptions'] }),
  });
}

export function useCancelSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const subs = lsGet<Subscription[]>('subscriptions', []);
      lsSet('subscriptions', subs.map(s => (s.id === id ? { ...s, status: 'cancelled' as SubscriptionStatus } : s)));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subscriptions'] }),
  });
}

// ─── User Profile ─────────────────────────────────────────────────────────────
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['currentUserProfile'] }),
  });
}

// ─── Customers ────────────────────────────────────────────────────────────────
export function useCustomers() {
  const { actor, isFetching } = useActor();
  return useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCustomers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateCustomer() {
  const { actor, isFetching } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      name: string;
      mobileNo: string;
      email: string | null;
      preference: string;
      address: string;
    }) => {
      if (!actor || isFetching) throw new Error('Actor not available. Please wait for initialization or refresh the page.');
      return actor.addCustomer(params.name, params.mobileNo, params.email, params.preference, params.address);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  });
}

export function useUpdateCustomer() {
  const { actor, isFetching } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      id: bigint;
      name: string;
      mobileNo: string;
      email: string | null;
      preference: string;
      address: string;
    }) => {
      if (!actor || isFetching) throw new Error('Actor not available. Please wait for initialization or refresh the page.');
      return actor.updateCustomer(params.id, params.name, params.mobileNo, params.email, params.preference, params.address);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  });
}

export function useDeleteCustomer() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteCustomer(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  });
}

// ─── Loyalty ──────────────────────────────────────────────────────────────────
export function useLoyaltyBalance(customerId: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ['loyaltyBalance', customerId.toString()],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getLoyaltyBalance(customerId);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useLoyaltyTransactions(customerId: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery<LoyaltyTransaction[]>({
    queryKey: ['loyaltyTransactions', customerId.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getLoyaltyTransactions(customerId);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useRedeemLoyaltyPoints() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { customerId: bigint; points: bigint; discountAmount: number }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.redeemLoyaltyPoints(params.customerId, params.points, params.discountAmount);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      qc.invalidateQueries({ queryKey: ['loyaltyBalance'] });
      qc.invalidateQueries({ queryKey: ['loyaltyTransactions'] });
    },
  });
}

// ─── Customer Order History ───────────────────────────────────────────────────
export function useCustomerOrderHistory(customerId: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery<SaleOrder[]>({
    queryKey: ['customerOrderHistory', customerId.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCustomerOrderHistory(customerId);
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Discount Codes ───────────────────────────────────────────────────────────
export function useDiscountCodes() {
  const { actor, isFetching } = useActor();
  return useQuery<DiscountCode[]>({
    queryKey: ['discountCodes'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getDiscountCodes();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateDiscountCode() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: DiscountCodeInput) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createDiscountCode(input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['discountCodes'] }),
  });
}

export function useUpdateDiscountCode() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: bigint; input: DiscountCodeInput }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateDiscountCode(params.id, params.input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['discountCodes'] }),
  });
}

export function useToggleDiscountCode() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.toggleDiscountCode(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['discountCodes'] }),
  });
}

export function useDeleteDiscountCode() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteDiscountCode(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['discountCodes'] }),
  });
}

export function useApplyDiscountCode() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (params: { code: string; orderTotal: number }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.applyDiscountCode(params.code, params.orderTotal);
    },
  });
}

// ─── Tax Configs ──────────────────────────────────────────────────────────────
export function useTaxConfigs() {
  const { actor, isFetching } = useActor();
  return useQuery<TaxConfig[]>({
    queryKey: ['taxConfigs'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTaxConfigs();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateTaxConfig() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: TaxConfigInput) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createTaxConfig(input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['taxConfigs'] }),
  });
}

export function useUpdateTaxConfig() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: bigint; input: TaxConfigInput }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateTaxConfig(params.id, params.input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['taxConfigs'] }),
  });
}

export function useToggleTaxConfig() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.toggleTaxConfig(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['taxConfigs'] }),
  });
}

export function useDeleteTaxConfig() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteTaxConfig(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['taxConfigs'] }),
  });
}

export function useCalculateTax() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (params: { subtotal: number; targetType: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.calculateTax(params.subtotal, params.targetType);
    },
  });
}

// ─── Sale Orders ──────────────────────────────────────────────────────────────
export function useSaleOrders() {
  const { actor, isFetching } = useActor();
  return useQuery<SaleOrder[]>({
    queryKey: ['saleOrders'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getSaleOrders();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateSaleOrder() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      items: SaleOrderItem[];
      subtotal: number;
      totalAmount: number;
      discountAmount: number;
      taxBreakdown: TaxBreakdown[];
      taxTotal: number;
      note: string;
      discountCodeId: bigint | null;
      customerId: bigint | null;
      paymentType: PaymentMode;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createSaleOrder(
        params.items,
        params.subtotal,
        params.totalAmount,
        params.discountAmount,
        params.taxBreakdown,
        params.taxTotal,
        params.note,
        params.discountCodeId,
        params.customerId,
        params.paymentType,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['saleOrders'] }),
  });
}

export function useDeleteSaleOrder() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteSaleOrder(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['saleOrders'] }),
  });
}

// ─── Sales Report ─────────────────────────────────────────────────────────────
export function useSalesReport(period: SalesReportPeriod = 'daily') {
  const { data: orders = [], isLoading, isError, error } = useSaleOrders();

  const reportMap = new Map<string, SalesReportEntry>();

  for (const order of orders) {
    const dateObj = new Date(Number(order.createdAt) / 1_000_000);
    let key: string;
    if (period === 'weekly') {
      // Group by ISO week: year-Www
      const jan1 = new Date(dateObj.getFullYear(), 0, 1);
      const weekNum = Math.ceil(((dateObj.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
      key = `${dateObj.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
    } else {
      key = dateObj.toISOString().split('T')[0];
    }
    const existing = reportMap.get(key) ?? { date: key, revenue: 0, orders: 0, avgOrderValue: 0 };
    reportMap.set(key, {
      date: key,
      revenue: existing.revenue + order.totalAmount,
      orders: existing.orders + 1,
      avgOrderValue: 0, // computed below
    });
  }

  const data = Array.from(reportMap.values())
    .map(entry => ({
      ...entry,
      avgOrderValue: entry.orders > 0 ? entry.revenue / entry.orders : 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return { data, isLoading, isError, error };
}

// ─── Staff Accounts ───────────────────────────────────────────────────────────
export function useStaffAccounts() {
  const { actor, isFetching } = useActor();
  return useQuery<StaffAccount[]>({
    queryKey: ['staffAccounts'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getStaffAccounts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateStaffAccount() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { principal: Principal; name: string; role: StaffRole }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createStaffAccount(params.principal, params.name, params.role);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staffAccounts'] }),
  });
}

export function useUpdateStaffAccount() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: bigint; name: string; role: StaffRole; isActive: boolean }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateStaffAccount(params.id, params.name, params.role, params.isActive);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staffAccounts'] }),
  });
}

export function useDeleteStaffAccount() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteStaffAccount(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staffAccounts'] }),
  });
}

export function useMyRole() {
  const { actor, isFetching } = useActor();
  return useQuery<StaffRole | null>({
    queryKey: ['myRole'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getMyRole();
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Audit Logs ───────────────────────────────────────────────────────────────
export function useAuditLogs(limit: number, offset: number) {
  const { actor, isFetching } = useActor();
  return useQuery<AuditLog[]>({
    queryKey: ['auditLogs', limit, offset],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAuditLogs(BigInt(limit), BigInt(offset));
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Admin ────────────────────────────────────────────────────────────────────
export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ['isCallerAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetCallerUserRole() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ['callerUserRole'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !isFetching,
  });
}
