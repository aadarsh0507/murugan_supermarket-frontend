import { useState, useEffect } from "react";
import { Plus, Search, X, Save, ShoppingCart, Check, Scale, Tag, Percent, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { purchaseOrdersAPI, suppliersAPI, categoriesAPI } from "@/services/api";

const PurchaseOrders = () => {
  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState([]);
  const [stores, setStores] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingPO, setEditingPO] = useState(null);
  const [allItems, setAllItems] = useState([]); // Flattened list from Categories -> Subcategories -> Items
  const [itemSuggestions, setItemSuggestions] = useState({}); // rowIndex -> items list
  const [openSuggestIndex, setOpenSuggestIndex] = useState(null);

  const [formData, setFormData] = useState({
    supplier: "",
    supplierName: "",
    store: "",
    quotationDate: new Date().toISOString().split('T')[0],
    validDate: "",
    dueDate: "",
    referenceDate: "",
    quotationNo: "",
    referenceNo: "",
    chequeNo: "",
    advAmount: "",
    remarks: "",
    servCharge: "",
    taxPercent: "",
    netServCharge: "",
    addOthers: "",
    lessOthers: "",
    freight: "",
    netFreight: "",
    globalTax: "",
    paymentTerms: "",
    dispatchMode: "",
    items: [{ 
      particulars: "", 
      poQty: 0, 
      discountType: '%',
      disPercent: 0, 
      dis: 0, 
      taxPercent: 0, 
      price: 0, 
      total: 0, 
      mrp: 0 
    }],
    totalItems: 0,
    totalQty: 0,
    price: 0,
    discount: 0,
    totalTax: 0,
    totalAmount: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [suppliersRes, storesRes] = await Promise.all([
        suppliersAPI.getSuppliers({ limit: 100 }),
        suppliersAPI.getStores({ isActive: true })
      ]);
      setSuppliers(suppliersRes.data.suppliers);
      setStores(storesRes.data);

      // Fetch categories with embedded items to build item list
      let cats = [];
      try {
        const hierarchyRes = await categoriesAPI.getCategoryHierarchy();
        cats = hierarchyRes?.data || [];
      } catch (e) {
        console.error('Error loading category hierarchy, trying fallback:', e);
        try {
          const catsRes = await categoriesAPI.getCategories({ limit: 100 });
          cats = catsRes?.data?.categories || catsRes?.data || [];
        } catch (e2) {
          console.error('Error loading categories:', e2);
        }
      }
      setCategories(cats);

      // Flatten embedded items from categories/subcategories
      const flattened = [];
      cats.forEach(cat => {
        (cat.subcategories || []).forEach(sub => {
          (sub.items || []).forEach(item => {
            flattened.push({
              _id: item._id,
              name: item.name,
              sku: item.sku,
              price: item.price,
              cost: item.cost,
              unit: item.unit,
              category: cat.name,
              subcategory: sub.name,
            });
          });
        });
      });
      setAllItems(flattened);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { 
        particulars: "", 
        poQty: 0, 
        discountType: '%',
        disPercent: 0, 
        dis: 0, 
        taxPercent: 0, 
        price: 0, 
        total: 0, 
        mrp: 0 
      }]
    });
  };

  const removeItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const updateItem = (index, field, value) => {
    const items = [...formData.items];
    items[index] = { ...items[index], [field]: value };
    
    // Auto-calculate total based on discount type
    if (field === 'poQty' || field === 'price' || field === 'disPercent' || field === 'dis' || field === 'taxPercent' || field === 'discountType') {
      const poQty = items[index].poQty || 0;
      const price = items[index].price || 0;
      const disPercent = items[index].disPercent || 0;
      const dis = items[index].dis || 0;
      const discountType = items[index].discountType || '%';
      const taxPercent = items[index].taxPercent || 0;
      
      // Calculate discount based on type
      let totalDiscountAmount = 0;
      const subtotalBeforeDiscount = poQty * price;

      if (discountType === '%') {
        // When type is %, use disPercent as percentage of the subtotal
        totalDiscountAmount = (subtotalBeforeDiscount * disPercent) / 100;
      } else { // discountType === 'Rate'
        // When type is Rate, use dis as a fixed total amount for the line item
        totalDiscountAmount = dis;
      }
      
      // Calculate subtotal after discount
      const subtotalAfterDiscount = subtotalBeforeDiscount - totalDiscountAmount;
      
      // Apply tax to the discounted subtotal
      const totalTaxAmount = (subtotalAfterDiscount * taxPercent) / 100;
      
      // Calculate total for the line item
      items[index].total = subtotalAfterDiscount + totalTaxAmount;
    }
    
    setFormData({ ...formData, items });
    calculateTotals(items);
  };

  const searchItems = async (index, term) => {
    // Update field first
    updateItem(index, 'particulars', term);
    if (!term || term.length < 2) {
      setItemSuggestions(prev => ({ ...prev, [index]: [] }));
      setOpenSuggestIndex(null);
      return;
    }
    // Filter from preloaded items (from Categories)
    const lower = term.toLowerCase();
    const suggestions = allItems
      .filter(i => (i.name || '').toLowerCase().includes(lower) || (i.sku || '').toLowerCase().includes(lower))
      .slice(0, 20);
    setItemSuggestions(prev => ({ ...prev, [index]: suggestions }));
    setOpenSuggestIndex(index);
  };

  const chooseSuggestion = (index, suggestion) => {
    const items = [...formData.items];
    items[index] = {
      ...items[index],
      particulars: suggestion.name || suggestion.itemName || '',
      price: suggestion.cost || suggestion.price || 0,
      mrp: suggestion.price || 0,
      // Attempt to set a default tax if available via tags
    };
    setFormData({ ...formData, items });
    calculateTotals(items);
    setOpenSuggestIndex(null);
  };

  const calculateTotals = (items) => {
    const totalItems = items.length;
    const totalQty = items.reduce((sum, item) => sum + (item.poQty || 0), 0);
    const price = items.reduce((sum, item) => sum + ((item.poQty || 0) * (item.price || 0)), 0);
    
    // Calculate total discount across all items based on discount type
    const discount = items.reduce((sum, item) => {
      const poQty = item.poQty || 0;
      const price = item.price || 0;
      const discountType = item.discountType || '%';
      const disPercent = item.disPercent || 0;
      const dis = item.dis || 0;
      const taxPercent = item.taxPercent || 0;
      
      const subtotalBeforeDiscount = poQty * price;
      
      let totalDiscountAmount = 0;
      if (discountType === '%') {
        totalDiscountAmount = (subtotalBeforeDiscount * disPercent) / 100;
      } else {
        totalDiscountAmount = dis; // Fixed amount discount
      }
      
      return sum + totalDiscountAmount;
    }, 0);
    
    const totalTax = items.reduce((sum, item) => {
      const poQty = item.poQty || 0;
      const price = item.price || 0;
      const discountType = item.discountType || '%';
      const disPercent = item.disPercent || 0;
      const dis = item.dis || 0;
      const taxPercent = item.taxPercent || 0;
      
      const subtotalBeforeDiscount = poQty * price;
      
      let totalDiscountAmount = 0;
      if (discountType === '%') {
        totalDiscountAmount = (subtotalBeforeDiscount * disPercent) / 100;
      } else {
        totalDiscountAmount = dis;
      }
      
      const subtotalAfterDiscount = subtotalBeforeDiscount - totalDiscountAmount;
      const taxAmount = (subtotalAfterDiscount * taxPercent) / 100;
      
      return sum + taxAmount;
    }, 0);
    
    const totalAmount = items.reduce((sum, item) => sum + (item.total || 0), 0);
    
    setFormData(prev => ({
      ...prev,
      totalItems,
      totalQty,
      price,
      discount,
      totalTax,
      totalAmount
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const poData = {
        supplier: formData.supplier,
        store: formData.store,
        orderDate: formData.quotationDate,
        expectedDeliveryDate: formData.dueDate,
        items: formData.items.map(item => ({
          itemName: item.particulars,
          sku: "",
          quantity: item.poQty,
          unit: "",
          costPrice: item.price,
          total: item.total,
          notes: ""
        })),
        tax: formData.totalTax,
        discount: formData.discount,
        shipping: parseFloat(formData.freight || 0),
        notes: formData.remarks
      };

      if (editingPO) {
        await purchaseOrdersAPI.updatePurchaseOrder(editingPO._id, poData);
        toast({ title: "Success", description: "PO updated" });
      } else {
        await purchaseOrdersAPI.createPurchaseOrder(poData);
        toast({ title: "Success", description: "PO created" });
      }
      
      // Reset form
      handleNewPO();
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleNewPO = () => {
    setEditingPO(null);
    setFormData({
      supplier: "",
      supplierName: "",
      store: "",
      quotationDate: new Date().toISOString().split('T')[0],
      validDate: "",
      dueDate: "",
      referenceDate: "",
      quotationNo: "",
      referenceNo: "",
      chequeNo: "",
      advAmount: "",
      remarks: "",
      servCharge: "",
      taxPercent: "",
      netServCharge: "",
      addOthers: "",
      lessOthers: "",
      freight: "",
      netFreight: "",
      globalTax: "",
      paymentTerms: "",
      dispatchMode: "",
      items: [{ 
        particulars: "", 
        poQty: 0, 
        discountType: '%',
        disPercent: 0, 
        dis: 0, 
        taxPercent: 0, 
        price: 0, 
        total: 0, 
        mrp: 0 
      }],
      totalItems: 0,
      totalQty: 0,
      price: 0,
      discount: 0,
      totalTax: 0,
      totalAmount: 0
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl text-red-600 flex items-center gap-2">
              PURCHASE ORDER
              <Badge className="bg-green-500">
                <Check className="h-3 w-3 mr-1" />
                Against Price List
              </Badge>
            </CardTitle>
            <div className="flex gap-2">
              <Button type="submit" form="poForm" variant="default" size="sm" disabled={saving}>
                <ShoppingCart className="h-4 w-4 mr-1" />
                GENERATE
              </Button>
              <Button type="button" variant="destructive" size="sm" onClick={handleNewPO}>
                <X className="h-4 w-4 mr-1" />
                CANCEL
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Form */}
      <form id="poForm" onSubmit={handleSubmit}>
        <Card>
          <CardContent className="pt-6">
            {/* Minimal fields: Supplier, Store, Purchase Date */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <Label>Supplier Name</Label>
                <Select value={formData.supplier} onValueChange={(v) => {
                  const sup = suppliers.find(s => s._id === v);
                  setFormData({...formData, supplier: v, supplierName: sup?.companyName || ""});
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map(s => (
                      <SelectItem key={s._id} value={s._id}>{s.companyName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Store</Label>
                <Select value={formData.store} onValueChange={(v) => setFormData({...formData, store: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map(s => (
                      <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Purchase Date</Label>
                <Input 
                  type="date" 
                  value={formData.quotationDate} 
                  onChange={(e) => setFormData({...formData, quotationDate: e.target.value})} 
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Section */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-6 gap-4">
              <div className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-blue-500" />
                <span className="text-sm">Total Items: <strong>{formData.totalItems}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-green-500" />
                <span className="text-sm">Total Qty: <strong>{formData.totalQty}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-purple-500" />
                <span className="text-sm">Price: <strong>₹{formData.price.toFixed(2)}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Percent className="h-5 w-5 text-orange-500" />
                <span className="text-sm">Discount: <strong>₹{formData.discount.toFixed(2)}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-red-500" />
                <span className="text-sm">Total Tax: <strong>₹{formData.totalTax.toFixed(2)}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-blue-600" />
                <span className="text-sm">Total Amount: <strong>₹{formData.totalAmount.toFixed(2)}</strong></span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items Table */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Line Items</h3>
              <Button type="button" onClick={addItem} variant="destructive" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                ADD ITEM
              </Button>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-blue-600 text-white">
                  <TableRow>
                    <TableHead className="text-white"><input type="checkbox" /></TableHead>
                    <TableHead className="text-white">PARTICULARS</TableHead>
                    <TableHead className="text-white">Quantity</TableHead>
                    <TableHead className="text-white">Discount Type</TableHead>
                    <TableHead className="text-white">DIS</TableHead>
                    <TableHead className="text-white">TAX%</TableHead>
                    <TableHead className="text-white">PRICE</TableHead>
                    <TableHead className="text-white">TOTAL</TableHead>
                    <TableHead className="text-white">MRP</TableHead>
                    <TableHead className="text-white">ADD</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formData.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell><input type="checkbox" /></TableCell>
                      <TableCell className="relative">
                        <Input
                          placeholder="Search for a Particulars"
                          value={item.particulars}
                          onChange={(e) => searchItems(index, e.target.value)}
                          onFocus={() => setOpenSuggestIndex(index)}
                          className="w-60"
                        />
                        {openSuggestIndex === index && (itemSuggestions[index]?.length || 0) > 0 && (
                          <div className="absolute z-10 mt-1 w-96 max-h-64 overflow-auto rounded-md border bg-popover p-1 shadow">
                            {itemSuggestions[index].map((s) => (
                              <button
                                key={s._id}
                                type="button"
                                className="flex w-full items-center justify-between rounded px-2 py-1 text-left hover:bg-accent"
                                onClick={() => chooseSuggestion(index, s)}
                              >
                                <span className="text-sm">{s.name}</span>
                                <span className="text-xs text-muted-foreground">{s.sku}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.poQty}
                          onChange={(e) => updateItem(index, 'poQty', parseFloat(e.target.value) || 0)}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={item.discountType || '%'} 
                          onValueChange={(v) => updateItem(index, 'discountType', v)}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="%">%</SelectItem>
                            <SelectItem value="Rate">Rate</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.discountType === '%' ? item.disPercent : item.dis}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            if (item.discountType === '%') {
                              updateItem(index, 'disPercent', value);
                            } else {
                              updateItem(index, 'dis', value);
                            }
                          }}
                          placeholder={item.discountType === '%' ? "%" : "Amount"}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Select value={String(item.taxPercent)} onValueChange={(v) => updateItem(index, 'taxPercent', parseFloat(v))}>
                          <SelectTrigger className="w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">0%</SelectItem>
                            <SelectItem value="5">5%</SelectItem>
                            <SelectItem value="12">12%</SelectItem>
                            <SelectItem value="18">18%</SelectItem>
                            <SelectItem value="28">28%</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.price}
                          onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell className="font-medium">₹{item.total.toFixed(2)}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.mrp}
                          onChange={(e) => updateItem(index, 'mrp', parseFloat(e.target.value) || 0)}
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Button type="button" variant="destructive" size="sm" onClick={() => removeItem(index)}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

export default PurchaseOrders;
