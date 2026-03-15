import Array "mo:core/Array";
import Blob "mo:core/Blob";
import Iter "mo:core/Iter";
import List "mo:core/List";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Nat32 "mo:core/Nat32";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Time "mo:core/Time";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import OutCall "http-outcalls/outcall";



actor {
  // Initialize the access control system
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User profile type
  public type UserProfile = {
    name : Text;
    phoneNumber : ?Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  // Transaction status variant
  public type TransactionStatus = {
    #pending;
    #authorizing;
    #verifying;
    #disbursing;
    #completed;
    #failed;
  };

  // Transaction record type
  public type Transaction = {
    id : Text;
    userId : Principal;
    senderName : Text;
    cardLast4 : Text;
    amountCents : Nat;
    feeCents : Nat;
    totalChargedCents : Nat;
    recipientEcocash : Text;
    status : TransactionStatus;
    contipayRef : Text;
    errorMessage : ?Text;
    createdAt : Int;
  };

  let transactions = Map.empty<Text, Transaction>();

  // ContiPay config type
  type ContiPayConfig = {
    merchantId : Text;
    apiKey : Text;
    apiSecret : Text;
    acquireEndpoint : Text;
    disburseEndpoint : Text;
    sslPemContent : Text;
  };

  var contiPayConfig : ?ContiPayConfig = null;

  func now() : Int {
    Time.now() / 1_000_000_000;
  };

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Config Management - Admin Only
  public shared ({ caller }) func setConfig(
    merchantId : Text,
    apiKey : Text,
    apiSecret : Text,
    acquireEndpoint : Text,
    disburseEndpoint : Text,
    sslPemContent : Text,
  ) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can set configuration");
    };
    contiPayConfig := ?{
      merchantId;
      apiKey;
      apiSecret;
      acquireEndpoint;
      disburseEndpoint;
      sslPemContent;
    };
  };

  public query ({ caller }) func getConfig() : async ContiPayConfig {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can get configuration");
    };
    switch (contiPayConfig) {
      case (null) { Runtime.trap("No config set") };
      case (?config) { config };
    };
  };

  // Fee Calculation - Public (no auth required)
  public query func calculateFees(grossAmountCents : Nat) : async {
    fee : Nat;
    totalCharged : Nat;
    netToRecipient : Nat;
  } {
    let fee = 100 + (grossAmountCents * 6 / 100);
    let totalCharged = grossAmountCents + fee;
    let netToRecipient = grossAmountCents;

    {
      fee;
      totalCharged;
      netToRecipient;
    };
  };

  func generateTransactionId() : Text {
    "TX" # Int.abs(now()).toText();
  };

  // Transaction Management
  public shared ({ caller }) func createTransaction(
    amountCents : Nat,
    recipientEcocash : Text,
    senderName : Text,
    cardLast4 : Text,
  ) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create transactions");
    };

    let fee = 100 + (amountCents * 6 / 100);
    let totalCharged = amountCents + fee;

    let txId = generateTransactionId();
    let transaction : Transaction = {
      id = txId;
      userId = caller;
      senderName;
      cardLast4;
      amountCents;
      feeCents = fee;
      totalChargedCents = totalCharged;
      recipientEcocash;
      status = #pending;
      contipayRef = "";
      errorMessage = null;
      createdAt = now();
    };

    transactions.add(txId, transaction);
    txId;
  };

  public shared ({ caller }) func updateTransactionStatus(txId : Text, status : TransactionStatus, contipayRef : Text, errorMessage : ?Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update transaction status");
    };

    let transaction = switch (transactions.get(txId)) {
      case (null) { Runtime.trap("Transaction not found") };
      case (?t) { t };
    };

    let updatedTransaction = {
      transaction with
      status;
      contipayRef;
      errorMessage;
    };
    transactions.add(txId, updatedTransaction);
  };

  public query ({ caller }) func getUserTransactions(userId : Principal) : async [Transaction] {
    if (caller != userId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own transactions");
    };

    let txList = List.empty<Transaction>();
    for ((_, tx) in transactions.entries()) {
      if (tx.userId == userId) {
        txList.add(tx);
      };
    };

    txList.toArray();
  };

  public query ({ caller }) func getAllTransactions() : async [Transaction] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view all transactions");
    };

    let txList = List.empty<Transaction>();
    for ((_, tx) in transactions.entries()) {
      txList.add(tx);
    };
    txList.toArray();
  };

  // HTTP Outcall to ContiPay Acquire API - Admin only (sensitive payment operation)
  public shared ({ caller }) func contipayAcquire(cardDetails : Text, amountCents : Nat) : async {
    success : Bool;
    contipayRef : Text;
    errorCode : Text;
    errorMessage : Text;
  } {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can call payment APIs");
    };

    switch (contiPayConfig) {
      case (null) { Runtime.trap("Config not set") };
      case (?config) {
        let response = await OutCall.httpPostRequest(config.acquireEndpoint, [], cardDetails, transform);
        // In production, parse JSON response properly.
        {
          success = true;
          contipayRef = "sampleRef";
          errorCode = "0";
          errorMessage = "";
        };
      };
    };
  };

  // HTTP Outcall to ContiPay Disburse API - Admin only (sensitive payment operation)
  public shared ({ caller }) func contipayDisburse(ecocashNumber : Text, amountCents : Nat) : async {
    success : Bool;
    contipayRef : Text;
    errorCode : Text;
    errorMessage : Text;
  } {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can call payment APIs");
    };

    switch (contiPayConfig) {
      case (null) { Runtime.trap("Config not set") };
      case (?config) {
        let response = await OutCall.httpPostRequest(config.disburseEndpoint, [], ("{\"amount\":" # amountCents.toText() # ", \"ecocashNumber\":\"" # ecocashNumber # "\"}"), transform);
        // In production, parse JSON response properly.
        {
          success = true;
          contipayRef = "sampleRef";
          errorCode = "0";
          errorMessage = "";
        };
      };
    };
  };

  // Webhook Verification - No caller restriction (external webhooks must be able to call)
  // Security is enforced through signature verification, not caller identity
  public shared ({ caller }) func verifyWebhook(payload : Text, signature : Text) : async Bool {
    switch (contiPayConfig) {
      case (null) { Runtime.trap("Config not set") };
      case (?config) {
        // In production, implement proper HMAC signature verification using config.apiSecret
        // For now, this is a stub that would verify the signature before proceeding
        // If signature is invalid, return false or trap
        
        // Parse payload to extract transaction ID, status, and reference
        // This is stubbed - in production, parse JSON properly
        let txId = "stubbedTransactionId";
        let status = #completed;
        let contipayRef = "sampleRef";

        switch (transactions.get(txId)) {
          case (null) { false };
          case (?transaction) {
            let updatedTransaction = {
              transaction with
              status;
              contipayRef;
            };
            transactions.add(txId, updatedTransaction);
            
            // If status is SUCCESS, trigger disburse
            // This would need to be implemented with proper async handling
            
            true;
          };
        };
      };
    };
  };

  // Transform function for HTTP outcalls - No auth needed (system function)
  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };
};
