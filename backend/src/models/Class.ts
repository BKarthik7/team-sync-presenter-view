import mongoose, { Schema, Document } from 'mongoose';
import { IClass } from '../types';

const classSchema = new Schema<IClass>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  semester: {
    type: String,
    required: true
  },
  students: [{
    type: String,
    required: true
  }],
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

export const Class = mongoose.model<IClass>('Class', classSchema);