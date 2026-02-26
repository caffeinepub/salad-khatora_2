import Int "mo:core/Int";
import Map "mo:core/Map";
import List "mo:core/List";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Float "mo:core/Float";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Iter "mo:core/Iter";

import Migration "migration";
import Runtime "mo:core/Runtime";

import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

(with migration = Migration.run)
actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  var adminPrincipal : ?Principal = null;

  public query ({ caller }) func getAdminPrincipal() : async Text {
    switch (adminPrincipal) {
      case (null) { "" };
      case (?p) { p.toText() };
    };
  };

  public shared ({ caller }) func reassignAdmin(newPrincipal : Principal) : async () {
    switch (adminPrincipal) {
      case (?currentAdmin) {
        if (caller != currentAdmin) {
          Runtime.trap("Unauthorized: Only current admin can reassign");
        };
      };
      case (null) {
        Runtime.trap("Unauthorized: No admin currently assigned");
      };
    };
    adminPrincipal := ?newPrincipal;
  };

  public shared ({ caller }) func claimAdminIfVacant() : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous callers cannot claim admin");
    };
    switch (adminPrincipal) {
      case (null) {}; // No admin, claim is allowed
      case (?_) {
        Runtime.trap("Unauthorized: Admin already assigned, cannot claim");
      };
    };
    adminPrincipal := ?caller;
  };

  public shared ({ caller }) func vacateAdmin() : async () {
    switch (adminPrincipal) {
      case (null) {
        Runtime.trap("Unauthorized: No admin assigned to vacate");
      };
      case (?currentAdmin) {
        if (caller != currentAdmin) {
          Runtime.trap("Unauthorized: Only current admin can vacate");
        };
        adminPrincipal := null;
      };
    };
  };

  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get profiles");
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

  // --- Discount & Coupon System ---
  public type DiscountType = {
    #percentage;
    #fixed;
  };

  public type DiscountCode = {
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

  public type DiscountApplicationResult = {
    discountAmount : Float;
    finalTotal : Float;
    discountCode : DiscountCode;
  };

  public type DiscountCodeInput = {
    code : Text;
    description : Text;
    discountType : DiscountType;
    discountValue : Float;
    minimumOrderAmount : Float;
    maxUses : ?Nat;
    expiresAt : ?Int;
  };

  var nextDiscountCodeId = 1;
  let discountCodes = Map.empty<Nat, DiscountCode>();

  public shared ({ caller }) func createDiscountCode(input : DiscountCodeInput) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create discount codes");
    };

    // Ensure unique code
    let existingCode = discountCodes.values().find(
      func(dc) { dc.code == input.code }
    );
    switch (existingCode) {
      case (null) {};
      case (?_) { Runtime.trap("Discount code already exists") };
    };

    let discountCode : DiscountCode = {
      id = nextDiscountCodeId;
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

    discountCodes.add(nextDiscountCodeId, discountCode);
    nextDiscountCodeId += 1;
    discountCode.id;
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
      case (?oldDiscount) {
        let updatedDiscount : DiscountCode = {
          oldDiscount with
          code = input.code;
          description = input.description;
          discountType = input.discountType;
          discountValue = input.discountValue;
          minimumOrderAmount = input.minimumOrderAmount;
          maxUses = input.maxUses;
          expiresAt = input.expiresAt;
        };

        discountCodes.add(id, updatedDiscount);
      };
    };
  };

  public shared ({ caller }) func deleteDiscountCode(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete discount codes");
    };
    discountCodes.remove(id);
  };

  public shared ({ caller }) func toggleDiscountCodeActive(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can toggle discount code active status");
    };

    switch (discountCodes.get(id)) {
      case (null) { Runtime.trap("Discount code not found") };
      case (?discount) {
        discountCodes.add(id, { discount with isActive = not discount.isActive });
      };
    };
  };

  // applyDiscountCode modifies state (increments usedCount), so it requires authenticated user
  public shared ({ caller }) func applyDiscountCode(code : Text, orderSubtotal : Float) : async DiscountApplicationResult {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can apply discount codes");
    };

    switch (discountCodes.values().find(func(dc) { dc.code == code })) {
      case (null) { Runtime.trap("Discount code not found") };
      case (?discount) {
        if (not discount.isActive) {
          Runtime.trap("Discount code is not active");
        };

        switch (discount.expiresAt) {
          case (null) {};
          case (?expiresAt) {
            let currentTime = Time.now();
            if (currentTime >= expiresAt) {
              Runtime.trap("Discount code expired");
            };
          };
        };

        switch (discount.maxUses) {
          case (null) {};
          case (?maxUses) {
            if (discount.usedCount >= maxUses) {
              Runtime.trap("Discount code has reached maximum uses");
            };
          };
        };

        if (orderSubtotal < discount.minimumOrderAmount) {
          Runtime.trap("Order subtotal does not meet minimum amount for discount");
        };

        var discountAmount : Float = 0.0;
        switch (discount.discountType) {
          case (#percentage) { discountAmount := (orderSubtotal * discount.discountValue) / 100.0 };
          case (#fixed) { discountAmount := discount.discountValue };
        };

        let finalTotal = Float.max(0.0, orderSubtotal - discountAmount);

        // Update used count
        let updatedDiscount = { discount with usedCount = discount.usedCount + 1 };
        discountCodes.add(discount.id, updatedDiscount);

        {
          discountAmount;
          finalTotal;
          discountCode = updatedDiscount;
        };
      };
    };
  };

  // --- Tax Configuration ---
  public type TaxAppliesTo = {
    #all;
    #menuItems;
    #combos;
  };

  public type TaxConfig = {
    id : Nat;
    name : Text;
    rate : Float;
    isActive : Bool;
    appliesTo : TaxAppliesTo;
    createdAt : Int;
  };

  public type TaxConfigInput = {
    name : Text;
    rate : Float;
    appliesTo : TaxAppliesTo;
  };

  public type TaxBreakdown = {
    name : Text;
    rate : Float;
    amount : Float;
  };

  public type TaxCalculationResult = {
    breakdown : [TaxBreakdown];
    totalTaxAmount : Float;
  };

  var nextTaxConfigId = 1;
  let taxConfigs = Map.empty<Nat, TaxConfig>();

  public shared ({ caller }) func createTaxConfig(input : TaxConfigInput) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create tax configs");
    };

    let taxConfig : TaxConfig = {
      id = nextTaxConfigId;
      name = input.name;
      rate = input.rate;
      isActive = true;
      appliesTo = input.appliesTo;
      createdAt = Time.now();
    };

    taxConfigs.add(nextTaxConfigId, taxConfig);
    nextTaxConfigId += 1;
    taxConfig.id;
  };

  public query ({ caller }) func getTaxConfigs() : async [TaxConfig] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view tax configs");
    };
    taxConfigs.values().toArray();
  };

  public query ({ caller }) func getTaxConfig(id : Nat) : async ?TaxConfig {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view tax configs");
    };
    taxConfigs.get(id);
  };

  public shared ({ caller }) func updateTaxConfig(id : Nat, input : TaxConfigInput) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update tax configs");
    };

    switch (taxConfigs.get(id)) {
      case (null) { Runtime.trap("Tax config not found") };
      case (?oldConfig) {
        let updatedConfig : TaxConfig = {
          oldConfig with
          name = input.name;
          rate = input.rate;
          appliesTo = input.appliesTo;
        };

        taxConfigs.add(id, updatedConfig);
      };
    };
  };

  public shared ({ caller }) func deleteTaxConfig(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete tax configs");
    };
    taxConfigs.remove(id);
  };

  public shared ({ caller }) func toggleTaxConfigActive(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can toggle tax config active status");
    };

    switch (taxConfigs.get(id)) {
      case (null) { Runtime.trap("Tax config not found") };
      case (?taxConfig) {
        taxConfigs.add(id, { taxConfig with isActive = not taxConfig.isActive });
      };
    };
  };

  // calculateTax is a query used internally and by the frontend for display — no auth restriction needed
  public query func calculateTax(subtotal : Float) : async TaxCalculationResult {
    let activeTaxConfigs = taxConfigs.values().toArray().filter(
      func(taxConfig) { taxConfig.isActive }
    );

    let breakdown = activeTaxConfigs.map(
      func(taxConfig) {
        {
          name = taxConfig.name;
          rate = taxConfig.rate;
          amount = (subtotal * taxConfig.rate) / 100.0;
        };
      }
    );

    let totalTaxAmount = breakdown.foldLeft(0.0, func(acc, tax) { acc + tax.amount });

    {
      breakdown;
      totalTaxAmount;
    };
  };

  // --- Sales Reports ---
  public type SalesReportPeriod = {
    #daily;
    #weekly;
  };

  public type TopSellingItem = {
    menuItemId : Nat;
    menuItemName : Text;
    quantitySold : Nat;
    revenue : Float;
  };

  public type SalesReport = {
    periodLabel : Text;
    totalOrdersCount : Nat;
    totalRevenue : Float;
    topSellingItems : [TopSellingItem];
    averageOrderValue : Float;
  };

  // Helper: convert nanosecond timestamp to days since epoch (UTC)
  func nanosToDay(ns : Int) : Int {
    ns / 86_400_000_000_000;
  };

  // Helper: format a day index as YYYY-MM-DD (UTC, approximate)
  func dayToLabel(dayIndex : Int) : Text {
    // dayIndex = days since 1970-01-01
    // Use a simple algorithm to compute year/month/day
    var z = dayIndex + 719468;
    let era : Int = (if (z >= 0) { z } else { z - 146096 }) / 146097;
    let doe : Int = z - era * 146097;
    let yoe : Int = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
    let y : Int = yoe + era * 400;
    let doy : Int = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp : Int = (5 * doy + 2) / 153;
    let d : Int = doy - (153 * mp + 2) / 5 + 1;
    let m : Int = mp + (if (mp < 10) { 3 } else { -9 });
    let yr : Int = y + (if (m <= 2) { 1 } else { 0 });

    let yearStr = yr.toText();
    let monthStr = if (m < 10) { "0" # m.toText() } else { m.toText() };
    let dayStr = if (d < 10) { "0" # d.toText() } else { d.toText() };
    yearStr # "-" # monthStr # "-" # dayStr;
  };

  // getSalesReport is a query — no write restrictions, but restrict to admin for sensitive data
  public query ({ caller }) func getSalesReport(period : SalesReportPeriod, referenceDate : Int) : async SalesReport {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view sales reports");
    };

    let refDay = nanosToDay(referenceDate);

    // Determine start and end day for the period
    let (startDay, endDay, periodLabel) = switch (period) {
      case (#daily) {
        (refDay, refDay + 1, dayToLabel(refDay));
      };
      case (#weekly) {
        // Week starts on Monday: find the Monday of the week containing refDay
        // dayOfWeek: 0=Thu,1=Fri,...,3=Mon (using Tomohiko Sakamoto-like offset)
        // Simple approach: days since epoch, epoch was Thursday
        // (refDay + 4) % 7 gives 0=Mon,1=Tue,...,6=Sun
        let dayOfWeek = ((refDay + 4) % 7 + 7) % 7; // 0=Mon
        let weekStart = refDay - dayOfWeek;
        (weekStart, weekStart + 7, "Week of " # dayToLabel(weekStart));
      };
    };

    // Filter orders in the period
    var totalRevenue : Float = 0.0;
    var totalOrdersCount : Nat = 0;
    let itemSalesMap = Map.empty<Nat, (Text, Nat, Float)>(); // menuItemId -> (name, qty, revenue)

    sales.values().forEach(func(order) {
      let orderDay = nanosToDay(order.createdAt);
      if (orderDay >= startDay and orderDay < endDay) {
        totalRevenue += order.totalAmount;
        totalOrdersCount += 1;

        for ((menuItemId, menuItemName, quantity, price) in order.items.values()) {
          let existing = switch (itemSalesMap.get(menuItemId)) {
            case (null) { (menuItemName, 0, 0.0) };
            case (?v) { v };
          };
          let newQty = existing.1 + quantity;
          let newRevenue = existing.2 + (quantity.toInt().toFloat() * price);
          itemSalesMap.add(menuItemId, (menuItemName, newQty, newRevenue));
        };
      };
    });

    let averageOrderValue = if (totalOrdersCount == 0) {
      0.0
    } else {
      totalRevenue / totalOrdersCount.toInt().toFloat()
    };

    // Build top selling items sorted by quantitySold descending, top 10
    let allItems = itemSalesMap.toArray().map(func((id, (name, qty, rev))) : TopSellingItem {
      { menuItemId = id; menuItemName = name; quantitySold = qty; revenue = rev }
    });

    let sorted = allItems.sort(func(a, b) {
      if (a.quantitySold > b.quantitySold) { #less }
      else if (a.quantitySold < b.quantitySold) { #greater }
      else { #equal }
    });

    let topSellingItems = if (sorted.size() <= 10) {
      sorted
    } else {
      sorted.sliceToArray(0, 10)
    };

    {
      periodLabel;
      totalOrdersCount;
      totalRevenue;
      topSellingItems;
      averageOrderValue;
    };
  };

  // --- Alert System ---
  public type AlertType = {
    #lowStock;
    #subscriptionRenewal;
    #expiryWarning;
    #other;
  };

  public type Alert = {
    id : Nat;
    alertType : AlertType;
    message : Text;
    relatedEntityId : Nat;
    isRead : Bool;
    createdAt : Int;
  };

  let alerts = List.empty<Alert>();
  var nextAlertId = 1;

  func generateAlerts() {
    // Low Stock Alerts
    let lowStockIngredients = ingredients.toArray().filter(
      func((_, ingredient)) { ingredient.quantity <= ingredient.lowStockThreshold }
    );
    for ((_, ingredient) : (Text, Ingredient) in lowStockIngredients.values()) {
      let alert : Alert = {
        id = nextAlertId;
        alertType = #lowStock;
        message = "Low stock for ingredient: " # ingredient.name;
        relatedEntityId = ingredient.id;
        isRead = false;
        createdAt = Time.now();
      };
      nextAlertId += 1;
      alerts.add(alert);
    };

    // Subscription Renewal Alerts
    let upcomingSubs = subscriptions.toArray().filter(
      func((_, sub)) {
        let daysRemaining = (sub.nextRenewalDate - Time.now()) / (24 * 60 * 60 * 1000000000).toInt();
        daysRemaining >= 0 and daysRemaining <= 3
      }
    );
    for ((_, sub) : (Nat, Subscription) in upcomingSubs.values()) {
      let alert : Alert = {
        id = nextAlertId;
        alertType = #subscriptionRenewal;
        message = "Subscription #" # sub.id.toText() # " (" # sub.planName # ") is due for renewal soon.";
        relatedEntityId = sub.id;
        isRead = false;
        createdAt = Time.now();
      };
      nextAlertId += 1;
      alerts.add(alert);
    };

    // Expiry Warnings for Ingredients
    let upcomingExpiries = ingredients.toArray().filter(
      func((_, ingredient)) {
        switch (ingredient.expiryDate) {
          case (null) { false };
          case (?expiry) {
            let daysRemaining = (expiry - Time.now()) / (24 * 60 * 60 * 1000000000).toInt();
            daysRemaining >= 0 and daysRemaining <= 7
          };
        };
      }
    );
    for ((_, ingredient) : (Text, Ingredient) in upcomingExpiries.values()) {
      let alert : Alert = {
        id = nextAlertId;
        alertType = #expiryWarning;
        message = "Ingredient " # ingredient.name # " is expiring soon.";
        relatedEntityId = ingredient.id;
        isRead = false;
        createdAt = Time.now();
      };
      nextAlertId += 1;
      alerts.add(alert);
    };
  };

  public query ({ caller }) func getAlerts() : async [Alert] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view alerts");
    };
    let unreadAlerts = alerts.toArray().filter(
      func(alert) { not alert.isRead }
    );
    unreadAlerts.sort(
      func(a, b) {
        Nat.compare(b.createdAt.toNat(), a.createdAt.toNat());
      }
    );
  };

  public shared ({ caller }) func markAlertRead(alertId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can mark alerts as read");
    };
    let alertsArray = alerts.toArray();
    let updatedAlerts = alertsArray.map(
      func(alert) { if (alert.id == alertId) { { alert with isRead = true } } else { alert } }
    );
    let newAlerts = List.empty<Alert>();
    newAlerts.addAll(updatedAlerts.values());
    alerts.clear();
    alerts.addAll(newAlerts.values());
  };

  public shared ({ caller }) func markAllAlertsRead() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can mark all alerts as read");
    };
    let alertsArray = alerts.toArray();
    let updatedAlerts = alertsArray.map(func(alert) { { alert with isRead = true } });
    let newAlerts = List.empty<Alert>();
    newAlerts.addAll(updatedAlerts.values());
    alerts.clear();
    alerts.addAll(newAlerts.values());
  };

  // --- Ingredient Management ---
  type Ingredient = {
    id : Nat;
    name : Text;
    quantity : Float;
    unit : Text;
    costPrice : Float;
    supplierId : ?Nat;
    lowStockThreshold : Float;
    expiryDate : ?Int;
    createdAt : Int;
  };

  type CreateIngredientRequest = {
    name : Text;
    quantity : Float;
    unit : Text;
    costPrice : Float;
    supplierId : ?Nat;
    lowStockThreshold : Float;
    expiryDate : ?Int;
  };

  type UpdateIngredientRequest = {
    name : Text;
    quantity : Float;
    unit : Text;
    costPrice : Float;
    supplierId : ?Nat;
    lowStockThreshold : Float;
    expiryDate : ?Int;
  };

  var nextIngredientId = 1;
  let ingredients = Map.empty<Text, Ingredient>();
  let ingredientsById = Map.empty<Nat, Ingredient>();

  public shared ({ caller }) func createIngredient(item : CreateIngredientRequest) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add ingredients");
    };

    let ingredient : Ingredient = {
      id = nextIngredientId;
      name = item.name;
      quantity = item.quantity;
      unit = item.unit;
      costPrice = item.costPrice;
      supplierId = item.supplierId;
      lowStockThreshold = item.lowStockThreshold;
      expiryDate = item.expiryDate;
      createdAt = Time.now();
    };

    ingredients.add(item.name, ingredient);
    ingredientsById.add(nextIngredientId, ingredient);
    nextIngredientId += 1;
    ingredient.id;
  };

  public query ({ caller }) func getIngredient(_id : Nat) : async ?Ingredient {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view ingredients");
    };
    ingredientsById.get(_id);
  };

  public query ({ caller }) func getIngredientByName(_name : Text) : async ?Ingredient {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view ingredients");
    };
    ingredients.get(_name);
  };

  public query ({ caller }) func listIngredients() : async [Ingredient] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can list ingredients");
    };
    ingredients.values().toArray();
  };

  public shared ({ caller }) func updateIngredient(_id : Nat, item : UpdateIngredientRequest) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update ingredients");
    };
    switch (ingredientsById.get(_id)) {
      case (null) { Runtime.trap("Ingredient not found") };
      case (?oldIngredient) {
        let updatedIngredient : Ingredient = {
          id = _id;
          name = item.name;
          quantity = item.quantity;
          unit = item.unit;
          costPrice = item.costPrice;
          supplierId = item.supplierId;
          lowStockThreshold = item.lowStockThreshold;
          expiryDate = item.expiryDate;
          createdAt = oldIngredient.createdAt;
        };
        ingredients.add(item.name, updatedIngredient);
        ingredientsById.add(_id, updatedIngredient);
      };
    };
  };

  public shared ({ caller }) func deleteIngredient(_id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete ingredients");
    };
    switch (ingredientsById.get(_id)) {
      case (null) { Runtime.trap("Ingredient not found") };
      case (?ingredient) {
        ingredients.remove(ingredient.name);
        ingredientsById.remove(_id);
      };
    };
  };

  // --- Supplier Management ---
  public type Supplier = {
    id : Nat;
    name : Text;
    contactPerson : Text;
    email : Text;
    phone : Text;
    address : Text;
    leadTimeDays : Nat;
    notes : Text;
    createdAt : Int;
  };

  type CreateSupplierRequest = {
    name : Text;
    contactPerson : Text;
    email : Text;
    phone : Text;
    address : Text;
    leadTimeDays : Nat;
    notes : Text;
  };

  var nextSupplierId = 1;
  let suppliers = Map.empty<Nat, Supplier>();

  public shared ({ caller }) func createSupplier(item : CreateSupplierRequest) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create suppliers");
    };

    let supplier : Supplier = {
      id = nextSupplierId;
      name = item.name;
      contactPerson = item.contactPerson;
      email = item.email;
      phone = item.phone;
      address = item.address;
      leadTimeDays = item.leadTimeDays;
      notes = item.notes;
      createdAt = Time.now();
    };

    suppliers.add(nextSupplierId, supplier);
    nextSupplierId += 1;
    supplier.id;
  };

  public query ({ caller }) func getSuppliers() : async [Supplier] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view suppliers");
    };
    suppliers.values().toArray();
  };

  public query ({ caller }) func getSupplier(id : Nat) : async ?Supplier {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view supplier details");
    };
    suppliers.get(id);
  };

  public shared ({ caller }) func updateSupplier(id : Nat, item : CreateSupplierRequest) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update suppliers");
    };
    switch (suppliers.get(id)) {
      case (null) { Runtime.trap("Supplier not found") };
      case (?_oldSupplier) {
        let updatedSupplier : Supplier = {
          id = id;
          name = item.name;
          contactPerson = item.contactPerson;
          email = item.email;
          phone = item.phone;
          address = item.address;
          leadTimeDays = item.leadTimeDays;
          notes = item.notes;
          createdAt = Time.now();
        };
        suppliers.add(id, updatedSupplier);
      };
    };
  };

  public shared ({ caller }) func deleteSupplier(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete suppliers");
    };
    suppliers.remove(id);
  };

  // --- Purchase Order Management ---
  public type PurchaseOrderStatus = {
    #pending;
    #received;
    #cancelled;
  };

  public type PurchaseOrder = {
    id : Nat;
    supplierId : Nat;
    supplierName : Text;
    items : [{
      ingredientId : Nat;
      ingredientName : Text;
      quantityOrdered : Float;
      unit : Text;
    }];
    status : PurchaseOrderStatus;
    notes : Text;
    createdAt : Int;
  };

  type CreatePurchaseOrderRequest = {
    supplierId : Nat;
    items : [{
      ingredientId : Nat;
      quantityOrdered : Float;
    }];
    notes : Text;
  };

  var nextPurchaseOrderId = 1;
  let purchaseOrders = Map.empty<Nat, PurchaseOrder>();

  public shared ({ caller }) func createPurchaseOrder(order : CreatePurchaseOrderRequest) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) { Runtime.trap("Unauthorized: Only admins can create purchase orders") };
    switch (suppliers.get(order.supplierId)) {
      case (null) { Runtime.trap("Supplier not found") };
      case (?supplier) {
        let items = order.items.map(
          func(item) {
            switch (ingredientsById.get(item.ingredientId)) {
              case (null) { Runtime.trap("Ingredient not found") };
              case (?ingredient) {
                {
                  ingredientId = ingredient.id;
                  ingredientName = ingredient.name;
                  quantityOrdered = item.quantityOrdered;
                  unit = ingredient.unit;
                };
              };
            };
          }
        );

        let purchaseOrder : PurchaseOrder = {
          id = nextPurchaseOrderId;
          supplierId = supplier.id;
          supplierName = supplier.name;
          items;
          status = #pending;
          notes = order.notes;
          createdAt = Time.now();
        };

        purchaseOrders.add(nextPurchaseOrderId, purchaseOrder);
        nextPurchaseOrderId += 1;
        purchaseOrder.id;
      };
    };
  };

  public query ({ caller }) func getPurchaseOrders() : async [PurchaseOrder] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view purchase orders");
    };
    purchaseOrders.values().toArray();
  };

  public query ({ caller }) func getPurchaseOrder(id : Nat) : async ?PurchaseOrder {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view purchase order details");
    };
    purchaseOrders.get(id);
  };

  public shared ({ caller }) func updatePurchaseOrderStatus(id : Nat, newStatus : PurchaseOrderStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) { Runtime.trap("Unauthorized: Only admins can update purchase orders") };
    switch (purchaseOrders.get(id)) {
      case (null) { Runtime.trap("Purchase order not found") };
      case (?purchaseOrder) {
        let updatedOrder = { purchaseOrder with status = newStatus };
        purchaseOrders.add(id, updatedOrder);
      };
    };
  };

  public shared ({ caller }) func autoGeneratePurchaseOrders() : async [Nat] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) { Runtime.trap("Unauthorized: Only admins can auto-generate purchase orders") };
    let lowStockIngredients = ingredients.values().filter(func(ingredient) { ingredient.quantity <= ingredient.lowStockThreshold }).toArray();

    let groupedBySupplier = Map.empty<Nat, List.List<(Nat, Float)>>();

    for (ing in lowStockIngredients.values()) {
      switch (ing.supplierId) {
        case (null) {};
        case (?supplierId) {
          let items = switch (groupedBySupplier.get(supplierId)) {
            case (null) { List.empty<(Nat, Float)>() };
            case (?existing) { existing };
          };
          items.add((ing.id, ing.lowStockThreshold - ing.quantity));
          groupedBySupplier.add(supplierId, items);
        };
      };
    };

    let createdOrderIds = List.empty<Nat>();

    for ((supplierId, itemsList) in groupedBySupplier.entries()) {
      let orderItems = itemsList.toArray().map(func(item) { { ingredientId = item.0; quantityOrdered = item.1 } });

      let request : CreatePurchaseOrderRequest = {
        supplierId;
        items = orderItems;
        notes = "Low stock auto-generated order";
      };

      let orderId = await createPurchaseOrder(request);
      createdOrderIds.add(orderId);
    };

    createdOrderIds.toArray();
  };

  // --- Waste/Spoilage Log Management ---
  public type WasteLog = {
    id : Nat;
    ingredientId : Nat;
    ingredientName : Text;
    quantity : Float;
    unit : Text;
    reason : Text;
    costLoss : Float;
    loggedAt : Int;
  };

  type CreateWasteLogRequest = {
    ingredientId : Nat;
    quantity : Float;
    reason : Text;
  };

  var nextWasteLogId = 1;
  let wasteLogs = Map.empty<Nat, WasteLog>();

  public shared ({ caller }) func createWasteLog(log : CreateWasteLogRequest) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) { Runtime.trap("Unauthorized: Only admins can create waste logs") };
    switch (ingredientsById.get(log.ingredientId)) {
      case (null) { Runtime.trap("Ingredient not found") };
      case (?ingredient) {
        if (log.quantity > ingredient.quantity) {
          Runtime.trap("Not enough stock for waste quantity");
        };

        let costLoss = log.quantity * ingredient.costPrice;

        let wasteLog : WasteLog = {
          id = nextWasteLogId;
          ingredientId = ingredient.id;
          ingredientName = ingredient.name;
          quantity = log.quantity;
          unit = ingredient.unit;
          reason = log.reason;
          costLoss;
          loggedAt = Time.now();
        };

        wasteLogs.add(nextWasteLogId, wasteLog);

        // Update ingredient quantity
        let updatedIngredient = { ingredient with quantity = ingredient.quantity - log.quantity };
        ingredients.add(ingredient.name, updatedIngredient);
        ingredientsById.add(ingredient.id, updatedIngredient);

        nextWasteLogId += 1;
        wasteLog.id;
      };
    };
  };

  public query ({ caller }) func getWasteLogs() : async [WasteLog] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view waste logs");
    };
    wasteLogs.values().toArray();
  };

  public query ({ caller }) func getWasteLog(id : Nat) : async ?WasteLog {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view waste log details");
    };
    wasteLogs.get(id);
  };

  public query ({ caller }) func getWasteStats() : async {
    totalWasteCost : Float;
    totalWasteCount : Nat;
    breakdown : [(Nat, { quantity : Float; costLoss : Float })];
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view waste stats");
    };
    var totalWasteCost = 0.0;
    var totalWasteCount = 0;
    let breakdownMap = Map.empty<Nat, (Float, Float)>();

    wasteLogs.values().forEach(
      func(waste) {
        totalWasteCost += waste.costLoss;
        totalWasteCount += 1;

        let existing = switch (breakdownMap.get(waste.ingredientId)) {
          case (null) { (0.0, 0.0) };
          case (?existing) { existing };
        };
        breakdownMap.add(
          waste.ingredientId,
          (
            existing.0 + waste.quantity,
            existing.1 + waste.costLoss,
          ),
        );
      }
    );

    let breakdown = breakdownMap.toArray().map(func((id, v)) { (id, { quantity = v.0; costLoss = v.1 }) });
    {
      totalWasteCost;
      totalWasteCount;
      breakdown;
    };
  };

  // --- Extended Menu Management ---
  public type MenuItem = {
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
  };

  public type CreateMenuItemRequest = {
    name : Text;
    description : Text;
    ingredients : [(Text, Float)];
    sellingPrice : Float;
    availableFromHour : ?Nat;
    availableToHour : ?Nat;
    availableDays : ?[Nat];
  };

  public type UpdateMenuItemRequest = {
    name : Text;
    description : Text;
    ingredients : [(Text, Float)];
    sellingPrice : Float;
    isAvailable : Bool;
    availableFromHour : ?Nat;
    availableToHour : ?Nat;
    availableDays : ?[Nat];
  };

  var nextMenuItemId = 1;
  let menu = Map.empty<Nat, MenuItem>();

  func calculateCostPerServing(ingredientsData : [(Text, Float)]) : Float {
    ingredientsData.foldLeft(
      0.0,
      func(acc, (ingredientName, quantity)) {
        switch (ingredients.get(ingredientName)) {
          case (null) { acc };
          case (?ingredient) { acc + (ingredient.costPrice * quantity) };
        };
      },
    );
  };

  public shared ({ caller }) func createMenuItem(item : CreateMenuItemRequest) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create menu items");
    };

    let menuItem : MenuItem = {
      id = nextMenuItemId;
      name = item.name;
      description = item.description;
      ingredients = item.ingredients;
      sellingPrice = item.sellingPrice;
      isAvailable = true;
      createdAt = Time.now();
      costPerServing = calculateCostPerServing(item.ingredients);
      availableFromHour = item.availableFromHour;
      availableToHour = item.availableToHour;
      availableDays = item.availableDays;
    };

    menu.add(nextMenuItemId, menuItem);
    nextMenuItemId += 1;
    menuItem.id;
  };

  public query func getMenuItems() : async [MenuItem] {
    menu.values().toArray();
  };

  public query func getMenuItem(_id : Nat) : async ?MenuItem {
    menu.get(_id);
  };

  public shared ({ caller }) func updateMenuItem(_id : Nat, item : UpdateMenuItemRequest) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update menu items");
    };
    switch (menu.get(_id)) {
      case (null) { Runtime.trap("Menu item not found") };
      case (?oldItem) {
        let updatedItem : MenuItem = {
          oldItem with
          name = item.name;
          description = item.description;
          ingredients = item.ingredients;
          sellingPrice = item.sellingPrice;
          isAvailable = item.isAvailable;
          costPerServing = calculateCostPerServing(item.ingredients);
          availableFromHour = item.availableFromHour;
          availableToHour = item.availableToHour;
          availableDays = item.availableDays;
        };
        menu.add(_id, updatedItem);
      };
    };
  };

  public shared ({ caller }) func deleteMenuItem(_id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete menu items");
    };
    menu.remove(_id);
  };

  public shared ({ caller }) func toggleMenuItemAvailability(_id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can toggle availability");
    };
    switch (menu.get(_id)) {
      case (null) { Runtime.trap("Menu item not found") };
      case (?item) {
        menu.add(_id, { item with isAvailable = not item.isAvailable });
      };
    };
  };

  public query func getAvailableMenuItems() : async [MenuItem] {
    let currentTime = Time.now();
    let currentHour = ((currentTime / 3600000000000) % 24).toNat();
    let currentDay = ((currentTime / 86400000000000) % 7).toNat();

    menu.values().toArray().filter(
      func(item) {
        item.isAvailable and (
          switch (item.availableFromHour, item.availableToHour) {
            case (null, null) { true };
            case (?from, null) { currentHour >= from };
            case (null, ?to) { currentHour < to };
            case (?from, ?to) { currentHour >= from and currentHour < to };
          }
        ) and (
          switch (item.availableDays) {
            case (null) { true };
            case (?days) { days.find(func(day) { day == currentDay }) != null };
          }
        )
      }
    );
  };

  public query ({ caller }) func getProfitMargin(menuItemId : Nat) : async {
    costPerServing : Float;
    sellingPrice : Float;
    grossProfit : Float;
    profitMarginPercentage : Float;
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view profit margin data");
    };
    switch (menu.get(menuItemId)) {
      case (null) { Runtime.trap("Menu item not found") };
      case (?item) {
        let costPerServing = calculateCostPerServing(item.ingredients);
        let sellingPrice = item.sellingPrice;
        let grossProfit = sellingPrice - costPerServing;
        let profitMarginPercentage = if (sellingPrice != 0.0) { (grossProfit / sellingPrice) * 100.0 } else { 0.0 };

        {
          costPerServing;
          sellingPrice;
          grossProfit;
          profitMarginPercentage;
        };
      };
    };
  };

  // --- Combo Deals Management ---
  public type ComboDeal = {
    id : Nat;
    name : Text;
    description : Text;
    menuItemIds : [Nat];
    bundlePrice : Float;
    isAvailable : Bool;
    createdAt : Int;
    totalIndividualPrice : Float;
    savings : Float;
  };

  public type CreateComboDealRequest = {
    name : Text;
    description : Text;
    menuItemIds : [Nat];
    bundlePrice : Float;
  };

  var nextComboDealId = 1;
  let comboDeals = Map.empty<Nat, ComboDeal>();

  func calculateTotalIndividualPrice(menuItemIds : [Nat]) : Float {
    menuItemIds.foldLeft(
      0.0,
      func(acc, menuItemId) {
        switch (menu.get(menuItemId)) {
          case (null) { acc };
          case (?item) { acc + item.sellingPrice };
        };
      },
    );
  };

  public shared ({ caller }) func createComboDeal(request : CreateComboDealRequest) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create combo deals");
    };

    let totalIndividualPrice = calculateTotalIndividualPrice(request.menuItemIds);
    let savings = totalIndividualPrice - request.bundlePrice;

    let comboDeal : ComboDeal = {
      id = nextComboDealId;
      name = request.name;
      description = request.description;
      menuItemIds = request.menuItemIds;
      bundlePrice = request.bundlePrice;
      isAvailable = true;
      createdAt = Time.now();
      totalIndividualPrice;
      savings;
    };

    comboDeals.add(nextComboDealId, comboDeal);
    nextComboDealId += 1;
    comboDeal.id;
  };

  public query func getCombos() : async [ComboDeal] {
    comboDeals.values().toArray();
  };

  public query func getCombo(comboId : Nat) : async ?ComboDeal {
    comboDeals.get(comboId);
  };

  public shared ({ caller }) func updateComboDeal(
    comboId : Nat,
    name : Text,
    description : Text,
    menuItemIds : [Nat],
    bundlePrice : Float,
    isAvailable : Bool,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update combo deals");
    };
    switch (comboDeals.get(comboId)) {
      case (null) { Runtime.trap("Combo deal not found") };
      case (?oldDeal) {
        let updatedDeal : ComboDeal = {
          oldDeal with
          name;
          description;
          menuItemIds;
          bundlePrice;
          isAvailable;
          totalIndividualPrice = calculateTotalIndividualPrice(menuItemIds);
          savings = calculateTotalIndividualPrice(menuItemIds) - bundlePrice;
        };
        comboDeals.add(comboId, updatedDeal);
      };
    };
  };

  public shared ({ caller }) func deleteComboDeal(comboId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete combo deals");
    };
    comboDeals.remove(comboId);
  };

  public shared ({ caller }) func toggleComboDealAvailability(comboId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can toggle combo deal availability");
    };
    switch (comboDeals.get(comboId)) {
      case (null) { Runtime.trap("Combo deal not found") };
      case (?deal) {
        comboDeals.add(comboId, { deal with isAvailable = not deal.isAvailable });
      };
    };
  };

  // --- Sale Orders ---
  type SaleOrder = {
    id : Nat;
    items : [(Nat, Text, Nat, Float)];
    subtotal : Float;
    discountCodeId : ?Nat;
    discountAmount : Float;
    taxBreakdown : [TaxBreakdown];
    taxTotal : Float;
    totalAmount : Float;
    note : Text;
    createdAt : Int;
  };

  type CreateSaleOrderRequest = {
    items : [(Nat, Nat)];
    note : Text;
    discountCodeId : ?Nat;
  };

  var nextSaleOrderId = 1;
  let sales = Map.empty<Nat, SaleOrder>();

  public shared ({ caller }) func createSaleOrder(order : CreateSaleOrderRequest) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can create sale orders");
    };

    let items : [(Nat, Text, Nat, Float)] = order.items.map(
      func((menuItemId, quantity)) {
        switch (menu.get(menuItemId)) {
          case (null) { Runtime.trap("Menu item not found") };
          case (?item) { (menuItemId, item.name, quantity, item.sellingPrice) };
        };
      }
    );

    let subtotal = items.foldLeft(
      0.0,
      func(acc, (_, _, quantity, price)) {
        acc + (quantity.toInt().toFloat() * price);
      },
    );

    var discountAmount : Float = 0.0;
    var postDiscountSubtotal : Float = subtotal;
    var taxBreakdown : [TaxBreakdown] = [];
    var taxTotal : Float = 0.0;
    var finalTotalAmount : Float = subtotal;

    // Apply Discount
    switch (order.discountCodeId) {
      case (null) {};
      case (?discountId) {
        switch (discountCodes.get(discountId)) {
          case (null) {};
          case (?discount) {
            if (discount.isActive and subtotal >= discount.minimumOrderAmount) {
              // Check expiry
              let isExpired = switch (discount.expiresAt) {
                case (null) { false };
                case (?expiresAt) { Time.now() >= expiresAt };
              };
              // Check max uses
              let isMaxUsed = switch (discount.maxUses) {
                case (null) { false };
                case (?maxUses) { discount.usedCount >= maxUses };
              };
              if (not isExpired and not isMaxUsed) {
                switch (discount.discountType) {
                  case (#percentage) {
                    discountAmount := (subtotal * discount.discountValue) / 100.0;
                  };
                  case (#fixed) {
                    discountAmount := discount.discountValue;
                  };
                };
                postDiscountSubtotal := Float.max(0.0, subtotal - discountAmount);
                finalTotalAmount := postDiscountSubtotal;
                // Increment usedCount
                discountCodes.add(discount.id, { discount with usedCount = discount.usedCount + 1 });
              };
            };
          };
        };
      };
    };

    // Apply Tax
    let activeTaxConfigs = taxConfigs.values().toArray().filter(
      func(taxConfig) { taxConfig.isActive }
    );
    taxBreakdown := activeTaxConfigs.map(
      func(taxConfig) {
        {
          name = taxConfig.name;
          rate = taxConfig.rate;
          amount = (postDiscountSubtotal * taxConfig.rate) / 100.0;
        };
      }
    );
    taxTotal := taxBreakdown.foldLeft(
      0.0,
      func(acc, tax) { acc + tax.amount },
    );

    finalTotalAmount := postDiscountSubtotal + taxTotal;

    let saleOrder : SaleOrder = {
      id = nextSaleOrderId;
      items;
      subtotal;
      discountCodeId = order.discountCodeId;
      discountAmount;
      taxBreakdown;
      taxTotal;
      totalAmount = finalTotalAmount;
      note = order.note;
      createdAt = Time.now();
    };

    sales.add(nextSaleOrderId, saleOrder);
    nextSaleOrderId += 1;

    // Update Inventory Logic
    for ((menuItemId, _, quantity, _) in items.values()) {
      switch (menu.get(menuItemId)) {
        case (null) { () };
        case (?menuItem) {
          for ((invItemName, amountPerMenuItem) in menuItem.ingredients.values()) {
            switch (ingredients.get(invItemName)) {
              case (?invItem) {
                let newQuantity = invItem.quantity - (amountPerMenuItem * quantity.toInt().toFloat());
                ingredients.add(invItemName, { invItem with quantity = newQuantity });
              };
              case (null) {};
            };
          };
        };
      };
    };

    saleOrder.id;
  };

  public query ({ caller }) func getSaleOrders(page : Nat, pageSize : Nat) : async [SaleOrder] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view sale orders");
    };
    let start = page * pageSize;
    let end = Int.min((start + pageSize).toInt(), sales.size());
    let salesArray = sales.values().toArray();

    let resultArray = salesArray.sliceToArray(start, end);
    resultArray;
  };

  public query ({ caller }) func getSaleOrder(_id : Nat) : async ?SaleOrder {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view a sale order");
    };
    sales.get(_id);
  };

  public query ({ caller }) func getDashboardSalesStats() : async {
    totalRevenue : Float;
    totalOrdersCount : Nat;
    todaysRevenue : Float;
    todaysOrdersCount : Nat;
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view dashboard sales stats");
    };
    var totalRevenue = 0.0;
    var totalOrdersCount = 0;
    var todaysRevenue = 0.0;
    var todaysOrdersCount = 0;

    let now = Time.now();
    let oneDayNanos = 24 * 60 * 60 * 1_000_000_000;

    sales.values().forEach(
      func(order) {
        totalRevenue += order.totalAmount;
        totalOrdersCount += 1;

        if (now - order.createdAt < oneDayNanos) {
          todaysRevenue += order.totalAmount;
          todaysOrdersCount += 1;
        };
      }
    );

    {
      totalRevenue;
      totalOrdersCount;
      todaysRevenue;
      todaysOrdersCount;
    };
  };

  // --- Customer Management ---
  public type Customer = {
    id : Nat;
    name : Text;
    email : Text;
    phone : Text;
    address : Text;
    notes : Text;
    createdAt : Int;
  };

  var nextCustomerId = 1;
  let customers = Map.empty<Nat, Customer>();

  public shared ({ caller }) func createCustomer(name : Text, email : Text, phone : Text, address : Text, notes : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create customers");
    };

    let customer : Customer = {
      id = nextCustomerId;
      name;
      email;
      phone;
      address;
      notes;
      createdAt = Time.now();
    };

    customers.add(nextCustomerId, customer);
    nextCustomerId += 1;
    customer.id;
  };

  public query ({ caller }) func getCustomers(page : Nat, pageSize : Nat) : async [Customer] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view customers");
    };
    let customersArray = customers.values().toArray();
    if (customersArray.size() == 0) { return [] };
    let start = page * pageSize;
    let end = Nat.min(start + pageSize, customersArray.size());
    if (start >= customersArray.size()) {
      return [];
    };
    customersArray.sliceToArray(start, end);
  };

  public query ({ caller }) func getCustomer(id : Nat) : async ?Customer {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view customer details");
    };
    customers.get(id);
  };

  public shared ({ caller }) func updateCustomer(id : Nat, name : Text, email : Text, phone : Text, address : Text, notes : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update customers");
    };
    switch (customers.get(id)) {
      case (null) { Runtime.trap("Customer not found") };
      case (?customer) {
        let updatedCustomer = {
          customer with
          name;
          email;
          phone;
          address;
          notes;
        };
        customers.add(id, updatedCustomer);
      };
    };
  };

  public shared ({ caller }) func deleteCustomer(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete customers");
    };
    customers.remove(id);
  };

  // --- Subscription System Management ---
  public type SubscriptionStatus = {
    #active;
    #paused;
    #cancelled;
  };

  public type Subscription = {
    id : Nat;
    customerId : Nat;
    planName : Text;
    menuItemIds : [Nat];
    frequencyDays : Nat;
    startDate : Int;
    nextRenewalDate : Int;
    status : SubscriptionStatus;
    totalPrice : Float;
    createdAt : Int;
  };

  var nextSubscriptionId = 1;
  let subscriptions = Map.empty<Nat, Subscription>();

  public shared ({ caller }) func createSubscription(customerId : Nat, planName : Text, menuItemIds : [Nat], frequencyDays : Nat, startDate : Int, startPrice : Float) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create subscriptions");
    };

    let subscription : Subscription = {
      id = nextSubscriptionId;
      customerId;
      planName;
      menuItemIds;
      frequencyDays;
      startDate;
      nextRenewalDate = startDate + (frequencyDays * 24 * 60 * 60 * 1000000000).toInt();
      status = #active;
      totalPrice = startPrice;
      createdAt = Time.now();
    };

    subscriptions.add(nextSubscriptionId, subscription);
    nextSubscriptionId += 1;
    subscription.id;
  };

  public query ({ caller }) func getSubscriptions(customerId : ?Nat, page : Nat, pageSize : Nat) : async [Subscription] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view subscriptions");
    };
    let filtered = subscriptions.values().toArray().filter(
      func(sub) {
        switch (customerId) {
          case (null) { true };
          case (?id) { sub.customerId == id };
        };
      }
    );
    let start = page * pageSize;
    let end = Nat.min(start + pageSize, filtered.size());
    if (start >= filtered.size()) {
      return [];
    };
    filtered.sliceToArray(start, end);
  };

  public query ({ caller }) func getSubscription(id : Nat) : async ?Subscription {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view subscription details");
    };
    subscriptions.get(id);
  };

  public shared ({ caller }) func updateSubscription(id : Nat, planName : Text, menuItemIds : [Nat], frequencyDays : Nat, totalPrice : Float) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update subscriptions");
    };
    switch (subscriptions.get(id)) {
      case (null) { Runtime.trap("Subscription not found") };
      case (?sub) {
        let updatedSub = {
          sub with
          planName;
          menuItemIds;
          frequencyDays;
          totalPrice;
        };
        subscriptions.add(id, updatedSub);
      };
    };
  };

  public shared ({ caller }) func cancelSubscription(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can cancel subscriptions");
    };
    switch (subscriptions.get(id)) {
      case (null) { Runtime.trap("Subscription not found") };
      case (?sub) {
        let updatedSub = {
          sub with
          status = #cancelled;
        };
        subscriptions.add(id, updatedSub);
      };
    };
  };

  public shared ({ caller }) func pauseSubscription(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can pause subscriptions");
    };
    switch (subscriptions.get(id)) {
      case (null) { Runtime.trap("Subscription not found") };
      case (?sub) {
        let updatedSub = {
          sub with
          status = #paused;
        };
        subscriptions.add(id, updatedSub);
      };
    };
  };

  public shared ({ caller }) func resumeSubscription(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can resume subscriptions");
    };
    switch (subscriptions.get(id)) {
      case (null) { Runtime.trap("Subscription not found") };
      case (?sub) {
        let updatedSub = {
          sub with
          status = #active;
        };
        subscriptions.add(id, updatedSub);
      };
    };
  };
};
