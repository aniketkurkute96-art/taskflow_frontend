import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Grid,
  Divider,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  AttachFile as AttachFileIcon,
  Send as SendIcon,
  Download as DownloadIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { format } from 'date-fns';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Task, Comment, Attachment, TaskStatus, TaskPriority, TaskCategory } from '../../types';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

const TaskDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const [commentText, setCommentText] = useState('');
  const [editingTask, setEditingTask] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    status: TaskStatus.PENDING,
    priority: TaskPriority.MEDIUM,
    category: TaskCategory.GENERAL,
    dueDate: '',
  });
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const { data: task, isLoading, error } = useQuery({
    queryKey: ['task', id],
    queryFn: () => apiService.getTask(id!),
    enabled: !!id,
  });

  const { data: comments } = useQuery({
    queryKey: ['task-comments', id],
    queryFn: () => apiService.getTaskComments(id!),
    enabled: !!id,
  });

  const { data: attachments } = useQuery({
    queryKey: ['task-attachments', id],
    queryFn: () => apiService.getTaskAttachments(id!),
    enabled: !!id,
  });

  const updateTaskMutation = useMutation({
    mutationFn: (data: Partial<Task>) => apiService.updateTask(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', id] });
      enqueueSnackbar('Task updated successfully', { variant: 'success' });
      setEditingTask(false);
    },
    onError: () => {
      enqueueSnackbar('Failed to update task', { variant: 'error' });
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: (content: string) => apiService.addComment(id!, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-comments', id] });
      setCommentText('');
      enqueueSnackbar('Comment added successfully', { variant: 'success' });
    },
    onError: () => {
      enqueueSnackbar('Failed to add comment', { variant: 'error' });
    },
  });

  const uploadAttachmentMutation = useMutation({
    mutationFn: (file: File) => apiService.uploadAttachment(id!, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-attachments', id] });
      setUploadFile(null);
      enqueueSnackbar('File uploaded successfully', { variant: 'success' });
    },
    onError: () => {
      enqueueSnackbar('Failed to upload file', { variant: 'error' });
    },
  });

  const deleteAttachmentMutation = useMutation({
    mutationFn: (attachmentId: string) => apiService.deleteAttachment(attachmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-attachments', id] });
      enqueueSnackbar('File deleted successfully', { variant: 'success' });
    },
    onError: () => {
      enqueueSnackbar('Failed to delete file', { variant: 'error' });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: () => apiService.deleteTask(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      enqueueSnackbar('Task deleted successfully', { variant: 'success' });
      navigate('/tasks');
    },
    onError: () => {
      enqueueSnackbar('Failed to delete task', { variant: 'error' });
    },
  });

  useEffect(() => {
    if (task) {
      setEditForm({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        category: task.category,
        dueDate: task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '',
      });
    }
  }, [task]);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <Alert severity="error">Failed to load task</Alert>;
  if (!task) return <Alert severity="warning">Task not found</Alert>;

  const canEdit = user?.id === task.createdBy.id || user?.role === 'ADMIN';
  const canDelete = user?.id === task.createdBy.id || user?.role === 'ADMIN';

  const handleEditSubmit = () => {
    updateTaskMutation.mutate({
      ...editForm,
      dueDate: editForm.dueDate ? new Date(editForm.dueDate).toISOString() : null,
    });
  };

  const handleAddComment = () => {
    if (commentText.trim()) {
      addCommentMutation.mutate(commentText);
    }
  };

  const handleFileUpload = () => {
    if (uploadFile) {
      uploadAttachmentMutation.mutate(uploadFile);
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

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.HIGH: return 'error';
      case TaskPriority.MEDIUM: return 'warning';
      case TaskPriority.LOW: return 'info';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {/* Task Details */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h4" component="h1">
                  {task.title}
                </Typography>
                <Box>
                  {canEdit && (
                    <IconButton onClick={() => setEditingTask(true)} color="primary">
                      <EditIcon />
                    </IconButton>
                  )}
                  {canDelete && (
                    <IconButton onClick={() => deleteTaskMutation.mutate()} color="error">
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>
              </Box>

              <Box mb={2}>
                <Chip
                  label={task.status.replace('_', ' ')}
                  color={getStatusColor(task.status) as any}
                  sx={{ mr: 1 }}
                />
                <Chip
                  label={task.priority}
                  color={getPriorityColor(task.priority) as any}
                  sx={{ mr: 1 }}
                />
                <Chip label={task.category.replace('_', ' ')} variant="outlined" />
              </Box>

              <Typography variant="body1" paragraph>
                {task.description}
              </Typography>

              <Box display="flex" gap={2} mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Created: {format(new Date(task.createdAt), 'MMM dd, yyyy')}
                </Typography>
                {task.dueDate && (
                  <Typography variant="body2" color="text.secondary">
                    Due: {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                  </Typography>
                )}
              </Box>

              <Box display="flex" gap={2}>
                <Typography variant="body2">
                  <strong>Created by:</strong> {task.createdBy.name}
                </Typography>
                <Typography variant="body2">
                  <strong>Assigned to:</strong> {task.assignedTo.name}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Checklist Items */}
          {task.checklistItems && task.checklistItems.length > 0 && (
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Checklist
                </Typography>
                <List>
                  {task.checklistItems.map((item) => (
                    <ListItem key={item.id} disablePadding>
                      <ListItemAvatar>
                        <IconButton size="small">
                          {item.completed ? (
                            <CheckCircleIcon color="success" />
                          ) : (
                            <RadioButtonUncheckedIcon />
                          )}
                        </IconButton>
                      </ListItemAvatar>
                      <ListItemText
                        primary={item.title}
                        secondary={item.description}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          )}

          {/* Comments */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Comments
              </Typography>
              
              <Box mb={2}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  disabled={addCommentMutation.isPending}
                />
                <Box display="flex" justifyContent="flex-end" mt={1}>
                  <Button
                    variant="contained"
                    startIcon={<SendIcon />}
                    onClick={handleAddComment}
                    disabled={!commentText.trim() || addCommentMutation.isPending}
                  >
                    Add Comment
                  </Button>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <List>
                {comments?.map((comment: Comment) => (
                  <ListItem key={comment.id} alignItems="flex-start">
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {comment.user.name.charAt(0).toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="subtitle2">{comment.user.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {format(new Date(comment.createdAt), 'MMM dd, yyyy HH:mm')}
                          </Typography>
                        </Box>
                      }
                      secondary={comment.content}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Attachments */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Attachments
              </Typography>
              
              <Box mb={2}>
                <input
                  accept="*/*"
                  style={{ display: 'none' }}
                  id="file-upload"
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                />
                <label htmlFor="file-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<AttachFileIcon />}
                    fullWidth
                  >
                    Choose File
                  </Button>
                </label>
                {uploadFile && (
                  <Box mt={1}>
                    <Typography variant="body2" noWrap>
                      {uploadFile.name}
                    </Typography>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={handleFileUpload}
                      disabled={uploadAttachmentMutation.isPending}
                      fullWidth
                      sx={{ mt: 1 }}
                    >
                      Upload
                    </Button>
                  </Box>
                )}
              </Box>

              <List>
                {attachments?.map((attachment: Attachment) => (
                  <ListItem
                    key={attachment.id}
                    secondaryAction={
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={() => deleteAttachmentMutation.mutate(attachment.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    }
                  >
                    <ListItemAvatar>
                      <IconButton size="small" href={attachment.fileUrl} download>
                        <DownloadIcon />
                      </IconButton>
                    </ListItemAvatar>
                    <ListItemText
                      primary={attachment.fileName}
                      secondary={`${(attachment.fileSize / 1024).toFixed(1)} KB`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Edit Task Dialog */}
      <Dialog open={editingTask} onClose={() => setEditingTask(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Task</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Title"
            value={editForm.title}
            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Description"
            multiline
            rows={4}
            value={editForm.description}
            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Status</InputLabel>
            <Select
              value={editForm.status}
              onChange={(e) => setEditForm({ ...editForm, status: e.target.value as TaskStatus })}
            >
              {Object.values(TaskStatus).map((status) => (
                <MenuItem key={status} value={status}>
                  {status.replace('_', ' ')}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Priority</InputLabel>
            <Select
              value={editForm.priority}
              onChange={(e) => setEditForm({ ...editForm, priority: e.target.value as TaskPriority })}
            >
              {Object.values(TaskPriority).map((priority) => (
                <MenuItem key={priority} value={priority}>
                  {priority}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Category</InputLabel>
            <Select
              value={editForm.category}
              onChange={(e) => setEditForm({ ...editForm, category: e.target.value as TaskCategory })}
            >
              {Object.values(TaskCategory).map((category) => (
                <MenuItem key={category} value={category}>
                  {category.replace('_', ' ')}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Due Date"
            type="date"
            value={editForm.dueDate}
            onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingTask(false)}>Cancel</Button>
          <Button
            onClick={handleEditSubmit}
            variant="contained"
            disabled={updateTaskMutation.isPending}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TaskDetail;