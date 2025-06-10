import Pusher from 'pusher-js';

// Initialize Pusher client
const pusherKey = import.meta.env.VITE_PUSHER_KEY;
const pusherCluster = import.meta.env.VITE_PUSHER_CLUSTER;

console.log('Initializing Pusher with config:', {
  key: pusherKey ? '***' : 'missing',
  cluster: pusherCluster || 'missing'
});

if (!pusherKey || !pusherCluster) {
  console.error('Missing Pusher configuration. Please check your environment variables.');
}

export const pusher = new Pusher(pusherKey || '', {
  cluster: pusherCluster || '',
  enabledTransports: ['ws', 'wss'],
  disabledTransports: ['xhr_streaming', 'xhr_polling'],
  forceTLS: true
});

// Add connection status logging
pusher.connection.bind('connected', () => {
  console.log('Pusher connected successfully');
});

pusher.connection.bind('error', (err: any) => {
  console.error('Pusher connection error:', err);
});

pusher.connection.bind('disconnected', () => {
  console.log('Pusher disconnected');
});

pusher.connection.bind('connecting', () => {
  console.log('Pusher connecting...');
});

// Channel names
export const CHANNELS = {
  PRESENTATION: (projectId: string) => `presentation-${projectId}`,
  QUEUE: (projectId: string) => `queue-${projectId}`,
};

// Event names
export const EVENTS = {
  TIMER_UPDATE: 'timer-update',
  QUEUE_UPDATE: 'queue-update',
  EVALUATION_TOGGLE: 'evaluation-toggle',
  PRESENTATION_START: 'presentation-start',
  PRESENTATION_END: 'presentation-end',
  CURRENT_TEAM_UPDATE: 'current-team-update',
  EVALUATION_FORM_UPDATE: 'evaluation-form-update',
  EVALUATION_SUBMITTED: 'evaluation-submitted'
} as const; 