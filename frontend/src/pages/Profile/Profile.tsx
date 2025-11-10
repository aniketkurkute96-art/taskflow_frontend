import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Avatar,
  Grid,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Chip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { format } from 'date-fns';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole, TaskStatus } from '../../types';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
  });

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['profile'],
    queryFn: apiService.getProfile,
  });

  const { data: userTasks } = useQuery({
    queryKey: ['user-tasks'],
    queryFn: apiService.getUserTasks,
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: { name: string; email: string }) => apiService.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      enqueueSnackbar('Profile updated successfully', { variant: 'success' });
      setIsEditing(false);
    },
    onError: () => {
      enqueueSnackbar('Failed to update profile', { variant: 'error' });
    },
  });

  const handleEdit = () => {
    if (profile) {
      setEditForm({
        name: profile.name,
        email: profile.email,
      });
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    updateProfileMutation.mutate(editForm);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({ name: '', email: '' });
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return 'error';
      case UserRole.MANAGER: return 'warning';
      case UserRole.EMPLOYEE: return 'info';
      default: return 'default';
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.COMPLETED: return 'success';
      case TaskStatus.IN_PROGRESS: return 'primary';
      case TaskStatus.PENDING: return 'warning';
      case TaskStatus.OVERDUE: return 'error';
      default: return 'default';
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <Alert severity="error">Failed to load profile</Alert>;
  if (!profile) return <Alert severity="warning">Profile not found</Alert>;

  const totalTasks = userTasks?.length || 0;
  const completedTasks = userTasks?.filter(task => task.status === TaskStatus.COMPLETED).length || 0;
  const pendingTasks = userTasks?.filter(task => task.status === TaskStatus.PENDING).length || 0;
  const inProgressTasks = userTasks?.filter(task => task.status === TaskStatus.IN_PROGRESS).length || 0;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Profile
      </Typography>

      <Grid container spacing={3}>
        {/* Profile Information */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6">Profile Information</Typography>
                {!isEditing ? (
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={handleEdit}
                  >
                    Edit Profile
                  </Button>
                ) : (
                  <Box display="flex" gap={1}>
                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={handleSave}
                      disabled={updateProfileMutation.isPending}
                    >
                      Save
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<CancelIcon />}
                      onClick={handleCancel}
                    >
                      Cancel
                    </Button>
                  </Box>
                )}
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Name"
                    value={isEditing ? editForm.name : profile.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    disabled={!isEditing}
                    InputProps={{
                      startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={isEditing ? editForm.email : profile.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    disabled={!isEditing}
                    InputProps={{
                      startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Role"
                    value={profile.role}
                    disabled
                    InputProps={{
                      startAdornment: <AssignmentIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Department"
                    value={profile.department?.name || 'N/A'}
                    disabled
                    InputProps={{
                      startAdornment: <BusinessIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Created At"
                    value={format(new Date(profile.createdAt), 'MMM dd, yyyy')}
                    disabled
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Updated At"
                    value={format(new Date(profile.updatedAt), 'MMM dd, yyyy')}
                    disabled
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Recent Tasks */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Tasks
              </Typography>
              {userTasks && userTasks.length > 0 ? (
                <List>
                  {userTasks.slice(0, 5).map((task) => (
                    <ListItem key={task.id} divider>
                      <ListItemText
                        primary={task.title}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Due: {task.dueDate ? format(new Date(task.dueDate), 'MMM dd, yyyy') : 'No due date'}
                            </Typography>
                            <Box mt={1}>
                              <Chip
                                label={task.status.replace('_', ' ')}
                                color={getStatusColor(task.status) as any}
                                size="small"
                                sx={{ mr: 1 }}
                              />
                              <Chip
                                label={task.priority}
                                color="default"
                                size="small"
                              />
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No tasks found
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Avatar and Quick Stats */}
          <Card>
            <CardContent>
              <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    mb: 2,
                    bgcolor: 'primary.main',
                  }}
                >
                  {profile.name.charAt(0).toUpperCase()}
                </Avatar>
                <Typography variant="h6" align="center">
                  {profile.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center">
                  {profile.email}
                </Typography>
                <Chip
                  label={profile.role}
                  color={getRoleColor(profile.role) as any}
                  sx={{ mt: 1 }}
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                Task Statistics
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="primary">
                        {totalTasks}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Tasks
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="success.main">
                        {completedTasks}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Completed
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="warning.main">
                        {pendingTasks}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Pending
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="info.main">
                        {inProgressTasks}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        In Progress
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Profile;