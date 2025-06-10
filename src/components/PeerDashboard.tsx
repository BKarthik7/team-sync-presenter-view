import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { projectAPI, teamAPI, evaluationFormAPI } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Clock, Users, Star, Send } from 'lucide-react';
import { pusher, CHANNELS, EVENTS } from '../lib/pusher';
import { TeamStatus } from '@/lib/api';
import { toast } from './ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';

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

interface FormField {
  type: 'rating' | 'text';
  label: string;
  required: boolean;
}

interface EvaluationForm {
  _id: string;
  title: string;
  description: string;
  fields: FormField[];
  evaluationTime: number;
}

const PeerDashboard = () => {
  const { user, logout } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [presentationTimer, setPresentationTimer] = useState(0);
  const [currentlyPresenting, setCurrentlyPresenting] = useState<Team | null>(null);
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [isEvaluationEnabled, setIsEvaluationEnabled] = useState(false);
  const [evaluationForm, setEvaluationForm] = useState<EvaluationForm | null>(null);
  const [evaluationResponses, setEvaluationResponses] = useState<Record<string, string | number>>({});
  const [evaluationTimer, setEvaluationTimer] = useState(0);
  const [isEvaluationTimerRunning, setIsEvaluationTimerRunning] = useState(false);
  const [isEvaluationModalOpen, setIsEvaluationModalOpen] = useState(false);

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

  useEffect(() => {
    const projectId = localStorage.getItem('selectedProjectId');
    if (!projectId) {
      console.error('No project ID found for Pusher subscription');
      return;
    }

    console.log('Subscribing to Pusher channels for project:', projectId);

    // Subscribe to presentation channel
    const presentationChannel = pusher.subscribe(CHANNELS.PRESENTATION(projectId));

    console.log('Subscribed to channels:', {
      presentation: CHANNELS.PRESENTATION(projectId),
    });

    // Handle timer updates
    presentationChannel.bind(EVENTS.TIMER_UPDATE, (data: { timer: number; team: Team }) => {
      console.log('Received timer update:', data);
      setPresentationTimer(data.timer);
      if (data.team) {
        setCurrentlyPresenting(data.team);
      }
    });

    // Handle presentation start
    presentationChannel.bind(EVENTS.PRESENTATION_START, (data: { team: Team; timer: number }) => {
      console.log('Received presentation start:', data);
      setCurrentlyPresenting(data.team);
      setPresentationTimer(data.timer);
      setShowEvaluation(false);
      setIsEvaluationEnabled(false);
    });

    // Handle current team update
    presentationChannel.bind(EVENTS.CURRENT_TEAM_UPDATE, (data: { team: Team }) => {
      console.log('Received current team update:', data);
      setCurrentlyPresenting(data.team);
    });

    // Handle presentation end (previously team status update)
    presentationChannel.bind(EVENTS.PRESENTATION_END, (data: any) => {
      console.log('Received presentation end event:', data);
      setCurrentlyPresenting(null);
      setShowEvaluation(false);
      setIsEvaluationEnabled(false);
      setIsEvaluationModalOpen(false);
      setEvaluationTimer(0);
      setIsEvaluationTimerRunning(false);
    });

    // Handle evaluation form updates
    presentationChannel.bind(EVENTS.EVALUATION_FORM_UPDATE, (data: EvaluationForm) => {
      console.log('Received evaluation form update:', data);
      if (!data || !data.fields) {
        console.error('Invalid form data received:', data);
        return;
      }
      console.log('Setting evaluation form state...');
      setEvaluationForm(data);
      // Initialize evaluation state with empty values
      const initialEvaluation: Record<string, string> = {};
      data.fields.forEach(field => {
        initialEvaluation[field.label] = '';
      });
      setEvaluationResponses(initialEvaluation);
      console.log('Evaluation form state updated');
    });

    // Handle evaluation toggle
    presentationChannel.bind(EVENTS.EVALUATION_TOGGLE, (data: { enabled: boolean; form?: EvaluationForm; timeLimit?: number }) => {
      console.log('Received evaluation toggle event:', data);

      if (data.form) {
        console.log('Using form from toggle event:', data.form.title);
        setEvaluationForm(data.form);
        const initialResponses: Record<string, string> = {};
        data.form.fields.forEach(field => {
          initialResponses[field.label] = '';
        });
        setEvaluationResponses(initialResponses);
      }

      if (data.enabled) {
        if (data.timeLimit && data.timeLimit > 0) {
          console.log('Starting evaluation with time limit:', data.timeLimit);
          setEvaluationTimer(data.timeLimit);
          setIsEvaluationTimerRunning(true);
        }
        setIsEvaluationEnabled(true);
        setShowEvaluation(true);
        setIsEvaluationModalOpen(true);
        console.log('Evaluation enabled successfully');
      } else {
        console.log('Evaluation disabled');
        setIsEvaluationTimerRunning(false);
        setIsEvaluationEnabled(false);
        setIsEvaluationModalOpen(false);
        setShowEvaluation(false);
        console.log('Evaluation disabled successfully');
      }
    });

    // Add subscription success logging
    presentationChannel.bind('subscription_succeeded', () => {
      console.log('Successfully subscribed to presentation channel');
    });

    presentationChannel.bind('subscription_error', (error: any) => {
      console.error('Error subscribing to presentation channel:', error);
    });

    return () => {
      console.log('Cleaning up Pusher subscriptions');
      presentationChannel.unbind_all();
      pusher.unsubscribe(CHANNELS.PRESENTATION(projectId));
    };
  }, [user]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isEvaluationTimerRunning && evaluationTimer > 0) {
      interval = setInterval(() => {
        setEvaluationTimer(prev => {
          if (prev <= 1) {
            setIsEvaluationTimerRunning(false);
            setIsEvaluationModalOpen(false);
            setShowEvaluation(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isEvaluationTimerRunning, evaluationTimer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEvaluationResponse = (fieldId: string, value: string | number) => {
    setEvaluationResponses(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const submitEvaluation = async () => {
    // Check if all required fields are filled
    const missingFields = evaluationForm?.fields
      .filter(field => field.required && !evaluationResponses[field.label])
      .map(field => field.label);

    if (missingFields && missingFields.length > 0) {
      toast({
        title: "Error",
        description: `Please fill in all required fields: ${missingFields.join(', ')}`,
        variant: "destructive",
      });
      return;
    }

    try {
      const projectId = localStorage.getItem('selectedProjectId');
      if (!projectId || !evaluationForm || !currentlyPresenting) {
        toast({
          title: "Error",
          description: "Missing required information to submit evaluation",
          variant: "destructive",
        });
        return;
      }

      await evaluationFormAPI.submit(projectId, {
        responses: evaluationResponses,
        teamId: currentlyPresenting._id
      });
      
      toast({
        title: "Success",
        description: "Evaluation submitted successfully",
      });

      setIsEvaluationModalOpen(false);
      setEvaluationResponses({});
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit evaluation",
        variant: "destructive",
      });
    }
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
              <p className="text-gray-600">
                Currently Presenting: <strong>{currentlyPresenting?.name || 'None'}</strong>
              </p>
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
                      <strong>Status:</strong> {currentlyPresenting?._id === team._id ? 'Currently Presenting' : 'Waiting for your turn'}
                    </p>
                    {currentlyPresenting?._id === team._id && (
                      <p className="text-blue-700 text-xs mt-1">You're presenting now!</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Presentation Queue</CardTitle>
            <CardDescription>Track the current presentation and upcoming teams</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {currentlyPresenting && (
                <div className="p-4 rounded-lg border bg-green-50 border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-medium">{currentlyPresenting.name}</h5>
                      <p className="text-sm text-gray-600">Members: {currentlyPresenting.members.join(', ')}</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2 py-1 text-xs rounded bg-green-100 text-green-800">
                        Now Presenting
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {currentlyPresenting && isEvaluationEnabled && (
              <div className="mt-6 text-center">
                <Button onClick={() => setIsEvaluationModalOpen(true)} className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Evaluate Current Presentation
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isEvaluationModalOpen} onOpenChange={setIsEvaluationModalOpen}>
        <DialogContent 
          className="max-w-2xl"
          onPointerDownOutside={(e) => e.preventDefault()} 
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              <span>Evaluation Form</span>
              {isEvaluationTimerRunning && (
                <span className="text-yellow-600">
                  Time Remaining: {formatTime(evaluationTimer)}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {evaluationForm?.fields.map((field, index) => (
              <div key={`${field.label}-${index}`} className="space-y-2">
                <Label>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                {field.type === 'rating' ? (
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <Button
                        key={`${field.label}-rating-${rating}`}
                        variant={evaluationResponses[field.label] === rating ? "default" : "outline"}
                        onClick={() => handleEvaluationResponse(field.label, rating)}
                        className="w-12 h-12"
                      >
                        {rating}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <Input
                    value={evaluationResponses[field.label] as string || ''}
                    onChange={(e) => handleEvaluationResponse(field.label, e.target.value)}
                    placeholder="Enter your feedback"
                  />
                )}
              </div>
            ))}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (window.confirm('Are you sure you want to exit? All progress will be lost.')) {
                    setIsEvaluationModalOpen(false);
                  }
                }}
              >
                Exit
              </Button>
              <Button onClick={submitEvaluation}>
                Submit Evaluation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PeerDashboard;
