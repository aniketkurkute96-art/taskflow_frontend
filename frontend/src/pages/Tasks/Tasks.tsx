import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  IconButton,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { Task, TaskStatus, TaskPriority, TaskCategory } from '../../types';
import { apiService } from '../../services/api';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

const Tasks: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | ''>('');
  const [categoryFilter, setCategoryFilter] = useState<TaskCategory | ''>('');

  const { data: tasks, isLoading } = useQuery(
    ['tasks', statusFilter, priorityFilter, categoryFilter],
    () => apiService.getTasks().then(res => res.data)
  );

  const filteredTasks = tasks?.filter((task: Task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || task.status === statusFilter;
    const matchesPriority = !priorityFilter || task.priority === priorityFilter;
    const matchesCategory = !categoryFilter || task.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  }) || [];

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.COMPLETED: return 'success';
      case TaskStatus.PENDING_APPROVAL: return 'warning';
      case TaskStatus.APPROVED: return 'info';
      case TaskStatus.REJECTED: return 'error';
      case TaskStatus.IN_PROGRESS: return 'primary';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.URGENT: return 'error';
      case TaskPriority.HIGH: return 'warning';
      case TaskPriority.MEDIUM: return 'info';
      case TaskPriority.LOW: return 'success';
      default: return 'default';
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await apiService.deleteTask(taskId);
        // Refresh the tasks list
        window.location.reload();
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Tasks</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/tasks/create')}
        >
          Create Task
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as TaskStatus | '')}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  {Object.values(TaskStatus).map((status) => (
                    <MenuItem key={status} value={status}>
                      {status.replace('_', ' ')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | '')}
                >
                  <MenuItem value="">All Priorities</MenuItem>
                  {Object.values(TaskPriority).map((priority) => (
                    <MenuItem key={priority} value={priority}>
                      {priority}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as TaskCategory | '')}
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {Object.values(TaskCategory).map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tasks Grid */}
      <Grid container spacing={3}>
        {filteredTasks.map((task: Task) => (
          <Grid item xs={12} md={6} lg={4} key={task.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Typography variant="h6" component="h2" sx={{ flexGrow: 1 }}>
                    {task.title}
                  </Typography>
                  <Box display="flex" gap={1}>
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/tasks/${task.id}`)}
                    >
                      <ViewIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/tasks/${task.id}/edit`)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteTask(task.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {task.description || 'No description provided'}
                </Typography>

                <Box display="flex" gap={1} mb={2}>
                  <Chip
                    label={task.status.replace('_', ' ')}
                    size="small"
                    color={getStatusColor(task.status) as any}
                  />
                  <Chip
                    label={task.priority}
                    size="small"
                    color={getPriorityColor(task.priority) as any}
                  />
                  <Chip
                    label={task.category}
                    size="small"
                    variant="outlined"
                  />
                </Box>

                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption" color="text.secondary">
                    Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Assigned to: {task.assignedTo?.firstName || 'Unassigned'}
                  </Typography>
                </Box>

                {task.checklist.length > 0 && (
                  <Box mt={2}>
                    <Typography variant="caption" color="text.secondary">
                      Progress: {task.checklist.filter(item => item.isCompleted).length} / {task.checklist.length}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={(task.checklist.filter(item => item.isCompleted).length / task.checklist.length) * 100}
                      sx={{ mt: 1 }}
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredTasks.length === 0 && (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="text.secondary">
            No tasks found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your filters or create a new task
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default Tasks;