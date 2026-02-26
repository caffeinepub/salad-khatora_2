import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';

// ─── Local types (not in backend interface) ───────────────────────────────────

export interface Ingredient {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  costPrice: number;
  supplierId?: number;
  lowStockThreshold: number;
  expiryDate?: number;
  createdAt: number;
}

export interface CreateIngredientRequest {
  name: string;
  quantity: number;
  unit: string;
  costPrice: number;
  supplierId?: number;
  lowStockThreshold: number;
  expiryDate?: number;
}

export interface UpdateIngredientRequest {
  name: string;
  quantity: number;
  unit: string;
  costPrice: number;
  supplierId?: number;
  lowStockThreshold: number;
  expiryDate?: number;
}

export interface MenuItem {
  id: number;
  name: string;
  description: string;
  ingredients: [string, number][];
  sellingPrice: number;
  isAvailable: boolean;
  createdAt: number;
  costPerServing: number;
  availableFromHour?: number;
  availableToHour?: number;
  availableDays?: number[];
}

export interface CreateMenuItemRequest {
  name: string;
  description: string;
  ingredients: [string, number][];
  sellingPrice: number;
  availableFromHour?: number;
  availableToHour?: number;
  availableDays?: number[];
}

export interface UpdateMenuItemRequest {
  name: string;
  description: string;
  ingredients: [string, number][];
  sellingPrice: number;
  isAvailable: boolean;
  availableFromHour?: number;
  availableToHour?: number;
  availableDays?: number[];
}

export interface SaleOrderItem {
  menuItemId: number;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface SaleOrder {
  id: number;
  items: [number, string, number, number][];
  subtotal: number;
  discountCodeId?: number;
  discountAmount: number;
  taxBreakdown: TaxBreakdown[];
  taxTotal: number;
  totalAmount: number;
  note: string;
  createdAt: number;
  customerId?: number;
}

export interface CreateSaleOrderRequest {
  items: { menuItemId: number; quantity: number }[];
  note: string;
  discountCodeId?: number;
  customerId?: number;
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  createdAt: number;
  loyaltyPoints: number;
}

export interface LoyaltyTransaction {
  id: number;
  customerId: number;
  points: number;
  reason: string;
  createdAt: number;
}

export interface UpcomingDelivery {
  subscriptionId: number;
  customerId: number;
  customerName: string;
  planName: string;
  menuItemIds: number[];
  nextRenewalDate: number;
  frequencyDays: number;
}

export interface Subscription {
  id: number;
  customerId: number;
  planName: string;
  menuItemIds: number[];
  frequencyDays: number;
  startDate: number;
  nextRenewalDate: number;
  status: 'active' | 'paused' | 'cancelled';
  totalPrice: number;
  createdAt: number;
}

export enum SubscriptionStatus {
  active = 'active',
  paused = 'paused',
  cancelled = 'cancelled',
}

export interface AlertItem {
  id: number;
  alertType: 'lowStock' | 'subscriptionRenewal' | 'expiryWarning' | 'other';
  message: string;
  relatedEntityId: number;
  isRead: boolean;
  createdAt: number;
}

export enum AlertType {
  lowStock = 'lowStock',
  subscriptionRenewal = 'subscriptionRenewal',
  expiryWarning = 'expiryWarning',
  other = 'other',
}

export interface UserProfile {
  name: string;
}

export interface Supplier {
  id: number;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  leadTimeDays: number;
  notes: string;
  createdAt: number;
}

export interface CreateSupplierRequest {
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  leadTimeDays: number;
  notes: string;
}

export interface PurchaseOrderItem {
  ingredientId: number;
  ingredientName: string;
  quantityOrdered: number;
  unit: string;
}

export interface PurchaseOrder {
  id: number;
  supplierId: number;
  supplierName: string;
  items: PurchaseOrderItem[];
  status: 'pending' | 'received' | 'cancelled';
  notes: string;
  createdAt: number;
}

export enum PurchaseOrderStatus {
  pending = 'pending',
  received = 'received',
  cancelled = 'cancelled',
}

export interface WasteLog {
  id: number;
  ingredientId: number;
  ingredientName: string;
  quantity: number;
  unit: string;
  reason: string;
  costLoss: number;
  loggedAt: number;
}

export interface CreateWasteLogRequest {
  ingredientId: number;
  quantity: number;
  reason: string;
}

export interface ComboDeal {
  id: number;
  name: string;
  description: string;
  menuItemIds: number[];
  bundlePrice: number;
  isAvailable: boolean;
  createdAt: number;
  totalIndividualPrice: number;
  savings: number;
}

export interface CreateComboDealRequest {
  name: string;
  description: string;
  menuItemIds: number[];
  bundlePrice: number;
}

export interface TaxBreakdown {
  name: string;
  rate: number;
  amount: number;
}

export interface TaxCalculationResult {
  breakdown: TaxBreakdown[];
  totalTaxAmount: number;
}

// ─── Discount / Tax local types (backend removed these from interface) ─────────

export enum DiscountType {
  percentage = 'percentage',
  fixed = 'fixed',
}

export enum TaxAppliesTo {
  all = 'all',
  menuItems = 'menuItems',
  combos = 'combos',
}

export interface DiscountCode {
  id: number;
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  minimumOrderAmount: number;
  maxUses?: number;
  usedCount: number;
  isActive: boolean;
  expiresAt?: number;
  createdAt: number;
}

export interface DiscountCodeInput {
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  minimumOrderAmount: number;
  maxUses?: number | bigint;
  expiresAt?: number | bigint;
}

export interface DiscountApplicationResult {
  discountAmount: number;
  finalTotal: number;
  discountCode: DiscountCode;
}

export interface TaxConfig {
  id: number;
  name: string;
  rate: number;
  isActive: boolean;
  appliesTo: TaxAppliesTo;
  createdAt: number;
}

export interface TaxConfigInput {
  name: string;
  rate: number;
  appliesTo: TaxAppliesTo;
}

// ─── Sales Report types ───────────────────────────────────────────────────────

export interface TopSellingItem {
  menuItemName: string;
  quantitySold: number;
  revenue: number;
}

export interface SalesReport {
  periodLabel: string;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  topSellingItems: TopSellingItem[];
}

export enum SalesReportPeriod {
  daily = 'daily',
  weekly = 'weekly',
}

export interface DashboardSalesStats {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
}

export interface WasteStats {
  totalCostLoss: number;
  totalEntries: number;
}

// ─── Local discount/tax state ─────────────────────────────────────────────────

let _discountCodes: DiscountCode[] = [];
let _nextDiscountCodeId = 1;

let _taxConfigs: TaxConfig[] = [];
let _nextTaxConfigId = 1;

// ─── Auth / Profile hooks ─────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      const role = await actor.getCallerUserRole();
      if (role) return { name: 'Admin' };
      return null;
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useAdminPrincipal() {
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

export function useReassignAdmin() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_principal: string) => {
      if (!actor) throw new Error('Actor not available');
      throw new Error('Not supported');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['isCallerAdmin'] });
    },
  });
}

