import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ChevronLeft,
  ChevronRight,
  Archive,
  BarChart3,
  Truck,
  Building2,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Archive, label: "Items", path: "/items" },
  { icon: Truck, label: "Suppliers", path: "/suppliers" },
  { icon: Building2, label: "Stores", path: "/stores" },
  { icon: ShoppingCart, label: "Purchase Orders", path: "/purchase-orders" },
  { icon: Users, label: "Users", path: "/users" },
  { icon: BarChart3, label: "Reports", path: "/reports" },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "relative border-r bg-card transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <nav className="flex flex-col h-full p-3">
        <div className="flex-1 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                  "hover:bg-accent/50",
                  isActive && "bg-primary text-primary-foreground hover:bg-primary/90"
                )
              }
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && (
                <span className="font-medium truncate">{item.label}</span>
              )}
            </NavLink>
          ))}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="mt-auto"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </Button>
      </nav>
    </aside>
  );
}
