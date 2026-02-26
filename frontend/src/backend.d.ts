import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface SaleOrderItem {
    itemId: bigint;
    quantity: bigint;
    price: number;
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
export interface LoyaltyTransaction {
    id: bigint;
    createdAt: bigint;
    customerId: bigint;
    points: bigint;
    reason: string;
}
export interface TaxBreakdown {
    name: string;
    rate: number;
    amount: number;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createSaleOrder(items: Array<SaleOrderItem>, subtotal: number, totalAmount: number, discountAmount: number, taxBreakdown: Array<TaxBreakdown>, taxTotal: number, note: string, discountCodeId: bigint | null, customerId: bigint | null): Promise<bigint>;
    getCallerUserRole(): Promise<UserRole>;
    getCustomerOrderHistory(customerId: bigint): Promise<Array<SaleOrder>>;
    getLoyaltyBalance(customerId: bigint): Promise<bigint>;
    getLoyaltyTransactions(customerId: bigint): Promise<Array<LoyaltyTransaction>>;
    isCallerAdmin(): Promise<boolean>;
    redeemLoyaltyPoints(customerId: bigint, points: bigint, discountAmount: number): Promise<void>;
}
