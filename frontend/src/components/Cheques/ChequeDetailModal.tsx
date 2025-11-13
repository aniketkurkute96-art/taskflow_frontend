import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import chequeService, { Cheque, AuditLog, CustodyLog } from '../../services/chequeService';

interface ChequeDetailModalProps {
  cheque: Cheque;
  onClose: () => void;
  onRefresh: () => void;
}

const ChequeDetailModal: React.FC<ChequeDetailModalProps> = ({
  cheque: initialCheque,
  onClose,
  onRefresh,
}) => {
  const [cheque, setCheque] = useState<Cheque>(initialCheque);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [activeTab, setActiveTab] = useState<'details' | 'custody' | 'audit'>('details');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadChequeDetails();
  }, []);

  const loadChequeDetails = async () => {
    try {
      setLoading(true);
      const [chequeData, auditData] = await Promise.all([
        chequeService.getChequeById(initialCheque.id),
        chequeService.getAuditTrail(initialCheque.id),
      ]);
      setCheque(chequeData);
      setAuditLogs(auditData);
    } catch (error: any) {
      console.error('Error loading cheque details:', error);
    } finally {
      setLoading(false);
    }
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
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        {status.replace(/_/g, ' ')}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-600">
              Cheque Details
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              {cheque.chequeNo} • {getStatusBadge(cheque.status)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700 bg-slate-900/50">
          {['details', 'custody', 'audit'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex-1 px-6 py-3 font-medium capitalize transition-all ${
                activeTab === tab
                  ? 'text-cyan-400 border-b-2 border-cyan-400'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-cyan-400">Loading...</div>
            </div>
          ) : (
            <>
              {activeTab === 'details' && (
                <div className="space-y-6">
                  {/* Cheque Information */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-400 uppercase">Cheque Number</label>
                      <div className="text-slate-100 font-semibold mt-1">{cheque.chequeNo}</div>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 uppercase">Amount</label>
                      <div className="text-cyan-400 font-bold text-xl mt-1">
                        ₹{cheque.amount.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 uppercase">Bank</label>
                      <div className="text-slate-100 mt-1">{cheque.bank}</div>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 uppercase">Branch</label>
                      <div className="text-slate-100 mt-1">{cheque.branch}</div>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 uppercase">Payer</label>
                      <div className="text-slate-100 mt-1">{cheque.payerName}</div>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 uppercase">Payee</label>
                      <div className="text-slate-100 mt-1">{cheque.payeeName}</div>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 uppercase">Due Date</label>
                      <div className="text-slate-100 mt-1">
                        {format(new Date(cheque.dueDate), 'MMM dd, yyyy')}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 uppercase">Created</label>
                      <div className="text-slate-100 mt-1">
                        {format(new Date(cheque.createdAt), 'MMM dd, yyyy HH:mm')}
                      </div>
                    </div>
                  </div>

                  {/* Initiator */}
                  {cheque.initiator && (
                    <div className="bg-slate-900/50 rounded-lg p-4">
                      <label className="text-xs text-slate-400 uppercase">Initiated By</label>
                      <div className="text-slate-100 font-medium mt-1">{cheque.initiator.name}</div>
                      <div className="text-sm text-slate-400">{cheque.initiator.email}</div>
                      <div className="text-xs text-slate-500 mt-1 capitalize">{cheque.initiator.role}</div>
                    </div>
                  )}

                  {/* Handover Record */}
                  {cheque.handoverRecords && cheque.handoverRecords.length > 0 && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                      <label className="text-xs text-green-400 uppercase font-medium">Handover Details</label>
                      {cheque.handoverRecords.map((record) => (
                        <div key={record.id} className="mt-3 space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-slate-400">Recipient:</span>
                            <span className="text-slate-100 font-medium">{record.recipientName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-slate-400">ID:</span>
                            <span className="text-slate-100">{record.idType} - {record.idNumber}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-slate-400">Handed By:</span>
                            <span className="text-slate-100">{record.handedByUser?.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-slate-400">Date:</span>
                            <span className="text-slate-100">
                              {format(new Date(record.handedAt), 'MMM dd, yyyy HH:mm')}
                            </span>
                          </div>
                          {record.isOverride && (
                            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded px-2 py-1 mt-2">
                              <span className="text-xs text-yellow-400">⚠️ Manual Override</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'custody' && (
                <div className="space-y-4">
                  {cheque.custodyLogs && cheque.custodyLogs.length > 0 ? (
                    <div className="relative">
                      {/* Timeline */}
                      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-700"></div>

                      {cheque.custodyLogs.map((log, index) => (
                        <div key={log.id} className="relative pl-12 pb-8">
                          {/* Timeline dot */}
                          <div className="absolute left-2.5 w-3 h-3 bg-cyan-400 rounded-full border-4 border-slate-800"></div>

                          {/* Content */}
                          <div className="bg-slate-900/50 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <div className="font-medium text-slate-100">
                                  {log.fromRole} → {log.toRole}
                                </div>
                                <div className="text-xs text-slate-400 mt-1">
                                  {format(new Date(log.handedAt), 'MMM dd, yyyy HH:mm')}
                                </div>
                              </div>
                            </div>

                            {log.notes && (
                              <div className="text-sm text-slate-300 mt-2">
                                {log.notes}
                              </div>
                            )}

                            {log.createdByUser && (
                              <div className="text-xs text-slate-500 mt-2">
                                by {log.createdByUser.name}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-400">
                      No custody logs available
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'audit' && (
                <div className="space-y-2">
                  {auditLogs.length > 0 ? (
                    auditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="bg-slate-900/50 rounded-lg p-4 hover:bg-slate-900/70 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 text-xs font-mono rounded">
                                {log.action}
                              </span>
                              {log.performedBy && (
                                <span className="text-sm text-slate-400">
                                  by {log.performedBy.name}
                                </span>
                              )}
                            </div>

                            {log.details && (
                              <pre className="text-xs text-slate-400 mt-2 overflow-x-auto">
                                {JSON.stringify(JSON.parse(log.details), null, 2)}
                              </pre>
                            )}
                          </div>

                          <div className="text-xs text-slate-500 text-right">
                            {format(new Date(log.createdAt), 'MMM dd, yyyy')}<br />
                            {format(new Date(log.createdAt), 'HH:mm:ss')}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-slate-400">
                      No audit logs available
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-slate-700">
          <button
            onClick={() => {
              loadChequeDetails();
              onRefresh();
            }}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg font-medium transition-all"
          >
            Refresh
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-600 hover:to-violet-700 text-white rounded-lg font-medium transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChequeDetailModal;

