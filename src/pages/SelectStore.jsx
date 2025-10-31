import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Store, Check, MapPin, Phone, Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { suppliersAPI, usersAPI } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";

export default function SelectStore() {
  const { toast } = useToast();
  const { user, updateSelectedStore } = useAuth();
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentSelectedStore, setCurrentSelectedStore] = useState(null);

  useEffect(() => {
    loadStores();
    loadCurrentSelectedStore();
  }, []);

  const loadStores = async () => {
    setLoading(true);
    try {
      const response = await suppliersAPI.getStores({ isActive: true });
      setStores(response.data || []);
    } catch (error) {
      console.error("Error loading stores:", error);
      toast({
        title: "Error",
        description: "Failed to load stores",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentSelectedStore = async () => {
    try {
      const response = await usersAPI.getSelectedStore();
      if (response.data?.selectedStore) {
        setCurrentSelectedStore(response.data.selectedStore);
        setSelectedStoreId(response.data.selectedStore._id);
      }
    } catch (error) {
      console.error("Error loading selected store:", error);
    }
  };

  const handleSelectStore = async (storeId) => {
    setSaving(true);
    try {
      const response = await usersAPI.setSelectedStore(storeId);
      
      if (response.status === 'success') {
        setCurrentSelectedStore(response.data.selectedStore);
        
        // Update user context with selectedStore
        updateSelectedStore(response.data.selectedStore);
        
        toast({
          title: "Success",
          description: `Store "${response.data.selectedStore.name}" has been selected`,
        });
        
        // Navigate to dashboard after selection
        setTimeout(() => {
          navigate("/dashboard");
        }, 1000);
      }
    } catch (error) {
      console.error("Error selecting store:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to select store",
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
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="h-9 w-9"
            title="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Select Store</h1>
            <p className="text-muted-foreground">
              Choose the store you want to work with. All your data will be saved against this store.
            </p>
            {currentSelectedStore && (
              <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950 rounded-md">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <Store className="inline h-4 w-4 mr-1" />
                  Currently selected: <strong>{currentSelectedStore.name}</strong>
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {stores.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No stores available</h3>
              <p className="text-muted-foreground">Please contact your administrator to add stores</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stores.map((store) => {
            const isSelected = currentSelectedStore?._id === store._id;
            return (
              <motion.div
                key={store._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Card
                  className={`cursor-pointer transition-all ${
                    isSelected
                      ? "ring-2 ring-primary bg-primary/5"
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => !saving && handleSelectStore(store._id)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <Store className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{store.name}</CardTitle>
                          <Badge variant="outline" className="mt-1">
                            {store.code}
                          </Badge>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="p-1 bg-primary rounded-full">
                          <Check className="h-4 w-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {store.address && (
                        <div className="flex items-start gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>
                            {store.address.street && (
                              <span>{store.address.street}, </span>
                            )}
                            {store.address.city && (
                              <span>{store.address.city}, </span>
                            )}
                            {store.address.state && <span>{store.address.state}</span>}
                            {store.address.zipCode && (
                              <span> - {store.address.zipCode}</span>
                            )}
                            {!store.address.street &&
                              !store.address.city &&
                              !store.address.state &&
                              "Address not provided"}
                          </span>
                        </div>
                      )}
                      {store.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{store.phone}</span>
                        </div>
                      )}
                      {store.email && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span>{store.email}</span>
                        </div>
                      )}
                      <div className="pt-2">
                        <Button
                          variant={isSelected ? "default" : "outline"}
                          className="w-full"
                          disabled={saving}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectStore(store._id);
                          }}
                        >
                          {saving && selectedStoreId === store._id
                            ? "Selecting..."
                            : isSelected
                            ? "Currently Selected"
                            : "Select This Store"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