export function useVacateAdmin() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      throw new Error('Not supported');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['isCallerAdmin'] });
    },
  });
}

export function useClaimAdminIfVacant() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      throw new Error('Not supported');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['isCallerAdmin'] });
    },
  });
}

// ─── Ingredient hooks (local state only) ─────────────────────────────────────

let _ingredients: Ingredient[] = [];
let _nextIngredientId = 1;

export function useIngredients() {
  const { actor, isFetching } = useActor();

  return useQuery<Ingredient[]>({
    queryKey: ['ingredients'],
    queryFn: async () => {
      return _ingredients;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIngredient(id: number) {
  return useQuery<Ingredient | null>({
    queryKey: ['ingredient', id],
    queryFn: async () => {
      return _ingredients.find(i => i.id === id) ?? null;
    },
  });
}

export function useCreateIngredient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: CreateIngredientRequest) => {
      const newItem: Ingredient = { ...item, id: _nextIngredientId++, createdAt: Date.now() };
      _ingredients = [..._ingredients, newItem];
      return newItem.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
    },
  });
}

export function useUpdateIngredient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, item }: { id: number; item: UpdateIngredientRequest }) => {
      _ingredients = _ingredients.map(i => i.id === id ? { ...i, ...item } : i);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
    },
  });
}

export function useDeleteIngredient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      _ingredients = _ingredients.filter(i => i.id !== id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
    },
  });
}

// ─── Menu Item hooks (local state only) ──────────────────────────────────────

let _menuItems: MenuItem[] = [];
let _nextMenuItemId = 1;

export function useMenuItems() {
  const { actor, isFetching } = useActor();

  return useQuery<MenuItem[]>({
    queryKey: ['menuItems'],
    queryFn: async () => _menuItems,
    enabled: !!actor && !isFetching,
  });
}

export function useMenuItem(id: number) {
  return useQuery<MenuItem | null>({
    queryKey: ['menuItem', id],
    queryFn: async () => _menuItems.find(m => m.id === id) ?? null,
  });
}

export function useCreateMenuItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: CreateMenuItemRequest) => {
      const newItem: MenuItem = {
        ...item,
        id: _nextMenuItemId++,
        isAvailable: true,
        createdAt: Date.now(),
        costPerServing: 0,
      };
      _menuItems = [..._menuItems, newItem];
      return newItem.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      queryClient.invalidateQueries({ queryKey: ['availableMenuItems'] });
    },
  });
}

