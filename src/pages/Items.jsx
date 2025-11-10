import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { itemsAPI, categoriesAPI } from "@/services/api";

const EMPTY_STATE = {
  title: "No items found",
  description: "Adjust your filters or contact an administrator to add inventory.",
};

export default function Items() {
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setErrorMessage(null);
      try {
        const [itemsResponse, categoriesResponse] = await Promise.all([
          itemsAPI.getItems({ limit: 200 }),
          categoriesAPI.getCategories({ limit: 100 }),
        ]);

        const fetchedItems =
          itemsResponse?.data?.items ||
          itemsResponse?.items ||
          itemsResponse?.data ||
          [];
        setItems(fetchedItems);

        const fetchedCategories =
          categoriesResponse?.data?.categories ||
          categoriesResponse?.categories ||
          [];
        setCategories(fetchedCategories);
      } catch (error) {
        console.error("Error loading items:", error);
        const message =
          error.response?.data?.message ||
          error.message ||
          "Failed to load items.";
        setErrorMessage(message);
        toast({
          title: "Unable to load items",
          description: message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [toast]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === "all" ||
        item.categoryId === selectedCategory ||
        item.category?._id === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [items, searchTerm, selectedCategory]);

  const renderItemCard = (item) => {
    const categoryName =
      item.category?.name ||
      categories.find((cat) => cat._id === item.categoryId)?.name ||
      "Uncategorized";

    return (
      <motion.div
        key={item.id || item._id}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <Card className="h-full">
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <CardTitle className="text-base font-semibold">
                  {item.name}
                </CardTitle>
                <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
              </div>
              <Badge variant="secondary" className="shrink-0">
                {categoryName}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Price</span>
              <span className="font-medium">
                ₹{Number(item.price || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Stock</span>
              <span className="font-medium">
                {item.stock ?? item.quantity ?? 0} {item.unit || ""}
              </span>
            </div>
            {item.description && (
              <p className="text-muted-foreground text-xs line-clamp-2">
                {item.description}
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const headerDescription = errorMessage
    ? errorMessage
    : "Browse inventory pulled directly from the API.";

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Inventory</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            {headerDescription}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or SKU…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            onClick={() => setSelectedCategory("all")}
          >
            All Categories
          </Button>
          {categories.map((category) => (
            <Button
              key={category._id}
              variant={selectedCategory === category._id ? "default" : "outline"}
              onClick={() => setSelectedCategory(category._id)}
            >
              {category.name}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Loading items…</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="py-20 text-center space-y-3">
          <Package className="h-12 w-12 mx-auto text-muted-foreground" />
          <h3 className="text-lg font-semibold">{EMPTY_STATE.title}</h3>
          <p className="text-muted-foreground text-sm">
            {EMPTY_STATE.description}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredItems.map((item) => renderItemCard(item))}
        </div>
      )}
    </div>
  );
}

