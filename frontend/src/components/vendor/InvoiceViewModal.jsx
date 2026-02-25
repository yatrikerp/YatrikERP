import React from 'react';
import { X, Receipt, Download, FileText, Calendar, DollarSign, Building2, Mail, Phone } from 'lucide-react';

const InvoiceViewModal = ({ 
  isOpen, 
  onClose, 
  invoice, 
  vendor, 
  user, 
  onDownload,
  formatCurrency 
}) => {
  if (!isOpen || !invoice) return null;

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'approved':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Receipt className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Invoice Details</h2>
              <p className="text-sm text-gray-600">#{invoice.invoiceNumber}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Invoice Content */}
        <div className="p-6">
          {/* Invoice Header */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">INVOICE</h1>
                <div className="text-2xl font-mono text-blue-600">#{invoice.invoiceNumber}</div>
              </div>
              <div className="text-right">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(invoice.status)}`}>
                  {invoice.status?.toUpperCase() || 'PENDING'}
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(invoice.date || invoice.createdAt).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Billing Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* From (Vendor) */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                FROM (VENDOR)
              </h3>
              <div className="space-y-2">
                <div className="font-semibold text-gray-900">
                  {vendor?.companyName || user?.companyName || 'Vendor Company'}
                </div>
                <div className="text-sm text-gray-600">
                  {vendor?.address || 'Vendor Address'}
                </div>
                <div className="text-sm text-gray-600 flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {vendor?.email || user?.email || 'vendor@example.com'}
                </div>
                <div className="text-sm text-gray-600 flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {vendor?.phone || user?.phone || 'N/A'}
                </div>
                {vendor?.gstNumber && (
                  <div className="text-sm text-gray-600">
                    <strong>GST:</strong> {vendor.gstNumber}
                  </div>
                )}
              </div>
            </div>

            {/* To (Depot/Client) */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                TO (CLIENT)
              </h3>
              <div className="space-y-2">
                <div className="font-semibold text-gray-900">
                  {invoice.clientName || invoice.depotName || 'YATRIK ERP'}
                </div>
                <div className="text-sm text-gray-600">
                  {invoice.clientAddress || 'Client Address'}
                </div>
                <div className="text-sm text-gray-600">
                  {invoice.clientEmail || 'client@yatrikerp.com'}
                </div>
                {invoice.clientGST && (
                  <div className="text-sm text-gray-600">
                    <strong>GST:</strong> {invoice.clientGST}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Invoice Date</div>
              <div className="font-semibold">
                {new Date(invoice.date || invoice.createdAt).toLocaleDateString('en-IN')}
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Due Date</div>
              <div className="font-semibold">
                {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-IN') : 'N/A'}
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">PO Number</div>
              <div className="font-semibold">{invoice.poNumber || 'N/A'}</div>
            </div>
          </div>

          {/* Invoice Items */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Items</h3>
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">
                      Description
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-b">
                      Quantity
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b">
                      Unit Price
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items && invoice.items.length > 0 ? (
                    invoice.items.map((item, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">
                            {item.description || item.productName || `Item ${index + 1}`}
                          </div>
                          {item.productCode && (
                            <div className="text-sm text-gray-600">Code: {item.productCode}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">{item.quantity || 1}</td>
                        <td className="px-4 py-3 text-right">
                          {formatCurrency ? formatCurrency(item.unitPrice || item.price || 0) : `₹${item.unitPrice || item.price || 0}`}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">
                          {formatCurrency ? formatCurrency((item.quantity || 1) * (item.unitPrice || item.price || 0)) : `₹${(item.quantity || 1) * (item.unitPrice || item.price || 0)}`}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                        <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <div>No items found</div>
                        <div className="text-sm">Invoice items will appear here</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Invoice Summary */}
          <div className="flex justify-end mb-6">
            <div className="w-full max-w-sm">
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">
                    {formatCurrency ? formatCurrency(invoice.subtotal || invoice.amount || 0) : `₹${invoice.subtotal || invoice.amount || 0}`}
                  </span>
                </div>
                
                {invoice.taxAmount && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax ({invoice.taxRate || 18}%):</span>
                    <span className="font-medium">
                      {formatCurrency ? formatCurrency(invoice.taxAmount) : `₹${invoice.taxAmount}`}
                    </span>
                  </div>
                )}
                
                {invoice.discount && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount:</span>
                    <span className="font-medium text-green-600">
                      -{formatCurrency ? formatCurrency(invoice.discount) : `₹${invoice.discount}`}
                    </span>
                  </div>
                )}
                
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
                    <span className="text-lg font-bold text-blue-600">
                      {formatCurrency ? formatCurrency(invoice.amount || invoice.totalAmount || 0) : `₹${invoice.amount || invoice.totalAmount || 0}`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          {(invoice.paymentDetails || invoice.paymentStatus || invoice.paymentDate) && (
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                Payment Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Payment Status</div>
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.paymentStatus || 'pending')}`}>
                    {invoice.paymentStatus?.toUpperCase() || 'PENDING'}
                  </div>
                </div>
                {invoice.paymentDate && (
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Payment Date</div>
                    <div className="font-medium">
                      {new Date(invoice.paymentDate).toLocaleDateString('en-IN')}
                    </div>
                  </div>
                )}
                {invoice.paymentMethod && (
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Payment Method</div>
                    <div className="font-medium">{invoice.paymentMethod}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {invoice.notes && (
            <div className="bg-yellow-50 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Notes</h3>
              <p className="text-sm text-gray-600">{invoice.notes}</p>
            </div>
          )}

          {/* Terms & Conditions */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Terms & Conditions</h3>
            <div className="text-xs text-gray-600 space-y-1">
              <p>• Payment is due within 30 days of invoice date</p>
              <p>• Late payments may incur additional charges</p>
              <p>• All disputes must be reported within 7 days</p>
              <p>• This is a computer-generated invoice</p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Generated on {new Date().toLocaleDateString('en-IN')}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onDownload && onDownload(invoice._id)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceViewModal;