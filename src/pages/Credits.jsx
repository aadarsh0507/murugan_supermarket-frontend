import { useState, useEffect } from "react";
import { CreditCard, Search, Edit, Trash2, Calendar, Building2, FileText, Plus, Save } from "lucide-react";
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
import { creditsAPI, suppliersAPI, customerCreditsAPI } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";

const Credits = () => {
  const { toast } = useToast();
  const { selectedStore } = useAuth();
  const [credits, setCredits] = useState([]);
  const [customerCredits, setCustomerCredits] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [creditTypeFilter, setCreditTypeFilter] = useState("po"); // "po" or "billing"
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [editAmountDialogOpen, setEditAmountDialogOpen] = useState(false);
  const [selectedCredit, setSelectedCredit] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [newOriginalAmount, setNewOriginalAmount] = useState("");
  const [amountChangeNotes, setAmountChangeNotes] = useState("");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20
  });

  useEffect(() => {
    if (selectedStore?._id) {
      loadSuppliers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStore]);

  useEffect(() => {
    if (selectedStore?._id) {
      setPagination(prev => ({ ...prev, currentPage: 1 }));
      if (creditTypeFilter === "po") {
        loadCredits();
      } else {
        loadCustomerCredits();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStore, searchTerm, statusFilter, supplierFilter, creditTypeFilter]);

  useEffect(() => {
    if (selectedStore?._id) {
      if (creditTypeFilter === "po") {
        loadCredits();
      } else {
        loadCustomerCredits();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.currentPage]);

  const loadSuppliers = async () => {
    try {
      const response = await suppliersAPI.getSuppliers({ limit: 100 });
      const suppliersData = response.data?.suppliers || response.data || [];
      // Ensure it's always an array and filter invalid entries
      setSuppliers(Array.isArray(suppliersData) ? suppliersData.filter(s => s && s._id) : []);
    } catch (error) {
      console.error("Error loading suppliers:", error);
      setSuppliers([]); // Set empty array on error
    }
  };

  const loadCredits = async () => {
    if (!selectedStore?._id) return;

    setLoading(true);
    try {
      const params = {
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter }),
        ...(supplierFilter && { supplierId: supplierFilter })
      };

      const response = await creditsAPI.getCredits(params);
      setCredits(response.data.credits || []);
      setPagination(response.data.pagination || pagination);
    } catch (error) {
      console.error("Error loading credits:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to load credits",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCustomerCredits = async () => {
    if (!selectedStore?._id) return;

    setLoading(true);
    try {
      const params = {
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter })
      };

      const response = await customerCreditsAPI.getCustomerCredits(params);
      setCustomerCredits(response.data.credits || []);
      setPagination(response.data.pagination || pagination);
    } catch (error) {
      console.error("Error loading customer credits:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to load customer credits",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentClick = (credit) => {
    setSelectedCredit(credit);
    setPaymentAmount("");
    setPaymentNotes("");
    setPaymentDialogOpen(true);
  };

  const handlePaymentSubmit = async () => {
    if (!selectedCredit) return;

    const amount = Math.round(parseFloat(paymentAmount) || 0);
    if (!amount || amount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid payment amount",
        variant: "destructive",
      });
      return;
    }

    const roundedBalance = Math.round(selectedCredit.balanceAmount || 0);
    if (amount > roundedBalance) {
      toast({
        title: "Error",
        description: `Payment amount cannot exceed balance amount of ₹${roundedBalance}`,
        variant: "destructive",
      });
      return;
    }

    try {
      if (creditTypeFilter === "po") {
        await creditsAPI.updateCreditPayment(selectedCredit._id, amount, paymentNotes);
      } else {
        await customerCreditsAPI.updateCustomerCreditPayment(selectedCredit._id, amount, paymentNotes);
      }
      toast({
        title: "Success",
        description: "Payment recorded successfully",
      });
      setPaymentDialogOpen(false);
      setSelectedCredit(null);
      if (creditTypeFilter === "po") {
        loadCredits();
      } else {
        loadCustomerCredits();
      }
    } catch (error) {
      console.error("Error updating credit payment:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update payment",
        variant: "destructive",
      });
    }
  };

  const handleEditAmountClick = (credit) => {
    setSelectedCredit(credit);
    setNewOriginalAmount(credit.originalAmount?.toString() || "");
    setAmountChangeNotes("");
    setEditAmountDialogOpen(true);
  };

  const handleAmountUpdate = async () => {
    if (!selectedCredit) return;

    const newAmount = parseFloat(newOriginalAmount);
    if (!newAmount || newAmount < 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    if (newAmount === selectedCredit.originalAmount) {
      toast({
        title: "No Change",
        description: "New amount is the same as current amount",
        variant: "destructive",
      });
      return;
    }

    try {
      if (creditTypeFilter === "po") {
        await creditsAPI.updateCreditAmount(selectedCredit._id, newAmount, amountChangeNotes);
      } else {
        await customerCreditsAPI.updateCustomerCreditAmount(selectedCredit._id, newAmount, amountChangeNotes);
      }
      toast({
        title: "Success",
        description: "Credit amount updated successfully",
      });
      setEditAmountDialogOpen(false);
      setSelectedCredit(null);
      setNewOriginalAmount("");
      setAmountChangeNotes("");
      if (creditTypeFilter === "po") {
        loadCredits();
      } else {
        loadCustomerCredits();
      }
    } catch (error) {
      console.error("Error updating credit amount:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update amount",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCredit = async (creditId) => {
    if (!confirm("Are you sure you want to delete this credit? This action cannot be undone.")) {
      return;
    }

    try {
      await creditsAPI.deleteCredit(creditId);
      toast({
        title: "Success",
        description: "Credit deleted successfully",
      });
      loadCredits();
    } catch (error) {
      console.error("Error deleting credit:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete credit",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { variant: "destructive", label: "Pending" },
      partially_paid: { variant: "default", label: "Partially Paid" },
      paid: { variant: "secondary", label: "Paid" }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading && credits.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading credits...</p>
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
            <CardTitle className="text-2xl text-blue-600 flex items-center gap-2">
              <CreditCard className="h-6 w-6" />
              SUPPLIER CREDITS
            </CardTitle>
          </div>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-5 gap-4">
            <div>
              <Label>Credit Type</Label>
              <Select 
                value={creditTypeFilter} 
                onValueChange={setCreditTypeFilter}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="po">PO Credit</SelectItem>
                  <SelectItem value="billing">Billing Credit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={creditTypeFilter === "po" ? "Search by PO number..." : "Search by customer name or bill number..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <Select 
                value={statusFilter || "all"} 
                onValueChange={(value) => setStatusFilter(value === "all" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="partially_paid">Partially Paid</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {creditTypeFilter === "po" && (
              <div>
                <Label>Supplier</Label>
                <Select 
                  value={supplierFilter || "all"} 
                  onValueChange={(value) => setSupplierFilter(value === "all" ? "" : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Suppliers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Suppliers</SelectItem>
                    {Array.isArray(suppliers) && suppliers.length > 0 
                      ? suppliers
                          .filter(supplier => {
                            if (!supplier || !supplier._id || !supplier.companyName) return false;
                            const id = String(supplier._id).trim();
                            const name = String(supplier.companyName).trim();
                            return id !== "" && name !== "";
                          })
                          .map((supplier) => {
                            const supplierId = String(supplier._id).trim();
                            const companyName = String(supplier.companyName).trim();
                            return (
                              <SelectItem key={supplierId} value={supplierId}>
                                {companyName}
                              </SelectItem>
                            );
                          })
                      : null}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setSupplierFilter("all");
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Credits Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {creditTypeFilter === "po" ? (
                    <>
                      <TableHead>PO Number</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Order Date</TableHead>
                    </>
                  ) : (
                    <>
                      <TableHead>Bill Number</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Bill Date</TableHead>
                    </>
                  )}
                  <TableHead>Initial Amount</TableHead>
                  <TableHead>Current Amount</TableHead>
                  <TableHead>Paid Amount</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (creditTypeFilter === "po" ? credits : customerCredits).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No credits found
                    </TableCell>
                  </TableRow>
                ) : (
                  (creditTypeFilter === "po" ? credits : customerCredits).map((credit) => (
                    <TableRow key={credit._id}>
                      {creditTypeFilter === "po" ? (
                        <>
                          <TableCell className="font-medium">
                            {credit.poNumber || credit.purchaseOrder?.poNumber}
                          </TableCell>
                          <TableCell>
                            {credit.supplier?.companyName || "N/A"}
                          </TableCell>
                          <TableCell>
                            {credit.orderDate
                              ? format(new Date(credit.orderDate), "dd-MM-yyyy")
                              : "N/A"}
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell className="font-medium">
                            {credit.billNumber || "N/A"}
                          </TableCell>
                          <TableCell>
                            {credit.customerName || "N/A"}
                          </TableCell>
                          <TableCell>
                            {credit.billDate
                              ? format(new Date(credit.billDate), "dd-MM-yyyy")
                              : "N/A"}
                          </TableCell>
                        </>
                      )}
                      <TableCell className="font-medium">
                        ₹{Math.round(credit.initialOriginalAmount || credit.originalAmount || 0)}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-1">
                          ₹{Math.round(credit.originalAmount || 0)}
                          {credit.initialOriginalAmount && credit.initialOriginalAmount !== credit.originalAmount && (
                            <Edit className="h-3 w-3 text-muted-foreground cursor-pointer" 
                                  onClick={() => handleEditAmountClick(credit)}
                                  title="Amount has been modified" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        ₹{Math.round(credit.paidAmount || 0)}
                      </TableCell>
                      <TableCell className="font-semibold text-blue-600">
                        ₹{Math.round(credit.balanceAmount || 0)}
                      </TableCell>
                      <TableCell>{getStatusBadge(credit.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditAmountClick(credit)}
                            title="Edit Original Amount"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handlePaymentClick(credit)}
                            disabled={credit.status === "paid"}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            Payment
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{" "}
                {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{" "}
                {pagination.totalItems} credits
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }));
                  }}
                  disabled={pagination.currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }));
                  }}
                  disabled={pagination.currentPage === pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Payment</DialogTitle>
          </DialogHeader>
          {selectedCredit && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                {creditTypeFilter === "po" ? (
                  <>
                    <div>
                      <Label className="text-xs text-muted-foreground">PO Number</Label>
                      <p className="font-medium">{selectedCredit.poNumber || selectedCredit.purchaseOrder?.poNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Supplier</Label>
                      <p className="font-medium">{selectedCredit.supplier?.companyName || 'N/A'}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <Label className="text-xs text-muted-foreground">Bill Number</Label>
                      <p className="font-medium">{selectedCredit.billNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Customer</Label>
                      <p className="font-medium">{selectedCredit.customerName || 'N/A'}</p>
                    </div>
                  </>
                )}
                <div>
                  <Label className="text-xs text-muted-foreground">Balance Amount</Label>
                  <p className="font-medium text-blue-600">
                    ₹{Math.round(selectedCredit.balanceAmount || 0)}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Original Amount</Label>
                  <p className="font-medium">₹{Math.round(selectedCredit.originalAmount || 0)}</p>
                </div>
              </div>

              <div>
                <Label htmlFor="paymentAmount">Payment Amount *</Label>
                <Input
                  id="paymentAmount"
                  type="number"
                  step="1"
                  min="1"
                  max={Math.round(selectedCredit.balanceAmount || 0)}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter payment amount"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Maximum: ₹{Math.round(selectedCredit.balanceAmount || 0)}
                </p>
              </div>

              <div>
                <Label htmlFor="paymentNotes">Notes (Optional)</Label>
                <Textarea
                  id="paymentNotes"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Add payment notes..."
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePaymentSubmit}>
              <Plus className="h-4 w-4 mr-1" />
              Add Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Amount Dialog */}
      <Dialog open={editAmountDialogOpen} onOpenChange={setEditAmountDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Original Amount</DialogTitle>
          </DialogHeader>
          {selectedCredit && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <Label className="text-xs text-muted-foreground">PO Number</Label>
                  <p className="font-medium">{selectedCredit.poNumber}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Supplier</Label>
                  <p className="font-medium">{selectedCredit.supplier?.companyName}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Initial Amount</Label>
                  <p className="font-medium">
                    ₹{Math.round(selectedCredit.initialOriginalAmount || selectedCredit.originalAmount || 0)}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Current Amount</Label>
                  <p className="font-medium text-blue-600">
                    ₹{Math.round(selectedCredit.originalAmount || 0)}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Paid Amount</Label>
                  <p className="font-medium">₹{Math.round(selectedCredit.paidAmount || 0)}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Current Balance</Label>
                  <p className="font-medium">₹{Math.round(selectedCredit.balanceAmount || 0)}</p>
                </div>
              </div>

              <div>
                <Label htmlFor="newAmount">New Original Amount *</Label>
                <Input
                  id="newAmount"
                  type="number"
                  step="1"
                  min="0"
                  value={newOriginalAmount}
                  onChange={(e) => setNewOriginalAmount(e.target.value)}
                  placeholder="Enter new original amount"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Current: ₹{Math.round(selectedCredit.originalAmount || 0)}
                  {selectedCredit.initialOriginalAmount && selectedCredit.initialOriginalAmount !== selectedCredit.originalAmount && (
                    <span className="ml-2"> | Initial: ₹{Math.round(selectedCredit.initialOriginalAmount)}</span>
                  )}
                </p>
              </div>

              <div>
                <Label htmlFor="amountChangeNotes">Notes (Optional)</Label>
                <Textarea
                  id="amountChangeNotes"
                  value={amountChangeNotes}
                  onChange={(e) => setAmountChangeNotes(e.target.value)}
                  placeholder="Add notes about this amount change..."
                  rows={3}
                />
              </div>

              {/* Amount Change History */}
              {selectedCredit.amountChangeHistory && selectedCredit.amountChangeHistory.length > 0 && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <Label className="text-xs text-muted-foreground mb-2 block">Amount Change History</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedCredit.amountChangeHistory.map((change, index) => (
                      <div key={index} className="text-xs border-l-2 border-blue-500 pl-2">
                        <p className="font-medium">
                          ₹{Math.round(change.previousAmount || 0)} → ₹{Math.round(change.updatedAmount || 0)}
                        </p>
                        <p className="text-muted-foreground">
                          {change.changeDate ? format(new Date(change.changeDate), "dd-MM-yyyy HH:mm") : ""}
                          {change.changedBy && ` by ${change.changedBy.firstName} ${change.changedBy.lastName}`}
                        </p>
                        {change.notes && <p className="text-muted-foreground italic">{change.notes}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditAmountDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAmountUpdate}>
              <Save className="h-4 w-4 mr-1" />
              Update Amount
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Credits;

