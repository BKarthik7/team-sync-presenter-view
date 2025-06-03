import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import TeamFormation from '../components/TeamFormation';

export default function Dashboard() {
  const { user, logout } = useAuth();

  const renderDashboardContent = () => {
    switch (user?.role) {
      case 'lab_instructor':
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Lab Instructor Dashboard</CardTitle>
                <CardDescription>Manage teachers and monitor classes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button onClick={() => window.location.href = '/create-teacher'}>
                    Create Teacher Account
                  </Button>
                  <Button onClick={() => window.location.href = '/classes'}>
                    View All Classes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'teacher':
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Teacher Dashboard</CardTitle>
                <CardDescription>Manage your classes and teams</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button onClick={() => window.location.href = '/classes'}>
                    My Classes
                  </Button>
                  <Button onClick={() => window.location.href = '/teams'}>
                    Manage Teams
                  </Button>
                  <Button onClick={() => window.location.href = '/team-formation'}>
                    Create New Team
                  </Button>
                  <TeamFormation />
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'peer':
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Peer Dashboard</CardTitle>
                <CardDescription>View team presentations and provide feedback</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button onClick={() => window.location.href = '/teams'}>
                    View Teams
                  </Button>
                  <Button onClick={() => window.location.href = '/evaluations'}>
                    View Evaluations
                  </Button>
                  <Button onClick={() => window.location.href = '/team-formation'}>
                    Join Team
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Welcome, {user?.name}</h1>
        <Button variant="outline" onClick={logout}>
          Logout
        </Button>
      </div>
      {renderDashboardContent()}
    </div>
  );
} 