import { Router, Request } from 'express';
import { Types } from 'mongoose';
import { AuthenticatedRequest } from '../types';
import { Class } from '../models/Class';
import { pusher } from '../index';

const router = Router();

// Type guard function to check if request is authenticated
function isAuthenticatedRequest(req: Request): req is AuthenticatedRequest {
  return 'user' in req;
}

// Create a new class
router.post('/', async (req: Request, res) => {
  if (!isAuthenticatedRequest(req)) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const { name, semester, students } = req.body as { name: string; semester: string; students?: string[] };
    const class_ = new Class({
      name,
      semester,
      students: students || [],
      createdBy: req.user._id
    });

    await class_.save();
    res.status(201).json(class_);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Get all classes for a user
router.get('/', async (req: Request, res) => {
  if (!isAuthenticatedRequest(req)) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const classes = await Class.find({ createdBy: req.user._id });
    res.json(classes);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get a specific class
router.get('/:id', async (req: Request, res) => {
  if (!isAuthenticatedRequest(req)) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const { id } = req.params as { id: string };
    const class_ = await Class.findById(id);
    if (!class_) {
      return res.status(404).json({ message: 'Class not found' });
    }

    if (!Types.ObjectId.isValid(class_.createdBy) || !Types.ObjectId.isValid(req.user._id)) {
      return res.status(400).json({ message: 'Invalid ObjectId' });
    }

    if (class_.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to access this class' });
    }

    res.json(class_);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Update a class
router.put('/:id', async (req: Request, res) => {
  if (!isAuthenticatedRequest(req)) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const { id } = req.params as { id: string };
    const class_ = await Class.findById(id);
    if (!class_) {
      return res.status(404).json({ message: 'Class not found' });
    }

    if (!Types.ObjectId.isValid(class_.createdBy) || !Types.ObjectId.isValid(req.user._id)) {
      return res.status(400).json({ message: 'Invalid ObjectId' });
    }

    if (class_.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this class' });
    }

    const updatedClass = await Class.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true }
    );
    res.json(updatedClass);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a class
router.delete('/:id', async (req: Request, res) => {
  if (!isAuthenticatedRequest(req)) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const { id } = req.params as { id: string };
    const class_ = await Class.findById(id);
    if (!class_) {
      return res.status(404).json({ message: 'Class not found' });
    }

    if (!Types.ObjectId.isValid(class_.createdBy) || !Types.ObjectId.isValid(req.user._id)) {
      return res.status(400).json({ message: 'Invalid ObjectId' });
    }

    if (class_.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this class' });
    }

    await Class.findByIdAndDelete(id);
    res.json({ message: 'Class deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Add a student to a class
router.post('/:id/students', async (req: Request, res) => {
  if (!isAuthenticatedRequest(req)) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const { id } = req.params as { id: string };
    const { studentId } = req.body as { studentId: string };
    const class_ = await Class.findById(id);
    if (!class_) {
      return res.status(404).json({ message: 'Class not found' });
    }

    if (!Types.ObjectId.isValid(class_.createdBy) || !Types.ObjectId.isValid(req.user._id)) {
      return res.status(400).json({ message: 'Invalid ObjectId' });
    }

    if (class_.createdBy.toString() !== req.user._id.toString()) {
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
router.delete('/:id/students/:studentId', async (req: Request, res) => {
  if (!isAuthenticatedRequest(req)) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const { id, studentId } = req.params as { id: string; studentId: string };
    const class_ = await Class.findById(id);
    if (!class_) {
      return res.status(404).json({ message: 'Class not found' });
    }

    if (!Types.ObjectId.isValid(class_.createdBy) || !Types.ObjectId.isValid(req.user._id)) {
      return res.status(400).json({ message: 'Invalid ObjectId' });
    }

    if (class_.createdBy.toString() !== req.user._id.toString()) {
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