export function useUpdateMenuItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, item }: { id: number; item: UpdateMenuItemRequest }) => {
      _menuItems = _menuItems.map(m => m.id === id ? { ...m, ...item } : m);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      queryClient.invalidateQueries({ queryKey: ['availableMenuItems'] });
    },
  });
}

export function useDeleteMenuItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      _menuItems = _menuItems.filter(m => m.id !== id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      queryClient.invalidateQueries({ queryKey: ['availableMenuItems'] });
    },
  });
}

export function useToggleMenuItemAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      _menuItems = _menuItems.map(m => m.id === id ? { ...m, isAvailable: !m.isAvailable } : m);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      queryClient.invalidateQueries({ queryKey: ['availableMenuItems'] });
    },
  });
}

export function useProfitMargin(menuItemId: number) {
  return useQuery<number>({
    queryKey: ['profitMargin', menuItemId],
    queryFn: async () => {
      const item = _menuItems.find(m => m.id === menuItemId);
      if (!item || item.sellingPrice === 0) return 0;
      return ((item.sellingPrice - item.costPerServing) / item.sellingPrice) * 100;
    },
  });
}

export function useAvailableMenuItems() {
  const { actor, isFetching } = useActor();

  return useQuery<MenuItem[]>({
    queryKey: ['availableMenuItems'],
    queryFn: async () => _menuItems.filter(m => m.isAvailable),
    enabled: !!actor && !isFetching,
  });
}

// ─── Sale Order hooks (local state only) ─────────────────────────────────────

let _saleOrders: SaleOrder[] = [];
let _nextSaleOrderId = 1;

