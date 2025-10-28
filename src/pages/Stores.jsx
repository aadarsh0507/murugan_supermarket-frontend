import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, Store, MapPin, Phone, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/Modal";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { suppliersAPI } from "@/services/api";

const Stores = () => {
  const { toast } = useToast();
  const [stores, setStores] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState(null);

  const [formData, setFormData] = useState({
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

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    setLoading(true);
    try {
      const response = await suppliersAPI.getStores();
      setStores(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load stores",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredStores = stores.filter((store) =>
    store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (store.address?.city && store.address.city.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddNew = () => {
    setEditingStore(null);
    setFormData({
      name: "",
      code: "",
      address: { street: "", city: "", state: "", zipCode: "" },
      phone: "",
      email: "",
      managerName: "",
      isActive: true
    });
    setIsModalOpen(true);
  };

  const handleEdit = (store) => {
    setEditingStore(store);
    setFormData({
      name: store.name || "",
      code: store.code || "",
      address: store.address || { street: "", city: "", state: "", zipCode: "" },
      phone: store.phone || "",
      email: store.email || "",
      managerName: store.managerName || "",
      isActive: store.isActive !== undefined ? store.isActive : true
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (store) => {
    if (!confirm(`Are you sure you want to delete ${store.name}?`)) return;
    
    try {
      await suppliersAPI.deleteStore(store._id);
      toast({
        title: "Success",
        description: "Store deleted successfully",
      });
      loadStores();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete store",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      // Clean up the data - remove empty strings and undefined values
      const cleanedData = {
        name: formData.name,
        code: formData.code.toUpperCase(),
        isActive: formData.isActive
      };

      // Only add optional fields if they have values
      if (formData.phone && formData.phone.trim()) {
        cleanedData.phone = formData.phone;
      }
      if (formData.email && formData.email.trim()) {
        cleanedData.email = formData.email;
      }
      if (formData.managerName && formData.managerName.trim()) {
        cleanedData.managerName = formData.managerName;
      }

      // Address object
      const address = {};
      if (formData.address.street && formData.address.street.trim()) {
        address.street = formData.address.street;
      }
      if (formData.address.city && formData.address.city.trim()) {
        address.city = formData.address.city;
      }
      if (formData.address.state && formData.address.state.trim()) {
        address.state = formData.address.state;
      }
      if (formData.address.zipCode && formData.address.zipCode.trim()) {
        address.zipCode = formData.address.zipCode;
      }

      // Only add address if it has at least one field
      if (Object.keys(address).length > 0) {
        cleanedData.address = address;
      }

      if (editingStore) {
        await suppliersAPI.updateStore(editingStore._id, cleanedData);
        toast({
          title: "Success",
          description: "Store updated successfully",
        });
      } else {
        await suppliersAPI.createStore(cleanedData);
        toast({
          title: "Success",
          description: "Store created successfully",
        });
      }
      
      setIsModalOpen(false);
      loadStores();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to save store",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading stores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Store Management</h1>
          <p className="text-muted-foreground">
            Manage all your store locations
          </p>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="mr-2 h-4 w-4" />
          Add Store
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by store name, code, or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stores Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Store Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <p className="text-muted-foreground">No stores found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredStores.map((store) => (
                  <TableRow key={store._id}>
                    <TableCell className="font-medium flex items-center gap-2">
                      <Store className="h-4 w-4" />
                      {store.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{store.code}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span>
                          {store.address?.city && store.address?.state
                            ? `${store.address.city}, ${store.address.state}`
                            : store.address?.city || store.address?.state || "N/A"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {store.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            {store.phone}
                          </div>
                        )}
                        {store.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            {store.email}
                          </div>
                        )}
                        {!store.phone && !store.email && <span className="text-muted-foreground text-sm">N/A</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {store.managerName ? (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {store.managerName}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={store.isActive ? "default" : "secondary"}>
                        {store.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(store)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(store)}
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

      {/* Store Modal */}
      <Modal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title={editingStore ? "Edit Store" : "Create New Store"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Store Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="code">Store Code *</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="e.g., STORE001"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Unique code for this store (will be auto-uppercased)
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="managerName">Manager Name</Label>
            <Input
              id="managerName"
              value={formData.managerName}
              onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Address</h4>
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

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : editingStore ? "Update Store" : "Create Store"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Stores;

