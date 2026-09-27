// Default company invoice template: placeholder until the real company
// invoice template is provided. Adapted from
// example_company_data_zinospot/invoice_generic.html (Zinospot OÜ layout)
// with every business/customer value replaced by {{tokens}} understood by
// renderInvoiceTemplate in src/lib/invoicing.ts.
export const DEFAULT_INVOICE_TEMPLATE_NAME = "Company default (placeholder)";

export const DEFAULT_INVOICE_TEMPLATE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Invoice {{invoiceNumber}}</title>
<style>
  @page { size: A4; margin: 20mm; }
  body { font-family: Arial, sans-serif; margin: 0; padding: 20mm; color: #333; font-size: 14px; }
  h1, h2, h3 { margin: 0; }
  .invoice-header, .invoice-footer { width: 100%; display: flex; justify-content: space-between; page-break-inside: avoid; }
  .invoice-header div, .invoice-footer div { width: 48%; }
  .invoice-title { font-size: 22px; font-weight: bold; margin-bottom: 10px; }
  .info-table td { padding: 3px 0; }
  .table { width: 100%; border-collapse: collapse; margin-top: 30px; margin-bottom: 20px; }
  .table th, .table td { padding: 8px 10px; border-bottom: 1px solid #ddd; }
  .table thead { background: #000; color: #fff; }
  .text-center { text-align: center; }
  .text-right { text-align: right; }
  .thick-line { border-top: 2px solid #000; }
  .no-line { border-top: none; }
  .invoice-footer { margin-top: 40px; font-size: 13px; }
  @media print { body { margin: 0; padding: 0; } }
</style>
</head>
<body>
    <div class="invoice-header">
        <div>
            <h2>INVOICE FROM:</h2>
            <p><strong>{{businessName}}</strong><br>
            Registration code: {{businessRegistryCode}}<br>
            VAT number: {{businessVatNumber}}</p>
            <h3 style="margin-top: 20px;">BILL TO:</h3>
            <p><strong>{{customerName}}</strong><br>
            Registry code: {{customerRegistryCode}}<br>
            VAT number: {{customerVatNumber}}<br>
            {{customerAddress}}<br>
            {{customerEmail}}</p>
        </div>
        <div style="text-align: right;">
            <p><strong>{{invoiceNumber}}</strong></p>
            <table class="info-table" style="margin-top: 10px; float: right;">
                <tr><td><strong>DATE:</strong></td><td>{{invoiceDate}}</td></tr>
                <tr><td><strong>TRANSACTION:</strong></td><td>{{transactionDate}}</td></tr>
                <tr><td><strong>AMOUNT:</strong></td><td><strong>{{currency}} {{amount}}</strong></td></tr>
            </table>
        </div>
    </div>
    <table class="table table-condensed">
        <thead>
            <tr>
                <th style="width: 50%;">DESCRIPTION</th>
                <th class="text-center" style="width: 10%;">QTY.</th>
                <th class="text-center" style="width: 20%;">UNIT PRICE</th>
                <th class="text-right" style="width: 20%;">AMOUNT</th>
            </tr>
        </thead>
        <tbody>
            <tr><td>{{description}}</td><td class="text-center">1.00</td><td class="text-center">{{currency}} {{amount}}</td><td class="text-right">{{currency}} {{amount}}</td></tr>
            <tr class="inv_summary"><td class="thick-line"></td><td class="thick-line"></td><td class="thick-line text-right"><strong>TOTAL:</strong></td><td class="thick-line text-right"><strong>{{currency}} {{amount}}</strong></td></tr>
        </tbody>
    </table>
    <div class="invoice-footer">
        <div>
            <h3>Bank Details</h3>
            <p>Account holder: {{businessName}}<br>{{businessRegistryCode}}</p>
        </div>
    </div>
</body>
</html>`;
