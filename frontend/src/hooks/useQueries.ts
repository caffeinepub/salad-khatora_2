import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useActor } from "./useActor";
import { Principal } from "@dfinity/principal";
import {
  StaffRole,
  TaxAppliesTo,
  TaxConfigInput as BackendTaxConfigInput,
  DiscountCodeInput as BackendDiscountCodeInput,
  SaleOrderItem,
  TaxBreakdown,
  PaymentMode,
} from "../backend";
import type { DiscountCode as BackendDiscountCode, TaxConfig as BackendTaxConfig } from "../backend";

// ─── Re-export backend types ──────────────────────────────────────────────────
export type { BackendDiscountCode as DiscountCode, BackendTaxConfig as TaxConfig };
export { StaffRole, TaxAppliesTo };
export type { PaymentMode };

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum DiscountType {
  percentage = "percentage",
  fixed = "fixed",
}

export type SalesReportPeriod = "daily" | "weekly";

// ─── Local Types (frontend-only features) ────────────────────────────────────

export interface Ingredient {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  costPrice: number;
  lowStockThreshold: number;
  supplierId?: number;
  expiryDate?: number;
  createdAt: number;
}

export interface CreateIngredientRequest {
  name: string;
  quantity: number;
  unit: string;
  costPrice: number;
  lowStockThreshold: number;
  supplierId?: number;
  expiryDate?: number;
}

export interface UpdateIngredientRequest extends CreateIngredientRequest {
  id: number;
}

export interface MenuItem {
  id: number;
  name: string;
  description: string;
  sellingPrice: number;
  costPerServing: number;
  category?: string;
  isAvailable: boolean;
  ingredients: [string, number][];
  availableFromHour?: number;
  availableToHour?: number;
  availableDays?: number[];
  createdAt: number;
}

export interface ComboDeal {
  id: number;
  name: string;
  description: string;
  menuItemIds: number[];
  bundlePrice: number;
  totalIndividualPrice: number;
  savings: number;
  isAvailable: boolean;
  createdAt: number;
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
  topWastedIngredient: string;
}

export enum AlertType {
  lowStock = "lowStock",
  subscriptionRenewal = "subscriptionRenewal",
  expiryWarning = "expiryWarning",
}

export interface Alert {
  id: number;
  alertType: AlertType;
  message: string;
  ingredientId?: number;
  isRead: boolean;
  createdAt: number;
}

export interface Subscription {
  id: number;
  customerId: number;
  planName: string;
  menuItemIds: number[];
  frequencyDays: number;
  totalPrice: number;
  status: SubscriptionStatus;
  nextRenewalDate: number;
  startDate: number;
  createdAt: number;
}

export enum SubscriptionStatus {
  active = "active",
  paused = "paused",
  cancelled = "cancelled",
}

export interface UpcomingDelivery {
  id: number;
  customerId: number;
  subscriptionId: number;
  planName: string;
  menuItemIds: number[];
  frequencyDays: number;
  nextRenewalDate: number;
  status: string;
}

// ─── Local Storage Keys ───────────────────────────────────────────────────────

const INGREDIENTS_KEY = "kitchenos_ingredients";
const MENU_ITEMS_KEY = "kitchenos_menu_items";
const COMBOS_KEY = "kitchenos_combos";
const SUPPLIERS_KEY = "kitchenos_suppliers";
const WASTE_LOGS_KEY = "kitchenos_waste_logs";
const ALERTS_KEY = "kitchenos_alerts_read";
const SUBSCRIPTIONS_KEY = "kitchenos_subscriptions";

function getLocal<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLocal<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // ignore
  }
}

function nextId<T extends { id: number }>(items: T[]): number {
  return items.length === 0 ? 1 : Math.max(...items.map((i) => i.id)) + 1;
}

// ─── Error helpers ────────────────────────────────────────────────────────────

export function extractIcpError(err: unknown): string {
  if (!err) return "An unknown error occurred";
  const msg = (err as any)?.message ?? String(err);
  const rejectMatch = msg.match(/Reject message:\s*(.+?)(?:\n|$)/i);
  if (rejectMatch) return rejectMatch[1].trim();
  const canisterMatch = msg.match(/Error from Canister[^:]*:\s*(.+?)(?:\n|$)/i);
  if (canisterMatch) return canisterMatch[1].trim();
  return msg;
}