export function useSaleOrders(page = 0, pageSize = 20) {
  const { actor, isFetching } = useActor();

  return useQuery<SaleOrder[]>({
    queryKey: ['saleOrders', page, pageSize],
    queryFn: async () => {
      const start = page * pageSize;
      return _saleOrders.slice(start, start + pageSize);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateSaleOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (order: CreateSaleOrderRequest) => {
      const items: [number, string, number, number][] = order.items.map(i => {
        const menuItem = _menuItems.find(m => m.id === i.menuItemId);
        return [i.menuItemId, menuItem?.name ?? '', i.quantity, menuItem?.sellingPrice ?? 0];
      });
      const subtotal = items.reduce((sum, [, , qty, price]) => sum + qty * price, 0);
      const newOrder: SaleOrder = {
        id: _nextSaleOrderId++,
        items,
        subtotal,
        discountCodeId: order.discountCodeId,
        discountAmount: 0,
        taxBreakdown: [],
        taxTotal: 0,
        totalAmount: subtotal,
        note: order.note,
        createdAt: Date.now(),
        customerId: order.customerId,
      };
      _saleOrders = [newOrder, ..._saleOrders];

      // Award loyalty points if customer is set
      if (order.customerId !== undefined) {
        const points = Math.floor(subtotal);
        const customer = _customers.find(c => c.id === order.customerId);
        if (customer) {
          _customers = _customers.map(c =>
            c.id === order.customerId
              ? { ...c, loyaltyPoints: c.loyaltyPoints + points }
              : c
          );
          const txn: LoyaltyTransaction = {
            id: _nextLoyaltyTransactionId++,
            customerId: order.customerId,
            points,
            reason: 'Order',
            createdAt: Date.now(),
          };
          _loyaltyTransactions = [..._loyaltyTransactions, txn];
        }
      }

      return {
        orderId: newOrder.id,
        pointsAwarded: order.customerId !== undefined ? Math.floor(subtotal) : 0,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saleOrders'] });
      queryClient.invalidateQueries({ queryKey: ['salesStats'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['loyaltyBalance'] });
      queryClient.invalidateQueries({ queryKey: ['loyaltyTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['customerOrderHistory'] });
    },
  });
}

export function useSalesStats() {
  const { actor, isFetching } = useActor();

  return useQuery<DashboardSalesStats>({
    queryKey: ['salesStats'],
    queryFn: async () => {
      const totalRevenue = _saleOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      const totalOrders = _saleOrders.length;
      return {
        totalRevenue,
        totalOrders,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      };
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Customer hooks (local state only) ───────────────────────────────────────

let _customers: Customer[] = [];
let _nextCustomerId = 1;

export function useCustomers(page = 0, pageSize = 50) {
  const { actor, isFetching } = useActor();

  return useQuery<Customer[]>({
    queryKey: ['customers', page, pageSize],
    queryFn: async () => {
      const start = page * pageSize;
      return _customers.slice(start, start + pageSize);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCustomer(id: number) {
  return useQuery<Customer | null>({
    queryKey: ['customer', id],
    queryFn: async () => _customers.find(c => c.id === id) ?? null,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; email: string; phone: string; address: string; notes: string }) => {
      const newCustomer: Customer = { ...data, id: _nextCustomerId++, createdAt: Date.now(), loyaltyPoints: 0 };
      _customers = [..._customers, newCustomer];
      return newCustomer.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: number; name: string; email: string; phone: string; address: string; notes: string }) => {
      _customers = _customers.map(c => c.id === data.id ? { ...c, ...data } : c);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      _customers = _customers.filter(c => c.id !== id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

// ─── Loyalty Points hooks ─────────────────────────────────────────────────────

let _loyaltyTransactions: LoyaltyTransaction[] = [];
let _nextLoyaltyTransactionId = 1;

export function useLoyaltyBalance(customerId: number) {
  return useQuery<number>({
    queryKey: ['loyaltyBalance', customerId],
    queryFn: async () => {
      const customer = _customers.find(c => c.id === customerId);
      return customer?.loyaltyPoints ?? 0;
    },
    enabled: customerId > 0,
  });
}

export function useLoyaltyTransactions(customerId: number) {
  return useQuery<LoyaltyTransaction[]>({
    queryKey: ['loyaltyTransactions', customerId],
    queryFn: async () => {
      return _loyaltyTransactions
        .filter(t => t.customerId === customerId)
        .sort((a, b) => b.createdAt - a.createdAt);
    },
    enabled: customerId > 0,
  });
}

export function useRedeemLoyaltyPoints() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ customerId, points, discountAmount }: { customerId: number; points: number; discountAmount: number }) => {
      const customer = _customers.find(c => c.id === customerId);
      if (!customer) throw new Error('Customer not found');
      if (customer.loyaltyPoints < points) throw new Error('Insufficient loyalty points');

      _customers = _customers.map(c =>
        c.id === customerId
          ? { ...c, loyaltyPoints: c.loyaltyPoints - points }
          : c
      );

      const txn: LoyaltyTransaction = {
        id: _nextLoyaltyTransactionId++,
        customerId,
        points: -points,
        reason: `Redemption ($${discountAmount.toFixed(2)} discount)`,
        createdAt: Date.now(),
      };
      _loyaltyTransactions = [..._loyaltyTransactions, txn];
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['loyaltyBalance', variables.customerId] });
      queryClient.invalidateQueries({ queryKey: ['loyaltyTransactions', variables.customerId] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

// ─── Customer Order History hook ──────────────────────────────────────────────

export function useCustomerOrderHistory(customerId: number) {
  return useQuery<SaleOrder[]>({
    queryKey: ['customerOrderHistory', customerId],
    queryFn: async () => {
      return _saleOrders
        .filter(o => o.customerId === customerId)
        .sort((a, b) => b.createdAt - a.createdAt);
    },
    enabled: customerId > 0,
  });
}

// ─── Upcoming Deliveries hook ─────────────────────────────────────────────────

export function useUpcomingDeliveries(customerId?: number, daysAhead = 60) {
  return useQuery<UpcomingDelivery[]>({
    queryKey: ['upcomingDeliveries', customerId, daysAhead],
    queryFn: async () => {
      const now = Date.now();
      const cutoff = now + daysAhead * 24 * 60 * 60 * 1000;

      const activeSubscriptions = _subscriptions.filter(s => {
        if (s.status !== 'active') return false;
        if (customerId !== undefined && s.customerId !== customerId) return false;
        return s.nextRenewalDate >= now && s.nextRenewalDate <= cutoff;
      });

      const deliveries: UpcomingDelivery[] = activeSubscriptions.map(sub => {
        const customer = _customers.find(c => c.id === sub.customerId);
        return {
          subscriptionId: sub.id,
          customerId: sub.customerId,
          customerName: customer?.name ?? 'Unknown',
          planName: sub.planName,
          menuItemIds: sub.menuItemIds,
          nextRenewalDate: sub.nextRenewalDate,
          frequencyDays: sub.frequencyDays,
        };
      });

      return deliveries.sort((a, b) => a.nextRenewalDate - b.nextRenewalDate);
    },
  });
}

// ─── Subscription hooks (local state only) ───────────────────────────────────

let _subscriptions: Subscription[] = [];
let _nextSubscriptionId = 1;

export function useSubscriptions(customerId?: number, page = 0, pageSize = 50) {
  const { actor, isFetching } = useActor();

  return useQuery<Subscription[]>({
    queryKey: ['subscriptions', customerId, page, pageSize],
    queryFn: async () => {
      let filtered = _subscriptions;
      if (customerId !== undefined) {
        filtered = filtered.filter(s => s.customerId === customerId);
      }
      const start = page * pageSize;
      return filtered.slice(start, start + pageSize);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSubscription(id: number) {
  return useQuery<Subscription | null>({
    queryKey: ['subscription', id],
    queryFn: async () => _subscriptions.find(s => s.id === id) ?? null,
  });
}

export function useCreateSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      customerId: number;
      planName: string;
      menuItemIds: number[];
      frequencyDays: number;
      startDate: number;
      totalPrice: number;
    }) => {
      const newSub: Subscription = {
        ...data,
        id: _nextSubscriptionId++,
        nextRenewalDate: data.startDate,
        status: 'active',
        createdAt: Date.now(),
      };
      _subscriptions = [..._subscriptions, newSub];
      return newSub.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingDeliveries'] });
    },
  });
}

export function useUpdateSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: number;
      planName: string;
      menuItemIds: number[];
      frequencyDays: number;
      totalPrice: number;
    }) => {
      _subscriptions = _subscriptions.map(s => s.id === data.id ? { ...s, ...data } : s);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingDeliveries'] });
    },
  });
}

export function useUpdateSubscriptionStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: 'active' | 'paused' | 'cancelled' }) => {
      _subscriptions = _subscriptions.map(s => s.id === id ? { ...s, status } : s);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingDeliveries'] });
    },
  });
}

// Convenience aliases for subscription status changes
export function usePauseSubscription() {
  const updateStatus = useUpdateSubscriptionStatus();
  return {
    ...updateStatus,
    mutateAsync: (id: number) => updateStatus.mutateAsync({ id, status: 'paused' }),
    mutate: (id: number) => updateStatus.mutate({ id, status: 'paused' }),
  };
}

export function useResumeSubscription() {
  const updateStatus = useUpdateSubscriptionStatus();
  return {
    ...updateStatus,
    mutateAsync: (id: number) => updateStatus.mutateAsync({ id, status: 'active' }),
    mutate: (id: number) => updateStatus.mutate({ id, status: 'active' }),
  };
}

export function useCancelSubscription() {
  const updateStatus = useUpdateSubscriptionStatus();
  return {
    ...updateStatus,
    mutateAsync: (id: number) => updateStatus.mutateAsync({ id, status: 'cancelled' }),
    mutate: (id: number) => updateStatus.mutate({ id, status: 'cancelled' }),
  };
}

export function useDeleteSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      _subscriptions = _subscriptions.filter(s => s.id !== id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingDeliveries'] });
    },
  });
}

// ─── Alert hooks (local state only) ──────────────────────────────────────────

let _alerts: AlertItem[] = [];
let _nextAlertId = 1;

export function useAlerts() {
  const { actor, isFetching } = useActor();

  return useQuery<AlertItem[]>({
    queryKey: ['alerts'],
    queryFn: async () => [..._alerts].sort((a, b) => b.createdAt - a.createdAt),
    enabled: !!actor && !isFetching,
  });
}

export function useMarkAlertRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      _alerts = _alerts.map(a => a.id === id ? { ...a, isRead: true } : a);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}

