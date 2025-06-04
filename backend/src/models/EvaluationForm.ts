import mongoose, { Schema, Document } from 'mongoose';

export interface IEvaluationForm extends Document {
  title: string;
  description: string;
  fields: {
    type: 'rating' | 'text';
    label: string;
    required: boolean;
  }[];
  evaluationTime: number;
  createdBy: mongoose.Types.ObjectId;
  project: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const evaluationFormSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  fields: [{
    type: {
      type: String,
      enum: ['rating', 'text'],
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
    required: {
      type: Boolean,
      default: true,
    },
  }],
  evaluationTime: {
    type: Number,
    required: true,
    default: 300, // 5 minutes in seconds
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  project: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
}, {
  timestamps: true,
});

export const EvaluationForm = mongoose.model<IEvaluationForm>('EvaluationForm', evaluationFormSchema); 