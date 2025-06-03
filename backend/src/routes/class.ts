import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { AuthenticatedRequest } from '../types';
import { Class } from '../models/Class';
import { pusher } from '../index';
import { isAuthenticated } from '../middleware/auth';

const router = Router();

// Create a new class
router.post('/', isAuthenticated, async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const { name, semester, students } = authReq.body as { name: string; semester: string; students?: string[] };
    const class_ = new Class({
      name,
      semester,
      students: students || [],
      createdBy: authReq.user._id
    });

    await class_.save();
    res.status(201).json(class_);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Get all classes for a user
router.get('/', isAuthenticated, async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const classes = await Class.find({ createdBy: authReq.user._id });
    res.json(classes);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get a specific class
router.get('/:id', isAuthenticated, async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const { id } = authReq.params as { id: string };
    const class_ = await Class.findById(id);
    if (!class_) {
      return res.status(404).json({ message: 'Class not found' });
    }

    if (!Types.ObjectId.isValid(class_.createdBy) || !Types.ObjectId.isValid(authReq.user._id)) {
      return res.status(400).json({ message: 'Invalid ObjectId' });
    }

    if (class_.createdBy.toString() !== authReq.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to access this class' });
    }

    res.json(class_);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
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

    if (!Types.ObjectId.isValid(class_.createdBy) || !Types.ObjectId.isValid(authReq.user._id)) {
      return res.status(400).json({ message: 'Invalid ObjectId' });
    }

    if (class_.createdBy.toString() !== authReq.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this class' });
    }

    const updatedClass = await Class.findByIdAndUpdate(
      id,
      { $set: authReq.body },
      { new: true }
    );
    res.json(updatedClass);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
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

    if (!Types.ObjectId.isValid(class_.createdBy) || !Types.ObjectId.isValid(authReq.user._id)) {
      return res.status(400).json({ message: 'Invalid ObjectId' });
    }

    if (class_.createdBy.toString() !== authReq.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this class' });
    }

    await Class.findByIdAndDelete(id);
    res.json({ message: 'Class deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
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

    if (!Types.ObjectId.isValid(class_.createdBy) || !Types.ObjectId.isValid(authReq.user._id)) {
      return res.status(400).json({ message: 'Invalid ObjectId' });
    }

    if (class_.createdBy.toString() !== authReq.user._id.toString()) {
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
    res.status(400).json({ message: error.message });
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

    if (!Types.ObjectId.isValid(class_.createdBy) || !Types.ObjectId.isValid(authReq.user._id)) {
      return res.status(400).json({ message: 'Invalid ObjectId' });
    }

    if (class_.createdBy.toString() !== authReq.user._id.toString()) {
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
    res.status(400).json({ message: error.message });
  }
});

export default router;