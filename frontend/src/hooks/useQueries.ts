import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { Principal } from '@dfinity/principal';
import type { StaffRole, AuditLog, StaffAccount, Customer, SaleOrder, DiscountCode, TaxConfig } from '../backend';
import { StaffRole as StaffRoleEnum } from '../backend';
import { useInternetIdentity } from './useInternetIdentity';

// ─── Re-export backend types ──────────────────────────────────────────────────
export type { StaffAccount, AuditLog, Customer, SaleOrder, DiscountCode, TaxConfig };
export { StaffRoleEnum };

// ─── UserProfile ──────────────────────────────────────────────────────────────

export interface UserProfile {
  name: string;
  principal: string;
}

// ─── Ingredient (local) ───────────────────────────────────────────────────────

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
  id: number;
  name: string;
  quantity: number;
  unit: string;
  costPrice: number;
  supplierId?: number;
  lowStockThreshold: number;
  expiryDate?: number;
}

// ─── Supplier (local) ─────────────────────────────────────────────────────────

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

// ─── MenuItem (local) ─────────────────────────────────────────────────────────

export interface MenuItem {
  id: number;
  name: string;
  description: string;
  sellingPrice: number;
  costPerServing: number;
  isAvailable: boolean;
  ingredients: [string, number][];
  availableFromHour?: number;
  availableToHour?: number;
  availableDays?: number[];
  createdAt: number;
}

// ─── ComboDeal (local) ────────────────────────────────────────────────────────

export interface ComboDeal {
  id: number;
  name: string;
  description: string;
  menuItemIds: number[];
  bundlePrice: number;
  isAvailable: boolean;
  totalIndividualPrice: number;
  savings: number;
  createdAt: number;
}

// ─── PurchaseOrder (local) ────────────────────────────────────────────────────

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
  status: PurchaseOrderStatus;
  notes: string;
  createdAt: number;
}

export enum PurchaseOrderStatus {
  pending = 'pending',
  received = 'received',
  cancelled = 'cancelled',
}

// ─── WasteLog (local) ─────────────────────────────────────────────────────────

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

export interface WasteStats {
  totalCostLoss: number;
  totalEntries: number;
}

// ─── Alert (local) ────────────────────────────────────────────────────────────

export interface AlertItem {
  id: number;
  alertType: AlertType;
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

// ─── Subscription (local) ─────────────────────────────────────────────────────

export interface Subscription {
  id: number;
  customerId: number;
  planName: string;
  menuItemIds: number[];
  frequencyDays: number;
  startDate: number;
  nextRenewalDate: number;
  status: SubscriptionStatus;
  totalPrice: number;
  createdAt: number;
}

export enum SubscriptionStatus {
  active = 'active',
  paused = 'paused',
  cancelled = 'cancelled',
}

// ─── UpcomingDelivery (local) ─────────────────────────────────────────────────

export interface UpcomingDelivery {
  subscriptionId: number;
  customerId: number;
  customerName: string;
  planName: string;
  menuItemIds: number[];
  nextRenewalDate: number;
  frequencyDays: number;
}

// ─── Discount / Tax types ─────────────────────────────────────────────────────

export enum DiscountType {
  percentage = 'percentage',
  fixed = 'fixed',
}

export enum TaxAppliesTo {
  all = 'all',
  menuItems = 'menuItems',
  combos = 'combos',
}

export interface DiscountCodeInput {
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  minimumOrderAmount: number;
  maxUses?: number;
  expiresAt?: number;
}

export interface TaxConfigInput {
  name: string;
  rate: number;
  appliesTo: TaxAppliesTo;
}

export interface DiscountApplicationResult {
  discountAmount: number;
  finalTotal: number;
  discountCode: DiscountCode;
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

// ─── Sales Report types ───────────────────────────────────────────────────────

export type SalesReportPeriod = 'daily' | 'weekly';

export interface DashboardSalesStats {
  todayRevenue: number;
  todayOrders: number;
  weekRevenue: number;
  weekOrders: number;
  totalOrders: number;
}

// ─── Local in-memory stores ───────────────────────────────────────────────────

let _ingredients: Ingredient[] = [];
let _ingredientNextId = 1;

let _suppliers: Supplier[] = [];
let _supplierNextId = 1;

let _menuItems: MenuItem[] = [];
let _menuItemNextId = 1;

let _combos: ComboDeal[] = [];
let _comboNextId = 1;

let _purchaseOrders: PurchaseOrder[] = [];
let _purchaseOrderNextId = 1;

let _wasteLogs: WasteLog[] = [];
let _wasteLogNextId = 1;

let _alerts: AlertItem[] = [];
let _alertNextId = 1;

let _subscriptions: Subscription[] = [];
let _subscriptionNextId = 1;

// ─── localStorage helpers for user profile ────────────────────────────────────

const PROFILE_STORAGE_KEY = 'kitchenos_user_profiles';

function getStoredProfile(principalId: string): UserProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return null;
    const profiles: Record<string, UserProfile> = JSON.parse(raw);
    return profiles[principalId] ?? null;
  } catch {
    return null;
  }
}

