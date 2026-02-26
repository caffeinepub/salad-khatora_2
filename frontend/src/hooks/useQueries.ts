import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { InventoryItem, InventoryResponse, UserProfile } from '../backend';

// ─── User Profile ────────────────────────────────────────────────────────────

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

export function useIsCallerAdmin() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isCallerAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
}

// ─── Inventory ───────────────────────────────────────────────────────────────

export function useListInventory() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<InventoryResponse[]>({
    queryKey: ['inventory'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listInventory();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useAddInventoryItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: InventoryItem) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addInventoryItem(item);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryStats'] });
      queryClient.invalidateQueries({ queryKey: ['lowStockItems'] });
    },
  });
}

export function useUpdateInventoryItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, updatedItem }: { name: string; updatedItem: InventoryItem }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateInventoryItem(name, updatedItem);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryStats'] });
      queryClient.invalidateQueries({ queryKey: ['lowStockItems'] });
    },
  });
}

export function useDeleteInventoryItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteInventoryItem(name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryStats'] });
      queryClient.invalidateQueries({ queryKey: ['lowStockItems'] });
    },
  });
}

// ─── Dashboard Stats ─────────────────────────────────────────────────────────

export function useInventoryStats() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<{ totalValue: number; lowStockCount: bigint; totalItems: bigint }>({
    queryKey: ['inventoryStats'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getInventoryStats();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useLowStockItems() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<InventoryResponse[]>({
    queryKey: ['lowStockItems'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getLowStockItems();
    },
    enabled: !!actor && !actorFetching,
  });
}
