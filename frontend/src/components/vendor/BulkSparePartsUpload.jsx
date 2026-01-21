import React, { useState } from 'react';
import { Upload, X, Plus, Trash2, CheckCircle, AlertCircle, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { apiFetch } from '../../utils/api';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

const BulkSparePartsUpload = ({ onSuccess, onClose }) => {
  const [uploadMethod, setUploadMethod] = useState('manual'); // 'manual' or 'file'
  const [products, setProducts] = useState([{
    ksrcPartCode: '',
    partName: '',
    category: '',
    basePrice: '',
    busModelCompatibility: '',
    leadTime: '',
    warranty: '',
    moq: '',
    gstRate: '18',
    stock: { quantity: '', minQuantity: '10', unit: 'pieces' },
    description: '',
    imageUrl: ''
  }]);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});
  const [file, setFile] = useState(null);

  const categories = [
    'engine', 'transmission', 'brakes', 'suspension', 'electrical',
    'body', 'interior', 'exterior', 'tires', 'battery', 'filters',
    'fluids', 'belts', 'hoses', 'lights', 'mirrors', 'wipers', 'other'
  ];

  const units = ['pieces', 'units', 'kg', 'liters', 'meters', 'boxes', 'packs'];

  const busModels = [
    'Tata Leyland', 'Ashok Leyland', 'Volvo', 'Scania', 'Marcopolo',
    'Mercedes Benz', 'MAN', 'Isuzu', 'All Models'
  ];

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          toast.error('Excel file is empty');
          return;
        }

        // Map Excel columns to our format - Support multiple column name variations
        const mappedProducts = jsonData.map((row, index) => {
          // Normalize column names (handle spaces, case variations, trim whitespace)
          const getValue = (keys) => {
            for (const key of keys) {
              // Check exact match first
              if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
                return String(row[key]).trim();
              }
              // Check case-insensitive match
              const rowKeys = Object.keys(row);
              const matchedKey = rowKeys.find(k => k.trim().toLowerCase() === key.trim().toLowerCase());
              if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== null && row[matchedKey] !== '') {
                return String(row[matchedKey]).trim();
              }
            }
            return '';
          };

          // Get unit of measure from Excel or default
          const unitOfMeasure = getValue(['Stock Unit', 'Unit of Measure', 'Unit', 'UOM']) || 'pieces';
          
          // Handle category - ensure it's lowercase
          const categoryValue = getValue(['Category', 'category']);
          const category = categoryValue ? categoryValue.toLowerCase().trim() : '';
          
          // Debug: Log first row to see what columns are available
          if (index === 0) {
            console.log('Excel columns found:', Object.keys(row));
            console.log('Sample row data:', row);
          }
          
          const product = {
            ksrcPartCode: getValue(['Part Code', 'KSRTC Part Code', 'ksrtcPartCode']),
            partName: getValue(['Part Name', 'partName', 'Name', 'Product Name']),
            category: category,
            basePrice: getValue(['Base Price (₹)', 'Base Price', 'basePrice', 'Price', 'Unit Price']),
            busModelCompatibility: getValue(['Bus Model Compatibility', 'Bus Type / Model', 'Bus Model', 'Compatibility', 'Bus Type', 'Model']),
            leadTime: getValue(['Lead Time (days)', 'Lead Time (Days)', 'Lead Time', 'leadTime', 'Lead Time Days']),
            warranty: getValue(['Warranty (months)', 'Warranty (Months)', 'Warranty', 'warranty', 'Warranty Months']),
            moq: getValue(['MOQ (Minimum Order Quantity)', 'MOQ', 'moq', 'Minimum Order Quantity', 'Min Order Qty']),
            gstRate: getValue(['GST Rate (%)', 'GST %', 'GST Rate', 'gstRate', 'GST', 'Tax Rate']) || '18',
            stock: {
              quantity: getValue(['Stock Quantity', 'Stock', 'Quantity', 'Available Stock']) || '0',
              minQuantity: getValue(['Min Quantity', 'Minimum Stock', 'Min Stock']) || '10',
              unit: unitOfMeasure
            },
            description: getValue(['Description', 'description', 'Remarks', 'Notes']) || '',
            imageUrl: getValue(['Image URL', 'imageUrl', 'Image', 'ImageUrl', 'Picture URL'])
          };
          
          // Debug: Log parsed product
          if (index === 0) {
            console.log('Parsed product:', product);
          }
          
          return product;
        });

        setProducts(mappedProducts);
        
        // Log detailed parsing results
        console.log('📊 Excel File Parsed:', {
          fileName: uploadedFile.name,
          totalRows: jsonData.length,
          parsedProducts: mappedProducts.length,
          products: mappedProducts.map((p, idx) => ({
            row: idx + 1,
            partCode: p.ksrcPartCode,
            partName: p.partName,
            category: p.category,
            price: p.basePrice,
            hasImage: !!p.imageUrl
          }))
        });
        
        toast.success(`Loaded ${mappedProducts.length} products from Excel. Check console for details.`);
      } catch (error) {
        console.error('Error parsing Excel:', error);
        toast.error('Failed to parse Excel file. Please check the format.');
      }
    };

    reader.readAsArrayBuffer(uploadedFile);
  };

  const downloadTemplate = () => {
    const template = [
      {
        'Part Code': 'ENG-001',
        'Part Name': 'Engine Oil Filter',
        'Category': 'ENGINE',
        'Base Price (₹)': '520',
        'Bus Model Compatibility': 'Diesel Bus',
        'Lead Time (days)': '5',
        'Warranty (months)': '12',
        'MOQ (Minimum Order Quantity)': '10',
        'GST Rate (%)': '18',
        'Stock Quantity': '0',
        'Stock Unit': 'pieces',
        'Description': 'Oil filtration unit',
        'Image URL': 'https://via.placeholder.com/300x200.png?text=Engine+Oil+Filter'
      },
      {
        'Part Code': 'ENG-002',
        'Part Name': 'Fuel Injector',
        'Category': 'ENGINE',
        'Base Price (₹)': '3650',
        'Bus Model Compatibility': 'Diesel Bus',
        'Lead Time (days)': '7',
        'Warranty (months)': '12',
        'MOQ (Minimum Order Quantity)': '5',
        'GST Rate (%)': '18',
        'Stock Quantity': '0',
        'Stock Unit': 'pieces',
        'Description': 'High pressure fuel injector',
        'Image URL': 'https://via.placeholder.com/300x200.png?text=Fuel+Injector'
      },
      {
        'Part Code': 'BRK-010',
        'Part Name': 'Brake Pad Set',
        'Category': 'BRAKES',
        'Base Price (₹)': '3150',
        'Bus Model Compatibility': 'City Bus',
        'Lead Time (days)': '4',
        'Warranty (months)': '6',
        'MOQ (Minimum Order Quantity)': '5',
        'GST Rate (%)': '18',
        'Stock Quantity': '0',
        'Stock Unit': 'set',
        'Description': 'Front and rear brake pads',
        'Image URL': 'https://via.placeholder.com/300x200.png?text=Brake+Pad+Set'
      },
      {
        'Part Code': 'ELC-021',
        'Part Name': 'Alternator',
        'Category': 'ELECTRICAL',
        'Base Price (₹)': '10200',
        'Bus Model Compatibility': 'All Models',
        'Lead Time (days)': '10',
        'Warranty (months)': '12',
        'MOQ (Minimum Order Quantity)': '2',
        'GST Rate (%)': '18',
        'Stock Quantity': '0',
        'Stock Unit': 'pieces',
        'Description': 'Battery charging alternator',
        'Image URL': 'https://via.placeholder.com/300x200.png?text=Alternator'
      },
      {
        'Part Code': 'SUS-031',
        'Part Name': 'Shock Absorber',
        'Category': 'SUSPENSION',
        'Base Price (₹)': '4600',
        'Bus Model Compatibility': 'All Models',
        'Lead Time (days)': '6',
        'Warranty (months)': '12',
        'MOQ (Minimum Order Quantity)': '4',
        'GST Rate (%)': '18',
        'Stock Quantity': '0',
        'Stock Unit': 'pieces',
        'Description': 'Suspension damping component',
        'Image URL': 'https://via.placeholder.com/300x200.png?text=Shock+Absorber'
      },
      {
        'Part Code': 'TYR-050',
        'Part Name': 'Radial Tyre 295/80 R22.5',
        'Category': 'TYRES',
        'Base Price (₹)': '19800',
        'Bus Model Compatibility': 'Heavy Bus',
        'Lead Time (days)': '8',
        'Warranty (months)': '24',
        'MOQ (Minimum Order Quantity)': '2',
        'GST Rate (%)': '28',
        'Stock Quantity': '0',
        'Stock Unit': 'pieces',
        'Description': 'Tubeless radial bus tyre',
        'Image URL': 'https://via.placeholder.com/300x200.png?text=Bus+Tyre'
      },
      {
        'Part Code': 'AC-060',
        'Part Name': 'AC Compressor',
        'Category': 'HVAC',
        'Base Price (₹)': '28900',
        'Bus Model Compatibility': 'AC Bus',
        'Lead Time (days)': '12',
        'Warranty (months)': '12',
        'MOQ (Minimum Order Quantity)': '1',
        'GST Rate (%)': '18',
        'Stock Quantity': '0',
        'Stock Unit': 'pieces',
        'Description': 'Air conditioning compressor',
        'Image URL': 'https://via.placeholder.com/300x200.png?text=AC+Compressor'
      },
      {
        'Part Code': 'ELC-030',
        'Part Name': 'Battery 12V 150Ah',
        'Category': 'ELECTRICAL',
        'Base Price (₹)': '15800',
        'Bus Model Compatibility': 'All Models',
        'Lead Time (days)': '5',
        'Warranty (months)': '18',
        'MOQ (Minimum Order Quantity)': '2',
        'GST Rate (%)': '18',
        'Stock Quantity': '0',
        'Stock Unit': 'pieces',
        'Description': 'Heavy duty bus battery',
        'Image URL': 'https://via.placeholder.com/300x200.png?text=Bus+Battery'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Products');
    XLSX.writeFile(wb, 'bulk-spare-parts-template.xlsx');
  };

  const addProduct = () => {
    setProducts([...products, {
      ksrcPartCode: '',
      partName: '',
      category: '',
      basePrice: '',
      busModelCompatibility: '',
      leadTime: '',
      warranty: '',
      moq: '',
      gstRate: '18',
      stock: { quantity: '', minQuantity: '10', unit: 'pieces' },
      description: '',
      imageUrl: ''
    }]);
  };

  const removeProduct = (index) => {
    if (products.length > 1) {
      setProducts(products.filter((_, i) => i !== index));
      const newErrors = { ...errors };
      delete newErrors[index];
      setErrors(newErrors);
    }
  };

  const updateProduct = (index, field, value) => {
    const updated = [...products];
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      updated[index][parent] = { ...updated[index][parent], [child]: value };
    } else {
      updated[index][field] = value;
    }
    setProducts(updated);
    
    if (errors[index] && errors[index][field]) {
      const newErrors = { ...errors };
      delete newErrors[index][field];
      if (Object.keys(newErrors[index]).length === 0) {
        delete newErrors[index];
      }
      setErrors(newErrors);
    }
  };

  const validateProducts = () => {
    const newErrors = {};
    products.forEach((product, index) => {
      const productErrors = {};
      if (!product.ksrcPartCode.trim()) {
        productErrors.ksrcPartCode = 'KSRTC Part Code is required';
      }
      if (!product.partName.trim()) {
        productErrors.partName = 'Part Name is required';
      }
      if (!product.category) {
        productErrors.category = 'Category is required';
      }
      if (!product.basePrice || parseFloat(product.basePrice) <= 0) {
        productErrors.basePrice = 'Valid base price is required';
      }
      if (!product.leadTime || parseFloat(product.leadTime) <= 0) {
        productErrors.leadTime = 'Lead time (days) is required';
      }
      if (!product.moq || parseFloat(product.moq) <= 0) {
        productErrors.moq = 'MOQ is required';
      }
      if (Object.keys(productErrors).length > 0) {
        newErrors[index] = productErrors;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateProducts()) {
      toast.error('Please fix validation errors before submitting');
      return;
    }

    setUploading(true);
    try {
      // Log upload details before submission
      console.log('📤 Starting bulk upload:', {
        totalProducts: products.length,
        products: products.map((p, idx) => ({
          index: idx + 1,
          partCode: p.ksrcPartCode.trim(),
          partName: p.partName.trim(),
          category: p.category,
          basePrice: parseFloat(p.basePrice),
          busModel: p.busModelCompatibility,
          leadTime: parseInt(p.leadTime),
          warranty: p.warranty ? parseInt(p.warranty) : 0,
          moq: parseInt(p.moq),
          gstRate: parseFloat(p.gstRate) || 18,
          stock: {
            quantity: parseFloat(p.stock.quantity) || 0,
            unit: p.stock.unit || 'pieces'
          },
          hasImage: !!p.imageUrl.trim()
        }))
      });
      
      const productsToSubmit = products.map(p => ({
        ksrcPartCode: p.ksrcPartCode.trim(),
        partName: p.partName.trim(),
        category: p.category,
        basePrice: parseFloat(p.basePrice),
        busModelCompatibility: p.busModelCompatibility.split(',').map(m => m.trim()),
        leadTime: parseInt(p.leadTime),
        warranty: p.warranty ? parseInt(p.warranty) : 0,
        moq: parseInt(p.moq),
        gstRate: parseFloat(p.gstRate) || 18,
        stock: {
          quantity: parseFloat(p.stock.quantity) || 0,
          minQuantity: parseFloat(p.stock.minQuantity) || 10,
          unit: p.stock.unit || 'pieces'
        },
        description: p.description.trim(),
        imageUrl: p.imageUrl.trim(),
        status: 'pending' // Pending admin approval
      }));

      const response = await apiFetch('/api/products/vendor/bulk-spare-parts', {
        method: 'POST',
        body: JSON.stringify({ products: productsToSubmit })
      });

      if (response.ok && response.data.success) {
        const { created, failed, errors: submitErrors, products: uploadedProducts } = response.data.data;
        if (created > 0) {
          // Show detailed success message with product list
          const productList = uploadedProducts?.slice(0, 5).map(p => `• ${p.productName || p.partName} (${p.productCode || p.ksrcPartCode})`).join('\n');
          const moreText = uploadedProducts?.length > 5 ? `\n... and ${uploadedProducts.length - 5} more` : '';
          toast.success(
            `Successfully uploaded ${created} spare part(s)${failed > 0 ? `, ${failed} failed` : ''}.\n\n${productList}${moreText}\n\nProducts are pending admin approval.`,
            { duration: 8000 }
          );
          
          // Log full details to console
          console.log('✅ Upload Summary:', {
            total: products.length,
            created,
            failed,
            products: uploadedProducts?.map(p => ({
              code: p.productCode || p.ksrcPartCode,
              name: p.productName || p.partName,
              category: p.category,
              price: p.basePrice || p.finalPrice,
              status: p.status || 'pending'
            }))
          });
          
          if (onSuccess) onSuccess();
          if (onClose) onClose();
        } else {
          toast.error('Failed to upload products. Please check the errors.');
        }
        if (submitErrors && submitErrors.length > 0) {
          console.error('❌ Product upload errors:', submitErrors);
          // Show detailed error messages
          submitErrors.forEach((error, idx) => {
            console.error(`Error ${idx + 1}:`, error);
          });
        }
      } else {
        toast.error(response.data?.message || 'Failed to upload products');
      }
    } catch (error) {
      console.error('Error uploading products:', error);
      toast.error('Failed to upload products. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Bulk Upload Spare Parts</h2>
            <p className="text-sm text-gray-600 mt-1">Upload bus parts for admin approval</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 border-b bg-gray-50">
          <div className="flex gap-4 items-center">
            <button
              onClick={() => setUploadMethod('file')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                uploadMethod === 'file' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300'
              }`}
            >
              <FileSpreadsheet size={18} />
              Upload Excel/CSV
            </button>
            <button
              onClick={() => setUploadMethod('manual')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                uploadMethod === 'manual' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300'
              }`}
            >
              <FileText size={18} />
              Manual Entry
            </button>
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Download size={18} />
              Download Template
            </button>
          </div>

          {uploadMethod === 'file' && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Excel/CSV File
              </label>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {file && (
                <p className="mt-2 text-sm text-gray-600">Selected: {file.name}</p>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Upload Summary Banner */}
          {products.length > 0 && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-blue-900">Upload Summary</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    {products.length} product{products.length !== 1 ? 's' : ''} ready to upload
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{products.length}</div>
                  <div className="text-xs text-blue-600">Total Parts</div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="text-blue-600 font-medium">With Images:</span>{' '}
                  <span className="text-blue-900">{products.filter(p => p.imageUrl?.trim()).length}</span>
                </div>
                <div>
                  <span className="text-blue-600 font-medium">Categories:</span>{' '}
                  <span className="text-blue-900">{new Set(products.map(p => p.category).filter(Boolean)).size}</span>
                </div>
                <div>
                  <span className="text-blue-600 font-medium">Total Value:</span>{' '}
                  <span className="text-blue-900">₹{products.reduce((sum, p) => sum + (parseFloat(p.basePrice) || 0), 0).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-blue-600 font-medium">Avg Price:</span>{' '}
                  <span className="text-blue-900">₹{products.length > 0 ? (products.reduce((sum, p) => sum + (parseFloat(p.basePrice) || 0), 0) / products.length).toFixed(0) : 0}</span>
                </div>
              </div>
            </div>
          )}
          
          {uploadMethod === 'manual' && (
            <div className="mb-4">
              <button
                onClick={addProduct}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Plus size={18} />
                Add Part
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {products.map((product, index) => (
              <div key={index} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">Part #{index + 1}</h3>
                  {products.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeProduct(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      KSRTC Part Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={product.ksrcPartCode}
                      onChange={(e) => updateProduct(index, 'ksrcPartCode', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg ${errors[index]?.ksrcPartCode ? 'border-red-500' : 'border-gray-300'}`}
                      required
                    />
                    {errors[index]?.ksrcPartCode && (
                      <p className="text-red-500 text-xs mt-1">{errors[index].ksrcPartCode}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Part Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={product.partName}
                      onChange={(e) => updateProduct(index, 'partName', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg ${errors[index]?.partName ? 'border-red-500' : 'border-gray-300'}`}
                      required
                    />
                    {errors[index]?.partName && (
                      <p className="text-red-500 text-xs mt-1">{errors[index].partName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={product.category}
                      onChange={(e) => updateProduct(index, 'category', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg ${errors[index]?.category ? 'border-red-500' : 'border-gray-300'}`}
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Base Price (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={product.basePrice}
                      onChange={(e) => updateProduct(index, 'basePrice', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg ${errors[index]?.basePrice ? 'border-red-500' : 'border-gray-300'}`}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bus Model Compatibility <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={product.busModelCompatibility}
                      onChange={(e) => updateProduct(index, 'busModelCompatibility', e.target.value)}
                      placeholder="e.g., Tata Leyland, Ashok Leyland"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lead Time (days) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={product.leadTime}
                      onChange={(e) => updateProduct(index, 'leadTime', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg ${errors[index]?.leadTime ? 'border-red-500' : 'border-gray-300'}`}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Warranty (months)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={product.warranty}
                      onChange={(e) => updateProduct(index, 'warranty', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      MOQ (Minimum Order Quantity) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={product.moq}
                      onChange={(e) => updateProduct(index, 'moq', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg ${errors[index]?.moq ? 'border-red-500' : 'border-gray-300'}`}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      GST Rate (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={product.gstRate}
                      onChange={(e) => updateProduct(index, 'gstRate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stock Quantity
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={product.stock.quantity}
                      onChange={(e) => updateProduct(index, 'stock.quantity', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stock Unit
                    </label>
                    <select
                      value={product.stock.unit}
                      onChange={(e) => updateProduct(index, 'stock.unit', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      {units.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={product.description}
                      onChange={(e) => updateProduct(index, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      rows="2"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Image URL
                    </label>
                    <input
                      type="url"
                      value={product.imageUrl}
                      onChange={(e) => updateProduct(index, 'imageUrl', e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    {product.imageUrl && (
                      <div className="mt-2">
                        <img
                          src={product.imageUrl}
                          alt={product.partName || 'Product preview'}
                          className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                        />
                        <div className="hidden text-xs text-red-500 mt-1">Failed to load image</div>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Enter a valid image URL to display the product image</p>
                  </div>
                </div>
              </div>
            ))}
          </form>
        </div>

        <div className="flex items-center justify-end gap-4 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
            disabled={uploading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={uploading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Uploading...
              </>
            ) : (
              <>
                <Upload size={18} />
                Upload {products.length} Part(s)
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkSparePartsUpload;