function saveStoredProfile(profile: UserProfile): void {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    const profiles: Record<string, UserProfile> = raw ? JSON.parse(raw) : {};
    profiles[profile.principal] = profile;
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profiles));
  } catch {
    // ignore storage errors
  }
}

// ─── Admin / Auth hooks ───────────────────────────────────────────────────────

export function useAdminPrincipal() {
  const { actor, isFetching } = useActor();
  return useQuery<string | null>({
    queryKey: ['adminPrincipal'],
    queryFn: async () => {
      if (!actor) return null;
      try {
        const isAdmin = await actor.isCallerAdmin();
        return isAdmin ? 'current-user' : null;
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ['isCallerAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      try {
        return await actor.isCallerAdmin();
      } catch {
        return false;
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useReassignAdmin() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newAdminPrincipal: string) => {
      if (!actor) throw new Error('Actor not available');
      await actor.assignCallerUserRole(Principal.fromText(newAdminPrincipal), 'admin' as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPrincipal'] });
      queryClient.invalidateQueries({ queryKey: ['isCallerAdmin'] });
    },
  });
}

export function useVacateAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      // No direct vacate method in backend
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPrincipal'] });
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
      await actor.assignCallerUserRole(Principal.fromText('2vxsx-fae'), 'admin' as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPrincipal'] });
      queryClient.invalidateQueries({ queryKey: ['isCallerAdmin'] });
    },
  });
}

// ─── User Profile ─────────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  const principalId = identity?.getPrincipal().toString() ?? null;

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile', principalId],
    queryFn: async () => {
      if (!principalId) return null;
      return getStoredProfile(principalId);
    },
    enabled: !!actor && !actorFetching && !!principalId,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && !!principalId && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      const principalId = identity?.getPrincipal().toString();
      if (!principalId) throw new Error('Not authenticated');
      const profileWithPrincipal: UserProfile = { ...profile, principal: principalId };
      saveStoredProfile(profileWithPrincipal);
      return profileWithPrincipal;
    },
    onSuccess: () => {
      const principalId = identity?.getPrincipal().toString();
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile', principalId] });
    },
  });
}

// ─── Ingredients ──────────────────────────────────────────────────────────────

export function useIngredients() {
  return useQuery<Ingredient[]>({
    queryKey: ['ingredients'],
    queryFn: async () => [..._ingredients],
    staleTime: 0,
  });
}

export function useCreateIngredient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (req: CreateIngredientRequest) => {
      const ingredient: Ingredient = { ...req, id: _ingredientNextId++, createdAt: Date.now() };
      _ingredients.push(ingredient);
      return ingredient;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
    },
  });
}

