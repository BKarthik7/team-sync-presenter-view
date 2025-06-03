import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Plus, Trash2 } from "lucide-react";
import { teamAPI, classAPI, projectAPI } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

interface Team {
  _id: string;
  name: string;
  members: string[];
  class: string;
  description: string;
}

interface Class {
  _id: string;
  name: string;
  semester: string;
  students: string[];
}

interface Project {
  _id: string;
  title: string;
  description: string;
  teamSize: number;
  class?: string;
  status: 'active' | 'completed' | 'archived';
  createdAt: Date;
  createdBy?: {
    _id: string;
    name: string;
    email: string;
  };
}

const TeamFormation = () => {
  const [studentUSN, setStudentUSN] = useState("");
  const [teamName, setTeamName] = useState("");
  const [teamMembers, setTeamMembers] = useState<string[]>([]);
  const [existingTeams, setExistingTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [searchParams] = useSearchParams();
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    const fetchClassAndProject = async () => {
      try {
        const classId = searchParams.get('classId');
        const projectId = searchParams.get('projectId');

        if (classId) {
          const classData = await classAPI.getClass(classId);
          setSelectedClass(classData);
          
          // Fetch existing teams for this class
          const teamsResponse = await teamAPI.getByClass(classId);
          setExistingTeams(teamsResponse);
        }

        if (projectId) {
          const projectData = await projectAPI.getProject(projectId);
          setSelectedProject(projectData);
        }
      } catch (error) {
        console.error('Error fetching class or project:', error);
        toast({
          title: "Error",
          description: "Failed to fetch class or project details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchClassAndProject();
  }, [searchParams, toast]);

  const addMember = () => {
    if (studentUSN && !teamMembers.includes(studentUSN)) {
      setTeamMembers([...teamMembers, studentUSN]);
      setStudentUSN("");
    }
  };

  const removeMember = (usn: string) => {
    setTeamMembers(teamMembers.filter(member => member !== usn));
  };

  const validateTeamMembers = () => {
    if (!selectedClass) {
      toast({
        title: "Error",
        description: "Class not found",
        variant: "destructive",
      });
      return { valid: false };
    }

    // Check if any member is not in the class
    const invalidMembers = teamMembers.filter(
      member => !selectedClass.students.includes(member)
    );
    if (invalidMembers.length > 0) {
      toast({
        title: "Invalid Members",
        description: `The following members are not in this class: ${invalidMembers.join(", ")}`,
        variant: "destructive",
      });
      return { valid: false };
    }

    // Check if any member is already in another team
    const duplicateMembers = teamMembers.filter(member => 
      existingTeams.some(team => team.members.includes(member))
    );
    if (duplicateMembers.length > 0) {
      toast({
        title: "Duplicate Members",
        description: `The following members are already in other teams: ${duplicateMembers.join(", ")}`,
        variant: "destructive",
      });
      return { valid: false };
    }

    return { valid: true };
  };

  const createTeam = async () => {
    if (!selectedClass || !selectedProject || !teamName || !teamMembers.length) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    // Validate team members
    const validation = validateTeamMembers();
    if (!validation.valid) {
      return; // Toast is already shown in validateTeamMembers
    }

    try {
      const team = await teamAPI.create({
        name: teamName,
        description: `Team for ${selectedProject.title}`,
        class: selectedClass._id,
        members: teamMembers
      });

      toast({
        title: "Success",
        description: "Team created successfully!",
      });

      // Update existing teams list
      setExistingTeams(prev => [...prev, team]);
      setTeamName("");
      setTeamMembers([]);
    } catch (error: any) {
      console.error('Error creating team:', error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to create team",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 p-6">
      <Toaster />
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Team Formation</h1>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p>Loading project details...</p>
          </div>
        ) : (
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                <Users className="h-6 w-6" />
                Team Formation
              </CardTitle>
              <CardDescription>
                Create your team for: <strong>{selectedProject?.title}</strong>
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
                <li>• USN must be in the format: 1MS22CS001</li>
                <li>• Maximum team size: {selectedProject?.teamSize || 2} members</li>
              </ul>

              <Button
                onClick={createTeam}
                disabled={!teamName || teamMembers.length === 0 || teamMembers.length > (selectedProject?.teamSize || 2)}
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
