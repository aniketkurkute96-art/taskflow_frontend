import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import chequeService from '../../services/chequeService';

interface FormState {
  chequeNo: string;
  amount: string;
  bank: string;
  branch: string;
  payerName: string;
  payeeName: string;
  dueDate: string;
  notes: string;
}

const initialState: FormState = {
  chequeNo: '',
  amount: '',
  bank: '',
  branch: '',
  payerName: '',
  payeeName: '',
  dueDate: '',
  notes: '',
};

const ChequeCreate: React.FC = () => {
  const [form, setForm] = useState<FormState>(initialState);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAttachmentUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!event.target.files?.length) return;

    try {
      setError(null);
      const file = event.target.files[0];
      const upload = await chequeService.uploadFile(file);
      setAttachments((prev) => [...prev, upload.path]);
    } catch (uploadError: any) {
      setError(uploadError?.message || 'Failed to upload attachment');
    } finally {
      event.target.value = '';
    }
  };

  const removeAttachment = (path: string) => {
    setAttachments((prev) => prev.filter((item) => item !== path));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!form.dueDate) {
      setError('Due date is required');
      return;
    }

    const amountNumber = parseFloat(form.amount);
    if (Number.isNaN(amountNumber) || amountNumber <= 0) {
      setError('Amount must be a positive number');
      return;
    }

    try {
      setIsSubmitting(true);
      const cheque = await chequeService.createCheque({
        chequeNo: form.chequeNo.trim(),
        amount: amountNumber,
        bank: form.bank.trim(),
        branch: form.branch.trim(),
        payerName: form.payerName.trim(),
        payeeName: form.payeeName.trim(),
        dueDate: form.dueDate,
        attachments: attachments.length ? attachments : undefined,
      });

      setSuccessMessage(
        `Cheque ${cheque.chequeNo} created successfully. Status: ${cheque.status}`
      );
      setForm(initialState);
      setAttachments([]);

      setTimeout(() => {
        navigate('/workspace');
      }, 2000);
    } catch (submitError: any) {
      setError(
        submitError?.response?.data?.error ||
          submitError?.message ||
          'Failed to create cheque'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <div className="max-w-5xl mx-auto py-10 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-600">
            Create Cheque
          </h1>
          <p className="text-slate-400 mt-2 max-w-2xl">
            Register a cheque for custody tracking. Created cheques start in the
            <span className="text-cyan-400"> SIGNED</span> state. Move them to
            dispatch using the API or future workflow actions.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-8 bg-slate-800/70 border border-slate-700 rounded-xl p-8 shadow-lg"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Cheque Number *
              </label>
              <input
                name="chequeNo"
                value={form.chequeNo}
                onChange={handleChange}
                required
                placeholder="CHQ-2025-001"
                className="w-full rounded-lg border border-slate-600 bg-slate-900/60 px-4 py-3 text-slate-100 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Amount (₹) *
              </label>
              <input
                name="amount"
                value={form.amount}
                onChange={handleChange}
                required
                type="number"
                min="0"
                step="0.01"
                placeholder="50000"
                className="w-full rounded-lg border border-slate-600 bg-slate-900/60 px-4 py-3 text-slate-100 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Bank *
              </label>
              <input
                name="bank"
                value={form.bank}
                onChange={handleChange}
                required
                placeholder="State Bank of India"
                className="w-full rounded-lg border border-slate-600 bg-slate-900/60 px-4 py-3 text-slate-100 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Branch *
              </label>
              <input
                name="branch"
                value={form.branch}
                onChange={handleChange}
                required
                placeholder="Pune Camp"
                className="w-full rounded-lg border border-slate-600 bg-slate-900/60 px-4 py-3 text-slate-100 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Payer Name *
              </label>
              <input
                name="payerName"
                value={form.payerName}
                onChange={handleChange}
                required
                placeholder="Nagrik Pvt Ltd"
                className="w-full rounded-lg border border-slate-600 bg-slate-900/60 px-4 py-3 text-slate-100 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Payee Name *
              </label>
              <input
                name="payeeName"
                value={form.payeeName}
                onChange={handleChange}
                required
                placeholder="Acme Services"
                className="w-full rounded-lg border border-slate-600 bg-slate-900/60 px-4 py-3 text-slate-100 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Due Date *
              </label>
              <input
                name="dueDate"
                value={form.dueDate}
                onChange={handleChange}
                required
                type="date"
                className="w-full rounded-lg border border-slate-600 bg-slate-900/60 px-4 py-3 text-slate-100 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Internal Notes
              </label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={3}
                placeholder="Optional notes, instructions, or context"
                className="w-full rounded-lg border border-slate-600 bg-slate-900/60 px-4 py-3 text-slate-100 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Attachments
            </label>
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-2 rounded-lg border border-dashed border-slate-600 px-4 py-3 text-sm text-slate-300 cursor-pointer hover:border-cyan-400 hover:text-cyan-300 transition-all">
                <input
                  type="file"
                  className="hidden"
                  accept="image/*,.pdf"
                  onChange={handleAttachmentUpload}
                />
                <span>+ Upload Document</span>
              </label>
              {attachments.map((path) => (
                <span
                  key={path}
                  className="inline-flex items-center gap-2 rounded-full bg-cyan-500/20 text-cyan-300 px-4 py-2 text-xs"
                >
                  {path.split('/').pop()}
                  <button
                    type="button"
                    className="text-slate-300 hover:text-red-300"
                    onClick={() => removeAttachment(path)}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="rounded-lg border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm text-green-300">
              {successMessage}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-5 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700/60 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-600 hover:to-violet-700 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating…' : 'Create Cheque'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChequeCreate;


