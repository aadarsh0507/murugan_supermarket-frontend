import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Plus, Minus, Trash2, Receipt, Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const mockProducts = [
  { id: "1", name: "Fresh Milk", price: 55, barcode: "8901234567890" },
  { id: "2", name: "Whole Wheat Bread", price: 40, barcode: "8901234567891" },
  { id: "3", name: "Basmati Rice 5kg", price: 550, barcode: "8901234567892" },
  { id: "4", name: "Coca Cola 2L", price: 90, barcode: "8901234567893" },
  { id: "5", name: "Lays Chips", price: 20, barcode: "8901234567894" },
];

export default function Billing() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [billItems, setBillItems] = useState([]);
  const [showInvoice, setShowInvoice] = useState(false);

  const filteredProducts = mockProducts.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode.includes(searchTerm)
  );

  const addToBill = (product) => {
    const existingItem = billItems.find((item) => item.id === product.id);
    
    if (existingItem) {
      setBillItems(
        billItems.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setBillItems([
        ...billItems,
        { ...product, quantity: 1 },
      ]);
    }
    
    toast({
      title: "Item Added",
      description: `${product.name} added to bill`,
    });
  };

  const updateQuantity = (id, delta) => {
    setBillItems(
      billItems
        .map((item) =>
          item.id === id
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (id) => {
    setBillItems(billItems.filter((item) => item.id !== id));
  };

  const subtotal = billItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const tax18 = subtotal * 0.18;
  const tax5 = subtotal * 0.05;
  const total = subtotal + tax18 + tax5;

  const generateBill = () => {
    if (billItems.length === 0) {
      toast({
        title: "Empty Bill",
        description: "Please add items to the bill",
        variant: "destructive",
      });
      return;
    }
    
    setShowInvoice(true);
    toast({
      title: "Bill Generated",
      description: "Invoice is ready for printing",
    });
  };

  const clearBill = () => {
    setBillItems([]);
    setShowInvoice(false);
    toast({
      title: "Bill Cleared",
      description: "Starting a new transaction",
    });
  };

  const printBill = () => {
    window.print();
    toast({
      title: "Printing...",
      description: "Invoice sent to printer",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-3xl font-bold">Point of Sale</h1>
          <p className="text-muted-foreground">Process customer transactions</p>
        </motion.div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={clearBill}>
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
          <Button onClick={printBill} disabled={!showInvoice}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Product Search */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 space-y-4"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by product name or barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => addToBill(product)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{product.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {product.barcode}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">
                        ₹{product.price}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Bill Summary */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Current Bill
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {billItems.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No items added yet
                </p>
              ) : (
                <>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {billItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            ₹{item.price} × {item.quantity}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 bg-background rounded-md">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.id, -1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center font-semibold">
                              {item.quantity}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.id, 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2 pt-4 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax (18%)</span>
                      <span className="font-medium">₹{tax18.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax (5%)</span>
                      <span className="font-medium">₹{tax5.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold pt-2 border-t">
                      <span>Total</span>
                      <span className="text-primary">₹{total.toFixed(2)}</span>
                    </div>
                  </div>

                  <Button
                    onClick={generateBill}
                    className="w-full bg-gradient-success"
                    size="lg"
                  >
                    Generate Bill
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {showInvoice && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className="border-success">
                <CardHeader className="bg-success/10">
                  <CardTitle className="text-success flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    Invoice Ready
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-2 text-sm">
                    <p className="font-semibold">Invoice #INV-{Date.now()}</p>
                    <p className="text-muted-foreground">
                      {new Date().toLocaleString()}
                    </p>
                    <Badge className="bg-success">Payment Received</Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
