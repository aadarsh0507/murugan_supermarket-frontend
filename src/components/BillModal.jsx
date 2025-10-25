import React from 'react';
import { X, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

const BillModal = ({ isOpen, onClose, billData, isAdmin = false }) => {
  if (!isOpen) return null;

  // Default data matching the JAYA SUPER STORE receipt exactly
  const defaultBillData = {
    storeName: "JAYA SUPER STORE",
    address: "No.25, Loop Road, Acharapakkam - 603301",
    phone: "Ph: 044-27522026",
    gstNumber: "GST No.: 33AWOPD0029J1ZS",
    date: "18-Oct-2025",
    time: "7:24 pm",
    billNumber: 364,
    counterNumber: 1,
    customerName: "",
    billBy: "",
    items: [
      { name: "AACHI BRIYANI-50G", mrp: 41.00, saleRate: 39.00, qty: 1, netAmount: 39.00 },
      { name: "AACHI GARAM MASALA-5", mrp: 36.00, saleRate: 34.00, qty: 1, netAmount: 34.00 },
      { name: "ANIL MAIDA-500G", mrp: 42.00, saleRate: 40.00, qty: 1, netAmount: 40.00 },
      { name: "ANIL RAVA 500G", mrp: 47.00, saleRate: 45.00, qty: 1, netAmount: 45.00 },
      { name: "BASMATHI RICE 1KG", mrp: 125.00, saleRate: 120.00, qty: 1, netAmount: 120.00 },
      { name: "GOPURAM KUMKUM 40G", mrp: 12.00, saleRate: 10.00, qty: 1, netAmount: 10.00 },
      { name: "GRAM DHALL 500G", mrp: 65.00, saleRate: 60.00, qty: 1, netAmount: 60.00 },
      { name: "HAMAM SOAP 150G", mrp: 66.00, saleRate: 64.00, qty: 1, netAmount: 64.00 },
      { name: "KARPOORAM-25G", mrp: 45.00, saleRate: 35.00, qty: 1, netAmount: 35.00 },
      { name: "LAKME PEACH MILK-65", mrp: 155.00, saleRate: 152.00, qty: 1, netAmount: 152.00 },
      { name: "PATTAI NICE-25G", mrp: 65.00, saleRate: 60.00, qty: 1, netAmount: 60.00 },
      { name: "POWER LAVENDER125G", mrp: 45.00, saleRate: 44.00, qty: 1, netAmount: 44.00 },
      { name: "TATA KALLU UPPU 1KG", mrp: 22.00, saleRate: 21.00, qty: 1, netAmount: 21.00 },
      { name: "TATA SALT 1KG", mrp: 30.00, saleRate: 29.00, qty: 1, netAmount: 29.00 },
      { name: "TOOR DHALL 500G", mrp: 75.00, saleRate: 60.00, qty: 1, netAmount: 60.00 },
      { name: "UDHAYA GHEE-100ML", mrp: 108.00, saleRate: 105.00, qty: 1, netAmount: 105.00 },
      { name: "UDHAYA GHEE-50ML", mrp: 56.00, saleRate: 54.00, qty: 1, netAmount: 54.00 },
      { name: "VELLAM 250G", mrp: 25.00, saleRate: 20.00, qty: 1, netAmount: 20.00 }
    ],
    gstBreakdown: [
      { basic: 567.00, cgstPercent: 0.00, cgstAmount: 0.00, sgstPercent: 0.00, sgstAmount: 0.00 },
      { basic: 222.00, cgstPercent: 12.50, cgstAmount: 5.29, sgstPercent: 12.50, sgstAmount: 5.29 },
      { basic: 159.00, cgstPercent: 12.00, cgstAmount: 8.53, sgstPercent: 12.00, sgstAmount: 8.53 },
      { basic: 44.00, cgstPercent: 9.00, cgstAmount: 3.36, sgstPercent: 9.00, sgstAmount: 3.36 },
      { basic: 0.00, cgstPercent: 0.00, cgstAmount: 0.00, sgstPercent: 0.00, sgstAmount: 0.00 }
    ]
  };

  const data = billData || defaultBillData;
  
  const totalAmount = data.items.reduce((sum, item) => sum + parseFloat(item.netAmount), 0);
  const totalQty = data.items.reduce((sum, item) => sum + parseFloat(item.qty), 0);
  const totalSavings = data.items.reduce((sum, item) => sum + (parseFloat(item.mrp) - parseFloat(item.saleRate)) * parseFloat(item.qty), 0);

  const handlePrint = () => {
    const printContent = document.getElementById('bill-content').innerHTML;
    const printWindow = window.open('', '_blank', 'width=300,height=800');
    printWindow.document.write(`
      <html>
        <head>
          <title>Bill - ${data.billNumber}</title>
          <style>
            body { 
              margin: 0; 
              padding: 0; 
              font-family: monospace; 
              font-size: 10px;
              line-height: 1.1;
              width: 80mm;
              max-width: 80mm;
            }
            .bill-content {
              width: 80mm;
              max-width: 80mm;
              margin: 0 auto;
              padding: 5mm;
              box-sizing: border-box;
            }
            .summary-item {
              display: flex;
              justify-content: space-between;
              margin-bottom: 1px;
            }
            .summary-item span:last-child {
              margin-left: 5px;
            }
            .transaction-details {
              margin-bottom: 10px;
            }
            .transaction-details > div {
              display: flex;
              justify-content: space-between;
              margin-bottom: 2px;
            }
            .items-table {
              width: 100%;
              font-size: 9px;
              border-collapse: collapse;
              border: 1px solid #000;
            }
            .items-table th {
              padding: 2px 4px;
              text-align: left;
              border-bottom: 1px solid #000;
            }
            .items-table td {
              padding: 2px 4px;
              text-align: left;
            }
            .items-table th:nth-child(2),
            .items-table th:nth-child(3),
            .items-table th:nth-child(4),
            .items-table th:nth-child(5),
            .items-table td:nth-child(2),
            .items-table td:nth-child(3),
            .items-table td:nth-child(4),
            .items-table td:nth-child(5) {
              text-align: right;
            }
            .gst-table {
              width: 100%;
              font-size: 9px;
              margin-top: 5px;
              border-collapse: collapse;
              border: 1px solid #000;
            }
            .gst-table th {
              padding: 2px 4px;
              text-align: left;
              border-bottom: 1px solid #000;
            }
            .gst-table td {
              padding: 2px 4px;
              text-align: left;
            }
            .gst-table th:nth-child(2),
            .gst-table th:nth-child(3),
            .gst-table th:nth-child(4),
            .gst-table th:nth-child(5),
            .gst-table td:nth-child(2),
            .gst-table td:nth-child(3),
            .gst-table td:nth-child(4),
            .gst-table td:nth-child(5) {
              text-align: right;
            }
            .summary-table {
              width: 100%;
              font-size: 10px;
              margin-bottom: 5px;
            }
            .summary-table td {
              padding: 2px 4px;
            }
            .summary-table td:last-child {
              text-align: right;
            }
            @media print {
              body { 
                margin: 0; 
                padding: 0;
                width: 80mm;
                max-width: 80mm;
              }
              .bill-content { 
                padding: 2mm;
                width: 80mm;
                max-width: 80mm;
              }
              @page {
                size: 80mm auto;
                margin: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="bill-content">
            ${printContent}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-full w-full max-h-[95vh] overflow-hidden">
        {/* Modal Header - Mobile Responsive */}
        <div className="flex items-center justify-between p-3 md:p-4 border-b">
          <h2 className="text-base md:text-lg font-semibold">Bill Receipt</h2>
          <div className="flex gap-1 md:gap-2">
            <Button onClick={handlePrint} size="sm" variant="outline" className="text-xs md:text-sm">
              <Printer className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Print</span>
            </Button>
            <Button onClick={onClose} size="sm" variant="ghost" className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Bill Content - Mobile Responsive */}
        <div className="overflow-y-auto max-h-[calc(95vh-80px)]">
          <div id="bill-content" className="p-2 md:p-4 font-mono text-xs md:text-sm leading-tight bg-white">
            {/* Store Header */}
            <div className="text-center mb-3">
              <h1 className="text-base font-bold uppercase">{data.storeName}</h1>
              <p className="text-xs">{data.address}</p>
              <p className="text-xs">{data.phone}</p>
              <p className="text-xs">{data.gstNumber}</p>
            </div>

            {/* Transaction Details */}
            <div className="mb-3 space-y-1 transaction-details">
              <div className="flex justify-between">
                <span>Date {data.date}</span>
                <span>Time {data.time}</span>
              </div>
              <div>
                <span>Bill No {data.billNumber}</span>
              </div>
              <div>
                <span>To: {data.customerName || ""}</span>
              </div>
              {data.billBy && (
                <div>
                  <span>Bill By: {data.billBy}</span>
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="mb-3">
              <table className="items-table w-full">
                <thead>
                  <tr>
                    <th className="text-left font-bold">ItemName</th>
                    <th className="text-right font-bold">MRP</th>
                    <th className="text-right font-bold">SaleRate</th>
                    <th className="text-right font-bold">Qty</th>
                    <th className="text-right font-bold">NetAmount</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item, index) => (
                    <tr key={index}>
                      <td className="text-left">{item.name}</td>
                      <td className="text-right">{typeof item.mrp === 'number' ? item.mrp.toFixed(2) : item.mrp}</td>
                      <td className="text-right">{typeof item.saleRate === 'number' ? item.saleRate.toFixed(2) : item.saleRate}</td>
                      <td className="text-right">{item.qty}</td>
                      <td className="text-right">{typeof item.netAmount === 'number' ? item.netAmount.toFixed(2) : item.netAmount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="mb-3">
              <table className="summary-table w-full">
                <tbody>
                  <tr>
                    <td className="font-bold text-sm">Subtotal</td>
                    <td className="text-right font-bold text-sm">{typeof data.subtotal === 'number' ? data.subtotal.toFixed(2) : data.subtotal || '0.00'}</td>
                  </tr>
                  {isAdmin && data.discountAmount && parseFloat(data.discountAmount) > 0 && (
                    <tr>
                      <td className="text-xs text-green-600">DISCOUNT:</td>
                      <td className="text-right text-xs text-green-600">-{typeof data.discountAmount === 'number' ? data.discountAmount.toFixed(2) : data.discountAmount}</td>
                    </tr>
                  )}
                  <tr>
                    <td className="font-bold text-sm">Total</td>
                    <td className="text-right font-bold text-sm">{typeof data.totalAmount === 'number' ? data.totalAmount.toFixed(2) : data.totalAmount}</td>
                  </tr>
                  <tr>
                    <td className="text-xs">TOTAL QTY:</td>
                    <td className="text-right text-xs">{typeof totalQty === 'number' ? totalQty.toFixed(2) : totalQty}</td>
                  </tr>
                  <tr>
                    <td className="text-xs">AMOUNT PAID:</td>
                    <td className="text-right text-xs">{typeof data.totalAmount === 'number' ? data.totalAmount.toFixed(2) : data.totalAmount}</td>
                  </tr>
                  <tr>
                    <td className="text-xs">AMT RETURNED:</td>
                    <td className="text-right text-xs">0.00</td>
                  </tr>
                  <tr>
                    <td className="text-xs">YOU SAVE:</td>
                    <td className="text-right text-xs">{typeof totalSavings === 'number' ? totalSavings.toFixed(2) : totalSavings}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* GST Breakdown */}
            <div className="mb-3">
              <table className="gst-table w-full">
                <thead>
                  <tr>
                    <th className="text-left font-bold">BASIC</th>
                    <th className="text-right font-bold">CGST%</th>
                    <th className="text-right font-bold">AMT</th>
                    <th className="text-right font-bold">SGST%</th>
                    <th className="text-right font-bold">AMT</th>
                  </tr>
                </thead>
                <tbody>
                  {data.gstBreakdown.map((gst, index) => (
                    <tr key={index}>
                      <td className="text-left">{typeof gst.basic === 'number' ? gst.basic.toFixed(2) : gst.basic}</td>
                      <td className="text-right">{typeof gst.cgstPercent === 'number' ? gst.cgstPercent.toFixed(2) : gst.cgstPercent}</td>
                      <td className="text-right">{typeof gst.cgstAmount === 'number' ? gst.cgstAmount.toFixed(2) : gst.cgstAmount}</td>
                      <td className="text-right">{typeof gst.sgstPercent === 'number' ? gst.sgstPercent.toFixed(2) : gst.sgstPercent}</td>
                      <td className="text-right">{typeof gst.sgstAmount === 'number' ? gst.sgstAmount.toFixed(2) : gst.sgstAmount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="text-center text-xs">
              <p className="font-bold mb-1">THANK U VISIT AGAIN!</p>
              <p>NO WARRANTY! NO RETURN!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillModal;
