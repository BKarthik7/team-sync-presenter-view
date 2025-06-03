import { Router, Request, Response, NextFunction } from 'express';
import { Project } from '../models/project';
import { Class } from '../models/class';
import { auth, checkRole } from '../middleware/auth';

interface AuthenticatedRequest extends Request {
  user: {
    _id: string;
    email: string;
    role: string;
  };
}

const router = Router();

// Get all projects
router.get('/', 
  auth,
  checkRole(['lab_instructor', 'teacher']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const projects = await Project.find().populate('class');
      res.json(projects);
    } catch (error) {
      next(error);
    }
  }
);

// Create new project
router.post('/', 
  auth,
  checkRole(['lab_instructor', 'teacher']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { name, class: className } = req.body;
      
      // Find the class
      const classDoc = await Class.findOne({ name: className });
      if (!classDoc) {
        return res.status(404).json({ message: 'Class not found' });
      }

      // Create project
      const project = new Project({
        name,
        class: classDoc._id,
        status: 'active'
      });

      await project.save();
      res.status(201).json(project);
    } catch (error) {
      next(error);
    }
  }
);

// Get project by ID
router.get('/:id', 
  auth,
  checkRole(['lab_instructor', 'teacher']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const project = await Project.findById(req.params.id).populate('class');
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      res.json(project);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
