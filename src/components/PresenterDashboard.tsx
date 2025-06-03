import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Pause, Square, Clock, Users, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PresenterDashboard = () => {
  const [currentProject, setCurrentProject] = useState(null);
  const [presentationTimer, setPresentationTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [projectName, setProjectName] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const [projects] = useState([
    { id: 1, name: "AI in Healthcare", class: "CS-A", teams: 3, status: "active" },
    { id: 2, name: "Web Development Trends", class: "IT-B", teams: 2, status: "completed" }
  ]);

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

  const createProject = () => {
    if (!projectName || !selectedClass) {
      toast({
        title: "Error",
        description: "Please fill in all fields before creating a project.",
        variant: "destructive",
      });
      return;
    }

    console.log(`Creating project: ${projectName} for class: ${selectedClass}`);
    
    toast({
      title: "Project Created!",
      description: `Project "${projectName}" has been created for ${selectedClass}. Redirecting to team formation...`,
    });

    // Navigate to team formation page after a short delay
    setTimeout(() => {
      navigate("/team-formation");
    }, 2000);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Presenter/Controller Dashboard</h1>
          <p className="text-gray-600">Manage projects, presentations, and evaluations</p>
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
                    <Label htmlFor="project-name">Project Name</Label>
                    <Input 
                      id="project-name" 
                      placeholder="Enter project name"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="class-select">Select Class</Label>
                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a class" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cs-a">CS-A (6th Semester)</SelectItem>
                        <SelectItem value="it-b">IT-B (4th Semester)</SelectItem>
                      </SelectContent>
                    </Select>
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
                    <div key={project.id} className="p-4 bg-white rounded-lg border flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{project.name}</h4>
                        <p className="text-sm text-gray-600">Class: {project.class} • Teams: {project.teams}</p>
                        <span className={`inline-block px-2 py-1 text-xs rounded ${
                          project.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {project.status}
                        </span>
                      </div>
                      <Button variant="outline">Manage</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="presentation" className="space-y-6">
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
    </div>
  );
};

export default PresenterDashboard;
