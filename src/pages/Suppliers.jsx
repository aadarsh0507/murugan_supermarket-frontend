import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Truck,
  Store,
  Mail,
  Phone,
  MapPin,
  User,
  Building2,
  Check,
  X,
  Save,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/Modal";
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
import { suppliersAPI } from "@/services/api";

const Suppliers = () => {
  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState([]);
  const [stores, setStores] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [currentScreen, setCurrentScreen] = useState("list"); // 'list', 'supplier', 'stores'
  const [currentSupplier, setCurrentSupplier] = useState(null);
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);

  // Store form data
  const [storeFormData, setStoreFormData] = useState({
    name: "",
    code: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
    },
    phone: "",
    email: "",
    managerName: "",
    isActive: true
  });

  // Form data
  const [formData, setFormData] = useState({
    companyName: "",
    contactPerson: {
      firstName: "",
      lastName: "",
      designation: ""
    },
    email: "",
    phone: {
      primary: "",
      secondary: ""
    },
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "India"
    },
    gstNumber: "",
    panNumber: "",
    bankDetails: {
      accountNumber: "",
      bankName: "",
      branch: "",
      ifscCode: ""
    },
    creditLimit: "",
    paymentTerms: "",
    isActive: true,
    notes: ""
  });

  const [selectedStores, setSelectedStores] = useState([]);

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
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load suppliers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredSuppliers = suppliers.filter((supplier) => {
    const matchesSearch = 
      supplier.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contactPerson.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.phone.primary.includes(searchTerm);
    
    const matchesStatus = 
      filterStatus === "all" || 
      (filterStatus === "active" && supplier.isActive) ||
      (filterStatus === "inactive" && !supplier.isActive);
    
    return matchesSearch && matchesStatus;
  });

  const handleAddNew = () => {
    setEditingSupplier(null);
    setCurrentSupplier(null);
    setFormData({
      companyName: "",
      contactPerson: { firstName: "", lastName: "", designation: "" },
      email: "",
      phone: { primary: "", secondary: "" },
      address: { street: "", city: "", state: "", zipCode: "", country: "India" },
      gstNumber: "",
      panNumber: "",
      bankDetails: { accountNumber: "", bankName: "", branch: "", ifscCode: "" },
      creditLimit: "",
      paymentTerms: "",
      isActive: true,
      notes: ""
    });
    setSelectedStores([]);
    setCurrentScreen("supplier");
  };

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    setCurrentSupplier(supplier);
    setFormData({
      companyName: supplier.companyName || "",
      contactPerson: supplier.contactPerson || { firstName: "", lastName: "", designation: "" },
      email: supplier.email || "",
      phone: supplier.phone || { primary: "", secondary: "" },
      address: supplier.address || { street: "", city: "", state: "", zipCode: "", country: "India" },
      gstNumber: supplier.gstNumber || "",
      panNumber: supplier.panNumber || "",
      bankDetails: supplier.bankDetails || { accountNumber: "", bankName: "", branch: "", ifscCode: "" },
      creditLimit: supplier.creditLimit || "",
      paymentTerms: supplier.paymentTerms || "",
      isActive: supplier.isActive !== undefined ? supplier.isActive : true,
      notes: supplier.notes || ""
    });
    // Set selected stores from the supplier
    const storeIds = supplier.stores?.map(s => s.store._id) || [];
    setSelectedStores(storeIds);
    setCurrentScreen("supplier");
  };

  const handleDelete = async (supplier) => {
    if (!confirm(`Are you sure you want to delete ${supplier.companyName}?`)) return;
    
    try {
      await suppliersAPI.deleteSupplier(supplier._id);
      toast({
        title: "Success",
        description: "Supplier deleted successfully",
      });
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete supplier",
        variant: "destructive",
      });
    }
  };

  const handleSupplierSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      // Clean up the form data - remove empty strings and convert empty objects to undefined
      const cleanedData = {
        companyName: formData.companyName,
        contactPerson: {
          firstName: formData.contactPerson.firstName,
          lastName: formData.contactPerson.lastName?.trim() || undefined,
          designation: formData.contactPerson.designation?.trim() || undefined
        },
        email: formData.email,
        phone: {
          primary: formData.phone.primary,
          secondary: formData.phone.secondary?.trim() || undefined
        },
        address: {
          street: formData.address.street?.trim() || undefined,
          city: formData.address.city?.trim() || undefined,
          state: formData.address.state?.trim() || undefined,
          zipCode: formData.address.zipCode?.trim() || undefined,
          country: formData.address.country?.trim() || undefined
        },
        gstNumber: formData.gstNumber?.trim() || undefined,
        panNumber: formData.panNumber?.trim() || undefined,
        bankDetails: {
          accountNumber: formData.bankDetails.accountNumber?.trim() || undefined,
          bankName: formData.bankDetails.bankName?.trim() || undefined,
          branch: formData.bankDetails.branch?.trim() || undefined,
          ifscCode: formData.bankDetails.ifscCode?.trim() || undefined
        },
        creditLimit: formData.creditLimit?.trim() ? parseFloat(formData.creditLimit) : undefined,
        paymentTerms: formData.paymentTerms?.trim() || undefined,
        isActive: formData.isActive,
        notes: formData.notes?.trim() || undefined,
        stores: selectedStores.map(storeId => ({ store: storeId, isActive: true, addedDate: new Date() }))
      };

      // Remove undefined and empty string values recursively
      const removeUndefined = (obj) => {
        if (Array.isArray(obj)) {
          return obj.map(item => removeUndefined(item));
        }
        
        return Object.entries(obj).reduce((acc, [key, value]) => {
          // Skip undefined, null, or empty strings
          if (value === undefined || value === null || value === '') {
            return acc;
          }
          
          // Handle nested objects
          if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
            const cleaned = removeUndefined(value);
            // Only add if the cleaned object has at least one key
            if (Object.keys(cleaned).length > 0) {
              acc[key] = cleaned;
            }
          } else {
            acc[key] = value;
          }
          
          return acc;
        }, {});
      };

      const finalData = removeUndefined(cleanedData);

      if (editingSupplier) {
        await suppliersAPI.updateSupplier(editingSupplier._id, finalData);
        toast({
          title: "Success",
          description: "Supplier updated successfully",
        });
      } else {
        await suppliersAPI.createSupplier(finalData);
        toast({
          title: "Success",
          description: "Supplier created successfully",
        });
      }
      
      setCurrentScreen("list");
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to save supplier",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleStoreAssignment = (supplier) => {
    setCurrentSupplier(supplier);
    setCurrentScreen("stores");
  };

  const handleCreateStore = () => {
    setStoreFormData({
      name: "",
      code: "",
      address: {
        street: "",
        city: "",
        state: "",
        zipCode: "",
      },
      phone: "",
      email: "",
      managerName: "",
      isActive: true
    });
    setIsStoreModalOpen(true);
  };

  const handleStoreSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const cleanedStoreData = {
        name: storeFormData.name,
        code: storeFormData.code.toUpperCase(),
        address: {
          street: storeFormData.address.street || undefined,
          city: storeFormData.address.city || undefined,
          state: storeFormData.address.state || undefined,
          zipCode: storeFormData.address.zipCode || undefined
        },
        phone: storeFormData.phone || undefined,
        email: storeFormData.email || undefined,
        managerName: storeFormData.managerName || undefined,
        isActive: storeFormData.isActive
      };

      await suppliersAPI.createStore(cleanedStoreData);
      toast({
        title: "Success",
        description: "Store created successfully",
      });
      
      setIsStoreModalOpen(false);
      loadData(); // Reload stores list
      
      // If we're on the store assignment screen, refresh the current supplier
      if (currentScreen === "stores" && currentSupplier) {
        const suppliersRes = await suppliersAPI.getSuppliers({ limit: 100 });
        setSuppliers(suppliersRes.data.suppliers);
        const updatedSupplier = suppliersRes.data.suppliers.find(s => s._id === currentSupplier._id);
        if (updatedSupplier) {
          setCurrentSupplier(updatedSupplier);
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to create store",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddStoreToSupplier = async (storeId) => {
    if (!currentSupplier) return;
    
    try {
      const response = await suppliersAPI.addStoreToSupplier(currentSupplier._id, storeId);
      toast({
        title: "Success",
        description: "Store added successfully",
      });
      // Update current supplier with fresh data
      setCurrentSupplier(response.data);
      // Reload suppliers list
      const suppliersRes = await suppliersAPI.getSuppliers({ limit: 100 });
      setSuppliers(suppliersRes.data.suppliers);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to add store",
        variant: "destructive",
      });
    }
  };

  const handleRemoveStoreFromSupplier = async (storeId) => {
    if (!currentSupplier) return;
    
    try {
      const response = await suppliersAPI.removeStoreFromSupplier(currentSupplier._id, storeId);
      toast({
        title: "Success",
        description: "Store removed successfully",
      });
      // Update current supplier with fresh data
      setCurrentSupplier(response.data);
      // Reload suppliers list
      const suppliersRes = await suppliersAPI.getSuppliers({ limit: 100 });
      setSuppliers(suppliersRes.data.suppliers);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove store",
        variant: "destructive",
      });
    }
  };

  const isStoreAssigned = (storeId) => {
    return currentSupplier?.stores?.some(s => s.store._id === storeId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading suppliers...</p>
        </div>
      </div>
    );
  }

  // Store Creation Modal - placed outside conditionals
  const StoreCreationModal = (
    <Modal
      open={isStoreModalOpen}
      onOpenChange={setIsStoreModalOpen}
      title="Create New Store"
    >
      <form onSubmit={handleStoreSubmit} className="space-y-4">
        <div>
          <Label htmlFor="storeName">Store Name *</Label>
          <Input
            id="storeName"
            value={storeFormData.name}
            onChange={(e) => setStoreFormData({ ...storeFormData, name: e.target.value })}
            required
          />
        </div>
        
        <div>
          <Label htmlFor="storeCode">Store Code *</Label>
          <Input
            id="storeCode"
            value={storeFormData.code}
            onChange={(e) => setStoreFormData({ ...storeFormData, code: e.target.value })}
            placeholder="e.g., STORE001"
            required
          />
          <p className="text-xs text-muted-foreground mt-1">
            Unique code for this store
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={storeFormData.phone}
              onChange={(e) => setStoreFormData({ ...storeFormData, phone: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={storeFormData.email}
              onChange={(e) => setStoreFormData({ ...storeFormData, email: e.target.value })}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="managerName">Manager Name</Label>
          <Input
            id="managerName"
            value={storeFormData.managerName}
            onChange={(e) => setStoreFormData({ ...storeFormData, managerName: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Address</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="street">Street</Label>
              <Input
                id="street"
                value={storeFormData.address.street}
                onChange={(e) => setStoreFormData({
                  ...storeFormData,
                  address: { ...storeFormData.address, street: e.target.value }
                })}
              />
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={storeFormData.address.city}
                onChange={(e) => setStoreFormData({
                  ...storeFormData,
                  address: { ...storeFormData.address, city: e.target.value }
                })}
              />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={storeFormData.address.state}
                onChange={(e) => setStoreFormData({
                  ...storeFormData,
                  address: { ...storeFormData.address, state: e.target.value }
                })}
              />
            </div>
            <div>
              <Label htmlFor="zipCode">Zip Code</Label>
              <Input
                id="zipCode"
                value={storeFormData.address.zipCode}
                onChange={(e) => setStoreFormData({
                  ...storeFormData,
                  address: { ...storeFormData.address, zipCode: e.target.value }
                })}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsStoreModalOpen(false)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Creating..." : "Create Store"}
          </Button>
        </div>
      </form>
    </Modal>
  );

  // Render different screens
  if (currentScreen === "supplier") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => setCurrentScreen("list")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to List
          </Button>
          <h1 className="text-3xl font-bold">
            {editingSupplier ? "Edit Supplier" : "Add New Supplier"}
          </h1>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSupplierSubmit} className="space-y-6">
              {/* Company Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Company Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input
                      id="companyName"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Contact Person */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Contact Person
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={formData.contactPerson.firstName}
                      onChange={(e) => setFormData({
                        ...formData,
                        contactPerson: { ...formData.contactPerson, firstName: e.target.value }
                      })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.contactPerson.lastName}
                      onChange={(e) => setFormData({
                        ...formData,
                        contactPerson: { ...formData.contactPerson, lastName: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="designation">Designation</Label>
                    <Input
                      id="designation"
                      value={formData.contactPerson.designation}
                      onChange={(e) => setFormData({
                        ...formData,
                        contactPerson: { ...formData.contactPerson, designation: e.target.value }
                      })}
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Contact Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="primaryPhone">Primary Phone *</Label>
                    <Input
                      id="primaryPhone"
                      value={formData.phone.primary}
                      onChange={(e) => setFormData({
                        ...formData,
                        phone: { ...formData.phone, primary: e.target.value }
                      })}
                      placeholder="e.g., 9876543210"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Format: 10 digits, starting with 1-9 (no leading zeros)
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="secondaryPhone">Secondary Phone</Label>
                    <Input
                      id="secondaryPhone"
                      value={formData.phone.secondary}
                      onChange={(e) => setFormData({
                        ...formData,
                        phone: { ...formData.phone, secondary: e.target.value }
                      })}
                      placeholder="Optional"
                    />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Address
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="street">Street</Label>
                    <Input
                      id="street"
                      value={formData.address.street}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: { ...formData.address, street: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.address.city}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: { ...formData.address, city: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={formData.address.state}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: { ...formData.address, state: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="zipCode">Zip Code</Label>
                    <Input
                      id="zipCode"
                      value={formData.address.zipCode}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: { ...formData.address, zipCode: e.target.value }
                      })}
                    />
                  </div>
                </div>
              </div>

              {/* Tax Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Tax Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="gstNumber">GST Number</Label>
                    <Input
                      id="gstNumber"
                      value={formData.gstNumber}
                      onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="panNumber">PAN Number</Label>
                    <Input
                      id="panNumber"
                      value={formData.panNumber}
                      onChange={(e) => setFormData({ ...formData, panNumber: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Banking Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Banking Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="accountNumber">Account Number</Label>
                    <Input
                      id="accountNumber"
                      value={formData.bankDetails.accountNumber}
                      onChange={(e) => setFormData({
                        ...formData,
                        bankDetails: { ...formData.bankDetails, accountNumber: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="bankName">Bank Name</Label>
                    <Input
                      id="bankName"
                      value={formData.bankDetails.bankName}
                      onChange={(e) => setFormData({
                        ...formData,
                        bankDetails: { ...formData.bankDetails, bankName: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="branch">Branch</Label>
                    <Input
                      id="branch"
                      value={formData.bankDetails.branch}
                      onChange={(e) => setFormData({
                        ...formData,
                        bankDetails: { ...formData.bankDetails, branch: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="ifscCode">IFSC Code</Label>
                    <Input
                      id="ifscCode"
                      value={formData.bankDetails.ifscCode}
                      onChange={(e) => setFormData({
                        ...formData,
                        bankDetails: { ...formData.bankDetails, ifscCode: e.target.value }
                      })}
                    />
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Additional Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="creditLimit">Credit Limit (₹)</Label>
                    <Input
                      id="creditLimit"
                      type="number"
                      value={formData.creditLimit}
                      onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="paymentTerms">Payment Terms</Label>
                    <Input
                      id="paymentTerms"
                      value={formData.paymentTerms}
                      onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                      placeholder="e.g., Net 30"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <textarea
                    id="notes"
                    className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes..."
                  />
                </div>
              </div>

              {/* Store Assignment */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  Assign Stores
                </h3>
                <div>
                  <Label>Select Stores</Label>
                  <div className="mt-2 space-y-2 max-h-48 overflow-y-auto border rounded-lg p-4">
                    {stores.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No stores available. <Button
                          type="button"
                          variant="link"
                          className="p-0 h-auto"
                          onClick={handleCreateStore}
                        >
                          Create a store first
                        </Button>
                      </p>
                    ) : (
                      stores.map((store) => (
                        <div key={store._id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`store-${store._id}`}
                            checked={selectedStores.includes(store._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedStores([...selectedStores, store._id]);
                              } else {
                                setSelectedStores(selectedStores.filter(id => id !== store._id));
                              }
                            }}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <Label 
                            htmlFor={`store-${store._id}`}
                            className="flex items-center gap-2 cursor-pointer flex-1"
                          >
                            <span className="font-medium">{store.name}</span>
                            <span className="text-sm text-muted-foreground">({store.code})</span>
                          </Label>
                        </div>
                      ))
                    )}
                  </div>
                  {selectedStores.length > 0 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {selectedStores.length} {selectedStores.length === 1 ? 'store' : 'stores'} selected
                    </p>
                  )}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentScreen("list")}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : editingSupplier ? "Update Supplier" : "Create Supplier"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        {StoreCreationModal}
      </div>
    );
  }

  if (currentScreen === "stores") {
    const assignedStores = currentSupplier?.stores || [];
    const availableStores = stores.filter(store => 
      !assignedStores.some(assigned => assigned.store._id === store._id)
    );

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setCurrentScreen("list")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to List
            </Button>
            <h1 className="text-3xl font-bold">Store Assignment</h1>
          </div>
          <Button onClick={handleCreateStore}>
            <Plus className="mr-2 h-4 w-4" />
            Create Store
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Assigned Stores */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Check className="h-5 w-5" />
                Assigned Stores ({assignedStores.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {assignedStores.map((storeItem) => (
                  <div
                    key={storeItem.store._id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent"
                  >
                    <div>
                      <p className="font-medium">{storeItem.store.name}</p>
                      <p className="text-sm text-muted-foreground">{storeItem.store.code}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemoveStoreFromSupplier(storeItem.store._id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {assignedStores.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No stores assigned
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Available Stores */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Available Stores ({availableStores.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {availableStores.map((store) => (
                  <div
                    key={store._id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent"
                  >
                    <div>
                      <p className="font-medium">{store.name}</p>
                      <p className="text-sm text-muted-foreground">{store.code}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAddStoreToSupplier(store._id)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {availableStores.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    All stores are assigned
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        {StoreCreationModal}
      </div>
    );
  }

  // Main List View
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Supplier Master</h1>
          <p className="text-muted-foreground">
            Manage your suppliers and their store associations
          </p>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="mr-2 h-4 w-4" />
          Add Supplier
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by company name, contact, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Suppliers</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Suppliers Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>S.No.</TableHead>
                <TableHead>Company Name</TableHead>
                <TableHead>Contact Person</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Stores</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <p className="text-muted-foreground">No suppliers found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredSuppliers.map((supplier, index) => (
                  <TableRow key={supplier._id}>
                    <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                    <TableCell className="font-medium">{supplier.companyName}</TableCell>
                    <TableCell>
                      {supplier.contactPerson?.firstName} {supplier.contactPerson?.lastName}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        {supplier.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3" />
                        {supplier.phone?.primary}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {supplier.stores?.length || 0} {supplier.stores?.length === 1 ? 'store' : 'stores'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={supplier.isActive ? "default" : "secondary"}>
                        {supplier.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(supplier)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStoreAssignment(supplier)}
                        >
                          <Store className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(supplier)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {StoreCreationModal}
    </div>
  );
};

export default Suppliers;

