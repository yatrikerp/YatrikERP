import React from 'react';
import { Shield, ExternalLink, CheckCircle } from 'lucide-react';

const BlockchainTicketBadge = ({ blockchain, size = 'md' }) => {
  if (!blockchain || !blockchain.tokenId) {
    return null;
  }

  const sizes = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-2',
    lg: 'text-base px-4 py-3'
  };

  return (
    <div className={`bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg ${sizes[size]}`}>
      <div className="flex items-center gap-2">
        <Shield className="text-blue-600" size={size === 'sm' ? 14 : size === 'md' ? 16 : 20} />
        <div className="flex-1">
          <div className="flex items-center gap-1">
            <CheckCircle className="text-green-600" size={12} />
            <span className="font-semibold text-gray-800">Blockchain Verified</span>
          </div>
          <div className="text-gray-600 mt-1">
            Token ID: <span className="font-mono font-medium">{blockchain.tokenId}</span>
          </div>
        </div>
        {blockchain.explorerUrl && (
          <a
            href={blockchain.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 transition-colors"
            title="View on PolygonScan"
          >
            <ExternalLink size={size === 'sm' ? 14 : size === 'md' ? 16 : 20} />
          </a>
        )}
      </div>
      <div className="mt-2 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span>Immutable • Fraud-proof • Transparent</span>
        </div>
      </div>
    </div>
  );
};

export default BlockchainTicketBadge;
