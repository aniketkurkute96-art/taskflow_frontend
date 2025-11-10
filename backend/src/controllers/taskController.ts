import { AppDataSource } from '../database';
import { Task } from '../models/Task';
import { User } from '../models/User';
import { Department } from '../models/Department';
import { AuthRequest } from '../middleware/auth';
import { Response } from 'express';
import { TaskStatus } from '../types/enums';

const taskRepository = AppDataSource.getRepository(Task);
const userRepository = AppDataSource.getRepository(User);
const departmentRepository = AppDataSource.getRepository(Department);

// Get all tasks for the current user
export const getUserTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    
    // Get tasks where user is creator or assignee
    const tasks = await taskRepository.find({
      where: [
        { creatorId: user.id },
        { assigneeId: user.id }
      ],
      relations: ['creator', 'assignee', 'department', 'approvalTemplate'],
      order: { createdAt: 'DESC' }
    });

    res.json({ tasks });
  } catch (error) {
    console.error('Get user tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get task by ID
export const getTaskById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user!;
    
    const task = await taskRepository.findOne({
      where: { id },
      relations: ['creator', 'assignee', 'department', 'approvalTemplate', 'nodes', 'approvers', 'comments', 'checklistItems', 'attachments']
    });

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    // Check if user has access to this task
    if (task.creatorId !== user.id && task.assigneeId !== user.id && user.role !== 'admin') {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    res.json({ task });
  } catch (error) {
    console.error('Get task by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create new task
export const createTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { title, description, assigneeId, departmentId, amount, approvalType, dueDate, priority } = req.body;

    // Validate required fields
    if (!title) {
      res.status(400).json({ error: 'Title is required' });
      return;
    }

    // Validate assignee if provided
    let assignee = null;
    if (assigneeId) {
      assignee = await userRepository.findOne({ where: { id: assigneeId } });
      if (!assignee) {
        res.status(400).json({ error: 'Invalid assignee ID' });
        return;
      }
    }

    // Validate department if provided
    let department = null;
    if (departmentId) {
      department = await departmentRepository.findOne({ where: { id: departmentId } });
      if (!department) {
        res.status(400).json({ error: 'Invalid department ID' });
        return;
      }
    }

    // Create new task
    const task = taskRepository.create({
      title,
      description: description || '',
      creatorId: user.id,
      assigneeId: assigneeId || null,
      departmentId: departmentId || null,
      amount: amount || null,
      approvalType: approvalType || null,
      dueDate: dueDate || null,
      priority: priority || 'medium',
      status: TaskStatus.DRAFT
    });

    await taskRepository.save(task);

    // Reload with relations
    const createdTask = await taskRepository.findOne({
      where: { id: task.id },
      relations: ['creator', 'assignee', 'department']
    });

    res.status(201).json({
      message: 'Task created successfully',
      task: createdTask
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update task
export const updateTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user!;
    const { title, description, assigneeId, departmentId, amount, approvalType, dueDate, priority, status } = req.body;

    const task = await taskRepository.findOne({ where: { id } });
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    // Check if user can update this task
    if (task.creatorId !== user.id && user.role !== 'admin') {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Validate assignee if provided
    if (assigneeId !== undefined) {
      if (assigneeId === null) {
        task.assigneeId = null;
      } else {
        const assignee = await userRepository.findOne({ where: { id: assigneeId } });
        if (!assignee) {
          res.status(400).json({ error: 'Invalid assignee ID' });
          return;
        }
        task.assigneeId = assigneeId;
      }
    }

    // Validate department if provided
    if (departmentId !== undefined) {
      if (departmentId === null) {
        task.departmentId = null;
      } else {
        const department = await departmentRepository.findOne({ where: { id: departmentId } });
        if (!department) {
          res.status(400).json({ error: 'Invalid department ID' });
          return;
        }
        task.departmentId = departmentId;
      }
    }

    // Update fields if provided
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (amount !== undefined) task.amount = amount;
    if (approvalType !== undefined) task.approvalType = approvalType;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (priority !== undefined) task.priority = priority;
    if (status !== undefined) task.status = status;

    await taskRepository.save(task);

    // Reload with relations
    const updatedTask = await taskRepository.findOne({
      where: { id: task.id },
      relations: ['creator', 'assignee', 'department']
    });

    res.json({
      message: 'Task updated successfully',
      task: updatedTask
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete task
export const deleteTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const task = await taskRepository.findOne({ where: { id } });
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    // Check if user can delete this task
    if (task.creatorId !== user.id && user.role !== 'admin') {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    await taskRepository.remove(task);

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};