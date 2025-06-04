import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  email?: string;
  password?: string;
  name: string;
  role: 'admin' | 'lab_instructor' | 'teacher' | 'peer';
  usn?: string;  // For peer users
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: function(this: { role: string }): boolean {
      return this.role !== 'peer';
    },
    trim: true,
    lowercase: true,
    sparse: true
  },
  password: {
    type: String,
    required: function(this: { role: string }): boolean {
      return this.role !== 'peer';
    },
    select: false
  },
  name: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'lab_instructor', 'teacher', 'peer'],
    default: 'peer'
  },
  usn: {
    type: String,
    required: function(this: { role: string }): boolean {
      return this.role === 'peer';
    },
    validate: {
      validator: function(v: string) {
        // Updated regex to match format like 1MS22CS038
        return /^[1-9][A-Z]{2}\d{2}[A-Z]{2}\d{3}$/.test(v);
      },
      message: 'Invalid USN format. Expected format: 1MS22CS038'
    }
  }
}, {
  timestamps: true,
  toJSON: {
    transform: (_doc, ret) => {
      delete ret.password;
      return ret;
    }
  }
});

// Add compound index for email uniqueness only for non-peer users
userSchema.index({ email: 1, role: 1 }, { 
  unique: true,
  partialFilterExpression: { role: { $ne: 'peer' } }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>('User', userSchema); 