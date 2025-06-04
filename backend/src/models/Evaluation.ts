import mongoose, { Schema, Document } from 'mongoose';

export interface IEvaluation extends Document {
  form: mongoose.Types.ObjectId;
  project: mongoose.Types.ObjectId;
  team: mongoose.Types.ObjectId;
  submittedBy: mongoose.Types.ObjectId;
  responses: Record<string, string | number>;
  createdAt: Date;
  updatedAt: Date;
}

const evaluationSchema = new Schema({
  form: {
    type: Schema.Types.ObjectId,
    ref: 'EvaluationForm',
    required: true
  },
  project: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  team: {
    type: Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  submittedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  responses: {
    type: Map,
    of: Schema.Types.Mixed,
    required: true
  }
}, {
  timestamps: true
});

export const Evaluation = mongoose.model<IEvaluation>('Evaluation', evaluationSchema); 