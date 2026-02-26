import Map "mo:core/Map";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Float "mo:core/Float";
import Time "mo:core/Time";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
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

  let discountCodes = Map.empty<Nat, DiscountCode>();
  let taxConfigs = Map.empty<Nat, TaxConfig>();
  let saleOrders = Map.empty<Nat, SaleOrder>();
  let customers = Map.empty<Nat, Customer>();
  let loyaltyTransactions = Map.empty<Nat, LoyaltyTransaction>();

  var nextDiscountCodeId : Nat = 1;
  var nextTaxConfigId : Nat = 1;
  var nextSaleOrderId : Nat = 1;
  var nextLoyaltyTransactionId : Nat = 1;

  // --- Discount & Coupon System ---
  // ... (existing discount code functions unchanged) ...

  // --- Tax Configuration ---
  // ... (existing tax config functions unchanged) ...

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
      func(txn) { txn.customerId == customerId }
    );

    filtered.sort(
      func(a, b) {
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

        let txn : LoyaltyTransaction = {
          id = nextLoyaltyTransactionId;
          customerId;
          points = -Int.abs(points);
          reason = "Redemption";
          createdAt = Time.now();
        };
        loyaltyTransactions.add(nextLoyaltyTransactionId, txn);
        nextLoyaltyTransactionId += 1;
      };
    };
  };

  func awardLoyaltyPoints(customerId : Nat, points : Nat, reason : Text) {
    switch (customers.get(customerId)) {
      case (null) {};
      case (?customer) {
        let updatedCustomer = {
          customer with
          loyaltyPoints = customer.loyaltyPoints + points;
        };
        customers.add(customerId, updatedCustomer);

        let txn : LoyaltyTransaction = {
          id = nextLoyaltyTransactionId;
          customerId;
          points = Int.abs(points);
          reason;
          createdAt = Time.now();
        };
        loyaltyTransactions.add(nextLoyaltyTransactionId, txn);
        nextLoyaltyTransactionId += 1;
      };
    };
  };

  // --- Sale Order Extensions ---

  public query ({ caller }) func getCustomerOrderHistory(customerId : Nat) : async [SaleOrder] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view order history");
    };

    let filtered = saleOrders.values().toArray().filter(
      func(order) {
        switch (order.customerId) {
          case (null) { false };
          case (?id) { id == customerId };
        };
      }
    );

    filtered.sort(
      func(a, b) {
        Int.compare(b.createdAt, a.createdAt);
      }
    );
  };

  public shared ({ caller }) func createSaleOrder(items : [SaleOrderItem], subtotal : Float, totalAmount : Float, discountAmount : Float, taxBreakdown : [TaxBreakdown], taxTotal : Float, note : Text, discountCodeId : ?Nat, customerId : ?Nat) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create sale orders");
    };

    let order : SaleOrder = {
      id = nextSaleOrderId;
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

    saleOrders.add(nextSaleOrderId, order);
    nextSaleOrderId += 1;

    switch (customerId) {
      case (null) {};
      case (?cid) {
        let points = totalAmount.toInt().toNat();
        awardLoyaltyPoints(cid, points, "Order");
      };
    };

    order.id;
  };
};
