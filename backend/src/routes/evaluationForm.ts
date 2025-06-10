import express, { Response, Request } from 'express';
import { EvaluationForm } from '../models/EvaluationForm';
import { isAuthenticated, AuthenticatedRequest } from '../middleware/auth';
import { Evaluation } from '../models/Evaluation';

const router = express.Router();

// Extend AuthenticatedRequest to include params and body
interface EvaluationFormRequest extends AuthenticatedRequest {
  params: {
    projectId?: string;
    formId?: string;
  };
  body: {
    title?: string;
    description?: string;
    fields?: Array<{
      type: 'rating' | 'text';
      label: string;
      required: boolean;
    }>;
    project?: string;
    responses?: Record<string, any>;
    evaluationTime?: number;
    teamId?: string;
  };
}

// Create a new evaluation form
router.post('/', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const authReq = req as EvaluationFormRequest;
    const { title, description, fields, project, evaluationTime } = authReq.body;
    
    if (!authReq.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!title || !description || !fields || !project) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const form = new EvaluationForm({
      title,
      description,
      fields,
      evaluationTime: evaluationTime || 300, // Default to 5 minutes if not provided
      createdBy: authReq.user._id,
      project,
    });

    await form.save();
    res.status(201).json(form);
  } catch (error) {
    console.error('Error creating evaluation form:', error);
    res.status(400).json({ error: 'Failed to create evaluation form' });
  }
});

// Get evaluation form for a project
router.get('/project/:projectId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const authReq = req as EvaluationFormRequest;
    const form = await EvaluationForm.findOne({ project: authReq.params.projectId })
      .sort({ createdAt: -1 });
    
    // Return empty form with 200 status if no form exists
    if (!form) {
      return res.json({
        _id: null,
        title: '',
        description: '',
        fields: [],
        evaluationTime: 300,
        project: authReq.params.projectId
      });
    }

    res.json(form);
  } catch (error) {
    res.status(400).json({ error: 'Failed to fetch evaluation form' });
  }
});

// Update evaluation form
router.put('/:formId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const authReq = req as EvaluationFormRequest;
    const { title, description, fields, evaluationTime } = authReq.body;
    
    if (!authReq.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!title || !description || !fields) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const form = await EvaluationForm.findById(authReq.params.formId);
    if (!form) {
      return res.status(404).json({ error: 'Evaluation form not found' });
    }

    // Only allow updates from the creator
    if (form.createdBy.toString() !== authReq.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this form' });
    }

    form.title = title;
    form.description = description;
    form.fields = fields;
    // Update evaluation time if provided
    if (evaluationTime && evaluationTime > 0) {
      form.evaluationTime = evaluationTime;
    }

    await form.save();
    res.json(form);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update evaluation form' });
  }
});

// Delete evaluation form
router.delete('/:formId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const authReq = req as EvaluationFormRequest;
    if (!authReq.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const form = await EvaluationForm.findById(authReq.params.formId);
    if (!form) {
      return res.status(404).json({ error: 'Evaluation form not found' });
    }

    // Only allow deletion from the creator
    if (form.createdBy.toString() !== authReq.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this form' });
    }

    await form.deleteOne();
    res.json({ message: 'Evaluation form deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: 'Failed to delete evaluation form' });
  }
});

// Submit evaluation
router.post('/:projectId/submit', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const authReq = req as EvaluationFormRequest;
    if (!authReq.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { responses, teamId } = authReq.body;
    if (!responses || !teamId) {
      return res.status(400).json({ error: 'Responses and team ID are required' });
    }

    const evaluationForm = await EvaluationForm.findOne({ project: authReq.params.projectId })
      .sort({ createdAt: -1 });

    if (!evaluationForm) {
      return res.status(404).json({ error: 'Evaluation form not found' });
    }

    // Validate required fields
    const missingFields = evaluationForm.fields
      .filter(field => field.required && !(responses as Record<string, any>)[field.label])
      .map(field => field.label);

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        fields: missingFields
      });
    }

    // Save evaluation response
    const evaluation = new Evaluation({
      form: evaluationForm._id,
      project: authReq.params.projectId,
      team: teamId,
      submittedBy: authReq.user._id,
      responses: responses as Record<string, any>
    });

    await evaluation.save();
    res.status(201).json(evaluation);
  } catch (error) {
    res.status(400).json({ error: 'Failed to submit evaluation' });
  }
});

export default router; 