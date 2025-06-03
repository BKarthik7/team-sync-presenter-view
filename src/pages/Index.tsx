
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Presentation, UserCheck } from "lucide-react";

const Index = () => {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const navigate = useNavigate();

  const roles = [
    {
      id: "lab-assistant",
      title: "Lab Assistant",
      description: "Manage users, classes, and overall system administration",
      icon: UserCheck,
      color: "bg-blue-500 hover:bg-blue-600"
    },
    {
      id: "presenter-controller",
      title: "Presenter/Controller",
      description: "Create projects, manage presentations, and view evaluations",
      icon: Presentation,
      color: "bg-green-500 hover:bg-green-600"
    },
    {
      id: "peer",
      title: "Peer Student",
      description: "Join teams, participate in presentations, and provide evaluations",
      icon: Users,
      color: "bg-purple-500 hover:bg-purple-600"
    }
  ];

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
    console.log(`Selected role: ${roleId}`);
  };

  const handleContinueToDashboard = () => {
    if (selectedRole) {
      switch (selectedRole) {
        case "lab-assistant":
          navigate("/lab-assistant");
          break;
        case "presenter-controller":
          navigate("/presenter");
          break;
        case "peer":
          navigate("/peer");
          break;
        default:
          console.error("Unknown role selected");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Peer Presentation System
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            A comprehensive platform for managing team presentations, evaluations, and real-time collaboration
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold text-center mb-8 text-gray-700">
            Select Your Role
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {roles.map((role) => {
              const IconComponent = role.icon;
              return (
                <Card 
                  key={role.id}
                  className={`cursor-pointer transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 ${
                    selectedRole === role.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => handleRoleSelect(role.id)}
                >
                  <CardHeader className="text-center">
                    <div className={`w-16 h-16 ${role.color} rounded-full flex items-center justify-center mx-auto mb-4 transition-colors duration-300`}>
                      <IconComponent className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-xl">{role.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {role.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <Button 
                      className={`w-full ${role.color} text-white transition-colors duration-300`}
                    >
                      Enter as {role.title}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {selectedRole && (
            <div className="mt-12 text-center">
              <Card className="max-w-md mx-auto bg-white/80 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <p className="text-gray-600 mb-4">
                    You've selected: <strong className="text-gray-800 capitalize">{selectedRole.replace('-', ' ')}</strong>
                  </p>
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={handleContinueToDashboard}
                  >
                    Continue to Dashboard
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <div className="mt-16 max-w-6xl mx-auto">
          <h3 className="text-2xl font-semibold text-center mb-8 text-gray-700">
            System Features
          </h3>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Team Management", desc: "Create and organize student teams" },
              { title: "Live Presentations", desc: "Synchronized timer for all participants" },
              { title: "Peer Evaluation", desc: "Customizable feedback forms" },
              { title: "Real-time Sync", desc: "Seamless coordination across devices" }
            ].map((feature, index) => (
              <Card key={index} className="text-center bg-white/70 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <h4 className="font-semibold text-gray-800 mb-2">{feature.title}</h4>
                  <p className="text-sm text-gray-600">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
