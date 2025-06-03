import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '../hooks/useAuth';
import { authAPI, classAPI } from '../lib/api';
import { Plus, Trash2, Users, GraduationCap } from "lucide-react";
import { useNavigate } from 'react-router-dom';

interface Teacher {
  _id: string;
  name: string;
  email: string;
  department?: string;
}

interface Class {
  _id: string;
  name: string;
  semester: string;
  students: string[];
}

const LabAssistantDashboard = () => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [teacherCreationError, setTeacherCreationError] = useState<string | null>(null);
  const [newClassName, setNewClassName] = useState("");
  const [newClassSemester, setNewClassSemester] = useState("");
  const [newClassStudents, setNewClassStudents] = useState<string[]>([]);
  const [newTeacher, setNewTeacher] = useState<{ 
    name: string;
    email: string;
    password: string;
    department: string;
  }>({ 
    name: "", 
    email: "", 
    password: "", 
    department: "" 
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
      return;
    }

    if (user?.role === 'lab_instructor') {
      fetchTeachers();
      fetchClasses();
    }
  }, [user, loading, navigate]);

  const createTeacher = async () => {
    try {
      if (!newTeacher.email || !newTeacher.password || !newTeacher.name) {
        setTeacherCreationError('Please fill in all required fields');
        return;
      }

      const createdTeacher = await authAPI.createTeacher(newTeacher.email, newTeacher.password, newTeacher.name);
      setTeachers([...teachers, createdTeacher]);
      setNewTeacher({ 
        name: '',
        email: '',
        password: '',
        department: ''
      });
      setTeacherCreationError(null);
    } catch (error: any) {
      setTeacherCreationError(error.response?.data?.error || 'Failed to create teacher');
    }
  };

  const createClass = async () => {
    try {
      if (!newClassName || !newClassSemester || !newClassStudents.length) {
        alert('Please fill in all required fields');
        return;
      }

      const newClassData = {
        name: newClassName,
        semester: newClassSemester,
        students: newClassStudents
      };

      const createdClass = await classAPI.createClass(newClassData);
      setClasses([...classes, createdClass]);
      setNewClassName("");
      setNewClassSemester("");
      setNewClassStudents([]);
    } catch (error) {
      console.error('Error creating class:', error);
      alert('Failed to create class');
    }
  };

  const fetchTeachers = async () => {
    try {
        const teachers = await authAPI.getTeachers();
        setTeachers(teachers);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const fetchClasses = async () => {
    try {
      const classes = await classAPI.getClasses();
      setClasses(classes);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const deleteTeacher = async (id: string) => {
    try {
      await authAPI.deleteTeacher(id);
      setTeachers(teachers.filter(t => t._id !== id));
    } catch (error) {
      console.error('Error deleting teacher:', error);
      alert('Failed to delete teacher');
    }
  };

  const deleteClass = async (id: string) => {
    try {
      await classAPI.deleteClass(id);
      setClasses(classes.filter(c => c._id !== id));
    } catch (error) {
      console.error('Error deleting class:', error);
      alert('Failed to delete class');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Lab Assistant Dashboard</h1>
          <Button onClick={logout} variant="destructive">Logout</Button>
        </div>

        <Tabs defaultValue="teachers" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="teachers" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Teachers
            </TabsTrigger>
            <TabsTrigger value="classes" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Classes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="teachers">
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">Create New Teacher</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="teacher-email">Email</Label>
                    <Input
                      id="teacher-email"
                      value={newTeacher.email}
                      onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                      placeholder="Enter teacher email"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="teacher-password">Password</Label>
                    <Input
                      id="teacher-password"
                      type="password"
                      value={newTeacher.password}
                      onChange={(e) => setNewTeacher({ ...newTeacher, password: e.target.value })}
                      placeholder="Enter password"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="teacher-name">Name</Label>
                    <Input
                      id="teacher-name"
                      value={newTeacher.name}
                      onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
                      placeholder="Enter teacher name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="teacher-department">Department</Label>
                    <Input
                      id="teacher-department"
                      value={newTeacher.department}
                      onChange={(e) => setNewTeacher({ ...newTeacher, department: e.target.value })}
                      placeholder="Enter department"
                    />
                  </div>
                </div>
                <Button onClick={createTeacher} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create Teacher
                </Button>
                {teacherCreationError && (
                  <p className="text-red-500 text-sm">{teacherCreationError}</p>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Teachers List</h3>
                <div className="grid gap-4">
                  {teachers.map((teacher) => (
                    <Card key={teacher._id}>
                      <CardHeader>
                        <CardTitle>{teacher.name}</CardTitle>
                        <CardDescription>{teacher.email}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-gray-500">{teacher.department}</p>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteTeacher(teacher._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="classes">
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">Create New Class</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="class-name">Class Name</Label>
                    <Input
                      id="class-name"
                      value={newClassName}
                      onChange={(e) => setNewClassName(e.target.value)}
                      placeholder="Enter class name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="class-semester">Semester</Label>
                    <Input
                      id="class-semester"
                      value={newClassSemester}
                      onChange={(e) => setNewClassSemester(e.target.value)}
                      placeholder="Enter semester"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="class-students">Students (comma-separated)</Label>
                    <Input
                      id="class-students"
                      value={newClassStudents.join(', ')}
                      onChange={(e) => setNewClassStudents(e.target.value.split(',').map(s => s.trim()))}
                      placeholder="Enter student emails, separated by commas"
                      required
                    />
                  </div>
                </div>
                <Button onClick={createClass} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create Class
                </Button>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Classes List</h3>
                <div className="grid gap-4">
                  {classes.map((class_) => (
                    <Card key={class_._id}>
                      <CardHeader>
                        <CardTitle>{class_.name}</CardTitle>
                        <CardDescription>Semester: {class_.semester}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-gray-500">
                            {class_.students.length} students
                          </p>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteClass(class_._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default LabAssistantDashboard;
