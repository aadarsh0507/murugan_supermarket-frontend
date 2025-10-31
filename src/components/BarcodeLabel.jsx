import { useEffect, useRef, useState } from "react";
import JsBarcode from "jsbarcode";

// Helper function to calculate EAN-13 checksum
function calculateEAN13Checksum(digits) {
  if (digits.length !== 12) {
    throw new Error('EAN-13 requires exactly 12 data digits');
  }
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    // EAN-13: odd positions (1-indexed) multiply by 1, even positions by 3
    // Array is 0-indexed, so position 0 (1st) uses 1, position 1 (2nd) uses 3, etc.
    sum += parseInt(digits[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const checksum = (10 - (sum % 10)) % 10;
  return checksum;
}

// Helper function to fix invalid 14-digit barcodes to 13-digit EAN13
function fixBarcodeToEAN13(barcode) {
  const barcodeStr = String(barcode).trim();
  
  // If already 13 digits, return as is
  if (barcodeStr.length === 13 && /^\d{13}$/.test(barcodeStr)) {
    return barcodeStr;
  }
  
  // If 14 digits, take first 12 and recalculate checksum
  if (barcodeStr.length === 14 && /^\d{14}$/.test(barcodeStr)) {
    const base12Digits = barcodeStr.slice(0, 12);
    const newChecksum = calculateEAN13Checksum(base12Digits);
    return base12Digits + newChecksum.toString();
  }
  
  // If too short, pad and recalculate
  if (barcodeStr.length < 13 && /^\d+$/.test(barcodeStr)) {
    const padded = barcodeStr.padStart(12, '0').slice(0, 12);
    const checksum = calculateEAN13Checksum(padded);
    return padded + checksum.toString();
  }
  
  return null; // Invalid format
}

// Note: We use CODE128 so we can encode alphanumeric SKU values directly.
// If `sku` is provided we encode it; otherwise we fallback to `barcode` (numeric).
const BarcodeLabel = ({ barcode, sku, storeName, itemName, expiryDate, amount, batchNumber, onCanvasReady }) => {
  const canvasRef = useRef(null);
  const [barcodeError, setBarcodeError] = useState(false);

  useEffect(() => {
    const valueToEncode = (sku && String(sku).trim()) || (barcode && String(barcode).trim());
    if (canvasRef.current && valueToEncode) {
      try {
        setBarcodeError(false);

        // Clear previous canvas content
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        // When encoding SKU we need an alphanumeric-capable symbology (CODE128)
        // Fallback remains numeric barcodes if only `barcode` provided
        const isAlphaNumeric = /[A-Za-z]/.test(valueToEncode);
        const format = isAlphaNumeric ? "CODE128" : "EAN13";
        const value = isAlphaNumeric ? valueToEncode : fixBarcodeToEAN13(valueToEncode) || valueToEncode;

        JsBarcode(canvasRef.current, value, {
          format,
          width: 2,
          height: 60,
          displayValue: false,
          fontSize: 12,
          margin: 5,
          valid: function(valid) {
            if (!valid) {
              console.error(`Invalid ${format} barcode value:`, value);
              setBarcodeError(true);
            }
          }
        });
        if (typeof onCanvasReady === 'function') {
          onCanvasReady(canvasRef.current);
        }
      } catch (error) {
        console.error("Error generating barcode:", error, "Barcode:", barcode);
        setBarcodeError(true);
      }
    }
  }, [barcode, sku]);

  const formatDate = (date) => {
    if (!date) return "N/A";
    const d = new Date(date);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="border-2 border-gray-800 p-2 bg-white" style={{ width: "300px", minHeight: "150px" }}>
      {/* Store Name */}
      <div className="text-center font-bold text-lg mb-1 border-b-2 border-gray-800 pb-1">
        {storeName || "Murugan Supermarket"}
      </div>
      
      {/* Barcode */}
      <div className="flex justify-center mb-2 min-h-[60px] items-center">
        {barcodeError ? (
          <div className="text-center text-xs text-red-600 border border-red-300 p-2 rounded">
            Invalid barcode format
          </div>
        ) : (
          <canvas ref={canvasRef} className="max-w-full" />
        )}
      </div>
      
      {/* Item Name, Batch, Expiry and Amount */}
      <div className="border-t-2 border-gray-800 pt-1 mt-1">
        <div className="text-xs font-semibold mb-1">
          {itemName || "Item Name"}
        </div>
        <div className="text-xs mb-1">Batch: {batchNumber || '-'}</div>
        <div className="flex justify-between text-xs">
          <span>Exp: {formatDate(expiryDate)}</span>
          {typeof amount !== 'undefined' && amount !== null && (
            <span>Price: ₹{Number(amount).toFixed(2)}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default BarcodeLabel;

