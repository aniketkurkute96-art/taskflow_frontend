import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Avatar,
} from '@mui/material';
import {
  Assignment as TaskIcon,
  CheckCircle as CompletedIcon,
  HourglassEmpty as PendingIcon,
  Cancel as RejectedIcon,
  TrendingUp as TrendingIcon,
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import { Task, DashboardStats } from '../../types';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const { data: stats, isLoading: statsLoading } = useQuery(
    'dashboard-stats',
    () => apiService.getDashboardStats().then(res => res.data)
  );

  const { data: recentTasks, isLoading: tasksLoading } = useQuery(
    'recent-tasks',
    () => apiService.getRecentTasks().then(res => res.data)
  );

  const { data: pendingApprovals, isLoading: approvalsLoading } = useQuery(
    'pending-approvals',
    () => apiService.getPendingApprovals().then(res => res.data)
  );

  if (statsLoading || tasksLoading || approvalsLoading) {
    return <LoadingSpinner />;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'success';
      case 'PENDING_APPROVAL': return 'warning';
      case 'APPROVED': return 'info';
      case 'REJECTED': return 'error';
      case 'IN_PROGRESS': return 'primary';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'error';
      case 'HIGH': return 'warning';
      case 'MEDIUM': return 'info';
      case 'LOW': return 'success';
      default: return 'default';
    }
  };

  const StatCard: React.FC<{
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
    trend?: number;
  }> = ({ title, value, icon, color, trend }) => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="h6">
              {title}
            </Typography>
            <Typography variant="h3" component="div">
              {value}
            </Typography>
            {trend !== undefined && (
              <Box display="flex" alignItems="center" mt={1}>
                <TrendingIcon fontSize="small" color={trend > 0 ? 'success' : 'error'} />
                <Typography
                  variant="body2"
                  color={trend > 0 ? 'success.main' : 'error.main'}
                  ml={0.5}
                >
                  {trend > 0 ? '+' : ''}{trend}%
                </Typography>
              </Box>
            )}
          </Box>
          <Box
            sx={{
              backgroundColor: `${color}.main`,
              color: 'white',
              borderRadius: '50%',
              p: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Tasks"
            value={stats?.totalTasks || 0}
            icon={<TaskIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Tasks"
            value={stats?.pendingTasks || 0}
            icon={<PendingIcon />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Completed Tasks"
            value={stats?.completedTasks || 0}
            icon={<CompletedIcon />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Approvals"
            value={stats?.pendingApprovals || 0}
            icon={<ApprovalIcon />}
            color="info"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Tasks */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Tasks
              </Typography>
              <List>
                {recentTasks?.slice(0, 5).map((task: Task) => (
                  <ListItem key={task.id} disablePadding>
                    <ListItemButton onClick={() => navigate(`/tasks/${task.id}`)}>
                      <ListItemText
                        primary={task.title}
                        secondary={
                          <Box display="flex" gap={1} mt={1}>
                            <Chip
                              label={task.status}
                              size="small"
                              color={getStatusColor(task.status) as any}
                            />
                            <Chip
                              label={task.priority}
                              size="small"
                              color={getPriorityColor(task.priority) as any}
                            />
                          </Box>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
                {recentTasks?.length === 0 && (
                  <ListItem>
                    <ListItemText primary="No recent tasks" />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Pending Approvals */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Pending Approvals
              </Typography>
              <List>
                {pendingApprovals?.slice(0, 5).map((task: Task) => (
                  <ListItem key={task.id} disablePadding>
                    <ListItemButton onClick={() => navigate(`/tasks/${task.id}`)}>
                      <ListItemText
                        primary={task.title}
                        secondary={
                          <Box display="flex" gap={1} mt={1}>
                            <Chip
                              label={task.status}
                              size="small"
                              color={getStatusColor(task.status) as any}
                            />
                            <Chip
                              label={task.priority}
                              size="small"
                              color={getPriorityColor(task.priority) as any}
                            />
                          </Box>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
                {pendingApprovals?.length === 0 && (
                  <ListItem>
                    <ListItemText primary="No pending approvals" />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;