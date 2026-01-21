import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, XCircle, Clock, Lock, Unlock, Download, X } from 'lucide-react';
import { apiFetch } from '../../utils/api';
import toast from 'react-hot-toast';

const ProfileCompliancePage = ({ profile, onUpdate }) => {
  const [uploadingDoc, setUploadingDoc] = useState(null);
  const [documents, setDocuments] = useState({
    gstCertificate: null,
    tradeLicense: null,
    idProof: null,
    bankCheque: null,
    msmeCertificate: null,
    isoCertificate: null,
    vendorAgreement: null
  });

  const handleDocumentUpload = async (docType, file) => {
    if (!file) return;

    setUploadingDoc(docType);
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('documentType', docType);

      const response = await apiFetch('/api/vendor/upload-document', {
        method: 'POST',
        body: formData
      });

      if (response.ok && response.data.success) {
        toast.success(`${docType.replace(/_/g, ' ')} uploaded successfully`);
        setDocuments(prev => ({
          ...prev,
          [docType]: {
            url: response.data.data.url,
            uploadedAt: new Date(),
            verified: false
          }
        }));
        if (onUpdate) onUpdate();
      } else {
        toast.error(response.data?.message || 'Failed to upload document');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document');
    } finally {
      setUploadingDoc(null);
    }
  };

  const getDocumentStatus = (doc) => {
    if (!doc) return { status: 'missing', color: 'text-red-600', bg: 'bg-red-50', icon: XCircle };
    if (doc.verified) return { status: 'verified', color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle };
    if (doc.expiryDate && new Date(doc.expiryDate) < new Date()) {
      return { status: 'expired', color: 'text-red-600', bg: 'bg-red-50', icon: XCircle };
    }
    return { status: 'pending', color: 'text-yellow-600', bg: 'bg-yellow-50', icon: Clock };
  };

  const isFieldLocked = (fieldName) => {
    // Lock critical fields after approval
    const lockedFields = ['companyName', 'panNumber', 'gstNumber', 'email'];
    return profile?.status === 'approved' && lockedFields.includes(fieldName);
  };

  return (
    <div className="space-y-6">
      {/* Profile Management */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Profile Management</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Legal Name {isFieldLocked('companyName') && <Lock className="w-3 h-3 inline text-gray-400" />}
            </label>
            <input
              type="text"
              value={profile?.companyName || ''}
              disabled={isFieldLocked('companyName')}
              className={`w-full px-3 py-2 border rounded-lg ${isFieldLocked('companyName') ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
              readOnly={isFieldLocked('companyName')}
            />
            {isFieldLocked('companyName') && (
              <p className="text-xs text-gray-500 mt-1">Locked after approval</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              GSTIN {isFieldLocked('gstNumber') && <Lock className="w-3 h-3 inline text-gray-400" />}
            </label>
            <input
              type="text"
              value={profile?.gstNumber || profile?.businessDetails?.gstNumber || ''}
              disabled={isFieldLocked('gstNumber')}
              className={`w-full px-3 py-2 border rounded-lg ${isFieldLocked('gstNumber') ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
              readOnly={isFieldLocked('gstNumber')}
            />
            {isFieldLocked('gstNumber') && (
              <p className="text-xs text-gray-500 mt-1">Locked after approval</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              PAN {isFieldLocked('panNumber') && <Lock className="w-3 h-3 inline text-gray-400" />}
            </label>
            <input
              type="text"
              value={profile?.panNumber || ''}
              disabled={isFieldLocked('panNumber')}
              className={`w-full px-3 py-2 border rounded-lg ${isFieldLocked('panNumber') ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
              readOnly={isFieldLocked('panNumber')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Registered Address</label>
            <textarea
              value={profile?.businessDetails?.businessAddress || profile?.address || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              rows="3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account (Encrypted)</label>
            <input
              type="text"
              value={profile?.bankDetails?.accountNumber ? `****${profile.bankDetails.accountNumber.slice(-4)}` : ''}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">Account number is encrypted for security</p>
          </div>
        </div>
      </div>

      {/* Compliance Document Upload */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Compliance Documents</h2>
        <p className="text-sm text-gray-600 mb-4">Upload required documents. Each document has upload date, expiry date, and approval status.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'gstCertificate', label: 'GST Certificate', required: true },
            { key: 'tradeLicense', label: 'Trade License', required: true },
            { key: 'idProof', label: 'ID Proof', required: true },
            { key: 'bankCheque', label: 'Bank Cheque/Cancelled Cheque', required: true },
            { key: 'msmeCertificate', label: 'MSME Certificate', required: false },
            { key: 'isoCertificate', label: 'ISO / Quality Certificate', required: false },
            { key: 'vendorAgreement', label: 'Vendor Agreement', required: false }
          ].map((doc) => {
            const docData = profile?.documents?.[doc.key] || documents[doc.key];
            const status = getDocumentStatus(docData);
            const StatusIcon = status.icon;

            return (
              <div key={doc.key} className={`border-2 rounded-lg p-4 ${status.bg}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-gray-900">{doc.label}</span>
                    {doc.required && <span className="text-red-500 text-xs">*</span>}
                  </div>
                  <StatusIcon className={`w-5 h-5 ${status.color}`} />
                </div>

                {docData && (
                  <div className="text-xs text-gray-600 mb-2 space-y-1">
                    <p>Uploaded: {new Date(docData.uploadedAt || docData.uploadedAt).toLocaleDateString()}</p>
                    {docData.expiryDate && (
                      <p>Expires: {new Date(docData.expiryDate).toLocaleDateString()}</p>
                    )}
                    <p>Status: <span className="font-semibold capitalize">{status.status}</span></p>
                    {docData.url && (
                      <a href={docData.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                        <Download className="w-3 h-3" />
                        View Document
                      </a>
                    )}
                  </div>
                )}

                <label className="block">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      if (e.target.files[0]) {
                        handleDocumentUpload(doc.key, e.target.files[0]);
                      }
                    }}
                    disabled={uploadingDoc === doc.key}
                    className="hidden"
                    id={`upload-${doc.key}`}
                  />
                  <div className={`mt-2 flex items-center justify-center px-4 py-2 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 ${
                    uploadingDoc === doc.key ? 'opacity-50 cursor-not-allowed' : ''
                  }`}>
                    {uploadingDoc === doc.key ? (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                        Uploading...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Upload className="w-4 h-4" />
                        {docData ? 'Replace Document' : 'Upload Document'}
                      </div>
                    )}
                  </div>
                </label>
              </div>
            );
          })}
        </div>

        {/* System Impact Notice */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="text-sm font-semibold text-yellow-800 mb-2">System Impact</h3>
          <ul className="text-xs text-yellow-700 space-y-1">
            <li>• Expired document → PO blocked</li>
            <li>• Rejected compliance → Vendor suspended</li>
            <li>• Approved compliance → Trust score increases</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ProfileCompliancePage;
