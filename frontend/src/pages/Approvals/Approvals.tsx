import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  TextField,
  Grid,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Alert,
} from '@mui/material';
import {
  Check as ApproveIcon,
  Close as RejectIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { format } from 'date-fns';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Approval, ApprovalStatus, Task } from '../../types';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index}>
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

const Approvals: React.FC = () => {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const [tabValue, setTabValue] = useState(0);
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
  const [approvalComment, setApprovalComment] = useState('');
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject' | null>(null);

  const { data: myApprovals, isLoading: loadingMyApprovals } = useQuery({
    queryKey: ['my-approvals'],
    queryFn: apiService.getMyApprovals,
  });

  const { data: pendingApprovals, isLoading: loadingPendingApprovals } = useQuery({
    queryKey: ['pending-approvals'],
    queryFn: apiService.getPendingApprovals,
    enabled: user?.role === 'ADMIN' || user?.role === 'MANAGER',
  });

  const { data: approvalHistory, isLoading: loadingHistory } = useQuery({
    queryKey: ['approval-history'],
    queryFn: apiService.getApprovalHistory,
  });

  const approveTaskMutation = useMutation({
    mutationFn: ({ taskId, comment }: { taskId: string; comment: string }) =>
      apiService.approveTask(taskId, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['approval-history'] });
      enqueueSnackbar('Task approved successfully', { variant: 'success' });
      handleCloseDialog();
    },
    onError: () => {
      enqueueSnackbar('Failed to approve task', { variant: 'error' });
    },
  });

  const rejectTaskMutation = useMutation({
    mutationFn: ({ taskId, comment }: { taskId: string; comment: string }) =>
      apiService.rejectTask(taskId, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['approval-history'] });
      enqueueSnackbar('Task rejected successfully', { variant: 'success' });
      handleCloseDialog();
    },
    onError: () => {
      enqueueSnackbar('Failed to reject task', { variant: 'error' });
    },
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleOpenDialog = (approval: Approval, action: 'approve' | 'reject') => {
    setSelectedApproval(approval);
    setApprovalAction(action);
    setApprovalComment('');
  };

  const handleCloseDialog = () => {
    setSelectedApproval(null);
    setApprovalAction(null);
    setApprovalComment('');
  };

  const handleApprovalSubmit = () => {
    if (!selectedApproval) return;

    if (approvalAction === 'approve') {
      approveTaskMutation.mutate({
        taskId: selectedApproval.task.id,
        comment: approvalComment,
      });
    } else if (approvalAction === 'reject') {
      rejectTaskMutation.mutate({
        taskId: selectedApproval.task.id,
        comment: approvalComment,
      });
    }
  };

  const getStatusColor = (status: ApprovalStatus) => {
    switch (status) {
      case ApprovalStatus.APPROVED: return 'success';
      case ApprovalStatus.REJECTED: return 'error';
      case ApprovalStatus.PENDING: return 'warning';
      default: return 'default';
    }
  };

  const isLoading = loadingMyApprovals || loadingPendingApprovals || loadingHistory;

  if (isLoading) return <LoadingSpinner />;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Approval Management
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label={`My Approvals (${myApprovals?.length || 0})`} />
          {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
            <Tab label={`Pending Approvals (${pendingApprovals?.length || 0})`} />
          )}
          <Tab label="Approval History" />
        </Tabs>
      </Paper>

      <TabPanel value={tabValue} index={0}>
        <ApprovalList
          approvals={myApprovals || []}
          onApprove={(approval) => handleOpenDialog(approval, 'approve')}
          onReject={(approval) => handleOpenDialog(approval, 'reject')}
          getStatusColor={getStatusColor}
        />
      </TabPanel>

      {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
        <TabPanel value={tabValue} index={1}>
          <ApprovalList
            approvals={pendingApprovals || []}
            onApprove={(approval) => handleOpenDialog(approval, 'approve')}
            onReject={(approval) => handleOpenDialog(approval, 'reject')}
            getStatusColor={getStatusColor}
            showActions={false}
          />
        </TabPanel>
      )}

      <TabPanel value={tabValue} index={user?.role === 'ADMIN' || user?.role === 'MANAGER' ? 2 : 1}>
        <ApprovalHistory
          approvals={approvalHistory || []}
          getStatusColor={getStatusColor}
        />
      </TabPanel>

      {/* Approval Dialog */}
      <Dialog open={!!selectedApproval} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {approvalAction === 'approve' ? 'Approve Task' : 'Reject Task'}
        </DialogTitle>
        <DialogContent>
          <Alert severity={approvalAction === 'approve' ? 'info' : 'warning'} sx={{ mb: 2 }}>
            Task: {selectedApproval?.task.title}
          </Alert>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Comment (Optional)"
            value={approvalComment}
            onChange={(e) => setApprovalComment(e.target.value)}
            placeholder={`Please provide a reason for ${approvalAction}ing this task...`}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleApprovalSubmit}
            variant="contained"
            color={approvalAction === 'approve' ? 'success' : 'error'}
            disabled={
              approveTaskMutation.isPending || rejectTaskMutation.isPending
            }
          >
            {approvalAction === 'approve' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

interface ApprovalListProps {
  approvals: Approval[];
  onApprove: (approval: Approval) => void;
  onReject: (approval: Approval) => void;
  getStatusColor: (status: ApprovalStatus) => string;
  showActions?: boolean;
}

const ApprovalList: React.FC<ApprovalListProps> = ({
  approvals,
  onApprove,
  onReject,
  getStatusColor,
  showActions = true,
}) => {
  if (approvals.length === 0) {
    return (
      <Alert severity="info">
        No approvals found
      </Alert>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Task</TableCell>
            <TableCell>Requested By</TableCell>
            <TableCell>Stage</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Created</TableCell>
            {showActions && <TableCell>Actions</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {approvals.map((approval) => (
            <TableRow key={approval.id}>
              <TableCell>
                <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                  {approval.task.title}
                </Typography>
              </TableCell>
              <TableCell>{approval.requestedBy.name}</TableCell>
              <TableCell>
                {approval.currentStage?.name || 'N/A'}
              </TableCell>
              <TableCell>
                <Chip
                  label={approval.status}
                  color={getStatusColor(approval.status) as any}
                  size="small"
                />
              </TableCell>
              <TableCell>
                {format(new Date(approval.createdAt), 'MMM dd, yyyy')}
              </TableCell>
              {showActions && (
                <TableCell>
                  <Box display="flex" gap={1}>
                    <IconButton
                      size="small"
                      color="success"
                      onClick={() => onApprove(approval)}
                      disabled={approval.status !== 'PENDING'}
                    >
                      <ApproveIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => onReject(approval)}
                      disabled={approval.status !== 'PENDING'}
                    >
                      <RejectIcon />
                    </IconButton>
                  </Box>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

interface ApprovalHistoryProps {
  approvals: Approval[];
  getStatusColor: (status: ApprovalStatus) => string;
}

const ApprovalHistory: React.FC<ApprovalHistoryProps> = ({
  approvals,
  getStatusColor,
}) => {
  if (approvals.length === 0) {
    return (
      <Alert severity="info">
        No approval history found
      </Alert>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Task</TableCell>
            <TableCell>Requested By</TableCell>
            <TableCell>Approver</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Comment</TableCell>
            <TableCell>Processed</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {approvals.map((approval) => (
            <TableRow key={approval.id}>
              <TableCell>
                <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                  {approval.task.title}
                </Typography>
              </TableCell>
              <TableCell>{approval.requestedBy.name}</TableCell>
              <TableCell>{approval.approver?.name || 'N/A'}</TableCell>
              <TableCell>
                <Chip
                  label={approval.status}
                  color={getStatusColor(approval.status) as any}
                  size="small"
                />
              </TableCell>
              <TableCell>
                <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                  {approval.comment || 'No comment'}
                </Typography>
              </TableCell>
              <TableCell>
                {approval.updatedAt
                  ? format(new Date(approval.updatedAt), 'MMM dd, yyyy HH:mm')
                  : 'N/A'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default Approvals;