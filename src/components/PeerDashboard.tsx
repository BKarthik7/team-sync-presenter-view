import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { projectAPI, teamAPI } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Clock, Users, Star, Send } from 'lucide-react';

interface Project {
  _id: string;
  title: string;
  description: string;
  teamSize: number;
  status: 'active' | 'completed' | 'archived';
}

interface Team {
  _id: string;
  name: string;
  members: string[];
  project: string;
}

export default function PeerDashboard() {
  const { user, logout } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [presentationTimer] = useState(435); // 7:15 in seconds
  const [currentlyPresenting] = useState("Team Beta");
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [evaluation, setEvaluation] = useState({
    contentQuality: "",
    presentationSkills: "",
    innovation: "",
    teamwork: "",
    feedback: ""
  });

  useEffect(() => {
    const fetchProjectAndTeam = async () => {
      try {
        const projectId = localStorage.getItem('selectedProjectId');
        if (!projectId) {
          setError('No project selected');
          return;
        }

        // Fetch project details
        const projectResponse = await projectAPI.getProject(projectId);
        setProject(projectResponse);

        // Fetch team details
        const teamsResponse = await teamAPI.getByProject(projectId);
        const userTeam = teamsResponse.find((t: Team) => 
          t.members.includes(user?.usn || '')
        );
        setTeam(userTeam || null);
      } catch (err) {
        setError('Failed to fetch project and team details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectAndTeam();
  }, [user]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const submitEvaluation = () => {
    console.log("Submitting evaluation:", evaluation);
    setShowEvaluation(false);
    // Reset form
    setEvaluation({
      contentQuality: "",
      presentationSkills: "",
      innovation: "",
      teamwork: "",
      feedback: ""
    });
  };

  const startEvaluation = () => {
    setShowEvaluation(true);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Peer Dashboard</h1>
            <p className="text-gray-600">Welcome, {user?.usn}</p>
          </div>
          <Button onClick={logout} variant="destructive">Logout</Button>
        </div>

        {project && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>{project.title}</CardTitle>
              <CardDescription>Project Details</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-2">{project.description}</p>
              <p className="text-sm text-gray-500">Status: {project.status}</p>
              <p className="text-sm text-gray-500">Team Size: {project.teamSize}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Live Presentation Timer
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-4xl font-mono font-bold text-gray-800 mb-2">
                {formatTime(presentationTimer)}
              </div>
              <p className="text-gray-600">Currently Presenting: <strong>{currentlyPresenting}</strong></p>
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <p className="text-green-800 text-sm">✓ Timer synced with presenter</p>
              </div>
            </CardContent>
          </Card>

          {team && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Your Team Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h5 className="font-medium">Team: {team.name}</h5>
                    <p className="text-sm text-gray-600">Members: {team.members.join(', ')}</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-blue-800 text-sm">
                      <strong>Status:</strong> Waiting for your turn
                    </p>
                    <p className="text-blue-700 text-xs mt-1">You're next in queue!</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {!showEvaluation ? (
          <Card>
            <CardHeader>
              <CardTitle>Presentation Queue</CardTitle>
              <CardDescription>Track the current presentation and upcoming teams</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: "Team Beta", status: "presenting", members: "1RV21CS003, 1RV21CS004" },
                  { name: "Team Alpha", status: "next", members: "1RV21CS001, 1RV21CS002" },
                  { name: "Team Gamma", status: "waiting", members: "1RV21CS005, 1RV21CS006" }
                ].map((team, index) => (
                  <div key={team.name} className={`p-4 rounded-lg border ${
                    team.status === 'presenting' ? 'bg-green-50 border-green-200' :
                    team.status === 'next' ? 'bg-blue-50 border-blue-200' :
                    'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium">{team.name}</h5>
                        <p className="text-sm text-gray-600">Members: {team.members}</p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2 py-1 text-xs rounded ${
                          team.status === 'presenting' ? 'bg-green-100 text-green-800' :
                          team.status === 'next' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {team.status === 'presenting' ? 'Now Presenting' :
                           team.status === 'next' ? 'Up Next' : 'Waiting'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 text-center">
                <Button onClick={startEvaluation} className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Evaluate Current Presentation
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Evaluate {currentlyPresenting}
              </CardTitle>
              <CardDescription>Provide your peer evaluation for the current presentation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Content Quality</Label>
                  <RadioGroup 
                    value={evaluation.contentQuality} 
                    onValueChange={(value) => setEvaluation({...evaluation, contentQuality: value})}
                    className="flex gap-4 mt-2"
                  >
                    {[1,2,3,4,5].map((rating) => (
                      <div key={rating} className="flex items-center space-x-2">
                        <RadioGroupItem value={rating.toString()} id={`content-${rating}`} />
                        <Label htmlFor={`content-${rating}`}>{rating}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div>
                  <Label className="text-base font-medium">Presentation Skills</Label>
                  <RadioGroup 
                    value={evaluation.presentationSkills} 
                    onValueChange={(value) => setEvaluation({...evaluation, presentationSkills: value})}
                    className="flex gap-4 mt-2"
                  >
                    {[1,2,3,4,5].map((rating) => (
                      <div key={rating} className="flex items-center space-x-2">
                        <RadioGroupItem value={rating.toString()} id={`presentation-${rating}`} />
                        <Label htmlFor={`presentation-${rating}`}>{rating}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div>
                  <Label className="text-base font-medium">Innovation & Creativity</Label>
                  <RadioGroup 
                    value={evaluation.innovation} 
                    onValueChange={(value) => setEvaluation({...evaluation, innovation: value})}
                    className="flex gap-4 mt-2"
                  >
                    {[1,2,3,4,5].map((rating) => (
                      <div key={rating} className="flex items-center space-x-2">
                        <RadioGroupItem value={rating.toString()} id={`innovation-${rating}`} />
                        <Label htmlFor={`innovation-${rating}`}>{rating}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div>
                  <Label className="text-base font-medium">Teamwork</Label>
                  <RadioGroup 
                    value={evaluation.teamwork} 
                    onValueChange={(value) => setEvaluation({...evaluation, teamwork: value})}
                    className="flex gap-4 mt-2"
                  >
                    {[1,2,3,4,5].map((rating) => (
                      <div key={rating} className="flex items-center space-x-2">
                        <RadioGroupItem value={rating.toString()} id={`teamwork-${rating}`} />
                        <Label htmlFor={`teamwork-${rating}`}>{rating}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div>
                  <Label htmlFor="feedback" className="text-base font-medium">Written Feedback (Optional)</Label>
                  <Textarea
                    id="feedback"
                    value={evaluation.feedback}
                    onChange={(e) => setEvaluation({...evaluation, feedback: e.target.value})}
                    placeholder="Provide constructive feedback for the presenting team..."
                    className="mt-2"
                    rows={4}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={submitEvaluation} className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Submit Evaluation
                </Button>
                <Button variant="outline" onClick={() => setShowEvaluation(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