// ─── User Profile ─────────────────────────────────────────────────────────────

export interface UserProfile {
  name: string;
  principal: string;
}

const PROFILE_STORAGE_KEY = "kitchenos_user_profiles";

function saveStoredProfile(profile: UserProfile): void {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    const profiles: Record<string, UserProfile> = raw ? JSON.parse(raw) : {};
    profiles[profile.principal] = profile;
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profiles));
  } catch {
    // ignore
  }
}

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      try {
        const stored = localStorage.getItem("userProfile_v2");
        if (stored) return JSON.parse(stored) as UserProfile;
        return null;
      } catch {
        return null;
      }
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      localStorage.setItem("userProfile_v2", JSON.stringify(profile));
      if (profile.principal) {
        saveStoredProfile(profile);
      }
      return profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

// ─── Admin hooks ──────────────────────────────────────────────────────────────

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isCallerAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useReassignAdmin() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newPrincipalText: string) => {
      if (!actor) throw new Error("Actor not available");
      if (isFetching) throw new Error("Actor is still initializing, please try again.");
      const principal = Principal.fromText(newPrincipalText);
      return actor.assignCallerUserRole(principal, { admin: null } as never);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["isCallerAdmin"] });
    },
  });
}

export function useVacateAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["isCallerAdmin"] });
    },
  });
}

export function useClaimAdminIfVacant() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      if (isFetching) throw new Error("Actor is still initializing, please try again.");
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["isCallerAdmin"] });
    },
  });
}

// ─── Staff Accounts ───────────────────────────────────────────────────────────

export function useStaffAccounts() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["staffAccounts"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getStaffAccounts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateStaffAccount() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      principal,
      name,
      role,
    }: {
      principal: string;
      name: string;
      role: StaffRole;
    }) => {
      if (!actor) throw new Error("Actor not available");
      if (isFetching) throw new Error("Actor is still initializing, please try again.");
      return actor.createStaffAccount(Principal.fromText(principal), name, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staffAccounts"] });
    },
  });
}

export function useUpdateStaffAccount() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      name,
      role,
      isActive,
    }: {
      id: bigint;
      name: string;
      role: StaffRole;
      isActive: boolean;
    }) => {
      if (!actor) throw new Error("Actor not available");
      if (isFetching) throw new Error("Actor is still initializing, please try again.");
      return actor.updateStaffAccount(id, name, role, isActive);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staffAccounts"] });
    },
  });
}

export function useDeleteStaffAccount() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not available");
      if (isFetching) throw new Error("Actor is still initializing, please try again.");
      return actor.deleteStaffAccount(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staffAccounts"] });
    },
  });
}

// ─── Audit Logs ───────────────────────────────────────────────────────────────

export function useAuditLogs(limit: number = 20, offset: number = 0) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["auditLogs", limit, offset],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAuditLogs(BigInt(limit), BigInt(offset));
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Tax Configurations ───────────────────────────────────────────────────────

export type { BackendTaxConfigInput as TaxConfigInput };

export function useTaxConfigs() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["taxConfigs"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTaxConfigs();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateTaxConfig() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();
  return {
    ...useMutation({
      mutationFn: async (input: BackendTaxConfigInput) => {
        if (!actor) throw new Error("Actor not available");
        if (isFetching) throw new Error("Actor is still initializing, please try again.");
        return actor.createTaxConfig(input);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["taxConfigs"] });
      },
    }),
    isActorReady: !!actor && !isFetching,
  };
}

export function useUpdateTaxConfig() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();
  return {
    ...useMutation({
      mutationFn: async ({
        id,
        input,
      }: {
        id: bigint;
        input: BackendTaxConfigInput;
      }) => {
        if (!actor) throw new Error("Actor not available");
        if (isFetching) throw new Error("Actor is still initializing, please try again.");
        return actor.updateTaxConfig(id, input);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["taxConfigs"] });
      },
    }),
    isActorReady: !!actor && !isFetching,
  };
}

