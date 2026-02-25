import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import vendorApiService from '../../services/vendorApiService';
import { apiFetch } from '../../utils/api';
import {
  Building2,
  Wallet,
  FileText,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  DollarSign,
  Package,
  Receipt,
  BarChart3,
  Settings,
  LogOut,
  RefreshCw,
  Plus,
  Upload,
  Truck,
  Gavel,
  Bell,
  Shield,
  FileCheck,
  Award,
  AlertTriangle,
  TrendingDown,
  Search,
  Edit,
  X,
  Save,
  Trash2,
  PlusCircle,
  MinusCircle,
  CheckCircle2,
  Camera,
  Image as ImageIcon,
  MapPin
} from 'lucide-react';
import InvoiceViewModal from '../../components/vendor/InvoiceViewModal';
import { lazy, Suspense } from 'react';
import toast from 'react-hot-toast';
import './vendor.css';

// Lazy load heavy components for better performance
const BulkProductsUpload = lazy(() => import('../../components/vendor/BulkProductsUpload'));
const ProductModal = lazy(() => import('../../components/vendor/ProductModal'));

const VendorDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [poStats, setPoStats] = useState(null);
  const [poFilters, setPoFilters] = useState({
    status: '',
    search: '',
    page: 1,
    limit: 20
  });
  const [selectedPO, setSelectedPO] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [products, setProducts] = useState([]);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [compliance, setCompliance] = useState(null);
  const [poNotifications, setPoNotifications] = useState([]);
  const [lastCheckedPOTimestamp, setLastCheckedPOTimestamp] = useState(null);
  const [showPONotification, setShowPONotification] = useState(false);
  const [currentPONotification, setCurrentPONotification] = useState(null);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [dispatchPO, setDispatchPO] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoicePO, setInvoicePO] = useState(null);
  const [ledger, setLedger] = useState(null);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [editingProductId, setEditingProductId] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [stockAlerts, setStockAlerts] = useState([]);
  const [showInvoiceViewModal, setShowInvoiceViewModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [updatingProfile, setUpdatingProfile] = useState(false);

  useEffect(() => {
    console.log('🔵 [VendorDashboard] Component mounted');
    console.log('🔵 [VendorDashboard] User state:', {
      hasUser: !!user,
      userId: user?._id,
      role: user?.role,
      vendorId: user?.vendorId,
      email: user?.email,
      companyName: user?.companyName
    });
    
    // Check token
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          console.log('🔵 [VendorDashboard] Token payload:', {
            userId: payload.userId,
            vendorId: payload.vendorId,
            role: payload.role,
            email: payload.email,
            exp: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'No expiration',
            isExpired: payload.exp ? payload.exp * 1000 < Date.now() : false
          });
        } else {
          console.error('❌ [VendorDashboard] Invalid token format:', {
            tokenLength: token.length,
            parts: tokenParts.length
          });
        }
      } catch (e) {
        console.error('❌ [VendorDashboard] Failed to decode token:', e);
      }
    } else {
      console.error('❌ [VendorDashboard] No token found in localStorage');
    }

    // PERMANENTLY protect vendor session - set justLoggedIn flag
    // This ensures vendor session NEVER triggers auto-logout
    // Vendors should only logout when they click the logout button
    const justLoggedInTime = Date.now().toString();
    sessionStorage.setItem('justLoggedIn', justLoggedInTime);
    console.log('🔵 [VendorDashboard] Set justLoggedIn flag:', justLoggedInTime);
    
    // Keep refreshing the flag every 25 seconds to prevent expiration
    const refreshInterval = setInterval(() => {
      const refreshTime = Date.now().toString();
      sessionStorage.setItem('justLoggedIn', refreshTime);
      console.log('🔄 [VendorDashboard] Refreshed justLoggedIn flag:', refreshTime);
    }, 25000); // Refresh every 25 seconds (before 30 second expiration)
    
    // Fetch dashboard data - user validation is handled by RequireAuth component
    console.log('🔵 [VendorDashboard] Starting fetchDashboardData...');
    fetchDashboardData();
    
    // Initialize PO notification checking
    // First fetch to set baseline timestamp after a short delay
    const initialCheck = setTimeout(() => {
      checkForNewPOs();
    }, 2000); // Wait 2 seconds after mount
    
    // Poll for new POs every 10 seconds
    const poCheckInterval = setInterval(() => {
      checkForNewPOs();
    }, 10000); // Check every 10 seconds
    
    return () => {
      console.log('🔵 [VendorDashboard] Component unmounting, clearing intervals');
      clearInterval(refreshInterval);
      clearInterval(poCheckInterval);
      clearTimeout(initialCheck);
    };
  }, [user]);

  const fetchDashboardData = async () => {
    console.log('🔵 [VendorDashboard] fetchDashboardData called');
    try {
      setLoading(true);
      console.log('🔵 [VendorDashboard] Calling vendorApiService.getDashboard()...');
      const response = await vendorApiService.getDashboard();
      console.log('🔵 [VendorDashboard] Dashboard response received:', {
        success: response.success,
        hasData: !!response.data,
        status: response.status,
        message: response.message
      });
      
      if (response.success) {
        setDashboardData(response.data);
        console.log('✅ [VendorDashboard] Dashboard data set successfully');
      } else {
        console.error('❌ [VendorDashboard] Dashboard response not successful:', {
          success: response.success,
          message: response.message,
          data: response.data,
          status: response.status
        });
      }
    } catch (error) {
      console.error('❌ [VendorDashboard] Error fetching dashboard:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
    } finally {
      setLoading(false);
      console.log('🔵 [VendorDashboard] fetchDashboardData completed');
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await vendorApiService.getProfile();
      if (response.success) {
        setProfile(response.data.vendor);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchPurchaseOrders = async (filters = {}) => {
    try {
      console.log('🔄 [VendorDashboard] Fetching purchase orders with filters:', filters);
      
      // Merge filters but ensure status is empty string if not specified (to show all including 'pending')
      const queryParams = { 
        ...poFilters, 
        ...filters,
        // CRITICAL: If no status filter, explicitly set to empty string to show all statuses
        // This includes 'pending' status which is set when admin approves
        status: filters.status !== undefined ? filters.status : (poFilters.status || '')
      };
      setPoFilters(queryParams);
      
      // Remove status from query if it's empty string - backend will return all except pending_approval/cancelled
      if (queryParams.status === '') {
        delete queryParams.status;
      }
      
      const response = await vendorApiService.getPurchaseOrders(queryParams);
      console.log('📦 [VendorDashboard] Purchase orders response:', {
        success: response.success,
        count: response.data?.purchaseOrders?.length || 0,
        stats: response.data?.stats,
        pendingCount: response.data?.stats?.pending || 0
      });
      
      if (response.success) {
        const orders = response.data.purchaseOrders || [];
        console.log('✅ [VendorDashboard] Setting purchase orders:', orders.length);
        
        // Log pending POs specifically (these are approved by admin)
        const pendingPOs = orders.filter(po => po.status === 'pending');
        if (pendingPOs.length > 0) {
          console.log('🔔 [VendorDashboard] Found pending POs (approved by admin):', pendingPOs.map(po => ({
            poNumber: po.poNumber,
            status: po.status,
            orderDate: po.orderDate
          })));
        } else {
          console.warn('⚠️ [VendorDashboard] No pending POs found - checking debug endpoint...');
          // Call debug endpoint to see what's in the database
          try {
            const debugResponse = await apiFetch('/api/vendor/debug/purchase-orders', {
              suppressError: true,
              suppressLogout: true
            });
            if (debugResponse.ok && debugResponse.data?.success) {
              console.log('🔍 [DEBUG] Debug endpoint response:', debugResponse.data.debug);
              if (debugResponse.data.debug.totalPOs === 0) {
                console.error('❌ [DEBUG] No POs found in database for this vendor!');
                console.error('❌ [DEBUG] Vendor ID:', debugResponse.data.debug.vendorId);
                console.error('❌ [DEBUG] Check if PO was created with correct vendorId');
              } else if (debugResponse.data.debug.pendingPOs === 0) {
                console.warn('⚠️ [DEBUG] POs exist but none are in "pending" status');
                console.warn('⚠️ [DEBUG] PO statuses:', debugResponse.data.debug.allPOs.map(po => po.status));
              }
            }
          } catch (debugError) {
            console.error('❌ [DEBUG] Error calling debug endpoint:', debugError);
          }
        }
        
        if (orders.length > 0) {
          console.log('📋 [VendorDashboard] Sample PO:', {
            poNumber: orders[0].poNumber,
            status: orders[0].status,
            vendorId: orders[0].vendorId
          });
        } else {
          console.warn('⚠️ [VendorDashboard] No purchase orders returned - check backend logs');
        }
        
        setPurchaseOrders(orders);
        setPoStats(response.data.stats || null);
      } else {
        console.error('❌ [VendorDashboard] Purchase orders response not successful:', response);
        setPurchaseOrders([]);
      }
    } catch (error) {
      console.error('❌ [VendorDashboard] Error fetching purchase orders:', error);
      setPurchaseOrders([]);
    }
  };

  const handleAcceptPO = async (poId) => {
    try {
      // Optimistic update - show instantly
      const po = purchaseOrders.find(p => p._id === poId);
      if (po) {
        setPurchaseOrders(prevPOs =>
          prevPOs.map(p =>
            p._id === poId
              ? {
                  ...p,
                  status: 'accepted',
                  vendorResponse: {
                    ...p.vendorResponse,
                    status: 'accepted',
                    respondedAt: new Date()
                  },
                  _isUpdating: true,
                  _lastUpdated: Date.now()
                }
              : p
          )
        );
      }

      const response = await vendorApiService.acceptPurchaseOrder(poId, {
        message: 'Purchase order accepted',
        expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
      });
      
      if (response.success) {
        toast.success('Purchase order accepted successfully!');
        
        // Decrease stock for all products in the PO (real-time update)
        if (po && po.items) {
          for (const item of po.items) {
            const productId = item.sparePartId || item.productId;
            if (productId) {
              const product = products.find(p => p._id === productId);
              if (product) {
                const currentStock = product.stock?.quantity || 0;
                const orderedQty = item.quantity || 0;
                const newStock = Math.max(0, currentStock - orderedQty);
                
                // Optimistic update
                setProducts(prevProducts =>
                  prevProducts.map(p =>
                    p._id === productId
                      ? {
                          ...p,
                          stock: { ...p.stock, quantity: newStock },
                          _isUpdating: true,
                          _lastUpdated: Date.now()
                        }
                      : p
                  )
                );
                
                // Update via API
                try {
                  await apiFetch(`/api/products/${productId}/stock`, {
                    method: 'PATCH',
                    body: JSON.stringify({
                      quantity: newStock,
                      operation: 'set'
                    }),
                  });
                } catch (stockError) {
                  console.error('Error updating stock for product:', stockError);
                }
              }
            }
          }
        }
        
        // Update with server response
        setPurchaseOrders(prevPOs =>
          prevPOs.map(p =>
            p._id === poId
              ? { ...response.data.purchaseOrder || p, _isUpdating: false, _lastUpdated: undefined }
              : p
          )
        );
        
        fetchDashboardData(); // Refresh dashboard stats
        fetchProducts(); // Refresh products to sync with server
      } else {
        // Revert optimistic update on error
        fetchPurchaseOrders();
        toast.error(response.message || 'Failed to accept purchase order');
      }
    } catch (error) {
      console.error('Error accepting PO:', error);
      // Revert optimistic update
      fetchPurchaseOrders();
      toast.error('Failed to accept purchase order. Please try again.');
    }
  };

  const handleRejectPO = async (poId) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      // Optimistic update - show instantly
      setPurchaseOrders(prevPOs =>
        prevPOs.map(p =>
          p._id === poId
            ? {
                ...p,
                status: 'rejected',
                vendorResponse: {
                  ...p.vendorResponse,
                  status: 'rejected',
                  message: reason,
                  respondedAt: new Date()
                },
                _isUpdating: true,
                _lastUpdated: Date.now()
              }
            : p
        )
      );

      const response = await vendorApiService.rejectPurchaseOrder(poId, reason);
      
      if (response.success) {
        toast.success('Purchase order rejected');
        // Update with server response
        setPurchaseOrders(prevPOs =>
          prevPOs.map(p =>
            p._id === poId
              ? { ...response.data.purchaseOrder || p, _isUpdating: false, _lastUpdated: undefined }
              : p
          )
        );
        fetchDashboardData();
      } else {
        // Revert optimistic update on error
        fetchPurchaseOrders();
        toast.error(response.message || 'Failed to reject purchase order');
      }
    } catch (error) {
      console.error('Error rejecting PO:', error);
      // Revert optimistic update
      fetchPurchaseOrders();
      toast.error('Failed to reject purchase order. Please try again.');
    }
  };

  const handleDispatchPO = async (poId, dispatchData) => {
    try {
      // Optimistic update - show instantly
      setPurchaseOrders(prevPOs =>
        prevPOs.map(p =>
          p._id === poId
            ? {
                ...p,
                status: 'dispatched_awaiting_payment',
                deliveryStatus: {
                  ...p.deliveryStatus,
                  status: 'dispatched_awaiting_payment'
                },
                trackingNumber: dispatchData.lrNumber,
                shippingMethod: dispatchData.vehicleNumber,
                dispatchDate: new Date(dispatchData.dispatchDate),
                _isUpdating: true,
                _lastUpdated: Date.now()
              }
            : p
        )
      );

      const response = await vendorApiService.dispatchPurchaseOrder(poId, dispatchData);
      
      if (response.success) {
        toast.success('Purchase order marked as dispatched successfully!');
        // Update with server response
        setPurchaseOrders(prevPOs =>
          prevPOs.map(p =>
            p._id === poId
              ? { ...response.data.purchaseOrder || p, _isUpdating: false, _lastUpdated: undefined }
              : p
          )
        );
        fetchDashboardData();
        setShowDispatchModal(false);
        setDispatchPO(null);
      } else {
        // Revert optimistic update on error
        fetchPurchaseOrders();
        toast.error(response.message || 'Failed to dispatch purchase order');
      }
    } catch (error) {
      console.error('Error dispatching PO:', error);
      // Revert optimistic update
      fetchPurchaseOrders();
      toast.error('Failed to dispatch purchase order. Please try again.');
    }
  };

  const handleSubmitInvoice = async (invoiceData) => {
    try {
      const response = await vendorApiService.submitInvoice(invoiceData);
      
      if (response.success) {
        fetchInvoices();
        fetchPurchaseOrders();
        fetchDashboardData();
        setShowInvoiceModal(false);
        setInvoicePO(null);
        alert('Invoice submitted successfully!');
      }
    } catch (error) {
      console.error('Error submitting invoice:', error);
      alert(error.response?.data?.message || 'Failed to submit invoice. Please try again.');
    }
  };

  const fetchLedger = async () => {
    try {
      const response = await vendorApiService.getLedger();
      if (response.success) {
        setLedger(response.data);
      }
    } catch (error) {
      console.error('Error fetching ledger:', error);
    }
  };

  const handleAddProduct = async (productData) => {
    try {
      const response = await apiFetch('/api/products', {
        method: 'POST',
        body: JSON.stringify(productData),
      });
      if (response.ok && response.data.success) {
        fetchProducts();
        alert('Product added successfully!');
      } else {
        alert('Failed to add product: ' + (response.data?.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Failed to add product. Please try again.');
    }
  };

  const handleUpdateProduct = async (productId, updates) => {
    try {
      // Optimistic update - update UI immediately for instant feedback
      const productIndex = products.findIndex(p => p._id === productId);
      if (productIndex !== -1) {
        const currentProduct = products[productIndex];
        const optimisticUpdate = { 
          ...currentProduct, 
          ...updates,
          _lastUpdated: Date.now(), // Track when this was optimistically updated
          _isUpdating: true // Flag to show updating state
        };
        
        // Update stock object if it exists
        if (updates.stock && updates.stock.quantity !== undefined) {
          optimisticUpdate.stock = {
            ...currentProduct.stock,
            ...updates.stock
          };
        }
        
        setProducts(prevProducts => {
          const newProducts = [...prevProducts];
          newProducts[productIndex] = optimisticUpdate;
          return newProducts;
        });
      }

      // If updating stock, use the dedicated stock endpoint for real-time updates
      if (updates.stock && updates.stock.quantity !== undefined) {
        const response = await apiFetch(`/api/products/${productId}/stock`, {
          method: 'PATCH',
          body: JSON.stringify({
            quantity: parseInt(updates.stock.quantity),
            operation: 'set'
          }),
        });

        if (response.ok && response.data.success) {
          // Update with server response (includes recalculated price and status)
          const serverProduct = response.data.data.product;
          setProducts(prevProducts =>
            prevProducts.map(p =>
              p._id === productId ? { 
                ...p, 
                ...serverProduct,
                _lastUpdated: undefined, // Clear optimistic update flag
                _isUpdating: false // Clear updating flag
              } : p
            )
          );
          
          // Show success notification
          console.log('✅ Stock updated instantly!', {
            productId,
            newStock: serverProduct.stock?.quantity,
            newPrice: serverProduct.finalPrice
          });
        } else {
          // Revert optimistic update on error
          fetchProducts();
          throw new Error(response.data?.message || 'Failed to update stock');
        }
      } else {
        // For other updates, use the regular product update endpoint
        const response = await apiFetch(`/api/products/${productId}`, {
          method: 'PUT',
          body: JSON.stringify(updates),
        });

        if (response.ok && response.data.success) {
          // Update with server response
          setProducts(prevProducts =>
            prevProducts.map(p =>
              p._id === productId ? { ...p, ...updates, ...response.data.data.product } : p
            )
          );
        } else {
          // Revert optimistic update on error
          fetchProducts();
          throw new Error(response.data?.message || 'Failed to update product');
        }
      }
    } catch (error) {
      console.error('Error updating product:', error);
      // Revert by refetching
      fetchProducts();
      alert('Error updating product: ' + (error.message || 'Unknown error'));
    }
  };

  const handleUploadDocuments = async (productId, files) => {
    // TODO: Implement file upload
    console.log('Upload documents for product:', productId, files);
    alert('Document upload feature coming soon!');
  };

  const handleUploadProductLogo = async (productId, imageUrl) => {
    try {
      const product = products.find(p => p._id === productId);
      const productName = product?.productName || 'Product';
      
      // Optimistic update - show instantly
      setProducts(prevProducts =>
        prevProducts.map(p =>
          p._id === productId
            ? {
                ...p,
                images: [{
                  url: imageUrl,
                  isPrimary: true,
                  alt: `${productName} logo`
                }],
                imageUrl: imageUrl,
                _isUpdating: true,
                _lastUpdated: Date.now()
              }
            : p
        )
      );

      // Show loading toast
      const toastId = toast.loading('Uploading logo...');
      
      // Update product with new image
      const updates = {
        images: [{
          url: imageUrl,
          isPrimary: true,
          alt: `${productName} logo`
        }],
        imageUrl: imageUrl
      };

      await handleUpdateProduct(productId, updates);
      
      // Show success message
      toast.success(`Logo updated for "${productName}"`, { id: toastId });
      console.log(`✅ Logo updated for product: ${productName}`);
    } catch (error) {
      console.error('Error uploading product logo:', error);
      // Revert optimistic update
      fetchProducts();
      toast.error('Failed to upload logo. Please try again.');
    }
  };

  const handleViewInvoice = async (invoice) => {
    try {
      // Fetch detailed invoice data
      const response = await vendorApiService.getInvoice(invoice._id);
      if (response.success) {
        setSelectedInvoice(response.data.invoice);
        setShowInvoiceViewModal(true);
      } else {
        // Fallback to basic invoice data
        setSelectedInvoice(invoice);
        setShowInvoiceViewModal(true);
      }
    } catch (error) {
      console.error('Error fetching invoice details:', error);
      // Fallback to basic invoice data
      setSelectedInvoice(invoice);
      setShowInvoiceViewModal(true);
    }
  };

  const handleDownloadInvoice = async (invoiceId) => {
    try {
      // Show loading state
      const toastId = toast.loading('Generating PDF...');
      
      console.log('🔄 Starting invoice download for ID:', invoiceId);
      console.log('📋 Selected invoice:', selectedInvoice);
      console.log('🏢 Vendor data:', vendor);
      console.log('👤 User data:', user);
      
      // Try to get invoice download URL from API
      try {
        const response = await vendorApiService.downloadInvoice(invoiceId);
        if (response.success && response.data.downloadUrl) {
          // Open download URL in new tab
          window.open(response.data.downloadUrl, '_blank');
          toast.success('PDF downloaded successfully!', { id: toastId });
          return;
        }
      } catch (apiError) {
        console.log('API download not available, generating client-side PDF...');
      }

      // Fallback: Generate PDF client-side using the invoice data
      if (selectedInvoice) {
        // Get vendor info from dashboardData or profile
        const vendorInfo = dashboardData?.vendor || profile || {};
        console.log('🏢 Using vendor info for PDF:', vendorInfo);
        
        await generateInvoicePDF(selectedInvoice, vendorInfo, user);
        toast.success('PDF generated and downloaded!', { id: toastId });
      } else {
        console.error('❌ No selected invoice data available');
        toast.error('Invoice data not available', { id: toastId });
      }
    } catch (error) {
      console.error('❌ Error downloading invoice:', error);
      toast.error('Failed to download invoice: ' + (error.message || 'Unknown error'));
    }
  };

  // Generate PDF client-side using jsPDF from CDN (webpack-safe)
  const generateInvoicePDF = async (invoice, vendorInfo, userInfo) => {
    try {
      console.log('🔄 Starting PDF generation for invoice:', invoice.invoiceNumber);
      console.log('📋 Invoice data:', invoice);
      console.log('🏢 Vendor info:', vendorInfo);
      
      // Use jsPDF from global CDN (loaded in index.html)
      const jsPDF = window.jspdf?.jsPDF || window.jsPDF;
      
      if (!jsPDF) {
        throw new Error('jsPDF library not available. Please ensure the page has loaded completely.');
      }
      
      console.log('✅ jsPDF loaded successfully from CDN');
      
      // Create new PDF document
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      console.log('✅ PDF document created');

      // Set font
      doc.setFont('helvetica');
      
      // Page dimensions
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
      
      let yPosition = margin;
      
      // Helper function to add text with word wrap
      const addText = (text, x, y, options = {}) => {
        try {
          const fontSize = options.fontSize || 10;
          const maxWidth = options.maxWidth || contentWidth;
          const align = options.align || 'left';
          
          doc.setFontSize(fontSize);
          if (options.bold) doc.setFont('helvetica', 'bold');
          else doc.setFont('helvetica', 'normal');
          
          if (options.color && Array.isArray(options.color)) {
            doc.setTextColor(options.color[0], options.color[1], options.color[2]);
          } else {
            doc.setTextColor(0, 0, 0);
          }
          
          const lines = doc.splitTextToSize(String(text), maxWidth);
          
          if (align === 'center') {
            x = pageWidth / 2;
            doc.text(lines, x, y, { align: 'center' });
          } else if (align === 'right') {
            doc.text(lines, x, y, { align: 'right' });
          } else {
            doc.text(lines, x, y);
          }
          
          return y + (lines.length * fontSize * 0.35);
        } catch (textError) {
          console.error('Error adding text:', textError);
          return y + 5; // Return a safe fallback position
        }
      };
      
      try {
        // Header
        doc.setDrawColor(37, 99, 235); // Blue color
        doc.setLineWidth(2);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 10;
        
        // Invoice title and number
        yPosition = addText('INVOICE', margin, yPosition, { fontSize: 24, bold: true, color: [37, 99, 235] });
        yPosition = addText(`#${invoice.invoiceNumber}`, margin, yPosition, { fontSize: 14, color: [102, 102, 102] });
        
        // Status and date (right aligned)
        const statusY = yPosition - 20;
        addText(invoice.status?.toUpperCase() || 'PENDING', pageWidth - margin, statusY, { 
          fontSize: 12, bold: true, align: 'right', color: [16, 185, 129] 
        });
        addText(new Date(invoice.date || invoice.createdAt).toLocaleDateString('en-IN'), 
          pageWidth - margin, statusY + 8, { fontSize: 10, align: 'right', color: [102, 102, 102] });
        
        yPosition += 20;
        
        // From and To sections
        const leftColX = margin;
        const rightColX = pageWidth / 2 + 10;
        const sectionY = yPosition;
        
        // FROM (Vendor)
        yPosition = addText('FROM (VENDOR)', leftColX, sectionY, { fontSize: 10, bold: true, color: [55, 65, 81] });
        yPosition = addText(vendorInfo?.companyName || userInfo?.companyName || 'TATA Motors Ltd', 
          leftColX, yPosition + 5, { fontSize: 12, bold: true });
        yPosition = addText(vendorInfo?.address || 'Mumbai, Maharashtra, India', 
          leftColX, yPosition + 3, { fontSize: 10, color: [102, 102, 102] });
        yPosition = addText(`Email: ${vendorInfo?.email || userInfo?.email || 'vendor@yatrik.com'}`, 
          leftColX, yPosition + 3, { fontSize: 10, color: [102, 102, 102] });
        yPosition = addText(`Phone: ${vendorInfo?.phone || userInfo?.phone || '+91-9876543210'}`, 
          leftColX, yPosition + 3, { fontSize: 10, color: [102, 102, 102] });
        
        if (vendorInfo?.gstNumber) {
          yPosition = addText(`GST: ${vendorInfo.gstNumber}`, 
            leftColX, yPosition + 3, { fontSize: 10, color: [102, 102, 102] });
        }
        
        // TO (Client)
        let rightY = sectionY;
        rightY = addText('TO (CLIENT)', rightColX, rightY, { fontSize: 10, bold: true, color: [55, 65, 81] });
        rightY = addText(invoice.clientName || 'YATRIK ERP', 
          rightColX, rightY + 5, { fontSize: 12, bold: true });
        rightY = addText(invoice.clientAddress || 'Kochi, Kerala, India', 
          rightColX, rightY + 3, { fontSize: 10, color: [102, 102, 102] });
        rightY = addText(`Email: ${invoice.clientEmail || 'admin@yatrikerp.com'}`, 
          rightColX, rightY + 3, { fontSize: 10, color: [102, 102, 102] });
        
        yPosition = Math.max(yPosition, rightY) + 20;
        
        // Invoice details boxes
        const boxWidth = contentWidth / 3 - 5;
        const boxHeight = 15;
        
        // Invoice Date
        doc.setFillColor(249, 250, 251);
        doc.rect(margin, yPosition, boxWidth, boxHeight, 'F');
        doc.setDrawColor(229, 231, 235);
        doc.rect(margin, yPosition, boxWidth, boxHeight);
        addText('Invoice Date', margin + 2, yPosition + 5, { fontSize: 8, color: [102, 102, 102] });
        addText(new Date(invoice.date || invoice.createdAt).toLocaleDateString('en-IN'), 
          margin + 2, yPosition + 10, { fontSize: 10, bold: true });
        
        // Due Date
        const dueDateX = margin + boxWidth + 5;
        doc.setFillColor(249, 250, 251);
        doc.rect(dueDateX, yPosition, boxWidth, boxHeight, 'F');
        doc.rect(dueDateX, yPosition, boxWidth, boxHeight);
        addText('Due Date', dueDateX + 2, yPosition + 5, { fontSize: 8, color: [102, 102, 102] });
        addText(invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-IN') : 'N/A', 
          dueDateX + 2, yPosition + 10, { fontSize: 10, bold: true });
        
        // PO Number
        const poX = dueDateX + boxWidth + 5;
        doc.setFillColor(249, 250, 251);
        doc.rect(poX, yPosition, boxWidth, boxHeight, 'F');
        doc.rect(poX, yPosition, boxWidth, boxHeight);
        addText('PO Number', poX + 2, yPosition + 5, { fontSize: 8, color: [102, 102, 102] });
        addText(invoice.poNumber || 'N/A', poX + 2, yPosition + 10, { fontSize: 10, bold: true });
        
        yPosition += boxHeight + 20;
        
        // Invoice Items Table
        yPosition = addText('Invoice Items', margin, yPosition, { fontSize: 14, bold: true });
        yPosition += 10;
        
        // Table header
        const tableY = yPosition;
        const colWidths = [contentWidth * 0.4, contentWidth * 0.15, contentWidth * 0.2, contentWidth * 0.25];
        const colX = [margin, margin + colWidths[0], margin + colWidths[0] + colWidths[1], margin + colWidths[0] + colWidths[1] + colWidths[2]];
        
        doc.setFillColor(249, 250, 251);
        doc.rect(margin, tableY, contentWidth, 10, 'F');
        doc.setDrawColor(229, 231, 235);
        doc.rect(margin, tableY, contentWidth, 10);
        
        addText('Description', colX[0] + 2, tableY + 6, { fontSize: 10, bold: true });
        addText('Qty', colX[1] + 2, tableY + 6, { fontSize: 10, bold: true });
        addText('Unit Price', colX[2] + 2, tableY + 6, { fontSize: 10, bold: true });
        addText('Total', colX[3] + 2, tableY + 6, { fontSize: 10, bold: true });
        
        yPosition = tableY + 10;
        
        // Table rows
        if (invoice.items && invoice.items.length > 0) {
          invoice.items.forEach((item, index) => {
            const rowHeight = 15;
            
            // Alternate row colors
            if (index % 2 === 1) {
              doc.setFillColor(248, 250, 252);
              doc.rect(margin, yPosition, contentWidth, rowHeight, 'F');
            }
            
            doc.setDrawColor(243, 244, 246);
            doc.rect(margin, yPosition, contentWidth, rowHeight);
            
            // Item details
            const itemName = item.description || item.productName || `Item ${index + 1}`;
            addText(itemName, colX[0] + 2, yPosition + 6, { fontSize: 10 });
            if (item.productCode) {
              addText(`Code: ${item.productCode}`, colX[0] + 2, yPosition + 11, { fontSize: 8, color: [102, 102, 102] });
            }
            
            addText((item.quantity || 1).toString(), colX[1] + 2, yPosition + 6, { fontSize: 10 });
            addText(`Rs.${(item.unitPrice || item.price || 0).toLocaleString('en-IN')}`, colX[2] + 2, yPosition + 6, { fontSize: 10 });
            addText(`Rs.${((item.quantity || 1) * (item.unitPrice || item.price || 0)).toLocaleString('en-IN')}`, 
              colX[3] + 2, yPosition + 6, { fontSize: 10, bold: true });
            
            yPosition += rowHeight;
          });
        } else {
          const rowHeight = 20;
          doc.rect(margin, yPosition, contentWidth, rowHeight);
          addText('No items found', margin + contentWidth/2, yPosition + 12, { fontSize: 10, align: 'center', color: [102, 102, 102] });
          yPosition += rowHeight;
        }
        
        yPosition += 20;
        
        // Summary section
        const summaryX = pageWidth - margin - 80;
        const summaryWidth = 80;
        
        doc.setFillColor(249, 250, 251);
        doc.rect(summaryX, yPosition, summaryWidth, 40, 'F');
        doc.setDrawColor(229, 231, 235);
        doc.rect(summaryX, yPosition, summaryWidth, 40);
        
        let summaryY = yPosition + 8;
        
        // Subtotal
        addText('Subtotal:', summaryX + 5, summaryY, { fontSize: 10 });
        addText(`Rs.${(invoice.subtotal || invoice.amount || 0).toLocaleString('en-IN')}`, 
          summaryX + summaryWidth - 5, summaryY, { fontSize: 10, align: 'right' });
        summaryY += 8;
        
        // Tax
        if (invoice.taxAmount) {
          addText(`Tax (${invoice.taxRate || 18}%):`, summaryX + 5, summaryY, { fontSize: 10 });
          addText(`Rs.${invoice.taxAmount.toLocaleString('en-IN')}`, 
            summaryX + summaryWidth - 5, summaryY, { fontSize: 10, align: 'right' });
          summaryY += 8;
        }
        
        // Calculate correct total
        const calculatedSubtotal = invoice.items && invoice.items.length > 0 
          ? invoice.items.reduce((sum, item) => sum + ((item.quantity || 1) * (item.unitPrice || item.price || 0)), 0)
          : (invoice.subtotal || invoice.amount || 0);
        
        const calculatedTax = invoice.taxAmount || (calculatedSubtotal * (invoice.taxRate || 18) / 100);
        const calculatedTotal = calculatedSubtotal + calculatedTax;
        
        // Total
        doc.setDrawColor(37, 99, 235);
        doc.line(summaryX + 5, summaryY, summaryX + summaryWidth - 5, summaryY);
        summaryY += 5;
        
        addText('Total Amount:', summaryX + 5, summaryY, { fontSize: 12, bold: true, color: [37, 99, 235] });
        addText(`Rs.${calculatedTotal.toLocaleString('en-IN')}`, 
          summaryX + summaryWidth - 5, summaryY, { fontSize: 12, bold: true, align: 'right', color: [37, 99, 235] });
        
        yPosition += 60;
        
        // Payment Information (if available)
        if (invoice.paymentStatus || invoice.paymentDate || invoice.paymentMethod) {
          yPosition = addText('Payment Information', margin, yPosition, { fontSize: 12, bold: true, color: [29, 78, 216] });
          yPosition += 5;
          
          if (invoice.paymentStatus) {
            yPosition = addText(`Status: ${invoice.paymentStatus.toUpperCase()}`, margin, yPosition, { fontSize: 10 });
          }
          if (invoice.paymentDate) {
            yPosition = addText(`Date: ${new Date(invoice.paymentDate).toLocaleDateString('en-IN')}`, margin, yPosition, { fontSize: 10 });
          }
          if (invoice.paymentMethod) {
            yPosition = addText(`Method: ${invoice.paymentMethod}`, margin, yPosition, { fontSize: 10 });
          }
          yPosition += 10;
        }
        
        // Notes (if available)
        if (invoice.notes) {
          yPosition = addText('Notes', margin, yPosition, { fontSize: 12, bold: true });
          yPosition = addText(invoice.notes, margin, yPosition + 3, { fontSize: 10, color: [102, 102, 102] });
          yPosition += 10;
        }
        
        // Terms & Conditions
        yPosition = addText('Terms & Conditions', margin, yPosition, { fontSize: 10, bold: true });
        const terms = [
          '• Payment is due within 30 days of invoice date',
          '• Late payments may incur additional charges',
          '• All disputes must be reported within 7 days',
          '• This is a computer-generated invoice'
        ];
        
        terms.forEach(term => {
          yPosition = addText(term, margin, yPosition + 3, { fontSize: 8, color: [102, 102, 102] });
        });
        
        // Footer
        yPosition = pageHeight - 30;
        doc.setDrawColor(229, 231, 235);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 5;
        
        addText(`Generated on ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN')}`, 
          pageWidth / 2, yPosition, { fontSize: 8, align: 'center', color: [102, 102, 102] });
        addText('This is a computer-generated invoice and does not require a signature', 
          pageWidth / 2, yPosition + 5, { fontSize: 8, align: 'center', color: [102, 102, 102] });
        
        console.log('✅ PDF content generated successfully');
        
        // Save the PDF
        const filename = `Invoice_${invoice.invoiceNumber}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(filename);
        
        console.log('✅ PDF saved successfully:', filename);
        
      } catch (pdfError) {
        console.error('❌ Error during PDF generation:', pdfError);
        throw pdfError;
      }
      
    } catch (error) {
      console.error('❌ Error generating PDF:', error);
      console.error('❌ Error stack:', error.stack);
      
      // Enhanced fallback: Create a well-formatted text invoice
      const invoiceText = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                                   INVOICE                                    ║
║                              #${invoice.invoiceNumber}                                ║
╚══════════════════════════════════════════════════════════════════════════════╝

📅 Date: ${new Date(invoice.date || invoice.createdAt).toLocaleDateString('en-IN')}
📋 PO Number: ${invoice.poNumber || 'N/A'}
🏷️  Status: ${invoice.status?.toUpperCase() || 'PENDING'}

┌─ FROM (VENDOR) ──────────────────────────────────────────────────────────────┐
│ ${vendorInfo?.companyName || userInfo?.companyName || 'Vendor Company'}
│ ${vendorInfo?.address || 'Vendor Address'}
│ 📧 ${vendorInfo?.email || userInfo?.email || 'vendor@example.com'}
│ 📞 ${vendorInfo?.phone || userInfo?.phone || 'N/A'}
${vendorInfo?.gstNumber ? `│ 🏛️  GST: ${vendorInfo.gstNumber}` : ''}
└──────────────────────────────────────────────────────────────────────────────┘

┌─ TO (CLIENT) ────────────────────────────────────────────────────────────────┐
│ ${invoice.clientName || 'YATRIK ERP'}
│ ${invoice.clientAddress || 'Client Address'}
│ 📧 ${invoice.clientEmail || 'admin@yatrikerp.com'}
└──────────────────────────────────────────────────────────────────────────────┘

┌─ INVOICE ITEMS ──────────────────────────────────────────────────────────────┐
${invoice.items && invoice.items.length > 0 ? 
  invoice.items.map((item, index) => 
    `│ ${index + 1}. ${item.description || item.productName || 'Item'}
│    Code: ${item.productCode || 'N/A'}
│    Quantity: ${item.quantity || 1} × Rs.${(item.unitPrice || item.price || 0).toLocaleString('en-IN')} = Rs.${((item.quantity || 1) * (item.unitPrice || item.price || 0)).toLocaleString('en-IN')}
│`
  ).join('\n') : 
  '│ No items found'
}
└──────────────────────────────────────────────────────────────────────────────┘

┌─ FINANCIAL SUMMARY ──────────────────────────────────────────────────────────┐
│ Subtotal:     Rs.${(invoice.subtotal || invoice.amount || 0).toLocaleString('en-IN')}
${invoice.taxAmount ? `│ Tax (${invoice.taxRate || 18}%):      Rs.${invoice.taxAmount.toLocaleString('en-IN')}` : ''}
│ ═══════════════════════════════════════════════════════════════════════════
│ TOTAL AMOUNT: Rs.${(invoice.amount || invoice.totalAmount || 0).toLocaleString('en-IN')}
└──────────────────────────────────────────────────────────────────────────────┘

${invoice.paymentStatus ? `
┌─ PAYMENT INFORMATION ────────────────────────────────────────────────────────┐
│ Status: ${invoice.paymentStatus?.toUpperCase() || 'PENDING'}
${invoice.paymentDate ? `│ Date: ${new Date(invoice.paymentDate).toLocaleDateString('en-IN')}` : ''}
${invoice.paymentMethod ? `│ Method: ${invoice.paymentMethod}` : ''}
└──────────────────────────────────────────────────────────────────────────────┘
` : ''}

${invoice.notes ? `
┌─ NOTES ──────────────────────────────────────────────────────────────────────┐
│ ${invoice.notes}
└──────────────────────────────────────────────────────────────────────────────┘
` : ''}

┌─ TERMS & CONDITIONS ─────────────────────────────────────────────────────────┐
│ • Payment is due within 30 days of invoice date
│ • Late payments may incur additional charges
│ • All disputes must be reported within 7 days
│ • This is a computer-generated invoice
└──────────────────────────────────────────────────────────────────────────────┘

Generated on ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN')}
This is a computer-generated invoice.

⚠️  PDF generation failed. This text version contains all invoice information.
      `;

      console.log('⚠️ PDF generation failed, creating enhanced text fallback...');

      // Create text file download as fallback
      const blob = new Blob([invoiceText], { type: 'text/plain; charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice_${invoice.invoiceNumber}_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      throw new Error('PDF generation failed: ' + error.message + '. Downloaded as enhanced text file instead.');
    }
  };

  const handleUpdateProfile = async (profileData) => {
    try {
      setUpdatingProfile(true);
      
      // Optimistic update - show instantly in all places
      // Update profile state
      setProfile(prevProfile => ({
        ...prevProfile,
        ...profileData,
        _isUpdating: true,
        _lastUpdated: Date.now()
      }));

      // Update dashboardData vendor info instantly
      setDashboardData(prevData => ({
        ...prevData,
        vendor: {
          ...prevData?.vendor,
          ...profileData
        }
      }));

      const response = await vendorApiService.updateProfile(profileData);
      
      if (response.success) {
        toast.success('Profile updated successfully!');
        // Update with server response
        const updatedVendor = response.data.vendor || profileData;
        setProfile(updatedVendor);
        
        // Update dashboardData with server response
        setDashboardData(prevData => ({
          ...prevData,
          vendor: {
            ...prevData?.vendor,
            ...updatedVendor
          }
        }));
        
        setShowEditProfileModal(false);
        setEditingProfile(null);
      } else {
        // Revert optimistic update on error
        fetchProfile();
        fetchDashboardData();
        toast.error(response.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      // Revert optimistic update
      fetchProfile();
      fetchDashboardData();
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleLogoUploadClick = (productId, productName) => {
    // Create a modal-like prompt for image URL
    const imageUrl = prompt(`Enter image URL for "${productName}":\n\nYou can paste a direct image link or URL.\n\nExample: https://example.com/image.jpg`, '');
    
    if (imageUrl && imageUrl.trim()) {
      // Validate URL format
      try {
        new URL(imageUrl);
        handleUploadProductLogo(productId, imageUrl.trim());
      } catch (e) {
        toast.error('Please enter a valid URL (e.g., https://example.com/image.jpg)');
      }
    }
  };

  const handleLogoFileUpload = (productId, productName) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }

      toast.info('File upload detected. Please use a cloud storage service (e.g., Imgur, Cloudinary) to get a URL, or use the URL input option by clicking the image again.');
      
      // Alternative: You can create an upload endpoint and use FormData
      // const formData = new FormData();
      // formData.append('image', file);
      // const response = await apiFetch(`/api/products/${productId}/upload-image`, {
      //   method: 'POST',
      //   body: formData
      // });
      // if (response.ok && response.data.success) {
      //   handleUploadProductLogo(productId, response.data.data.imageUrl);
      // }
    };
    input.click();
  };

  const fetchInvoices = async () => {
    try {
      const response = await vendorApiService.getInvoices();
      if (response.success) {
        setInvoices(response.data.invoices || []);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
  };

  const fetchPayments = async () => {
    try {
      const response = await vendorApiService.getPayments();
      if (response.success) {
        setPayments(response.data);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  const fetchPerformance = async () => {
    try {
      const response = await vendorApiService.getPerformance();
      if (response.success) {
        setPerformance(response.data);
      }
    } catch (error) {
      console.error('Error fetching performance:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await apiFetch('/api/products/vendor/my-products');
      if (response.ok && response.data.success) {
        const fetchedProducts = response.data.data.products || [];
        // Smart merge: preserve any optimistic updates that haven't been confirmed yet
        setProducts(prevProducts => {
          if (prevProducts.length === 0) {
            return fetchedProducts;
          }
          // Create a map for quick lookup
          const productMap = new Map();
          // First, add all fetched products (server state)
          fetchedProducts.forEach(p => productMap.set(p._id, p));
          // Then, check if any prev products have recent optimistic updates
          // (products that were updated in the last 2 seconds)
          const now = Date.now();
          prevProducts.forEach(p => {
            const existing = productMap.get(p._id);
            if (!existing || (p._lastUpdated && (now - p._lastUpdated) < 2000)) {
              // Keep optimistic update if it's very recent
              productMap.set(p._id, p);
            }
          });
          return Array.from(productMap.values());
        });
        
        // Check for low stock and create alerts
        checkLowStock(fetchedProducts);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  // Check for low stock products and create alerts
  const checkLowStock = (productsList) => {
    const lowStockProducts = productsList.filter(p => {
      const stock = p.stock?.quantity || 0;
      const minStock = p.stock?.minQuantity || 10;
      return stock <= minStock && stock > 0;
    });

    const outOfStockProducts = productsList.filter(p => {
      const stock = p.stock?.quantity || 0;
      return stock === 0;
    });

    // Create alerts for low stock
    const newAlerts = [];
    lowStockProducts.forEach(product => {
      const existingAlert = stockAlerts.find(a => a.productId === product._id);
      if (!existingAlert) {
        newAlerts.push({
          id: `low-stock-${product._id}`,
          productId: product._id,
          productName: product.productName,
          productCode: product.productCode,
          currentStock: product.stock?.quantity || 0,
          minStock: product.stock?.minQuantity || 10,
          type: 'low_stock',
          timestamp: Date.now()
        });
      }
    });

    // Create alerts for out of stock
    outOfStockProducts.forEach(product => {
      const existingAlert = stockAlerts.find(a => a.productId === product._id);
      if (!existingAlert) {
        newAlerts.push({
          id: `out-of-stock-${product._id}`,
          productId: product._id,
          productName: product.productName,
          productCode: product.productCode,
          currentStock: 0,
          type: 'out_of_stock',
          timestamp: Date.now()
        });
      }
    });

    if (newAlerts.length > 0) {
      setStockAlerts(prev => [...newAlerts, ...prev]);
    }

    // Remove alerts for products that are no longer low/out of stock
    setStockAlerts(prev => prev.filter(alert => {
      const product = productsList.find(p => p._id === alert.productId);
      if (!product) return false;
      const stock = product.stock?.quantity || 0;
      const minStock = product.stock?.minQuantity || 10;
      if (alert.type === 'low_stock' && stock > minStock) return false;
      if (alert.type === 'out_of_stock' && stock > 0) return false;
      return true;
    }));
  };

  // Quick stock increase/decrease
  const handleQuickStockUpdate = async (productId, operation, amount = 1) => {
    try {
      const product = products.find(p => p._id === productId);
      if (!product) return;

      const currentStock = product.stock?.quantity || 0;
      let newStock;

      if (operation === 'increase') {
        newStock = currentStock + amount;
      } else if (operation === 'decrease') {
        newStock = Math.max(0, currentStock - amount);
      } else {
        return;
      }

      // Optimistic update
      setProducts(prevProducts =>
        prevProducts.map(p =>
          p._id === productId
            ? {
                ...p,
                stock: { ...p.stock, quantity: newStock },
                _isUpdating: true,
                _lastUpdated: Date.now()
              }
            : p
        )
      );

      // Update via API
      const response = await apiFetch(`/api/products/${productId}/stock`, {
        method: 'PATCH',
        body: JSON.stringify({
          quantity: newStock,
          operation: 'set'
        }),
      });

      if (response.ok && response.data.success) {
        const serverProduct = response.data.data.product;
        setProducts(prevProducts =>
          prevProducts.map(p =>
            p._id === productId ? { ...p, ...serverProduct, _isUpdating: false } : p
          )
        );
        
        // Check for low stock after update
        fetchProducts();
      } else {
        fetchProducts();
      }
    } catch (error) {
      console.error('Error updating stock:', error);
      fetchProducts();
    }
  };

  const fetchAlerts = async () => {
    try {
      const response = await vendorApiService.getAlerts();
      if (response.success) {
        setAlerts(response.data.alerts || []);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
      setAlerts([]);
    }
  };

  // Check for new approved purchase orders
  const checkForNewPOs = async () => {
    try {
      if (!user || (!user.vendorId && !user._id)) {
        return; // Don't check if user is not available
      }

      const response = await vendorApiService.getPurchaseOrders({ 
        status: 'pending',
        limit: 10,
        sortBy: 'orderDate',
        sortOrder: 'desc'
      });
      
      if (response.success && response.data.purchaseOrders) {
        const newPOs = response.data.purchaseOrders;
        
        // If we have a baseline timestamp, check for new POs
        if (lastCheckedPOTimestamp) {
          const newPOsFound = newPOs.filter(po => {
            const poDate = new Date(po.orderDate || po.createdAt || po.updatedAt);
            const lastChecked = new Date(lastCheckedPOTimestamp);
            return poDate > lastChecked;
          });
          
          // Show notification for each new PO (only show one at a time)
          if (newPOsFound.length > 0 && !showPONotification) {
            showPONotificationPopup(newPOsFound[0]);
          }
        } else {
          // First time - set baseline timestamp to the most recent PO or now
          if (newPOs.length > 0) {
            const mostRecentPO = newPOs[0];
            const mostRecentDate = new Date(mostRecentPO.orderDate || mostRecentPO.createdAt || mostRecentPO.updatedAt);
            setLastCheckedPOTimestamp(mostRecentDate.toISOString());
          } else {
            // No POs yet, set baseline to now
            setLastCheckedPOTimestamp(new Date().toISOString());
          }
        }
        
        // Update last checked timestamp to the most recent PO date
        if (newPOs.length > 0) {
          const mostRecentPO = newPOs[0];
          const mostRecentDate = new Date(mostRecentPO.orderDate || mostRecentPO.createdAt || mostRecentPO.updatedAt);
          setLastCheckedPOTimestamp(mostRecentDate.toISOString());
        }
      }
    } catch (error) {
      console.error('Error checking for new POs:', error);
    }
  };

  // Show PO notification popup
  const showPONotificationPopup = (po) => {
    const notification = {
      id: po._id || Date.now(),
      poNumber: po.poNumber,
      depotName: po.depotId?.depotName || po.depotName || 'Depot',
      totalAmount: po.totalAmount || 0,
      itemCount: po.items?.length || 0,
      orderDate: po.orderDate || po.createdAt,
      timestamp: new Date()
    };
    
    setCurrentPONotification(notification);
    setShowPONotification(true);
    
    // Add to notifications list
    setPoNotifications(prev => [notification, ...prev]);
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
      setShowPONotification(false);
    }, 10000);
  };

  // Handle notification close
  const handleCloseNotification = () => {
    setShowPONotification(false);
    setCurrentPONotification(null);
  };

  // Handle view PO from notification
  const handleViewPO = () => {
    if (currentPONotification) {
      setActiveTab('purchase-orders');
      setShowPONotification(false);
      // Refresh purchase orders to show the new one
      fetchPurchaseOrders();
    }
  };

  const fetchAuctions = async () => {
    try {
      const response = await apiFetch('/api/vendor/auctions');
      if (response.ok && response.data.success) {
        setAuctions(response.data.data.auctions || []);
      }
    } catch (error) {
      console.error('Error fetching auctions:', error);
      setAuctions([]);
    }
  };

  const fetchDeliveries = async () => {
    try {
      // Fetch purchase orders that are dispatched, in transit, or delivered for tracking
      const response = await apiFetch('/api/vendor/purchase-orders?status=dispatched_awaiting_payment,in_progress,delivered,completed');
      if (response.ok && response.data.success) {
        const orders = response.data.data.purchaseOrders || response.data.data || [];
        setDeliveries(orders);
      }
    } catch (error) {
      console.error('Error fetching deliveries:', error);
      setDeliveries([]);
    }
  };

  // Generate timeline activities for a purchase order
  const getOrderTimeline = (po) => {
    const timeline = [];
    
    // Order Created
    if (po.orderDate) {
      timeline.push({
        status: 'ordered',
        title: 'Order Placed',
        description: `Purchase order ${po.poNumber} was created`,
        date: po.orderDate,
        completed: true,
        icon: FileText
      });
    }

    // Order Accepted
    if (po.status === 'accepted' || po.acceptedDate) {
      timeline.push({
        status: 'accepted',
        title: 'Order Accepted',
        description: 'You accepted the purchase order',
        date: po.acceptedDate || po.orderDate,
        completed: true,
        icon: CheckCircle
      });
    }

    // Dispatched
    if (po.status === 'dispatched_awaiting_payment' || po.dispatchDate) {
      timeline.push({
        status: 'dispatched',
        title: 'Order Dispatched',
        description: po.trackingNumber ? `Dispatched via ${po.shippingMethod || 'Vehicle'} - LR: ${po.trackingNumber}` : 'Order has been dispatched',
        date: po.dispatchDate || po.orderDate,
        completed: true,
        icon: Truck
      });
    }

    // Payment Received (if applicable)
    if (po.paymentStatus === 'paid' || po.paymentDate) {
      timeline.push({
        status: 'payment_received',
        title: 'Payment Received',
        description: `Payment of ₹${(po.totalAmount || 0).toLocaleString('en-IN')} received`,
        date: po.paymentDate || po.orderDate,
        completed: true,
        icon: DollarSign
      });
    }

    // In Transit
    if (po.status === 'in_progress' && po.deliveryStatus?.status === 'in_transit') {
      timeline.push({
        status: 'in_transit',
        title: 'In Transit',
        description: po.trackingNumber ? `Order is on the way - Tracking: ${po.trackingNumber}` : 'Order is on the way to depot',
        date: po.dispatchDate || po.orderDate,
        completed: true,
        icon: Truck
      });
    }

    // Out for Delivery
    if (po.deliveryStatus?.status === 'in_transit' && po.expectedDeliveryDate) {
      const expectedDate = new Date(po.expectedDeliveryDate);
      const today = new Date();
      if (expectedDate <= today) {
        timeline.push({
          status: 'out_for_delivery',
          title: 'Out for Delivery',
          description: `Expected delivery: ${expectedDate.toLocaleDateString()}`,
          date: po.expectedDeliveryDate,
          completed: false,
          icon: Package
        });
      }
    }

    // Delivered
    if (po.status === 'delivered' || po.actualDeliveryDate) {
      timeline.push({
        status: 'delivered',
        title: 'Delivered',
        description: 'Order has been delivered successfully',
        date: po.actualDeliveryDate || po.expectedDeliveryDate,
        completed: true,
        icon: CheckCircle
      });
    }

    return timeline.sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const fetchCompliance = async () => {
    try {
      const response = await vendorApiService.getCompliance();
      if (response.success) {
        setCompliance(response.data);
      }
    } catch (error) {
      console.error('Error fetching compliance:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchAlerts();
    } else if (activeTab === 'profile') {
      fetchProfile();
    } else if (activeTab === 'purchase-orders') {
      // Always fetch purchase orders when tab is active
      // Reset filters to show all statuses (including 'pending' which is set when admin approves)
      console.log('🔄 [VendorDashboard] Purchase Orders tab activated, fetching POs...');
      // Force fetch with empty status to show all including 'pending' (approved by admin)
      fetchPurchaseOrders({ status: '', page: 1, search: '' });
      // Set up auto-refresh for purchase orders (real-time updates when admin approves)
      const poInterval = setInterval(() => {
        console.log('🔄 [VendorDashboard] Auto-refreshing purchase orders...');
        fetchPurchaseOrders({ status: '', page: 1, search: poFilters.search || '' });
      }, 10000); // Refresh every 10 seconds for real-time PO updates
      return () => clearInterval(poInterval);
    } else if (activeTab === 'invoices') {
      fetchInvoices();
      // Set up auto-refresh for invoices (real-time updates when payment received)
      const invoicesInterval = setInterval(() => {
        fetchInvoices();
      }, 5000); // Refresh every 5 seconds for real-time invoice updates
      return () => clearInterval(invoicesInterval);
    } else if (activeTab === 'payments') {
      fetchPayments();
      // Set up auto-refresh for payments (real-time updates when payment received)
      const paymentsInterval = setInterval(() => {
        fetchPayments();
      }, 5000); // Refresh every 5 seconds for real-time payment updates
      return () => clearInterval(paymentsInterval);
    } else if (activeTab === 'deliveries') {
      // Fetch purchase orders with delivered status for delivery confirmation
      fetchPurchaseOrders({ status: 'delivered', page: 1, search: '' });
      // Set up auto-refresh for deliveries (real-time updates when payment received)
      const deliveriesInterval = setInterval(() => {
        fetchPurchaseOrders({ status: 'delivered', page: 1, search: '' });
      }, 5000); // Refresh every 5 seconds for real-time delivery updates
      return () => clearInterval(deliveriesInterval);
    } else if (activeTab === 'ledger') {
      fetchLedger();
      // Set up auto-refresh for ledger (real-time updates when payment received)
      const ledgerInterval = setInterval(() => {
        fetchLedger();
      }, 5000); // Refresh every 5 seconds for real-time ledger updates
      return () => clearInterval(ledgerInterval);
    } else if (activeTab === 'performance') {
      fetchPerformance();
    } else if (activeTab === 'products') {
      fetchProducts();
      // Set up auto-refresh for products tab (real-time updates)
      const productsInterval = setInterval(() => {
        fetchProducts();
      }, 5000); // Refresh every 5 seconds for real-time stock updates
      
      return () => clearInterval(productsInterval);
    } else if (activeTab === 'auctions') {
      fetchAuctions();
    } else if (activeTab === 'deliveries') {
      fetchDeliveries();
    } else if (activeTab === 'compliance') {
      fetchCompliance();
    }
  }, [activeTab]);

  // Auto-refresh purchase orders every 30 seconds when on purchase-orders tab
  useEffect(() => {
    if (activeTab === 'purchase-orders') {
      const refreshInterval = setInterval(() => {
        console.log('🔄 [VendorDashboard] Auto-refreshing purchase orders...');
        fetchPurchaseOrders({ status: poFilters.status || '', page: poFilters.page || 1, search: poFilters.search || '' });
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(refreshInterval);
    }
  }, [activeTab, poFilters]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/login');
    }
  };

  // Memoized utility functions for better performance
  const formatCurrency = useCallback((amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  }, []);

  const getStatusBadge = useCallback((status) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      expired: { color: 'bg-red-100 text-red-800', icon: AlertCircle },
    };
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${config.color}`}>
        <Icon className="w-3 h-3" />
        {status}
      </span>
    );
  }, []);

  // Safe computed values (no hooks after early returns to satisfy hook rules)
  const vendor = dashboardData?.vendor || {};
  const stats = dashboardData?.stats || {};

  const filteredProducts = products.filter(product => {
    const matchesSearch = !productSearch || 
      product.productName?.toLowerCase().includes(productSearch.toLowerCase()) ||
      product.productCode?.toLowerCase().includes(productSearch.toLowerCase()) ||
      product.category?.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCategory = productCategoryFilter === 'all' || 
      product.category === productCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (loading && !dashboardData) {
    return (
      <div className="vendor-dashboard-loading">
        <div className="loading-spinner"></div>
        <h3>Loading Vendor Dashboard...</h3>
      </div>
    );
  }

  // Dismiss stock alert
  const dismissStockAlert = (alertId) => {
    setStockAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  return (
    <div className="vendor-dashboard">
      {/* Invoice View Modal */}
      <InvoiceViewModal
        isOpen={showInvoiceViewModal}
        onClose={() => setShowInvoiceViewModal(false)}
        invoice={selectedInvoice}
        vendor={vendor}
        user={user}
        onDownload={handleDownloadInvoice}
        formatCurrency={formatCurrency}
      />

      {/* Stock Alerts (Not Popups - Dismissible Notifications) */}
      {stockAlerts.length > 0 && (
        <div className="stock-alerts-container" style={{
          position: 'fixed',
          top: '80px',
          right: '20px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxWidth: '400px'
        }}>
          {stockAlerts.map(alert => (
            <div
              key={alert.id}
              className="stock-alert"
              style={{
                background: alert.type === 'out_of_stock' 
                  ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                  : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: 'white',
                padding: '16px',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                animation: 'slideInRight 0.3s ease-out'
              }}
            >
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div style={{ flex: 1 }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  marginBottom: '4px'
                }}>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>
                    {alert.type === 'out_of_stock' ? 'Out of Stock!' : 'Low Stock Alert'}
                  </h4>
                  <button
                    onClick={() => dismissStockAlert(alert.id)}
                    style={{
                      background: 'rgba(255,255,255,0.2)',
                      border: 'none',
                      color: 'white',
                      borderRadius: '4px',
                      padding: '4px 12px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 600,
                      transition: 'background 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
                    onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
                  >
                    OK
                  </button>
                </div>
                <p style={{ margin: 0, fontSize: '12px', opacity: 0.95 }}>
                  <strong>{alert.productName}</strong> ({alert.productCode})
                  <br />
                  Current Stock: <strong>{alert.currentStock}</strong>
                  {alert.type === 'low_stock' && ` (Min: ${alert.minStock})`}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PO Notification Popup */}
      {showPONotification && currentPONotification && (
        <div 
          className="po-notification-popup"
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 10000,
            background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 100%)',
            color: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
            minWidth: '350px',
            maxWidth: '450px',
            animation: 'slideInRight 0.3s ease-out'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '50%',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Package className="w-6 h-6" style={{ color: 'white' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                  New Purchase Order Approved!
                </h3>
                <button
                  onClick={handleCloseNotification}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'white'
                  }}
                >
                  ×
                </button>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <p style={{ margin: '4px 0', fontSize: '14px', opacity: 0.9 }}>
                  <strong>PO Number:</strong> {currentPONotification.poNumber}
                </p>
                <p style={{ margin: '4px 0', fontSize: '14px', opacity: 0.9 }}>
                  <strong>From:</strong> {currentPONotification.depotName}
                </p>
                <p style={{ margin: '4px 0', fontSize: '14px', opacity: 0.9 }}>
                  <strong>Items:</strong> {currentPONotification.itemCount} items
                </p>
                <p style={{ margin: '4px 0', fontSize: '14px', opacity: 0.9 }}>
                  <strong>Total:</strong> {formatCurrency(currentPONotification.totalAmount)}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleViewPO}
                  style={{
                    flex: 1,
                    background: 'white',
                    color: '#667eea',
                    border: 'none',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.opacity = '0.9'}
                  onMouseOut={(e) => e.target.style.opacity = '1'}
                >
                  View Purchase Order
                </button>
                <button
                  onClick={handleCloseNotification}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    border: 'none',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
                  onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className="vendor-sidebar">
        <div className="sidebar-header">
          <Building2 className="sidebar-logo" />
          <h2>Vendor Portal</h2>
          <div className="company-name">{vendor.companyName || user?.companyName || 'Vendor'}</div>
        </div>

        <nav className="sidebar-nav">
          {/* Dashboard */}
          <button
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <BarChart3 className="nav-icon" />
            <span>Dashboard</span>
          </button>

          {/* Core Operations Section */}
          <div className="nav-section">
            <div className="nav-section-header">CORE OPERATIONS</div>
            <button
              className={`nav-item ${activeTab === 'products' ? 'active' : ''}`}
              onClick={() => setActiveTab('products')}
            >
              <Package className="nav-icon" />
              <span>Product Management</span>
            </button>
            <button
              className={`nav-item ${activeTab === 'purchase-orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('purchase-orders')}
            >
              <FileText className="nav-icon" />
              <span>Purchase Orders</span>
            </button>
            <button
              className={`nav-item ${activeTab === 'deliveries' ? 'active' : ''}`}
              onClick={() => setActiveTab('deliveries')}
            >
              <Truck className="nav-icon" />
              <span>Delivery Confirmation</span>
            </button>
          </div>

          {/* Financial & Billing Section */}
          <div className="nav-section">
            <div className="nav-section-header">FINANCIAL & BILLING</div>
            <button
              className={`nav-item ${activeTab === 'invoices' ? 'active' : ''}`}
              onClick={() => setActiveTab('invoices')}
            >
              <Receipt className="nav-icon" />
              <span>Invoice & Billing</span>
            </button>
            <button
              className={`nav-item ${activeTab === 'payments' ? 'active' : ''}`}
              onClick={() => setActiveTab('payments')}
            >
              <DollarSign className="nav-icon" />
              <span>Payment Tracking</span>
            </button>
            <button
              className={`nav-item ${activeTab === 'ledger' ? 'active' : ''}`}
              onClick={() => setActiveTab('ledger')}
            >
              <FileText className="nav-icon" />
              <span>Ledger</span>
            </button>
          </div>

          {/* Additional Services Section */}
          <div className="nav-section">
            <div className="nav-section-header">ADDITIONAL SERVICES</div>
            <button
              className={`nav-item ${activeTab === 'auctions' ? 'active' : ''}`}
              onClick={() => setActiveTab('auctions')}
            >
              <Gavel className="nav-icon" />
              <span>Auction Participation</span>
            </button>
            <button
              className={`nav-item ${activeTab === 'compliance' ? 'active' : ''}`}
              onClick={() => setActiveTab('compliance')}
            >
              <Shield className="nav-icon" />
              <span>Compliance & Rating</span>
            </button>
            <button
              className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <Settings className="nav-icon" />
              <span>Profile</span>
            </button>
          </div>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="vendor-main-content">
        {/* Header */}
        <div className="vendor-header">
          <div>
            <h1 className="page-title">
              {activeTab === 'dashboard' && 'Vendor Home Dashboard'}
              {activeTab === 'products' && 'Product Management'}
              {activeTab === 'purchase-orders' && 'Purchase Order Management'}
              {activeTab === 'deliveries' && 'Delivery Confirmation'}
              {activeTab === 'invoices' && 'Invoice & Billing'}
              {activeTab === 'payments' && 'Payment Tracking'}
              {activeTab === 'ledger' && 'Vendor Ledger'}
              {activeTab === 'auctions' && 'Auction Participation'}
              {activeTab === 'compliance' && 'Compliance & Rating'}
              {activeTab === 'profile' && 'Profile & Settings'}
            </h1>
            <p className="page-subtitle">Welcome back, {user?.name || vendor.companyName || 'Vendor'}!</p>
          </div>
          <button className="refresh-btn" onClick={fetchDashboardData}>
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="dashboard-content">
            {/* Alerts Section */}
            {alerts.length > 0 && (
              <div className="alerts-section mb-6">
                <h2 className="section-title flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Alerts & Notifications
                </h2>
                <div className="alerts-grid">
                  {alerts.slice(0, 4).map((alert, idx) => (
                    <div key={idx} className={`alert-card ${alert.type === 'critical' ? 'critical' : alert.type === 'warning' ? 'warning' : 'info'}`}>
                      <div className="flex items-start gap-3">
                        {alert.type === 'critical' ? (
                          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        ) : alert.type === 'warning' ? (
                          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <Bell className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm">{alert.title}</h4>
                          <p className="text-xs text-gray-600 mt-1">{alert.message}</p>
                          <p className="text-xs text-gray-400 mt-1">{new Date(alert.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* KPI Cards */}
            <div className="kpi-grid">
              <div className="kpi-card">
                <div className="kpi-icon orders">
                  <Package className="w-6 h-6" />
                </div>
                <div className="kpi-content">
                  <h3>{stats.activePOs || stats.pendingPOs || 0}</h3>
                  <p>Active Purchase Orders</p>
                  <span className="kpi-subtext">{stats.pendingPOs || 0} pending, {stats.acceptedPOs || 0} accepted</span>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon invoices">
                  <Truck className="w-6 h-6" />
                </div>
                <div className="kpi-content">
                  <h3>{stats.pendingDeliveries || 0}</h3>
                  <p>Pending Deliveries</p>
                  <span className="kpi-subtext">{stats.inProgressDeliveries || 0} in progress</span>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon invoices">
                  <Receipt className="w-6 h-6" />
                </div>
                <div className="kpi-content">
                  <h3>{stats.pendingInvoices || 0}</h3>
                  <p>Invoices Awaiting Payment</p>
                  <span className="kpi-subtext">{stats.approvedInvoices || 0} approved, {stats.submittedInvoices || 0} submitted</span>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon revenue">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div className="kpi-content">
                  <h3>{formatCurrency(stats.totalRevenue || 0)}</h3>
                  <p>Total Revenue</p>
                  <span className="kpi-subtext">{formatCurrency(stats.pendingPayments || 0)} pending payment</span>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon wallet">
                  <Clock className="w-6 h-6" />
                </div>
                <div className="kpi-content">
                  <h3>{stats.paymentAging || 0} days</h3>
                  <p>Payment Aging</p>
                  <span className="kpi-subtext">Average days pending</span>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon wallet">
                  <Wallet className="w-6 h-6" />
                </div>
                <div className="kpi-content">
                  <h3>{formatCurrency(vendor.walletBalance || 0)}</h3>
                  <p>Wallet Balance</p>
                  {vendor.escrowBalance > 0 && (
                    <span className="kpi-subtext">Escrow: {formatCurrency(vendor.escrowBalance)}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Performance Scores */}
            <div className="scores-section">
              <h2 className="section-title">Performance Scores</h2>
              <div className="scores-grid">
                <div className="score-card">
                  <div className="score-header">
                    <span>Trust Score</span>
                    <span className="score-value">{vendor.trustScore || 0}/100</span>
                  </div>
                  <div className="score-bar">
                    <div className="score-fill" style={{ width: `${vendor.trustScore || 0}%` }}></div>
                  </div>
                </div>
                <div className="score-card">
                  <div className="score-header">
                    <span>Compliance Score</span>
                    <span className="score-value">{vendor.complianceScore || 0}/100</span>
                  </div>
                  <div className="score-bar">
                    <div className="score-fill" style={{ width: `${vendor.complianceScore || 0}%` }}></div>
                  </div>
                </div>
                <div className="score-card">
                  <div className="score-header">
                    <span>Delivery Reliability</span>
                    <span className="score-value">{vendor.deliveryReliabilityScore || 0}/100</span>
                  </div>
                  <div className="score-bar">
                    <div className="score-fill" style={{ width: `${vendor.deliveryReliabilityScore || 0}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Purchase Orders Tab - Flipkart Style */}
        {activeTab === 'purchase-orders' && (
          <div className="tab-content vendor-po-grid">
            {/* Top Filter Bar */}
            <div className="po-filters">
              <input
                type="text"
                placeholder="Search PO / Part name / Part number..."
                className="po-search-input"
                value={poFilters.search}
                onChange={(e) => fetchPurchaseOrders({ search: e.target.value, page: 1 })}
              />
              <select
                className="po-filter-select"
                value={poFilters.status}
                onChange={(e) => fetchPurchaseOrders({ status: e.target.value, page: 1 })}
              >
                <option value="">All Status (Including Approved by Admin)</option>
                <option value="pending">Pending (Approved by Admin)</option>
                <option value="accepted">Accepted</option>
                <option value="in_progress">In Progress</option>
                <option value="partially_delivered">Partially Delivered</option>
                <option value="delivered">Delivered</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <button
                onClick={() => {
                  console.log('🔄 [VendorDashboard] Manual refresh triggered from header');
                  fetchPurchaseOrders({ status: poFilters.status || '', page: 1, search: poFilters.search || '' });
                }}
                style={{
                  padding: '10px 16px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                title="Refresh Purchase Orders"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>

            {purchaseOrders.length === 0 ? (
              <div className="empty-state">
                <Package className="w-12 h-12 text-gray-400" />
                <h3>No Purchase Orders</h3>
                <p>Purchase orders will appear here when they are approved by admin and sent to you.</p>
                <button
                  onClick={() => {
                    console.log('🔄 [VendorDashboard] Manual refresh triggered');
                    fetchPurchaseOrders({ status: '', page: 1, search: '' });
                  }}
                  style={{
                    marginTop: '16px',
                    padding: '10px 20px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '14px'
                  }}
                >
                  🔄 Refresh Purchase Orders
                </button>
              </div>
            ) : (
              <div className="po-layout">
                {/* Left: Summary Panel */}
                {poStats && (
                  <div className="po-summary-panel">
                    <h3>Summary</h3>
                    <div className="po-summary-row">
                      <span>Total POs</span>
                      <strong>{poStats.total || 0}</strong>
                    </div>
                    <div className="po-summary-row">
                      <span>Pending</span>
                      <strong>{poStats.pending || 0}</strong>
                    </div>
                    <div className="po-summary-row">
                      <span>Accepted</span>
                      <strong>{poStats.accepted || 0}</strong>
                    </div>
                    <div className="po-summary-row">
                      <span>In Progress</span>
                      <strong>{poStats.in_progress || 0}</strong>
                    </div>
                    <div className="po-summary-row">
                      <span>Delivered</span>
                      <strong>{poStats.delivered || 0}</strong>
                    </div>
                    <div className="po-summary-row total">
                      <span>Total Value</span>
                      <strong>{formatCurrency(poStats.totalAmount || 0)}</strong>
                    </div>
                  </div>
                )}

                {/* Center: Product-Style Cards Grid */}
                <div className="po-cards-grid">
                  {purchaseOrders.map((po) => (
                    <div key={po._id} className="po-card">
                      <div className="po-card-header">
                        <span className="po-number">{po.poNumber}</span>
                        {getStatusBadge(po.status)}
                      </div>

                      {/* Items Grid - Show first few items like product tiles */}
                      <div className="po-items-grid">
                        {po.items?.slice(0, 4).map((item, idx) => (
                          <div key={idx} className="po-item-tile">
                            <div className="po-item-image">
                              {item.image ? (
                                <img src={item.image} alt={item.partName} />
                              ) : (
                                <Package className="w-6 h-6 text-gray-400" />
                              )}
                            </div>
                            <div className="po-item-info">
                              <div className="po-item-name" title={item.partName}>
                                {item.partName?.length > 20 
                                  ? item.partName.substring(0, 20) + '...' 
                                  : item.partName}
                              </div>
                              <div className="po-item-meta">
                                <span>{item.partNumber}</span>
                                <span>Qty: {item.quantity} {item.unit || 'units'}</span>
                              </div>
                              <div className="po-item-price">
                                {formatCurrency(item.unitPrice)} / {item.unit || 'unit'}
                              </div>
                            </div>
                          </div>
                        ))}
                        {po.items?.length > 4 && (
                          <div className="po-item-more">
                            +{po.items.length - 4} more items
                          </div>
                        )}
                      </div>

                      <div className="po-card-footer">
                        <div className="po-amount">
                          <span>Total Amount</span>
                          <strong>{formatCurrency(po.totalAmount)}</strong>
                        </div>
                        <div className="po-meta">
                          <span>
                            {po.orderDate
                              ? new Date(po.orderDate).toLocaleDateString()
                              : 'N/A'}
                          </span>
                          {po.depotName && <span>Depot: {po.depotName}</span>}
                        </div>
                        {po.expectedDeliveryDate && (
                          <div className="po-delivery-date">
                            Expected: {new Date(po.expectedDeliveryDate).toLocaleDateString()}
                          </div>
                        )}
                        {/* Small tags for delivery / invoice / payment visibility */}
                        <div className="po-info-tags">
                          <span className="po-tag warning">
                            Delivery: {po.status || 'pending'}
                          </span>
                          <span className={`po-tag ${po.invoiceId ? 'success' : ''}`}>
                            {po.invoiceId ? 'Invoice Submitted' : 'Invoice Pending'}
                          </span>
                          <span className={`po-tag ${po.paymentStatus === 'paid' || po.paymentDate ? 'success' : ''}`}>
                            {po.paymentStatus === 'paid' || po.paymentDate ? 'Payment Received' : 'Payment Pending'}
                          </span>
                        </div>
                        <div className="po-actions">
                          <button
                            className="action-btn primary"
                            onClick={() => setSelectedPO(po)}
                          >
                            View Details
                          </button>
                          {po.status === 'pending' && (
                            <>
                              <button
                                className="action-btn success"
                                onClick={() => handleAcceptPO(po._id)}
                                disabled={po._isUpdating}
                                style={{ position: 'relative', opacity: po._isUpdating ? 0.7 : 1 }}
                              >
                                {po._isUpdating ? (
                                  <>
                                    <RefreshCw className="w-4 h-4 animate-spin" style={{ display: 'inline', marginRight: '6px' }} />
                                    Accepting...
                                  </>
                                ) : (
                                  'Accept'
                                )}
                              </button>
                              <button
                                className="action-btn danger"
                                onClick={() => handleRejectPO(po._id)}
                                disabled={po._isUpdating}
                                style={{ position: 'relative', opacity: po._isUpdating ? 0.7 : 1 }}
                              >
                                {po._isUpdating ? (
                                  <>
                                    <RefreshCw className="w-4 h-4 animate-spin" style={{ display: 'inline', marginRight: '6px' }} />
                                    Rejecting...
                                  </>
                                ) : (
                                  'Reject'
                                )}
                              </button>
                            </>
                          )}
                          {po.status === 'accepted' && (
                            <button
                              className="action-btn primary"
                              onClick={() => {
                                setDispatchPO(po);
                                setShowDispatchModal(true);
                              }}
                              disabled={po._isUpdating}
                              style={{ position: 'relative', opacity: po._isUpdating ? 0.7 : 1 }}
                            >
                              {po._isUpdating ? (
                                <>
                                  <RefreshCw className="w-4 h-4 animate-spin" style={{ display: 'inline', marginRight: '6px' }} />
                                  Dispatching...
                                </>
                              ) : (
                                'Dispatch Material'
                              )}
                            </button>
                          )}
                          {(po.status === 'in_progress' || po.status === 'delivered') && (
                            <button
                              className="action-btn"
                              onClick={() => {
                                const tracking = prompt('Enter tracking number (optional):');
                                if (tracking !== null) {
                                  vendorApiService.updateDeliveryStatus(po._id, {
                                    trackingNumber: tracking,
                                    deliveryStatus: 'in_transit'
                                  }).then(() => fetchPurchaseOrders());
                                }
                              }}
                            >
                              Update Tracking
                            </button>
                          )}
                          {(po.status === 'delivered' || po.status === 'partially_delivered') && !po.invoiceId && (
                            <button
                              className="action-btn success"
                              onClick={() => {
                                setInvoicePO(po);
                                setShowInvoiceModal(true);
                              }}
                            >
                              Submit Invoice
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PO Details Modal */}
            {selectedPO && (
              <div className="po-modal-overlay" onClick={() => setSelectedPO(null)}>
                <div className="po-modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="po-modal-header">
                    <h2>Purchase Order Details - {selectedPO.poNumber}</h2>
                    <button className="close-btn" onClick={() => setSelectedPO(null)}>×</button>
                  </div>
                  <div className="po-modal-body">
                    <div className="po-modal-body-left">
                      <div className="po-details-section">
                        <h3>Order Information</h3>
                        <div className="details-grid">
                          <div><strong>PO Number:</strong> {selectedPO.poNumber}</div>
                          <div><strong>Order Date:</strong> {new Date(selectedPO.orderDate).toLocaleDateString()}</div>
                          <div><strong>Status:</strong> {getStatusBadge(selectedPO.status)}</div>
                          {selectedPO.expectedDeliveryDate && (
                            <div><strong>Expected Delivery:</strong> {new Date(selectedPO.expectedDeliveryDate).toLocaleDateString()}</div>
                          )}
                          {selectedPO.depotName && (
                            <div><strong>Delivery Depot:</strong> {selectedPO.depotName}</div>
                          )}
                        </div>
                      </div>

                      {selectedPO.deliveryAddress && (
                        <div className="po-details-section">
                          <h3>Delivery Address</h3>
                          <div className="details-grid">
                            <div><strong>Address:</strong> {selectedPO.deliveryAddress.address || 'N/A'}</div>
                            <div><strong>City:</strong> {selectedPO.deliveryAddress.city || 'N/A'}</div>
                            <div><strong>State:</strong> {selectedPO.deliveryAddress.state || 'N/A'}</div>
                            <div><strong>Pincode:</strong> {selectedPO.deliveryAddress.pincode || 'N/A'}</div>
                            {selectedPO.deliveryAddress.contactPerson && (
                              <div><strong>Contact Person:</strong> {selectedPO.deliveryAddress.contactPerson}</div>
                            )}
                            {selectedPO.deliveryAddress.contactPhone && (
                              <div><strong>Contact Phone:</strong> {selectedPO.deliveryAddress.contactPhone}</div>
                            )}
                          </div>
                        </div>
                      )}

                      {selectedPO.paymentTerms && (
                        <div className="po-details-section">
                          <h3>Payment Terms</h3>
                          <p>{selectedPO.paymentTerms}</p>
                        </div>
                      )}
                    </div>

                    <div className="po-modal-body-right">
                      <div className="po-details-section">
                        <h3>Items ({selectedPO.items?.length || 0})</h3>
                        <div className="po-items-list">
                          {selectedPO.items?.map((item, idx) => (
                            <div key={idx} className="po-item-detail">
                              <div className="po-item-detail-image">
                                {item.image ? (
                                  <img src={item.image} alt={item.partName} />
                                ) : (
                                  <Package className="w-8 h-8 text-gray-400" />
                                )}
                              </div>
                              <div className="po-item-detail-info">
                                <h4>{item.partName}</h4>
                                <p>Part Number: {item.partNumber}</p>
                                <p>Category: {item.category}</p>
                                <p>Quantity: {item.quantity} {item.unit || 'units'}</p>
                                <p>Unit Price: {formatCurrency(item.unitPrice)}</p>
                                <p><strong>Total: {formatCurrency(item.totalPrice)}</strong></p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="po-details-section">
                        <h3>Financial Summary</h3>
                        <div className="financial-summary">
                          <div className="financial-row">
                            <span>Subtotal:</span>
                            <span>{formatCurrency(selectedPO.subtotal)}</span>
                          </div>
                          {selectedPO.tax?.total > 0 && (
                            <div className="financial-row">
                              <span>Tax (GST):</span>
                              <span>{formatCurrency(selectedPO.tax.total)}</span>
                            </div>
                          )}
                          {selectedPO.discount > 0 && (
                            <div className="financial-row">
                              <span>Discount:</span>
                              <span>-{formatCurrency(selectedPO.discount)}</span>
                            </div>
                          )}
                          {selectedPO.shippingCharges > 0 && (
                            <div className="financial-row">
                              <span>Shipping:</span>
                              <span>{formatCurrency(selectedPO.shippingCharges)}</span>
                            </div>
                          )}
                          <div className="financial-row total">
                            <span><strong>Total Amount:</strong></span>
                            <span><strong>{formatCurrency(selectedPO.totalAmount)}</strong></span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="po-modal-actions" style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                      {selectedPO.status === 'accepted' && (
                        <button
                          className="action-btn primary"
                          onClick={() => {
                            setDispatchPO(selectedPO);
                            setShowDispatchModal(true);
                            setSelectedPO(null);
                          }}
                        >
                          Dispatch Material
                        </button>
                      )}
                      {(selectedPO.status === 'delivered' || selectedPO.status === 'partially_delivered') && !selectedPO.invoiceId && (
                        <button
                          className="action-btn success"
                          onClick={() => {
                            setInvoicePO(selectedPO);
                            setShowInvoiceModal(true);
                            setSelectedPO(null);
                          }}
                        >
                          Submit Invoice
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Dispatch Modal */}
            {showDispatchModal && dispatchPO && (
              <div className="po-modal-overlay" onClick={() => { setShowDispatchModal(false); setDispatchPO(null); }}>
                <div className="po-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                  <div className="po-modal-header">
                    <h2>Dispatch Purchase Order - {dispatchPO.poNumber}</h2>
                    <button className="close-btn" onClick={() => { setShowDispatchModal(false); setDispatchPO(null); }}>×</button>
                  </div>
                  <div className="po-modal-body">
                    <DispatchForm
                      po={dispatchPO}
                      onSubmit={(data) => handleDispatchPO(dispatchPO._id, data)}
                      onCancel={() => { setShowDispatchModal(false); setDispatchPO(null); }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Invoice Submission Modal */}
            {showInvoiceModal && invoicePO && (
              <div className="po-modal-overlay" onClick={() => { setShowInvoiceModal(false); setInvoicePO(null); }}>
                <div className="po-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                  <div className="po-modal-header">
                    <h2>Submit Invoice - PO {invoicePO.poNumber}</h2>
                    <button className="close-btn" onClick={() => { setShowInvoiceModal(false); setInvoicePO(null); }}>×</button>
                  </div>
                  <div className="po-modal-body">
                    <InvoiceForm
                      po={invoicePO}
                      onSubmit={(data) => handleSubmitInvoice(data)}
                      onCancel={() => { setShowInvoiceModal(false); setInvoicePO(null); }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Invoices Tab */}
        {activeTab === 'invoices' && (
          <div className="tab-content">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="section-title">Invoice & Billing</h2>
                <p className="text-sm text-gray-600 mt-1">Generate invoices, upload GST invoices, and track status</p>
              </div>
              <button
                onClick={() => {
                  // Fetch POs that are delivered and can be invoiced
                  fetchPurchaseOrders({ status: 'delivered' }).then(() => {
                    const deliverablePOs = purchaseOrders.filter(po => 
                      (po.status === 'delivered' || po.status === 'partially_delivered') && !po.invoiceId
                    );
                    if (deliverablePOs.length === 0) {
                      alert('No purchase orders available for invoicing. POs must be delivered first.');
                    } else {
                      // Show first available PO for invoicing
                      setInvoicePO(deliverablePOs[0]);
                      setShowInvoiceModal(true);
                    }
                  });
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Submit Invoice
              </button>
            </div>
            {invoices.length === 0 ? (
              <div className="empty-state">
                <Receipt className="w-12 h-12 text-gray-400" />
                <h3>No Invoices</h3>
                <p>Generate invoices against purchase orders or upload GST invoices.</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Invoice Number</th>
                      <th>PO Number</th>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => (
                      <tr key={invoice._id}>
                        <td>{invoice.invoiceNumber}</td>
                        <td>{invoice.poNumber || 'N/A'}</td>
                        <td>{new Date(invoice.date).toLocaleDateString()}</td>
                        <td>{formatCurrency(invoice.amount)}</td>
                        <td>{getStatusBadge(invoice.status)}</td>
                        <td>
                          <div className="flex gap-2">
                            <button 
                              className="action-btn"
                              onClick={() => handleViewInvoice(invoice)}
                            >
                              View
                            </button>
                            {invoice.status === 'submitted' && !invoice.gstInvoice && (
                              <button
                                className="action-btn"
                                onClick={() => {
                                  const input = document.createElement('input');
                                  input.type = 'file';
                                  input.accept = '.pdf,image/*';
                                  input.onchange = (e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                      console.log('Upload GST invoice:', { invoiceId: invoice._id, file });
                                      // Handle GST invoice upload
                                    }
                                  };
                                  input.click();
                                }}
                              >
                                <Upload className="w-3 h-3 inline mr-1" />
                                Upload GST
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Ledger Tab */}
        {activeTab === 'ledger' && (
          <div className="tab-content">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="section-title">Vendor Ledger</h2>
                <p className="text-sm text-gray-600 mt-1">Complete financial ledger with opening balance, invoices, and payments</p>
              </div>
              <button
                onClick={fetchLedger}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
            {ledger ? (
              <div>
                <div className="ledger-summary" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                  <div className="summary-card">
                    <h3>Opening Balance</h3>
                    <p className="amount">{formatCurrency(ledger.openingBalance || 0)}</p>
                  </div>
                  <div className="summary-card">
                    <h3>Total Invoiced</h3>
                    <p className="amount" style={{ color: '#10b981' }}>+{formatCurrency(ledger.totalInvoiced || 0)}</p>
                  </div>
                  <div className="summary-card">
                    <h3>Total Paid</h3>
                    <p className="amount" style={{ color: '#3b82f6' }}>-{formatCurrency(ledger.totalPaid || 0)}</p>
                  </div>
                  <div className="summary-card">
                    <h3>Closing Balance</h3>
                    <p className="amount" style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>{formatCurrency(ledger.closingBalance || 0)}</p>
                  </div>
                  <div className="summary-card">
                    <h3>Pending Payment</h3>
                    <p className="amount" style={{ color: '#ef4444' }}>{formatCurrency(ledger.totalPending || 0)}</p>
                  </div>
                </div>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Reference</th>
                        <th>PO Number</th>
                        <th>Description</th>
                        <th>Debit</th>
                        <th>Credit</th>
                        <th>Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledger.entries && ledger.entries.length > 0 ? (
                        ledger.entries.map((entry, idx) => (
                          <tr key={idx}>
                            <td>{new Date(entry.date).toLocaleDateString()}</td>
                            <td>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                entry.type === 'invoice' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {entry.type === 'invoice' ? 'Invoice' : 'Payment'}
                              </span>
                            </td>
                            <td>{entry.reference}</td>
                            <td>{entry.poNumber || 'N/A'}</td>
                            <td>{entry.description}</td>
                            <td>{entry.debit > 0 ? formatCurrency(entry.debit) : '-'}</td>
                            <td>{entry.credit > 0 ? formatCurrency(entry.credit) : '-'}</td>
                            <td><strong>{formatCurrency(entry.balance)}</strong></td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>
                            <p>No ledger entries found</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <FileText className="w-12 h-12 text-gray-400" />
                <h3>Loading Ledger...</h3>
                <p>Fetching ledger data...</p>
              </div>
            )}
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && payments && (
          <div className="tab-content">
            <div className="payment-summary">
              <div className="summary-card">
                <h3>Wallet Balance</h3>
                <p className="amount">{formatCurrency(payments.walletBalance || 0)}</p>
              </div>
              <div className="summary-card">
                <h3>Escrow Balance</h3>
                <p className="amount">{formatCurrency(payments.escrowBalance || 0)}</p>
              </div>
            </div>
            {payments.payments && payments.payments.length > 0 ? (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Payment ID</th>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.payments.map((payment) => (
                      <tr key={payment._id}>
                        <td>{payment.paymentId}</td>
                        <td>{new Date(payment.date).toLocaleDateString()}</td>
                        <td>{formatCurrency(payment.amount)}</td>
                        <td>{getStatusBadge(payment.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <DollarSign className="w-12 h-12 text-gray-400" />
                <h3>No Payment History</h3>
                <p>Payment history will appear here.</p>
              </div>
            )}
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && performance && (
          <div className="tab-content">
            <div className="performance-section">
              <h2 className="section-title">Performance Metrics</h2>
              <div className="scores-grid">
                <div className="score-card">
                  <div className="score-header">
                    <span>Trust Score</span>
                    <span className="score-value">{performance.trustScore || 0}/100</span>
                  </div>
                  <div className="score-bar">
                    <div className="score-fill" style={{ width: `${performance.trustScore || 0}%` }}></div>
                  </div>
                </div>
                <div className="score-card">
                  <div className="score-header">
                    <span>Compliance Score</span>
                    <span className="score-value">{performance.complianceScore || 0}/100</span>
                  </div>
                  <div className="score-bar">
                    <div className="score-fill" style={{ width: `${performance.complianceScore || 0}%` }}></div>
                  </div>
                </div>
                <div className="score-card">
                  <div className="score-header">
                    <span>Delivery Reliability</span>
                    <span className="score-value">{performance.deliveryReliabilityScore || 0}/100</span>
                  </div>
                  <div className="score-bar">
                    <div className="score-fill" style={{ width: `${performance.deliveryReliabilityScore || 0}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {performance.contractDetails && (
              <div className="contract-section">
                <h2 className="section-title">Contract Details</h2>
                <div className="contract-info">
                  <div className="info-item">
                    <span className="label">Contract Number:</span>
                    <span className="value">{performance.contractDetails.contractNumber || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Validity:</span>
                    <span className="value">{performance.contractDetails.validity || 'N/A'}</span>
                  </div>
                  {performance.contractDetails.slaTerms && (
                    <div className="info-item">
                      <span className="label">SLA Terms:</span>
                      <span className="value">
                        Delivery Timeline: {performance.contractDetails.slaTerms.deliveryTimeline || 'N/A'} hours
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Delivery Confirmation Tab - Flipkart Style Tracking */}
        {activeTab === 'deliveries' && (
          <div className="tab-content" style={{ padding: '20px', maxHeight: 'calc(100vh - 120px)', overflow: 'auto' }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="section-title" style={{ marginBottom: '4px' }}>Delivery Tracking</h2>
                <p className="text-sm text-gray-600">Track your orders and delivery status</p>
              </div>
              <button
                onClick={fetchDeliveries}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>

            {deliveries.length === 0 ? (
              <div className="empty-state" style={{ textAlign: 'center', padding: '60px 20px' }}>
                <Truck className="w-16 h-16 text-gray-400" style={{ margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>No Active Deliveries</h3>
                <p style={{ color: '#64748b' }}>Deliveries that are dispatched or in transit will appear here.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {deliveries.map((order) => {
                  const timeline = getOrderTimeline(order);
                  const currentStatus = order.status || 'pending';
                  const isDelivered = currentStatus === 'delivered' || currentStatus === 'completed';
                  
                  return (
                    <div
                      key={order._id}
                      style={{
                        background: 'white',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        padding: '24px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                      }}
                    >
                      {/* Order Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid #e2e8f0' }}>
                        <div>
                          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: '#1e293b' }}>
                            Order #{order.poNumber}
                          </h3>
                          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '14px', color: '#64748b' }}>
                            <span>Placed on: {new Date(order.orderDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            {order.depotName && <span>• Depot: {order.depotName}</span>}
                            {order.trackingNumber && <span>• LR: {order.trackingNumber}</span>}
                          </div>
                        </div>
                        <div style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          background: isDelivered ? '#d1fae5' : currentStatus === 'in_progress' ? '#dbeafe' : '#fef3c7',
                          color: isDelivered ? '#065f46' : currentStatus === 'in_progress' ? '#1e40af' : '#92400e'
                        }}>
                          {currentStatus.replace(/_/g, ' ').toUpperCase()}
                        </div>
                      </div>

                      {/* Products List */}
                      <div style={{ marginBottom: '24px' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: '#475569' }}>Products Ordered</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {order.items?.slice(0, 3).map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '12px', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                              <div style={{ width: '60px', height: '60px', background: '#e2e8f0', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                {item.image ? (
                                  <img src={item.image} alt={item.partName} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '6px' }} />
                                ) : (
                                  <Package className="w-6 h-6 text-gray-400" />
                                )}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px', color: '#1e293b' }}>
                                  {item.partName || item.productName || 'Product'}
                                </div>
                                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                                  {item.partNumber || item.productCode || 'N/A'}
                                </div>
                                <div style={{ fontSize: '13px', fontWeight: 600, color: '#ec4899' }}>
                                  Qty: {item.quantity} {item.unit || 'units'} × ₹{item.unitPrice?.toLocaleString('en-IN') || '0'} = ₹{(item.totalPrice || item.quantity * item.unitPrice || 0).toLocaleString('en-IN')}
                                </div>
                              </div>
                            </div>
                          ))}
                          {order.items?.length > 3 && (
                            <div style={{ padding: '8px', textAlign: 'center', fontSize: '12px', color: '#64748b' }}>
                              +{order.items.length - 3} more items
                            </div>
                          )}
                        </div>
                        <div style={{ marginTop: '16px', padding: '12px', background: '#f0f9ff', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '14px', fontWeight: 600 }}>Total Amount:</span>
                          <span style={{ fontSize: '18px', fontWeight: 700, color: '#ec4899' }}>
                            ₹{(order.totalAmount || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      {/* Delivery Address */}
                      {order.deliveryAddress && (
                        <div style={{ marginBottom: '24px', padding: '16px', background: '#f8fafc', borderRadius: '8px' }}>
                          <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#475569' }}>
                            <MapPin className="w-4 h-4" style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                            Delivery Address
                          </h4>
                          <div style={{ fontSize: '13px', color: '#475569', lineHeight: '1.6' }}>
                            {order.deliveryAddress.address && <div>{order.deliveryAddress.address}</div>}
                            <div>
                              {order.deliveryAddress.city && order.deliveryAddress.city}
                              {order.deliveryAddress.state && `, ${order.deliveryAddress.state}`}
                              {order.deliveryAddress.pincode && ` - ${order.deliveryAddress.pincode}`}
                            </div>
                            {order.deliveryAddress.contactPerson && (
                              <div style={{ marginTop: '4px' }}>Contact: {order.deliveryAddress.contactPerson}</div>
                            )}
                            {order.deliveryAddress.contactPhone && (
                              <div>Phone: {order.deliveryAddress.contactPhone}</div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Timeline Tracking */}
                      <div>
                        <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', color: '#475569' }}>Order Timeline</h4>
                        <div style={{ position: 'relative', paddingLeft: '24px' }}>
                          {/* Vertical Line */}
                          <div style={{
                            position: 'absolute',
                            left: '11px',
                            top: '0',
                            bottom: '0',
                            width: '2px',
                            background: '#e2e8f0'
                          }} />
                          
                          {timeline.map((activity, idx) => {
                            const Icon = activity.icon;
                            const isLast = idx === timeline.length - 1;
                            const isCompleted = activity.completed;
                            
                            return (
                              <div key={idx} style={{ position: 'relative', marginBottom: isLast ? '0' : '24px' }}>
                                {/* Icon Circle */}
                                <div style={{
                                  position: 'absolute',
                                  left: '-29px',
                                  top: '2px',
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '50%',
                                  background: isCompleted ? '#10b981' : '#e2e8f0',
                                  border: '2px solid white',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  zIndex: 1
                                }}>
                                  <Icon className="w-3 h-3" style={{ color: isCompleted ? 'white' : '#94a3b8' }} />
                                </div>
                                
                                {/* Activity Content */}
                                <div style={{ marginLeft: '0' }}>
                                  <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px', color: isCompleted ? '#1e293b' : '#64748b' }}>
                                    {activity.title}
                                  </div>
                                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                                    {activity.description}
                                  </div>
                                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                                    {new Date(activity.date).toLocaleString('en-IN', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Tracking Details */}
                      {(order.trackingNumber || order.shippingMethod || order.dispatchDate) && (
                        <div style={{ marginTop: '24px', padding: '16px', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                          <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: '#0369a1' }}>Tracking Information</h4>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '13px' }}>
                            {order.trackingNumber && (
                              <div>
                                <span style={{ color: '#64748b' }}>LR Number:</span>
                                <div style={{ fontWeight: 600, color: '#1e293b' }}>{order.trackingNumber}</div>
                              </div>
                            )}
                            {order.shippingMethod && (
                              <div>
                                <span style={{ color: '#64748b' }}>Vehicle:</span>
                                <div style={{ fontWeight: 600, color: '#1e293b' }}>{order.shippingMethod}</div>
                              </div>
                            )}
                            {order.dispatchDate && (
                              <div>
                                <span style={{ color: '#64748b' }}>Dispatched:</span>
                                <div style={{ fontWeight: 600, color: '#1e293b' }}>
                                  {new Date(order.dispatchDate).toLocaleDateString('en-IN')}
                                </div>
                              </div>
                            )}
                            {order.expectedDeliveryDate && (
                              <div>
                                <span style={{ color: '#64748b' }}>Expected:</span>
                                <div style={{ fontWeight: 600, color: '#1e293b' }}>
                                  {new Date(order.expectedDeliveryDate).toLocaleDateString('en-IN')}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Auction Participation Tab */}
        {activeTab === 'auctions' && (
          <div className="tab-content">
            <div className="flex items-center justify-between mb-6">
              <h2 className="section-title">Auction Participation</h2>
              <p className="text-sm text-gray-600">View auctions and place bids</p>
            </div>

            {auctions.length === 0 ? (
              <div className="empty-state">
                <Gavel className="w-12 h-12 text-gray-400" />
                <h3>No Active Auctions</h3>
                <p>Active auctions will appear here when available.</p>
              </div>
            ) : (
              <div className="auctions-grid">
                {auctions.map((auction) => (
                  <div key={auction._id} className="auction-card">
                    <div className="auction-header">
                      <div>
                        <h3 className="font-semibold">{auction.title}</h3>
                        <p className="text-sm text-gray-600">{auction.description}</p>
                      </div>
                      {getStatusBadge(auction.status)}
                    </div>
                    <div className="auction-details">
                      <div className="detail-row">
                        <span>Item Type:</span>
                        <span>{auction.itemType}</span>
                      </div>
                      <div className="detail-row">
                        <span>Current Bid:</span>
                        <span className="font-semibold text-green-600">{formatCurrency(auction.currentBid || auction.startingBid)}</span>
                      </div>
                      <div className="detail-row">
                        <span>Ends At:</span>
                        <span>{new Date(auction.endDate).toLocaleString()}</span>
                      </div>
                      {auction.myBid && (
                        <div className="detail-row">
                          <span>Your Bid:</span>
                          <span className="font-semibold">{formatCurrency(auction.myBid.amount)}</span>
                          <span className={`text-xs ${auction.myBid.status === 'winning' ? 'text-green-600' : 'text-gray-600'}`}>
                            ({auction.myBid.status})
                          </span>
                        </div>
                      )}
                    </div>
                    {auction.status === 'active' && (
                      <div className="auction-actions">
                        {auction.myBid ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Your bid: {formatCurrency(auction.myBid.amount)}</span>
                            <button
                              className="action-btn"
                              onClick={() => {
                                const newBid = prompt(`Enter new bid (minimum: ${formatCurrency(auction.currentBid + 1000)}):`);
                                if (newBid && parseFloat(newBid) > auction.currentBid) {
                                  console.log('Place bid:', { auctionId: auction._id, bid: newBid });
                                  // Handle bid placement
                                }
                              }}
                            >
                              Update Bid
                            </button>
                          </div>
                        ) : (
                          <button
                            className="action-btn primary"
                            onClick={() => {
                              const bid = prompt(`Enter bid amount (minimum: ${formatCurrency(auction.currentBid || auction.startingBid)}):`);
                              if (bid && parseFloat(bid) >= (auction.currentBid || auction.startingBid)) {
                                console.log('Place bid:', { auctionId: auction._id, bid });
                                // Handle bid placement
                              }
                            }}
                          >
                            Place Bid
                          </button>
                        )}
                        <button className="action-btn" onClick={() => setSelectedPO(auction)}>
                          View Details
                        </button>
                      </div>
                    )}
                    {auction.status === 'closed' && auction.winnerId === user?.vendorId && (
                      <div className="auction-winner-badge">
                        <Award className="w-5 h-5" />
                        <span>You Won This Auction!</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Compliance & Rating Tab */}
        {activeTab === 'compliance' && (
          <div className="tab-content">
            <h2 className="section-title">Vendor Compliance & Rating</h2>
            
            {compliance ? (
              <div className="compliance-section">
                <div className="scores-grid mb-6">
                  <div className="score-card">
                    <div className="score-header">
                      <span>Overall Rating</span>
                      <span className="score-value">{compliance.overallRating || 0}/100</span>
                    </div>
                    <div className="score-bar">
                      <div className="score-fill" style={{ width: `${compliance.overallRating || 0}%` }}></div>
                    </div>
                  </div>
                  <div className="score-card">
                    <div className="score-header">
                      <span>Delivery Timeliness</span>
                      <span className="score-value">{compliance.deliveryTimeliness || 0}%</span>
                    </div>
                    <div className="score-bar">
                      <div className="score-fill" style={{ width: `${compliance.deliveryTimeliness || 0}%` }}></div>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      {compliance.onTimeDeliveries || 0} on-time / {compliance.totalDeliveries || 0} total
                    </p>
                  </div>
                  <div className="score-card">
                    <div className="score-header">
                      <span>Invoice Accuracy</span>
                      <span className="score-value">{compliance.invoiceAccuracy || 0}%</span>
                    </div>
                    <div className="score-bar">
                      <div className="score-fill" style={{ width: `${compliance.invoiceAccuracy || 0}%` }}></div>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      {compliance.accurateInvoices || 0} accurate / {compliance.totalInvoices || 0} total
                    </p>
                  </div>
                  <div className="score-card">
                    <div className="score-header">
                      <span>Product Quality</span>
                      <span className="score-value">{compliance.productQuality || 0}/100</span>
                    </div>
                    <div className="score-bar">
                      <div className="score-fill" style={{ width: `${compliance.productQuality || 0}%` }}></div>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      Based on depot feedback
                    </p>
                  </div>
                  <div className="score-card">
                    <div className="score-header">
                      <span>Complaint Ratio</span>
                      <span className={`score-value ${(compliance.complaintRatio || 0) > 10 ? 'text-red-600' : (compliance.complaintRatio || 0) > 5 ? 'text-yellow-600' : 'text-green-600'}`}>
                        {(compliance.complaintRatio || 0).toFixed(1)}%
                      </span>
                    </div>
                    <div className="score-bar">
                      <div className={`score-fill ${(compliance.complaintRatio || 0) > 10 ? 'bg-red-500' : (compliance.complaintRatio || 0) > 5 ? 'bg-yellow-500' : 'bg-green-500'}`} 
                        style={{ width: `${Math.min(compliance.complaintRatio || 0, 100)}%` }}></div>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      {compliance.totalComplaints || 0} complaints / {compliance.totalOrders || 0} orders
                    </p>
                  </div>
                </div>

                <div className="compliance-warnings">
                  {(compliance.overallRating || 0) < 50 && (
                    <div className="warning-card critical">
                      <AlertTriangle className="w-5 h-5" />
                      <div>
                        <h4>Low Rating Warning</h4>
                        <p>Your overall rating is below 50. This may limit your visibility to depots.</p>
                      </div>
                    </div>
                  )}
                  {(compliance.complaintRatio || 0) > 10 && (
                    <div className="warning-card critical">
                      <AlertTriangle className="w-5 h-5" />
                      <div>
                        <h4>High Complaint Ratio</h4>
                        <p>Your complaint ratio exceeds 10%. Repeated violations may result in suspension.</p>
                      </div>
                    </div>
                  )}
                  {(compliance.deliveryTimeliness || 0) < 80 && (
                    <div className="warning-card warning">
                      <Clock className="w-5 h-5" />
                      <div>
                        <h4>Delivery Timeliness Alert</h4>
                        <p>Your delivery timeliness is below 80%. Focus on on-time deliveries.</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="compliance-details mt-6">
                  <h3 className="section-subtitle">Compliance Details</h3>
                  <div className="details-grid">
                    <div className="detail-item">
                      <span className="label">Account Status:</span>
                      <span className={`value ${compliance.accountStatus === 'active' ? 'text-green-600' : 'text-yellow-600'}`}>
                        {compliance.accountStatus || 'N/A'}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Last Audit:</span>
                      <span className="value">{compliance.lastAuditDate ? new Date(compliance.lastAuditDate).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Violations:</span>
                      <span className="value">{compliance.violations || 0}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Suspension Risk:</span>
                      <span className={`value ${(compliance.suspensionRisk || 0) > 70 ? 'text-red-600' : (compliance.suspensionRisk || 0) > 40 ? 'text-yellow-600' : 'text-green-600'}`}>
                        {(compliance.suspensionRisk || 0)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <Shield className="w-12 h-12 text-gray-400" />
                <h3>Loading Compliance Data...</h3>
                <p>Compliance metrics are being calculated.</p>
              </div>
            )}
          </div>
        )}

        {/* Products Tab - Classic Table Style */}
        {activeTab === 'products' && (
          <div className="tab-content" style={{ padding: '12px', maxHeight: 'calc(100vh - 120px)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Classic Header */}
            <div className="flex items-center justify-between mb-3" style={{ flexShrink: 0 }}>
              <div>
                <h2 className="section-title" style={{ marginBottom: '4px', fontSize: '18px' }}>Product Management</h2>
                <p className="text-xs text-gray-600" style={{ margin: 0 }}>Manage your products, update prices, stock, and upload documents</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddProductModal(true)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm"
                >
                  <Plus className="w-3 h-3" />
                  Add Product
                </button>
                <button
                  onClick={() => setShowBulkUpload(true)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-sm"
                >
                  <Upload className="w-3 h-3" />
                  Bulk Upload
                </button>
                <button
                  onClick={fetchProducts}
                  className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex gap-3 mb-3" style={{ flexShrink: 0 }}>
              <div className="flex-1 relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products by name, code, or category..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={productCategoryFilter}
                onChange={(e) => setProductCategoryFilter(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                <option value="engine">Engine Parts</option>
                <option value="brake">Brake System</option>
                <option value="electrical">Electrical</option>
                <option value="body">Body Parts</option>
                <option value="tire">Tires & Wheels</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Classic Table View */}
            {filteredProducts.length === 0 ? (
              <div className="empty-state">
                <Package className="w-12 h-12 text-gray-400" />
                <h3>No Products Found</h3>
                <p>Start by adding your first product or use bulk upload to add multiple products at once.</p>
                <button
                  onClick={() => setShowAddProductModal(true)}
                  className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto font-semibold shadow-lg"
                >
                  <Plus className="w-4 h-4" />
                  Add First Product
                </button>
              </div>
            ) : (
              <div className="table-container" style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Code</th>
                      <th>Product Name</th>
                      <th>Category</th>
                      <th>Price (₹)</th>
                      <th>GST (%)</th>
                      <th>Stock</th>
                      <th>Unit</th>
                      <th>Description</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => {
                      const imageUrl = product.images?.[0]?.url || product.imageUrl || null;
                      return (
                        <tr key={product._id}>
                          <td>
                            <div 
                              className="relative group cursor-pointer"
                              onClick={() => handleLogoUploadClick(product._id, product.productName)}
                              title="Click to upload logo/image"
                              style={{ 
                                width: '40px', 
                                height: '40px',
                                position: 'relative',
                                display: 'inline-block'
                              }}
                            >
                              {imageUrl && !imageUrl.includes('placeholder.com') ? (
                                <img
                                  src={imageUrl}
                                  alt={product.productName}
                                  className="w-10 h-10 object-cover rounded border border-gray-200"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="w-10 h-10 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                                  <Package className="w-5 h-5 text-gray-400" />
                                </div>
                              )}
                              {/* Upload icon overlay */}
                              <div 
                                className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded flex items-center justify-center transition-all duration-200"
                                style={{ pointerEvents: 'none' }}
                              >
                                <Camera 
                                  className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" 
                                  style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="font-medium">{product.productCode || 'N/A'}</td>
                          <td>
                            {editingProductId === product._id && editingField === 'name' ? (
                              <input
                                type="text"
                                defaultValue={product.productName}
                                className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none"
                                autoFocus
                                onBlur={(e) => {
                                  if (e.target.value.trim()) {
                                    handleUpdateProduct(product._id, { productName: e.target.value.trim() });
                                  }
                                  setEditingProductId(null);
                                  setEditingField(null);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    if (e.target.value.trim()) {
                                      handleUpdateProduct(product._id, { productName: e.target.value.trim() });
                                    }
                                    setEditingProductId(null);
                                    setEditingField(null);
                                  } else if (e.key === 'Escape') {
                                    setEditingProductId(null);
                                    setEditingField(null);
                                  }
                                }}
                              />
                            ) : (
                              <span 
                                className="cursor-pointer hover:text-blue-600 flex items-center gap-1"
                                onClick={() => {
                                  setEditingProductId(product._id);
                                  setEditingField('name');
                                }}
                                title="Click to edit"
                              >
                                {product.productName}
                                <Edit className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                              </span>
                            )}
                          </td>
                          <td className="capitalize">{product.category?.replace(/_/g, ' ') || 'N/A'}</td>
                          <td>
                            {editingProductId === product._id && editingField === 'price' ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  step="0.01"
                                  defaultValue={product.finalPrice || product.basePrice}
                                  className="w-24 px-2 py-1 border border-blue-500 rounded focus:outline-none"
                                  autoFocus
                                  onBlur={(e) => {
                                    const newPrice = parseFloat(e.target.value);
                                    if (!isNaN(newPrice) && newPrice > 0) {
                                      handleUpdateProduct(product._id, { basePrice: newPrice });
                                    }
                                    setEditingProductId(null);
                                    setEditingField(null);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      const newPrice = parseFloat(e.target.value);
                                      if (!isNaN(newPrice) && newPrice > 0) {
                                        handleUpdateProduct(product._id, { basePrice: newPrice });
                                      }
                                      setEditingProductId(null);
                                      setEditingField(null);
                                    } else if (e.key === 'Escape') {
                                      setEditingProductId(null);
                                      setEditingField(null);
                                    }
                                  }}
                                />
                                <CheckCircle className="w-4 h-4 text-green-600 cursor-pointer" />
                              </div>
                            ) : (
                              <span 
                                className="cursor-pointer hover:text-blue-600 font-semibold"
                                onClick={() => {
                                  setEditingProductId(product._id);
                                  setEditingField('price');
                                }}
                                title="Click to edit"
                              >
                                {formatCurrency(product.finalPrice || product.basePrice)}
                              </span>
                            )}
                          </td>
                          <td>{product.taxRate || product.gstRate || 18}%</td>
                          <td>
                            {editingProductId === product._id && editingField === 'stock' ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  defaultValue={product.stock?.quantity || 0}
                                  className="w-20 px-2 py-1 border-2 border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                                  autoFocus
                                  onChange={(e) => {
                                    // Real-time visual update as user types
                                    const newStock = parseFloat(e.target.value);
                                    if (!isNaN(newStock) && newStock >= 0) {
                                      // Optimistic update for instant visual feedback
                                      setProducts(prevProducts =>
                                        prevProducts.map(p =>
                                          p._id === product._id
                                            ? {
                                                ...p,
                                                stock: { ...p.stock, quantity: newStock },
                                                _isUpdating: true,
                                                _lastUpdated: Date.now()
                                              }
                                            : p
                                        )
                                      );
                                    }
                                  }}
                                  onBlur={(e) => {
                                    const newStock = parseFloat(e.target.value);
                                    if (!isNaN(newStock) && newStock >= 0) {
                                      handleUpdateProduct(product._id, { 
                                        stock: { 
                                          ...product.stock, 
                                          quantity: newStock 
                                        } 
                                      });
                                    }
                                    setEditingProductId(null);
                                    setEditingField(null);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      const newStock = parseFloat(e.target.value);
                                      if (!isNaN(newStock) && newStock >= 0) {
                                        handleUpdateProduct(product._id, { 
                                          stock: { 
                                            ...product.stock, 
                                            quantity: newStock 
                                          } 
                                        });
                                      }
                                      setEditingProductId(null);
                                      setEditingField(null);
                                    } else if (e.key === 'Escape') {
                                      // Revert on escape
                                      fetchProducts();
                                      setEditingProductId(null);
                                      setEditingField(null);
                                    }
                                  }}
                                />
                                <CheckCircle className="w-4 h-4 text-green-600 cursor-pointer" />
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleQuickStockUpdate(product._id, 'decrease', 1);
                                  }}
                                  className="p-1 hover:bg-red-100 rounded text-red-600 transition-colors"
                                  title="Decrease stock by 1"
                                  disabled={product._isUpdating}
                                >
                                  <MinusCircle className="w-4 h-4" />
                                </button>
                                <span 
                                  className={`cursor-pointer hover:text-blue-600 font-semibold transition-all duration-200 min-w-[40px] text-center ${(product.stock?.quantity || 0) < 10 ? 'text-red-600' : 'text-green-600'} ${product._isUpdating ? 'animate-pulse ring-2 ring-blue-400 rounded px-1' : ''}`}
                                  onClick={() => {
                                    setEditingProductId(product._id);
                                    setEditingField('stock');
                                  }}
                                  title="Click to edit stock - Updates instantly"
                                >
                                  {product.stock?.quantity || 0}
                                  {product._isUpdating && (
                                    <span className="ml-1 text-xs text-blue-500 animate-spin">⟳</span>
                                  )}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleQuickStockUpdate(product._id, 'increase', 1);
                                  }}
                                  className="p-1 hover:bg-green-100 rounded text-green-600 transition-colors"
                                  title="Increase stock by 1"
                                  disabled={product._isUpdating}
                                >
                                  <PlusCircle className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </td>
                          <td>{product.stock?.unit || 'pieces'}</td>
                          <td className="max-w-xs truncate" title={product.description}>
                            {product.description || 'N/A'}
                          </td>
                          <td>
                            {getStatusBadge(product.status || (product.approved ? 'approved' : 'pending'))}
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setEditingProduct(product);
                                  setShowAddProductModal(true);
                                }}
                                className="text-blue-600 hover:text-blue-800"
                                title="Edit Product"
                              >
                                <Settings className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  const input = document.createElement('input');
                                  input.type = 'file';
                                  input.accept = '.pdf,.doc,.docx,image/*';
                                  input.multiple = true;
                                  input.onchange = (e) => {
                                    const files = Array.from(e.target.files);
                                    handleUploadDocuments(product._id, files);
                                  };
                                  input.click();
                                }}
                                className="text-purple-600 hover:text-purple-800"
                                title="Upload Documents"
                              >
                                <Upload className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Add/Edit Product Modal */}
            {showAddProductModal && (
              <Suspense fallback={<div className="loading-spinner"></div>}>
                <ProductModal
                  product={editingProduct}
                  onClose={() => {
                    setShowAddProductModal(false);
                    setEditingProduct(null);
                  }}
                  onSave={(productData) => {
                    if (editingProduct) {
                      handleUpdateProduct(editingProduct._id, productData);
                    } else {
                      handleAddProduct(productData);
                    }
                    setShowAddProductModal(false);
                    setEditingProduct(null);
                  }}
                />
              </Suspense>
            )}

            {showBulkUpload && (
              <Suspense fallback={<div className="loading-spinner"></div>}>
              <BulkProductsUpload
                onSuccess={() => {
                  fetchProducts();
                  setShowBulkUpload(false);
                }}
                onClose={() => setShowBulkUpload(false)}
              />
              </Suspense>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="tab-content">
            {profile ? (
              <div className="profile-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h2 className="section-title">Company Information</h2>
                  <button
                    onClick={() => {
                      setEditingProfile({ ...profile });
                      setShowEditProfileModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Profile
                  </button>
                </div>
                <div className="profile-grid">
                  <div className="profile-item">
                    <label>Company Name</label>
                    <p>{profile.companyName || 'N/A'}</p>
                  </div>
                  <div className="profile-item">
                    <label>Company Type</label>
                    <p>{profile.companyType || 'N/A'}</p>
                  </div>
                  <div className="profile-item">
                    <label>Email</label>
                    <p>{profile.email || 'N/A'}</p>
                  </div>
                  <div className="profile-item">
                    <label>Phone</label>
                    <p>{profile.phone || 'N/A'}</p>
                  </div>
                  <div className="profile-item">
                    <label>PAN Number</label>
                    <p>{profile.panNumber || 'N/A'}</p>
                  </div>
                  <div className="profile-item">
                    <label>GST Number</label>
                    <p>{profile.gstNumber || 'N/A'}</p>
                  </div>
                </div>

                {profile.bankDetails && (
                  <>
                    <h2 className="section-title" style={{ marginTop: '32px' }}>Banking Details</h2>
                    <div className="profile-grid">
                      <div className="profile-item">
                        <label>Account Number</label>
                        <p>{profile.bankDetails.accountNumber ? '****' + profile.bankDetails.accountNumber.slice(-4) : 'N/A'}</p>
                      </div>
                      <div className="profile-item">
                        <label>IFSC Code</label>
                        <p>{profile.bankDetails.ifscCode || 'N/A'}</p>
                      </div>
                      <div className="profile-item">
                        <label>Bank Name</label>
                        <p>{profile.bankDetails.bankName || 'N/A'}</p>
                      </div>
                    </div>
                  </>
                )}

                {profile.businessDetails && (
                  <>
                    <h2 className="section-title" style={{ marginTop: '32px' }}>Business Address</h2>
                    <div className="profile-grid">
                      <div className="profile-item">
                        <label>Address</label>
                        <p>{profile.businessDetails.address || 'N/A'}</p>
                      </div>
                      <div className="profile-item">
                        <label>City</label>
                        <p>{profile.businessDetails.city || 'N/A'}</p>
                      </div>
                      <div className="profile-item">
                        <label>State</label>
                        <p>{profile.businessDetails.state || 'N/A'}</p>
                      </div>
                      <div className="profile-item">
                        <label>Pincode</label>
                        <p>{profile.businessDetails.pincode || 'N/A'}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="empty-state">
                <Settings className="w-12 h-12 text-gray-400" />
                <h3>Loading Profile...</h3>
              </div>
            )}
          </div>
        )}

        {/* Edit Profile Modal */}
        {showEditProfileModal && editingProfile && (
          <div className="po-modal-overlay" onClick={() => { setShowEditProfileModal(false); setEditingProfile(null); }}>
            <div className="po-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
              <div className="po-modal-header">
                <h2>Edit Profile</h2>
                <button className="close-btn" onClick={() => { setShowEditProfileModal(false); setEditingProfile(null); }}>×</button>
              </div>
              <div className="po-modal-body">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  handleUpdateProfile(editingProfile);
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Company Name</label>
                      <input
                        type="text"
                        value={editingProfile.companyName || ''}
                        onChange={(e) => setEditingProfile({ ...editingProfile, companyName: e.target.value })}
                        className="form-input"
                        required
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Company Type</label>
                      <select
                        value={editingProfile.companyType || 'other'}
                        onChange={(e) => setEditingProfile({ ...editingProfile, companyType: e.target.value })}
                        className="form-input"
                      >
                        <option value="manufacturer">Manufacturer</option>
                        <option value="supplier">Supplier</option>
                        <option value="service_provider">Service Provider</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Email</label>
                      <input
                        type="email"
                        value={editingProfile.email || ''}
                        onChange={(e) => setEditingProfile({ ...editingProfile, email: e.target.value })}
                        className="form-input"
                        required
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Phone</label>
                      <input
                        type="tel"
                        value={editingProfile.phone || ''}
                        onChange={(e) => setEditingProfile({ ...editingProfile, phone: e.target.value })}
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>PAN Number</label>
                      <input
                        type="text"
                        value={editingProfile.panNumber || ''}
                        onChange={(e) => setEditingProfile({ ...editingProfile, panNumber: e.target.value.toUpperCase() })}
                        className="form-input"
                        maxLength={10}
                        pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>GST Number</label>
                      <input
                        type="text"
                        value={editingProfile.gstNumber || ''}
                        onChange={(e) => setEditingProfile({ ...editingProfile, gstNumber: e.target.value.toUpperCase() })}
                        className="form-input"
                      />
                    </div>
                  </div>

                  {editingProfile.businessDetails && (
                    <>
                      <h3 style={{ marginTop: '24px', marginBottom: '12px', fontSize: '16px', fontWeight: 600 }}>Business Address</h3>
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Address</label>
                        <textarea
                          value={editingProfile.businessDetails.address || ''}
                          onChange={(e) => setEditingProfile({
                            ...editingProfile,
                            businessDetails: { ...editingProfile.businessDetails, address: e.target.value }
                          })}
                          className="form-input"
                          rows={3}
                        />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>City</label>
                          <input
                            type="text"
                            value={editingProfile.businessDetails.city || ''}
                            onChange={(e) => setEditingProfile({
                              ...editingProfile,
                              businessDetails: { ...editingProfile.businessDetails, city: e.target.value }
                            })}
                            className="form-input"
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>State</label>
                          <input
                            type="text"
                            value={editingProfile.businessDetails.state || ''}
                            onChange={(e) => setEditingProfile({
                              ...editingProfile,
                              businessDetails: { ...editingProfile.businessDetails, state: e.target.value }
                            })}
                            className="form-input"
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Pincode</label>
                          <input
                            type="text"
                            value={editingProfile.businessDetails.pincode || ''}
                            onChange={(e) => setEditingProfile({
                              ...editingProfile,
                              businessDetails: { ...editingProfile.businessDetails, pincode: e.target.value }
                            })}
                            className="form-input"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {editingProfile.bankDetails && (
                    <>
                      <h3 style={{ marginTop: '24px', marginBottom: '12px', fontSize: '16px', fontWeight: 600 }}>Banking Details</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Account Number</label>
                          <input
                            type="text"
                            value={editingProfile.bankDetails.accountNumber || ''}
                            onChange={(e) => setEditingProfile({
                              ...editingProfile,
                              bankDetails: { ...editingProfile.bankDetails, accountNumber: e.target.value }
                            })}
                            className="form-input"
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>IFSC Code</label>
                          <input
                            type="text"
                            value={editingProfile.bankDetails.ifscCode || ''}
                            onChange={(e) => setEditingProfile({
                              ...editingProfile,
                              bankDetails: { ...editingProfile.bankDetails, ifscCode: e.target.value.toUpperCase() }
                            })}
                            className="form-input"
                          />
                        </div>
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Bank Name</label>
                        <input
                          type="text"
                          value={editingProfile.bankDetails.bankName || ''}
                          onChange={(e) => setEditingProfile({
                            ...editingProfile,
                            bankDetails: { ...editingProfile.bankDetails, bankName: e.target.value }
                          })}
                          className="form-input"
                        />
                      </div>
                    </>
                  )}

                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                    <button
                      type="button"
                      onClick={() => { setShowEditProfileModal(false); setEditingProfile(null); }}
                      className="btn-modern btn-cancel-modern"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updatingProfile}
                      className="btn-modern btn-primary-modern"
                    >
                      {updatingProfile ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Dispatch Form Component
const DispatchForm = ({ po, onSubmit, onCancel }) => {
  const [lrNumber, setLrNumber] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [dispatchDate, setDispatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [savedVehicles, setSavedVehicles] = useState([]);
  const [recentLRs, setRecentLRs] = useState([]);

  // Load recent vehicles / LRs from localStorage (per browser, optional)
  useEffect(() => {
    try {
      const v = JSON.parse(localStorage.getItem('vendor_saved_vehicles') || '[]');
      const l = JSON.parse(localStorage.getItem('vendor_recent_lrs') || '[]');
      if (Array.isArray(v)) setSavedVehicles(v);
      if (Array.isArray(l)) setRecentLRs(l);
    } catch (e) {
      // ignore parse errors
    }
  }, []);

  const handleVehicleSelect = (e) => {
    const value = e.target.value;
    if (value === '__NEW__') {
      setVehicleNumber('');
    } else if (value) {
      setVehicleNumber(value);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!lrNumber || !vehicleNumber || !dispatchDate) {
      alert('Please fill in all required fields');
      return;
    }

    // Update recent vehicles / LR numbers locally for future suggestions
    try {
      const newVehicles = Array.from(new Set([vehicleNumber, ...savedVehicles])).slice(0, 10);
      const newLRs = Array.from(new Set([lrNumber, ...recentLRs])).slice(0, 10);
      setSavedVehicles(newVehicles);
      setRecentLRs(newLRs);
      localStorage.setItem('vendor_saved_vehicles', JSON.stringify(newVehicles));
      localStorage.setItem('vendor_recent_lrs', JSON.stringify(newLRs));
    } catch (_) {
      // ignore storage errors
    }

    onSubmit({ lrNumber, vehicleNumber, dispatchDate });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>LR Number *</label>
        <input
          type="text"
          value={lrNumber}
          onChange={(e) => setLrNumber(e.target.value)}
          placeholder="Enter or select LR Number"
          required
          style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
        />
        {recentLRs.length > 0 && (
          <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '6px', fontSize: '11px' }}>
            {recentLRs.slice(0, 6).map((lr) => (
              <button
                key={lr}
                type="button"
                onClick={() => setLrNumber(lr)}
                style={{
                  padding: '4px 8px',
                  borderRadius: '999px',
                  border: '1px solid #e5e7eb',
                  background: '#f9fafb',
                  cursor: 'pointer',
                }}
              >
                {lr}
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Vehicle Number *</label>
        {savedVehicles.length > 0 && (
          <select
            onChange={handleVehicleSelect}
            defaultValue=""
            style={{
              width: '100%',
              padding: '8px 10px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              marginBottom: '6px',
              fontSize: '13px',
            }}
          >
            <option value="">Select Registered Vehicle</option>
            {savedVehicles.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
            <option value="__NEW__">+ Add New Vehicle</option>
          </select>
        )}
        <input
          type="text"
          value={vehicleNumber}
          onChange={(e) => setVehicleNumber(e.target.value)}
          placeholder="Enter Vehicle Number (e.g., KL07AB1234)"
          required
          style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
        />
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Dispatch Date *</label>
        <input
          type="date"
          value={dispatchDate}
          onChange={(e) => setDispatchDate(e.target.value)}
          required
          style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
        />
      </div>

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{ padding: '10px 20px', background: '#f3f4f6', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
        >
          Cancel
        </button>
        <button
          type="submit"
          style={{ padding: '10px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
        >
          Dispatch
        </button>
      </div>
    </form>
  );
};

// Invoice Form Component
const InvoiceForm = ({ po, onSubmit, onCancel }) => {
  const localFormatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceAmount, setInvoiceAmount] = useState(po.totalAmount || 0);
  const [gstAmount, setGstAmount] = useState(po.tax?.total || 0);
  const [fileUrl, setFileUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!invoiceNumber || !invoiceDate || !invoiceAmount) {
      alert('Please fill in all required fields');
      return;
    }
    onSubmit({
      poId: po._id,
      invoiceNumber,
      invoiceDate,
      invoiceAmount: parseFloat(invoiceAmount),
      gstAmount: parseFloat(gstAmount),
      fileUrl: fileUrl || null
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ background: '#f3f4f6', padding: '12px', borderRadius: '8px', marginBottom: '8px' }}>
        <p style={{ margin: 0, fontSize: '14px' }}><strong>PO Number:</strong> {po.poNumber}</p>
        <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}><strong>PO Amount:</strong> {localFormatCurrency(po.totalAmount)}</p>
      </div>
      <div>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Invoice Number *</label>
        <input
          type="text"
          value={invoiceNumber}
          onChange={(e) => setInvoiceNumber(e.target.value.toUpperCase())}
          placeholder="Enter Invoice Number (e.g., INV-2026-001)"
          required
          style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
        />
      </div>
      <div>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Invoice Date *</label>
        <input
          type="date"
          value={invoiceDate}
          onChange={(e) => setInvoiceDate(e.target.value)}
          required
          style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
        />
      </div>
      <div>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Invoice Amount (₹) *</label>
        <input
          type="number"
          value={invoiceAmount}
          onChange={(e) => setInvoiceAmount(e.target.value)}
          required
          min="0"
          step="0.01"
          style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
        />
        <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
          PO Amount: {localFormatCurrency(po.totalAmount)} {Math.abs(invoiceAmount - po.totalAmount) > 1 && (
            <span style={{ color: '#ef4444' }}>⚠ Amount mismatch!</span>
          )}
        </p>
      </div>
      <div>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>GST Amount (₹)</label>
        <input
          type="number"
          value={gstAmount}
          onChange={(e) => setGstAmount(e.target.value)}
          min="0"
          step="0.01"
          style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
        />
      </div>
      <div>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Invoice File URL (Optional)</label>
        <input
          type="url"
          value={fileUrl}
          onChange={(e) => setFileUrl(e.target.value)}
          placeholder="https://example.com/invoice.pdf"
          style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
        />
        <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>Upload invoice PDF and paste the URL here</p>
      </div>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{ padding: '10px 20px', background: '#f3f4f6', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
        >
          Cancel
        </button>
        <button
          type="submit"
          style={{ padding: '10px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
        >
          Submit Invoice
        </button>
      </div>
    </form>
  );
};

export default VendorDashboard;
