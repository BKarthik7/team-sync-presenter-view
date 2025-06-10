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
import { projectAPI, classAPI, teamAPI, evaluationFormAPI } from '@/lib/api';
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useAuth } from '../hooks/useAuth';
import { pusher, CHANNELS, EVENTS } from '../lib/pusher';
import { TeamStatus } from '@/lib/api';
import axios from 'axios';

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

interface EvaluationForm {
  _id: string;
  title: string;
  description: string;
  fields: {
    type: 'rating' | 'text';
    label: string;
    required: boolean;
  }[];
  evaluationTime: number; // Time in seconds
}

interface FieldAverage {
  average: number;
  count: number;
}

interface TeamEvaluationResult {
  teamId: string;
  teamName: string;
  averageRatings: Record<string, FieldAverage>; // Keyed by field label
  overallTeamAverage?: number;
}

type AggregatedResults = TeamEvaluationResult[];

// Add interface for evaluation response
interface EvaluationResponse {
  _id: string;
  form: string;
  project: string;
  team: {
    _id: string;
    name: string;
  };
  submittedBy: {
    _id: string;
    name: string;
  };
  responses: Record<string, any>;
  createdAt: string;
  updatedAt: string;
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
  const { user } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedProjectTeams, setSelectedProjectTeams] = useState<Team[]>([]);
  const [isTeamsModalOpen, setIsTeamsModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Add new state for active projects
  const [activeProjects, setActiveProjects] = useState<Project[]>([]);
  const [projectTeams, setProjectTeams] = useState<Team[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);

  const [teams, setTeams] = useState<Team[]>([]);
  const [finishedTeams, setFinishedTeams] = useState<Team[]>([]);
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [timer, setTimer] = useState(0);
  const [isEvaluationEnabled, setIsEvaluationEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [evaluationForm, setEvaluationForm] = useState<EvaluationForm | null>(null);
  const [evaluationTime, setEvaluationTime] = useState(60); // Default 60 seconds
  const [isCreatingForm, setIsCreatingForm] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formFields, setFormFields] = useState<{
    type: 'rating' | 'text';
    label: string;
    required: boolean;
  }[]>([]);

  // Evaluation Results State
  const [aggregatedResults, setAggregatedResults] = useState<AggregatedResults | null>(null);
  const [isLoadingResults, setIsLoadingResults] = useState(false);

  // Add new state for evaluation timer
  const [evaluationTimer, setEvaluationTimer] = useState(0);
  const [isEvaluationTimerRunning, setIsEvaluationTimerRunning] = useState(false);

  // Update state type
  const [evaluationResponses, setEvaluationResponses] = useState<EvaluationResponse[]>([]);
  const [isLoadingResponses, setIsLoadingResponses] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await projectAPI.getProjects();
        setProjects(response);
        // Filter active projects
        setActiveProjects(response.filter(project => project.status === 'active'));
        
        // Check if there's a stored project
        const storedProjectId = localStorage.getItem('selectedProjectId');
        if (storedProjectId) {
          const storedProject = response.find(p => p._id === storedProjectId);
          if (storedProject) {
            setSelectedProject(storedProject);
            // Fetch teams for stored project
            const teams = await teamAPI.getByProject(storedProjectId);
            setProjectTeams(teams);
            // Fetch evaluation form
            try {
              const formResponse = await evaluationFormAPI.getByProject(storedProjectId);
              if (formResponse && formResponse.data) {
                const formData = formResponse.data;
                setEvaluationForm(formData);
                setFormTitle(formData.title);
                setFormDescription(formData.description);
                setFormFields(formData.fields);
                setEvaluationTime(formData.evaluationTime);
              }
            } catch (error) {
              console.error('Error fetching evaluation form:', error);
            }
            // Fetch initial responses
            try {
              const responses = await axios.get<EvaluationResponse[]>(
                `http://localhost:3001/api/evaluations/project/${storedProjectId}`,
                {
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                  }
                }
              );
              setEvaluationResponses(responses.data);
            } catch (error) {
              console.error('Error fetching evaluation responses:', error);
            }
          }
        }
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

  useEffect(() => {
    const projectId = localStorage.getItem('selectedProjectId');
    if (!projectId) return;

    const presentationChannel = pusher.subscribe(CHANNELS.PRESENTATION(projectId));
    
    // Listen for new evaluation responses
    presentationChannel.bind(EVENTS.EVALUATION_SUBMITTED, async () => {
      try {
        const responses = await axios.get<EvaluationResponse[]>(
          `http://localhost:3001/api/evaluations/project/${projectId}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        setEvaluationResponses(responses.data);
      } catch (error) {
        console.error('Error fetching updated responses:', error);
      }
    });

    return () => {
      presentationChannel.unbind_all();
      pusher.unsubscribe(CHANNELS.PRESENTATION(projectId));
    };
  }, []);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const classes = await classAPI.getClasses();
        setClasses(classes);
      } catch (error) {
        console.error('Error fetching classes:', error);
      }
    };

    fetchClasses();
  }, []);

  useEffect(() => {
    const projectId = localStorage.getItem('selectedProjectId');
    if (!projectId) return;

    // Subscribe to presentation channel
    const presentationChannel = pusher.subscribe(CHANNELS.PRESENTATION(projectId));
    const queueChannel = pusher.subscribe(CHANNELS.QUEUE(projectId));

    // Handle timer updates
    presentationChannel.bind(EVENTS.TIMER_UPDATE, (data: { timer: number, projectId: string }) => {
      if (data.projectId !== projectId) {
        console.log('Ignoring event for different project:', data.projectId);
        return;
      }
      setTimer(data.timer);
    });

    // Handle evaluation toggle
    presentationChannel.bind(EVENTS.EVALUATION_TOGGLE, (data: { enabled: boolean, projectId: string }) => {
      if (data.projectId !== projectId) {
        console.log('Ignoring event for different project:', data.projectId);
        return;
      }
      setIsEvaluationEnabled(data.enabled);
    });

    return () => {
      presentationChannel.unbind_all();
      queueChannel.unbind_all();
      pusher.unsubscribe(CHANNELS.PRESENTATION(projectId));
      pusher.unsubscribe(CHANNELS.QUEUE(projectId));
    };
  }, []);

  // Add new useEffect for evaluation timer
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isTimerRunning && currentTeam) {  // Only run if we have a current team
      interval = setInterval(() => {
        setTimer(prev => {
          const newTimer = prev + 1;
          
          const projectId = localStorage.getItem('selectedProjectId');
          if (projectId) {
            // Send both timer and current team info in one request
            fetch(`http://localhost:3001/api/presentations/${projectId}/timer`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify({ 
                timer: newTimer,
                team: currentTeam,  // Send the complete team object
                projectId: projectId // Add projectId to the payload
              })
            }).catch(error => {
              console.error('Failed to update timer and team:', error);
            });
          }

          return newTimer;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isTimerRunning, currentTeam]);

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

  const startPresentation = (team: Team) => {
    console.log('Starting presentation for team:', team);
    
    // Find the complete team data
    const selectedTeamData = projectTeams.find(t => t._id === team._id);
    if (!selectedTeamData) {
      console.error('Selected team data not found');
      return;
    }

    // Set the current team first
    setCurrentTeam(selectedTeamData);
    
    // Then start the timer and other states
    setIsTimerRunning(true);
    setIsEvaluationEnabled(false);
    setTimer(0);

    const projectId = localStorage.getItem('selectedProjectId');
    if (!projectId) {
      console.error('No project ID found');
      return;
    }

    // Notify peers about presentation start using the API
    fetch(`http://localhost:3001/api/presentations/${projectId}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ 
        team: selectedTeamData,
        timer: 0,
        projectId: projectId // Add projectId to the payload
      })
    }).catch(error => {
      console.error('Failed to start presentation:', error);
    });

    // Update queue
    const updatedTeams = teams.filter(t => t._id !== team._id);
    setTeams(updatedTeams);
    fetch(`http://localhost:3001/api/presentations/${projectId}/queue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ 
        teams: updatedTeams,
        projectId: projectId // Add projectId to the payload
      })
    }).catch(error => {
      console.error('Failed to update queue:', error);
    });
  };

  const endPresentation = () => {
    setIsTimerRunning(false);
    setIsEvaluationEnabled(false);
    setCurrentTeam(null);

    const projectId = localStorage.getItem('selectedProjectId');
    if (!projectId) return;

    // Notify peers about presentation end using the API
    fetch(`http://localhost:3001/api/presentations/${projectId}/end`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ projectId: projectId }) // Add projectId to the payload
    }).catch(error => {
      console.error('Failed to end presentation:', error);
    });
  };

  const toggleEvaluation = () => {
    const newState = !isEvaluationEnabled;
    setIsEvaluationEnabled(newState);

    const projectId = localStorage.getItem('selectedProjectId');
    if (!projectId) return;

    // Notify peers about evaluation toggle using the API
    fetch(`http://localhost:3001/api/presentations/${projectId}/evaluation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ 
        enabled: newState,
        projectId: projectId // Add projectId to the payload
      })
    }).catch(error => {
      console.error('Failed to toggle evaluation:', error);
    });
  };

  const handleManageTeams = async (project: Project) => {
    // Open modal immediately
    setSelectedProject(project);
    setIsTeamsModalOpen(true);
    
    // Then try to fetch teams
    try {
      if (!project._id) {
        toast({
          title: "Error",
          description: "Project ID not found",
          variant: "destructive",
        });
        return;
      }
      const response = await teamAPI.getByProject(project._id);
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
      await projectAPI.updateStatus(projectId, newStatus as 'active' | 'completed' | 'archived');
      
      // Update local state
      setProjects(prevProjects => 
        prevProjects.map(p => 
          p._id === projectId ? { ...p, status: newStatus as 'active' | 'completed' | 'archived' } : p
        )
      );
      
      if (selectedProject?._id === projectId) {
        setSelectedProject(prev => prev ? { ...prev, status: newStatus as 'active' | 'completed' | 'archived' } : null);
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

  // Add tab change handler
  const handleTabChange = (value: string) => {
    if (value === 'presentation') {
      // Refresh projects when switching to presentation tab
      const fetchProjects = async () => {
        try {
          const response = await projectAPI.getProjects();
          setProjects(response);
          setActiveProjects(response.filter(project => project.status === 'active'));
        } catch (error) {
          console.error('Error fetching projects:', error);
        }
      };
      fetchProjects();
    }
  };

  // Update function to fetch teams for a project
  const fetchProjectTeams = async (projectId: string) => {
    try {
      setIsLoadingTeams(true);
      const teams = await teamAPI.getByProject(projectId);
      setProjectTeams(teams);
    } catch (error) {
      console.error('Error fetching teams:', error);
      toast({
        title: "Error",
        description: "Failed to fetch teams",
        variant: "destructive",
      });
    } finally {
      setIsLoadingTeams(false);
    }
  };

  const handleProjectSelect = async (projectTitle: string) => {
    setLoading(true);
    setError('');
    
    const project = activeProjects.find(p => p.title === projectTitle);
    if (project) {
      setSelectedProject(project);
      localStorage.setItem('selectedProjectId', project._id);
      try {
        const teams = await teamAPI.getByProject(project._id);
        setProjectTeams(teams);
        
        // Fetch evaluation form
        try {
          const formResponse = await evaluationFormAPI.getByProject(project._id);
          if (formResponse && formResponse.data) {
            const formData = formResponse.data;
            setEvaluationForm(formData);
            setFormTitle(formData.title);
            setFormDescription(formData.description);
            setFormFields(formData.fields);
            setEvaluationTime(formData.evaluationTime);
          } else {
            // Reset form state if no form exists
            setEvaluationForm(null);
            setFormTitle('');
            setFormDescription('');
            setFormFields([]);
            setEvaluationTime(60);
          }
        } catch (error) {
          console.error('Error fetching evaluation form:', error);
          setEvaluationForm(null);
          setFormTitle('');
          setFormDescription('');
          setFormFields([]);
          setEvaluationTime(60);
        }

        // Fetch evaluation responses
        try {
          const responses = await axios.get<EvaluationResponse[]>(
            `http://localhost:3001/api/evaluations/project/${project._id}`,
            {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            }
          );
          setEvaluationResponses(responses.data);
        } catch (error) {
          console.error('Error fetching evaluation responses:', error);
          setEvaluationResponses([]);
        }
      } catch (error) {
        console.error('Error fetching teams:', error);
        setError('Failed to fetch teams');
      }
      setSelectedTeam("");
      setCurrentTeam(null);
    } else {
      setSelectedProject(null);
      localStorage.removeItem('selectedProjectId');
      setProjectTeams([]);
      setSelectedTeam("");
      setCurrentTeam(null);
      setEvaluationForm(null);
      setFormTitle('');
      setFormDescription('');
      setFormFields([]);
      setEvaluationTime(60);
      setEvaluationResponses([]);
    }
    setLoading(false);
  };

  const addFormField = (type: 'rating' | 'text') => {
    const newField: {
      type: 'rating' | 'text';
      label: string;
      required: boolean;
    } = {
      type,
      label: '',
      required: true
    };
    setFormFields([...formFields, newField]);
  };

  const removeFormField = (index: number) => {
    setFormFields(formFields.filter((_, i) => i !== index));
  };

  const updateFormField = (index: number, updates: Partial<{
    type: 'rating' | 'text';
    label: string;
    required: boolean;
  }>) => {
    setFormFields(formFields.map((field, i) => 
      i === index ? { ...field, ...updates } : field
    ));
  };

  const saveEvaluationForm = async () => {
    console.log('Saving evaluation form');
    if (!formTitle || formFields.length === 0) {
      toast({
        title: 'Error',
        description: 'Please provide a title and at least one field for the evaluation form',
        variant: 'destructive',
      });
      return;
    }
    if (!selectedProject?._id) {
      toast({
        title: 'Error',
        description: 'Please select a project from the Presentation tab before creating an evaluation form',
        variant: 'destructive',
      });
      return;
    }
    try {
      const formData = {
        title: formTitle,
        description: formDescription || 'No description provided',
        fields: formFields,
        evaluationTime,
        project: selectedProject._id,
      };
      console.log('Form data for save:', formData);
      
      let response;
      if (evaluationForm?._id) {
        // Update existing form
        response = await evaluationFormAPI.update(evaluationForm._id, formData);
      } else {
        // Create new form
        response = await evaluationFormAPI.create(formData);
      }
      
      const savedForm = response.data;
      setEvaluationForm(savedForm);
      setIsCreatingForm(false);
      toast({
        title: 'Success',
        description: `Evaluation form ${evaluationForm?._id ? 'updated' : 'created'} successfully`,
      });
    } catch (error) {
      console.error('Error saving evaluation form:', error);
      toast({
        title: 'Error',
        description: `Failed to ${evaluationForm?._id ? 'update' : 'create'} evaluation form`,
        variant: 'destructive',
      });
    }
  };

  const startEvaluation = async () => {
    if (!currentTeam) {
      toast({
        title: 'Error',
        description: 'Please select a team to present first',
        variant: 'destructive',
      });
      return;
    }

    if (!isTimerRunning) {
      toast({
        title: 'Error',
        description: 'Presentation must be running to start evaluation',
        variant: 'destructive',
      });
      return;
    }

    if (!evaluationForm || !evaluationForm._id) {
      console.error('No evaluation form available or form not saved yet.');
      toast({
        title: 'Error',
        description: 'Evaluation form is not configured or not saved. Please save the form first.',
        variant: 'destructive',
      });
      return;
    }
    
    console.log('Starting evaluation with form:', evaluationForm);

    const projectId = localStorage.getItem('selectedProjectId');
    if (!projectId) {
      console.error('No project ID found');
      toast({
        title: 'Error',
        description: 'Project context not found. Please select a project.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // 1. Ensure the form is pushed/updated on the backend.
      console.log('Pushing/activating evaluation form on backend:', evaluationForm);
      const pushResponse = await fetch(`http://localhost:3001/api/presentations/${projectId}/evaluation-form`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          form: { 
            _id: evaluationForm._id,
            title: evaluationForm.title,
            description: evaluationForm.description,
            fields: evaluationForm.fields,
            evaluationTime: evaluationForm.evaluationTime
          },
          projectId: projectId // Add projectId to the payload
        })
      });

      if (!pushResponse.ok) {
        const errorData = await pushResponse.json().catch(() => ({ message: 'Failed to push/activate evaluation form on backend' }));
        throw new Error(errorData.message || 'Failed to push/activate evaluation form on backend');
      }
      console.log('Evaluation form pushed/activated on backend successfully.');

      // 2. Client-side Pusher trigger to send the form to peers
      const channelName = CHANNELS.PRESENTATION(projectId);
      const presentationChannel = pusher.channel(channelName);

      if (presentationChannel && presentationChannel.subscribed) {
        console.log(`Triggering client event client-${EVENTS.EVALUATION_FORM_UPDATE} on channel ${channelName} with form:`, evaluationForm);
        presentationChannel.trigger(
          `client-${EVENTS.EVALUATION_FORM_UPDATE}`,
          {
            ...evaluationForm,
            projectId: projectId // Add projectId to the payload
          }
        );
        console.log(`client-${EVENTS.EVALUATION_FORM_UPDATE} triggered successfully via Pusher channel.`);
      } else {
        console.error(`Pusher channel ${channelName} not subscribed or not found. Cannot trigger client event.`);
        toast({
          title: 'Pusher Error',
          description: 'Cannot send form to peers. Communication channel is not active.',
          variant: 'destructive',
        });
        return;
      }
      
      // 3. Signal the backend to start the evaluation period
      console.log('Triggering backend to start evaluation period...');
      const toggleResponse = await fetch(`http://localhost:3001/api/presentations/${projectId}/evaluation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          enabled: true,
          timeLimit: evaluationForm.evaluationTime,
          projectId: projectId // Add projectId to the payload
        }),
      });

      if (!toggleResponse.ok) {
        const errorData = await toggleResponse.json().catch(() => ({ message: 'Failed to start evaluation period' }));
        throw new Error(errorData.message || 'Failed to start evaluation period via backend');
      }
      console.log('Backend signaled to start evaluation period successfully.');
      
      // Update local state after successful backend calls
      setIsEvaluationEnabled(true);
      setEvaluationTimer(evaluationForm.evaluationTime);
      setIsEvaluationTimerRunning(true); 

      toast({
        title: 'Success',
        description: 'Evaluation started and form pushed to peers.',
      });

    } catch (error: any) {
      console.error('Error starting evaluation:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to start evaluation. Check console for details.',
        variant: 'destructive',
      });
      setIsEvaluationEnabled(false);
      setIsEvaluationTimerRunning(false);
    }
  };

  const endEvaluation = async () => {
    setIsEvaluationEnabled(false);
    setIsEvaluationTimerRunning(false);
    setEvaluationTimer(0);

    const projectId = localStorage.getItem('selectedProjectId');
    if (!projectId) {
      console.error('No project ID found for ending evaluation');
      toast({
        title: 'Error',
        description: 'Project context not found.',
        variant: 'destructive',
      });
      return;
    }

    try {
      console.log('Ending evaluation via backend...');
      const response = await fetch(`http://localhost:3001/api/presentations/${projectId}/evaluation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          enabled: false
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to end evaluation' }));
        throw new Error(errorData.message || 'Failed to end evaluation via backend');
      }
      console.log('Evaluation ended successfully via backend.');
      if (projectId) {
        fetchEvaluationResults(projectId);
      }
      toast({
        title: 'Evaluation Ended',
        description: 'The evaluation period has been closed.',
      });
    } catch (error: any) {
      console.error('Error ending evaluation:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to end evaluation. Check console for details.',
        variant: 'destructive',
      });
    }
  };

  const fetchEvaluationResults = async (projectId: string) => {
    setIsLoadingResults(true);
    setAggregatedResults(null); // Clear previous results
    try {
      const response = await fetch(`http://localhost:3001/api/presentations/${projectId}/evaluation-results`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch evaluation results' }));
        throw new Error(errorData.message || 'Failed to fetch evaluation results');
      }
      const results: AggregatedResults = await response.json();
      setAggregatedResults(results);
    } catch (error: any) {
      console.error("Error fetching evaluation results:", error);
      toast({ title: 'Error', description: error.message || 'Could not load evaluation results.', variant: 'destructive' });
      setAggregatedResults(null);
    } finally {
      setIsLoadingResults(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

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

        <Tabs defaultValue="projects" className="space-y-6" onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="presentation">Live Presentation</TabsTrigger>
            <TabsTrigger value="evaluations">Evaluations</TabsTrigger>
            <TabsTrigger value="responses">Responses</TabsTrigger>
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
            <Card>
              <CardHeader>
                <CardTitle>Project Selection</CardTitle>
                <CardDescription>Select a project to manage presentations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <Select 
                    value={selectedProject?.title || ""} 
                    onValueChange={handleProjectSelect}
                    disabled={isTimerRunning}
                  >
                    <SelectTrigger className="w-[300px]">
                      <SelectValue placeholder="Select a project to begin" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeProjects.length === 0 ? (
                        <SelectItem value="" disabled>No active projects available</SelectItem>
                      ) : (
                        activeProjects.map((project) => (
                          <SelectItem key={project._id} value={project.title}>
                            {project.title} ({getClassName(project.class)})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {!selectedProject ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No project is currently selected</p>
                    <p className="text-sm text-muted-foreground">
                      Use the dropdown above to select an active project and start managing presentations
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
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
                            {formatTime(timer)}
                          </div>
                          <div className="flex gap-2 justify-center">
                            <Button 
                              onClick={() => setIsTimerRunning(!isTimerRunning)}
                              variant={isTimerRunning ? "destructive" : "default"}
                              disabled={!selectedProject || !selectedTeam}
                            >
                              {isTimerRunning ? "Pause Timer" : "Start Presentation"}
                            </Button>
                            <Button 
                              onClick={toggleEvaluation}
                              variant={isEvaluationEnabled ? "default" : "outline"}
                              disabled={!isTimerRunning}
                            >
                              {isEvaluationEnabled ? "Disable Evaluation" : "Enable Evaluation"}
                            </Button>
                            <Button 
                              onClick={endPresentation}
                              variant="destructive"
                              disabled={!isTimerRunning}
                            >
                              End Presentation
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
                            <Select 
                              value={selectedTeam} 
                              onValueChange={(teamId) => {
                                setSelectedTeam(teamId);
                                const selectedTeamData = projectTeams.find(t => t._id === teamId);
                                if (selectedTeamData) {
                                  setCurrentTeam(selectedTeamData);
                                }
                              }}
                              disabled={isLoadingTeams || projectTeams.length === 0 || isTimerRunning}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={projectTeams.length === 0 ? "No teams available" : "Choose a team"} />
                              </SelectTrigger>
                              <SelectContent>
                                {projectTeams.map((team) => (
                                  <SelectItem key={team._id} value={team._id}>
                                    {team.name} ({team.members.length} members)
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {selectedTeam && (
                            <div className="p-3 bg-blue-50 rounded-lg">
                              <h5 className="font-medium text-blue-900">
                                Selected Team: {projectTeams.find(t => t._id === selectedTeam)?.name}
                              </h5>
                              <p className="text-sm text-blue-700">
                                Members: {projectTeams.find(t => t._id === selectedTeam)?.members.join(", ")}
                              </p>
                            </div>
                          )}

                          <div className="p-3 bg-yellow-50 rounded-lg">
                            <p className="text-sm text-yellow-800">
                              <strong>Status:</strong> {
                                !selectedTeam ? "Please select a team" :
                                isTimerRunning ? "Presentation in progress" : "Ready to start"
                              }
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
                        {isLoadingTeams ? (
                          <div className="text-center py-4">
                            <p className="text-gray-500">Loading teams...</p>
                          </div>
                        ) : projectTeams.length === 0 ? (
                          <div className="text-center py-4">
                            <p className="text-gray-500">No teams available for this project</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {projectTeams.map((team, index) => (
                              <div 
                                key={`${team._id}-${index}`} 
                                className={`p-3 rounded-lg border ${
                                  team._id === selectedTeam ? 'bg-blue-50 border-blue-200' : 'bg-white'
                                }`}
                              >
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
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="evaluations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Evaluation Form
                </CardTitle>
                <CardDescription>Create and manage evaluation forms</CardDescription>
              </CardHeader>
              <CardContent>
                {!isCreatingForm ? (
                  <div className="space-y-4">
                    {evaluationForm ? (
                      <>
                        <div className="p-4 bg-white rounded-lg border">
                          <h4 className="font-semibold">{evaluationForm.title}</h4>
                          <p className="text-sm text-gray-600">{evaluationForm.description}</p>
                          <div className="mt-2">
                            <p className="text-sm text-gray-600">
                              Time Limit: {evaluationForm.evaluationTime} seconds
                            </p>
                            <p className="text-sm text-gray-600">
                              Fields: {evaluationForm.fields.length}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={() => setIsCreatingForm(true)}>
                            Edit Form
                          </Button>
                          <Button 
                            onClick={startEvaluation}
                            disabled={isEvaluationEnabled}
                          >
                            Start Evaluation
                          </Button>
                          <Button 
                            onClick={endEvaluation}
                            variant="destructive"
                            disabled={!isEvaluationEnabled}
                          >
                            End Evaluation
                          </Button>
                        </div>
                        {isEvaluationEnabled && (
                          <div className="p-4 bg-yellow-50 rounded-lg">
                            <p className="text-yellow-800">
                              Time Remaining: {formatTime(evaluationTimer)}
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <Button onClick={() => setIsCreatingForm(true)}>
                        Create Evaluation Form
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label>Form Title</Label>
                      <Input
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        placeholder="Enter form title"
                      />
                    </div>
                    <div>
                      <Label>Form Description</Label>
                      <Input
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        placeholder="Enter form description"
                      />
                    </div>
                    <div>
                      <Label>Evaluation Time (seconds)</Label>
                      <Input
                        type="number"
                        min="1"
                        value={evaluationTime || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '') {
                            setEvaluationTime(60); // Default to 60 if empty
                          } else {
                            const numValue = parseInt(value);
                            if (!isNaN(numValue) && numValue > 0) {
                              setEvaluationTime(numValue);
                            }
                          }
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label>Form Fields</Label>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addFormField('rating')}
                          >
                            Add Rating
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addFormField('text')}
                          >
                            Add Text
                          </Button>
                        </div>
                      </div>
                      {formFields.map((field, index) => (
                        <div key={index} className="p-4 bg-white rounded-lg border">
                          <div className="flex justify-between items-start">
                            <div className="flex-1 space-y-2">
                              <Input
                                value={field.label}
                                onChange={(e) => updateFormField(index, { label: e.target.value })}
                                placeholder={`Enter ${field.type} field label`}
                              />
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={field.required}
                                  onChange={(e) => updateFormField(index, { required: e.target.checked })}
                                  className="rounded border-gray-300"
                                />
                                <Label>Required</Label>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFormField(index)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => {
                          console.log('Save Form button clicked');
                          saveEvaluationForm();
                        }}
                      >
                        Save Form
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setIsCreatingForm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="responses" className="space-y-4">
            {isLoadingResponses ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : evaluationResponses.length === 0 ? (
              <div className="text-center text-muted-foreground">
                No evaluation responses yet
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(
                  evaluationResponses.reduce((acc, response) => {
                    const teamId = response.team._id;
                    if (!acc[teamId]) {
                      acc[teamId] = {
                        teamName: response.team.name,
                        responses: []
                      };
                    }
                    acc[teamId].responses.push(response);
                    return acc;
                  }, {} as Record<string, { teamName: string; responses: EvaluationResponse[] }>)
                ).map(([teamId, { teamName, responses }]) => (
                  <div key={teamId} className="space-y-4">
                    <h3 className="text-lg font-semibold">{teamName}</h3>
                    <div className="space-y-4">
                      {responses.map((response) => (
                        <Card key={response._id} className="p-4">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <p className="font-medium">Submitted by: {response.submittedBy.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(response.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {Object.entries(response.responses).map(([field, value]) => (
                              <div key={field} className="grid grid-cols-2 gap-2">
                                <p className="font-medium">{field}:</p>
                                <p>{value}</p>
                              </div>
                            ))}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
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
