import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Edit, Trash2, Package, Filter, ShoppingCart, Minus, X, FolderTree, CreditCard, Banknote, QrCode, Printer, Upload, Image as ImageIcon, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/Modal";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { itemsAPI, categoriesAPI, billsAPI, barcodesAPI } from "@/services/api";
import BarcodeLabel from "@/components/BarcodeLabel";
import BillModal from "@/components/BillModal";

export default function Items() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, hasRole, selectedStore } = useAuth();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isBillingOpen, setIsBillingOpen] = useState(false);
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [billData, setBillData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [noMovementItems, setNoMovementItems] = useState([]);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [itemImages, setItemImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [isScanning, setIsScanning] = useState(true); // Default to scanning mode enabled
  const [barcodeInput, setBarcodeInput] = useState("");
  const [lastScanned, setLastScanned] = useState(null); // { sku, name, time }
  const [selectedBatch, setSelectedBatch] = useState(null); // Selected batch for barcode printing
  const [isProcessingScan, setIsProcessingScan] = useState(false); // Prevent duplicate scans
  const [lastScannedBarcode, setLastScannedBarcode] = useState(""); // Track last scanned barcode to prevent exact duplicate

  // Check if user is admin
  const isAdmin = hasRole('admin');

  useEffect(() => {
    loadItems();
    loadCategories();
    loadLowStockItems();
    loadNoMovementItems();
  }, []);

  // Auto-focus barcode input when component mounts or scanning mode is enabled
  useEffect(() => {
    if (isScanning) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        const barcodeInputElement = document.getElementById('barcode-scan-input');
        if (barcodeInputElement) {
          barcodeInputElement.focus();
        } else {
          // If barcode input not found, focus search field
          const searchInput = document.querySelector('input[placeholder*="Search by name, SKU"]');
          if (searchInput) {
            searchInput.focus();
          }
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isScanning]);

  // Auto-detect fast scanner input in the search box (supports numeric and alphanumeric SKUs)
  useEffect(() => {
    // Don't auto-trigger if already processing a scan
    if (isProcessingScan) return;
    
    const trimmedValue = searchTerm.trim();
    // Typical scans dump a burst of chars; accept 6+ safe SKU/barcode chars
    // Also check it's different from the last scanned barcode to allow multiple items
    if (trimmedValue.length >= 6 && /^[A-Za-z0-9\-]+$/.test(trimmedValue) && trimmedValue !== lastScannedBarcode) {
      const timer = setTimeout(() => {
        if (!isProcessingScan && searchTerm.trim() === trimmedValue) {
          handleBarcodeScan(trimmedValue);
          setSearchTerm("");
        }
      }, 300); // Reduced timeout for faster scanning
      return () => clearTimeout(timer);
    }
  }, [searchTerm, isProcessingScan, lastScannedBarcode]);

  // Auto-detect fast scanner input in the barcode input field (cart modal or scanning mode)
  useEffect(() => {
    // Don't auto-trigger if already processing a scan
    if (isProcessingScan) return;
    
    const trimmedValue = barcodeInput.trim();
    // Typical scans dump a burst of chars; accept 6+ safe SKU/barcode chars
    // Also check it's different from the last scanned barcode to allow multiple items
    if (trimmedValue.length >= 6 && /^[A-Za-z0-9\-]+$/.test(trimmedValue) && trimmedValue !== lastScannedBarcode) {
      const timer = setTimeout(() => {
        if (!isProcessingScan && barcodeInput.trim() === trimmedValue) {
          handleBarcodeScan(trimmedValue);
          setBarcodeInput("");
        }
      }, 300); // Reduced timeout for faster scanning
      return () => clearTimeout(timer);
    }
  }, [barcodeInput, isProcessingScan, lastScannedBarcode]);


  const loadItems = async () => {
    setLoading(true);
    try {
      // Load categories with embedded subcategories and items
      const response = await categoriesAPI.getCategories({ 
        includeSubcategories: true,
        limit: 100 
      });
      
      // Extract all items from embedded subcategories
      const allItems = [];
      const allSubcategories = [];
      
      response.data.categories.forEach(category => {
        if (category.subcategories && category.subcategories.length > 0) {
          category.subcategories.forEach(subcategory => {
            // Add parent category info to subcategory
            const subcategoryWithParent = {
              ...subcategory,
              parentCategory: {
                _id: category._id,
                name: category.name
              }
            };
            allSubcategories.push(subcategoryWithParent);
            
            // Extract items from subcategory
            if (subcategory.items && subcategory.items.length > 0) {
              subcategory.items.forEach(item => {
                console.log('loadItems - Processing item:', item.name, 'Images:', item.images);
                allItems.push({
                  ...item,
                  subcategory: subcategoryWithParent
                });
              });
            }
          });
        }
      });
      
      setItems(allItems);
      setSubcategories(allSubcategories);
    } catch (error) {
      console.error("Error loading items:", error);
      toast({
        title: "Error",
        description: "Failed to load items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await categoriesAPI.getCategories({ 
        includeSubcategories: true,
        limit: 100 
      });
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const loadLowStockItems = async () => {
    try {
      const response = await billsAPI.getLowStockItems();
      setLowStockItems(response.data || []);
    } catch (error) {
      console.error("Error loading low stock items:", error);
    }
  };

  const loadNoMovementItems = async () => {
    try {
      const response = await billsAPI.getNoMovementItems();
      setNoMovementItems(response.data || []);
    } catch (error) {
      console.error("Error loading no movement items:", error);
    }
  };

  // Function to get item color based on stock status
  const getItemColor = (item) => {
    const lowStockItemSkus = lowStockItems.map(item => item.sku);
    const noMovementItemSkus = noMovementItems.map(item => item.sku);
    
    if (lowStockItemSkus.includes(item.sku)) {
      return "bg-red-100 border-red-400 border-2"; // Low stock - prominent red with thicker border
    } else if (noMovementItemSkus.includes(item.sku)) {
      return "bg-blue-50 border-blue-300"; // No movement - blue
    } else {
      return "bg-white border-gray-200"; // Normal stock - white
    }
  };

  // Function to get stock status badge
  const getStockStatusBadge = (item) => {
    const lowStockItemSkus = lowStockItems.map(item => item.sku);
    const noMovementItemSkus = noMovementItems.map(item => item.sku);
    
    if (lowStockItemSkus.includes(item.sku)) {
      return <Badge variant="destructive" className="bg-red-500 text-white font-semibold">Low Stock</Badge>;
    } else if (noMovementItemSkus.includes(item.sku)) {
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800">No Movement</Badge>;
    } else {
      return <Badge variant="default" className="bg-green-100 text-green-800">In Stock</Badge>;
    }
  };


  // Calculate grouped items for subcategory buttons (based on all items, not filtered)
  const groupedItems = items.reduce((acc, item) => {
    const subcategoryId = item.subcategory?._id || item.subcategory;
    if (!acc[subcategoryId]) {
      acc[subcategoryId] = [];
    }
    acc[subcategoryId].push(item);
    return acc;
  }, {});

  // Filter items based on search, category selection, and status
  const filteredItems = items.filter((item) => {
    
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Check if item belongs to selected category
    const itemCategoryId = item.subcategory?.parentCategory?._id;
    const matchesCategory = selectedCategory === "all" || 
                           itemCategoryId === selectedCategory;
    
    // Check if item matches selected status
    // For non-admin users, only show active items regardless of filter
    // For admin users, respect the status filter
    let matchesStatus = true;
    if (isAdmin) {
      if (selectedStatus === "active") {
        matchesStatus = item.isActive === true;
      } else if (selectedStatus === "inactive") {
        matchesStatus = item.isActive === false;
      }
      // "all" shows everything
    } else {
      // Non-admin users only see active items
      matchesStatus = item.isActive === true;
    }
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleAddNew = () => {
    setEditingItem(null);
    setFormData({ 
      isActive: true,
      stock: 0,
      minStock: 0,
      unit: "kg" // Default unit
    });
    setItemImages([]);
    setIsModalOpen(true);
  };

  const handleEdit = (item) => {
    console.log('handleEdit called with item:', item);
    console.log('Item ID:', item._id);
    setEditingItem(item);
    setFormData({
      name: item.name,
      sku: item.sku,
      description: item.description || "",
      subcategory: item.subcategory?._id || item.subcategory,
      price: item.price,
      cost: item.cost || "",
      stock: item.stock,
      minStock: item.minStock || 0,
      maxStock: item.maxStock || "",
      unit: item.unit || "kg", // Default to kg if no unit
      weight: item.weight || "",
      barcode: item.barcode || "",
      tags: item.tags || [],
      isActive: item.isActive,
      isDigital: item.isDigital || false,
      requiresPrescription: item.requiresPrescription || false,
      expiryDate: item.expiryDate || ""
    });
    setItemImages(item.images || []);
    setSelectedBatch(null); // Reset selected batch when opening edit modal
    console.log("Loading item for edit:", item);
    console.log("Item images:", item.images);
    console.log("Item batches:", item.batches);
    setIsModalOpen(true);
  };

  const handleDelete = async (item) => {
    if (window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
      try {
        await itemsAPI.deleteItem(item._id);
        await loadItems();
        toast({
          title: "Item Deleted",
          description: `${item.name} has been removed from inventory`,
        });
      } catch (error) {
        console.error("Error deleting item:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to delete item",
          variant: "destructive",
        });
      }
    }
  };

  // Image handling functions
  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setUploadingImages(true);
    
    files.forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const newImage = {
            url: e.target.result,
            alt: file.name,
            isPrimary: itemImages.length === 0 // First image is primary
          };
          console.log("Adding new image:", newImage);
          setItemImages(prev => {
            const updated = [...prev, newImage];
            console.log("Updated itemImages:", updated);
            return updated;
          });
        };
        reader.readAsDataURL(file);
      }
    });
    
    setUploadingImages(false);
  };

  const removeImage = (index) => {
    setItemImages(prev => {
      const newImages = prev.filter((_, i) => i !== index);
      // If we removed the primary image, make the first remaining image primary
      if (newImages.length > 0 && prev[index].isPrimary) {
        newImages[0].isPrimary = true;
      }
      return newImages;
    });
  };

  const setPrimaryImage = (index) => {
    setItemImages(prev => 
      prev.map((img, i) => ({
        ...img,
        isPrimary: i === index
      }))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation
    if (!formData.name || !formData.sku || !formData.subcategory || !formData.price || !formData.unit) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Name, SKU, Subcategory, Price, Unit)",
        variant: "destructive",
      });
      return;
    }

    if (!formData.unit) {
      toast({
        title: "Unit Required",
        description: "Please select a unit for the item",
        variant: "destructive",
      });
      return;
    }

    if (formData.price <= 0) {
      toast({
        title: "Validation Error", 
        description: "Price must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    // Ensure price is less than or equal to cost price when cost is provided
    if (
      formData.cost !== "" &&
      !isNaN(parseFloat(formData.cost)) &&
      !isNaN(parseFloat(formData.price)) &&
      parseFloat(formData.price) > parseFloat(formData.cost)
    ) {
      toast({
        title: "Validation Error",
        description: "Price must be less than or equal to cost price",
        variant: "destructive",
      });
      return;
    }

    if (formData.stock < 0) {
      toast({
        title: "Validation Error",
        description: "Stock cannot be negative",
        variant: "destructive", 
      });
      return;
    }

    setSaving(true);
    
    // Clean up the form data - remove empty strings and convert to proper types
    const submitData = {
        ...formData,
        images: (itemImages && itemImages.length > 0) ? itemImages.map(img => {
          // Handle base64 images - limit size or convert to placeholder
          let imageUrl = img.url;
          if (img.url && img.url.startsWith('data:image') && img.url.length > 100000) {
            // If base64 image is too large, use a placeholder
            imageUrl = 'https://via.placeholder.com/300x300?text=Item+Image';
            console.warn('Large base64 image detected, using placeholder');
          }
          
          return {
            url: imageUrl,
            alt: img.alt || formData.name || 'Item image',
            isPrimary: Boolean(img.isPrimary)
          };
        }) : [],
        // Convert empty strings to undefined for optional fields and handle NaN
        maxStock: formData.maxStock === "" ? undefined : (isNaN(parseInt(formData.maxStock)) ? undefined : parseInt(formData.maxStock)),
        barcode: formData.barcode === "" ? undefined : formData.barcode,
        description: formData.description === "" ? undefined : formData.description,
        cost: formData.cost === "" ? undefined : (isNaN(parseFloat(formData.cost)) ? undefined : parseFloat(formData.cost)),
        weight: formData.weight === "" ? undefined : (isNaN(parseFloat(formData.weight)) ? undefined : parseFloat(formData.weight)),
        expiryDate: formData.expiryDate === "" ? undefined : formData.expiryDate,
        // Ensure proper data types for required fields
        price: parseFloat(formData.price),
        stock: (formData.stock === "" || isNaN(parseInt(formData.stock))) ? undefined : parseInt(formData.stock),
        minStock: parseInt(formData.minStock)
      };

    // Remove undefined values to avoid sending null to backend
    const cleanedSubmitData = Object.fromEntries(
      Object.entries(submitData).filter(([_, value]) => value !== undefined && value !== null)
    );

    // Additional validation before sending
    if (!cleanedSubmitData.name || !cleanedSubmitData.sku || !cleanedSubmitData.subcategory || !cleanedSubmitData.price || !cleanedSubmitData.unit) {
      toast({
        title: "Missing Required Fields",
        description: "Please ensure all required fields are filled (Name, SKU, Subcategory, Price, Unit)",
        variant: "destructive",
      });
      setSaving(false);
      return;
    }

    // Ensure unit is always set
    if (!cleanedSubmitData.unit) {
      cleanedSubmitData.unit = "kg"; // Default unit
    }

    // Debug: Log the data being sent
    console.log("Submitting data:", cleanedSubmitData);
    console.log("ItemImages state:", itemImages);
    console.log("ItemImages length:", itemImages ? itemImages.length : 'undefined');

    try {
      // Include store name if available (backend will also set it, but include for completeness)
      if (selectedStore?.name) {
        cleanedSubmitData.storeName = selectedStore.name;
      }

      if (editingItem) {
        console.log('Updating item with ID:', editingItem._id);
        console.log('Editing item object:', editingItem);
        await itemsAPI.updateItem(editingItem._id, cleanedSubmitData);
        toast({
          title: "Item Updated",
          description: "Item details have been updated successfully",
        });
      } else {
        await itemsAPI.createItem(cleanedSubmitData);
        toast({
          title: "Item Added",
          description: "New item has been added to inventory",
        });
      }
      await loadItems();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving item:", error);
      console.error("Form data being sent:", cleanedSubmitData);
      
      // Extract a helpful backend error message to show why save failed
      let errorMessage = "Failed to save item";
      const status = error?.response?.status;
      const statusText = error?.response?.statusText;
      const data = error?.response?.data;

      if (data) {
        if (typeof data === 'string') {
          errorMessage = data;
        } else if (Array.isArray(data)) {
          errorMessage = data.join(', ');
        } else if (data.message) {
          errorMessage = data.message;
        } else if (data.error) {
          errorMessage = typeof data.error === 'string'
            ? data.error
            : (data.error.message || JSON.stringify(data.error));
        } else if (Array.isArray(data.errors)) {
          // Express-validator or similar
          errorMessage = data.errors
            .map(err => err.msg || err.message || `${err.param || ''} ${err}`.trim())
            .join(', ');
        } else if (data.errors && typeof data.errors === 'object') {
          // Mongoose validation error object: { errors: { field: { message } } }
          errorMessage = Object.values(data.errors)
            .map(err => err?.message || String(err))
            .join(', ');
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }

      if (status) {
        errorMessage = `${status}${statusText ? ' ' + statusText : ''}: ${errorMessage}`;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Cart functions
  const addToCart = (item) => {
    const existingItem = cart.find(cartItem => cartItem.sku === item.sku);
    
    if (existingItem) {
      setCart(cart.map(cartItem =>
        cartItem.sku === item.sku
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
    
    toast({
      title: "Added to Cart",
      description: `${item.name} has been added to your cart`,
    });
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter(item => item._id !== itemId));
    toast({
      title: "Removed from Cart",
      description: "Item has been removed from your cart",
    });
  };

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    
    setCart(cart.map(item =>
      item._id === itemId
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  const getTotalPrice = () => {
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    return Math.max(0, subtotal - discountAmount); // Ensure total doesn't go below 0
  };

  const getSubtotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const proceedToPayment = () => {
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to your cart before proceeding",
        variant: "destructive"
      });
      return;
    }
    
    // Close cart modal and open billing modal
    setIsCartOpen(false);
    setIsBillingOpen(true);
  };

  const clearCart = () => {
    setCart([]);
    setDiscountAmount(0);
    setIsCartOpen(false);
  };

  const handleCashPayment = async () => {
    try {
      setSaving(true);
      
      // Generate bill data
      const billNumber = Math.floor(Math.random() * 1000) + 1;
      const subtotal = getSubtotal();
      const totalAmount = getTotalPrice();
      const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
      
      // Calculate savings (assuming 10% discount on average)
      const totalSavings = cart.reduce((sum, item) => {
        const mrp = item.price * 1.1; // Assume MRP is 10% higher than sale price
        return sum + (mrp - item.price) * item.quantity;
      }, 0);

      const billData = {
        billNumber: billNumber.toString(),
        counterNumber: 1,
        customerName: "",
        billBy: user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Unknown',
        items: cart.map(item => ({
          itemSku: item.sku,
          itemName: item.name,
          mrp: item.price * 1.1,
          saleRate: item.price,
          quantity: item.quantity,
          netAmount: item.price * item.quantity
        })),
        subtotal: subtotal,
        discountAmount: discountAmount,
        totalAmount: totalAmount,
        totalQuantity: totalQty,
        totalSavings: totalSavings,
        amountPaid: totalAmount,
        amountReturned: 0,
        gstBreakdown: [
          { basic: totalAmount * 0.6, cgstPercent: 0.00, cgstAmount: 0.00, sgstPercent: 0.00, sgstAmount: 0.00 },
          { basic: totalAmount * 0.25, cgstPercent: 12.50, cgstAmount: totalAmount * 0.025, sgstPercent: 12.50, sgstAmount: totalAmount * 0.025 },
          { basic: totalAmount * 0.15, cgstPercent: 12.00, cgstAmount: totalAmount * 0.018, sgstPercent: 12.00, sgstAmount: totalAmount * 0.018 },
          { basic: 0.00, cgstPercent: 0.00, cgstAmount: 0.00, sgstPercent: 0.00, sgstAmount: 0.00 }
        ],
        paymentMethod: 'cash'
      };

      // Save bill to database
      const response = await billsAPI.createBill(billData);
      
      // Create display data for modal
      const displayData = {
        storeName: selectedStore?.name || "Murugan Super Market",
        address: selectedStore?.address ? `${selectedStore.address.street || ''}, ${selectedStore.address.city || ''} - ${selectedStore.address.zipCode || ''}`.replace(/^,\s*|,\s*$/g, '') : "No.25, Loop Road, Acharapakkam - 603301",
        phone: selectedStore?.phone ? `Ph: ${selectedStore.phone}` : "Ph: 044-27522026",
        gstNumber: selectedStore?.gstNumber ? `GST No.: ${selectedStore.gstNumber}` : "GST No.: 33AWOPD0029J1ZS",
        date: new Date().toLocaleDateString('en-GB', { 
          day: '2-digit', 
          month: 'short', 
          year: 'numeric' 
        }).replace(/ /g, '-'),
        time: new Date().toLocaleTimeString('en-US', { hour12: true, hour: 'numeric', minute: '2-digit' }),
        billNumber: billNumber,
        counterNumber: 1,
        customerName: "",
        billBy: user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Unknown',
        items: cart.map(item => ({
          name: item.name,
          mrp: (item.price * 1.1).toFixed(2),
          saleRate: item.price.toFixed(2),
          qty: item.quantity,
          netAmount: (item.price * item.quantity).toFixed(2)
        })),
        subtotal: subtotal.toFixed(2),
        discountAmount: discountAmount.toFixed(2),
        totalAmount: totalAmount.toFixed(2),
        gstBreakdown: [
          { basic: totalAmount * 0.6, cgstPercent: 0.00, cgstAmount: 0.00, sgstPercent: 0.00, sgstAmount: 0.00 },
          { basic: totalAmount * 0.25, cgstPercent: 12.50, cgstAmount: totalAmount * 0.025, sgstPercent: 12.50, sgstAmount: totalAmount * 0.025 },
          { basic: totalAmount * 0.15, cgstPercent: 12.00, cgstAmount: totalAmount * 0.018, sgstPercent: 12.00, sgstAmount: totalAmount * 0.018 },
          { basic: 0.00, cgstPercent: 0.00, cgstAmount: 0.00, sgstPercent: 0.00, sgstAmount: 0.00 }
        ]
      };
      
      // Set bill data and show modal
      setBillData(displayData);
      setIsBillModalOpen(true);
      setIsBillingOpen(false);
      
      // Reload items to reflect updated stock
      await loadItems();
      await loadLowStockItems();
      await loadNoMovementItems();
      
      toast({
        title: "Bill Saved Successfully",
        description: `Bill #${billNumber} has been saved and stock updated`,
      });
      
    } catch (error) {
      console.error("Error saving bill:", error);
      toast({
        title: "Error Saving Bill",
        description: error.message || "Failed to save bill",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleOnlinePayment = () => {
    // Generate QR code for online payment
    const paymentData = {
      amount: getTotalPrice(),
      items: cart.length,
      timestamp: new Date().toISOString(),
      paymentMethod: 'Online'
    };
    
    // In a real app, this would generate a QR code for payment gateway
    generateQRCode(paymentData);
    
    toast({
      title: "QR Code Generated",
      description: "Scan the QR code to complete payment",
    });
  };

  const printBill = (billData) => {
    // Generate bill number
    const billNumber = Math.floor(Math.random() * 1000) + 1;
    
    // Calculate totals
    const totalAmount = billData.total;
    const totalQty = billData.items.reduce((sum, item) => sum + item.quantity, 0);
    
    // Calculate savings (assuming 10% discount on average)
    const totalSavings = billData.items.reduce((sum, item) => {
      const mrp = item.price * 1.1; // Assume MRP is 10% higher than sale price
      return sum + (mrp - item.price) * item.quantity;
    }, 0);

    // Get store name from selected store
    const storeName = selectedStore?.name || "Murugan Super Market";
    const storeAddress = selectedStore?.address ? `${selectedStore.address.street || ''}, ${selectedStore.address.city || ''} - ${selectedStore.address.zipCode || ''}`.replace(/^,\s*|,\s*$/g, '') : 'No 25, Loop Road, Acharapakkam - 603301';
    const storePhone = selectedStore?.phone ? `Ph. ${selectedStore.phone}` : 'Ph. 044-27522026';
    
    // Create bill format
    const billContent = `
      <div style="font-family: monospace; max-width: 300px; margin: 0 auto; padding: 20px; font-size: 12px; line-height: 1.2;">
        <!-- Store Header -->
        <div style="text-align: center; margin-bottom: 15px;">
          <h1 style="font-size: 16px; font-weight: bold; text-transform: uppercase; margin: 0;">${storeName.toUpperCase()}</h1>
          <p style="margin: 2px 0; font-size: 10px;">${storeAddress}</p>
          <p style="margin: 2px 0; font-size: 10px;">${storePhone}</p>
          <p style="margin: 2px 0; font-size: 10px;">GST No 33AWOPD5029J1ZS</p>
        </div>

        <!-- Transaction Details -->
        <div style="margin-bottom: 15px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
            <span>Date ${new Date().toLocaleDateString('en-GB', { 
              day: '2-digit', 
              month: 'short', 
              year: 'numeric' 
            }).replace(/ /g, '-')}</span>
            <span>Time ${new Date().toLocaleTimeString('en-US', { hour12: true, hour: 'numeric', minute: '2-digit' })}</span>
          </div>
          <div style="margin-bottom: 3px;">
            <span>Bill No ${billNumber}</span>
          </div>
          <div style="margin-bottom: 3px;">
            <span>To: </span>
          </div>
          <div style="margin-bottom: 3px;">
            <span>Bill By: ${user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Unknown'}</span>
          </div>
        </div>

        <!-- Items Table -->
        <div style="margin-bottom: 15px;">
          <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr; gap: 5px; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 3px; margin-bottom: 5px;">
            <div>Item Name</div>
            <div style="text-align: right;">MRP</div>
            <div style="text-align: right;">SaleRate</div>
            <div style="text-align: right;">Qty</div>
            <div style="text-align: right;">NetAmount</div>
          </div>
          
          ${billData.items.map(item => {
            const mrp = (item.price * 1.1).toFixed(2);
            return `
              <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr; gap: 5px; padding: 2px 0; border-bottom: 1px dotted #ccc;">
                <div style="overflow: hidden; text-overflow: ellipsis;">${item.name}</div>
                <div style="text-align: right;">${mrp}</div>
                <div style="text-align: right;">${item.price.toFixed(2)}</div>
                <div style="text-align: right;">${item.quantity}</div>
                <div style="text-align: right;">${(item.price * item.quantity).toFixed(2)}</div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Summary -->
        <div style="margin-bottom: 15px;">
          <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; margin-bottom: 5px;">
            <span>Total</span>
            <span>${totalAmount.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
            <span>TOTAL QTY:</span>
            <span>${totalQty.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
            <span>AMOUNT PAID:</span>
            <span>${totalAmount.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
            <span>AMT RETURNED:</span>
            <span>0.00</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
            <span>YOU SAVE:</span>
            <span>${totalSavings.toFixed(2)}</span>
          </div>
        </div>

        <!-- GST Breakdown -->
        <div style="margin-bottom: 15px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr 1fr; gap: 5px; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 3px; margin-bottom: 5px;">
            <div>BASIC</div>
            <div style="text-align: right;">CGST%</div>
            <div style="text-align: right;">AMT</div>
            <div style="text-align: right;">SGST%</div>
            <div style="text-align: right;">AMT</div>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr 1fr; gap: 5px; padding: 2px 0; border-bottom: 1px dotted #ccc;">
            <div>${(totalAmount * 0.6).toFixed(2)}</div>
            <div style="text-align: right;">0.00</div>
            <div style="text-align: right;">0.00</div>
            <div style="text-align: right;">0.00</div>
            <div style="text-align: right;">0.00</div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr 1fr; gap: 5px; padding: 2px 0; border-bottom: 1px dotted #ccc;">
            <div>${(totalAmount * 0.25).toFixed(2)}</div>
            <div style="text-align: right;">12.50</div>
            <div style="text-align: right;">${(totalAmount * 0.025).toFixed(2)}</div>
            <div style="text-align: right;">12.50</div>
            <div style="text-align: right;">${(totalAmount * 0.025).toFixed(2)}</div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr 1fr; gap: 5px; padding: 2px 0; border-bottom: 1px dotted #ccc;">
            <div>${(totalAmount * 0.15).toFixed(2)}</div>
            <div style="text-align: right;">12.00</div>
            <div style="text-align: right;">${(totalAmount * 0.018).toFixed(2)}</div>
            <div style="text-align: right;">12.00</div>
            <div style="text-align: right;">${(totalAmount * 0.018).toFixed(2)}</div>
          </div>
        </div>

        <!-- Footer -->
        <div style="text-align: center; font-size: 10px;">
          <p style="font-weight: bold; margin: 5px 0;">THANK U VISIT AGAIN!</p>
          <p style="margin: 0;">NO WARRANTY! NO RETURN!</p>
        </div>
      </div>
    `;

    // Create new window for printing
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    printWindow.document.write(`
      <html>
        <head>
          <title>Bill - ${billNumber}</title>
          <style>
            body { margin: 0; padding: 0; }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          ${billContent}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    
    // Auto print after a short delay
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);

    toast({
      title: "Bill Generated",
      description: `Bill #${billNumber} generated successfully`,
    });
  };

  const generateQRCode = (paymentData) => {
    // In a real app, this would generate a QR code
    // For now, we'll show a placeholder QR code
    const qrContent = `
      <div style="text-align: center; padding: 20px;">
        <h3>Scan QR Code to Pay</h3>
        <div style="width: 200px; height: 200px; border: 2px solid #000; margin: 20px auto; display: flex; align-items: center; justify-content: center; background: #f0f0f0;">
          <div style="text-align: center;">
            <div style="font-size: 12px; margin-bottom: 10px;">QR CODE</div>
            <div style="font-size: 10px;">Amount: ₹${paymentData.amount}</div>
            <div style="font-size: 10px;">Items: ${paymentData.items}</div>
          </div>
        </div>
        <p style="font-size: 14px; margin-top: 10px;">Amount: ₹${paymentData.amount}</p>
        <p style="font-size: 12px; color: #666;">Scan with your payment app</p>
      </div>
    `;
    
    // Show QR code in a new window
    const qrWindow = window.open('', '_blank', 'width=400,height=500');
    qrWindow.document.write(qrContent);
    qrWindow.document.close();
  };

  // Barcode scanning functions
  const findItemByBarcode = (barcodeOrSku) => {
    if (!barcodeOrSku || !barcodeOrSku.trim()) return null;
    const normalized = barcodeOrSku.trim().toLowerCase();
    // Match by item.barcode OR by item.sku so SKU-encoded labels work
    const foundItem = items.find(item => {
      const hasBarcode = item.barcode && item.barcode.trim().toLowerCase() === normalized;
      const hasSku = item.sku && item.sku.trim().toLowerCase() === normalized;
      return hasBarcode || hasSku;
    });
    return foundItem || null;
  };

  const handleBarcodeScan = async (scannedBarcode) => {
    if (!scannedBarcode || !scannedBarcode.trim()) {
      toast({
        title: "Invalid Barcode",
        description: "Please scan a valid barcode",
        variant: "destructive",
      });
      return;
    }

    const normalizedBarcode = scannedBarcode.trim();

    // Prevent duplicate scans of the exact same barcode within 2 seconds
    // Allow different barcodes to be scanned rapidly for multiple items
    if (isProcessingScan) {
      return;
    }
    
    // Only block if it's the exact same barcode scanned very recently (within 1 second)
    // This allows rapid scanning of different items while preventing duplicate scans of the same item
    const now = Date.now();
    if (lastScannedBarcode === normalizedBarcode && lastScanned && lastScanned.time && (now - lastScanned.time) < 1000) {
      return;
    }

    setIsProcessingScan(true);
    setIsScanning(true);
    setLastScannedBarcode(normalizedBarcode);
    try {
      // First try to get item from barcode API (PO generated barcodes)
      let itemData = null;
      
      try {
        const barcodeResponse = await barcodesAPI.getItemByBarcode(scannedBarcode.trim());
        const barcodeResult = barcodeResponse.data;
        itemData = {
          ...barcodeResult.item,
          _id: barcodeResult.item.sku, // Use SKU as ID for cart purposes
          name: barcodeResult.item.name,
          sku: barcodeResult.item.sku,
          price: barcodeResult.item.price,
        };
      } catch (barcodeError) {
        // If barcode API fails, try to find item in local items by barcode
        const localItem = findItemByBarcode(scannedBarcode);
        
        if (!localItem) {
          toast({
            title: "Barcode Not Found",
            description: `No item found with barcode: ${scannedBarcode}`,
            variant: "destructive",
          });
          setBarcodeInput("");
          return;
        }
        
        itemData = localItem;
      }

      // Check if item is active (for local items)
      if (itemData.hasOwnProperty('isActive') && !itemData.isActive) {
        toast({
          title: "Item Unavailable",
          description: `${itemData.name} is currently inactive`,
          variant: "destructive",
        });
        setBarcodeInput("");
        return;
      }

      // Check stock (for local items)
      if (itemData.hasOwnProperty('stock') && itemData.stock <= 0) {
        toast({
          title: "Out of Stock",
          description: `${itemData.name} is out of stock`,
          variant: "destructive",
        });
        setBarcodeInput("");
        return;
      }

      // Add item to cart with quantity 1 (default quantity as requested)
      const existingItem = cart.find(cartItem => cartItem.sku === itemData.sku);
      
      if (existingItem) {
        // Item already in cart, increment quantity
        setCart(cart.map(cartItem =>
          cartItem.sku === itemData.sku
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        ));
      } else {
        // Item not in cart, add with quantity 1
        setCart([...cart, { ...itemData, quantity: 1 }]);
      }

      // Persist last scanned data for on-screen display
      const scanTime = Date.now();
      setLastScanned({ sku: itemData.sku, name: itemData.name, time: scanTime });

      toast({
        title: "Item Scanned",
        description: `SKU: ${itemData.sku} • ${itemData.name} (qty: ${existingItem ? existingItem.quantity + 1 : 1})`,
      });

      // Clear search inputs immediately to allow next scan
      setSearchTerm("");
      setBarcodeInput("");
      
      // Keep cart open when items are being scanned (for multiple item scanning)
      setIsCartOpen(true);
      
      // Auto-focus appropriate input field for next scan to enable continuous scanning
      setTimeout(() => {
        // Prioritize cart barcode input if cart is open, then regular barcode input, then search field
        const cartBarcodeInput = document.getElementById('cart-barcode-input');
        const barcodeInput = document.getElementById('barcode-scan-input');
        const searchInput = document.querySelector('input[placeholder*="Search by name, SKU"]');
        
        if (cartBarcodeInput) {
          cartBarcodeInput.focus();
        } else if (barcodeInput) {
          barcodeInput.focus();
        } else if (searchInput) {
          searchInput.focus();
        }
      }, 100);
    } catch (error) {
      console.error("Error scanning barcode:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to scan barcode",
        variant: "destructive",
      });
      setBarcodeInput("");
    } finally {
      // Don't disable scanning - keep it enabled by default
      // Allow next scan quickly (300ms) to enable rapid scanning of multiple items
      // The lastScannedBarcode check will prevent exact duplicate scans
      setTimeout(() => {
        setIsProcessingScan(false);
      }, 300);
    }
  };

  const handleScanButtonClick = () => {
    // Toggle scanning mode - user can manually disable/enable it
    setIsScanning(prev => {
      const newValue = !prev;
      // If enabling scanning, focus the input after state update
      if (newValue) {
        setTimeout(() => {
          const barcodeInputElement = document.getElementById('barcode-scan-input');
          if (barcodeInputElement) {
            barcodeInputElement.focus();
          } else {
            // Fallback to search field if barcode input not available
            const searchInput = document.querySelector('input[placeholder*="Search by name, SKU"]');
            if (searchInput) {
              searchInput.focus();
            }
          }
        }, 100);
      }
      return newValue;
    });
    setBarcodeInput("");
  };

  const handleBarcodeInputKeyDown = (e) => {
    // Most barcode scanners send Enter key after scanning
    if (e.key === 'Enter' && barcodeInput.trim()) {
      e.preventDefault();
      handleBarcodeScan(barcodeInput);
    }
  };

  const ItemCard = ({ item }) => {
    const subcategoryName = item.subcategory?.name || "Unknown";
    const subcategoryColor = `bg-blue-100 text-blue-800`; // Default color
    const lowStockItemSkus = lowStockItems.map(i => i.sku);
    const isLowStock = lowStockItemSkus.includes(item.sku);

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <Card className={`hover:shadow-lg transition-shadow duration-200 ${getItemColor(item)} ${!item.isActive ? 'opacity-60 border-dashed' : ''}`}>
          <CardHeader className="pb-2 md:pb-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-sm md:text-lg truncate">{item.name}</CardTitle>
                <p className="text-xs md:text-sm text-muted-foreground truncate">{item.sku}</p>
                {!item.isActive && (
                  <Badge variant="secondary" className="mt-1 bg-gray-100 text-gray-600 text-xs">
                    Inactive
                  </Badge>
                )}
              </div>
              <Badge className={`${subcategoryColor} text-xs shrink-0`}>
                {subcategoryName}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 md:space-y-3">
            <div className="flex items-center justify-center h-24 md:h-32 bg-muted rounded-lg overflow-hidden">
              {item.images && item.images.length > 0 ? (
                (() => {
                  const primaryImage = item.images.find(img => img.isPrimary);
                  const imageToShow = primaryImage || item.images[0];
                  
                  // Construct proper image URL
                  let imageUrl = imageToShow.url;
                  
                  // If it's a base64 data URL, use it directly
                  if (imageToShow.url.startsWith('data:image')) {
                    imageUrl = imageToShow.url;
                  }
                  // If it's an external URL (http/https), use it directly
                  else if (imageToShow.url.startsWith('http://') || imageToShow.url.startsWith('https://')) {
                    imageUrl = imageToShow.url;
                  }
                  // If it's a relative path like /uploads/items/filename.ext, use it directly (proxied in development)
                  else if (imageToShow.url.startsWith('/uploads/')) {
                    imageUrl = imageToShow.url;
                  }
                  // If it's just a filename, prepend the uploads path
                  else {
                    imageUrl = `/uploads/items/${imageToShow.url}`;
                  }
                  
                  console.log('ItemCard - Displaying image for item:', item.name);
                  console.log('ItemCard - Image URL:', imageUrl);
                  console.log('ItemCard - All images:', item.images);
                  
                  return (
                    <img 
                      src={imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.log('ItemCard - Image failed to load:', e.target.src);
                        e.target.style.display = 'none';
                        // Check if nextSibling exists before accessing its style
                        if (e.target.nextSibling && e.target.nextSibling.style) {
                          e.target.nextSibling.style.display = 'flex';
                        }
                      }}
                      onLoad={() => {
                        console.log('ItemCard - Image loaded successfully:', imageUrl);
                      }}
                    />
                  );
                })()
              ) : null}
              {(!item.images || item.images.length === 0) && (
                <Package className="h-8 w-8 md:h-12 md:w-12 text-muted-foreground" />
              )}
            </div>
            
            <div className="space-y-1 md:space-y-2">
              {/* Price and Cost Display with Offer Indicator */}
              {item.cost !== undefined && item.cost !== null && item.cost !== "" ? (
                <div className="space-y-1 p-2 rounded-lg bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs md:text-sm font-medium text-gray-600">Cost Price:</span>
                    <span className="text-xs md:text-sm font-semibold text-gray-700 line-through">₹{parseFloat(item.cost).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs md:text-sm font-semibold text-gray-800">Sale Price:</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm md:text-base font-bold ${
                        parseFloat(item.price) < parseFloat(item.cost) 
                          ? 'text-green-600' 
                          : 'text-gray-800'
                      }`}>
                        ₹{parseFloat(item.price).toFixed(2)}
                      </span>
                      {parseFloat(item.price) < parseFloat(item.cost) && (
                        <Badge className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 animate-pulse">
                          OFFER
                        </Badge>
                      )}
                    </div>
                  </div>
                  {parseFloat(item.price) < parseFloat(item.cost) && (
                    <div className="text-xs text-green-700 font-semibold mt-1">
                      Save ₹{((parseFloat(item.cost) - parseFloat(item.price)).toFixed(2))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex justify-between text-xs md:text-sm">
                  <span className="font-medium">Price:</span>
                  <span className="text-sm md:text-base font-semibold">₹{parseFloat(item.price || 0).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs md:text-sm">
                <span className="font-medium">Stock:</span>
                <span className={`${
                  isLowStock 
                    ? 'text-red-600 font-bold' 
                    : item.stock < (item.minStock || 10) 
                    ? 'text-destructive font-semibold' 
                    : 'text-green-600'
                }`}>
                  {item.stock} {item.unit}
                </span>
              </div>
              <div className="flex justify-between text-xs md:text-sm">
                <span className="font-medium">Status:</span>
                {getStockStatusBadge(item)}
              </div>
            </div>

            {item.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {item.description}
              </p>
            )}

            <div className="flex gap-1 md:gap-2 pt-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => addToCart(item)}
                disabled={!item.isActive}
                className={`flex-1 text-xs md:text-sm ${!item.isActive ? 'opacity-50 cursor-not-allowed' : 'bg-gradient-primary'}`}
              >
                <ShoppingCart className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                <span className="hidden sm:inline">{!item.isActive ? 'Unavailable' : 'Add to Cart'}</span>
                <span className="sm:hidden">{!item.isActive ? 'N/A' : 'Add'}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit(item)}
                className="px-2 md:px-3"
              >
                <Edit className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(item)}
                className="px-2 md:px-3 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6">
      {/* Header Section - Mobile Responsive */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex-1"
        >
          <h1 className="text-2xl md:text-3xl font-bold">Inventory Management</h1>
          <p className="text-sm md:text-base text-muted-foreground">Manage your store inventory by category</p>
        </motion.div>
        
        {/* Action Buttons - Mobile Responsive */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <Button
            variant="outline"
            onClick={() => navigate('/categories')}
            className="flex items-center justify-center gap-2 text-sm md:text-base"
            size="sm"
          >
            <FolderTree className="h-4 w-4" />
            <span className="hidden sm:inline">Categories</span>
          </Button>
          <Button
            variant={isScanning ? "default" : "outline"}
            onClick={handleScanButtonClick}
            className={`flex items-center justify-center gap-2 text-sm md:text-base ${isScanning ? 'bg-green-600 hover:bg-green-700' : ''}`}
            size="sm"
          >
            <ScanLine className="h-4 w-4" />
            <span className="hidden sm:inline">{isScanning ? 'Scanning...' : 'Scan Barcode'}</span>
            <span className="sm:hidden">{isScanning ? 'Scanning' : 'Scan'}</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsCartOpen(true)}
            className="relative flex items-center justify-center gap-2 text-sm md:text-base"
            size="sm"
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Cart</span>
            {getTotalItems() > 0 && (
              <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs">
                {getTotalItems()}
              </Badge>
            )}
          </Button>
          <Button onClick={handleAddNew} className="bg-gradient-primary flex items-center justify-center gap-2 text-sm md:text-base" size="sm">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add New Item</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      {/* Barcode Scan Input - Shown when scanning mode is active */}
      {isScanning && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-green-50 border-2 border-green-500 rounded-lg p-4"
        >
          <div className="flex items-center gap-3">
            <ScanLine className="h-5 w-5 text-green-600 animate-pulse" />
            <div className="flex-1">
              <Label htmlFor="barcode-scan-input" className="text-sm font-semibold text-green-800">
                Ready to scan barcode...
              </Label>
              <Input
                id="barcode-scan-input"
                placeholder="Scan barcode or type barcode here..."
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyDown={handleBarcodeInputKeyDown}
                className="mt-2 text-sm md:text-base"
                autoFocus
              />
              {lastScanned && (
                <div className="mt-2 text-xs md:text-sm text-green-900">
                  Last scanned: <span className="font-semibold">SKU {lastScanned.sku}</span>{' '}
                  <span className="text-muted-foreground">— {lastScanned.name}</span>
                </div>
              )}
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setIsScanning(false);
                setBarcodeInput("");
              }}
              size="sm"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}

      {/* Filters and Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, SKU, or scan barcode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              // Also handle Enter key for manual barcode entry
              if (e.key === 'Enter' && searchTerm.trim().length >= 10 && /^\d+$/.test(searchTerm.trim())) {
                e.preventDefault();
                handleBarcodeScan(searchTerm.trim());
                setSearchTerm("");
              }
            }}
            className="pl-9 text-sm md:text-base"
          />
        </div>
        
        <Select 
          value={selectedCategory} 
          onValueChange={setSelectedCategory}
        >
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category._id} value={category._id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Status Filter - Only show for admin users */}
        {isAdmin && (
          <Select 
            value={selectedStatus} 
            onValueChange={setSelectedStatus}
          >
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="inactive">Inactive Only</SelectItem>
            </SelectContent>
          </Select>
        )}

      </motion.div>

      {/* Items Display */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {/* Category and Subcategory Navigation */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Browse by Category</h2>
          
          {/* Category Buttons */}
          <div className="mb-4">
            <h3 className="text-lg font-medium mb-2">Categories</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === "all" ? "default" : "outline"}
                onClick={() => setSelectedCategory("all")}
                className="flex items-center gap-2"
              >
                All Categories
                <Badge variant="secondary">
                  {filteredItems.length}
                </Badge>
              </Button>
              {categories.map((category) => {
                const categoryItems = items.filter(item => {
                  const itemCategoryId = item.subcategory?.parentCategory?._id;
                  return itemCategoryId === category._id;
                });
                
                // Apply status filter to category items count
                const filteredCategoryItems = categoryItems.filter(item => {
                  let matchesStatus = true;
                  if (isAdmin) {
                    if (selectedStatus === "active") {
                      matchesStatus = item.isActive === true;
                    } else if (selectedStatus === "inactive") {
                      matchesStatus = item.isActive === false;
                    }
                  } else {
                    matchesStatus = item.isActive === true;
                  }
                  return matchesStatus;
                });
                
                return (
                  <Button
                    key={category._id}
                    variant={selectedCategory === category._id ? "default" : "outline"}
                    onClick={() => setSelectedCategory(category._id)}
                    className="flex items-center gap-2"
                  >
                    {category.name}
                    <Badge variant="secondary">
                      {filteredCategoryItems.length}
                    </Badge>
                  </Button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Items Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading items...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No items found</h3>
            <p className="text-muted-foreground">
              {searchTerm 
                ? "Try adjusting your search terms" 
                : selectedCategory !== "all"
                ? `No items found in ${categories.find(cat => cat._id === selectedCategory)?.name || 'selected'} category`
                : selectedStatus !== "all" && isAdmin
                ? `No ${selectedStatus} items available`
                : "No items available"}
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredItems.map((item) => (
              <ItemCard key={item._id} item={item} />
            ))}
          </div>
        )}
      </motion.div>

       {/* Add/Edit Item Modal */}
       <Modal
         open={isModalOpen}
         onOpenChange={setIsModalOpen}
         title={editingItem ? "Edit Item" : "Add New Item"}
         description="Enter the item details below"
       >
         <form onSubmit={handleSubmit} className="flex flex-col h-[70vh]">
           <div className="flex-1 overflow-y-auto space-y-4 -mx-1 px-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
              <Label htmlFor="name">Item Name</Label>
              <Input
                id="name"
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                value={formData.sku || ""}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subcategory">Subcategory *</Label>
              <Select
                value={formData.subcategory}
                onValueChange={(value) =>
                  setFormData({ ...formData, subcategory: value })
                }
              >
                <SelectTrigger id="subcategory">
                  <SelectValue placeholder="Select subcategory" />
                </SelectTrigger>
                <SelectContent>
                  {subcategories.map((subcategory) => (
                    <SelectItem key={subcategory._id} value={subcategory._id}>
                      {subcategory.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Sale Price (₹) *</Label>
              <Input
                id="price"
                type="number"
                value={formData.price || ""}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                required
                placeholder="Must be ≤ cost price"
              />
              {formData.cost && parseFloat(formData.cost) > 0 && (
                <p className="text-xs text-muted-foreground">
                  {formData.price && parseFloat(formData.price) > parseFloat(formData.cost) ? (
                    <span className="text-red-600">Price must be ≤ Cost (₹{parseFloat(formData.cost).toFixed(2)})</span>
                  ) : (
                    <span className="text-green-600">✓ Price is within limit (Cost: ₹{parseFloat(formData.cost).toFixed(2)})</span>
                  )}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                type="number"
                value={formData.stock || ""}
                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unit">Unit *</Label>
              <Select
                value={formData.unit || "kg"}
                onValueChange={(value) => setFormData({ ...formData, unit: value })}
                required
              >
                <SelectTrigger id="unit" className={!formData.unit ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select unit (required)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">Kilogram (kg)</SelectItem>
                  <SelectItem value="g">Gram (g)</SelectItem>
                  <SelectItem value="liters">Liters</SelectItem>
                  <SelectItem value="ml">Milliliters (ml)</SelectItem>
                  <SelectItem value="pieces">Pieces</SelectItem>
                  <SelectItem value="boxes">Boxes</SelectItem>
                  <SelectItem value="packets">Packets</SelectItem>
                  <SelectItem value="bottles">Bottles</SelectItem>
                  <SelectItem value="bags">Bags</SelectItem>
                  <SelectItem value="dozen">Dozen</SelectItem>
                  <SelectItem value="meters">Meters</SelectItem>
                  <SelectItem value="feet">Feet</SelectItem>
                </SelectContent>
              </Select>
              {!formData.unit && (
                <p className="text-sm text-red-500">Please select a unit (e.g., kg for Green gram)</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="isActive">Status</Label>
              <Select
                value={formData.isActive ? "active" : "inactive"}
                onValueChange={(value) =>
                  setFormData({ ...formData, isActive: value === "active" })
                }
              >
                <SelectTrigger id="isActive">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cost">Cost Price (₹)</Label>
              <Input
                id="cost"
                type="number"
                value={formData.cost || ""}
                onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || "" })}
                placeholder="Cost price (Sale price must be ≤ this)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minStock">Minimum Stock</Label>
              <Input
                id="minStock"
                type="number"
                value={formData.minStock || ""}
                onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })}
                placeholder="Minimum stock level"
              />
            </div>
          </div>

          {/* Image Upload Section */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="images">Item Images</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="images"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="flex-1"
                  disabled={uploadingImages}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('images').click()}
                  disabled={uploadingImages}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploadingImages ? "Uploading..." : "Upload"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Upload multiple images (JPG, PNG, GIF, WEBP, SVG, BMP, TIFF). The first image will be set as primary.
              </p>
            </div>

            {/* Image Preview */}
            {itemImages.length > 0 && (
              <div className="space-y-2">
                <Label>Image Preview</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {itemImages.map((image, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200">
                        <img
                          src={(() => {
                            // If it's a base64 data URL, use it directly
                            if (image.url.startsWith('data:image')) {
                              return image.url;
                            }
                            // If it's an external URL, use it directly
                            else if (image.url.startsWith('http://') || image.url.startsWith('https://')) {
                              return image.url;
                            }
                            // If it's a relative path like /uploads/items/filename.ext, use it directly
                            else if (image.url.startsWith('/uploads/')) {
                              return image.url;
                            }
                            // If it's just a filename, prepend the uploads path
                            else {
                              return `/uploads/items/${image.url}`;
                            }
                          })()}
                          alt={image.alt}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.log('Preview image failed to load:', e.target.src);
                            e.target.src = 'https://via.placeholder.com/150x150?text=Image+Error';
                          }}
                        />
                        {image.isPrimary && (
                          <div className="absolute top-1 left-1">
                            <Badge variant="default" className="text-xs">Primary</Badge>
                          </div>
                        )}
                      </div>
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="flex gap-1">
                          {!image.isPrimary && (
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => setPrimaryImage(index)}
                              className="h-8 w-8 p-0"
                            >
                              <ImageIcon className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() => removeImage(index)}
                            className="h-8 w-8 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxStock">Maximum Stock</Label>
              <Input
                id="maxStock"
                type="number"
                value={formData.maxStock || ""}
                onChange={(e) => setFormData({ ...formData, maxStock: parseInt(e.target.value) || "" })}
                placeholder="Maximum stock level"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="barcode">Barcode</Label>
              <Input
                id="barcode"
                value={formData.barcode || ""}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                placeholder="Product barcode"
              />
            </div>
          </div>

          {/* Barcode preview and reprint */}
          {editingItem && (
            <div className="mt-2 p-3 border rounded bg-white">
              <div className="space-y-3">
                {/* Batch Selection */}
                {editingItem.batches && editingItem.batches.length > 0 && (
                  <div className="space-y-2">
                    <Label>Select Batch</Label>
                    <Select
                      value={selectedBatch !== null ? String(editingItem.batches.findIndex(b => b.batchNumber === selectedBatch.batchNumber)) : ""}
                      onValueChange={(value) => {
                        const index = parseInt(value);
                        if (index >= 0 && index < editingItem.batches.length) {
                          setSelectedBatch(editingItem.batches[index]);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a batch" />
                      </SelectTrigger>
                      <SelectContent>
                        {editingItem.batches.map((batch, index) => (
                          <SelectItem key={index} value={String(index)}>
                            Batch: {batch.batchNumber} - Stock: {batch.quantity}
                            {batch.expiryDate && ` - Exp: ${new Date(batch.expiryDate).toLocaleDateString('en-GB')}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedBatch && (
                      <p className="text-xs text-muted-foreground">
                        Selected: Batch {selectedBatch.batchNumber} - {selectedBatch.quantity} available
                      </p>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between mb-2">
                  <Label>Barcode Label Preview</Label>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      // If batches exist, require batch selection
                      if ((editingItem.batches && editingItem.batches.length > 0) && !selectedBatch) {
                        toast({
                          title: "No Batch Selected",
                          description: "Please select a batch to print labels",
                          variant: "destructive",
                        });
                        return;
                      }

                      const imgData = window.__lastItemLabelDataUrl;
                      if (!imgData) {
                        toast({
                          title: "Barcode Not Ready",
                          description: "Please wait for barcode to load",
                          variant: "destructive",
                        });
                        return;
                      }

                      const storeName = 'Murugan Stores';
                      const itemName = formData.name || '';
                      const itemSku = formData.sku || '';
                      const batchNumber = selectedBatch ? selectedBatch.batchNumber : (formData.batchNumber || '-');
                      const price = Number(formData.price || 0).toFixed(2);
                      const expiry = selectedBatch && selectedBatch.expiryDate 
                        ? new Date(selectedBatch.expiryDate).toLocaleDateString('en-GB')
                        : (formData.expiryDate ? new Date(formData.expiryDate).toLocaleDateString('en-GB') : 'N/A');
                      
                      // Get quantity to print - use batch quantity if batch is selected, otherwise print 1
                      const quantityToPrint = selectedBatch ? selectedBatch.quantity : 1;

                      const printWin = window.open('', '_blank', 'width=380,height=600');
                      let labelsHTML = '';
                      
                      // Generate labels based on batch stock count
                      for (let i = 0; i < quantityToPrint; i++) {
                        labelsHTML += `
                          <div class="label" style="page-break-after: always; margin-bottom: 2mm;">
                            <div class="header">${storeName}</div>
                            <div class="barcode">${imgData ? `<img src="${imgData}" />` : ''}</div>
                            ${itemSku ? `<div style="text-align:center; font-size:10px; font-family:monospace; margin-top:1mm;">SKU: ${itemSku}</div>` : ''}
                            <div class="footer">
                              <div class="name">${itemName}</div>
                              <div>Batch: ${batchNumber || '-'}</div>
                              <div class="row">
                                <span>Exp: ${expiry}</span>
                                <span>Price: ₹${price}</span>
                              </div>
                            </div>
                          </div>
                        `;
                      }

                      printWin.document.write(`
                        <html>
                          <head>
                            <title>Print Barcode Labels</title>
                            <style>
                              @page { size: 80mm 55mm; margin: 0; }
                              html, body { height: 100%; }
                              body{ margin:0; padding:0; font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial; }
                              .label { width: 80mm; min-height: 45mm; padding: 3mm; border: 0.6mm solid #1f2937; box-sizing: border-box; }
                              .header { text-align:center; font-weight:700; font-size: 14px; border-bottom: 0.6mm solid #1f2937; padding-bottom: 1mm; margin-bottom: 1mm; }
                              .barcode { display:flex; justify-content:center; align-items:center; min-height: 20mm; margin: 2mm 0; }
                              .footer { border-top: 0.6mm solid #1f2937; padding-top: 1mm; margin-top: 1mm; font-size: 10px; }
                              .row { display:flex; justify-content:space-between; font-size:10px; }
                              img { max-width:100%; height:auto; }
                              .name { font-weight:600; font-size:11px; margin-bottom:1mm; }
                            </style>
                          </head>
                          <body>
                            ${labelsHTML}
                            <script>setTimeout(()=>{window.print();window.close();},300);</script>
                          </body>
                        </html>
                      `);
                      printWin.document.close();

                      toast({
                        title: "Printing Labels",
                        description: selectedBatch 
                          ? `Printing ${quantityToPrint} label(s) for Batch ${batchNumber}`
                          : `Printing 1 label`,
                      });
                    }}
                    disabled={editingItem.batches && editingItem.batches.length > 0 && !selectedBatch}
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Print Label{selectedBatch && selectedBatch.quantity > 1 ? `s (${selectedBatch.quantity})` : ''}
                  </Button>
                </div>
                <BarcodeLabel
                  sku={formData.sku}
                  barcode={formData.barcode}
                  storeName={selectedStore?.name}
                  itemName={formData.name}
                  amount={formData.price}
                  batchNumber={selectedBatch ? selectedBatch.batchNumber : (formData.batchNumber || '')}
                  expiryDate={selectedBatch && selectedBatch.expiryDate ? selectedBatch.expiryDate : formData.expiryDate}
                  onCanvasReady={(canvas) => {
                    try { window.__lastItemLabelDataUrl = canvas.toDataURL('image/png'); } catch {}
                  }}
                />
              </div>
            </div>
          )}

          </div>
          
          {/* Fixed buttons at bottom */}
          <div className="flex gap-3 pt-4 mt-auto border-t bg-background">
            <Button type="submit" className="flex-1 bg-gradient-primary" disabled={saving}>
              {saving ? "Saving..." : (editingItem ? "Update Item" : "Add Item")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={saving}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
        </Modal>

      {/* Cart Modal - Mobile Responsive */}
      <Modal
        open={isCartOpen}
        onOpenChange={setIsCartOpen}
        title="Shopping Cart"
        description="Review your selected items"
        className="max-w-full mx-4 md:max-w-2xl"
      >
        <div className="space-y-3 md:space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Barcode Scanner in Cart Modal - Always visible when cart is open */}
          <div className="bg-green-50 border-2 border-green-500 rounded-lg p-3 mb-3">
            <div className="flex items-center gap-3">
              <ScanLine className="h-5 w-5 text-green-600 animate-pulse" />
              <div className="flex-1">
                <Label htmlFor="cart-barcode-input" className="text-sm font-semibold text-green-800">
                  Scan barcode to add more items...
                </Label>
                <Input
                  id="cart-barcode-input"
                  placeholder="Scan barcode or type barcode here..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={(e) => {
                    // Most barcode scanners send Enter key after scanning
                    if (e.key === 'Enter' && barcodeInput.trim()) {
                      e.preventDefault();
                      handleBarcodeScan(barcodeInput.trim());
                    }
                  }}
                  className="mt-2 text-sm md:text-base"
                  autoFocus
                />
                {lastScanned && (
                  <div className="mt-2 text-xs md:text-sm text-green-900">
                    Last scanned: <span className="font-semibold">SKU {lastScanned.sku}</span>{' '}
                    <span className="text-muted-foreground">— {lastScanned.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {cart.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
              <p className="text-muted-foreground">Add some items to get started</p>
            </div>
          ) : (
            <>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item._id} className="flex items-center gap-2 md:gap-3 p-2 md:p-3 border rounded-lg">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm md:text-base truncate">{item.name}</h4>
                      <p className="text-xs md:text-sm text-muted-foreground truncate">{item.sku}</p>
                      <p className="text-xs md:text-sm font-semibold">₹{item.price}</p>
                    </div>
                    
                    <div className="flex items-center gap-1 md:gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item._id, item.quantity - 1)}
                        className="h-8 w-8 p-0"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 md:w-8 text-center text-xs md:text-sm">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item._id, item.quantity + 1)}
                        className="h-8 w-8 p-0"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromCart(item._id)}
                      className="text-destructive hover:text-destructive h-8 w-8 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-3 md:pt-4">
                <div className="space-y-2 mb-3 md:mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm md:text-base font-medium">Subtotal:</span>
                    <span className="text-sm md:text-base">₹{getSubtotal()}</span>
                  </div>
                  
                  {/* Discount Field - Admin Only */}
                  {isAdmin && (
                    <div className="flex items-center gap-2">
                      <Label htmlFor="discount" className="text-sm font-medium">Discount:</Label>
                      <Input
                        id="discount"
                        type="number"
                        min="0"
                        max={getSubtotal()}
                        step="0.01"
                        value={discountAmount}
                        onChange={(e) => setDiscountAmount(Math.max(0, Math.min(getSubtotal(), parseFloat(e.target.value) || 0)))}
                        className="w-20 text-sm"
                        placeholder="0.00"
                      />
                      <span className="text-xs text-muted-foreground">₹</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <span className="text-base md:text-lg font-semibold">Total:</span>
                    <span className="text-base md:text-lg font-bold">₹{getTotalPrice()}</span>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <Button
                    onClick={proceedToPayment}
                    className="flex-1 bg-gradient-primary"
                    size="sm"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Proceed to Payment
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsCartOpen(false)}
                    size="sm"
                  >
                    Continue Shopping
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Billing Modal */}
      {/* Payment Modal - Mobile Responsive */}
      <Modal
        open={isBillingOpen}
        onOpenChange={setIsBillingOpen}
        title="Payment Options"
        description="Choose your preferred payment method"
        className="max-w-full mx-4 md:max-w-lg"
      >
        <div className="space-y-4 md:space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Order Summary */}
          <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
            <h3 className="font-semibold mb-3 text-sm md:text-base">Order Summary</h3>
            <div className="space-y-2">
              {cart.map((item) => (
                <div key={item._id} className="flex justify-between text-xs md:text-sm">
                  <span>{item.name} x{item.quantity}</span>
                  <span>₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-2 mt-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>₹{getSubtotal()}</span>
              </div>
              {isAdmin && discountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount:</span>
                  <span>-₹{discountAmount}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-sm md:text-base">
                <span>Total:</span>
                <span>₹{getTotalPrice()}</span>
              </div>
            </div>
          </div>

          {/* Payment Options - Mobile Responsive */}
          <div className="space-y-3 md:space-y-4">
            <h3 className="font-semibold text-sm md:text-base">Select Payment Method</h3>
            
            {/* Cash Payment */}
            <Button
              onClick={handleCashPayment}
              className="w-full h-12 md:h-16 bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2 md:gap-3"
              disabled={saving}
            >
              <Banknote className="h-5 w-5 md:h-6 md:w-6" />
              <div className="text-left">
                <div className="font-semibold text-sm md:text-base">{saving ? "Saving Bill..." : "Cash Payment"}</div>
                <div className="text-xs md:text-sm opacity-90">{saving ? "Please wait..." : "Automatic bill generation"}</div>
              </div>
            </Button>

            {/* Online Payment */}
            <Button
              onClick={handleOnlinePayment}
              className="w-full h-12 md:h-16 bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 md:gap-3"
            >
              <QrCode className="h-5 w-5 md:h-6 md:w-6" />
              <div className="text-left">
                <div className="font-semibold text-sm md:text-base">Online Payment</div>
                <div className="text-xs md:text-sm opacity-90">QR code generation</div>
              </div>
            </Button>
          </div>

          {/* Back Button */}
          <Button
            variant="outline"
            onClick={() => setIsBillingOpen(false)}
            className="w-full"
            size="sm"
          >
            Back to Cart
          </Button>
        </div>
      </Modal>

      {/* Bill Modal */}
      <BillModal 
        isOpen={isBillModalOpen} 
        onClose={() => {
          setIsBillModalOpen(false);
          setCart([]); // Clear cart after bill is closed
          setIsCartOpen(false); // Close cart modal
          setIsScanning(true); // Re-enable scanning mode for next bill
          // Focus barcode input after bill closes
          setTimeout(() => {
            const barcodeInputElement = document.getElementById('barcode-scan-input');
            if (barcodeInputElement) {
              barcodeInputElement.focus();
            } else {
              // Fallback to search field if barcode input not available
              const searchInput = document.querySelector('input[placeholder*="Search by name, SKU"]');
              if (searchInput) {
                searchInput.focus();
              }
            }
          }, 100);
        }} 
        billData={billData}
        isAdmin={isAdmin}
      />
    </div>
  );
}
