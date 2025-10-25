import { motion } from "framer-motion";
import { DollarSign, Package, TrendingUp, Users, AlertCircle } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

const salesData = [
  { name: "Mon", sales: 4000 },
  { name: "Tue", sales: 3000 },
  { name: "Wed", sales: 5000 },
  { name: "Thu", sales: 4500 },
  { name: "Fri", sales: 6000 },
  { name: "Sat", sales: 7000 },
  { name: "Sun", sales: 5500 },
];

const categoryData = [
  { name: "Groceries", value: 4500 },
  { name: "Beverages", value: 3200 },
  { name: "Snacks", value: 2800 },
  { name: "Dairy", value: 2400 },
  { name: "Others", value: 1600 },
];

const COLORS = ["hsl(239 70% 55%)", "hsl(25 95% 55%)", "hsl(142 76% 45%)", "hsl(260 70% 60%)", "hsl(35 95% 60%)"];

const lowStockItems = [
  { name: "Milk", quantity: 12, threshold: 50 },
  { name: "Bread", quantity: 8, threshold: 30 },
  { name: "Eggs", quantity: 15, threshold: 40 },
  { name: "Cheese", quantity: 5, threshold: 25 },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your store overview</p>
        </motion.div>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Sales"
          value="₹45,231"
          icon={DollarSign}
          trend="+12.5% from last week"
          trendUp
          delay={0}
        />
        <MetricCard
          title="Total Items"
          value="1,234"
          icon={Package}
          trend="152 added this month"
          trendUp
          delay={0.1}
        />
        <MetricCard
          title="Daily Revenue"
          value="₹8,452"
          icon={TrendingUp}
          trend="+8.2% from yesterday"
          trendUp
          delay={0.2}
        />
        <MetricCard
          title="Total Customers"
          value="856"
          icon={Users}
          trend="+23 new today"
          trendUp
          delay={0.3}
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sales Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Weekly Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                  />
                  <Bar dataKey="sales" fill="hsl(239 70% 55%)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Category Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Sales by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Low Stock Alert */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      >
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5 animate-pulse-glow" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lowStockItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-destructive/10 border border-destructive/20"
                >
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Current: {item.quantity} units (Threshold: {item.threshold})
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-destructive font-semibold">
                      {Math.round((item.quantity / item.threshold) * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
