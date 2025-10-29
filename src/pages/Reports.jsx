import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Calendar, Download, TrendingUp, DollarSign, FileText, BarChart3, Users, Search, Package, Truck, CheckCircle, Clock, XCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { MetricCard } from "@/components/MetricCard";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { billsAPI, usersAPI, purchaseOrdersAPI, suppliersAPI, itemsAPI } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

const COLORS = ['hsl(239 70% 55%)', 'hsl(142 76% 45%)', 'hsl(38 92% 50%)', 'hsl(0 84% 60%)', 'hsl(263 70% 50%)'];

export default function Reports() {
  const { toast } = useToast();
  const { hasRole, user } = useAuth();
  const navigate = useNavigate();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [reportType, setReportType] = useState("monthly");
  const [loading, setLoading] = useState(false);
  const [bills, setBills] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("all");
  const [reportData, setReportData] = useState(null);
  
  // Purchase Order Report States
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState("all");
  const [poReportData, setPoReportData] = useState(null);
  const [poReportType, setPoReportType] = useState("monthly"); // "monthly", "daily", "supplierwise"
  const [activeTab, setActiveTab] = useState("sales"); // "sales" or "purchase"
  // PO sub-tab removed; use poReportType to switch between summary/daily/supplierwise/stock
  const [poViewMode, setPoViewMode] = useState("summary"); // "summary" or "detailed"
  const [stockWithBatches, setStockWithBatches] = useState([]);
  const [stockSearch, setStockSearch] = useState("");
  const [stockLoading, setStockLoading] = useState(false);

  const isAdmin = hasRole('admin');
  const isEmployee = hasRole('employee');
  const isCashier = hasRole('cashier');
  const isManager = hasRole('manager');

  useEffect(() => {
    loadUsers();
    loadSuppliers();
    loadReportData();
    // Load PO data immediately if we're on the purchase tab
    if (activeTab === "purchase") {
      loadPOReportData();
    }
  }, []);

  useEffect(() => {
    loadReportData();
  }, [reportType, dateFrom, dateTo, selectedUserId]);

  useEffect(() => {
    if (activeTab === "purchase") {
      if (poReportType === "stock") {
        loadStockWithBatches();
      } else {
        loadPOReportData();
      }
    }
  }, [dateFrom, dateTo, selectedSupplierId, stockSearch, poReportType]);

  const loadUsers = async () => {
    try {
      const response = await usersAPI.getUsers();
      setUsers(response.data.users || []);
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  const loadSuppliers = async () => {
    try {
      const response = await suppliersAPI.getSuppliers();
      console.log('Suppliers API Response:', response);
      const suppliersData = response.data?.suppliers || [];
      console.log('Suppliers Data:', suppliersData);
      setSuppliers(suppliersData);
    } catch (error) {
      console.error("Error loading suppliers:", error);
    }
  };

  const loadPOReportData = async () => {
    setLoading(true);
    try {
      const params = {
        limit: 1000
      };
      if (dateFrom) params.startDate = dateFrom;
      if (dateTo) params.endDate = dateTo;
      if (selectedSupplierId && selectedSupplierId !== "all") {
        params.supplierId = selectedSupplierId;
      }

      const response = await purchaseOrdersAPI.getPurchaseOrders(params);
      console.log('PO API Response:', response);
      const poData = response.data?.purchaseOrders || [];
      console.log('PO Data:', poData);
      setPurchaseOrders(poData);
      
      const processedData = processPOReportData(poData, poReportType);
      setPoReportData(processedData);
    } catch (error) {
      console.error("Error loading PO report data:", error);
      toast({
        title: "Error",
        description: "Failed to load purchase order data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStockWithBatches = async () => {
    setStockLoading(true);
    try {
      const params = {};
      if (stockSearch) {
        params.search = stockSearch;
      }

      const response = await itemsAPI.getStockWithBatches(params);
      const stockData = response.data || [];
      setStockWithBatches(stockData);
    } catch (error) {
      console.error("Error loading stock with batches:", error);
      toast({
        title: "Error",
        description: "Failed to load stock with batch data",
        variant: "destructive",
      });
    } finally {
      setStockLoading(false);
    }
  };

  const processPOReportData = (pos, type = "monthly") => {
    if (!pos || pos.length === 0) {
      return {
        summary: {
          totalPOs: 0,
          totalValue: 0,
          totalItems: 0,
          averagePOValue: 0,
          pendingPOs: 0,
          completedPOs: 0,
          cancelledPOs: 0
        },
        chartData: [],
        tableData: [],
        supplierData: []
      };
    }

    // Process by status
    const statusData = pos.reduce((acc, po) => {
      if (!acc[po.status]) {
        acc[po.status] = { count: 0, value: 0, items: 0 };
      }
      acc[po.status].count += 1;
      acc[po.status].value += po.total || 0;
      acc[po.status].items += po.totalQuantity || 0;
      return acc;
    }, {});

    // Process by supplier
    const supplierData = pos.reduce((acc, po) => {
      const supplierName = po.supplier?.companyName || 'Unknown';
      if (!acc[supplierName]) {
        acc[supplierName] = { supplier: supplierName, pos: 0, value: 0, items: 0 };
      }
      acc[supplierName].pos += 1;
      acc[supplierName].value += po.total || 0;
      acc[supplierName].items += po.totalQuantity || 0;
      return acc;
    }, {});

    let chartData = [];
    let tableData = [];

    if (type === "monthly") {
      // Process by month
      const monthlyData = pos.reduce((acc, po) => {
        const date = new Date(po.orderDate);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        
        if (!acc[monthKey]) {
          acc[monthKey] = { month: monthName, pos: 0, value: 0, items: 0 };
        }
        
        acc[monthKey].pos += 1;
        acc[monthKey].value += po.total || 0;
        acc[monthKey].items += po.totalQuantity || 0;
        
        return acc;
      }, {});

      chartData = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
      tableData = Object.values(monthlyData).sort((a, b) => b.value - a.value);
    } else if (type === "daily") {
      // Process by day
      const dailyData = pos.reduce((acc, po) => {
        const date = new Date(po.orderDate);
        const dayKey = date.toISOString().split('T')[0];
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        
        if (!acc[dayKey]) {
          acc[dayKey] = { day: dayName, pos: 0, value: 0, items: 0 };
        }
        
        acc[dayKey].pos += 1;
        acc[dayKey].value += po.total || 0;
        acc[dayKey].items += po.totalQuantity || 0;
        
        return acc;
      }, {});

      chartData = Object.values(dailyData).sort((a, b) => a.day.localeCompare(b.day)).slice(-30);
      tableData = Object.values(dailyData).sort((a, b) => b.value - a.value).slice(0, 20);
    } else if (type === "supplierwise") {
      // Use supplier data for charts
      chartData = Object.values(supplierData).sort((a, b) => b.value - a.value);
      tableData = Object.values(supplierData).sort((a, b) => b.value - a.value);
    }

    const totalValue = pos.reduce((sum, po) => sum + (po.total || 0), 0);
    const totalItems = pos.reduce((sum, po) => sum + (po.totalQuantity || 0), 0);
    const averagePOValue = pos.length > 0 ? totalValue / pos.length : 0;

    return {
      summary: {
        totalPOs: pos.length,
        totalValue: totalValue.toFixed(2),
        totalItems,
        averagePOValue: averagePOValue.toFixed(2),
        pendingPOs: statusData.pending?.count || 0,
        completedPOs: statusData.completed?.count || 0,
        cancelledPOs: statusData.cancelled?.count || 0
      },
      chartData,
      tableData,
      supplierData: Object.values(supplierData).sort((a, b) => b.value - a.value),
      rawData: pos.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
    };
  };

  const loadReportData = async () => {
    setLoading(true);
    try {
      const params = {
        limit: 1000  // Get more bills for comprehensive reports
      };
      if (dateFrom) params.startDate = dateFrom;
      if (dateTo) params.endDate = dateTo;
      
      // For employee and cashier roles, only show their own bills
      if (isEmployee || isCashier) {
        params.createdBy = user.id;
      } else if (selectedUserId && selectedUserId !== "all") {
        params.createdBy = selectedUserId;
      }

      const response = await billsAPI.getBills(params);
      const billsData = response.data || [];
      setBills(billsData);
      
      const processedData = processReportData(billsData, reportType);
      setReportData(processedData);
    } catch (error) {
      console.error("Error loading report data:", error);
      toast({
        title: "Error",
        description: "Failed to load report data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const processReportData = (bills, type) => {
    if (!bills || bills.length === 0) {
      return {
        summary: {
          totalRevenue: 0,
          totalBills: 0,
          totalItems: 0,
          averageBill: 0,
        },
        chartData: [],
        tableData: [],
      };
    }

    let chartData = [];
    let tableData = [];

    if (type === "monthly") {
      const monthlyData = bills.reduce((acc, bill) => {
        const date = new Date(bill.createdAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        
        if (!acc[monthKey]) {
          acc[monthKey] = { month: monthName, revenue: 0, bills: 0, items: 0 };
        }
        
        acc[monthKey].revenue += bill.totalAmount || 0;
        acc[monthKey].bills += 1;
        acc[monthKey].items += bill.totalQuantity || 0;
        
        return acc;
      }, {});

      chartData = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
      tableData = Object.values(monthlyData).sort((a, b) => b.revenue - a.revenue);
    } else if (type === "daily") {
      const dailyData = bills.reduce((acc, bill) => {
        const date = new Date(bill.createdAt);
        const dayKey = date.toISOString().split('T')[0];
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        
        if (!acc[dayKey]) {
          acc[dayKey] = { day: dayName, revenue: 0, bills: 0, items: 0 };
        }
        
        acc[dayKey].revenue += bill.totalAmount || 0;
        acc[dayKey].bills += 1;
        acc[dayKey].items += bill.totalQuantity || 0;
        
        return acc;
      }, {});

      chartData = Object.values(dailyData).sort((a, b) => a.day.localeCompare(b.day)).slice(-30);
      tableData = Object.values(dailyData).sort((a, b) => b.revenue - a.revenue).slice(0, 20);
    } else if (type === "userwise") {
      const userData = bills.reduce((acc, bill) => {
        const userName = bill.billBy || "Unknown";
        const userEmail = bill.createdBy?.email || "";
        
        if (!acc[userName]) {
          acc[userName] = { user: userName, email: userEmail, revenue: 0, bills: 0, items: 0 };
        }
        
        acc[userName].revenue += bill.totalAmount || 0;
        acc[userName].bills += 1;
        acc[userName].items += bill.totalQuantity || 0;
        
        return acc;
      }, {});

      chartData = Object.values(userData).sort((a, b) => b.revenue - a.revenue);
      tableData = Object.values(userData).sort((a, b) => b.revenue - a.revenue);
    }

    const totalRevenue = bills.reduce((sum, bill) => sum + (bill.totalAmount || 0), 0);
    const totalBills = bills.length;
    const totalItems = bills.reduce((sum, bill) => sum + (bill.totalQuantity || 0), 0);
    const averageBill = totalBills > 0 ? totalRevenue / totalBills : 0;

    return {
      summary: {
        totalRevenue: totalRevenue.toFixed(2),
        totalBills,
        totalItems,
        averageBill: averageBill.toFixed(2),
      },
      chartData,
      tableData,
    };
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'Pending', variant: 'secondary', icon: Clock },
      partially_received: { label: 'Partially Received', variant: 'default', icon: Package },
      completed: { label: 'Completed', variant: 'default', icon: CheckCircle },
      cancelled: { label: 'Cancelled', variant: 'destructive', icon: XCircle }
    };
    
    const config = statusConfig[status] || { label: status, variant: 'secondary', icon: Clock };
    const IconComponent = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const handleExport = (format) => {
    const currentData = activeTab === "sales" ? reportData : poReportData;
    if (!currentData) {
      toast({
        title: "No Data",
        description: "No data available to export",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Exporting Report",
      description: `Your ${format.toUpperCase()} ${activeTab} report is being prepared...`,
    });
  };

  console.log('Current active tab:', activeTab);
  console.log('PO Report Data:', poReportData);
  console.log('Suppliers:', suppliers);

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
          <h1 className="text-2xl md:text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            {isEmployee || isCashier 
              ? `Your personal reports and analytics` 
              : "Comprehensive business insights"
            }
          </p>
          {(isEmployee || isCashier) && (
            <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950 rounded-md">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <Users className="inline h-4 w-4 mr-1" />
                Showing only your bills and transactions
              </p>
            </div>
          )}
          </div>
        </motion.div>
      </div>

      {/* Report Type Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex space-x-1 bg-muted p-1 rounded-lg w-fit"
      >
        <Button
          variant={activeTab === "sales" ? "default" : "ghost"}
          onClick={() => {
            setActiveTab("sales");
            console.log('Switched to sales tab');
          }}
          className="flex items-center gap-2"
        >
          <DollarSign className="h-4 w-4" />
          Sales Reports
        </Button>
        <Button
          variant={activeTab === "purchase" ? "default" : "ghost"}
          onClick={() => {
            setActiveTab("purchase");
            console.log('Switched to purchase tab');
          }}
          className="flex items-center gap-2"
        >
          <Truck className="h-4 w-4" />
          Purchase Orders
        </Button>
      </motion.div>

      {(activeTab === "sales" || (activeTab === "purchase" && poReportType !== "stock")) && (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
                {activeTab === "sales" ? "Sales Report Filters" : "Purchase Order Filters"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`grid gap-4 ${activeTab === "sales" ? "md:grid-cols-4" : "md:grid-cols-4"}`}>
              {activeTab === "sales" ? (
                <>
              <div className="space-y-2">
                <Label htmlFor="reportType">Report Type</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger id="reportType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly Report</SelectItem>
                    <SelectItem value="daily">Daily Report</SelectItem>
                    <SelectItem value="userwise">User-wise Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dateFrom">From Date</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dateTo">To Date</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
              
              {reportType === "userwise" && (isAdmin || isManager) ? (
                <div className="space-y-2">
                  <Label htmlFor="user">User</Label>
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger id="user">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user._id} value={user._id}>
                          {user.fullName || `${user.firstName} ${user.lastName}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Export</Label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleExport("pdf")}
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleExport("csv")}
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      CSV
                    </Button>
                  </div>
                </div>
                  )}
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="poReportType">Report Type</Label>
                    <Select value={poReportType} onValueChange={setPoReportType}>
                      <SelectTrigger id="poReportType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly Report</SelectItem>
                        <SelectItem value="daily">Daily Report</SelectItem>
                        <SelectItem value="supplierwise">Supplier-wise Report</SelectItem>
                        <SelectItem value="stock">Stock with Batches</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="poViewMode">View</Label>
                    <Select value={poViewMode} onValueChange={setPoViewMode}>
                      <SelectTrigger id="poViewMode">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="summary">Summary</SelectItem>
                        <SelectItem value="detailed">Detailed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="poDateFrom">From Date</Label>
                    <Input
                      id="poDateFrom"
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="poDateTo">To Date</Label>
                    <Input
                      id="poDateTo"
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="supplier">Supplier</Label>
                    <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                      <SelectTrigger id="supplier">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Suppliers</SelectItem>
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier._id} value={supplier._id}>
                            {supplier.companyName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
      )}

      {/* No sub-tabs needed; handled by report type selector */}

      {/* Sales Reports */}
      {activeTab === "sales" && reportData && (
        <>
          <div className="grid md:grid-cols-4 gap-4 md:gap-6">
            <MetricCard
              title="Total Revenue"
              value={`₹${reportData.summary.totalRevenue}`}
              icon={DollarSign}
              delay={0.1}
            />
            <MetricCard
              title="Total Bills"
              value={reportData.summary.totalBills}
              icon={FileText}
              delay={0.2}
            />
            <MetricCard
              title="Total Items Sold"
              value={reportData.summary.totalItems}
              icon={BarChart3}
              delay={0.3}
            />
            <MetricCard
              title="Average Bill"
              value={`₹${reportData.summary.averageBill}`}
              icon={TrendingUp}
              delay={0.4}
            />
          </div>

          {reportData.chartData.length > 0 && (
            <div className="grid lg:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {reportType === "monthly" && "Monthly Revenue"}
                      {reportType === "daily" && "Daily Revenue"}
                      {reportType === "userwise" && "User-wise Revenue"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      {reportType === "userwise" ? (
                        <PieChart>
                          <Pie
                            data={reportData.chartData}
                            dataKey="revenue"
                            nameKey="user"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            label
                          >
                            {reportData.chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      ) : (
                        <BarChart data={reportData.chartData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis 
                            dataKey={reportType === "monthly" ? "month" : "day"} 
                            className="text-xs"
                            angle={reportType === "daily" ? -45 : 0}
                            textAnchor={reportType === "daily" ? "end" : "middle"}
                          />
                          <YAxis className="text-xs" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "var(--radius)",
                            }}
                          />
                          <Bar dataKey="revenue" fill="hsl(239 70% 55%)" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {reportType === "monthly" && "Monthly Bills Trend"}
                      {reportType === "daily" && "Daily Bills Trend"}
                      {reportType === "userwise" && "User-wise Bills"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      {reportType === "userwise" ? (
                        <BarChart data={reportData.chartData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis 
                            dataKey="user" 
                            className="text-xs"
                            angle={-45}
                            textAnchor="end"
                          />
                          <YAxis className="text-xs" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "var(--radius)",
                            }}
                          />
                          <Bar dataKey="bills" fill="hsl(142 76% 45%)" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      ) : (
                        <LineChart data={reportData.chartData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis 
                            dataKey={reportType === "monthly" ? "month" : "day"} 
                            className="text-xs"
                            angle={reportType === "daily" ? -45 : 0}
                            textAnchor={reportType === "daily" ? "end" : "middle"}
                          />
                          <YAxis className="text-xs" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "var(--radius)",
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="bills"
                            stroke="hsl(142 76% 45%)"
                            strokeWidth={2}
                          />
                        </LineChart>
                      )}
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          )}

          {reportData.tableData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Sales Report</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>
                            {reportType === "monthly" && "Month"}
                            {reportType === "daily" && "Date"}
                            {reportType === "userwise" && "User"}
                          </TableHead>
                          {reportType === "userwise" && <TableHead>Email</TableHead>}
                          <TableHead className="text-right">Revenue (₹)</TableHead>
                          <TableHead className="text-right">Bills</TableHead>
                          <TableHead className="text-right">Items</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.tableData.map((row, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">
                              {reportType === "monthly" && row.month}
                              {reportType === "daily" && row.day}
                              {reportType === "userwise" && row.user}
                            </TableCell>
                            {reportType === "userwise" && <TableCell className="text-muted-foreground">{row.email || "N/A"}</TableCell>}
                            <TableCell className="text-right">₹{row.revenue.toFixed(2)}</TableCell>
                            <TableCell className="text-right">{row.bills}</TableCell>
                            <TableCell className="text-right">{row.items}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </>
      )}

      {/* Purchase Order Reports */}
      {activeTab === "purchase" && poReportType !== "stock" && poReportData && (
        <>
          {poViewMode === "summary" && (
          <div className="grid md:grid-cols-4 gap-4 md:gap-6">
            <MetricCard
              title="Total POs"
              value={poReportData.summary.totalPOs}
              icon={FileText}
              delay={0.1}
            />
            <MetricCard
              title="Total Value"
              value={`₹${poReportData.summary.totalValue}`}
              icon={DollarSign}
              delay={0.2}
            />
            <MetricCard
              title="Total Items"
              value={poReportData.summary.totalItems}
              icon={Package}
              delay={0.3}
            />
            <MetricCard
              title="Average PO Value"
              value={`₹${poReportData.summary.averagePOValue}`}
              icon={TrendingUp}
              delay={0.4}
            />
          </div>
          )}

          {poViewMode === "summary" && (
          <div className="grid md:grid-cols-3 gap-4 md:gap-6">
            <MetricCard
              title="Pending POs"
              value={poReportData.summary.pendingPOs}
              icon={Clock}
              delay={0.5}
            />
            <MetricCard
              title="Completed POs"
              value={poReportData.summary.completedPOs}
              icon={CheckCircle}
              delay={0.6}
            />
            <MetricCard
              title="Cancelled POs"
              value={poReportData.summary.cancelledPOs}
              icon={XCircle}
              delay={0.7}
            />
          </div>
          )}

          {poViewMode === "summary" && poReportData.chartData.length > 0 && (
            <div className="grid lg:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {poReportType === "monthly" && "Monthly Purchase Orders"}
                      {poReportType === "daily" && "Daily Purchase Orders"}
                      {poReportType === "supplierwise" && "Supplier-wise Purchase Orders"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      {poReportType === "supplierwise" ? (
                        <BarChart data={poReportData.chartData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis 
                            dataKey="supplier" 
                            className="text-xs"
                            angle={-45}
                            textAnchor="end"
                          />
                          <YAxis className="text-xs" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "var(--radius)",
                            }}
                          />
                          <Bar dataKey="value" fill="hsl(239 70% 55%)" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      ) : (
                        <BarChart data={poReportData.chartData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis 
                            dataKey={poReportType === "monthly" ? "month" : "day"}
                            className="text-xs"
                            angle={poReportType === "daily" ? -45 : 0}
                            textAnchor={poReportType === "daily" ? "end" : "middle"}
                          />
                          <YAxis className="text-xs" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "var(--radius)",
                            }}
                          />
                          <Bar dataKey="value" fill="hsl(239 70% 55%)" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Supplier-wise Purchase Orders</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={poReportData.supplierData}
                          dataKey="value"
                          nameKey="supplier"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label
                        >
                          {poReportData.supplierData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          )}

          {poViewMode === "summary" && poReportData.tableData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>
                    {poReportType === "monthly" && "Monthly Purchase Order Summary"}
                    {poReportType === "daily" && "Daily Purchase Order Summary"}
                    {poReportType === "supplierwise" && "Supplier-wise Purchase Order Summary"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {poReportType === "monthly" && <TableHead>Month</TableHead>}
                          {poReportType === "daily" && <TableHead>Date</TableHead>}
                          {poReportType === "supplierwise" && <TableHead>Supplier</TableHead>}
                          <TableHead className="text-right">POs</TableHead>
                          <TableHead className="text-right">Total Value (₹)</TableHead>
                          <TableHead className="text-right">Items</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {poReportData.tableData.map((row, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">
                              {poReportType === "monthly" && row.month}
                              {poReportType === "daily" && row.day}
                              {poReportType === "supplierwise" && row.supplier}
                            </TableCell>
                            <TableCell className="text-right">{row.pos || 0}</TableCell>
                            <TableCell className="text-right">₹{(row.value || 0).toFixed(2)}</TableCell>
                            <TableCell className="text-right">{row.items || 0}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
              
              {/* Detailed PO Table (only when detailed view) */}
              {poViewMode === "detailed" && poReportData.rawData && poReportData.rawData.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.05 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>Detailed Purchase Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>PO Number</TableHead>
                              <TableHead>Supplier</TableHead>
                              <TableHead>Order Date</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Items</TableHead>
                              <TableHead className="text-right">Total Value (₹)</TableHead>
                              <TableHead>Created By</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {poReportData.rawData.map((po, index) => (
                              <TableRow key={po._id || index}>
                                <TableCell className="font-medium">{po.poNumber}</TableCell>
                                <TableCell>{po.supplier?.companyName || 'Unknown'}</TableCell>
                                <TableCell>{new Date(po.orderDate).toLocaleDateString()}</TableCell>
                                <TableCell>{getStatusBadge(po.status)}</TableCell>
                                <TableCell className="text-right">{po.totalQuantity || 0}</TableCell>
                                <TableCell className="text-right">₹{(po.total || 0).toFixed(2)}</TableCell>
                                <TableCell>{po.createdBy?.firstName ? `${po.createdBy.firstName} ${po.createdBy.lastName}` : 'Unknown'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </motion.div>
          )}
          {poViewMode === "detailed" && poReportData.rawData && poReportData.rawData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Purchase Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>PO Number</TableHead>
                          <TableHead>Supplier</TableHead>
                          <TableHead>Order Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Items</TableHead>
                          <TableHead className="text-right">Total Value (₹)</TableHead>
                          <TableHead>Created By</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {poReportData.rawData.map((po, index) => (
                          <TableRow key={po._id || index}>
                            <TableCell className="font-medium">{po.poNumber}</TableCell>
                            <TableCell>{po.supplier?.companyName || 'Unknown'}</TableCell>
                            <TableCell>{new Date(po.orderDate).toLocaleDateString()}</TableCell>
                            <TableCell>{getStatusBadge(po.status)}</TableCell>
                            <TableCell className="text-right">{po.totalQuantity || 0}</TableCell>
                            <TableCell className="text-right">₹{(po.total || 0).toFixed(2)}</TableCell>
                            <TableCell>{po.createdBy?.firstName ? `${po.createdBy.firstName} ${po.createdBy.lastName}` : 'Unknown'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </>
      )}

      {/* Stock with Batch Numbers Report */}
      {activeTab === "purchase" && poReportType === "stock" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Stock with Batch Numbers
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Search by item name or SKU..."
                      value={stockSearch}
                      onChange={(e) => setStockSearch(e.target.value)}
                      className="w-64"
                    />
                    <Search className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {stockLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-600 mt-2">Loading stock data...</p>
                  </div>
                ) : stockWithBatches.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item Name</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Subcategory</TableHead>
                          <TableHead>Batch Number</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead>PO Number</TableHead>
                          <TableHead>Purchase Date</TableHead>
                          <TableHead className="text-right">Cost Price (₹)</TableHead>
                          <TableHead>HSN Number</TableHead>
                          <TableHead>Expiry Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stockWithBatches.map((stock, index) => (
                          <TableRow key={`${stock.sku}-${stock.batchNumber}-${index}`}>
                            <TableCell className="font-medium">{stock.itemName}</TableCell>
                            <TableCell>{stock.sku}</TableCell>
                            <TableCell>{stock.categoryName}</TableCell>
                            <TableCell>{stock.subcategoryName}</TableCell>
                            <TableCell>{stock.batchNumber}</TableCell>
                            <TableCell className="text-right">{stock.batchQuantity}</TableCell>
                            <TableCell>{stock.purchaseOrderNumber}</TableCell>
                            <TableCell>
                              {stock.purchaseDate 
                                ? new Date(stock.purchaseDate).toLocaleDateString()
                                : 'N/A'}
                            </TableCell>
                            <TableCell className="text-right">₹{stock.costPrice.toFixed(2)}</TableCell>
                            <TableCell>{stock.hsnNumber}</TableCell>
                            <TableCell>
                              {stock.expiryDate 
                                ? new Date(stock.expiryDate).toLocaleDateString()
                                : 'N/A'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No stock data available</h3>
                    <p className="text-muted-foreground">Try adjusting your search to see data</p>
        </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
      )}

      {loading && activeTab === "sales" && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading sales data...</p>
        </div>
      )}
      {loading && activeTab === "purchase" && poReportType !== "stock" && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading purchase order data...</p>
        </div>
      )}

      {!loading && activeTab === "sales" && (!reportData || reportData.tableData.length === 0) && (
        <div className="text-center py-12">
          <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No sales data available</h3>
          <p className="text-muted-foreground">Try adjusting your filters to see data</p>
        </div>
      )}

      {!loading && activeTab === "purchase" && poReportType !== "stock" && (!poReportData || poReportData.tableData.length === 0) && (
        <div className="text-center py-12">
          <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No purchase order data available</h3>
          <p className="text-muted-foreground">Try adjusting your filters to see data</p>
        </div>
      )}
    </div>
  );
}
