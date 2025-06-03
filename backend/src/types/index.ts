import { Request } from 'express';
import { Types } from 'mongoose';
import { IUser } from '../models/User';

export interface IClass {
  name: string;
  semester: string;
  students: string[];
  createdBy: Types.ObjectId;
}

export type AuthenticatedRequest = Request & {
  user: IUser;
  body: any;
  params: any;
};

export type ClassRequestBody = {
  name: string;
  semester: string;
  students?: string[];
};

export type ClassParams = {
  id?: string;
  name?: string;
};

export type ClassRequest = Request & {
  user: IUser;
  body: ClassRequestBody;
  params: ClassParams;
};

export type ProjectRequestBody = {
  name: string;
  description: string;
  dueDate: string;
  classId: string;
};

export type ProjectRequest = Request & {
  user: IUser;
  body: ProjectRequestBody;
};

export type StudentRequestBody = {
  studentId: string;
};

export type StudentRequestParams = {
  id: string;
};

export type StudentRequest = Request & {
  user: IUser;
  body: StudentRequestBody;
  params: StudentRequestParams;
};

export type EvaluationRequestBody = {
  teamId: string;
  criteria: string;
  score: number;
  feedback: string;
};

export type EvaluationRequestParams = {
  id: string;
  teamId?: string;
};

export type EvaluationRequest = Request & {
  user: IUser;
  body: EvaluationRequestBody;
  params: EvaluationRequestParams;
};
