import express from 'express';
import { Team } from '../models/Team';
import { Class } from '../models/Class';
import { isAuthenticated } from '../middleware/auth';
import { pusher } from '../index';
import { Types } from 'mongoose';
import { Router, Request } from 'express';
import { AuthenticatedRequest } from '../types';

const router = express.Router();

// Create team
router.post('/', isAuthenticated, async (req: any, res) => {
  try {
    const class_ = await Class.findById(req.body.classId);
    if (!class_) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const team = await Team.create({
      ...req.body,
      class: class_._id
    });

    res.status(201).json(team);
  } catch (err) {
    const error = err as Error;
    res.status(400).json({ 
      error: 'Invalid data',
      details: error?.message || 'Unknown error occurred'
    });
  }
});

// Get all teams for a class
router.get('/class/:classId', isAuthenticated, async (req: any, res) => {
  try {
    const teams = await Team.find({ class: req.params.classId })
      .populate('members', 'name email')
      .populate('evaluations');
    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get team by ID
router.get('/:id', isAuthenticated, async (req: any, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('members', 'name email')
      .populate('evaluations');
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    res.json(team);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update team
router.patch('/:id', isAuthenticated, async (req: any, res) => {
  try {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'description'] as const;
    const isValidOperation = updates.every(update => allowedUpdates.includes(update as typeof allowedUpdates[number]));

    if (!isValidOperation) {
      return res.status(400).json({ error: 'Invalid updates' });
    }

    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const class_ = await Class.findOne({ _id: team.class, teacher: req.user._id });
    if (!class_) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    updates.forEach(update => {
      (team as any)[update] = req.body[update];
    });
    
    await team.save();
    if (pusher) {
      await pusher.trigger('teams', 'updated', team);
    }
    res.json(team);
  } catch (error) {
    res.status(400).json({ error: 'Invalid data' });
  }
});

// Delete team
router.delete('/:id', isAuthenticated, async (req: any, res) => {
  try {
    const { id: teamId } = req.params;
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    await team.deleteOne();
    res.json({ message: 'Team deleted successfully' });
  } catch (err) {
    const error = err as Error;
    res.status(500).json({ 
      error: 'Server error',
      details: error?.message || 'Unknown error occurred'
    });
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

    team.members.push(new Types.ObjectId(memberId as string));
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