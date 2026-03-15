import type { UserProfile } from "@/backend.d";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUserTransactions() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  return useQuery({
    queryKey: ["userTransactions", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return [];
      return actor.getUserTransactions(identity.getPrincipal());
    },
    enabled: !!actor && !isFetching && !!identity,
    refetchInterval: 5_000,
  });
}

export function useCalculateFees(grossCents: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["fees", grossCents?.toString()],
    queryFn: async () => {
      if (!actor || grossCents === null || grossCents <= 0n) return null;
      return actor.calculateFees(grossCents);
    },
    enabled: !!actor && !isFetching && grossCents !== null && grossCents > 0n,
  });
}

export function useCreateTransaction() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({
      amountCents,
      recipientEcocash,
      senderName,
      cardLast4,
    }: {
      amountCents: bigint;
      recipientEcocash: string;
      senderName: string;
      cardLast4: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.createTransaction(
        amountCents,
        recipientEcocash,
        senderName,
        cardLast4,
      );
    },
  });
}

export function useContipayAcquire() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({
      cardDetails,
      amountCents,
    }: {
      cardDetails: string;
      amountCents: bigint;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.contipayAcquire(cardDetails, amountCents);
    },
  });
}

export function useContipayDisburse() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      ecocashNumber,
      amountCents,
    }: {
      ecocashNumber: string;
      amountCents: bigint;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.contipayDisburse(ecocashNumber, amountCents);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userTransactions"] });
    },
  });
}

export function useGetConfig() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["config"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getConfig();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetConfig() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      merchantId,
      apiKey,
      apiSecret,
      acquireEndpoint,
      disburseEndpoint,
      sslPemContent,
    }: {
      merchantId: string;
      apiKey: string;
      apiSecret: string;
      acquireEndpoint: string;
      disburseEndpoint: string;
      sslPemContent: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.setConfig(
        merchantId,
        apiKey,
        apiSecret,
        acquireEndpoint,
        disburseEndpoint,
        sslPemContent,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config"] });
    },
  });
}

export function useUserProfile() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Not connected");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    },
  });
}
