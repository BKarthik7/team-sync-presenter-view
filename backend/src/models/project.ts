import mongoose, { Schema, Document } from 'mongoose';
import { Class } from './class';

export interface ProjectDocument extends Document {
  name: string;
  class: mongoose.Types.ObjectId;
  status: 'active' | 'completed';
  createdAt: Date;
}

const projectSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  class: {
    type: Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export const Project = mongoose.model<ProjectDocument>('Project', projectSchema);
