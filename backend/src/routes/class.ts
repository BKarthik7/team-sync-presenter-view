import express, { Request, Response } from 'express';
import { Types } from 'mongoose';
import { AuthenticatedRequest } from '../types';
import { Class } from '../models/Class';
import { pusher } from '../index';
import { isAuthenticated } from '../middleware/auth';

const router = express.Router();

// Create a new class
router.post('/', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { name, semester, students } = req.body;

    const class_ = new Class({
      name,
      semester,
      students,
      teacher: authReq.user._id
    });

    await class_.save();
    await class_.populate('teacher', 'name email');
    
    res.status(201).json(class_);
  } catch (error) {
    console.error('Error creating class:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all classes
router.get('/', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    console.log('Fetching classes for user:', authReq.user._id);
    
    const classes = await Class.find()
      .populate('teacher', 'name email')
      .sort({ createdAt: -1 });
    
    console.log('Found classes:', classes.length);
    res.json(classes);
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get a specific class
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const classData = await Class.findById(req.params.id)
      .populate('teacher', 'name email');
    
    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }
    
    res.json(classData);
  } catch (error) {
    console.error('Error fetching class:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update a class
router.put('/:id', isAuthenticated, async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const { id } = authReq.params as { id: string };
    const class_ = await Class.findById(id);
    if (!class_) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Check if user is the teacher
    if (class_.teacher.toString() !== authReq.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this class' });
    }

    const updatedClass = await Class.findByIdAndUpdate(
      id,
      { $set: authReq.body },
      { new: true }
    );

    if (!updatedClass) {
      return res.status(404).json({ message: 'Class not found after update' });
    }

    await updatedClass.populate('teacher', 'name email');
    res.json(updatedClass);
  } catch (error) {
    console.error('Error updating class:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a class
router.delete('/:id', isAuthenticated, async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const { id } = authReq.params as { id: string };
    const class_ = await Class.findById(id);
    if (!class_) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Check if user is the teacher
    if (class_.teacher.toString() !== authReq.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this class' });
    }

    await class_.deleteOne();
    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    console.error('Error deleting class:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add a student to a class
router.post('/:id/students', isAuthenticated, async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const { id } = authReq.params as { id: string };
    const { studentId } = authReq.body as { studentId: string };
    const class_ = await Class.findById(id);
    if (!class_) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Check if user is the teacher
    if (class_.teacher.toString() !== authReq.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to modify this class' });
    }

    if (!studentId) {
      return res.status(400).json({ message: 'Student ID is required' });
    }

    if (class_.students.includes(studentId)) {
      return res.status(400).json({ message: 'Student is already in this class' });
    }

    class_.students.push(studentId);
    await class_.save();
    res.json(class_);
  } catch (error: any) {
    res.status(400).json({ message: error?.message || 'An error occurred' });
  }
});

// Remove a student from a class
router.delete('/:id/students/:studentId', isAuthenticated, async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const { id, studentId } = authReq.params as { id: string; studentId: string };
    const class_ = await Class.findById(id);
    if (!class_) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Check if user is the teacher
    if (class_.teacher.toString() !== authReq.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to modify this class' });
    }

    const studentIndex = class_.students.indexOf(studentId);
    if (studentIndex === -1) {
      return res.status(404).json({ message: 'Student not found in this class' });
    }

    class_.students.splice(studentIndex, 1);
    await class_.save();
    res.json(class_);
  } catch (error: any) {
    res.status(400).json({ message: error?.message || 'An error occurred' });
  }
});

// Update class teacher
router.put('/:id/teacher', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { teacherId } = req.body;

    console.log('Updating class teacher:', {
      classId: req.params.id,
      teacherId,
      userId: authReq.user._id
    });

    if (!teacherId) {
      return res.status(400).json({ error: 'Teacher ID is required' });
    }

    const class_ = await Class.findById(req.params.id);
    if (!class_) {
      console.log('Class not found:', req.params.id);
      return res.status(404).json({ error: 'Class not found' });
    }

    console.log('Found class:', {
      id: class_._id,
      currentTeacher: class_.teacher,
      name: class_.name
    });

    // Update the teacher
    class_.teacher = teacherId;
    await class_.save();
    await class_.populate('teacher', 'name email');

    console.log('Class teacher updated successfully:', {
      classId: class_._id,
      newTeacher: class_.teacher
    });

    res.json(class_);
  } catch (error) {
    console.error('Error updating class teacher:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;