export function useUpdateIngredient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (req: UpdateIngredientRequest) => {
      _ingredients = _ingredients.map(i => i.id === req.id ? { ...i, ...req } : i);
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

// ─── Suppliers ────────────────────────────────────────────────────────────────

export function useSuppliers() {
  return useQuery<Supplier[]>({
    queryKey: ['suppliers'],
    queryFn: async () => [..._suppliers],
    staleTime: 0,
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<Supplier, 'id' | 'createdAt'>) => {
      const supplier: Supplier = { ...data, id: _supplierNextId++, createdAt: Date.now() };
      _suppliers.push(supplier);
      return supplier;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Supplier) => {
      _suppliers = _suppliers.map(s => s.id === data.id ? data : s);
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

export function useAutoGeneratePurchaseOrders() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const lowStock = _ingredients.filter(i => i.quantity <= i.lowStockThreshold);
      for (const ing of lowStock) {
        const supplier = ing.supplierId ? _suppliers.find(s => s.id === ing.supplierId) : _suppliers[0];
        if (!supplier) continue;
        const reorderQty = ing.lowStockThreshold * 2;
        const po: PurchaseOrder = {
          id: _purchaseOrderNextId++,
          supplierId: supplier.id,
          supplierName: supplier.name,
          items: [{
            ingredientId: ing.id,
            ingredientName: ing.name,
            quantityOrdered: reorderQty,
            unit: ing.unit,
          }],
          status: PurchaseOrderStatus.pending,
          notes: `Auto-generated for low stock: ${ing.name}`,
          createdAt: Date.now(),
        };
        _purchaseOrders.push(po);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
    },
  });
}

// ─── Menu Items ───────────────────────────────────────────────────────────────

export function useMenuItems() {
  return useQuery<MenuItem[]>({
    queryKey: ['menuItems'],
    queryFn: async () => [..._menuItems],
    staleTime: 0,
  });
}

export function useAvailableMenuItems() {
  return useQuery<MenuItem[]>({
    queryKey: ['availableMenuItems'],
    queryFn: async () => _menuItems.filter(m => m.isAvailable),
    staleTime: 0,
  });
}

export function useCreateMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<MenuItem, 'id' | 'createdAt'>) => {
      const item: MenuItem = { ...data, id: _menuItemNextId++, createdAt: Date.now() };
      _menuItems.push(item);
      return item;
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
    mutationFn: async (data: MenuItem) => {
      _menuItems = _menuItems.map(m => m.id === data.id ? data : m);
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

// ─── Combo Deals ──────────────────────────────────────────────────────────────

export function useCombos() {
  return useQuery<ComboDeal[]>({
    queryKey: ['combos'],
    queryFn: async () => [..._combos],
    staleTime: 0,
  });
}

export function useCreateCombo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<ComboDeal, 'id' | 'createdAt'>) => {
      const combo: ComboDeal = { ...data, id: _comboNextId++, createdAt: Date.now() };
      _combos.push(combo);
      return combo;
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
    mutationFn: async (data: ComboDeal) => {
      _combos = _combos.map(c => c.id === data.id ? data : c);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['combos'] });
    },
  });
}

// Alias for backward compatibility
export const useUpdateComboDeal = useUpdateCombo;

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

// ─── Purchase Orders ──────────────────────────────────────────────────────────

export function usePurchaseOrders() {
  return useQuery<PurchaseOrder[]>({
    queryKey: ['purchaseOrders'],
    queryFn: async () => [..._purchaseOrders],
    staleTime: 0,
  });
}

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<PurchaseOrder, 'id' | 'createdAt'>) => {
      const po: PurchaseOrder = { ...data, id: _purchaseOrderNextId++, createdAt: Date.now() };
      _purchaseOrders.push(po);
      return po;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
    },
  });
}

export function useUpdatePurchaseOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: PurchaseOrderStatus }) => {
      _purchaseOrders = _purchaseOrders.map(po =>
        po.id === id ? { ...po, status } : po
      );
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
      _purchaseOrders = _purchaseOrders.filter(po => po.id !== id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
    },
  });
}

// ─── Waste Logs ───────────────────────────────────────────────────────────────

export function useWasteLogs() {
  return useQuery<WasteLog[]>({
    queryKey: ['wasteLogs'],
    queryFn: async () => [..._wasteLogs],
    staleTime: 0,
  });
}

export function useWasteStats() {
  return useQuery<WasteStats>({
    queryKey: ['wasteStats'],
    queryFn: async () => ({
      totalCostLoss: _wasteLogs.reduce((sum, w) => sum + w.costLoss, 0),
      totalEntries: _wasteLogs.length,
    }),
    staleTime: 0,
  });
}

export function useCreateWasteLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { ingredientId: number; quantity: number; reason: string }) => {
      const ingredient = _ingredients.find(i => i.id === data.ingredientId);
      const log: WasteLog = {
        id: _wasteLogNextId++,
        ingredientId: data.ingredientId,
        ingredientName: ingredient?.name ?? `Ingredient #${data.ingredientId}`,
        quantity: data.quantity,
        unit: ingredient?.unit ?? '',
        reason: data.reason,
        costLoss: (ingredient?.costPrice ?? 0) * data.quantity,
        loggedAt: Date.now(),
      };
      _wasteLogs.push(log);
      return log;
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

// ─── Alerts ───────────────────────────────────────────────────────────────────

export function useAlerts() {
  return useQuery<AlertItem[]>({
    queryKey: ['alerts'],
    queryFn: async () => [..._alerts],
    staleTime: 0,
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
    mutationFn: async (data: Omit<AlertItem, 'id' | 'createdAt' | 'isRead'>) => {
      const alert: AlertItem = { ...data, id: _alertNextId++, isRead: false, createdAt: Date.now() };
      _alerts.push(alert);
      return alert;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}

// ─── Subscriptions ────────────────────────────────────────────────────────────

export function useSubscriptions() {
  return useQuery<Subscription[]>({
    queryKey: ['subscriptions'],
    queryFn: async () => [..._subscriptions],
    staleTime: 0,
  });
}

export function useCreateSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<Subscription, 'id' | 'createdAt'>) => {
      const sub: Subscription = { ...data, id: _subscriptionNextId++, createdAt: Date.now() };
      _subscriptions.push(sub);
      return sub;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });
}

export function useUpdateSubscriptionStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: SubscriptionStatus }) => {
      _subscriptions = _subscriptions.map(s =>
        s.id === id ? { ...s, status } : s
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });
}