export function useToggleTaxConfig() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not available");
      if (isFetching) throw new Error("Actor is still initializing, please try again.");
      return actor.toggleTaxConfig(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taxConfigs"] });
    },
  });
}

export function useDeleteTaxConfig() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not available");
      if (isFetching) throw new Error("Actor is still initializing, please try again.");
      return actor.deleteTaxConfig(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taxConfigs"] });
    },
  });
}

// ─── Discount Codes ───────────────────────────────────────────────────────────

export type { BackendDiscountCodeInput as DiscountCodeInput };

export function useDiscountCodes() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["discountCodes"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getDiscountCodes();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateDiscountCode() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: BackendDiscountCodeInput) => {
      if (!actor) throw new Error("Actor not available");
      if (isFetching) throw new Error("Actor is still initializing, please try again.");
      return actor.createDiscountCode(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discountCodes"] });
    },
  });
}

export function useUpdateDiscountCode() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: bigint;
      input: BackendDiscountCodeInput;
    }) => {
      if (!actor) throw new Error("Actor not available");
      if (isFetching) throw new Error("Actor is still initializing, please try again.");
      return actor.updateDiscountCode(id, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discountCodes"] });
    },
  });
}

export function useToggleDiscountCode() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not available");
      if (isFetching) throw new Error("Actor is still initializing, please try again.");
      return actor.toggleDiscountCode(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discountCodes"] });
    },
  });
}

export function useDeleteDiscountCode() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not available");
      if (isFetching) throw new Error("Actor is still initializing, please try again.");
      return actor.deleteDiscountCode(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discountCodes"] });
    },
  });
}

// ─── Sale Orders ──────────────────────────────────────────────────────────────

export function useSaleOrders() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["saleOrders"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getSaleOrders();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateSaleOrder() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      items,
      subtotal,
      totalAmount,
      discountAmount,
      taxBreakdown,
      taxTotal,
      note,
      discountCodeId,
      customerId,
      paymentType,
    }: {
      items: { itemId: number; quantity: number; price: number }[];
      subtotal: number;
      totalAmount: number;
      discountAmount: number;
      taxBreakdown: TaxBreakdown[];
      taxTotal: number;
      note: string;
      discountCodeId?: number;
      customerId?: number;
      paymentType: PaymentMode;
    }) => {
      if (!actor) throw new Error("Actor not available");
      if (isFetching) throw new Error("Actor is still initializing, please try again.");
      const backendItems: SaleOrderItem[] = items.map((item) => ({
        itemId: BigInt(item.itemId),
        quantity: BigInt(item.quantity),
        price: item.price,
      }));
      return actor.createSaleOrder(
        backendItems,
        subtotal,
        totalAmount,
        discountAmount,
        taxBreakdown,
        taxTotal,
        note,
        discountCodeId !== undefined ? BigInt(discountCodeId) : null,
        customerId !== undefined ? BigInt(customerId) : null,
        paymentType,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saleOrders"] });
    },
  });
}

export function useDeleteSaleOrder() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not available");
      if (isFetching) throw new Error("Actor is still initializing, please try again.");
      return actor.deleteSaleOrder(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saleOrders"] });
    },
  });
}

// ─── Customers ────────────────────────────────────────────────────────────────

export function useCustomers() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCustomers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateCustomer() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      mobileNo,
      email,
      preference,
      address,
    }: {
      name: string;
      mobileNo: string;
      email?: string;
      preference: string;
      address: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      if (isFetching) throw new Error("Actor is still initializing, please try again.");
      return actor.addCustomer(name, mobileNo, email ?? null, preference, address);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

export function useUpdateCustomer() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      name,
      mobileNo,
      email,
      preference,
      address,
    }: {
      id: bigint;
      name: string;
      mobileNo: string;
      email?: string;
      preference: string;
      address: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      if (isFetching) throw new Error("Actor is still initializing, please try again.");
      return actor.updateCustomer(id, name, mobileNo, email ?? null, preference, address);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

export function useDeleteCustomer() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not available");
      if (isFetching) throw new Error("Actor is still initializing, please try again.");
      return actor.deleteCustomer(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

// ─── Loyalty ──────────────────────────────────────────────────────────────────

export function useLoyaltyBalance(customerId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["loyaltyBalance", customerId?.toString()],
    queryFn: async () => {
      if (!actor || customerId === null) return BigInt(0);
      return actor.getLoyaltyBalance(customerId);
    },
    enabled: !!actor && !isFetching && customerId !== null,
  });
}

