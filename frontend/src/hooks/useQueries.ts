import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type {
  Ingredient,
  CreateIngredientRequest,
  UpdateIngredientRequest,
  MenuItem,
  CreateMenuItemRequest,
  UpdateMenuItemRequest,
  SaleOrder,
  CreateSaleOrderRequest,
  Customer,
  Subscription,
  Alert,
  UserProfile,
  Supplier,
  CreateSupplierRequest,
  PurchaseOrder,
  PurchaseOrderStatus,
  WasteLog,
  CreateWasteLogRequest,
  ComboDeal,
  CreateComboDealRequest,
  DiscountCode,
  DiscountCodeInput,
  DiscountApplicationResult,
  TaxConfig,
  TaxConfigInput,
  TaxCalculationResult,
  SalesReport,
} from '../backend';
import { PurchaseOrderStatus as PurchaseOrderStatusEnum, SalesReportPeriod } from '../backend';
import { Principal } from '@dfinity/principal';

// ---- User Profile ----
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// ---- Admin Management ----
export function useAdminPrincipal() {
  const { actor, isFetching } = useActor();

  return useQuery<string>({
    queryKey: ['adminPrincipal'],
    queryFn: async () => {
      if (!actor) return '';
      return actor.getAdminPrincipal();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useReassignAdmin() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newPrincipalText: string) => {
      if (!actor) throw new Error('Actor not available');
      const principal = Principal.fromText(newPrincipalText);
      return actor.reassignAdmin(principal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPrincipal'] });
    },
  });
}

export function useVacateAdmin() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.vacateAdmin();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPrincipal'] });
    },
  });
}

export function useClaimAdminIfVacant() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.claimAdminIfVacant();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPrincipal'] });
    },
  });
}

// ---- Ingredients / Inventory ----
export function useIngredients() {
  const { actor, isFetching } = useActor();

  return useQuery<Ingredient[]>({
    queryKey: ['ingredients'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listIngredients();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIngredient(id: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<Ingredient | null>({
    queryKey: ['ingredient', id.toString()],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getIngredient(id);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateIngredient() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: CreateIngredientRequest) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createIngredient(item);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
    },
  });
}

export function useUpdateIngredient() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, item }: { id: bigint; item: UpdateIngredientRequest }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateIngredient(id, item);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      queryClient.invalidateQueries({ queryKey: ['ingredient', variables.id.toString()] });
    },
  });
}

export function useDeleteIngredient() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteIngredient(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
    },
  });
}

export function useInventoryStats() {
  const { data: ingredients } = useIngredients();

  const totalIngredients = ingredients?.length ?? 0;
  const totalValue = ingredients?.reduce((sum, i) => sum + i.quantity * i.costPrice, 0) ?? 0;
  const lowStockCount = ingredients?.filter(i => i.quantity <= i.lowStockThreshold).length ?? 0;

  return { totalIngredients, totalValue, lowStockCount };
}

// ---- Menu Items ----
export function useMenuItems() {
  const { actor, isFetching } = useActor();

  return useQuery<MenuItem[]>({
    queryKey: ['menuItems'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMenuItems();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useMenuItem(id: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<MenuItem | null>({
    queryKey: ['menuItem', id.toString()],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getMenuItem(id);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateMenuItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: CreateMenuItemRequest) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createMenuItem(item);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
    },
  });
}

export function useUpdateMenuItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, item }: { id: bigint; item: UpdateMenuItemRequest }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateMenuItem(id, item);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      queryClient.invalidateQueries({ queryKey: ['menuItem', variables.id.toString()] });
      queryClient.invalidateQueries({ queryKey: ['profitMargin'] });
    },
  });
}

export function useDeleteMenuItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteMenuItem(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      queryClient.invalidateQueries({ queryKey: ['profitMargin'] });
    },
  });
}

export function useToggleMenuItemAvailability() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.toggleMenuItemAvailability(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
    },
  });
}

// ---- Profit Margin ----
export function useProfitMargin(menuItemId: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<{
    costPerServing: number;
    sellingPrice: number;
    grossProfit: number;
    profitMarginPercentage: number;
  }>({
    queryKey: ['profitMargin', menuItemId.toString()],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getProfitMargin(menuItemId);
    },
    enabled: !!actor && !isFetching,
  });
}

