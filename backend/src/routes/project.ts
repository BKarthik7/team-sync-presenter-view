import express, { Request, Response } from 'express';
import { Project } from '../models/Project';
import { Class } from '../models/Class';
import { isAuthenticated } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';

const router = express.Router();

// Get all projects (protected)
router.get('/', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const projects = await Project.find()
      .populate('class', 'name semester')
      .sort({ createdAt: -1 });
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get project by ID (public)
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const project = await Project.findById(req.params.id)
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

// Create project (protected)
router.post('/', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { title, description, teamSize, class: classId } = req.body;

    const project = new Project({
      title,
      description,
      teamSize,
      class: classId,
      status: 'active'
    });

    await project.save();
    await project.populate('class', 'name semester');
    
    res.status(201).json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update project (protected)
router.put('/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Get the class to check teacher permissions
    const class_ = await Class.findById(project.class);
    if (!class_) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Check if user is the teacher of the class
    if (class_.teacher.toString() !== authReq.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this project' });
    }

    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    ).populate('class', 'name semester');

    res.json(updatedProject);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete project (protected)
router.delete('/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Get the class to check teacher permissions
    const class_ = await Class.findById(project.class);
    if (!class_) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Check if user is the teacher of the class
    if (class_.teacher.toString() !== authReq.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this project' });
    }

    await project.deleteOne();
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;