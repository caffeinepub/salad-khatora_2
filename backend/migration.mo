import Map "mo:core/Map";
import Nat "mo:core/Nat";

module {
  public type OldActor = {
    saleOrders : Map.Map<Nat, OldSaleOrder>;
  };

  public type OldSaleOrder = {
    id : Nat;
    items : [OldSaleOrderItem];
    subtotal : Float;
    totalAmount : Float;
    discountAmount : Float;
    taxBreakdown : [OldTaxBreakdown];
    taxTotal : Float;
    note : Text;
    createdAt : Int;
    discountCodeId : ?Nat;
    customerId : ?Nat;
  };

  public type OldSaleOrderItem = {
    itemId : Nat;
    quantity : Nat;
    price : Float;
  };

  public type OldTaxBreakdown = {
    name : Text;
    rate : Float;
    amount : Float;
  };

  public type NewActor = {
    saleOrders : Map.Map<Nat, NewSaleOrder>;
  };

  public type NewSaleOrder = {
    id : Nat;
    items : [OldSaleOrderItem];
    subtotal : Float;
    totalAmount : Float;
    discountAmount : Float;
    taxBreakdown : [OldTaxBreakdown];
    taxTotal : Float;
    note : Text;
    createdAt : Int;
    discountCodeId : ?Nat;
    customerId : ?Nat;
    paymentType : { #cash; #card; #other : Text; #upi };
  };

  public type SaleOrderId = Nat;

  public func run(old : OldActor) : NewActor {
    let newSaleOrders = old.saleOrders.map<SaleOrderId, OldSaleOrder, NewSaleOrder>(
      func(_id, oldOrder) {
        { oldOrder with paymentType = #cash };
      }
    );
    { old with saleOrders = newSaleOrders };
  };
};