export function usePauseSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      _subscriptions = _subscriptions.map(s =>
        s.id === id ? { ...s, status: SubscriptionStatus.paused } : s
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });
}

export function useResumeSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      _subscriptions = _subscriptions.map(s =>
        s.id === id ? { ...s, status: SubscriptionStatus.active } : s
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      _subscriptions = _subscriptions.map(s =>
        s.id === id ? { ...s, status: SubscriptionStatus.cancelled } : s
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });
}

export function useDeleteSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      _subscriptions = _subscriptions.filter(s => s.id !== id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });
}

// ─── Upcoming Deliveries (derived from subscriptions) ─────────────────────────

export function useUpcomingDeliveries() {
  return useQuery<UpcomingDelivery[]>({
    queryKey: ['upcomingDeliveries'],
    queryFn: async () => {
      const activeSubscriptions = _subscriptions.filter(s => s.status === SubscriptionStatus.active);
      return activeSubscriptions.map(sub => {
        const customer = _suppliers.find(() => false); // no customer store here
        return {
          subscriptionId: sub.id,
          customerId: sub.customerId,
          customerName: `Customer #${sub.customerId}`,
          planName: sub.planName,
          menuItemIds: sub.menuItemIds,
          nextRenewalDate: sub.nextRenewalDate,
          frequencyDays: sub.frequencyDays,
        };
      });
    },
    staleTime: 0,
  });
}

// ─── Sales Stats (derived from backend sale orders) ───────────────────────────

export function useSalesStats() {
  const { actor, isFetching } = useActor();
  return useQuery<DashboardSalesStats>({
    queryKey: ['salesStats'],
    queryFn: async () => {
      if (!actor) return { todayRevenue: 0, todayOrders: 0, weekRevenue: 0, weekOrders: 0, totalOrders: 0 };
      try {
        const orders = await actor.getSaleOrders();
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 7);

        let todayRevenue = 0, todayOrders = 0, weekRevenue = 0, weekOrders = 0;
        for (const order of orders) {
          const ts = Number(order.createdAt) / 1_000_000;
          if (ts >= todayStart.getTime()) {
            todayRevenue += order.totalAmount;
            todayOrders++;
          }
          if (ts >= weekStart.getTime()) {
            weekRevenue += order.totalAmount;
            weekOrders++;
          }
        }
        return { todayRevenue, todayOrders, weekRevenue, weekOrders, totalOrders: orders.length };
      } catch {
        return { todayRevenue: 0, todayOrders: 0, weekRevenue: 0, weekOrders: 0, totalOrders: 0 };
      }
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Sales Report ─────────────────────────────────────────────────────────────

export interface SalesReportEntry {
  period: string;
  revenue: number;
  orders: number;
}

export function useSalesReport(period: SalesReportPeriod) {
  const { actor, isFetching } = useActor();
  return useQuery<SalesReportEntry[]>({
    queryKey: ['salesReport', period],
    queryFn: async () => {
      if (!actor) return [];
      try {
        const orders = await actor.getSaleOrders();
        const map = new Map<string, { revenue: number; orders: number }>();
        for (const order of orders) {
          const ts = Number(order.createdAt) / 1_000_000;
          const date = new Date(ts);
          let key: string;
          if (period === 'daily') {
            key = date.toISOString().slice(0, 10);
          } else {
            const weekNum = Math.floor(ts / (7 * 24 * 60 * 60 * 1000));
            key = `Week ${weekNum}`;
          }
          const existing = map.get(key) ?? { revenue: 0, orders: 0 };
          map.set(key, { revenue: existing.revenue + order.totalAmount, orders: existing.orders + 1 });
        }
        return Array.from(map.entries())
          .map(([p, data]) => ({ period: p, ...data }))
          .sort((a, b) => a.period.localeCompare(b.period));
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Discount Codes (backend) ─────────────────────────────────────────────────

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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: DiscountCodeInput) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createDiscountCode({
        ...input,
        maxUses: input.maxUses != null ? BigInt(input.maxUses) : undefined,
        expiresAt: input.expiresAt != null ? BigInt(input.expiresAt) : undefined,
      } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discountCodes'] });
    },
  });
}

export function useUpdateDiscountCode() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: bigint; input: DiscountCodeInput }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateDiscountCode(id, {
        ...input,
        maxUses: input.maxUses != null ? BigInt(input.maxUses) : undefined,
        expiresAt: input.expiresAt != null ? BigInt(input.expiresAt) : undefined,
      } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discountCodes'] });
    },
  });
}