export function useLoyaltyTransactions(customerId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["loyaltyTransactions", customerId?.toString()],
    queryFn: async () => {
      if (!actor || customerId === null) return [];
      return actor.getLoyaltyTransactions(customerId);
    },
    enabled: !!actor && !isFetching && customerId !== null,
  });
}

export function useRedeemLoyaltyPoints() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      customerId,
      points,
      discountAmount,
    }: {
      customerId: bigint;
      points: bigint;
      discountAmount: number;
    }) => {
      if (!actor) throw new Error("Actor not available");
      if (isFetching) throw new Error("Actor is still initializing, please try again.");
      return actor.redeemLoyaltyPoints(customerId, points, discountAmount);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["loyaltyBalance", variables.customerId.toString()] });
      queryClient.invalidateQueries({ queryKey: ["loyaltyTransactions", variables.customerId.toString()] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

export function useCustomerOrderHistory(customerId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["customerOrderHistory", customerId?.toString()],
    queryFn: async () => {
      if (!actor || customerId === null) return [];
      return actor.getCustomerOrderHistory(customerId);
    },
    enabled: !!actor && !isFetching && customerId !== null,
  });
}

// ─── Ingredients (localStorage) ───────────────────────────────────────────────

export function useIngredients() {
  return useQuery<Ingredient[]>({
    queryKey: [INGREDIENTS_KEY],
    queryFn: () => getLocal<Ingredient>(INGREDIENTS_KEY),
    staleTime: 0,
  });
}

export function useCreateIngredient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (req: CreateIngredientRequest) => {
      const items = getLocal<Ingredient>(INGREDIENTS_KEY);
      const newItem: Ingredient = { ...req, id: nextId(items), createdAt: Date.now() };
      setLocal(INGREDIENTS_KEY, [...items, newItem]);
      return newItem;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [INGREDIENTS_KEY] }),
  });
}

export function useUpdateIngredient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (req: UpdateIngredientRequest) => {
      const items = getLocal<Ingredient>(INGREDIENTS_KEY);
      const updated = items.map((i) => (i.id === req.id ? { ...i, ...req } : i));
      setLocal(INGREDIENTS_KEY, updated);
      return req;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [INGREDIENTS_KEY] }),
  });
}

export function useDeleteIngredient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const items = getLocal<Ingredient>(INGREDIENTS_KEY);
      setLocal(INGREDIENTS_KEY, items.filter((i) => i.id !== id));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [INGREDIENTS_KEY] }),
  });
}

// ─── Menu Items (localStorage) ────────────────────────────────────────────────

export function useMenuItems() {
  return useQuery<MenuItem[]>({
    queryKey: [MENU_ITEMS_KEY],
    queryFn: () => getLocal<MenuItem>(MENU_ITEMS_KEY),
    staleTime: 0,
  });
}

export function useCreateMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: Omit<MenuItem, "id" | "createdAt">) => {
      const items = getLocal<MenuItem>(MENU_ITEMS_KEY);
      const newItem: MenuItem = { ...item, id: nextId(items), createdAt: Date.now() };
      setLocal(MENU_ITEMS_KEY, [...items, newItem]);
      return newItem;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [MENU_ITEMS_KEY] }),
  });
}

export function useUpdateMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: MenuItem) => {
      const items = getLocal<MenuItem>(MENU_ITEMS_KEY);
      setLocal(MENU_ITEMS_KEY, items.map((i) => (i.id === item.id ? item : i)));
      return item;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [MENU_ITEMS_KEY] }),
  });
}

export function useDeleteMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const items = getLocal<MenuItem>(MENU_ITEMS_KEY);
      setLocal(MENU_ITEMS_KEY, items.filter((i) => i.id !== id));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [MENU_ITEMS_KEY] }),
  });
}