export function useMarkAllAlertsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      _alerts = _alerts.map(a => ({ ...a, isRead: true }));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}

export function useCreateAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { alertType: AlertItem['alertType']; message: string; relatedEntityId: number }) => {
      const newAlert: AlertItem = {
        ...data,
        id: _nextAlertId++,
        isRead: false,
        createdAt: Date.now(),
      };
      _alerts = [newAlert, ..._alerts];
      return newAlert.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}

// ─── Supplier hooks (local state only) ───────────────────────────────────────

let _suppliers: Supplier[] = [];
let _nextSupplierId = 1;

export function useSuppliers() {
  const { actor, isFetching } = useActor();

  return useQuery<Supplier[]>({
    queryKey: ['suppliers'],
    queryFn: async () => _suppliers,
    enabled: !!actor && !isFetching,
  });
}

export function useSupplier(id: number) {
  return useQuery<Supplier | null>({
    queryKey: ['supplier', id],
    queryFn: async () => _suppliers.find(s => s.id === id) ?? null,
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSupplierRequest) => {
      const newSupplier: Supplier = { ...data, id: _nextSupplierId++, createdAt: Date.now() };
      _suppliers = [..._suppliers, newSupplier];
      return newSupplier.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: number } & CreateSupplierRequest) => {
      _suppliers = _suppliers.map(s => s.id === data.id ? { ...s, ...data } : s);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      _suppliers = _suppliers.filter(s => s.id !== id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
}

// Auto-generate purchase orders (no-op stub for UI compatibility)
export function useAutoGeneratePurchaseOrders() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Generate purchase orders for low-stock ingredients
      const lowStock = _ingredients.filter(i => i.quantity <= i.lowStockThreshold);
      for (const ingredient of lowStock) {
        const supplier = ingredient.supplierId
          ? _suppliers.find(s => s.id === ingredient.supplierId)
          : _suppliers[0];
        if (!supplier) continue;
        const newOrder: PurchaseOrder = {
          id: _nextPurchaseOrderId++,
          supplierId: supplier.id,
          supplierName: supplier.name,
          items: [{
            ingredientId: ingredient.id,
            ingredientName: ingredient.name,
            quantityOrdered: ingredient.lowStockThreshold * 2,
            unit: ingredient.unit,
          }],
          status: 'pending',
          notes: 'Auto-generated for low stock',
          createdAt: Date.now(),
        };
        _purchaseOrders = [newOrder, ..._purchaseOrders];
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
    },
  });
}

