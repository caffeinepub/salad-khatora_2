import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface InventoryItem {
    lowStockThreshold: number;
    supplier: string;
    name: string;
    unit: string;
    quantity: number;
    costPricePerUnit: number;
}
export interface UserProfile {
    name: string;
}
export interface InventoryResponse {
    lowStockThreshold: number;
    totalValue: number;
    supplier: string;
    name: string;
    unit: string;
    quantity: number;
    costPricePerUnit: number;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addInventoryItem(item: InventoryItem): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteInventoryItem(name: string): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getInventoryStats(): Promise<{
        totalValue: number;
        lowStockCount: bigint;
        totalItems: bigint;
    }>;
    getLowStockItems(): Promise<Array<InventoryResponse>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    listInventory(): Promise<Array<InventoryResponse>>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateInventoryItem(name: string, updatedItem: InventoryItem): Promise<void>;
}
