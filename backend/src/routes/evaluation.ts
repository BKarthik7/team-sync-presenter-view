import express from 'express';
import type { Response, Request } from 'express';
import { Evaluation } from '../models/Evaluation';
import { EvaluationForm } from '../models/EvaluationForm';
import { isAuthenticated, AuthenticatedRequest } from '../middleware/auth';
import { Types } from 'mongoose';

const router = express.Router();

// Extend AuthenticatedRequest to include params and body
interface EvaluationRequest extends AuthenticatedRequest {
  params: {
    projectId?: string;
    evaluationId?: string;
  };
  body: {
    formId?: string;
    responses?: Record<string, any>;
  };
}

// Get evaluations for a project
router.get('/project/:projectId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const evaluations = await Evaluation.find({ project: (req as EvaluationRequest).params.projectId })
      .populate('form')
      .populate('submittedBy', 'name email');
    res.json(evaluations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch evaluations' });
  }
});

// Get a specific evaluation
router.get('/:evaluationId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const evaluation = await Evaluation.findById((req as EvaluationRequest).params.evaluationId)
      .populate('form')
      .populate('submittedBy', 'name email');
    
    if (!evaluation) {
      return res.status(404).json({ error: 'Evaluation not found' });
    }
    
    res.json(evaluation);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch evaluation' });
  }
});

// Submit an evaluation
router.post('/:projectId/submit', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { formId, responses } = (req as EvaluationRequest).body;
    const projectId = (req as EvaluationRequest).params.projectId;

    if (!formId || !responses) {
      return res.status(400).json({ error: 'Form ID and responses are required' });
    }

    // Verify the form exists and belongs to the project
    const form = await EvaluationForm.findOne({ _id: formId, project: projectId });
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    // Create new evaluation
    const evaluation = new Evaluation({
      form: formId,
      project: projectId,
      submittedBy: (req as EvaluationRequest).user._id,
      responses
    });

    await evaluation.save();
    res.status(201).json(evaluation);
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit evaluation' });
  }
});

// Delete an evaluation
router.delete('/:evaluationId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const evaluation = await Evaluation.findById((req as EvaluationRequest).params.evaluationId);
    
    if (!evaluation) {
      return res.status(404).json({ error: 'Evaluation not found' });
    }

    // Only allow deletion by the submitter
    if (evaluation.submittedBy.toString() !== (req as EvaluationRequest).user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this evaluation' });
    }

    await evaluation.deleteOne();
    res.json({ message: 'Evaluation deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete evaluation' });
  }
});

export default router; 