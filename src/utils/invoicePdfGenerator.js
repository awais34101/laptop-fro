import { jsPDF } from 'jspdf';

export const generateInvoicePDF = (sale, storeType = 'store1') => {
  const doc = new jsPDF();
  
  // Company Header
  doc.setFillColor(25, 118, 210);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont(undefined, 'bold');
  doc.text('PRO CRM', 105, 15, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  doc.text('Laptop Business - UAE', 105, 23, { align: 'center' });
  doc.text('Phone: +971-XX-XXX-XXXX | Email: info@procrm.ae', 105, 30, { align: 'center' });
  
  // Store Type Badge
  doc.setFontSize(10);
  doc.text(storeType === 'store1' ? 'STORE 1' : 'STORE 2', 105, 36, { align: 'center' });
  
  // Reset text color
  doc.setTextColor(0, 0, 0);
  
  // Invoice Title
  doc.setFontSize(20);
  doc.setFont(undefined, 'bold');
  doc.text('SALES INVOICE', 105, 50, { align: 'center' });
  
  // Invoice Details Box
  const invoiceY = 60;
  doc.setFillColor(240, 244, 250);
  doc.rect(15, invoiceY, 180, 30, 'F');
  doc.setDrawColor(25, 118, 210);
  doc.setLineWidth(0.5);
  doc.rect(15, invoiceY, 180, 30);
  
  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');
  
  // Left side - Invoice info
  doc.setFont(undefined, 'bold');
  doc.text('Invoice #:', 20, invoiceY + 8);
  doc.setFont(undefined, 'normal');
  doc.text(sale.invoice_number || 'N/A', 50, invoiceY + 8);
  
  doc.setFont(undefined, 'bold');
  doc.text('Date:', 20, invoiceY + 16);
  doc.setFont(undefined, 'normal');
  doc.text(new Date(sale.date).toLocaleDateString('en-GB'), 50, invoiceY + 16);
  
  doc.setFont(undefined, 'bold');
  doc.text('Time:', 20, invoiceY + 24);
  doc.setFont(undefined, 'normal');
  doc.text(new Date(sale.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), 50, invoiceY + 24);
  
  // Right side - Customer info
  doc.setFont(undefined, 'bold');
  doc.text('Customer:', 110, invoiceY + 8);
  doc.setFont(undefined, 'normal');
  doc.text(sale.customer?.name || 'N/A', 140, invoiceY + 8);
  
  if (sale.customer?.phone) {
    doc.setFont(undefined, 'bold');
    doc.text('Phone:', 110, invoiceY + 16);
    doc.setFont(undefined, 'normal');
    doc.text(sale.customer.phone, 140, invoiceY + 16);
  }
  
  if (sale.customer?.email) {
    doc.setFont(undefined, 'bold');
    doc.text('Email:', 110, invoiceY + 24);
    doc.setFont(undefined, 'normal');
    const email = sale.customer.email;
    doc.text(email.length > 25 ? email.substring(0, 25) + '...' : email, 140, invoiceY + 24);
  }
  
  // Items Table Header
  let yPos = 105;
  doc.setFillColor(25, 118, 210);
  doc.rect(15, yPos, 180, 10, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.text('#', 20, yPos + 7);
  doc.text('Item Description', 35, yPos + 7);
  doc.text('Qty', 120, yPos + 7, { align: 'center' });
  doc.text('Price', 150, yPos + 7, { align: 'right' });
  doc.text('Total', 185, yPos + 7, { align: 'right' });
  
  // Reset text color
  doc.setTextColor(0, 0, 0);
  yPos += 10;
  
  // Items Table Body
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  
  sale.items.forEach((item, index) => {
    // Alternate row colors
    if (index % 2 === 1) {
      doc.setFillColor(249, 250, 253);
      doc.rect(15, yPos, 180, 10, 'F');
    }
    
    const itemName = item.item?.name || 'Unknown Item';
    const truncatedName = itemName.length > 40 ? itemName.substring(0, 40) + '...' : itemName;
    
    doc.text((index + 1).toString(), 20, yPos + 7);
    doc.text(truncatedName, 35, yPos + 7);
    doc.text(item.quantity.toString(), 120, yPos + 7, { align: 'center' });
    doc.text(`${(item.price || 0).toFixed(2)}`, 150, yPos + 7, { align: 'right' });
    doc.text(`${((item.quantity || 0) * (item.price || 0)).toFixed(2)}`, 185, yPos + 7, { align: 'right' });
    
    yPos += 10;
  });
  
  // Table border
  doc.setDrawColor(200, 200, 200);
  doc.rect(15, 105, 180, yPos - 105);
  
  // Calculate totals
  const subtotal = sale.items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.price || 0)), 0);
  const vat = 0; // Add VAT calculation if needed
  const total = subtotal + vat;
  
  yPos += 5;
  
  // Subtotal
  doc.setFillColor(240, 244, 250);
  doc.rect(120, yPos, 75, 10, 'F');
  doc.setFont(undefined, 'bold');
  doc.setFontSize(11);
  doc.text('Subtotal:', 125, yPos + 7);
  doc.text(`${subtotal.toFixed(2)} AED`, 190, yPos + 7, { align: 'right' });
  
  yPos += 10;
  
  // Total
  doc.setFillColor(25, 118, 210);
  doc.rect(120, yPos, 75, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('TOTAL:', 125, yPos + 8);
  doc.text(`${total.toFixed(2)} AED`, 190, yPos + 8, { align: 'right' });
  
  // Reset colors
  doc.setTextColor(0, 0, 0);
  
  // Footer
  const footerY = doc.internal.pageSize.height - 30;
  doc.setFillColor(240, 244, 250);
  doc.rect(0, footerY, 210, 30, 'F');
  
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.text('Thank you for your business!', 105, footerY + 8, { align: 'center' });
  doc.text('Terms & Conditions: All sales are final. No refunds without approval.', 105, footerY + 14, { align: 'center' });
  doc.text('For support, contact us at info@procrm.ae', 105, footerY + 20, { align: 'center' });
  
  // Return the PDF document and metadata for sharing
  return {
    doc,
    fileName: `Invoice_${sale.invoice_number || 'N-A'}_${new Date(sale.date).toLocaleDateString('en-GB').replace(/\//g, '-')}.pdf`,
    invoiceNumber: sale.invoice_number || 'N/A',
    customerName: sale.customer?.name || 'Customer',
    total: sale.items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.price || 0)), 0).toFixed(2)
  };
};
