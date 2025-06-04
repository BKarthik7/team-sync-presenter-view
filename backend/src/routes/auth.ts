import express, { Response, Request } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { Team } from '../models/Team';
import { isAuthenticated, AuthenticatedRequest } from '../middleware/auth';
import { Types } from 'mongoose';

const router = express.Router();

// Extend AuthenticatedRequest to include params and body
interface AuthRequest extends AuthenticatedRequest {
  params: {
    id?: string;
  };
  body: {
    name?: string;
    email?: string;
    password?: string;
  };
}

// Register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, role } = (req as any).body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = new User({
      email,
      password: hashedPassword,
      role: role || 'student'
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { _id: user._id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.status(201).json({ token, user: { _id: user._id, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Generic login endpoint
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = (req as any).body;
    
    // Special case for admin/admin - only allow lab_instructor role
    if (email === 'admin@admin.com' && password === 'admin') {
      try {
        // Create or get lab_instructor user
        const adminUser = await User.findOneAndUpdate(
          { email: 'admin@admin.com' },
          { 
            $setOnInsert: {
              email: 'admin@admin.com',
              password: await bcrypt.hash('admin', 10),
              name: 'Admin',
              role: 'lab_instructor'
            }
          },
          { upsert: true, new: true }
        );

        const token = jwt.sign(
          { _id: adminUser._id, role: adminUser.role },
          process.env.JWT_SECRET || 'default-secret-key-for-development',
          { expiresIn: '24h' }
        );

        return res.json({ 
          user: adminUser, 
          token: token 
        });
      } catch (error) {
        console.error('Admin login error:', error);
        return res.status(500).json({ error: 'Server error' });
      }
    }

    // Try to find user with any role
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { _id: user._id, role: user.role },
      process.env.JWT_SECRET || 'default-secret-key-for-development',
      { expiresIn: '24h' }
    );

    return res.json({ user, token });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Teacher Login
router.post('/teacher/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = (req as any).body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email, role: 'teacher' }).select('+password');
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { _id: user._id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({ 
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }, 
      token 
    });
  } catch (error) {
    console.error('Teacher login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Peer Login (USN only)
router.post('/peer/login', async (req: Request, res: Response) => {
  try {
    const { usn, projectId } = (req as any).body;
    
    if (!usn || !projectId) {
      return res.status(400).json({ error: 'USN and Project ID are required' });
    }

    // Find a team that has this USN and is associated with the project
    const team = await Team.findOne({
      project: projectId,
      members: usn // Since members is an array of strings, we can directly match the USN
    });

    if (!team) {
      return res.status(401).json({ error: 'USN not found in any team for this project' });
    }

    // Find or create the user
    let user = await User.findOne({ usn, role: 'peer' });
    
    if (!user) {
      // Create a new peer user if they don't exist
      user = new User({
        usn,
        role: 'peer',
        name: usn // Using USN as name initially
      });
      await user.save();
    }

    const token = jwt.sign(
      { _id: user._id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({ 
      user: {
        _id: user._id,
        usn: user.usn,
        role: user.role,
        name: user.name
      }, 
      token 
    });
  } catch (error) {
    console.error('Peer login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create Teacher Account (Lab Instructor only)
router.post('/create-teacher', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { name, email, password } = (req as AuthRequest).body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: 'teacher'
    });

    await user.save();
    res.status(201).json({ message: 'Teacher created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create teacher' });
  }
});

// Get all teachers
router.get('/teachers', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const teachers = await User.find({ role: 'teacher' }).select('-password');
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch teachers' });
  }
});

// Delete teacher
router.delete('/teacher/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const teacher = await User.findById((req as AuthRequest).params.id);
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    if (teacher.role !== 'teacher') {
      return res.status(400).json({ error: 'User is not a teacher' });
    }

    await teacher.deleteOne();
    res.json({ message: 'Teacher deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete teacher' });
  }
});

// Get current user
router.get('/me', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = await User.findById((req as AuthRequest).user._id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Get all teachers (public)
router.get('/public/teachers', async (req: Request, res: Response) => {
  try {
    const teachers = await User.find({ role: 'teacher' }).select('-password');
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;