// ─── Purchase Order hooks (local state only) ──────────────────────────────────

let _purchaseOrders: PurchaseOrder[] = [];
let _nextPurchaseOrderId = 1;

export function usePurchaseOrders() {
  const { actor, isFetching } = useActor();

  return useQuery<PurchaseOrder[]>({
    queryKey: ['purchaseOrders'],
    queryFn: async () => [..._purchaseOrders].sort((a, b) => b.createdAt - a.createdAt),
    enabled: !!actor && !isFetching,
  });
}

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      supplierId: number;
      items: { ingredientId: number; quantityOrdered: number }[];
      notes: string;
    }) => {
      const supplier = _suppliers.find(s => s.id === data.supplierId);
      const items: PurchaseOrderItem[] = data.items.map(i => {
        const ingredient = _ingredients.find(ing => ing.id === i.ingredientId);
        return {
          ingredientId: i.ingredientId,
          ingredientName: ingredient?.name ?? '',
          quantityOrdered: i.quantityOrdered,
          unit: ingredient?.unit ?? '',
        };
      });
      const newOrder: PurchaseOrder = {
        id: _nextPurchaseOrderId++,
        supplierId: data.supplierId,
        supplierName: supplier?.name ?? '',
        items,
        status: 'pending',
        notes: data.notes,
        createdAt: Date.now(),
      };
      _purchaseOrders = [newOrder, ..._purchaseOrders];
      return newOrder.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
    },
  });
}

export function useUpdatePurchaseOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: PurchaseOrder['status'] }) => {
      _purchaseOrders = _purchaseOrders.map(o => o.id === id ? { ...o, status } : o);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
    },
  });
}

export function useDeletePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      _purchaseOrders = _purchaseOrders.filter(o => o.id !== id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
    },
  });
}

// ─── Waste Log hooks (local state only) ──────────────────────────────────────

let _wasteLogs: WasteLog[] = [];
let _nextWasteLogId = 1;

export function useWasteLogs() {
  const { actor, isFetching } = useActor();

  return useQuery<WasteLog[]>({
    queryKey: ['wasteLogs'],
    queryFn: async () => [..._wasteLogs].sort((a, b) => b.loggedAt - a.loggedAt),
    enabled: !!actor && !isFetching,
  });
}

export function useWasteStats() {
  const { actor, isFetching } = useActor();

  return useQuery<WasteStats>({
    queryKey: ['wasteStats'],
    queryFn: async () => ({
      totalCostLoss: _wasteLogs.reduce((sum, w) => sum + w.costLoss, 0),
      totalEntries: _wasteLogs.length,
    }),
    enabled: !!actor && !isFetching,
  });
}

export function useCreateWasteLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateWasteLogRequest) => {
      const ingredient = _ingredients.find(i => i.id === data.ingredientId);
      const costLoss = (ingredient?.costPrice ?? 0) * data.quantity;
      const newLog: WasteLog = {
        id: _nextWasteLogId++,
        ingredientId: data.ingredientId,
        ingredientName: ingredient?.name ?? '',
        quantity: data.quantity,
        unit: ingredient?.unit ?? '',
        reason: data.reason,
        costLoss,
        loggedAt: Date.now(),
      };
      _wasteLogs = [newLog, ..._wasteLogs];
      return newLog.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wasteLogs'] });
      queryClient.invalidateQueries({ queryKey: ['wasteStats'] });
    },
  });
}

export function useDeleteWasteLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      _wasteLogs = _wasteLogs.filter(w => w.id !== id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wasteLogs'] });
      queryClient.invalidateQueries({ queryKey: ['wasteStats'] });
    },
  });
}

// ─── Combo Deal hooks (local state only) ─────────────────────────────────────

let _combos: ComboDeal[] = [];
let _nextComboId = 1;

export function useCombos() {
  const { actor, isFetching } = useActor();

  return useQuery<ComboDeal[]>({
    queryKey: ['combos'],
    queryFn: async () => _combos,
    enabled: !!actor && !isFetching,
  });
}