// ---- Available Menu Items ----
export function useAvailableMenuItems() {
  const { actor, isFetching } = useActor();

  return useQuery<MenuItem[]>({
    queryKey: ['availableMenuItems'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAvailableMenuItems();
    },
    enabled: !!actor && !isFetching,
  });
}

// ---- Sales ----
export function useSaleOrders(page = 0, pageSize = 20) {
  const { actor, isFetching } = useActor();

  return useQuery<SaleOrder[]>({
    queryKey: ['saleOrders', page, pageSize],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getSaleOrders(BigInt(page), BigInt(pageSize));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateSaleOrder() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (order: CreateSaleOrderRequest) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createSaleOrder(order);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saleOrders'] });
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      queryClient.invalidateQueries({ queryKey: ['salesStats'] });
      queryClient.invalidateQueries({ queryKey: ['discountCodes'] });
    },
  });
}

export function useSalesStats() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['salesStats'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getDashboardSalesStats();
    },
    enabled: !!actor && !isFetching,
  });
}

// ---- Customers ----
export function useCustomers(page = 0, pageSize = 100) {
  const { actor, isFetching } = useActor();

  return useQuery<Customer[]>({
    queryKey: ['customers', page, pageSize],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCustomers(BigInt(page), BigInt(pageSize));
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

export function useCreateCustomer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; email: string; phone: string; address: string; notes: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createCustomer(data.name, data.email, data.phone, data.address, data.notes);
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
    mutationFn: async (data: { id: bigint; name: string; email: string; phone: string; address: string; notes: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateCustomer(data.id, data.name, data.email, data.phone, data.address, data.notes);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer', variables.id.toString()] });
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

// ---- Subscriptions ----
export function useSubscriptions(customerId?: bigint, page = 0, pageSize = 100) {
  const { actor, isFetching } = useActor();

  return useQuery<Subscription[]>({
    queryKey: ['subscriptions', customerId?.toString(), page, pageSize],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getSubscriptions(customerId ?? null, BigInt(page), BigInt(pageSize));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSubscription(id: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<Subscription | null>({
    queryKey: ['subscription', id.toString()],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getSubscription(id);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateSubscription() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      customerId: bigint;
      planName: string;
      menuItemIds: bigint[];
      frequencyDays: bigint;
      startDate: bigint;
      startPrice: number;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createSubscription(
        data.customerId,
        data.planName,
        data.menuItemIds,
        data.frequencyDays,
        data.startDate,
        data.startPrice
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });
}

export function useUpdateSubscription() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: bigint;
      planName: string;
      menuItemIds: bigint[];
      frequencyDays: bigint;
      totalPrice: number;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateSubscription(data.id, data.planName, data.menuItemIds, data.frequencyDays, data.totalPrice);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['subscription', variables.id.toString()] });
    },
  });
}

export function useCancelSubscription() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.cancelSubscription(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });
}

export function usePauseSubscription() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.pauseSubscription(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });
}

export function useResumeSubscription() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.resumeSubscription(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });
}

// ---- Alerts ----
export function useAlerts() {
  const { actor, isFetching } = useActor();

  return useQuery<Alert[]>({
    queryKey: ['alerts'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAlerts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useMarkAlertRead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alertId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.markAlertRead(alertId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}

export function useMarkAllAlertsRead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.markAllAlertsRead();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}

// ---- Suppliers ----
export function useSuppliers() {
  const { actor, isFetching } = useActor();

  return useQuery<Supplier[]>({
    queryKey: ['suppliers'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getSuppliers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSupplier(id: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<Supplier | null>({
    queryKey: ['supplier', id.toString()],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getSupplier(id);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateSupplier() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: CreateSupplierRequest) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createSupplier(item);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
}

export function useUpdateSupplier() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, item }: { id: bigint; item: CreateSupplierRequest }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateSupplier(id, item);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['supplier', variables.id.toString()] });
    },
  });
}

export function useDeleteSupplier() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteSupplier(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
}

// ---- Purchase Orders ----
export function usePurchaseOrders() {
  const { actor, isFetching } = useActor();

  return useQuery<PurchaseOrder[]>({
    queryKey: ['purchaseOrders'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPurchaseOrders();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreatePurchaseOrder() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (order: { supplierId: bigint; items: { ingredientId: bigint; quantityOrdered: number }[]; notes: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createPurchaseOrder({
        supplierId: order.supplierId,
        items: order.items.map(i => ({ ingredientId: i.ingredientId, quantityOrdered: i.quantityOrdered })),
        notes: order.notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
    },
  });
}

export function useUpdatePurchaseOrderStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: bigint; status: PurchaseOrderStatus }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updatePurchaseOrderStatus(id, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
    },
  });
}

export function useAutoGeneratePurchaseOrders() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.autoGeneratePurchaseOrders();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
    },
  });
}

