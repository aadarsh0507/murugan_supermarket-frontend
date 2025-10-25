import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, Download, TrendingUp, DollarSign, FileText, BarChart3, Users, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
import { billsAPI, usersAPI } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

const COLORS = ['hsl(239 70% 55%)', 'hsl(142 76% 45%)', 'hsl(38 92% 50%)', 'hsl(0 84% 60%)', 'hsl(263 70% 50%)'];

export default function Reports() {
  const { toast } = useToast();
  const { hasRole, user } = useAuth();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [reportType, setReportType] = useState("monthly");
  const [loading, setLoading] = useState(false);
  const [bills, setBills] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("all");
  const [reportData, setReportData] = useState(null);

  const isAdmin = hasRole('admin');
  const isEmployee = hasRole('employee');
  const isCashier = hasRole('cashier');
  const isManager = hasRole('manager');

  useEffect(() => {
    loadUsers();
    loadReportData();
  }, []);

  useEffect(() => {
    loadReportData();
  }, [reportType, dateFrom, dateTo, selectedUserId]);

  const loadUsers = async () => {
    try {
      const response = await usersAPI.getUsers();
      setUsers(response.data.users || []);
    } catch (error) {
      console.error("Error loading users:", error);
    }
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

  const handleExport = (format) => {
    if (!reportData) {
      toast({
        title: "No Data",
        description: "No data available to export",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Exporting Report",
      description: `Your ${format.toUpperCase()} report is being prepared...`,
    });
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
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
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Report Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
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
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {reportData && (
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
                  <CardTitle>Detailed Report</CardTitle>
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

      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading report data...</p>
        </div>
      )}

      {!loading && (!reportData || reportData.tableData.length === 0) && (
        <div className="text-center py-12">
          <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No data available</h3>
          <p className="text-muted-foreground">Try adjusting your filters to see data</p>
        </div>
      )}
    </div>
  );
}
