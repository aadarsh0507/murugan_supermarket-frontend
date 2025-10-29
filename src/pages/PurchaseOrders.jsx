import { useState, useEffect, useRef } from "react";
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
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const inputRefs = useRef({});

  const [formData, setFormData] = useState({
    supplier: "",
    supplierName: "",
    supplierDetails: null, // Store full supplier details
    store: "",
    quotationDate: new Date().toISOString().split('T')[0],
    validDate: "",
    dueDate: "",
    items: [{ 
      particulars: "", 
      sku: "",
      unit: "",
      itemId: "",
      categoryName: "",
      subcategoryName: "",
      batchNumber: "",
      hsnNumber: "",
      expiryDate: "",
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

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openSuggestIndex !== null && !event.target.closest('.suggestions-dropdown')) {
        setOpenSuggestIndex(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openSuggestIndex]);

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
              hsnCode: item.hsnCode,
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
        sku: "",
        unit: "",
        itemId: "",
        categoryName: "",
        subcategoryName: "",
        batchNumber: "",
        hsnNumber: "",
        expiryDate: "",
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
      sku: suggestion.sku || '',
      unit: suggestion.unit || '',
      price: suggestion.cost || suggestion.price || 0,
      mrp: suggestion.price || 0,
      itemId: suggestion._id || '',
      categoryName: suggestion.category || '',
      subcategoryName: suggestion.subcategory || '',
      hsnNumber: suggestion.hsnCode || suggestion.hsnNumber || '',
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
      // Filter out empty items (items with no particulars or quantity 0)
      const validItems = formData.items.filter(item => 
        item.particulars && item.particulars.trim() !== "" && item.poQty > 0
      );

      if (validItems.length === 0) {
        toast({ 
          title: "Error", 
          description: "Please add at least one item with a name and quantity", 
          variant: "destructive" 
        });
        setSaving(false);
        return;
      }

      const poData = {
        supplier: formData.supplier,
        store: formData.store,
        orderDate: formData.quotationDate,
        // Only include expectedDeliveryDate if it has a value
        ...(formData.dueDate && formData.dueDate.trim() !== "" && { expectedDeliveryDate: formData.dueDate }),
        items: validItems.map(item => {
          const itemData = {
            itemName: item.particulars,
            quantity: item.poQty,
            costPrice: item.price,
            total: item.total
          };
          
          // Only include optional fields if they have values
          if (item.sku && item.sku.trim() !== "") itemData.sku = item.sku;
          if (item.unit && item.unit.trim() !== "") itemData.unit = item.unit;
          if (item.categoryName && item.categoryName.trim() !== "") itemData.categoryName = item.categoryName;
          if (item.subcategoryName && item.subcategoryName.trim() !== "") itemData.subcategoryName = item.subcategoryName;
          if (item.batchNumber && item.batchNumber.trim() !== "") itemData.batchNumber = item.batchNumber;
          if (item.hsnNumber && item.hsnNumber.trim() !== "") itemData.hsnNumber = item.hsnNumber;
          if (item.expiryDate && item.expiryDate.trim() !== "") itemData.expiryDate = item.expiryDate;
          
          return itemData;
        }),
        tax: formData.totalTax || 0,
        discount: formData.discount || 0,
        shipping: parseFloat(formData.freight || 0),
        // Only include notes if it has a value
        ...(formData.remarks && formData.remarks.trim() !== "" && { notes: formData.remarks })
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
      console.error('Error saving purchase order:', error);
      
      // Handle validation errors specifically
      let errorMessage = error.message || "Failed to save purchase order";
      if (error.response && error.response.data && error.response.data.errors) {
        const validationErrors = error.response.data.errors;
        console.error("Validation errors:", validationErrors);
        const errorMessages = validationErrors.map(err => {
          const field = err.path || err.param || 'field';
          return `${field}: ${err.msg}`;
        });
        errorMessage = `Validation failed:\n${errorMessages.join('\n')}`;
      }
      
      toast({ 
        title: "Error", 
        description: errorMessage, 
        variant: "destructive" 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleNewPO = () => {
    setEditingPO(null);
    setFormData({
      supplier: "",
      supplierName: "",
      supplierDetails: null,
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
        sku: "",
        unit: "",
        itemId: "",
        categoryName: "",
        subcategoryName: "",
        batchNumber: "",
        hsnNumber: "",
        expiryDate: "",
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
              PURCHASE
              
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
                <Select value={formData.supplier} onValueChange={async (v) => {
                  const sup = suppliers.find(s => s._id === v);
                  try {
                    // Fetch full supplier details
                    const response = await suppliersAPI.getSupplier(v);
                    setFormData({...formData, supplier: v, supplierName: sup?.companyName || "", supplierDetails: response.data});
                  } catch (error) {
                    console.error('Error fetching supplier details:', error);
                    setFormData({...formData, supplier: v, supplierName: sup?.companyName || ""});
                  }
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

        {/* Supplier Details Section */}
        {formData.supplierDetails && (
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4 text-blue-600">Supplier Details</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Contact Person</Label>
                  <p className="font-medium">
                    {formData.supplierDetails.contactPerson?.firstName || ''} {formData.supplierDetails.contactPerson?.lastName || ''}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Email</Label>
                  <p className="font-medium">{formData.supplierDetails.email || '-'}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Phone</Label>
                  <p className="font-medium">{formData.supplierDetails.phone?.primary || '-'}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Address</Label>
                  <p className="font-medium">
                    {formData.supplierDetails.address?.street || ''}, {formData.supplierDetails.address?.city || ''}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">GST Number</Label>
                  <p className="font-medium">{formData.supplierDetails.gstNumber || '-'}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">PAN Number</Label>
                  <p className="font-medium">{formData.supplierDetails.panNumber || '-'}</p>
                </div>
                {formData.supplierDetails.paymentTerms && (
                  <div>
                    <Label className="text-xs text-gray-500">Payment Terms</Label>
                    <p className="font-medium">{formData.supplierDetails.paymentTerms}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

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
                <span className="text-sm">Price: <strong>₹{Math.round(formData.price)}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Percent className="h-5 w-5 text-orange-500" />
                <span className="text-sm">Discount: <strong>₹{Math.round(formData.discount)}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-red-500" />
                <span className="text-sm">Total Tax: <strong>₹{Math.round(formData.totalTax)}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-blue-600" />
                <span className="text-sm">Total Amount: <strong>₹{Math.round(formData.totalAmount)}</strong></span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items Table */}
        <Card className="overflow-visible">
          <CardContent className="pt-6 overflow-visible">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Line Items</h3>
              <Button type="button" onClick={addItem} variant="destructive" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                ADD ITEM
              </Button>
            </div>
            <div className="border rounded-lg overflow-visible">
              <Table>
                <TableHeader className="bg-blue-600 text-white">
                  <TableRow>
                    <TableHead className="text-white"><input type="checkbox" /></TableHead>
                    <TableHead className="text-white">PARTICULARS</TableHead>
                    <TableHead className="text-white">Quantity</TableHead>
                    <TableHead className="text-white">Batch No.</TableHead>
                    <TableHead className="text-white">HSN</TableHead>
                    <TableHead className="text-white">Expiry Date</TableHead>
                    <TableHead className="text-white">Discount Type</TableHead>
                    <TableHead className="text-white">DIS</TableHead>
                    <TableHead className="text-white">TAX%</TableHead>
                    <TableHead className="text-white">PRICE</TableHead>
                    <TableHead className="text-white">TOTAL</TableHead>
                    <TableHead className="text-white">MRP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formData.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell><input type="checkbox" /></TableCell>
                      <TableCell className="relative overflow-visible">
                        <div className="suggestions-dropdown relative w-60">
                          <Input
                            ref={(el) => (inputRefs.current[index] = el)}
                            placeholder="Search for a Particulars"
                            value={item.particulars}
                            onChange={(e) => {
                              const inputEl = inputRefs.current[index];
                              if (inputEl) {
                                const rect = inputEl.getBoundingClientRect();
                                setDropdownPosition({
                                  top: rect.bottom + window.scrollY + 4,
                                  left: rect.left + window.scrollX
                                });
                              }
                              searchItems(index, e.target.value);
                            }}
                            onFocus={() => {
                              const inputEl = inputRefs.current[index];
                              if (inputEl) {
                                const rect = inputEl.getBoundingClientRect();
                                setDropdownPosition({
                                  top: rect.bottom + window.scrollY + 4,
                                  left: rect.left + window.scrollX
                                });
                              }
                              setOpenSuggestIndex(index);
                            }}
                            className="w-full"
                          />
                          {openSuggestIndex === index && (itemSuggestions[index]?.length || 0) > 0 && (
                            <div className="suggestions-dropdown fixed z-50 w-96 max-h-64 overflow-auto rounded-md border bg-white p-1 shadow-lg"
                                 style={{
                                   top: `${dropdownPosition.top}px`,
                                   left: `${dropdownPosition.left}px`,
                                   position: 'fixed',
                                   zIndex: 9999
                                 }}>
                              {itemSuggestions[index].map((s) => (
                                <button
                                  key={s._id}
                                  type="button"
                                  className="flex w-full items-center justify-between rounded px-2 py-1 text-left hover:bg-accent cursor-pointer"
                                  onClick={() => chooseSuggestion(index, s)}
                                >
                                  <span className="text-sm">{s.name}</span>
                                  <span className="text-xs text-muted-foreground">{s.sku}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.poQty || ''}
                          onChange={(e) => updateItem(index, 'poQty', parseFloat(e.target.value) || 0)}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="text"
                          value={item.batchNumber || ''}
                          onChange={(e) => updateItem(index, 'batchNumber', e.target.value)}
                          placeholder="Batch No."
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="text"
                          value={item.hsnNumber || ''}
                          onChange={(e) => updateItem(index, 'hsnNumber', e.target.value)}
                          placeholder="HSN Code"
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="date"
                          value={item.expiryDate || ''}
                          onChange={(e) => updateItem(index, 'expiryDate', e.target.value)}
                          placeholder="Expiry Date"
                          className="w-32"
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
                          value={item.discountType === '%' ? (item.disPercent || '') : (item.dis || '')}
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
                          value={item.price || ''}
                          onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell className="font-medium">₹{Math.round(item.total)}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.mrp || ''}
                          onChange={(e) => updateItem(index, 'mrp', parseFloat(e.target.value) || 0)}
                          className="w-24"
                        />
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
