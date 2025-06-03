
import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Plus, Trash2 } from "lucide-react";
import { teamAPI } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import api from '@/lib/api';

const logout = async () => {
  try {
    await api.post('/auth/logout');
    localStorage.removeItem('token');
    navigate('/login');
  } catch (error) {
    console.error('Logout failed:', error);
  }
};

interface Class {
  _id: string;
  name: string;
  semester: string;
  students: string[];
}

interface Project {
  _id: string;
  name: string;
  class: string;
  status: 'active' | 'completed';
  createdAt: Date;
}

const TeamFormation = () => {
  const { user } = useAuth();
  const [studentUSN, setStudentUSN] = useState("");
  const [teamName, setTeamName] = useState("");
  const [teamMembers, setTeamMembers] = useState<string[]>([]);
  const [projectName, setProjectName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const logout = async () => {
    try {
      await api.post('/auth/logout');
      localStorage.removeItem('token');
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const [searchParams] = useSearchParams();
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    const fetchClassAndProject = async () => {
      try {
        const className = searchParams.get('class');
        const projectName = searchParams.get('project');

        if (className) {
          const response = await api.get<Class>(`/classes/${className}`);
          setSelectedClass(response.data);
        }

        if (projectName) {
          const response = await api.get<Project[]>('/projects');
          const project = response.data.find(p => p.name === projectName);
          if (project) {
            setSelectedProject(project);
          }
        }
      } catch (error) {
        console.error('Error fetching class or project:', error);
        setError('Failed to fetch class or project details');
      } finally {
        setLoading(false);
      }
    };

    fetchClassAndProject();
  }, [searchParams]);

  const addMember = () => {
    if (studentUSN && !teamMembers.includes(studentUSN)) {
      setTeamMembers([...teamMembers, studentUSN]);
      setStudentUSN("");
    }
  };

  const removeMember = (usn: string) => {
    setTeamMembers(teamMembers.filter(member => member !== usn));
  };

  const createTeam = async () => {
    if (!teamName || teamMembers.length < 2) {
      setError('Team name is required and must have at least 2 members');
      return;
    }

    try {
      await teamAPI.create({
        name: teamName,
        members: teamMembers,
        projectName: projectName,
        classId: user?.role === 'peer' ? user.usn! : user._id
      });
      
      // Reset form
      setTeamName("");
      setTeamMembers([]);
      setError(null);
      alert('Team created successfully!');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create team');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Team Formation</h1>
          <Button variant="destructive" onClick={logout}>Logout</Button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p>Loading project details...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            {error}
          </div>
        ) : (
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                <Users className="h-6 w-6" />
                Team Formation
              </CardTitle>
              <CardDescription>
                Create your team for: <strong>{projectName}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="team-name">Team Name</Label>
                <Input
                  id="team-name"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Enter team name"
                  required
                />
              </div>

              <div>
                <Label>Team Members</Label>
                <div className="space-y-4">
                  {teamMembers.map((member) => (
                    <div key={member} className="flex items-center gap-2">
                      <span>{member}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeMember(member)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="student-usn">Add Team Member</Label>
                  <Input
                    id="student-usn"
                    value={studentUSN}
                    onChange={(e) => setStudentUSN(e.target.value)}
                    placeholder="Enter student USN"
                    required
                  />
                </div>
                <Button
                  onClick={addMember}
                  disabled={!studentUSN || teamMembers.includes(studentUSN)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Member
                </Button>
              </div>

              <ul>
                <li>• All members must be from the same class</li>
                <li>• Team name must be unique</li>
              </ul>

              <Button
                onClick={createTeam}
                disabled={!teamName || teamMembers.length < 2}
                className="w-full"
              >
                Create Team
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TeamFormation;
