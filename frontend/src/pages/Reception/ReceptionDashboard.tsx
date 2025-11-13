import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import chequeService, { Cheque } from '../../services/chequeService';
import GenerateOtpModal from '../../components/Cheques/GenerateOtpModal';
import VerifyOtpModal from '../../components/Cheques/VerifyOtpModal';
import ChequeDetailModal from '../../components/Cheques/ChequeDetailModal';

const ReceptionDashboard: React.FC = () => {
  const [cheques, setCheques] = useState<Cheque[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('WITH_RECEPTION');
  const [selectedCheque, setSelectedCheque] = useState<Cheque | null>(null);
  const [showGenerateOtp, setShowGenerateOtp] = useState(false);
  const [showVerifyOtp, setShowVerifyOtp] = useState(false);
  const [showChequeDetail, setShowChequeDetail] = useState(false);

  useEffect(() => {
    loadCheques();
  }, [statusFilter, searchTerm]);

  const loadCheques = async () => {
    try {
      setLoading(true);
      const response = await chequeService.listCheques({
        status: statusFilter,
        search: searchTerm || undefined,
      });
      setCheques(response.cheques);
    } catch (error: any) {
      console.error('Error loading cheques:', error);
      alert(error.response?.data?.error || 'Failed to load cheques');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateOtp = (cheque: Cheque) => {
    setSelectedCheque(cheque);
    setShowGenerateOtp(true);
  };

  const handleVerifyOtp = (cheque: Cheque) => {
    setSelectedCheque(cheque);
    setShowVerifyOtp(true);
  };

  const handleViewDetails = (cheque: Cheque) => {
    setSelectedCheque(cheque);
    setShowChequeDetail(true);
  };

  const handleOtpGenerated = () => {
    setShowGenerateOtp(false);
    loadCheques();
  };

  const handleOtpVerified = () => {
    setShowVerifyOtp(false);
    loadCheques();
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string }> = {
      SIGNED: { bg: 'bg-slate-500/20', text: 'text-slate-400' },
      READY_FOR_DISPATCH: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
      WITH_RECEPTION: { bg: 'bg-violet-500/20', text: 'text-violet-400' },
      ISSUED: { bg: 'bg-green-500/20', text: 'text-green-400' },
      CANCELLED: { bg: 'bg-red-500/20', text: 'text-red-400' },
    };

    const config = statusConfig[status] || statusConfig.SIGNED;

    return (
      <span
        className={`px-2 py-1 rounded text-xs font-medium ${config.bg} ${config.text}`}
      >
        {status.replace(/_/g, ' ')}
      </span>
    );
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-600 mb-2">
            Reception Dashboard
          </h1>
          <p className="text-slate-400">
            Manage cheque handovers with OTP verification
          </p>
        </div>

        {/* Filters */}
        <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Search
              </label>
              <input
                type="text"
                placeholder="Cheque No, Payee, Bank..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
              >
                <option value="">All Statuses</option>
                <option value="WITH_RECEPTION">With Reception</option>
                <option value="READY_FOR_DISPATCH">Ready for Dispatch</option>
                <option value="ISSUED">Issued</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            {/* Refresh Button */}
            <div className="flex items-end">
              <button
                onClick={loadCheques}
                disabled={loading}
                className="w-full px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/50 rounded-lg font-medium transition-all disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>

        {/* Cheques Table */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-cyan-400">Loading cheques...</div>
          </div>
        ) : cheques.length === 0 ? (
          <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-lg p-12 text-center">
            <p className="text-slate-400 text-lg">No cheques found</p>
          </div>
        ) : (
          <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-900/50 border-b border-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Cheque No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Payee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Bank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {cheques.map((cheque) => (
                    <tr
                      key={cheque.id}
                      className="hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-slate-100">
                          {cheque.chequeNo}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-100">{cheque.payeeName}</div>
                        <div className="text-xs text-slate-400">
                          from {cheque.payerName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-cyan-400">
                          ₹{cheque.amount.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-100">{cheque.bank}</div>
                        <div className="text-xs text-slate-400">
                          {cheque.branch}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className={
                            isOverdue(cheque.dueDate)
                              ? 'text-red-400 font-medium'
                              : 'text-slate-100'
                          }
                        >
                          {format(new Date(cheque.dueDate), 'MMM dd, yyyy')}
                        </div>
                        {isOverdue(cheque.dueDate) && (
                          <div className="text-xs text-red-400">Overdue</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(cheque.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                        <button
                          onClick={() => handleViewDetails(cheque)}
                          className="text-slate-400 hover:text-cyan-400 transition-colors"
                        >
                          View
                        </button>
                        {cheque.status === 'WITH_RECEPTION' && (
                          <>
                            <button
                              onClick={() => handleGenerateOtp(cheque)}
                              className="text-violet-400 hover:text-violet-300 transition-colors"
                            >
                              Generate OTP
                            </button>
                            <button
                              onClick={() => handleVerifyOtp(cheque)}
                              className="text-green-400 hover:text-green-300 transition-colors"
                            >
                              Verify OTP
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedCheque && showGenerateOtp && (
        <GenerateOtpModal
          cheque={selectedCheque}
          onClose={() => setShowGenerateOtp(false)}
          onSuccess={handleOtpGenerated}
        />
      )}

      {selectedCheque && showVerifyOtp && (
        <VerifyOtpModal
          cheque={selectedCheque}
          onClose={() => setShowVerifyOtp(false)}
          onSuccess={handleOtpVerified}
        />
      )}

      {selectedCheque && showChequeDetail && (
        <ChequeDetailModal
          cheque={selectedCheque}
          onClose={() => setShowChequeDetail(false)}
          onRefresh={loadCheques}
        />
      )}
    </div>
  );
};

export default ReceptionDashboard;

