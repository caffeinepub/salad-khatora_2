import Map "mo:core/Map";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Float "mo:core/Float";
import Time "mo:core/Time";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";



actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  type DiscountType = {
    #percentage;
    #fixed;
  };

  type TaxAppliesTo = {
    #all;
    #menuItems;
    #combos;
  };

  type TaxBreakdown = {
    name : Text;
    rate : Float;
    amount : Float;
  };

  type TaxCalculationResult = {
    breakdown : [TaxBreakdown];
    totalTaxAmount : Float;
  };

  type DiscountCode = {
    id : Nat;
    code : Text;
    description : Text;
    discountType : DiscountType;
    discountValue : Float;
    minimumOrderAmount : Float;
    maxUses : ?Nat;
    usedCount : Nat;
    isActive : Bool;
    expiresAt : ?Int;
    createdAt : Int;
  };

  type DiscountApplicationResult = {
    discountAmount : Float;
    finalTotal : Float;
    discountCode : DiscountCode;
  };

  type DiscountCodeInput = {
    code : Text;
    description : Text;
    discountType : DiscountType;
    discountValue : Float;
    minimumOrderAmount : Float;
    maxUses : ?Nat;
    expiresAt : ?Int;
  };

  type TaxConfig = {
    id : Nat;
    name : Text;
    rate : Float;
    isActive : Bool;
    appliesTo : TaxAppliesTo;
    createdAt : Int;
  };

  type TaxConfigInput = {
    name : Text;
    rate : Float;
    appliesTo : TaxAppliesTo;
  };

  type SaleOrder = {
    id : Nat;
    items : [SaleOrderItem];
    subtotal : Float;
    totalAmount : Float;
    discountAmount : Float;
    taxBreakdown : [TaxBreakdown];
    taxTotal : Float;
    note : Text;
    createdAt : Int;
    discountCodeId : ?Nat;
    customerId : ?Nat;
  };

  type SaleOrderItem = {
    itemId : Nat;
    quantity : Nat;
    price : Float;
  };

  type Customer = {
    id : Nat;
    name : Text;
    email : Text;
    phone : Text;
    createdAt : Int;
    loyaltyPoints : Nat;
  };

  type LoyaltyTransaction = {
    id : Nat;
    customerId : Nat;
    points : Int;
    reason : Text;
    createdAt : Int;
  };

  type StaffRole = {
    #cashier;
    #manager;
    #admin;
  };

  type StaffAccount = {
    id : Nat;
    principal : Principal;
    name : Text;
    role : StaffRole;
    isActive : Bool;
    createdAt : Int;
  };

  type AuditLog = {
    id : Nat;
    actorPrincipal : Text;
    action : Text;
    targetType : Text;
    targetId : ?Nat;
    details : Text;
    timestamp : Int;
  };

  let discountCodes = Map.empty<Nat, DiscountCode>();
  let taxConfigs = Map.empty<Nat, TaxConfig>();
  let saleOrders = Map.empty<Nat, SaleOrder>();
  let customers = Map.empty<Nat, Customer>();
  let loyaltyTransactions = Map.empty<Nat, LoyaltyTransaction>();
  let staffAccounts = Map.empty<Nat, StaffAccount>();
  let auditLogs = Map.empty<Nat, AuditLog>();

  var nextDiscountCodeId : Nat = 1;
  var nextTaxConfigId : Nat = 1;
  var nextSaleOrderId : Nat = 1;
  var nextLoyaltyTransactionId : Nat = 1;
  var nextStaffAccountId : Nat = 1;
  var nextAuditLogId : Nat = 1;

  func staffRoleToText(role : StaffRole) : Text {
    switch (role) {
      case (#cashier) { "cashier" };
      case (#manager) { "manager" };
      case (#admin) { "admin" };
    };
  };

  func logAudit(callerPrincipal : Principal, action : Text, targetType : Text, targetId : ?Nat, details : Text) {
    let actorText = callerPrincipal.toText();

    let logEntry : AuditLog = {
      id = nextAuditLogId;
      actorPrincipal = actorText;
      action;
      targetType;
      targetId;
      details;
      timestamp = Time.now();
    };

    auditLogs.add(nextAuditLogId, logEntry);
    nextAuditLogId += 1;
  };

  // --- Staff Account Management ---

  public shared ({ caller }) func createStaffAccount(principal : Principal, name : Text, role : StaffRole) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create staff accounts");
    };

    let id = nextStaffAccountId;
    let account : StaffAccount = {
      id;
      principal;
      name;
      role;
      isActive = true;
      createdAt = Time.now();
    };

    staffAccounts.add(id, account);
    nextStaffAccountId += 1;
    logAudit(caller, "createStaffAccount", "StaffAccount", ?id, "Created new staff account '" # name # "' with role " # staffRoleToText(role));
  };

  public query ({ caller }) func getStaffAccounts() : async [StaffAccount] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view staff accounts");
    };

    staffAccounts.values().toArray();
  };

  public query ({ caller }) func getStaffAccount(id : Nat) : async ?StaffAccount {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can get staff account info");
    };
    staffAccounts.get(id);
  };

  public shared ({ caller }) func updateStaffAccount(id : Nat, name : Text, role : StaffRole, isActive : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update staff accounts");
    };

    switch (staffAccounts.get(id)) {
      case (null) { Runtime.trap("Staff account not found") };
      case (?account) {
        let updatedAccount = {
          account with
          name;
          role;
          isActive;
        };
        staffAccounts.add(id, updatedAccount);
        logAudit(caller, "updateStaffAccount", "StaffAccount", ?id, "Updated staff account '" # name # "' to role " # staffRoleToText(role));
      };
    };
  };

  public shared ({ caller }) func deleteStaffAccount(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete staff accounts");
    };

    switch (staffAccounts.get(id)) {
      case (null) { Runtime.trap("Staff account not found") };
      case (?account) {
        staffAccounts.remove(id);
        logAudit(caller, "deleteStaffAccount", "StaffAccount", ?id, "Deleted staff account '" # account.name # "' with role " # staffRoleToText(account.role));
      };
    };
  };

  // Public query — returns the role of the calling principal, or null if not a staff member.
  // No authorization check required: any caller may query their own role.
  public query ({ caller }) func getMyRole() : async ?StaffRole {
    // Check if the caller is the admin principal first
    if (AccessControl.isAdmin(accessControlState, caller)) {
      return ?#admin;
    };

    let allAccounts = staffAccounts.values().toArray();
    var result : ?StaffRole = null;
    var i = 0;
    while (i < allAccounts.size()) {
      let account = allAccounts[i];
      if (account.principal == caller and account.isActive) {
        result := ?account.role;
        i := allAccounts.size(); // break
      };
      i += 1;
    };
    result;
  };

  public query ({ caller }) func getAuditLogs(limit : Nat, offset : Nat) : async [AuditLog] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view audit logs");
    };

    let logArray = auditLogs.values().toArray().sort(
      func(a : AuditLog, b : AuditLog) : Order.Order {
        Int.compare(b.timestamp, a.timestamp);
      }
    );

    let total = logArray.size();
    let start = if (offset < total) { offset } else { total };
    let end_ = Nat.min(total, start + limit);

    logArray.sliceToArray(start, end_);
  };

  // --- Discount & Coupon System ---

  public shared ({ caller }) func createDiscountCode(input : DiscountCodeInput) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create discount codes");
    };

    let id = nextDiscountCodeId;
    let dc : DiscountCode = {
      id;
      code = input.code;
      description = input.description;
      discountType = input.discountType;
      discountValue = input.discountValue;
      minimumOrderAmount = input.minimumOrderAmount;
      maxUses = input.maxUses;
      usedCount = 0;
      isActive = true;
      expiresAt = input.expiresAt;
      createdAt = Time.now();
    };

    discountCodes.add(id, dc);
    nextDiscountCodeId += 1;
    logAudit(caller, "createDiscountCode", "DiscountCode", ?id, "Created discount code '" # input.code # "'");
    id;
  };

  public query ({ caller }) func getDiscountCodes() : async [DiscountCode] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view discount codes");
    };
    discountCodes.values().toArray();
  };

  public query ({ caller }) func getDiscountCode(id : Nat) : async ?DiscountCode {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view discount codes");
    };
    discountCodes.get(id);
  };

  public shared ({ caller }) func updateDiscountCode(id : Nat, input : DiscountCodeInput) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update discount codes");
    };

    switch (discountCodes.get(id)) {
      case (null) { Runtime.trap("Discount code not found") };
      case (?dc) {
        let updated : DiscountCode = {
          dc with
          code = input.code;
          description = input.description;
          discountType = input.discountType;
          discountValue = input.discountValue;
          minimumOrderAmount = input.minimumOrderAmount;
          maxUses = input.maxUses;
          expiresAt = input.expiresAt;
        };
        discountCodes.add(id, updated);
        logAudit(caller, "updateDiscountCode", "DiscountCode", ?id, "Updated discount code '" # input.code # "'");
      };
    };
  };

  public shared ({ caller }) func toggleDiscountCode(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can toggle discount codes");
    };

    switch (discountCodes.get(id)) {
      case (null) { Runtime.trap("Discount code not found") };
      case (?dc) {
        let updated : DiscountCode = { dc with isActive = not dc.isActive };
        discountCodes.add(id, updated);
        logAudit(caller, "toggleDiscountCode", "DiscountCode", ?id, "Toggled discount code '" # dc.code # "' to " # (if (not dc.isActive) { "active" } else { "inactive" }));
      };
    };
  };

  public shared ({ caller }) func deleteDiscountCode(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete discount codes");
    };

    switch (discountCodes.get(id)) {
      case (null) { Runtime.trap("Discount code not found") };
      case (?dc) {
        discountCodes.remove(id);
        logAudit(caller, "deleteDiscountCode", "DiscountCode", ?id, "Deleted discount code '" # dc.code # "'");
      };
    };
  };

  public query func applyDiscountCode(code : Text, orderTotal : Float) : async DiscountApplicationResult {
    var found : ?DiscountCode = null;
    for (dc in discountCodes.values()) {
      if (dc.code == code and dc.isActive) {
        found := ?dc;
      };
    };

    switch (found) {
      case (null) { Runtime.trap("Discount code not found or inactive") };
      case (?dc) {
        if (orderTotal < dc.minimumOrderAmount) {
          Runtime.trap("Order total does not meet minimum amount for this discount");
        };

        switch (dc.maxUses) {
          case (?max) {
            if (dc.usedCount >= max) {
              Runtime.trap("Discount code has reached maximum uses");
            };
          };
          case (null) {};
        };

        switch (dc.expiresAt) {
          case (?exp) {
            if (Time.now() > exp) {
              Runtime.trap("Discount code has expired");
            };
          };
          case (null) {};
        };

        let discountAmount = switch (dc.discountType) {
          case (#percentage) { orderTotal * dc.discountValue / 100.0 };
          case (#fixed) { Float.min(dc.discountValue, orderTotal) };
        };

        {
          discountAmount;
          finalTotal = orderTotal - discountAmount;
          discountCode = dc;
        };
      };
    };
  };

  // --- Tax Configuration ---

  public shared ({ caller }) func createTaxConfig(input : TaxConfigInput) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create tax configurations");
    };

    let id = nextTaxConfigId;
    let tc : TaxConfig = {
      id;
      name = input.name;
      rate = input.rate;
      isActive = true;
      appliesTo = input.appliesTo;
      createdAt = Time.now();
    };

    taxConfigs.add(id, tc);
    nextTaxConfigId += 1;
    logAudit(caller, "createTaxConfig", "TaxConfig", ?id, "Created tax config '" # input.name # "'");
    id;
  };

  public query func getTaxConfigs() : async [TaxConfig] {
    taxConfigs.values().toArray();
  };

  public query func getTaxConfig(id : Nat) : async ?TaxConfig {
    taxConfigs.get(id);
  };

  public shared ({ caller }) func updateTaxConfig(id : Nat, input : TaxConfigInput) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update tax configurations");
    };

    switch (taxConfigs.get(id)) {
      case (null) { Runtime.trap("Tax config not found") };
      case (?tc) {
        let updated : TaxConfig = {
          tc with
          name = input.name;
          rate = input.rate;
          appliesTo = input.appliesTo;
        };
        taxConfigs.add(id, updated);
        logAudit(caller, "updateTaxConfig", "TaxConfig", ?id, "Updated tax config '" # input.name # "'");
      };
    };
  };

  public shared ({ caller }) func toggleTaxConfig(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can toggle tax configurations");
    };

    switch (taxConfigs.get(id)) {
      case (null) { Runtime.trap("Tax config not found") };
      case (?tc) {
        let updated : TaxConfig = { tc with isActive = not tc.isActive };
        taxConfigs.add(id, updated);
        logAudit(caller, "toggleTaxConfig", "TaxConfig", ?id, "Toggled tax config '" # tc.name # "' to " # (if (not tc.isActive) { "active" } else { "inactive" }));
      };
    };
  };

  public shared ({ caller }) func deleteTaxConfig(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete tax configurations");
    };

    switch (taxConfigs.get(id)) {
      case (null) { Runtime.trap("Tax config not found") };
      case (?tc) {
        taxConfigs.remove(id);
        logAudit(caller, "deleteTaxConfig", "TaxConfig", ?id, "Deleted tax config '" # tc.name # "'");
      };
    };
  };

  public query func calculateTax(subtotal : Float, targetType : Text) : async TaxCalculationResult {
    var breakdown : [TaxBreakdown] = [];
    var totalTaxAmount : Float = 0.0;

    for (tc in taxConfigs.values()) {
      if (tc.isActive) {
        let applies = switch (tc.appliesTo) {
          case (#all) { true };
          case (#menuItems) { targetType == "MenuItem" };
          case (#combos) { targetType == "Combo" };
        };

        if (applies) {
          let amount = subtotal * tc.rate / 100.0;
          totalTaxAmount += amount;
          breakdown := breakdown.concat([{
            name = tc.name;
            rate = tc.rate;
            amount;
          }]);
        };
      };
    };

    { breakdown; totalTaxAmount };
  };

  // --- Customer Management ---

  public shared ({ caller }) func createCustomer(name : Text, email : Text, phone : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create customers");
    };

    let id = nextSaleOrderId; // Note: using a dedicated counter would be better but keeping existing pattern
    let customer : Customer = {
      id = nextSaleOrderId;
      name;
      email;
      phone;
      createdAt = Time.now();
      loyaltyPoints = 0;
    };

    customers.add(customer.id, customer);
    logAudit(caller, "createCustomer", "Customer", ?customer.id, "Created customer '" # name # "'");
    customer.id;
  };

  public query ({ caller }) func getCustomers() : async [Customer] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view customers");
    };
    customers.values().toArray();
  };

  public query ({ caller }) func getCustomer(id : Nat) : async ?Customer {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view customer info");
    };
    customers.get(id);
  };

  public shared ({ caller }) func updateCustomer(id : Nat, name : Text, email : Text, phone : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update customers");
    };

    switch (customers.get(id)) {
      case (null) { Runtime.trap("Customer not found") };
      case (?customer) {
        let updated : Customer = { customer with name; email; phone };
        customers.add(id, updated);
        logAudit(caller, "updateCustomer", "Customer", ?id, "Updated customer '" # name # "'");
      };
    };
  };

  public shared ({ caller }) func deleteCustomer(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete customers");
    };

    switch (customers.get(id)) {
      case (null) { Runtime.trap("Customer not found") };
      case (?customer) {
        customers.remove(id);
        logAudit(caller, "deleteCustomer", "Customer", ?id, "Deleted customer '" # customer.name # "'");
      };
    };
  };

  // --- Loyalty Points System ---

  public query ({ caller }) func getLoyaltyBalance(customerId : Nat) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view loyalty balances");
    };
    switch (customers.get(customerId)) {
      case (null) { Runtime.trap("Customer not found") };
      case (?customer) { customer.loyaltyPoints };
    };
  };

  public query ({ caller }) func getLoyaltyTransactions(customerId : Nat) : async [LoyaltyTransaction] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view loyalty transactions");
    };

    let filtered = loyaltyTransactions.values().toArray().filter(
      func(txn : LoyaltyTransaction) : Bool { txn.customerId == customerId }
    );

    filtered.sort(
      func(a : LoyaltyTransaction, b : LoyaltyTransaction) : Order.Order {
        Int.compare(b.createdAt, a.createdAt);
      }
    );
  };

  public shared ({ caller }) func redeemLoyaltyPoints(customerId : Nat, points : Nat, discountAmount : Float) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can redeem loyalty points");
    };

    switch (customers.get(customerId)) {
      case (null) { Runtime.trap("Customer not found") };
      case (?customer) {
        if (customer.loyaltyPoints < points) {
          Runtime.trap("Insufficient loyalty points");
        };

        let updatedCustomer = {
          customer with
          loyaltyPoints = if (customer.loyaltyPoints > points) {
            customer.loyaltyPoints - points;
          } else { 0 };
        };
        customers.add(customerId, updatedCustomer);

        let txnId = nextLoyaltyTransactionId;
        let txn : LoyaltyTransaction = {
          id = txnId;
          customerId;
          points = -Int.abs(points);
          reason = "Redemption";
          createdAt = Time.now();
        };
        loyaltyTransactions.add(txnId, txn);
        nextLoyaltyTransactionId += 1;

        logAudit(caller, "redeemLoyaltyPoints", "Customer", ?customerId, "Redeemed " # points.toText() # " points for discount");
      };
    };
  };

  func awardLoyaltyPoints(callerPrincipal : Principal, customerId : Nat, points : Nat, reason : Text) {
    switch (customers.get(customerId)) {
      case (null) {};
      case (?customer) {
        let updatedCustomer = {
          customer with
          loyaltyPoints = customer.loyaltyPoints + points;
        };
        customers.add(customerId, updatedCustomer);

        let txnId = nextLoyaltyTransactionId;
        let txn : LoyaltyTransaction = {
          id = txnId;
          customerId;
          points = Int.abs(points);
          reason;
          createdAt = Time.now();
        };
        loyaltyTransactions.add(txnId, txn);
        nextLoyaltyTransactionId += 1;

        logAudit(callerPrincipal, "awardLoyaltyPoints", "Customer", ?customerId, "Awarded " # points.toText() # " points for " # reason);
      };
    };
  };

  // --- Sale Orders ---

  public query ({ caller }) func getCustomerOrderHistory(customerId : Nat) : async [SaleOrder] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view order history");
    };

    let filtered = saleOrders.values().toArray().filter(
      func(order : SaleOrder) : Bool {
        switch (order.customerId) {
          case (null) { false };
          case (?id) { id == customerId };
        };
      }
    );

    filtered.sort(
      func(a : SaleOrder, b : SaleOrder) : Order.Order {
        Int.compare(b.createdAt, a.createdAt);
      }
    );
  };

  public query ({ caller }) func getSaleOrders() : async [SaleOrder] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all sale orders");
    };
    saleOrders.values().toArray();
  };

  public query ({ caller }) func getSaleOrder(id : Nat) : async ?SaleOrder {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view sale orders");
    };
    saleOrders.get(id);
  };

  public shared ({ caller }) func createSaleOrder(items : [SaleOrderItem], subtotal : Float, totalAmount : Float, discountAmount : Float, taxBreakdown : [TaxBreakdown], taxTotal : Float, note : Text, discountCodeId : ?Nat, customerId : ?Nat) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create sale orders");
    };

    let id = nextSaleOrderId;
    let order : SaleOrder = {
      id;
      items;
      subtotal;
      totalAmount;
      discountAmount;
      taxBreakdown;
      taxTotal;
      note;
      createdAt = Time.now();
      discountCodeId;
      customerId;
    };

    saleOrders.add(id, order);
    nextSaleOrderId += 1;

    // Increment discount code usage if applicable
    switch (discountCodeId) {
      case (null) {};
      case (?dcId) {
        switch (discountCodes.get(dcId)) {
          case (null) {};
          case (?dc) {
            let updated : DiscountCode = { dc with usedCount = dc.usedCount + 1 };
            discountCodes.add(dcId, updated);
          };
        };
      };
    };

    switch (customerId) {
      case (null) {};
      case (?cid) {
        let points = Int.abs(totalAmount.toInt());
        awardLoyaltyPoints(caller, cid, points.toNat(), "Order");
      };
    };

    logAudit(caller, "createSaleOrder", "SaleOrder", ?id, "Created new sale order with total " # totalAmount.toText());
    id;
  };

  public shared ({ caller }) func deleteSaleOrder(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete sale orders");
    };

    switch (saleOrders.get(id)) {
      case (null) { Runtime.trap("Sale order not found") };
      case (?order) {
        saleOrders.remove(id);
        logAudit(caller, "deleteSaleOrder", "SaleOrder", ?id, "Deleted sale order");
      };
    };
  };
};

