import express, { Response, Request } from 'express';
import { Project } from '../models/Project';
import { isAuthenticated } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';

const router = express.Router();

// Get all projects (protected)
router.get('/', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const projects = await Project.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new project (protected)
router.post('/', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { title, description, teamSize, class: classId } = req.body;

    const project = new Project({
      title,
      description,
      teamSize,
      class: classId,
      createdBy: authReq.user._id
    });

    await project.save();
    await project.populate('createdBy', 'name email');
    await project.populate('class', 'name semester');
    
    res.status(201).json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get a single project (public)
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('class', 'name semester');
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update a project (protected)
router.put('/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { title, description, teamSize, status } = req.body;

    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Only allow the creator to update the project
    if (project.createdBy.toString() !== authReq.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    project.title = title || project.title;
    project.description = description || project.description;
    project.teamSize = teamSize || project.teamSize;
    project.status = status || project.status;

    await project.save();
    await project.populate('createdBy', 'name email');
    
    res.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a project (protected)
router.delete('/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Only allow the creator to delete the project
    if (project.createdBy.toString() !== authReq.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await project.deleteOne();
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update project status
router.patch('/:id/status', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Validate status
    if (!['active', 'completed', 'archived'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    project.status = status;
    await project.save();
    
    res.json(project);
  } catch (error) {
    console.error('Error updating project status:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router; 