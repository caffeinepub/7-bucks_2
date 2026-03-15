import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface Transaction {
    id: string;
    totalChargedCents: bigint;
    status: TransactionStatus;
    userId: Principal;
    createdAt: bigint;
    errorMessage?: string;
    recipientEcocash: string;
    amountCents: bigint;
    feeCents: bigint;
    senderName: string;
    cardLast4: string;
    contipayRef: string;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface ContiPayConfig {
    disburseEndpoint: string;
    acquireEndpoint: string;
    merchantId: string;
    apiKey: string;
    apiSecret: string;
    sslPemContent: string;
}
export interface UserProfile {
    name: string;
    phoneNumber?: string;
}
export interface http_header {
    value: string;
    name: string;
}
export enum TransactionStatus {
    pending = "pending",
    completed = "completed",
    verifying = "verifying",
    failed = "failed",
    authorizing = "authorizing",
    disbursing = "disbursing"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    calculateFees(grossAmountCents: bigint): Promise<{
        fee: bigint;
        totalCharged: bigint;
        netToRecipient: bigint;
    }>;
    contipayAcquire(cardDetails: string, amountCents: bigint): Promise<{
        errorMessage: string;
        errorCode: string;
        success: boolean;
        contipayRef: string;
    }>;
    contipayDisburse(ecocashNumber: string, amountCents: bigint): Promise<{
        errorMessage: string;
        errorCode: string;
        success: boolean;
        contipayRef: string;
    }>;
    createTransaction(amountCents: bigint, recipientEcocash: string, senderName: string, cardLast4: string): Promise<string>;
    getAllTransactions(): Promise<Array<Transaction>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getConfig(): Promise<ContiPayConfig>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getUserTransactions(userId: Principal): Promise<Array<Transaction>>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setConfig(merchantId: string, apiKey: string, apiSecret: string, acquireEndpoint: string, disburseEndpoint: string, sslPemContent: string): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateTransactionStatus(txId: string, status: TransactionStatus, contipayRef: string, errorMessage: string | null): Promise<void>;
    verifyWebhook(payload: string, signature: string): Promise<boolean>;
}