/** Toggle the isAvailable flag on a menu item */
export function useToggleMenuItemAvailability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const items = getLocal<MenuItem>(MENU_ITEMS_KEY);
      setLocal(
        MENU_ITEMS_KEY,
        items.map((i) => (i.id === id ? { ...i, isAvailable: !i.isAvailable } : i))
      );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [MENU_ITEMS_KEY] }),
  });
}

// ─── Combo Deals (localStorage) ───────────────────────────────────────────────

export function useCombos() {
  return useQuery<ComboDeal[]>({
    queryKey: [COMBOS_KEY],
    queryFn: () => getLocal<ComboDeal>(COMBOS_KEY),
    staleTime: 0,
  });
}

export function useCreateCombo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (combo: Omit<ComboDeal, "id" | "createdAt">) => {
      const items = getLocal<ComboDeal>(COMBOS_KEY);
      const newItem: ComboDeal = { ...combo, id: nextId(items), createdAt: Date.now() };
      setLocal(COMBOS_KEY, [...items, newItem]);
      return newItem;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [COMBOS_KEY] }),
  });
}

/** Alias for useCreateCombo — used by CombosPage */
export const useCreateComboDeal = useCreateCombo;

export function useUpdateCombo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...combo }: ComboDeal) => {
      const items = getLocal<ComboDeal>(COMBOS_KEY);
      setLocal(COMBOS_KEY, items.map((i) => (i.id === id ? { ...i, ...combo, id } : i)));
      return { id, ...combo };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [COMBOS_KEY] }),
  });
}

/** Alias for useUpdateCombo — used by CombosPage */
export const useUpdateComboDeal = useUpdateCombo;

export function useDeleteCombo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const items = getLocal<ComboDeal>(COMBOS_KEY);
      setLocal(COMBOS_KEY, items.filter((i) => i.id !== id));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [COMBOS_KEY] }),
  });
}

/** Alias for useDeleteCombo — used by CombosPage */
export const useDeleteComboDeal = useDeleteCombo;

/** Toggle the isAvailable flag on a combo deal */
export function useToggleComboDealAvailability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const items = getLocal<ComboDeal>(COMBOS_KEY);
      setLocal(
        COMBOS_KEY,
        items.map((i) => (i.id === id ? { ...i, isAvailable: !i.isAvailable } : i))
      );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [COMBOS_KEY] }),
  });
}

// ─── Suppliers (localStorage) ─────────────────────────────────────────────────

export function useSuppliers() {
  return useQuery<Supplier[]>({
    queryKey: [SUPPLIERS_KEY],
    queryFn: () => getLocal<Supplier>(SUPPLIERS_KEY),
    staleTime: 0,
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (supplier: Omit<Supplier, "id" | "createdAt">) => {
      const items = getLocal<Supplier>(SUPPLIERS_KEY);
      const newItem: Supplier = { ...supplier, id: nextId(items), createdAt: Date.now() };
      setLocal(SUPPLIERS_KEY, [...items, newItem]);
      return newItem;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [SUPPLIERS_KEY] }),
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (supplier: Supplier) => {
      const items = getLocal<Supplier>(SUPPLIERS_KEY);
      setLocal(SUPPLIERS_KEY, items.map((i) => (i.id === supplier.id ? supplier : i)));
      return supplier;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [SUPPLIERS_KEY] }),
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const items = getLocal<Supplier>(SUPPLIERS_KEY);
      setLocal(SUPPLIERS_KEY, items.filter((i) => i.id !== id));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [SUPPLIERS_KEY] }),
  });
}

/**
 * Auto-generate purchase orders for low-stock ingredients.
 * Finds ingredients at or below their lowStockThreshold and creates
 * a purchase order for each one that has a supplier assigned.
 */
