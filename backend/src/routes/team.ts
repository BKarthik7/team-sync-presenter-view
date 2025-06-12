import express, { Request, Response } from 'express';
import { Team } from '../models/Team';
import { Class } from '../models/Class';
import { isAuthenticated } from '../middleware/auth';
import { pusher } from '../index';
import { Types } from 'mongoose';
import { AuthenticatedRequest } from '../types';
import { Project } from '../models/Project';

const router = express.Router();

// Get teams by class ID (public)
router.get('/class/:classId', async (req: Request, res: Response) => {
  try {
    const teams = await Team.find({ class: req.params.classId })
      .populate('members', 'name email usn')
      .sort({ createdAt: -1 });
    res.json(teams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get teams by project ID (public)
router.get('/project/:projectId', async (req: Request, res: Response) => {
  try {
    const teams = await Team.find({ project: req.params.projectId })
      .populate('members', 'name email usn')
      .sort({ createdAt: -1 });
    res.json(teams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create team (public)
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description, class: classId, project: projectId, members } = req.body;

    if (!classId) {
      return res.status(400).json({ error: 'Class ID is required' });
    }

    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    if (!Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ error: 'At least one member is required' });
    }

    // Get the project to check team size
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(400).json({ error: 'Project not found' });
    }

    // Verify project belongs to the class
    if (project.class.toString() !== classId) {
      return res.status(400).json({ error: 'Project does not belong to the specified class' });
    }

    if (members.length > project.teamSize) {
      return res.status(400).json({ 
        error: `Team size exceeds maximum allowed size of ${project.teamSize} members` 
      });
    }

    const team = new Team({
      name,
      description,
      class: classId,
      project: projectId,
      members: members // Array of USNs
    });

    await team.save();
    
    res.status(201).json(team);
  } catch (error) {
    console.error('Error creating team:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get team by ID (protected)
router.get('/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('members', 'name email usn');
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    res.json(team);
  } catch (error) {
    console.error('Error fetching team:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update team (protected)
router.put('/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { name, description, members } = req.body;

    const team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    team.name = name || team.name;
    team.description = description || team.description;
    team.members = members || team.members;

    await team.save();
    await team.populate('members', 'name email usn');
    
    res.json(team);
  } catch (error) {
    console.error('Error updating team:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete team (protected)
router.delete('/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Get the class to check teacher permissions
    const class_ = await Class.findById(team.class);
    if (!class_) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Check if user is the teacher of the class
    if (class_.teacher.toString() !== authReq.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this team' });
    }

    await team.deleteOne();
    res.json({ message: 'Team deleted successfully' });
  } catch (error) {
    console.error('Error deleting team:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add member to team
router.post('/:id/members', isAuthenticated, async (req: any, res) => {
  try {
    const { memberId } = req.body;
    const team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const class_ = await Class.findOne({ _id: team.class, teacher: req.user._id });
    if (!class_) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (team.members.includes(memberId)) {
      return res.status(400).json({ error: 'Member already in team' });
    }

    team.members.push(memberId); // Push USN directly as string
    await team.save();
    if (pusher) {
      await pusher.trigger('teams', 'member-added', { teamId: team._id, memberId });
    }
    res.json(team);
  } catch (error) {
    res.status(400).json({ error: 'Invalid data' });
  }
});

export default router;