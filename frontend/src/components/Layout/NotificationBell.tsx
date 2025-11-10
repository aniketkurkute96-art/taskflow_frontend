import React, { useState, useEffect } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  Divider,
  Box,
  Button,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { Notification } from '../../types';

const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const fetchNotifications = async () => {
    try {
      const data = await apiService.getNotifications();
      setNotifications(data);
      setUnreadCount(data.filter((n: Notification) => !n.read).length);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  useEffect(() => {
    if (socket && isConnected) {
      socket.on('notification', (notification: Notification) => {
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);
      });

      socket.on('notification_read', ({ notificationId }: { notificationId: string }) => {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      });

      return () => {
        socket.off('notification');
        socket.off('notification_read');
      };
    }
  }, [socket, isConnected]);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await apiService.markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiService.markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'TASK_ASSIGNED':
      case 'TASK_CREATED':
        return <AssignmentIcon color="primary" />;
      case 'TASK_COMPLETED':
      case 'APPROVAL_APPROVED':
        return <CheckCircleIcon color="success" />;
      case 'APPROVAL_REJECTED':
      case 'TASK_REJECTED':
        return <CancelIcon color="error" />;
      case 'APPROVAL_REQUESTED':
        return <PersonIcon color="warning" />;
      default:
        return <NotificationsIcon color="action" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'TASK_ASSIGNED':
      case 'TASK_CREATED':
        return 'primary';
      case 'TASK_COMPLETED':
      case 'APPROVAL_APPROVED':
        return 'success';
      case 'APPROVAL_REJECTED':
      case 'TASK_REJECTED':
        return 'error';
      case 'APPROVAL_REQUESTED':
        return 'warning';
      default:
        return 'default';
    }
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleClick}
        aria-controls={open ? 'notification-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        id="notification-menu"
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            width: 400,
            maxHeight: 500,
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Notifications</Typography>
            {unreadCount > 0 && (
              <Button
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleMarkAllAsRead();
                }}
              >
                Mark all as read
              </Button>
            )}
          </Box>
        </Box>

        {notifications.length === 0 ? (
          <MenuItem>
            <ListItemText
              primary="No notifications"
              secondary="You're all caught up!"
            />
          </MenuItem>
        ) : (
          notifications.map((notification, index) => (
            <div key={notification.id}>
              <MenuItem
                onClick={() => handleMarkAsRead(notification.id)}
                sx={{
                  backgroundColor: notification.read ? 'transparent' : 'action.hover',
                  '&:hover': {
                    backgroundColor: 'action.selected',
                  },
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: `${getNotificationColor(notification.type)}.main` }}>
                    {getNotificationIcon(notification.type)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: notification.read ? 'normal' : 'bold',
                      }}
                    >
                      {notification.title}
                    </Typography>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {notification.message}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </Typography>
                    </Box>
                  }
                />
              </MenuItem>
              {index < notifications.length - 1 && <Divider />}
            </div>
          ))
        )}
      </Menu>
    </>
  );
};

export default NotificationBell;