import { AppDataSource } from '../database';
import { Department } from '../models/Department';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { Response } from 'express';

const departmentRepository = AppDataSource.getRepository(Department);
const userRepository = AppDataSource.getRepository(User);

// Get all departments
export const getAllDepartments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const departments = await departmentRepository.find({
      relations: ['parent', 'children', 'users']
    });

    res.json({ departments });
  } catch (error) {
    console.error('Get all departments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get department by ID
export const getDepartmentById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const department = await departmentRepository.findOne({
      where: { id },
      relations: ['parent', 'children', 'users']
    });

    if (!department) {
      res.status(404).json({ error: 'Department not found' });
      return;
    }

    res.json({ department });
  } catch (error) {
    console.error('Get department by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create new department
export const createDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, parentId } = req.body;

    // Validate required fields
    if (!name) {
      res.status(400).json({ error: 'Name is required' });
      return;
    }

    // Validate parent department if provided
    let parentDepartment = null;
    if (parentId) {
      parentDepartment = await departmentRepository.findOne({ where: { id: parentId } });
      if (!parentDepartment) {
        res.status(400).json({ error: 'Invalid parent department ID' });
        return;
      }
    }

    // Create new department
    const department = departmentRepository.create({
      name,
      description: description || '',
      parentId: parentId || null
    });

    await departmentRepository.save(department);

    res.status(201).json({
      message: 'Department created successfully',
      department
    });
  } catch (error) {
    console.error('Create department error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update department
export const updateDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, parentId } = req.body;

    const department = await departmentRepository.findOne({ where: { id } });
    if (!department) {
      res.status(404).json({ error: 'Department not found' });
      return;
    }

    // Validate parent department if provided
    if (parentId !== undefined) {
      if (parentId === null) {
        department.parentId = null;
      } else {
        const parentDepartment = await departmentRepository.findOne({ where: { id: parentId } });
        if (!parentDepartment) {
          res.status(400).json({ error: 'Invalid parent department ID' });
          return;
        }
        // Check for circular reference
        if (parentId === id) {
          res.status(400).json({ error: 'Department cannot be its own parent' });
          return;
        }
        department.parentId = parentId;
      }
    }

    // Update fields if provided
    if (name !== undefined) department.name = name;
    if (description !== undefined) department.description = description;

    await departmentRepository.save(department);

    res.json({
      message: 'Department updated successfully',
      department
    });
  } catch (error) {
    console.error('Update department error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete department
export const deleteDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const department = await departmentRepository.findOne({ where: { id } });
    if (!department) {
      res.status(404).json({ error: 'Department not found' });
      return;
    }

    // Check if department has users
    const userCount = await userRepository.count({ where: { departmentId: id } });
    if (userCount > 0) {
      res.status(400).json({ error: 'Cannot delete department with assigned users' });
      return;
    }

    // Check if department has child departments
    const childCount = await departmentRepository.count({ where: { parentId: id } });
    if (childCount > 0) {
      res.status(400).json({ error: 'Cannot delete department with child departments' });
      return;
    }

    await departmentRepository.remove(department);

    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Delete department error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};