export function useAutoGeneratePurchaseOrders() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const ingredients = getLocal<Ingredient>(INGREDIENTS_KEY);
      const suppliers = getLocal<Supplier>(SUPPLIERS_KEY);
      const existingOrders = getLocal<PurchaseOrder>(PURCHASE_ORDERS_KEY);

      const lowStock = ingredients.filter(
        (i) => i.quantity <= i.lowStockThreshold && i.supplierId !== undefined
      );

      if (lowStock.length === 0) return 0;

      const newOrders: PurchaseOrder[] = [];
      let idCounter = nextId(existingOrders);

      for (const ing of lowStock) {
        const supplier = suppliers.find((s) => s.id === ing.supplierId);
        if (!supplier) continue;

        const reorderQty = Math.max(ing.lowStockThreshold * 2, 10);
        const order: PurchaseOrder = {
          id: idCounter++,
          supplierId: supplier.id,
          ingredientId: ing.id,
          quantity: reorderQty,
          unitCost: ing.costPrice,
          totalCost: reorderQty * ing.costPrice,
          status: PurchaseOrderStatus.pending,
          notes: `Auto-generated: ${ing.name} is low (${ing.quantity} ${ing.unit} remaining)`,
          createdAt: Date.now(),
        };
        newOrders.push(order);
      }

      setLocal(PURCHASE_ORDERS_KEY, [...existingOrders, ...newOrders]);
      return newOrders.length;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PURCHASE_ORDERS_KEY] });
    },
  });
}

// ─── Waste Logs (localStorage) ────────────────────────────────────────────────

export function useWasteLogs() {
  return useQuery<WasteLog[]>({
    queryKey: [WASTE_LOGS_KEY],
    queryFn: () => getLocal<WasteLog>(WASTE_LOGS_KEY),
    staleTime: 0,
  });
}

export function useCreateWasteLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      ingredientId,
      quantity,
      reason,
    }: {
      ingredientId: number;
      quantity: number;
      reason: string;
    }) => {
      const ingredients = getLocal<Ingredient>(INGREDIENTS_KEY);
      const ingredient = ingredients.find((i) => i.id === ingredientId);
      if (!ingredient) throw new Error("Ingredient not found");
      const logs = getLocal<WasteLog>(WASTE_LOGS_KEY);
      const newLog: WasteLog = {
        id: nextId(logs),
        ingredientId,
        ingredientName: ingredient.name,
        quantity,
        unit: ingredient.unit,
        reason,
        costLoss: ingredient.costPrice * quantity,
        loggedAt: Date.now(),
      };
      setLocal(WASTE_LOGS_KEY, [...logs, newLog]);
      return newLog;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [WASTE_LOGS_KEY] }),
  });
}

export function useDeleteWasteLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const logs = getLocal<WasteLog>(WASTE_LOGS_KEY);
      setLocal(WASTE_LOGS_KEY, logs.filter((l) => l.id !== id));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [WASTE_LOGS_KEY] }),
  });
}

export function useWasteStats() {
  return useQuery<WasteStats>({
    queryKey: [WASTE_LOGS_KEY, "stats"],
    queryFn: () => {
      const logs = getLocal<WasteLog>(WASTE_LOGS_KEY);
      const totalCostLoss = logs.reduce((sum, l) => sum + l.costLoss, 0);
      const totalEntries = logs.length;
      const ingredientCounts: Record<string, number> = {};
      logs.forEach((l) => {
        ingredientCounts[l.ingredientName] = (ingredientCounts[l.ingredientName] ?? 0) + l.quantity;
      });
      const topWastedIngredient =
        Object.entries(ingredientCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "N/A";
      return { totalCostLoss, totalEntries, topWastedIngredient };
    },
    staleTime: 0,
  });
}

// ─── Alerts (localStorage) ────────────────────────────────────────────────────

export function useAlerts() {
  const { data: ingredients = [] } = useIngredients();
  return useQuery<Alert[]>({
    queryKey: [ALERTS_KEY, ingredients.length],
    queryFn: () => {
      const readIds: number[] = getLocal<number>(ALERTS_KEY);
      const alerts: Alert[] = [];
      let id = 1;
      ingredients.forEach((ing) => {
        if (ing.quantity <= ing.lowStockThreshold) {
          alerts.push({
            id: id++,
            alertType: AlertType.lowStock,
            message: `${ing.name} is low on stock (${ing.quantity} ${ing.unit} remaining)`,
            ingredientId: ing.id,
            isRead: readIds.includes(id - 1),
            createdAt: Date.now(),
          });
        }
        if (ing.expiryDate) {
          const daysUntilExpiry = Math.ceil((ing.expiryDate - Date.now()) / (1000 * 60 * 60 * 24));
          if (daysUntilExpiry <= 7 && daysUntilExpiry >= 0) {
            alerts.push({
              id: id++,
              alertType: AlertType.expiryWarning,
              message: `${ing.name} expires in ${daysUntilExpiry} day(s)`,
              ingredientId: ing.id,
              isRead: readIds.includes(id - 1),
              createdAt: Date.now(),
            });
          }
        }
      });
      return alerts;
    },
    staleTime: 0,
  });
}

export function useMarkAlertRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (alertId: number) => {
      const readIds: number[] = getLocal<number>(ALERTS_KEY);
      if (!readIds.includes(alertId)) {
        setLocal(ALERTS_KEY, [...readIds, alertId]);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [ALERTS_KEY] }),
  });
}

