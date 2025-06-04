import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Plus, Trash2, Save } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { evaluationFormAPI } from '../lib/api';
import { useNavigate } from 'react-router-dom';

interface FormField {
  id: string;
  type: 'rating' | 'text';
  label: string;
  required: boolean;
}

export default function CustomEvaluationForm() {
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [fields, setFields] = useState<FormField[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const loadExistingForm = async () => {
      try {
        const projectId = localStorage.getItem('selectedProjectId');
        if (!projectId) return;

        const form = await evaluationFormAPI.getByProject(projectId);
        if (form) {
          setFormTitle(form.title);
          setFormDescription(form.description);
          setFields(form.fields.map((field: any) => ({
            id: `field-${Date.now()}-${Math.random()}`,
            type: field.type,
            label: field.label,
            required: field.required
          })));
        }
      } catch (error) {
        console.error('Error loading existing form:', error);
      }
    };

    loadExistingForm();
  }, []);

  const addField = (type: 'rating' | 'text') => {
    const newField: FormField = {
      id: `field-${Date.now()}`,
      type,
      label: '',
      required: false
    };
    setFields([...fields, newField]);
  };

  const removeField = (id: string) => {
    setFields(fields.filter(field => field.id !== id));
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map(field => 
      field.id === id ? { ...field, ...updates } : field
    ));
  };

  const saveForm = async () => {
    if (!formTitle) {
      toast({
        title: "Error",
        description: "Please provide a form title",
        variant: "destructive",
      });
      return;
    }

    if (fields.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one field to the form",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const projectId = localStorage.getItem('selectedProjectId');
      if (!projectId) {
        throw new Error('No project selected');
      }

      const formData = {
        title: formTitle,
        description: formDescription,
        fields: fields.map(({ type, label, required }) => ({
          type,
          label,
          required
        })),
        project: projectId
      };

      await evaluationFormAPI.create(formData);

      toast({
        title: "Success",
        description: "Evaluation form saved successfully",
      });

      // Navigate back to the project page
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save evaluation form",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Customize Evaluation Form</CardTitle>
          <CardDescription>
            Create a custom evaluation form with ratings and text fields
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="form-title">Form Title</Label>
              <Input
                id="form-title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Enter form title"
              />
            </div>
            <div>
              <Label htmlFor="form-description">Form Description</Label>
              <Input
                id="form-description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Enter form description"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Form Fields</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addField('rating')}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Rating
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addField('text')}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Text Field
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {fields.map((field) => (
                <div key={field.id} className="p-4 border rounded-lg space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 space-y-4">
                      <div>
                        <Label>Field Label</Label>
                        <Input
                          value={field.label}
                          onChange={(e) => updateField(field.id, { label: e.target.value })}
                          placeholder={`Enter ${field.type} field label`}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`required-${field.id}`}
                          checked={field.required}
                          onChange={(e) => updateField(field.id, { required: e.target.checked })}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor={`required-${field.id}`}>Required</Label>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeField(field.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Button 
              onClick={saveForm} 
              className="flex items-center gap-2"
              disabled={isLoading}
            >
              <Save className="h-4 w-4" />
              {isLoading ? 'Saving...' : 'Save Form'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 