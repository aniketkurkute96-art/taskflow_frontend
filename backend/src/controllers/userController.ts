import { AppDataSource } from '../database';
import { User, UserRole } from '../models/User';
import { Department } from '../models/Department';
import { AuthRequest } from '../middleware/auth';
import { Response } from 'express';

const userRepository = AppDataSource.getRepository(User);
const departmentRepository = AppDataSource.getRepository(Department);

// Get all users (Admin only)
export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await userRepository.find({
      relations: ['department'],
      select: ['id', 'email', 'name', 'role', 'departmentId', 'active', 'createdAt', 'updatedAt']
    });

    res.json({ users });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get user by ID
export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const user = await userRepository.findOne({
      where: { id },
      relations: ['department']
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create new user (Admin only)
export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, name, password, role, departmentId } = req.body;

    // Validate required fields
    if (!email || !name || !password) {
      res.status(400).json({ error: 'Email, name, and password are required' });
      return;
    }

    // Check if user already exists
    const existingUser = await userRepository.findOne({ where: { email } });
    if (existingUser) {
      res.status(400).json({ error: 'User with this email already exists' });
      return;
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

    // Create new user
    const user = userRepository.create({
      email,
      name,
      password, // Note: Plain text for prototype - add bcrypt hashing for production
      role: role || UserRole.USER,
      departmentId: departmentId || null,
      active: true
    });

    await userRepository.save(user);

    // Return created user without password
    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json({
      message: 'User created successfully',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update user (Admin only)
export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { email, name, password, role, departmentId, active } = req.body;

    const user = await userRepository.findOne({ where: { id } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Validate department if provided
    if (departmentId !== undefined) {
      if (departmentId === null) {
        user.departmentId = null;
      } else {
        const department = await departmentRepository.findOne({ where: { id: departmentId } });
        if (!department) {
          res.status(400).json({ error: 'Invalid department ID' });
          return;
        }
        user.departmentId = departmentId;
      }
    }

    // Update fields if provided
    if (email !== undefined) user.email = email;
    if (name !== undefined) user.name = name;
    if (password !== undefined) user.password = password; // Note: Plain text for prototype
    if (role !== undefined) user.role = role;
    if (active !== undefined) user.active = active;

    await userRepository.save(user);

    // Return updated user without password
    const { password: _, ...userWithoutPassword } = user;
    res.json({
      message: 'User updated successfully',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete user (Admin only)
export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await userRepository.findOne({ where: { id } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    await userRepository.remove(user);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get current user profile
export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    
    // Reload user with department relation
    const fullUser = await userRepository.findOne({
      where: { id: user.id },
      relations: ['department']
    });

    if (!fullUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      user: {
        id: fullUser.id,
        email: fullUser.email,
        name: fullUser.name,
        role: fullUser.role,
        departmentId: fullUser.departmentId,
        department: fullUser.department,
        active: fullUser.active,
        createdAt: fullUser.createdAt,
        updatedAt: fullUser.updatedAt
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};