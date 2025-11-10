import { DataSource } from 'typeorm';
import { User } from './models/User';
import { Department } from './models/Department';
import { Task } from './models/Task';
import { TaskNode } from './models/TaskNode';
import { TaskApprover } from './models/TaskApprover';
import { Comment } from './models/Comment';
import { Attachment } from './models/Attachment';
import { ChecklistItem } from './models/ChecklistItem';
import { ApprovalTemplate } from './models/ApprovalTemplate';
import { ApprovalTemplateStage } from './models/ApprovalTemplateStage';

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: process.env.DB_DATABASE || './data/taskflow.db',
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',
  entities: [
    User,
    Department,
    Task,
    TaskNode,
    TaskApprover,
    Comment,
    Attachment,
    ChecklistItem,
    ApprovalTemplate,
    ApprovalTemplateStage
  ],
  migrations: ['src/migrations/*.ts'],
  subscribers: ['src/subscribers/*.ts'],
});

export const initializeDatabase = async (): Promise<void> => {
  try {
    await AppDataSource.initialize();
    console.log('Database connection established successfully');
  } catch (error) {
    console.error('Error establishing database connection:', error);
    throw error;
  }
};

export const closeDatabase = async (): Promise<void> => {
  try {
    await AppDataSource.destroy();
    console.log('Database connection closed successfully');
  } catch (error) {
    console.error('Error closing database connection:', error);
    throw error;
  }
};