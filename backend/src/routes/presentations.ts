import express from 'express';
import { isAuthenticated } from '../middleware/auth';
import Pusher from 'pusher';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Channel names
const CHANNELS = {
  PRESENTATION: (projectId: string) => `presentation-${projectId}`,
  QUEUE: (projectId: string) => `queue-${projectId}`,
};

// Event names
const EVENTS = {
  TIMER_UPDATE: 'timer-update',
  QUEUE_UPDATE: 'queue-update',
  EVALUATION_TOGGLE: 'evaluation-toggle',
  PRESENTATION_START: 'presentation-start',
  PRESENTATION_END: 'presentation-end',
  CURRENT_TEAM_UPDATE: 'current-team-update',
  EVALUATION_FORM_UPDATE: 'evaluation-form-update',
};

// Initialize Pusher
let pusher: Pusher | null = null;
try {
  if (process.env.PUSHER_APP_ID && process.env.PUSHER_KEY && process.env.PUSHER_SECRET && process.env.PUSHER_CLUSTER) {
    pusher = new Pusher({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.PUSHER_KEY,
      secret: process.env.PUSHER_SECRET,
      cluster: process.env.PUSHER_CLUSTER,
      useTLS: true
    });
  } else {
    console.warn('Pusher credentials not found 1. Real-time updates will be disabled.');
  }
} catch (error) {
  console.error('Error initializing Pusher:', error);
}

// Helper function to safely trigger Pusher events
const safeTrigger = async (channel: string, event: string, data: any) => {
  if (!pusher) {
    console.warn('Pusher not initialized. Skipping event trigger.');
    return;
  }
  try {
    await pusher.trigger(channel, event, data);
  } catch (error) {
    console.error(`Error triggering Pusher event ${event}:`, error);
    throw error;
  }
};

// Start presentation
router.post('/:projectId/start', isAuthenticated, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { team } = req.body;

    await safeTrigger(CHANNELS.PRESENTATION(projectId), EVENTS.PRESENTATION_START, {
      team,
      timer: 0,
    });

    res.json({ message: 'Presentation started' });
  } catch (error) {
    console.error('Error starting presentation:', error);
    res.status(500).json({ error: 'Failed to start presentation' });
  }
});

// End presentation
router.post('/:projectId/end', isAuthenticated, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { team } = req.body;

    await safeTrigger(CHANNELS.PRESENTATION(projectId), EVENTS.PRESENTATION_END, {
      team,
    });

    res.json({ message: 'Presentation ended' });
  } catch (error) {
    console.error('Error ending presentation:', error);
    res.status(500).json({ error: 'Failed to end presentation' });
  }
});

// Update queue
router.post('/:projectId/queue', isAuthenticated, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { teams } = req.body;

    await safeTrigger(CHANNELS.QUEUE(projectId), EVENTS.QUEUE_UPDATE, {
      teams,
    });

    res.json({ message: 'Queue updated' });
  } catch (error) {
    console.error('Error updating queue:', error);
    res.status(500).json({ error: 'Failed to update queue' });
  }
});

// Toggle evaluation
router.post('/:projectId/evaluation', isAuthenticated, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { enabled } = req.body;

    await safeTrigger(CHANNELS.PRESENTATION(projectId), EVENTS.EVALUATION_TOGGLE, {
      enabled,
    });

    res.json({ message: 'Evaluation toggled' });
  } catch (error) {
    console.error('Error toggling evaluation:', error);
    res.status(500).json({ error: 'Failed to toggle evaluation' });
  }
});

// Update current team
router.post('/:projectId/current-team', isAuthenticated, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { team } = req.body;

    console.log('Updating current team:', {
      projectId,
      team
    });

    await safeTrigger(CHANNELS.PRESENTATION(projectId), EVENTS.CURRENT_TEAM_UPDATE, {
      team
    });
    console.log('Successfully triggered current team update');

    res.json({ message: 'Current team updated' });
  } catch (error) {
    console.error('Error updating current team:', error);
    res.status(500).json({ error: 'Failed to update current team' });
  }
});

// Update timer
router.post('/:projectId/timer', isAuthenticated, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { timer, team } = req.body;

    if (typeof timer !== 'number') {
      return res.status(400).json({ error: 'Timer must be a number' });
    }

    // Send both timer and team info in the same event
    await safeTrigger(CHANNELS.PRESENTATION(projectId), EVENTS.TIMER_UPDATE, {
      timer,
      team
    });

    res.json({ message: 'Timer and team updated' });
  } catch (error) {
    console.error('Error updating timer:', error);
    // If Pusher is not initialized, still return success to prevent client errors
    if (!pusher) {
      return res.json({ message: 'Timer updated (Pusher not available)' });
    }
    res.status(500).json({ error: 'Failed to update timer' });
  }
});

// Push evaluation form to peers
router.post('/:projectId/evaluation-form', isAuthenticated, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { form } = req.body;

    console.log('Received evaluation form push request:', {
      projectId,
      form
    });

    if (!pusher) {
      console.error('Pusher not initialized');
      return res.status(500).json({ error: 'Pusher not initialized' });
    }

    const channel = CHANNELS.PRESENTATION(projectId);
    console.log('Triggering Pusher event on channel:', channel);

    try {
      // First trigger the form update
      await safeTrigger(channel, EVENTS.EVALUATION_FORM_UPDATE, form);
      console.log('Successfully triggered Pusher event for form update');

      // Then trigger the evaluation toggle
      await safeTrigger(channel, EVENTS.EVALUATION_TOGGLE, {
        enabled: true,
        timeLimit: form.evaluationTime
      });
      console.log('Successfully triggered Pusher event for evaluation toggle');
    } catch (error) {
      console.error('Error triggering Pusher event:', error);
      throw error;
    }

    res.json({ message: 'Evaluation form pushed to peers' });
  } catch (error) {
    console.error('Error pushing evaluation form:', error);
    res.status(500).json({ error: 'Failed to push evaluation form' });
  }
});

export default router; 