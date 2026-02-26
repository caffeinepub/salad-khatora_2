import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface CreateWasteLogRequest {
    quantity: number;
    ingredientId: bigint;
    reason: string;
}
export interface DiscountCodeInput {
    discountValue: number;
    expiresAt?: bigint;
    code: string;
    discountType: DiscountType;
    description: string;
    maxUses?: bigint;
    minimumOrderAmount: number;
}
export interface CreatePurchaseOrderRequest {
    notes: string;
    items: Array<{
        quantityOrdered: number;
        ingredientId: bigint;
    }>;
    supplierId: bigint;
}
export interface SaleOrder {
    id: bigint;
    discountCodeId?: bigint;
    discountAmount: number;
    note: string;
    createdAt: bigint;
    taxTotal: number;
    totalAmount: number;
    taxBreakdown: Array<TaxBreakdown>;
    items: Array<[bigint, string, bigint, number]>;
    subtotal: number;
}
export interface DiscountCode {
    id: bigint;
    discountValue: number;
    expiresAt?: bigint;
    code: string;
    createdAt: bigint;
    discountType: DiscountType;
    usedCount: bigint;
    description: string;
    isActive: boolean;
    maxUses?: bigint;
    minimumOrderAmount: number;
}
export interface Subscription {
    id: bigint;
    status: SubscriptionStatus;
    frequencyDays: bigint;
    nextRenewalDate: bigint;
    menuItemIds: Array<bigint>;
    createdAt: bigint;
    customerId: bigint;
    totalPrice: number;
    planName: string;
    startDate: bigint;
}
export interface TaxConfig {
    id: bigint;
    appliesTo: TaxAppliesTo;
    name: string;
    createdAt: bigint;
    rate: number;
    isActive: boolean;
}
export interface TaxConfigInput {
    appliesTo: TaxAppliesTo;
    name: string;
    rate: number;
}
export interface PurchaseOrder {
    id: bigint;
    status: PurchaseOrderStatus;
    supplierName: string;
    createdAt: bigint;
    notes: string;
    items: Array<{
        unit: string;
        quantityOrdered: number;
        ingredientName: string;
        ingredientId: bigint;
    }>;
    supplierId: bigint;
}
export interface CreateSaleOrderRequest {
    discountCodeId?: bigint;
    note: string;
    items: Array<[bigint, bigint]>;
}
export interface Alert {
    id: bigint;
    alertType: AlertType;
    createdAt: bigint;
    isRead: boolean;
    relatedEntityId: bigint;
    message: string;
}
export interface WasteLog {
    id: bigint;
    costLoss: number;
    unit: string;
    quantity: number;
    ingredientName: string;
    ingredientId: bigint;
    loggedAt: bigint;
    reason: string;
}
export interface TopSellingItem {
    revenue: number;
    menuItemName: string;
    quantitySold: bigint;
    menuItemId: bigint;
}
export interface TaxBreakdown {
    name: string;
    rate: number;
    amount: number;
}
export interface UpdateIngredientRequest {
    lowStockThreshold: number;
    expiryDate?: bigint;
    name: string;
    unit: string;
    quantity: number;
    costPrice: number;
    supplierId?: bigint;
}
export interface Customer {
    id: bigint;
    name: string;
    createdAt: bigint;
    email: string;
    address: string;
    notes: string;
    phone: string;
}
export interface DiscountApplicationResult {
    discountCode: DiscountCode;
    discountAmount: number;
    finalTotal: number;
}
export interface MenuItem {
    id: bigint;
    costPerServing: number;
    availableFromHour?: bigint;
    name: string;
    createdAt: bigint;
    isAvailable: boolean;
    sellingPrice: number;
    description: string;
    availableDays?: Array<bigint>;
    availableToHour?: bigint;
    ingredients: Array<[string, number]>;
}
export interface UpdateMenuItemRequest {
    availableFromHour?: bigint;
    name: string;
    isAvailable: boolean;
    sellingPrice: number;
    description: string;
    availableDays?: Array<bigint>;
    availableToHour?: bigint;
    ingredients: Array<[string, number]>;
}
export interface TaxCalculationResult {
    breakdown: Array<TaxBreakdown>;
    totalTaxAmount: number;
}
export interface SalesReport {
    averageOrderValue: number;
    topSellingItems: Array<TopSellingItem>;
    periodLabel: string;
    totalRevenue: number;
    totalOrdersCount: bigint;
}
export interface Ingredient {
    id: bigint;
    lowStockThreshold: number;
    expiryDate?: bigint;
    name: string;
    createdAt: bigint;
    unit: string;
    quantity: number;
    costPrice: number;
    supplierId?: bigint;
}
export interface CreateIngredientRequest {
    lowStockThreshold: number;
    expiryDate?: bigint;
    name: string;
    unit: string;
    quantity: number;
    costPrice: number;
    supplierId?: bigint;
}
export interface CreateComboDealRequest {
    menuItemIds: Array<bigint>;
    name: string;
    description: string;
    bundlePrice: number;
}
export interface Supplier {
    id: bigint;
    name: string;
    createdAt: bigint;
    contactPerson: string;
    email: string;
    leadTimeDays: bigint;
    address: string;
    notes: string;
    phone: string;
}
export interface ComboDeal {
    id: bigint;
    totalIndividualPrice: number;
    menuItemIds: Array<bigint>;
    name: string;
    createdAt: bigint;
    isAvailable: boolean;
    description: string;
    bundlePrice: number;
    savings: number;
}
export interface CreateMenuItemRequest {
    availableFromHour?: bigint;
    name: string;
    sellingPrice: number;
    description: string;
    availableDays?: Array<bigint>;
    availableToHour?: bigint;
    ingredients: Array<[string, number]>;
}
export interface UserProfile {
    name: string;
}
export interface CreateSupplierRequest {
    name: string;
    contactPerson: string;
    email: string;
    leadTimeDays: bigint;
    address: string;
    notes: string;
    phone: string;
}
export enum AlertType {
    other = "other",
    expiryWarning = "expiryWarning",
    subscriptionRenewal = "subscriptionRenewal",
    lowStock = "lowStock"
}
export enum DiscountType {
    fixed = "fixed",
    percentage = "percentage"
}
export enum PurchaseOrderStatus {
    cancelled = "cancelled",
    pending = "pending",
    received = "received"
}
export enum SalesReportPeriod {
    daily = "daily",
    weekly = "weekly"
}
export enum SubscriptionStatus {
    active = "active",
    cancelled = "cancelled",
    paused = "paused"
}
export enum TaxAppliesTo {
    all = "all",
    menuItems = "menuItems",
    combos = "combos"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    applyDiscountCode(code: string, orderSubtotal: number): Promise<DiscountApplicationResult>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    autoGeneratePurchaseOrders(): Promise<Array<bigint>>;
    calculateTax(subtotal: number): Promise<TaxCalculationResult>;
    cancelSubscription(id: bigint): Promise<void>;
    claimAdminIfVacant(): Promise<void>;
    createComboDeal(request: CreateComboDealRequest): Promise<bigint>;
    createCustomer(name: string, email: string, phone: string, address: string, notes: string): Promise<bigint>;
    createDiscountCode(input: DiscountCodeInput): Promise<bigint>;
    createIngredient(item: CreateIngredientRequest): Promise<bigint>;
    createMenuItem(item: CreateMenuItemRequest): Promise<bigint>;
    createPurchaseOrder(order: CreatePurchaseOrderRequest): Promise<bigint>;
    createSaleOrder(order: CreateSaleOrderRequest): Promise<bigint>;
    createSubscription(customerId: bigint, planName: string, menuItemIds: Array<bigint>, frequencyDays: bigint, startDate: bigint, startPrice: number): Promise<bigint>;
    createSupplier(item: CreateSupplierRequest): Promise<bigint>;
    createTaxConfig(input: TaxConfigInput): Promise<bigint>;
    createWasteLog(log: CreateWasteLogRequest): Promise<bigint>;
    deleteComboDeal(comboId: bigint): Promise<void>;
    deleteCustomer(id: bigint): Promise<void>;
    deleteDiscountCode(id: bigint): Promise<void>;
    deleteIngredient(_id: bigint): Promise<void>;
    deleteMenuItem(_id: bigint): Promise<void>;
    deleteSupplier(id: bigint): Promise<void>;
    deleteTaxConfig(id: bigint): Promise<void>;
    getAdminPrincipal(): Promise<string>;
    getAlerts(): Promise<Array<Alert>>;
    getAvailableMenuItems(): Promise<Array<MenuItem>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCombo(comboId: bigint): Promise<ComboDeal | null>;
    getCombos(): Promise<Array<ComboDeal>>;
    getCustomer(id: bigint): Promise<Customer | null>;
    getCustomers(page: bigint, pageSize: bigint): Promise<Array<Customer>>;
    getDashboardSalesStats(): Promise<{
        todaysRevenue: number;
        totalRevenue: number;
        todaysOrdersCount: bigint;
        totalOrdersCount: bigint;
    }>;
    getDiscountCode(id: bigint): Promise<DiscountCode | null>;
    getDiscountCodes(): Promise<Array<DiscountCode>>;
    getIngredient(_id: bigint): Promise<Ingredient | null>;
    getIngredientByName(_name: string): Promise<Ingredient | null>;
    getMenuItem(_id: bigint): Promise<MenuItem | null>;
    getMenuItems(): Promise<Array<MenuItem>>;
    getProfitMargin(menuItemId: bigint): Promise<{
        costPerServing: number;
        grossProfit: number;
        sellingPrice: number;
        profitMarginPercentage: number;
    }>;
    getPurchaseOrder(id: bigint): Promise<PurchaseOrder | null>;
    getPurchaseOrders(): Promise<Array<PurchaseOrder>>;
    getSaleOrder(_id: bigint): Promise<SaleOrder | null>;
    getSaleOrders(page: bigint, pageSize: bigint): Promise<Array<SaleOrder>>;
    getSalesReport(period: SalesReportPeriod, referenceDate: bigint): Promise<SalesReport>;
    getSubscription(id: bigint): Promise<Subscription | null>;
    getSubscriptions(customerId: bigint | null, page: bigint, pageSize: bigint): Promise<Array<Subscription>>;
    getSupplier(id: bigint): Promise<Supplier | null>;
    getSuppliers(): Promise<Array<Supplier>>;
    getTaxConfig(id: bigint): Promise<TaxConfig | null>;
    getTaxConfigs(): Promise<Array<TaxConfig>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getWasteLog(id: bigint): Promise<WasteLog | null>;
    getWasteLogs(): Promise<Array<WasteLog>>;
    getWasteStats(): Promise<{
        breakdown: Array<[bigint, {
                costLoss: number;
                quantity: number;
            }]>;
        totalWasteCount: bigint;
        totalWasteCost: number;
    }>;
    isCallerAdmin(): Promise<boolean>;
    listIngredients(): Promise<Array<Ingredient>>;
    markAlertRead(alertId: bigint): Promise<void>;
    markAllAlertsRead(): Promise<void>;
    pauseSubscription(id: bigint): Promise<void>;
    reassignAdmin(newPrincipal: Principal): Promise<void>;
    resumeSubscription(id: bigint): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    toggleComboDealAvailability(comboId: bigint): Promise<void>;
    toggleDiscountCodeActive(id: bigint): Promise<void>;
    toggleMenuItemAvailability(_id: bigint): Promise<void>;
    toggleTaxConfigActive(id: bigint): Promise<void>;
    updateComboDeal(comboId: bigint, name: string, description: string, menuItemIds: Array<bigint>, bundlePrice: number, isAvailable: boolean): Promise<void>;
    updateCustomer(id: bigint, name: string, email: string, phone: string, address: string, notes: string): Promise<void>;
    updateDiscountCode(id: bigint, input: DiscountCodeInput): Promise<void>;
    updateIngredient(_id: bigint, item: UpdateIngredientRequest): Promise<void>;
    updateMenuItem(_id: bigint, item: UpdateMenuItemRequest): Promise<void>;
    updatePurchaseOrderStatus(id: bigint, newStatus: PurchaseOrderStatus): Promise<void>;
    updateSubscription(id: bigint, planName: string, menuItemIds: Array<bigint>, frequencyDays: bigint, totalPrice: number): Promise<void>;
    updateSupplier(id: bigint, item: CreateSupplierRequest): Promise<void>;
    updateTaxConfig(id: bigint, input: TaxConfigInput): Promise<void>;
    vacateAdmin(): Promise<void>;
}
