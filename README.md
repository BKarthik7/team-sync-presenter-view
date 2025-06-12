# Team Sync Presenter View

🌟 **A Real-Time Peer Evaluation Platform** 🌟

This is an innovative and one-of-a-kind project that provides a unique solution for peer evaluation during team presentations. Unlike any other project available on GitHub or the internet, Team Sync Presenter View enables real-time peer feedback, comprehensive evaluation metrics, and structured assessment in a seamless interface.

## What Makes This Project Unique? 

- 🎯 **First of its Kind**: The only open-source solution combining real-time peer evaluation with comprehensive feedback systems
- 🔄 **Real-time Feedback**: Instant evaluation updates across all connected devices using Pusher
- 🎓 **Educational Focus**: Specifically designed for peer-to-peer learning in academic environments
- 📊 **Comprehensive Assessment**: Multi-dimensional peer evaluation system with customizable rubrics
- 🔐 **Role-based Access**: Distinct interfaces for evaluators and presenters

## Features

- Real-time peer evaluation system
- Comprehensive feedback management
- Class and project assessment tracking
- User authentication (Teachers and Students)
- Real-time updates using Pusher
- MongoDB database integration

## Tech Stack

### Backend
- Node.js
- Express.js
- TypeScript
- MongoDB with Mongoose
- Pusher for real-time updates
- JWT for authentication

### Frontend
- React
- TypeScript
- Tailwind CSS
- Vite

## Prerequisites

- Node.js (v20 or later)
- MongoDB
- Pusher account
- Vercel account

## Environment Variables

Create two `.env` files in your project:

### Backend `.env` (in `/backend` directory)
```env
# MongoDB Connection
MONGODB_URI=your_mongodb_connection_string

# Server Configuration
PORT=3001
BASE_URL=your_backend_url
JWT_SECRET=your_jwt_secret

# Pusher Configuration
PUSHER_APP_ID=your_pusher_app_id
PUSHER_KEY=your_pusher_key
PUSHER_SECRET=your_pusher_secret
PUSHER_CLUSTER=your_pusher_cluster
```

### Frontend `.env` (in root directory)
```env
# API Configuration
VITE_API_BASE_URL=your_backend_api_url
JWT_SECRET=your_jwt_secret

# Pusher Configuration
VITE_PUSHER_KEY=your_pusher_key
VITE_PUSHER_CLUSTER=your_pusher_cluster
```

Make sure to replace the placeholder values with your actual credentials.

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/team-sync-presenter-view.git
cd team-sync-presenter-view
```

2. Install backend dependencies:
```bash
cd ${project}/backend
npm install
```

3. Install frontend dependencies:
```bash
cd ${project}
npm install
```

## Development

1. Start the backend server:
```bash
cd ${project}/backend
npm run dev
```

2. Start the frontend development server:
```bash
cd ${project}
npm run dev
```

## Deployment

The project is configured for deployment on Vercel.

1. Deploy the backend:
```bash
cd backend
npm run deploy
```

2. Deploy the frontend:
```bash
cd ..
npm run deploy
```

## Innovation Highlights

### 1. Smart Queue Management
- Intelligent algorithms for queue optimization
- Automatic time allocation based on team size
- Priority handling for special presentations

### 2. Real-time Evaluation System
- Live feedback mechanism
- Instant scoring updates
- Comprehensive evaluation metrics

### 3. Presenter View Features
- Custom timer controls
- Team status indicators
- Dynamic queue adjustments

## Use Cases

- 🏫 Educational Institutions
- 👥 Team Project Presentations
- 🎯 Hackathons
- 📊 Research Presentations
- 🏢 Corporate Training Sessions

## Project Status

This project is maintained and is the first of its kind. While there are other presentation management tools, none combine real-time team synchronization with presentation management in this unique way.

## Recognition

- 🏆 Featured in a educational technology forum
- 💡 Innovative approach to team presentation management
- 🌟 Unique implementation of real-time features

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details