// ---- Waste Logs ----
export function useWasteLogs() {
  const { actor, isFetching } = useActor();

  return useQuery<WasteLog[]>({
    queryKey: ['wasteLogs'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getWasteLogs();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useWasteStats() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['wasteStats'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getWasteStats();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateWasteLog() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (log: CreateWasteLogRequest) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createWasteLog(log);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wasteLogs'] });
      queryClient.invalidateQueries({ queryKey: ['wasteStats'] });
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
    },
  });
}

// ---- Combo Deals ----
export function useCombos() {
  const { actor, isFetching } = useActor();

  return useQuery<ComboDeal[]>({
    queryKey: ['combos'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCombos();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateComboDeal() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: CreateComboDealRequest) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createComboDeal(request);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['combos'] });
    },
  });
}

export function useUpdateComboDeal() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: bigint;
      name: string;
      description: string;
      menuItemIds: bigint[];
      bundlePrice: number;
      isAvailable: boolean;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateComboDeal(data.id, data.name, data.description, data.menuItemIds, data.bundlePrice, data.isAvailable);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['combos'] });
    },
  });
}

export function useDeleteComboDeal() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteComboDeal(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['combos'] });
    },
  });
}

export function useToggleComboDealAvailability() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.toggleComboDealAvailability(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['combos'] });
    },
  });
}

// ---- Discount Codes ----
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

export function useDiscountCode(id: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<DiscountCode | null>({
    queryKey: ['discountCode', id.toString()],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getDiscountCode(id);
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
      return actor.createDiscountCode(input);
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
      return actor.updateDiscountCode(id, input);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['discountCodes'] });
      queryClient.invalidateQueries({ queryKey: ['discountCode', variables.id.toString()] });
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

export function useToggleDiscountCodeActive() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.toggleDiscountCodeActive(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discountCodes'] });
    },
  });
}

export function useApplyDiscountCode() {
  const { actor } = useActor();

  return useMutation<DiscountApplicationResult, Error, { code: string; orderSubtotal: number }>({
    mutationFn: async ({ code, orderSubtotal }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.applyDiscountCode(code, orderSubtotal);
    },
  });
}

// ---- Tax Configs ----
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

export function useTaxConfig(id: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<TaxConfig | null>({
    queryKey: ['taxConfig', id.toString()],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getTaxConfig(id);
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
      return actor.createTaxConfig(input);
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
      return actor.updateTaxConfig(id, input);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['taxConfigs'] });
      queryClient.invalidateQueries({ queryKey: ['taxConfig', variables.id.toString()] });
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

export function useToggleTaxConfigActive() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.toggleTaxConfigActive(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxConfigs'] });
    },
  });
}

export function useCalculateTax(subtotal: number) {
  const { actor, isFetching } = useActor();

  return useQuery<TaxCalculationResult>({
    queryKey: ['calculateTax', subtotal],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.calculateTax(subtotal);
    },
    enabled: !!actor && !isFetching && subtotal >= 0,
  });
}

// ---- Sales Reports ----
export function useSalesReport(period: 'daily' | 'weekly' | null, referenceDate: Date | null) {
  const { actor, isFetching } = useActor();

  const refTimestamp = referenceDate ? BigInt(referenceDate.getTime()) * BigInt(1_000_000) : null;
  const backendPeriod = period === 'daily' ? SalesReportPeriod.daily : SalesReportPeriod.weekly;

  return useQuery<SalesReport>({
    queryKey: ['salesReport', period, referenceDate?.toISOString()],
    queryFn: async () => {
      if (!actor || !period || !refTimestamp) throw new Error('Missing parameters');
      return actor.getSalesReport(backendPeriod, refTimestamp);
    },
    enabled: !!actor && !isFetching && !!period && !!referenceDate,
  });
}
