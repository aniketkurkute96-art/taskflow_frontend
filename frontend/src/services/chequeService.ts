import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export interface Cheque {
  id: string;
  chequeNo: string;
  amount: number;
  bank: string;
  branch: string;
  payerName: string;
  payeeName: string;
  dueDate: string;
  status: 'SIGNED' | 'READY_FOR_DISPATCH' | 'WITH_RECEPTION' | 'ISSUED' | 'CANCELLED';
  initiatorId: string;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
  initiator?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  custodyLogs?: CustodyLog[];
  handoverRecords?: HandoverRecord[];
  auditLogs?: AuditLog[];
}

export interface CustodyLog {
  id: string;
  chequeId: string;
  fromRole: string;
  toRole: string;
  handedAt: string;
  expectedReturnDate?: string;
  actualReturnDate?: string;
  notes?: string;
  createdBy: string;
  createdByUser?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

export interface HandoverRecord {
  id: string;
  chequeId: string;
  recipientName: string;
  idType: string;
  idNumber: string;
  recipientPhotoPath: string;
  signaturePath: string;
  handedBy: string;
  handedByUser?: {
    id: string;
    name: string;
    email: string;
  };
  handedAt: string;
  isOverride: boolean;
  overrideApprovedBy?: string;
  overrideReason?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  chequeId?: string;
  action: string;
  userId?: string;
  performedBy?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface HandoverOverride {
  id: string;
  chequeId: string;
  requestedBy: string;
  requestedByUser?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: string;
  approvedByUser?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  approvedAt?: string;
  rejectedReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateChequeData {
  chequeNo: string;
  amount: number;
  bank: string;
  branch: string;
  payerName: string;
  payeeName: string;
  dueDate: string;
  attachments?: string[];
}

export interface GenerateOtpData {
  channel: 'sms' | 'whatsapp' | 'email';
  toContact: string;
}

export interface VerifyOtpData {
  otp: string;
  recipientName: string;
  idType: string;
  idNumber: string;
  recipientPhotoPath: string;
  signaturePath: string;
}

class ChequeService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Create a new cheque
   */
  async createCheque(data: CreateChequeData): Promise<Cheque> {
    const response = await axios.post(
      `${API_BASE_URL}/documents/cheques`,
      data,
      { headers: this.getAuthHeaders() }
    );
    return response.data.data;
  }

  /**
   * List cheques with filters
   */
  async listCheques(params?: {
    status?: string;
    dueDateFrom?: string;
    dueDateTo?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    cheques: Cheque[];
    total: number;
    limit: number;
    offset: number;
  }> {
    const response = await axios.get(`${API_BASE_URL}/documents/cheques`, {
      headers: this.getAuthHeaders(),
      params,
    });
    return response.data.data;
  }

  /**
   * Get cheque by ID
   */
  async getChequeById(id: string): Promise<Cheque> {
    const response = await axios.get(
      `${API_BASE_URL}/documents/cheques/${id}`,
      { headers: this.getAuthHeaders() }
    );
    return response.data.data;
  }

  /**
   * Mark cheque as ready for dispatch
   */
  async markReady(id: string): Promise<Cheque> {
    const response = await axios.post(
      `${API_BASE_URL}/documents/cheques/${id}/mark-ready`,
      {},
      { headers: this.getAuthHeaders() }
    );
    return response.data.data;
  }

  /**
   * Forward cheque to reception
   */
  async forwardToReception(id: string, notes?: string): Promise<Cheque> {
    const response = await axios.post(
      `${API_BASE_URL}/documents/cheques/${id}/forward-to-reception`,
      { notes },
      { headers: this.getAuthHeaders() }
    );
    return response.data.data;
  }

  /**
   * Generate OTP for handover
   */
  async generateOtp(
    id: string,
    data: GenerateOtpData
  ): Promise<{
    message: string;
    otpId: string;
    expiresAt: string;
    otpCode?: string; // Only in development
  }> {
    const response = await axios.post(
      `${API_BASE_URL}/documents/cheques/${id}/generate-otp`,
      data,
      { headers: this.getAuthHeaders() }
    );
    return response.data;
  }

  /**
   * Verify OTP and complete handover
   */
  async verifyOtp(
    id: string,
    data: VerifyOtpData
  ): Promise<{
    message: string;
    cheque: Cheque;
    handoverRecord: HandoverRecord;
  }> {
    const response = await axios.post(
      `${API_BASE_URL}/documents/cheques/${id}/verify-otp`,
      data,
      { headers: this.getAuthHeaders() }
    );
    return response.data.data;
  }

  /**
   * Request handover override
   */
  async requestOverride(id: string, reason: string): Promise<HandoverOverride> {
    const response = await axios.post(
      `${API_BASE_URL}/documents/cheques/${id}/handover-override`,
      { reason },
      { headers: this.getAuthHeaders() }
    );
    return response.data.data;
  }

  /**
   * Cancel a cheque
   */
  async cancelCheque(id: string, reason: string): Promise<Cheque> {
    const response = await axios.post(
      `${API_BASE_URL}/documents/cheques/${id}/cancel`,
      { reason },
      { headers: this.getAuthHeaders() }
    );
    return response.data.data;
  }

  /**
   * Get audit trail for cheque
   */
  async getAuditTrail(id: string): Promise<AuditLog[]> {
    const response = await axios.get(
      `${API_BASE_URL}/documents/cheques/${id}/audit`,
      { headers: this.getAuthHeaders() }
    );
    return response.data.data;
  }

  /**
   * Get override history for a cheque
   */
  async getChequeOverrides(id: string): Promise<HandoverOverride[]> {
    const response = await axios.get(
      `${API_BASE_URL}/documents/cheques/${id}/overrides`,
      { headers: this.getAuthHeaders() }
    );
    return response.data.data;
  }

  /**
   * Get pending override requests (for HOD)
   */
  async getPendingOverrides(params?: {
    limit?: number;
    offset?: number;
  }): Promise<{
    overrides: HandoverOverride[];
    total: number;
    limit: number;
    offset: number;
  }> {
    const response = await axios.get(
      `${API_BASE_URL}/documents/handover-override/pending`,
      {
        headers: this.getAuthHeaders(),
        params,
      }
    );
    return response.data.data;
  }

  /**
   * Approve override request
   */
  async approveOverride(overrideId: string): Promise<HandoverOverride> {
    const response = await axios.post(
      `${API_BASE_URL}/documents/handover-override/${overrideId}/approve`,
      {},
      { headers: this.getAuthHeaders() }
    );
    return response.data.data;
  }

  /**
   * Reject override request
   */
  async rejectOverride(
    overrideId: string,
    rejectedReason: string
  ): Promise<HandoverOverride> {
    const response = await axios.post(
      `${API_BASE_URL}/documents/handover-override/${overrideId}/reject`,
      { rejectedReason },
      { headers: this.getAuthHeaders() }
    );
    return response.data.data;
  }

  /**
   * Upload file (for photos and signatures)
   */
  async uploadFile(file: File): Promise<{ path: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_BASE_URL}/upload`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }
}

export default new ChequeService();