export function useMarkAllAlertsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (alertIds: number[]) => {
      const readIds: number[] = getLocal<number>(ALERTS_KEY);
      const merged = Array.from(new Set([...readIds, ...alertIds]));
      setLocal(ALERTS_KEY, merged);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [ALERTS_KEY] }),
  });
}

// ─── Subscriptions (localStorage) ────────────────────────────────────────────

export function useSubscriptions() {
  return useQuery<Subscription[]>({
    queryKey: [SUBSCRIPTIONS_KEY],
    queryFn: () => getLocal<Subscription>(SUBSCRIPTIONS_KEY),
    staleTime: 0,
  });
}

export function useCreateSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sub: Omit<Subscription, "id" | "createdAt">) => {
      const items = getLocal<Subscription>(SUBSCRIPTIONS_KEY);
      const newItem: Subscription = { ...sub, id: nextId(items), createdAt: Date.now() };
      setLocal(SUBSCRIPTIONS_KEY, [...items, newItem]);
      return newItem;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [SUBSCRIPTIONS_KEY] }),
  });
}

export function useUpdateSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sub: Subscription) => {
      const items = getLocal<Subscription>(SUBSCRIPTIONS_KEY);
      setLocal(SUBSCRIPTIONS_KEY, items.map((i) => (i.id === sub.id ? sub : i)));
      return sub;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [SUBSCRIPTIONS_KEY] }),
  });
}

/** Pause a subscription by setting its status to paused */
export function usePauseSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const items = getLocal<Subscription>(SUBSCRIPTIONS_KEY);
      setLocal(
        SUBSCRIPTIONS_KEY,
        items.map((i) => (i.id === id ? { ...i, status: SubscriptionStatus.paused } : i))
      );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [SUBSCRIPTIONS_KEY] }),
  });
}

/** Resume a paused subscription by setting its status to active */
export function useResumeSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const items = getLocal<Subscription>(SUBSCRIPTIONS_KEY);
      setLocal(
        SUBSCRIPTIONS_KEY,
        items.map((i) => (i.id === id ? { ...i, status: SubscriptionStatus.active } : i))
      );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [SUBSCRIPTIONS_KEY] }),
  });
}

/** Cancel a subscription by setting its status to cancelled */
export function useCancelSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const items = getLocal<Subscription>(SUBSCRIPTIONS_KEY);
      setLocal(
        SUBSCRIPTIONS_KEY,
        items.map((i) => (i.id === id ? { ...i, status: SubscriptionStatus.cancelled } : i))
      );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [SUBSCRIPTIONS_KEY] }),
  });
}

export function useDeleteSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const items = getLocal<Subscription>(SUBSCRIPTIONS_KEY);
      setLocal(SUBSCRIPTIONS_KEY, items.filter((i) => i.id !== id));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [SUBSCRIPTIONS_KEY] }),
  });
}

// ─── Sales Stats ──────────────────────────────────────────────────────────────

export interface SalesReportEntry {
  date: string;
  totalRevenue: number;
  totalOrders: number;
}

