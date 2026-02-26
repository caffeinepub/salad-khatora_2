import Map "mo:core/Map";
import Text "mo:core/Text";
import Float "mo:core/Float";
import Runtime "mo:core/Runtime";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Principal "mo:core/Principal";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

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

  type InventoryItem = {
    name : Text;
    quantity : Float;
    unit : Text;
    costPricePerUnit : Float;
    supplier : Text;
    lowStockThreshold : Float;
  };

  type InventoryResponse = {
    name : Text;
    quantity : Float;
    unit : Text;
    costPricePerUnit : Float;
    supplier : Text;
    lowStockThreshold : Float;
    totalValue : Float;
  };

  let inventory = Map.empty<Text, InventoryItem>();

  public shared ({ caller }) func addInventoryItem(item : InventoryItem) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add inventory items");
    };
    inventory.add(item.name, item);
  };

  public shared ({ caller }) func updateInventoryItem(name : Text, updatedItem : InventoryItem) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update inventory items");
    };
    inventory.add(name, updatedItem);
  };

  public shared ({ caller }) func deleteInventoryItem(name : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete inventory items");
    };
    inventory.remove(name);
  };

  public query ({ caller }) func listInventory() : async [InventoryResponse] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can list inventory");
    };
    inventory.values().toArray().map(
      func(item) {
        {
          item with
          totalValue = item.quantity * item.costPricePerUnit;
        };
      }
    );
  };

  public query ({ caller }) func getLowStockItems() : async [InventoryResponse] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view low stock items");
    };
    inventory.values().filter(
      func(item) { item.quantity <= item.lowStockThreshold }
    ).toArray().map(
      func(item) {
        {
          item with
          totalValue = item.quantity * item.costPricePerUnit;
        };
      }
    );
  };

  public query ({ caller }) func getInventoryStats() : async {
    totalItems : Nat;
    totalValue : Float;
    lowStockCount : Nat;
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view inventory stats");
    };
    var totalValue = 0.0;
    var lowStockCount = 0;

    inventory.values().forEach(
      func(item) {
        totalValue += item.quantity * item.costPricePerUnit;
        if (item.quantity <= item.lowStockThreshold) {
          lowStockCount += 1;
        };
      }
    );

    {
      totalItems = inventory.size();
      totalValue;
      lowStockCount;
    };
  };
};
