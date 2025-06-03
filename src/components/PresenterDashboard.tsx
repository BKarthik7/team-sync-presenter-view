import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Pause, Square, Clock, Users, BarChart3, Copy, Check, Trash2, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { projectAPI, classAPI, teamAPI } from '@/lib/api';
import type { Project } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";

interface Class {
  _id: string;
  name: string;
  semester: string;
  students: string[];
}

interface Team {
  _id: string;
  name: string;
  members: string[];
  project: string;
  class: string;
}

const PresenterDashboard = () => {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [presentationTimer, setPresentationTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectTeamSize, setProjectTeamSize] = useState(2);
  const [selectedClass, setSelectedClass] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const [projects, setProjects] = useState<Project[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedProjectTeams, setSelectedProjectTeams] = useState<Team[]>([]);
  const [isTeamsModalOpen, setIsTeamsModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await projectAPI.getProjects();
        setProjects(response);
      } catch (error) {
        console.error('Error fetching projects:', error);
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

    fetchProjects();
    fetchClasses();
  }, []);

  const [teams] = useState([
    { id: 1, name: "Team Alpha", members: ["1RV21CS001", "1RV21CS002"], project: "AI in Healthcare" },
    { id: 2, name: "Team Beta", members: ["1RV21CS003", "1RV21CS004"], project: "AI in Healthcare" },
    { id: 3, name: "Team Gamma", members: ["1RV21CS005", "1RV21CS006"], project: "AI in Healthcare" }
  ]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const createProject = async () => {
    if (!projectTitle || !projectDescription || !projectTeamSize || !selectedClass) {
      toast({
        title: "Error",
        description: "Please fill in all fields before creating a project.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Find the class object to get its ID
      const classObj = classes.find(c => c.name === selectedClass);
      if (!classObj) {
        toast({
          title: "Error",
          description: "Selected class not found",
          variant: "destructive",
        });
        return;
      }

      const project = await projectAPI.createProject({
        title: projectTitle,
        description: projectDescription,
        teamSize: projectTeamSize,
        class: classObj._id, // Store the class ID instead of name
        status: 'active'
      });

      setProjects(prev => [...prev, project]);
      toast({
        title: "Project Created!",
        description: `Project "${projectTitle}" has been created for ${selectedClass}. Redirecting to team formation...`,
      });

      // Navigate to team formation with project and class IDs
      navigate(`/team-formation?projectId=${project._id}&classId=${classObj._id}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create project",
        variant: "destructive",
      });
    }
  };

  const startPresentation = () => {
    setIsTimerRunning(true);
    console.log(`Starting presentation for ${selectedTeam}`);
  };

  const pausePresentation = () => {
    setIsTimerRunning(false);
    console.log("Presentation paused");
  };

  const endPresentation = () => {
    setIsTimerRunning(false);
    setPresentationTimer(0);
    console.log("Presentation ended, sending evaluation forms");
  };

  const handleManageTeams = async (project: Project) => {
    // Open modal immediately
    setSelectedProject(project);
    setIsTeamsModalOpen(true);
    
    // Then try to fetch teams
    try {
      if (!project.class) {
        toast({
          title: "Error",
          description: "Project is not associated with a class",
          variant: "destructive",
        });
        return;
      }
      const response = await teamAPI.getByClass(project.class);
      setSelectedProjectTeams(response);
    } catch (error) {
      console.error('Error fetching teams:', error);
      toast({
        title: "Warning",
        description: "Could not fetch teams, but you can still share the team formation link",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLink(text);
      toast({
        title: "Success",
        description: "Link copied to clipboard!",
      });
      setTimeout(() => setCopiedLink(null), 2000);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  const handleUpdateClassTeacher = async (classId: string) => {
    try {
      // Get current user's ID from localStorage or context
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user._id) {
        toast({
          title: "Error",
          description: "User information not found. Please log in again.",
          variant: "destructive",
        });
        return;
      }

      await classAPI.updateTeacher(classId, user._id);
      toast({
        title: "Success",
        description: "Class teacher updated successfully",
      });
    } catch (error: any) {
      console.error('Error updating class teacher:', error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to update class teacher",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    try {
      console.log('Attempting to delete team:', teamId);
      await teamAPI.delete(teamId);
      console.log('Team deleted successfully');
      
      // Update local state
      setSelectedProjectTeams(prevTeams => prevTeams.filter(team => team._id !== teamId));
      toast({
        title: "Success",
        description: "Team deleted successfully",
      });
    } catch (error: any) {
      console.error('Error deleting team:', error);
      const errorMessage = error.response?.data?.error || 'Failed to delete team';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    // Clear user data from localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    
    // Show success message
    toast({
      title: "Logged out successfully",
      description: "You have been logged out of your account.",
    });
    
    // Redirect to login page
    navigate('/login');
  };

  const getClassName = (classId: string) => {
    const foundClass = classes.find(c => c._id === classId);
    return foundClass ? foundClass.name : 'Unknown Class';
  };

  const handleStatusToggle = async (projectId: string, currentStatus: string) => {
    try {
      setIsUpdatingStatus(true);
      const newStatus = currentStatus === 'active' ? 'archived' : 'active';
      await projectAPI.updateStatus(projectId, newStatus);
      
      // Update local state
      setProjects(prevProjects => 
        prevProjects.map(p => 
          p._id === projectId ? { ...p, status: newStatus } : p
        )
      );
      
      if (selectedProject?._id === projectId) {
        setSelectedProject(prev => prev ? { ...prev, status: newStatus } : null);
      }

      toast({
        title: "Success",
        description: `Project ${newStatus === 'active' ? 'activated' : 'archived'} successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to update project status",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Presenter/Controller Dashboard</h1>
            <p className="text-gray-600">Manage projects, presentations, and evaluations</p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>

        <Tabs defaultValue="projects" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="presentation">Live Presentation</TabsTrigger>
            <TabsTrigger value="evaluations">Evaluations</TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create New Project</CardTitle>
                <CardDescription>Set up a new presentation project for your class</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="project-title">Project Title</Label>
                    <Input 
                      id="project-title" 
                      placeholder="Enter project title"
                      value={projectTitle}
                      onChange={(e) => setProjectTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="class-select">Select Class</Label>
                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((cls) => (
                          <SelectItem key={cls._id} value={cls.name}>
                            {cls.name} ({cls.semester})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="project-description">Project Description</Label>
                    <Input 
                      id="project-description" 
                      placeholder="Enter project description"
                      value={projectDescription}
                      onChange={(e) => setProjectDescription(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="team-size">Maximum Team Size</Label>
                    <Input 
                      id="team-size" 
                      type="number"
                      min="1"
                      placeholder="Enter maximum team size"
                      value={projectTeamSize || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '') {
                          setProjectTeamSize(0);
                        } else {
                          const numValue = parseInt(value);
                          if (!isNaN(numValue)) {
                            setProjectTeamSize(numValue);
                          }
                        }
                      }}
                    />
                  </div>
                </div>
                <Button onClick={createProject} className="w-full">
                  Create Project & Send Team Formation Link
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {projects.map((project) => (
                    <div key={project._id} className="p-4 bg-white rounded-lg border flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{project.title}</h4>
                        <p className="text-sm text-gray-600">Class: {getClassName(project.class)}</p>
                        <span className={`inline-block px-2 py-1 text-xs rounded ${
                          project.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {project.status}
                        </span>
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={() => handleManageTeams(project)}
                      >
                        Manage
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="presentation" className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <Select value={selectedProject?.title} onValueChange={(value) => {
                const project = projects.find(p => p.title === value);
                setSelectedProject(project);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.title} value={project.title}>
                      {project.title} ({project.class})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Presentation Timer
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <div className="text-6xl font-mono font-bold text-gray-800">
                    {formatTime(presentationTimer)}
                  </div>
                  <div className="flex gap-2 justify-center">
                    <Button 
                      onClick={startPresentation} 
                      disabled={isTimerRunning}
                      className="flex items-center gap-2"
                    >
                      <Play className="h-4 w-4" />
                      Start
                    </Button>
                    <Button 
                      onClick={pausePresentation} 
                      disabled={!isTimerRunning}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Pause className="h-4 w-4" />
                      Pause
                    </Button>
                    <Button 
                      onClick={endPresentation}
                      variant="destructive"
                      className="flex items-center gap-2"
                    >
                      <Square className="h-4 w-4" />
                      End & Evaluate
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Team Selection
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="team-select">Select Presenting Team</Label>
                    <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a team" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.name}>
                            {team.name} ({team.members.length} members)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {selectedTeam && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <h5 className="font-medium text-blue-900">Selected Team: {selectedTeam}</h5>
                      <p className="text-sm text-blue-700">
                        Members: {teams.find(t => t.name === selectedTeam)?.members.join(", ")}
                      </p>
                    </div>
                  )}

                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Status:</strong> {isTimerRunning ? "Presentation in progress" : "Ready to start"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Teams Queue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {teams.map((team, index) => (
                    <div key={team.id} className={`p-3 rounded-lg border ${
                      team.name === selectedTeam ? 'bg-blue-50 border-blue-200' : 'bg-white'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium">{team.name}</h5>
                          <p className="text-sm text-gray-600">Members: {team.members.join(", ")}</p>
                        </div>
                        <span className="text-sm text-gray-500">#{index + 1}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="evaluations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Evaluation Results
                </CardTitle>
                <CardDescription>View peer feedback and ratings for each team</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teams.map((team) => (
                    <div key={team.id} className="p-4 bg-white rounded-lg border">
                      <h5 className="font-semibold mb-2">{team.name}</h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                          <p className="text-2xl font-bold text-blue-600">4.2</p>
                          <p className="text-sm text-gray-600">Content Quality</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-green-600">4.5</p>
                          <p className="text-sm text-gray-600">Presentation</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-purple-600">4.0</p>
                          <p className="text-sm text-gray-600">Innovation</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-orange-600">4.3</p>
                          <p className="text-sm text-gray-600">Overall</p>
                        </div>
                      </div>
                      <Button variant="outline" className="w-full mt-3">
                        View Detailed Feedback
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isTeamsModalOpen} onOpenChange={setIsTeamsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Project Teams</DialogTitle>
            <DialogDescription>
              Share the team formation link and view existing teams
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-semibold">Project Status</h4>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={selectedProject?.status === 'active'}
                    onCheckedChange={() => selectedProject && handleStatusToggle(selectedProject._id, selectedProject.status)}
                    disabled={isUpdatingStatus}
                  />
                  <span className="text-sm text-gray-600">
                    {selectedProject?.status === 'active' ? 'Active' : 'Archived'}
                  </span>
                </div>
              </div>
              <h4 className="font-semibold mb-2">Team Formation Link</h4>
              <p className="text-sm text-blue-600 mb-3">
                Share this link with students to let them form teams for this project
              </p>
              <div className="flex gap-2">
                <Input 
                  readOnly 
                  value={selectedProject ? `${window.location.origin}/team-formation?projectId=${selectedProject._id}&classId=${selectedProject.class}` : ''}
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    if (selectedProject) {
                      copyToClipboard(`${window.location.origin}/team-formation?projectId=${selectedProject._id}&classId=${selectedProject.class}`);
                    }
                  }}
                >
                  {selectedProject && copiedLink === `${window.location.origin}/team-formation?projectId=${selectedProject._id}&classId=${selectedProject.class}` ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Existing Teams</h4>
                <span className="text-sm text-gray-500">
                  {selectedProjectTeams.length} team{selectedProjectTeams.length !== 1 ? 's' : ''}
                </span>
              </div>

              {selectedProjectTeams.length === 0 ? (
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-gray-500">No teams have been formed yet</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Share the team formation link above to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedProjectTeams.map((team) => (
                    <div key={team._id} className="p-3 bg-white rounded-lg border">
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-medium">{team.name}</h5>
                          <p className="text-sm text-gray-600">
                            Members: {team.members.join(", ")}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setTeamToDelete(team)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!teamToDelete} onOpenChange={() => setTeamToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the team "{teamToDelete?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (teamToDelete) {
                  handleDeleteTeam(teamToDelete._id);
                  setTeamToDelete(null);
                }
              }}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete Team
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PresenterDashboard;
