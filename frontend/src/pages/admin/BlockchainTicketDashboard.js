import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

const BlockchainTicketDashboard = () => {
  const [stats, setStats] = useState(null);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingId, setBookingId] = useState("");
  const [tokenId, setTokenId] = useState("");
  const [issuing, setIssuing] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  useEffect(() => {
    fetchStats();
    fetchBalance();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/api/blockchain/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(response.data.data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBalance = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/api/blockchain/balance`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBalance(response.data.data.balance);
    } catch (error) {
      console.error("Failed to fetch balance:", error);
    }
  };

  const handleIssueTicket = async (e) => {
    e.preventDefault();
    if (!bookingId.trim()) {
      toast.error("Please enter a booking ID");
      return;
    }

    setIssuing(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_URL}/api/blockchain/issue-ticket`,
        { bookingId: bookingId.trim() },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      toast.success("Blockchain ticket issued successfully!");
      setBookingId("");
      fetchStats();

      // Show transaction details
      const { tokenId, transactionHash, explorerUrl } = response.data.data;
      toast.success(
        <div>
          <p>Token ID: {tokenId}</p>
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline"
          >
            View on PolygonScan
          </a>
        </div>,
        { duration: 10000 },
      );
    } catch (error) {
      const message = error.response?.data?.message || "Failed to issue ticket";
      toast.error(message);
    } finally {
      setIssuing(false);
    }
  };

  const handleVerifyTicket = async (e) => {
    e.preventDefault();
    if (!tokenId.trim()) {
      toast.error("Please enter a token ID");
      return;
    }

    setVerifying(true);
    setVerificationResult(null);
    try {
      const response = await axios.get(
        `${API_URL}/api/blockchain/verify-ticket/${tokenId.trim()}`,
      );
      setVerificationResult(response.data.data);

      if (response.data.data.isValid) {
        toast.success("Ticket is valid!");
      } else {
        toast.error("Ticket is invalid or already used");
      }
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to verify ticket";
      toast.error(message);
      setVerificationResult(null);
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🔗 Blockchain Ticket System
        </h1>
        <p className="text-gray-600">
          Issue and verify fraud-proof tickets on Polygon blockchain
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Tickets</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats?.totalTickets || 0}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Wallet Balance</p>
              <p className="text-3xl font-bold text-gray-900">
                {balance ? parseFloat(balance).toFixed(4) : "0.0000"}
              </p>
              <p className="text-xs text-gray-500 mt-1">MATIC</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <svg
                className="w-8 h-8 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Contract Address</p>
              <p className="text-xs font-mono text-gray-900 break-all">
                {stats?.contractAddress
                  ? `${stats.contractAddress.substring(0, 10)}...${stats.contractAddress.substring(stats.contractAddress.length - 8)}`
                  : "Not deployed"}
              </p>
              {stats?.contractAddress && (
                <a
                  href={`https://mumbai.polygonscan.com/address/${stats.contractAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                >
                  View on PolygonScan →
                </a>
              )}
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Status by Type */}
      {stats?.byStatus && stats.byStatus.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Tickets by Status
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.byStatus.map((item) => (
              <div key={item._id} className="border rounded-lg p-4">
                <p className="text-sm text-gray-600 capitalize">{item._id}</p>
                <p className="text-2xl font-bold text-gray-900">{item.count}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Issue Ticket Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            🎫 Issue Blockchain Ticket
          </h2>
          <form onSubmit={handleIssueTicket}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Booking ID
              </label>
              <input
                type="text"
                value={bookingId}
                onChange={(e) => setBookingId(e.target.value)}
                placeholder="Enter booking ID"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={issuing}
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the MongoDB booking ID to issue a blockchain ticket
              </p>
            </div>
            <button
              type="submit"
              disabled={issuing || !bookingId.trim()}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {issuing ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Issuing...
                </span>
              ) : (
                "Issue Ticket"
              )}
            </button>
          </form>
        </div>

        {/* Verify Ticket Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            🔍 Verify Ticket
          </h2>
          <form onSubmit={handleVerifyTicket}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Token ID
              </label>
              <input
                type="text"
                value={tokenId}
                onChange={(e) => setTokenId(e.target.value)}
                placeholder="Enter token ID"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={verifying}
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the token ID from the QR code
              </p>
            </div>
            <button
              type="submit"
              disabled={verifying || !tokenId.trim()}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {verifying ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Verifying...
                </span>
              ) : (
                "Verify Ticket"
              )}
            </button>
          </form>

          {/* Verification Result */}
          {verificationResult && (
            <div
              className={`mt-4 p-4 rounded-lg ${verificationResult.isValid ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {verificationResult.isValid ? (
                    <svg
                      className="h-5 w-5 text-green-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-5 w-5 text-red-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <div className="ml-3">
                  <h3
                    className={`text-sm font-medium ${verificationResult.isValid ? "text-green-800" : "text-red-800"}`}
                  >
                    {verificationResult.isValid
                      ? "Valid Ticket"
                      : "Invalid Ticket"}
                  </h3>
                  {verificationResult.ticket && (
                    <div className="mt-2 text-sm text-gray-700">
                      <p>
                        <strong>Booking ID:</strong>{" "}
                        {verificationResult.ticket.bookingId}
                      </p>
                      <p>
                        <strong>Route:</strong>{" "}
                        {verificationResult.ticket.routeId}
                      </p>
                      <p>
                        <strong>Passenger:</strong>{" "}
                        {verificationResult.ticket.passengerName}
                      </p>
                      <p>
                        <strong>Fare:</strong> ₹{verificationResult.ticket.fare}
                      </p>
                      <p>
                        <strong>Used:</strong>{" "}
                        {verificationResult.ticket.isUsed ? "Yes" : "No"}
                      </p>
                      <p>
                        <strong>Refunded:</strong>{" "}
                        {verificationResult.ticket.isRefunded ? "Yes" : "No"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          ℹ️ About Blockchain Tickets
        </h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>✅ Immutable - Cannot be altered or forged</li>
          <li>✅ Verifiable - Anyone can verify authenticity</li>
          <li>✅ Transparent - All transactions on blockchain</li>
          <li>✅ Low Cost - ~$0.001 per ticket on Polygon</li>
          <li>✅ Fast - Confirms in 2-3 seconds</li>
        </ul>
      </div>
    </div>
  );
};

export default BlockchainTicketDashboard;
