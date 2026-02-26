import Map "mo:core/Map";
import List "mo:core/List";
import Nat "mo:core/Nat";

module {
  type OldActor = {
    adminPrincipal : ?Principal;
    userProfiles : Map.Map<Principal, { name : Text }>;
    nextIngredientId : Nat;
    ingredients : Map.Map<Text, {
      id : Nat;
      name : Text;
      quantity : Float;
      unit : Text;
      costPrice : Float;
      supplierId : ?Nat;
      lowStockThreshold : Float;
      expiryDate : ?Int;
      createdAt : Int;
    }>;
    ingredientsById : Map.Map<Nat, {
      id : Nat;
      name : Text;
      quantity : Float;
      unit : Text;
      costPrice : Float;
      supplierId : ?Nat;
      lowStockThreshold : Float;
      expiryDate : ?Int;
      createdAt : Int;
    }>;
    nextSupplierId : Nat;
    suppliers : Map.Map<Nat, {
      id : Nat;
      name : Text;
      contactPerson : Text;
      email : Text;
      phone : Text;
      address : Text;
      leadTimeDays : Nat;
      notes : Text;
      createdAt : Int;
    }>;
    nextPurchaseOrderId : Nat;
    purchaseOrders : Map.Map<Nat, {
      id : Nat;
      supplierId : Nat;
      supplierName : Text;
      items : [{
        ingredientId : Nat;
        ingredientName : Text;
        quantityOrdered : Float;
        unit : Text;
      }];
      status : {
        #pending;
        #received;
        #cancelled;
      };
      notes : Text;
      createdAt : Int;
    }>;
    nextMenuItemId : Nat;
    menu : Map.Map<Nat, {
      id : Nat;
      name : Text;
      description : Text;
      ingredients : [(Text, Float)];
      sellingPrice : Float;
      isAvailable : Bool;
      createdAt : Int;
      costPerServing : Float;
      availableFromHour : ?Nat;
      availableToHour : ?Nat;
      availableDays : ?[Nat];
    }>;
    nextComboDealId : Nat;
    comboDeals : Map.Map<Nat, {
      id : Nat;
      name : Text;
      description : Text;
      menuItemIds : [Nat];
      bundlePrice : Float;
      isAvailable : Bool;
      createdAt : Int;
      totalIndividualPrice : Float;
      savings : Float;
    }>;
    nextSaleOrderId : Nat;
    sales : Map.Map<Nat, {
      id : Nat;
      items : [(Nat, Text, Nat, Float)];
      subtotal : Float;
      totalAmount : Float;
      note : Text;
      createdAt : Int;
    }>;
    nextCustomerId : Nat;
    customers : Map.Map<Nat, {
      id : Nat;
      name : Text;
      email : Text;
      phone : Text;
      address : Text;
      notes : Text;
      createdAt : Int;
    }>;
    nextSubscriptionId : Nat;
    subscriptions : Map.Map<Nat, {
      id : Nat;
      customerId : Nat;
      planName : Text;
      menuItemIds : [Nat];
      frequencyDays : Nat;
      startDate : Int;
      nextRenewalDate : Int;
      status : { #active; #paused; #cancelled };
      totalPrice : Float;
      createdAt : Int;
    }>;
    nextWasteLogId : Nat;
    wasteLogs : Map.Map<Nat, {
      id : Nat;
      ingredientId : Nat;
      ingredientName : Text;
      quantity : Float;
      unit : Text;
      reason : Text;
      costLoss : Float;
      loggedAt : Int;
    }>;
    alerts : List.List<{
      id : Nat;
      alertType : { #lowStock; #subscriptionRenewal; #expiryWarning; #other };
      message : Text;
      relatedEntityId : Nat;
      isRead : Bool;
      createdAt : Int;
    }>;
  };

  type NewActor = {
    adminPrincipal : ?Principal;
    userProfiles : Map.Map<Principal, { name : Text }>;
    nextIngredientId : Nat;
    ingredients : Map.Map<Text, {
      id : Nat;
      name : Text;
      quantity : Float;
      unit : Text;
      costPrice : Float;
      supplierId : ?Nat;
      lowStockThreshold : Float;
      expiryDate : ?Int;
      createdAt : Int;
    }>;
    ingredientsById : Map.Map<Nat, {
      id : Nat;
      name : Text;
      quantity : Float;
      unit : Text;
      costPrice : Float;
      supplierId : ?Nat;
      lowStockThreshold : Float;
      expiryDate : ?Int;
      createdAt : Int;
    }>;
    nextSupplierId : Nat;
    suppliers : Map.Map<Nat, {
      id : Nat;
      name : Text;
      contactPerson : Text;
      email : Text;
      phone : Text;
      address : Text;
      leadTimeDays : Nat;
      notes : Text;
      createdAt : Int;
    }>;
    nextPurchaseOrderId : Nat;
    purchaseOrders : Map.Map<Nat, {
      id : Nat;
      supplierId : Nat;
      supplierName : Text;
      items : [{
        ingredientId : Nat;
        ingredientName : Text;
        quantityOrdered : Float;
        unit : Text;
      }];
      status : {
        #pending;
        #received;
        #cancelled;
      };
      notes : Text;
      createdAt : Int;
    }>;
    nextMenuItemId : Nat;
    menu : Map.Map<Nat, {
      id : Nat;
      name : Text;
      description : Text;
      ingredients : [(Text, Float)];
      sellingPrice : Float;
      isAvailable : Bool;
      createdAt : Int;
      costPerServing : Float;
      availableFromHour : ?Nat;
      availableToHour : ?Nat;
      availableDays : ?[Nat];
    }>;
    nextComboDealId : Nat;
    comboDeals : Map.Map<Nat, {
      id : Nat;
      name : Text;
      description : Text;
      menuItemIds : [Nat];
      bundlePrice : Float;
      isAvailable : Bool;
      createdAt : Int;
      totalIndividualPrice : Float;
      savings : Float;
    }>;
    nextSaleOrderId : Nat;
    sales : Map.Map<Nat, {
      id : Nat;
      items : [(Nat, Text, Nat, Float)];
      subtotal : Float;
      discountCodeId : ?Nat;
      discountAmount : Float;
      taxBreakdown : [{
        name : Text;
        rate : Float;
        amount : Float;
      }];
      taxTotal : Float;
      totalAmount : Float;
      note : Text;
      createdAt : Int;
    }>;
    nextCustomerId : Nat;
    customers : Map.Map<Nat, {
      id : Nat;
      name : Text;
      email : Text;
      phone : Text;
      address : Text;
      notes : Text;
      createdAt : Int;
    }>;
    nextSubscriptionId : Nat;
    subscriptions : Map.Map<Nat, {
      id : Nat;
      customerId : Nat;
      planName : Text;
      menuItemIds : [Nat];
      frequencyDays : Nat;
      startDate : Int;
      nextRenewalDate : Int;
      status : { #active; #paused; #cancelled };
      totalPrice : Float;
      createdAt : Int;
    }>;
    nextWasteLogId : Nat;
    wasteLogs : Map.Map<Nat, {
      id : Nat;
      ingredientId : Nat;
      ingredientName : Text;
      quantity : Float;
      unit : Text;
      reason : Text;
      costLoss : Float;
      loggedAt : Int;
    }>;
    alerts : List.List<{
      id : Nat;
      alertType : { #lowStock; #subscriptionRenewal; #expiryWarning; #other };
      message : Text;
      relatedEntityId : Nat;
      isRead : Bool;
      createdAt : Int;
    }>;
    discountCodes : Map.Map<Nat, {
      id : Nat;
      code : Text;
      description : Text;
      discountType : { #percentage; #fixed };
      discountValue : Float;
      minimumOrderAmount : Float;
      maxUses : ?Nat;
      usedCount : Nat;
      isActive : Bool;
      expiresAt : ?Int;
      createdAt : Int;
    }>;
    nextDiscountCodeId : Nat;
    taxConfigs : Map.Map<Nat, {
      id : Nat;
      name : Text;
      rate : Float;
      isActive : Bool;
      appliesTo : { #all; #menuItems; #combos };
      createdAt : Int;
    }>;
    nextTaxConfigId : Nat;
  };

  public func run(old : OldActor) : NewActor {
    {
      old with
      discountCodes = Map.empty<Nat, {
        id : Nat;
        code : Text;
        description : Text;
        discountType : { #percentage; #fixed };
        discountValue : Float;
        minimumOrderAmount : Float;
        maxUses : ?Nat;
        usedCount : Nat;
        isActive : Bool;
        expiresAt : ?Int;
        createdAt : Int;
      }>();
      nextDiscountCodeId = 1;
      taxConfigs = Map.empty<Nat, {
        id : Nat;
        name : Text;
        rate : Float;
        isActive : Bool;
        appliesTo : { #all; #menuItems; #combos };
        createdAt : Int;
      }>();
      nextTaxConfigId = 1;
      sales = old.sales.map<Nat, {
        id : Nat;
        items : [(Nat, Text, Nat, Float)];
        subtotal : Float;
        totalAmount : Float;
        note : Text;
        createdAt : Int;
      }, {
        id : Nat;
        items : [(Nat, Text, Nat, Float)];
        subtotal : Float;
        discountCodeId : ?Nat;
        discountAmount : Float;
        taxBreakdown : [{
          name : Text;
          rate : Float;
          amount : Float;
        }];
        taxTotal : Float;
        totalAmount : Float;
        note : Text;
        createdAt : Int;
      }>(func(_, oldSale) { mapOldSaleOrder(oldSale) });
    };
  };

  func mapOldSaleOrder(oldSale : {
    id : Nat;
    items : [(Nat, Text, Nat, Float)];
    subtotal : Float;
    totalAmount : Float;
    note : Text;
    createdAt : Int;
  }) : {
    id : Nat;
    items : [(Nat, Text, Nat, Float)];
    subtotal : Float;
    discountCodeId : ?Nat;
    discountAmount : Float;
    taxBreakdown : [{
      name : Text;
      rate : Float;
      amount : Float;
    }];
    taxTotal : Float;
    totalAmount : Float;
    note : Text;
    createdAt : Int;
  } {
    {
      oldSale with
      discountCodeId = null;
      discountAmount = 0.0;
      taxBreakdown = [];
      taxTotal = 0.0;
      totalAmount = oldSale.totalAmount;
    };
  };
};
