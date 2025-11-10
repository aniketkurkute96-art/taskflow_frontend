import { AppDataSource } from '../database';
import { ApprovalTemplate } from '../models/ApprovalTemplate';
import { ApprovalTemplateStage } from '../models/ApprovalTemplateStage';
import { AuthRequest } from '../middleware/auth';
import { Response } from 'express';
import { ApproverType, DynamicRole } from '../types/approvalTemplate';

const approvalTemplateRepository = AppDataSource.getRepository(ApprovalTemplate);
const approvalTemplateStageRepository = AppDataSource.getRepository(ApprovalTemplateStage);

// Get all approval templates
export const getAllTemplates = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const templates = await approvalTemplateRepository.find({
      relations: ['stages'],
      order: { name: 'ASC' }
    });

    res.json({ templates });
  } catch (error) {
    console.error('Get all templates error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get approval template by ID
export const getTemplateById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const template = await approvalTemplateRepository.findOne({
      where: { id },
      relations: ['stages']
    });

    if (!template) {
      res.status(404).json({ error: 'Approval template not found' });
      return;
    }

    res.json({ template });
  } catch (error) {
    console.error('Get template by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create new approval template
export const createTemplate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, minAmount, maxAmount, departmentIds, roles, stages, active } = req.body;

    // Validate required fields
    if (!name) {
      res.status(400).json({ error: 'Name is required' });
      return;
    }

    if (!stages || !Array.isArray(stages) || stages.length === 0) {
      res.status(400).json({ error: 'At least one approval stage is required' });
      return;
    }

    // Validate stages
    for (const stage of stages) {
      if (!stage.level || !stage.approverType) {
        res.status(400).json({ error: 'Each stage must have level and approverType' });
        return;
      }

      if (!Object.values(ApproverType).includes(stage.approverType)) {
        res.status(400).json({ error: `Invalid approver type: ${stage.approverType}` });
        return;
      }

      if (stage.approverType === ApproverType.DYNAMIC_ROLE && !Object.values(DynamicRole).includes(stage.approverValue)) {
        res.status(400).json({ error: `Invalid dynamic role: ${stage.approverValue}` });
        return;
      }
    }

    // Create template
    const template = approvalTemplateRepository.create({
      name,
      description: description || '',
      minAmount: minAmount || null,
      maxAmount: maxAmount || null,
      departmentIds: departmentIds || [],
      roles: roles || [],
      active: active !== undefined ? active : true
    });

    const savedTemplate = await approvalTemplateRepository.save(template);

    // Create stages
    const templateStages: ApprovalTemplateStage[] = [];
    
    for (const stage of stages) {
      const templateStage = approvalTemplateStageRepository.create({
        templateId: savedTemplate.id,
        level: stage.level,
        approverType: stage.approverType,
        approverValue: stage.approverValue || '',
        conditionalLogic: stage.conditionalLogic || null
      });
      templateStages.push(templateStage);
    }

    await approvalTemplateStageRepository.save(templateStages);

    // Reload template with stages
    const templateWithStages = await approvalTemplateRepository.findOne({
      where: { id: savedTemplate.id },
      relations: ['stages']
    });

    res.status(201).json({
      message: 'Approval template created successfully',
      template: templateWithStages
    });
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update approval template
export const updateTemplate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, minAmount, maxAmount, departmentIds, roles, stages, active } = req.body;

    const template = await approvalTemplateRepository.findOne({
      where: { id },
      relations: ['stages']
    });

    if (!template) {
      res.status(404).json({ error: 'Approval template not found' });
      return;
    }

    // Validate stages if provided
    if (stages && Array.isArray(stages)) {
      if (stages.length === 0) {
        res.status(400).json({ error: 'At least one approval stage is required' });
        return;
      }

      for (const stage of stages) {
        if (!stage.level || !stage.approverType) {
          res.status(400).json({ error: 'Each stage must have level and approverType' });
          return;
        }

        if (!Object.values(ApproverType).includes(stage.approverType)) {
          res.status(400).json({ error: `Invalid approver type: ${stage.approverType}` });
          return;
        }

        if (stage.approverType === ApproverType.DYNAMIC_ROLE && !Object.values(DynamicRole).includes(stage.approverValue)) {
          res.status(400).json({ error: `Invalid dynamic role: ${stage.approverValue}` });
          return;
        }
      }
    }

    // Update template fields
    if (name !== undefined) template.name = name;
    if (description !== undefined) template.description = description;
    if (minAmount !== undefined) template.minAmount = minAmount;
    if (maxAmount !== undefined) template.maxAmount = maxAmount;
    if (departmentIds !== undefined) template.departmentIds = departmentIds;
    if (roles !== undefined) template.roles = roles;
    if (active !== undefined) template.active = active;

    await approvalTemplateRepository.save(template);

    // Update stages if provided
    if (stages && Array.isArray(stages)) {
      // Delete existing stages
      await approvalTemplateStageRepository.remove(template.stages);

      // Create new stages
      const templateStages: ApprovalTemplateStage[] = [];
      
      for (const stage of stages) {
        const templateStage = approvalTemplateStageRepository.create({
          templateId: template.id,
          level: stage.level,
          approverType: stage.approverType,
          approverValue: stage.approverValue || '',
          conditionalLogic: stage.conditionalLogic || null
        });
        templateStages.push(templateStage);
      }

      await approvalTemplateStageRepository.save(templateStages);
    }

    // Reload template with updated stages
    const updatedTemplate = await approvalTemplateRepository.findOne({
      where: { id: template.id },
      relations: ['stages']
    });

    res.json({
      message: 'Approval template updated successfully',
      template: updatedTemplate
    });
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete approval template
export const deleteTemplate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const template = await approvalTemplateRepository.findOne({
      where: { id },
      relations: ['stages']
    });

    if (!template) {
      res.status(404).json({ error: 'Approval template not found' });
      return;
    }

    // Delete stages first
    await approvalTemplateStageRepository.remove(template.stages);

    // Delete template
    await approvalTemplateRepository.remove(template);

    res.json({ message: 'Approval template deleted successfully' });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};