export function useSalesStats() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["saleOrders", "stats"],
    queryFn: async () => {
      if (!actor) return { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 };
      try {
        const orders = await actor.getSaleOrders();
        const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
        const totalOrders = orders.length;
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        return { totalRevenue, totalOrders, avgOrderValue };
      } catch {
        return { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 };
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSalesReport(period: SalesReportPeriod = "daily") {
  const { actor, isFetching } = useActor();
  return useQuery<SalesReportEntry[]>({
    queryKey: ["salesReport", period],
    queryFn: async () => {
      if (!actor) return [];
      try {
        const orders = await actor.getSaleOrders();
        const grouped: Record<string, { totalRevenue: number; totalOrders: number }> = {};
        orders.forEach((order) => {
          const date = new Date(Number(order.createdAt) / 1_000_000);
          let key: string;
          if (period === "daily") {
            key = date.toISOString().split("T")[0];
          } else {
            const startOfWeek = new Date(date);
            startOfWeek.setDate(date.getDate() - date.getDay());
            key = startOfWeek.toISOString().split("T")[0];
          }
          if (!grouped[key]) grouped[key] = { totalRevenue: 0, totalOrders: 0 };
          grouped[key].totalRevenue += order.totalAmount;
          grouped[key].totalOrders += 1;
        });
        return Object.entries(grouped)
          .map(([date, stats]) => ({ date, ...stats }))
          .sort((a, b) => a.date.localeCompare(b.date));
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Upcoming Deliveries ──────────────────────────────────────────────────────

export function useUpcomingDeliveries() {
  return useQuery<UpcomingDelivery[]>({
    queryKey: [SUBSCRIPTIONS_KEY, "upcoming"],
    queryFn: () => {
      const subs = getLocal<Subscription>(SUBSCRIPTIONS_KEY);
      const now = Date.now();
      const upcoming = subs
        .filter((s) => s.status === SubscriptionStatus.active && s.nextRenewalDate > now)
        .map((s) => ({
          id: s.id,
          customerId: s.customerId,
          subscriptionId: s.id,
          planName: s.planName,
          menuItemIds: s.menuItemIds,
          frequencyDays: s.frequencyDays,
          nextRenewalDate: s.nextRenewalDate,
          status: s.status,
        }));
      return upcoming.sort((a, b) => a.nextRenewalDate - b.nextRenewalDate);
    },
    staleTime: 0,
  });
}

// ─── Purchase Orders (localStorage) ──────────────────────────────────────────

export enum PurchaseOrderStatus {
  pending = "pending",
  ordered = "ordered",
  received = "received",
  cancelled = "cancelled",
}

export interface PurchaseOrder {
  id: number;
  supplierId: number;
  ingredientId: number;
  quantity: number;
  unitCost: number;
  totalCost: number;
  status: PurchaseOrderStatus;
  expectedDelivery?: number;
  notes: string;
  createdAt: number;
}

const PURCHASE_ORDERS_KEY = "kitchenos_purchase_orders";

export function usePurchaseOrders() {
  return useQuery<PurchaseOrder[]>({
    queryKey: [PURCHASE_ORDERS_KEY],
    queryFn: () => getLocal<PurchaseOrder>(PURCHASE_ORDERS_KEY),
    staleTime: 0,
  });
}

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (order: Omit<PurchaseOrder, "id" | "createdAt">) => {
      const items = getLocal<PurchaseOrder>(PURCHASE_ORDERS_KEY);
      const newItem: PurchaseOrder = { ...order, id: nextId(items), createdAt: Date.now() };
      setLocal(PURCHASE_ORDERS_KEY, [...items, newItem]);
      return newItem;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [PURCHASE_ORDERS_KEY] }),
  });
}

export function useUpdatePurchaseOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: PurchaseOrderStatus }) => {
      const items = getLocal<PurchaseOrder>(PURCHASE_ORDERS_KEY);
      setLocal(PURCHASE_ORDERS_KEY, items.map((i) => (i.id === id ? { ...i, status } : i)));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [PURCHASE_ORDERS_KEY] }),
  });
}

export function useDeletePurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const items = getLocal<PurchaseOrder>(PURCHASE_ORDERS_KEY);
      setLocal(PURCHASE_ORDERS_KEY, items.filter((i) => i.id !== id));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [PURCHASE_ORDERS_KEY] }),
  });
}
