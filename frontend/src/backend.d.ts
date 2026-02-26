import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface DiscountCodeInput {
    discountValue: number;
    expiresAt?: bigint;
    code: string;
    discountType: DiscountType;
    description: string;
    maxUses?: bigint;
    minimumOrderAmount: number;
}
export interface LoyaltyTransaction {
    id: bigint;
    createdAt: bigint;
    customerId: bigint;
    points: bigint;
    reason: string;
}
export interface AuditLog {
    id: bigint;
    action: string;
    timestamp: bigint;
    targetType: string;
    details: string;
    actorPrincipal: string;
    targetId?: bigint;
}
export interface TaxBreakdown {
    name: string;
    rate: number;
    amount: number;
}
export interface SaleOrderItem {
    itemId: bigint;
    quantity: bigint;
    price: number;
}
export interface StaffAccount {
    id: bigint;
    principal: Principal;
    name: string;
    createdAt: bigint;
    role: StaffRole;
    isActive: boolean;
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
    customerId?: bigint;
    items: Array<SaleOrderItem>;
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
export interface Customer {
    id: bigint;
    name: string;
    createdAt: bigint;
    email: string;
    loyaltyPoints: bigint;
    phone: string;
}
export interface DiscountApplicationResult {
    discountCode: DiscountCode;
    discountAmount: number;
    finalTotal: number;
}
export interface TaxConfig {
    id: bigint;
    appliesTo: TaxAppliesTo;
    name: string;
    createdAt: bigint;
    rate: number;
    isActive: boolean;
}
export interface TaxCalculationResult {
    breakdown: Array<TaxBreakdown>;
    totalTaxAmount: number;
}
export interface TaxConfigInput {
    appliesTo: TaxAppliesTo;
    name: string;
    rate: number;
}
export enum DiscountType {
    fixed = "fixed",
    percentage = "percentage"
}
export enum StaffRole {
    manager = "manager",
    admin = "admin",
    cashier = "cashier"
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
    applyDiscountCode(code: string, orderTotal: number): Promise<DiscountApplicationResult>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    calculateTax(subtotal: number, targetType: string): Promise<TaxCalculationResult>;
    createCustomer(name: string, email: string, phone: string): Promise<bigint>;
    createDiscountCode(input: DiscountCodeInput): Promise<bigint>;
    createSaleOrder(items: Array<SaleOrderItem>, subtotal: number, totalAmount: number, discountAmount: number, taxBreakdown: Array<TaxBreakdown>, taxTotal: number, note: string, discountCodeId: bigint | null, customerId: bigint | null): Promise<bigint>;
    createStaffAccount(principal: Principal, name: string, role: StaffRole): Promise<void>;
    createTaxConfig(input: TaxConfigInput): Promise<bigint>;
    deleteCustomer(id: bigint): Promise<void>;
    deleteDiscountCode(id: bigint): Promise<void>;
    deleteSaleOrder(id: bigint): Promise<void>;
    deleteStaffAccount(id: bigint): Promise<void>;
    deleteTaxConfig(id: bigint): Promise<void>;
    getAuditLogs(limit: bigint, offset: bigint): Promise<Array<AuditLog>>;
    getCallerUserRole(): Promise<UserRole>;
    getCustomer(id: bigint): Promise<Customer | null>;
    getCustomerOrderHistory(customerId: bigint): Promise<Array<SaleOrder>>;
    getCustomers(): Promise<Array<Customer>>;
    getDiscountCode(id: bigint): Promise<DiscountCode | null>;
    getDiscountCodes(): Promise<Array<DiscountCode>>;
    getLoyaltyBalance(customerId: bigint): Promise<bigint>;
    getLoyaltyTransactions(customerId: bigint): Promise<Array<LoyaltyTransaction>>;
    getMyRole(): Promise<StaffRole | null>;
    getSaleOrder(id: bigint): Promise<SaleOrder | null>;
    getSaleOrders(): Promise<Array<SaleOrder>>;
    getStaffAccount(id: bigint): Promise<StaffAccount | null>;
    getStaffAccounts(): Promise<Array<StaffAccount>>;
    getTaxConfig(id: bigint): Promise<TaxConfig | null>;
    getTaxConfigs(): Promise<Array<TaxConfig>>;
    isCallerAdmin(): Promise<boolean>;
    redeemLoyaltyPoints(customerId: bigint, points: bigint, discountAmount: number): Promise<void>;
    toggleDiscountCode(id: bigint): Promise<void>;
    toggleTaxConfig(id: bigint): Promise<void>;
    updateCustomer(id: bigint, name: string, email: string, phone: string): Promise<void>;
    updateDiscountCode(id: bigint, input: DiscountCodeInput): Promise<void>;
    updateStaffAccount(id: bigint, name: string, role: StaffRole, isActive: boolean): Promise<void>;
    updateTaxConfig(id: bigint, input: TaxConfigInput): Promise<void>;
}