export function useToggleDiscountCode() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.toggleDiscountCode(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discountCodes'] });
    },
  });
}

export function useDeleteDiscountCode() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteDiscountCode(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discountCodes'] });
    },
  });
}

export function useApplyDiscountCode() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({ code, orderTotal }: { code: string; orderTotal: number }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.applyDiscountCode(code, orderTotal);
    },
  });
}

// ─── Tax Configs (backend) ────────────────────────────────────────────────────

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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: TaxConfigInput) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createTaxConfig(input as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxConfigs'] });
    },
  });
}

export function useUpdateTaxConfig() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: bigint; input: TaxConfigInput }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateTaxConfig(id, input as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxConfigs'] });
    },
  });
}

export function useToggleTaxConfig() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.toggleTaxConfig(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxConfigs'] });
    },
  });
}

export function useDeleteTaxConfig() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteTaxConfig(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxConfigs'] });
    },
  });
}

export function useCalculateTax() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({ subtotal, targetType }: { subtotal: number; targetType: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.calculateTax(subtotal, targetType);
    },
  });
}

// ─── Sale Orders (backend) ────────────────────────────────────────────────────

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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      items: Array<{ itemId: number; quantity: number; price: number }>;
      subtotal: number;
      totalAmount: number;
      discountAmount: number;
      taxBreakdown: TaxBreakdown[];
      taxTotal: number;
      note: string;
      discountCodeId?: bigint;
      customerId?: bigint;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createSaleOrder(
        params.items.map(i => ({ itemId: BigInt(i.itemId), quantity: BigInt(i.quantity), price: i.price })),
        params.subtotal,
        params.totalAmount,
        params.discountAmount,
        params.taxBreakdown,
        params.taxTotal,
        params.note,
        params.discountCodeId ?? null,
        params.customerId ?? null,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saleOrders'] });
      queryClient.invalidateQueries({ queryKey: ['salesStats'] });
    },
  });
}

export function useDeleteSaleOrder() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteSaleOrder(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saleOrders'] });
      queryClient.invalidateQueries({ queryKey: ['salesStats'] });
    },
  });
}

// ─── Customers (backend) ──────────────────────────────────────────────────────

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

export function useCustomer(id: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery<Customer | null>({
    queryKey: ['customer', id.toString()],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCustomer(id);
    },
    enabled: !!actor && !isFetching,
  });
}

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

export function useRedeemLoyaltyPoints() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ customerId, points, discountAmount }: { customerId: bigint; points: bigint; discountAmount: number }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.redeemLoyaltyPoints(customerId, points, discountAmount);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['loyaltyBalance', variables.customerId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['loyaltyTransactions', variables.customerId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

export function useCreateCustomer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, email, phone }: { name: string; email: string; phone: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createCustomer(name, email, phone);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

export function useUpdateCustomer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name, email, phone }: { id: bigint; name: string; email: string; phone: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateCustomer(id, name, email, phone);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

export function useDeleteCustomer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteCustomer(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

export function useLoyaltyTransactions(customerId: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ['loyaltyTransactions', customerId.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getLoyaltyTransactions(customerId);
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Staff Accounts (backend) ─────────────────────────────────────────────────

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

export function useStaffAccount(id: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery<StaffAccount | null>({
    queryKey: ['staffAccount', id.toString()],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getStaffAccount(id);
    },
    enabled: !!actor && !isFetching,
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

export function useCreateStaffAccount() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ principal, name, role }: { principal: string; name: string; role: StaffRole }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createStaffAccount(Principal.fromText(principal), name, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffAccounts'] });
    },
  });
}

export function useUpdateStaffAccount() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name, role, isActive }: { id: bigint; name: string; role: StaffRole; isActive: boolean }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateStaffAccount(id, name, role, isActive);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffAccounts'] });
    },
  });
}

export function useDeleteStaffAccount() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteStaffAccount(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffAccounts'] });
    },
  });
}

// ─── Audit Logs (backend) ─────────────────────────────────────────────────────

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
