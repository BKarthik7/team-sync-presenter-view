
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Plus, Trash2 } from "lucide-react";

const TeamFormation = () => {
  const [studentUSN, setStudentUSN] = useState("");
  const [teamName, setTeamName] = useState("");
  const [teamMembers, setTeamMembers] = useState<string[]>([]);
  const [projectName] = useState("AI in Healthcare");
  
  const addMember = () => {
    if (studentUSN && !teamMembers.includes(studentUSN)) {
      setTeamMembers([...teamMembers, studentUSN]);
      setStudentUSN("");
    }
  };

  const removeMember = (usn: string) => {
    setTeamMembers(teamMembers.filter(member => member !== usn));
  };

  const createTeam = () => {
    if (teamName && teamMembers.length >= 2) {
      console.log("Creating team:", { teamName, teamMembers, projectName });
      // Reset form
      setTeamName("");
      setTeamMembers([]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 p-6">
      <div className="max-w-2xl mx-auto">
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
                placeholder="Enter your team name"
              />
            </div>

            <div>
              <Label htmlFor="member-usn">Add Team Member (USN)</Label>
              <div className="flex gap-2">
                <Input
                  id="member-usn"
                  value={studentUSN}
                  onChange={(e) => setStudentUSN(e.target.value)}
                  placeholder="Enter student USN"
                />
                <Button onClick={addMember} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>
            </div>

            {teamMembers.length > 0 && (
              <div>
                <Label>Team Members ({teamMembers.length})</Label>
                <div className="space-y-2 mt-2">
                  {teamMembers.map((member, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <span className="font-medium">{member}</span>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeMember(member)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Team Requirements:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Minimum 2 members required</li>
                <li>• Maximum 4 members allowed</li>
                <li>• All members must be from the same class</li>
                <li>• Team name must be unique</li>
              </ul>
            </div>

            <Button 
              onClick={createTeam} 
              disabled={!teamName || teamMembers.length < 2}
              className="w-full"
            >
              Create Team
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeamFormation;