export function useCreateCombo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateComboDealRequest) => {
      const totalIndividualPrice = data.menuItemIds.reduce((sum, id) => {
        const item = _menuItems.find(m => m.id === id);
        return sum + (item?.sellingPrice ?? 0);
      }, 0);
      const newCombo: ComboDeal = {
        ...data,
        id: _nextComboId++,
        isAvailable: true,
        createdAt: Date.now(),
        totalIndividualPrice,
        savings: totalIndividualPrice - data.bundlePrice,
      };
      _combos = [..._combos, newCombo];
      return newCombo.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['combos'] });
    },
  });
}

// Alias for backward compatibility
export const useCreateComboDeal = useCreateCombo;

export function useUpdateCombo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: CreateComboDealRequest }) => {
      const totalIndividualPrice = data.menuItemIds.reduce((sum, itemId) => {
        const item = _menuItems.find(m => m.id === itemId);
        return sum + (item?.sellingPrice ?? 0);
      }, 0);
      _combos = _combos.map(c =>
        c.id === id
          ? { ...c, ...data, totalIndividualPrice, savings: totalIndividualPrice - data.bundlePrice }
          : c
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['combos'] });
    },
  });
}

// Alias for backward compatibility — CombosPage calls updateCombo.mutateAsync({ id, ...form })
export function useUpdateComboDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { id: number; name: string; description: string; menuItemIds: number[]; bundlePrice: number; isAvailable?: boolean }) => {
      const { id, ...data } = payload;
      const totalIndividualPrice = data.menuItemIds.reduce((sum, itemId) => {
        const item = _menuItems.find(m => m.id === itemId);
        return sum + (item?.sellingPrice ?? 0);
      }, 0);
      _combos = _combos.map(c =>
        c.id === id
          ? { ...c, ...data, totalIndividualPrice, savings: totalIndividualPrice - data.bundlePrice }
          : c
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['combos'] });
    },
  });
}

export function useToggleComboAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      _combos = _combos.map(c => c.id === id ? { ...c, isAvailable: !c.isAvailable } : c);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['combos'] });
    },
  });
}

// Alias for backward compatibility
export const useToggleComboDealAvailability = useToggleComboAvailability;

export function useDeleteCombo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      _combos = _combos.filter(c => c.id !== id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['combos'] });
    },
  });
}

// Alias for backward compatibility
export const useDeleteComboDeal = useDeleteCombo;

// ─── Discount Code hooks (local state only) ───────────────────────────────────

export function useDiscountCodes() {
  const { actor, isFetching } = useActor();

  return useQuery<DiscountCode[]>({
    queryKey: ['discountCodes'],
    queryFn: async () => _discountCodes,
    enabled: !!actor && !isFetching,
  });
}

export function useCreateDiscountCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: DiscountCodeInput) => {
      const newCode: DiscountCode = {
        id: _nextDiscountCodeId++,
        code: input.code,
        description: input.description,
        discountType: input.discountType,
        discountValue: input.discountValue,
        minimumOrderAmount: input.minimumOrderAmount,
        maxUses: input.maxUses !== undefined ? Number(input.maxUses) : undefined,
        usedCount: 0,
        isActive: true,
        expiresAt: input.expiresAt !== undefined ? Number(input.expiresAt) : undefined,
        createdAt: Date.now(),
      };
      _discountCodes = [..._discountCodes, newCode];
      return newCode.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discountCodes'] });
    },
  });
}

export function useUpdateDiscountCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: number; input: DiscountCodeInput }) => {
      _discountCodes = _discountCodes.map(dc =>
        dc.id === id
          ? {
              ...dc,
              code: input.code,
              description: input.description,
              discountType: input.discountType,
              discountValue: input.discountValue,
              minimumOrderAmount: input.minimumOrderAmount,
              maxUses: input.maxUses !== undefined ? Number(input.maxUses) : undefined,
              expiresAt: input.expiresAt !== undefined ? Number(input.expiresAt) : undefined,
            }
          : dc
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discountCodes'] });
    },
  });
}

export function useDeleteDiscountCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      _discountCodes = _discountCodes.filter(dc => dc.id !== id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discountCodes'] });
    },
  });
}

export function useToggleDiscountCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      _discountCodes = _discountCodes.map(dc =>
        dc.id === id ? { ...dc, isActive: !dc.isActive } : dc
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discountCodes'] });
    },
  });
}

// Alias for backward compatibility
export const useToggleDiscountCodeActive = useToggleDiscountCode;

