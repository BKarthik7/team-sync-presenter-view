import { Router, Request } from 'express';
import { Types } from 'mongoose';
import { Evaluation, IEvaluation } from '../models/Evaluation';
import { Team } from '../models/Team';
import { isAuthenticated } from '../middleware/auth';
import { AuthenticatedRequest, EvaluationRequest } from '../types';
import { pusher } from '../index';

const router = Router();

// Type guard function to check if request is authenticated
function isAuthenticatedRequest(req: Request): req is AuthenticatedRequest {
  return 'user' in req;
}

// Helper function to check user role
function checkRole(req: AuthenticatedRequest, role: string): boolean {
  return req.user.role === role;
}

// Create evaluation
router.post('/', isAuthenticated, async (req: Request, res) => {
  if (!isAuthenticatedRequest(req)) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (!checkRole(req, 'teacher')) {
    return res.status(403).json({ message: 'Only teachers can create evaluations' });
  }

  try {
    const { teamId, criteria, score, feedback } = req.body;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const evaluation = new Evaluation({
      team: teamId,
      evaluator: req.user._id,
      scores: [{
        criteria,
        score,
        comments: feedback
      }],
      overallScore: score,
      feedback
    });

    await evaluation.save();
    const evaluationDoc = evaluation as IEvaluation & { _id: Types.ObjectId };
    team.evaluations.push(evaluationDoc._id);
    await team.save();

    if (pusher) {
      await pusher.trigger('evaluations', 'created', evaluation);
    }
    res.status(201).json(evaluation);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Get evaluations for a team
router.get('/team/:teamId', isAuthenticated, async (req: Request, res) => {
  if (!isAuthenticatedRequest(req)) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const { teamId } = req.params;
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const evaluations = await Evaluation.find({ team: teamId })
      .populate('evaluator', 'name email');
    res.json(evaluations);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get a specific evaluation
router.get('/:id', isAuthenticated, async (req: Request, res) => {
  if (!isAuthenticatedRequest(req)) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const { id } = req.params;
    const evaluation = await Evaluation.findById(id)
      .populate('evaluator', 'name email');
    
    if (!evaluation) {
      return res.status(404).json({ message: 'Evaluation not found' });
    }

    res.json(evaluation);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Update evaluation
router.put('/:id', isAuthenticated, async (req: Request, res) => {
  if (!isAuthenticatedRequest(req)) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (!checkRole(req, 'teacher')) {
    return res.status(403).json({ message: 'Only teachers can update evaluations' });
  }

  try {
    const { id } = req.params;
    const evaluation = await Evaluation.findById(id);
    if (!evaluation) {
      return res.status(404).json({ message: 'Evaluation not found' });
    }

    if (evaluation.evaluator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this evaluation' });
    }

    const updates = Object.keys(req.body);
    const allowedUpdates = ['scores', 'overallScore', 'feedback'] as const;
    const isValidOperation = updates.every(update => allowedUpdates.includes(update as typeof allowedUpdates[number]));

    if (!isValidOperation) {
      return res.status(400).json({ message: 'Invalid updates' });
    }

    updates.forEach(update => {
      const key = update as keyof Pick<IEvaluation, 'scores' | 'overallScore' | 'feedback'>;
      (evaluation as any)[key] = req.body[update];
    });

    await evaluation.save();
    if (pusher) {
      await pusher.trigger('evaluations', 'updated', evaluation);
    }
    res.json(evaluation);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Delete evaluation
router.delete('/:id', isAuthenticated, async (req: Request, res) => {
  if (!isAuthenticatedRequest(req)) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (!checkRole(req, 'teacher')) {
    return res.status(403).json({ message: 'Only teachers can delete evaluations' });
  }

  try {
    const { id } = req.params;
    const evaluation = await Evaluation.findById(id);
    if (!evaluation) {
      return res.status(404).json({ message: 'Evaluation not found' });
    }

    if (evaluation.evaluator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this evaluation' });
    }

    const team = await Team.findById(evaluation.team);
    if (team) {
      const evaluationDoc = evaluation as IEvaluation & { _id: Types.ObjectId };
      team.evaluations = team.evaluations.filter(e => e.toString() !== evaluationDoc._id.toString());
      await team.save();
    }

    await Evaluation.findByIdAndDelete(id);
    if (pusher) {
      await pusher.trigger('evaluations', 'deleted', { id: req.params.id });
    }
    res.json({ message: 'Evaluation deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router; 