import { Request, Response } from 'express';
import { AppDataSource } from '../database';
import { User } from '../models/User';
import { Department } from '../models/Department';
import { UserRole } from '../types/enums';
import { generateToken } from '../utils/jwt';

const userRepository = AppDataSource.getRepository(User);
const departmentRepository = AppDataSource.getRepository(Department);

export const signup = async (req: Request, res: Response): Promise<void> => {
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

    // Generate JWT token
    const token = generateToken(user);

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        departmentId: user.departmentId
      },
      token
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // Find user by email
    const user = await userRepository.findOne({
      where: { email },
      relations: ['department']
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Check if user is active
    if (!user.active) {
      res.status(401).json({ error: 'Account is deactivated' });
      return;
    }

    // Verify password (plain text comparison for prototype)
    // TODO: Add bcrypt comparison for production
    if (user.password !== password) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Generate JWT token
    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        departmentId: user.departmentId,
        department: user.department
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user as User;
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        departmentId: user.departmentId,
        department: user.department,
        active: user.active,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};