import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { classAPI, projectAPI } from '../lib/api';

interface Teacher {
  _id: string;
  name: string;
  email: string;
}

interface Project {
  _id: string;
  title: string;
  class: string;
}

export default function Login() {
  const [activeTab, setActiveTab] = useState('lab-instructor');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [usn, setUsn] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  // New state for peer login
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);

  // Fetch teachers on component mount
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const response = await classAPI.getTeachers();
        setTeachers(response);
      } catch (error) {
        console.error('Error fetching teachers:', error);
        setError('Failed to fetch teachers');
      }
    };
    fetchTeachers();
  }, []);

  // Fetch projects when teacher is selected
  useEffect(() => {
    const fetchProjects = async () => {
      if (!selectedTeacher) {
        setProjects([]);
        return;
      }

      setIsLoadingProjects(true);
      try {
        const response = await projectAPI.getProjects();
        // Filter projects for selected teacher
        const teacherProjects = response.filter(project => project.createdBy?._id === selectedTeacher);
        setProjects(teacherProjects);
      } catch (error) {
        console.error('Error fetching projects:', error);
        setError('Failed to fetch projects');
      } finally {
        setIsLoadingProjects(false);
      }
    };

    fetchProjects();
  }, [selectedTeacher]);

  const handleLabInstructorLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validate credentials
      if (email !== 'admin@admin.com' || password !== 'admin') {
        setError('Invalid credentials. Please check your email and password.');
        return;
      }

      await login(email, password, 'lab_instructor');
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      setError('Login failed. Please try again.');
    }
  };

  const handleTeacherLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password, 'teacher');
      navigate('/presenter-dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  const handlePeerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacher || !selectedProject || !usn) {
      setError('Please select a teacher, project, and enter your USN');
      return;
    }

    try {
      await login(usn, selectedProject, 'peer');
      // Store the selected project ID in localStorage for later use
      localStorage.setItem('selectedProjectId', selectedProject);
      navigate('/peer-dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Choose your role to login</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="lab-instructor">Lab Instructor</TabsTrigger>
              <TabsTrigger value="teacher">Teacher</TabsTrigger>
              <TabsTrigger value="peer">Peer</TabsTrigger>
            </TabsList>

            <TabsContent value="lab-instructor">
              <form onSubmit={handleLabInstructorLogin} className="space-y-4">
                <div>
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">Login</Button>
              </form>
              <p className="mt-4 text-sm text-gray-500 text-center">
                Please contact administrator for login credentials.
              </p>
            </TabsContent>

            <TabsContent value="teacher">
              <form onSubmit={handleTeacherLogin} className="space-y-4">
                <div>
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">Login</Button>
              </form>
              <p className="mt-4 text-sm text-gray-500 text-center">
                Please contact lab instructor for login credentials.
              </p>
            </TabsContent>

            <TabsContent value="peer">
              <form onSubmit={handlePeerLogin} className="space-y-4">
                <div>
                  <Select
                    value={selectedTeacher}
                    onValueChange={setSelectedTeacher}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map((teacher) => (
                        <SelectItem key={teacher._id} value={teacher._id}>
                          {teacher.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Select
                    value={selectedProject}
                    onValueChange={setSelectedProject}
                    disabled={!selectedTeacher || isLoadingProjects}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={isLoadingProjects ? "Loading projects..." : "Select Project"} />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project._id} value={project._id}>
                          {project.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Input
                    type="text"
                    placeholder="USN"
                    value={usn}
                    onChange={(e) => setUsn(e.target.value.toUpperCase())}
                    required
                    disabled={!selectedProject}
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={!selectedTeacher || !selectedProject || !usn}
                >
                  Login
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {error && (
            <div className="mt-4 text-red-500 text-sm text-center">
              {error}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}