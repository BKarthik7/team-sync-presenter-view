import mongoose from 'mongoose';

export interface IEvaluation extends mongoose.Document {
  team: mongoose.Types.ObjectId;
  evaluator: mongoose.Types.ObjectId;
  scores: {
    criteria: string;
    score: number;
    comments: string;
  }[];
  overallScore: number;
  feedback: string;
  createdAt: Date;
  updatedAt: Date;
}

const evaluationSchema = new mongoose.Schema({
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  evaluator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  scores: [{
    criteria: {
      type: String,
      required: true
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 10
    },
    comments: {
      type: String,
      required: true
    }
  }],
  overallScore: {
    type: Number,
    required: true,
    min: 0,
    max: 10
  },
  feedback: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

export const Evaluation = mongoose.model<IEvaluation>('Evaluation', evaluationSchema); 