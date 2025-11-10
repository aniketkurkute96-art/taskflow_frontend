import { AppDataSource } from '../database';
import { User, UserRole } from '../models/User';
import { Department } from '../models/Department';
import { ApprovalTemplate } from '../models/ApprovalTemplate';
import { ApprovalTemplateStage } from '../models/ApprovalTemplateStage';
import { ApproverType, DynamicRole } from '../types/approvalTemplate';

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await AppDataSource.getRepository(ApprovalTemplateStage).delete({});
    await AppDataSource.getRepository(ApprovalTemplate).delete({});
    await AppDataSource.getRepository(User).delete({});
    await AppDataSource.getRepository(Department).delete({});

    // Create departments
    console.log('🏢 Creating departments...');
    const departmentRepository = AppDataSource.getRepository(Department);
    
    const hrDepartment = departmentRepository.create({
      name: 'Human Resources',
      description: 'Human Resources Department'
    });
    
    const financeDepartment = departmentRepository.create({
      name: 'Finance',
      description: 'Finance Department'
    });
    
    const itDepartment = departmentRepository.create({
      name: 'IT',
      description: 'Information Technology Department'
    });
    
    const operationsDepartment = departmentRepository.create({
      name: 'Operations',
      description: 'Operations Department'
    });

    await departmentRepository.save([hrDepartment, financeDepartment, itDepartment, operationsDepartment]);
    console.log('✅ Departments created');

    // Create users
    console.log('👥 Creating users...');
    const userRepository = AppDataSource.getRepository(User);
    
    const adminUser = userRepository.create({
      email: 'admin@taskflow.com',
      name: 'System Administrator',
      password: 'admin123', // Note: Plain text for prototype - add bcrypt hashing for production
      role: UserRole.ADMIN,
      active: true
    });
    
    const hrManager = userRepository.create({
      email: 'hr.manager@taskflow.com',
      name: 'HR Manager',
      password: 'hr123',
      role: UserRole.HOD,
      departmentId: hrDepartment.id,
      active: true
    });
    
    const financeManager = userRepository.create({
      email: 'finance.manager@taskflow.com',
      name: 'Finance Manager',
      password: 'finance123',
      role: UserRole.HOD,
      departmentId: financeDepartment.id,
      active: true
    });
    
    const cfo = userRepository.create({
      email: 'cfo@taskflow.com',
      name: 'Chief Financial Officer',
      password: 'cfo123',
      role: UserRole.CFO,
      departmentId: financeDepartment.id,
      active: true
    });
    
    const itManager = userRepository.create({
      email: 'it.manager@taskflow.com',
      name: 'IT Manager',
      password: 'it123',
      role: UserRole.HOD,
      departmentId: itDepartment.id,
      active: true
    });
    
    const operationsManager = userRepository.create({
      email: 'operations.manager@taskflow.com',
      name: 'Operations Manager',
      password: 'ops123',
      role: UserRole.HOD,
      departmentId: operationsDepartment.id,
      active: true
    });
    
    const hrEmployee = userRepository.create({
      email: 'hr.employee@taskflow.com',
      name: 'HR Employee',
      password: 'employee123',
      role: UserRole.USER,
      departmentId: hrDepartment.id,
      active: true
    });
    
    const financeEmployee = userRepository.create({
      email: 'finance.employee@taskflow.com',
      name: 'Finance Employee',
      password: 'employee123',
      role: UserRole.USER,
      departmentId: financeDepartment.id,
      active: true
    });
    
    const itEmployee = userRepository.create({
      email: 'it.employee@taskflow.com',
      name: 'IT Employee',
      password: 'employee123',
      role: UserRole.USER,
      departmentId: itDepartment.id,
      active: true
    });

    await userRepository.save([
      adminUser, hrManager, financeManager, cfo, itManager, operationsManager,
      hrEmployee, financeEmployee, itEmployee
    ]);
    console.log('✅ Users created');

    // Create approval templates
    console.log('📋 Creating approval templates...');
    const approvalTemplateRepository = AppDataSource.getRepository(ApprovalTemplate);
    const approvalTemplateStageRepository = AppDataSource.getRepository(ApprovalTemplateStage);
    
    // Simple approval template (1 level)
    const simpleApprovalTemplate = approvalTemplateRepository.create({
      name: 'Simple Approval',
      description: 'Single level approval for routine tasks',
      active: true
    });
    
    // Financial approval template (2 levels)
    const financialApprovalTemplate = approvalTemplateRepository.create({
      name: 'Financial Approval',
      description: 'Two-level approval for financial tasks',
      minAmount: 1000,
      maxAmount: 50000,
      departmentIds: [financeDepartment.id],
      active: true
    });
    
    // High-value approval template (3 levels)
    const highValueApprovalTemplate = approvalTemplateRepository.create({
      name: 'High-Value Approval',
      description: 'Three-level approval for high-value tasks',
      minAmount: 50000,
      active: true
    });

    await approvalTemplateRepository.save([
      simpleApprovalTemplate, 
      financialApprovalTemplate, 
      highValueApprovalTemplate
    ]);

    // Create approval template stages
    const simpleStage = approvalTemplateStageRepository.create({
      templateId: simpleApprovalTemplate.id,
      level: 1,
      approverType: ApproverType.DYNAMIC_ROLE,
      approverValue: DynamicRole.HOD
    });
    
    const financialStage1 = approvalTemplateStageRepository.create({
      templateId: financialApprovalTemplate.id,
      level: 1,
      approverType: ApproverType.DYNAMIC_ROLE,
      approverValue: DynamicRole.HOD
    });
    
    const financialStage2 = approvalTemplateStageRepository.create({
      templateId: financialApprovalTemplate.id,
      level: 2,
      approverType: ApproverType.DYNAMIC_ROLE,
      approverValue: DynamicRole.CFO
    });
    
    const highValueStage1 = approvalTemplateStageRepository.create({
      templateId: highValueApprovalTemplate.id,
      level: 1,
      approverType: ApproverType.DYNAMIC_ROLE,
      approverValue: DynamicRole.HOD
    });
    
    const highValueStage2 = approvalTemplateStageRepository.create({
      templateId: highValueApprovalTemplate.id,
      level: 2,
      approverType: ApproverType.DYNAMIC_ROLE,
      approverValue: DynamicRole.CFO
    });
    
    const highValueStage3 = approvalTemplateStageRepository.create({
      templateId: highValueApprovalTemplate.id,
      level: 3,
      approverType: ApproverType.USER,
      approverValue: adminUser.id // Admin as final approver for high-value tasks
    });

    await approvalTemplateStageRepository.save([
      simpleStage, financialStage1, financialStage2, 
      highValueStage1, highValueStage2, highValueStage3
    ]);
    console.log('✅ Approval templates created');

    console.log('🎉 Database seeding completed successfully!');
    console.log('');
    console.log('👤 Sample Users:');
    console.log('  - admin@taskflow.com (password: admin123) - System Administrator');
    console.log('  - hr.manager@taskflow.com (password: hr123) - HR Manager');
    console.log('  - finance.manager@taskflow.com (password: finance123) - Finance Manager');
    console.log('  - cfo@taskflow.com (password: cfo123) - CFO');
    console.log('  - it.manager@taskflow.com (password: it123) - IT Manager');
    console.log('  - operations.manager@taskflow.com (password: ops123) - Operations Manager');
    console.log('  - hr.employee@taskflow.com (password: employee123) - HR Employee');
    console.log('  - finance.employee@taskflow.com (password: employee123) - Finance Employee');
    console.log('  - it.employee@taskflow.com (password: employee123) - IT Employee');
    console.log('');
    console.log('🏢 Departments: HR, Finance, IT, Operations');
    console.log('📋 Approval Templates: Simple, Financial, High-Value');

  } catch (error) {
    console.error('❌ Database seeding failed:', error);
  } finally {
    await AppDataSource.destroy();
    console.log('🔌 Database connection closed');
  }
}

// Run seeder if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

export { seedDatabase };