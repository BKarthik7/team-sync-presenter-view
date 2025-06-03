import mongoose from 'mongoose';

export interface ITeam extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  class: mongoose.Types.ObjectId;
  members: string[];
  evaluations: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  members: [{
    type: String,
    required: true
  }],
  evaluations: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Evaluation'
  }]
}, {
  timestamps: true
});

export const Team = mongoose.model<ITeam>('Team', teamSchema); 