export function useApplyDiscountCode() {
  return useMutation({
    mutationFn: async ({ code, orderSubtotal }: { code: string; orderSubtotal: number }) => {
      const dc = _discountCodes.find(d => d.code === code && d.isActive);
      if (!dc) throw new Error('Invalid or inactive discount code');
      if (orderSubtotal < dc.minimumOrderAmount) {
        throw new Error(`Minimum order amount is $${dc.minimumOrderAmount.toFixed(2)}`);
      }
      if (dc.expiresAt && dc.expiresAt < Date.now()) {
        throw new Error('This discount code has expired');
      }
      if (dc.maxUses !== undefined && dc.usedCount >= dc.maxUses) {
        throw new Error('This discount code has reached its usage limit');
      }

      let discountAmount = 0;
      if (dc.discountType === DiscountType.percentage) {
        discountAmount = orderSubtotal * (dc.discountValue / 100);
      } else {
        discountAmount = Math.min(dc.discountValue, orderSubtotal);
      }

      const result: DiscountApplicationResult = {
        discountAmount,
        finalTotal: orderSubtotal - discountAmount,
        discountCode: dc,
      };
      return result;
    },
  });
}

// ─── Tax Config hooks (local state only) ─────────────────────────────────────

export function useTaxConfigs() {
  const { actor, isFetching } = useActor();

  return useQuery<TaxConfig[]>({
    queryKey: ['taxConfigs'],
    queryFn: async () => _taxConfigs,
    enabled: !!actor && !isFetching,
  });
}

export function useCreateTaxConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: TaxConfigInput) => {
      const newConfig: TaxConfig = {
        id: _nextTaxConfigId++,
        name: input.name,
        rate: input.rate,
        isActive: true,
        appliesTo: input.appliesTo,
        createdAt: Date.now(),
      };
      _taxConfigs = [..._taxConfigs, newConfig];
      return newConfig.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxConfigs'] });
    },
  });
}

export function useUpdateTaxConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: number; input: TaxConfigInput }) => {
      _taxConfigs = _taxConfigs.map(tc =>
        tc.id === id ? { ...tc, ...input } : tc
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxConfigs'] });
    },
  });
}

export function useDeleteTaxConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      _taxConfigs = _taxConfigs.filter(tc => tc.id !== id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxConfigs'] });
    },
  });
}

export function useToggleTaxConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      _taxConfigs = _taxConfigs.map(tc =>
        tc.id === id ? { ...tc, isActive: !tc.isActive } : tc
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxConfigs'] });
    },
  });
}

// Alias for backward compatibility
export const useToggleTaxConfigActive = useToggleTaxConfig;

export function useCalculateTax(subtotal: number) {
  return useQuery<TaxCalculationResult>({
    queryKey: ['calculateTax', subtotal],
    queryFn: async () => {
      const activeTaxes = _taxConfigs.filter(tc => tc.isActive);
      const breakdown = activeTaxes.map(tc => ({
        name: tc.name,
        rate: tc.rate,
        amount: subtotal * (tc.rate / 100),
      }));
      const totalTaxAmount = breakdown.reduce((sum, b) => sum + b.amount, 0);
      return { breakdown, totalTaxAmount };
    },
    enabled: subtotal > 0,
  });
}

// ─── Sales Report hooks (local state only) ────────────────────────────────────

export function useSalesReport(period: SalesReportPeriod) {
  const { actor, isFetching } = useActor();

  return useQuery<SalesReport>({
    queryKey: ['salesReport', period],
    queryFn: async () => {
      const now = Date.now();
      let startTime: number;
      let periodLabel: string;

      if (period === SalesReportPeriod.daily) {
        const d = new Date(now);
        d.setHours(0, 0, 0, 0);
        startTime = d.getTime();
        periodLabel = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      } else {
        const d = new Date(now);
        const day = d.getDay();
        d.setDate(d.getDate() - day);
        d.setHours(0, 0, 0, 0);
        startTime = d.getTime();
        const end = new Date(startTime + 6 * 24 * 60 * 60 * 1000);
        periodLabel = `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      }

      const endTime = period === SalesReportPeriod.daily
        ? startTime + 24 * 60 * 60 * 1000
        : startTime + 7 * 24 * 60 * 60 * 1000;

      const periodOrders = _saleOrders.filter(o => o.createdAt >= startTime && o.createdAt < endTime);
      const totalRevenue = periodOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      const totalOrders = periodOrders.length;

      // Aggregate top selling items
      const itemMap = new Map<string, { quantitySold: number; revenue: number }>();
      for (const order of periodOrders) {
        for (const [, name, qty, price] of order.items) {
          const existing = itemMap.get(name) ?? { quantitySold: 0, revenue: 0 };
          itemMap.set(name, {
            quantitySold: existing.quantitySold + qty,
            revenue: existing.revenue + qty * price,
          });
        }
      }

      const topSellingItems = Array.from(itemMap.entries())
        .map(([menuItemName, stats]) => ({ menuItemName, ...stats }))
        .sort((a, b) => b.quantitySold - a.quantitySold)
        .slice(0, 10);

      return {
        periodLabel,
        totalOrders,
        totalRevenue,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        topSellingItems,
      };
    },
    enabled: !!actor && !isFetching,
  });
}
