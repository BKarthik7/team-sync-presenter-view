import cors from 'cors';

const allowedOrigins = [
  'https://team-sync-presenter-view-frontend.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173'
];

export const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

export const corsMiddleware = cors(corsOptions);
