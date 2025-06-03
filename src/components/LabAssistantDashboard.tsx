
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Users, GraduationCap } from "lucide-react";

const LabAssistantDashboard = () => {
  const [teachers, setTeachers] = useState([
    { id: 1, name: "Dr. Smith", email: "smith@university.edu", department: "Computer Science" },
    { id: 2, name: "Prof. Johnson", email: "johnson@university.edu", department: "Information Technology" }
  ]);

  const [classes, setClasses] = useState([
    { id: 1, name: "CS-A", students: ["1RV21CS001", "1RV21CS002", "1RV21CS003"], semester: "6th" },
    { id: 2, name: "IT-B", students: ["1RV21IT001", "1RV21IT002"], semester: "4th" }
  ]);

  const [newTeacher, setNewTeacher] = useState({ name: "", email: "", department: "" });
  const [newClass, setNewClass] = useState({ name: "", semester: "", students: "" });

  const addTeacher = () => {
    if (newTeacher.name && newTeacher.email) {
      setTeachers([...teachers, { 
        id: Date.now(), 
        ...newTeacher 
      }]);
      setNewTeacher({ name: "", email: "", department: "" });
    }
  };

  const addClass = () => {
    if (newClass.name && newClass.semester) {
      const studentList = newClass.students.split(',').map(s => s.trim()).filter(s => s);
      setClasses([...classes, {
        id: Date.now(),
        name: newClass.name,
        semester: newClass.semester,
        students: studentList
      }]);
      setNewClass({ name: "", semester: "", students: "" });
    }
  };

  const removeTeacher = (id: number) => {
    setTeachers(teachers.filter(t => t.id !== id));
  };

  const removeClass = (id: number) => {
    setClasses(classes.filter(c => c.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Lab Assistant Dashboard</h1>
          <p className="text-gray-600">Manage teachers, classes, and system administration</p>
        </div>

        <Tabs defaultValue="teachers" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="teachers" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Teachers
            </TabsTrigger>
            <TabsTrigger value="classes" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Classes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="teachers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Add New Teacher</CardTitle>
                <CardDescription>Register a new teacher to the system</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="teacher-name">Teacher Name</Label>
                    <Input
                      id="teacher-name"
                      value={newTeacher.name}
                      onChange={(e) => setNewTeacher({...newTeacher, name: e.target.value})}
                      placeholder="Enter teacher name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="teacher-email">Email</Label>
                    <Input
                      id="teacher-email"
                      type="email"
                      value={newTeacher.email}
                      onChange={(e) => setNewTeacher({...newTeacher, email: e.target.value})}
                      placeholder="Enter email address"
                    />
                  </div>
                  <div>
                    <Label htmlFor="teacher-department">Department</Label>
                    <Input
                      id="teacher-department"
                      value={newTeacher.department}
                      onChange={(e) => setNewTeacher({...newTeacher, department: e.target.value})}
                      placeholder="Enter department"
                    />
                  </div>
                </div>
                <Button onClick={addTeacher} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Teacher
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Registered Teachers ({teachers.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {teachers.map((teacher) => (
                    <div key={teacher.id} className="flex items-center justify-between p-4 bg-white rounded-lg border">
                      <div>
                        <h4 className="font-semibold">{teacher.name}</h4>
                        <p className="text-sm text-gray-600">{teacher.email}</p>
                        <p className="text-sm text-gray-500">{teacher.department}</p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeTeacher(teacher.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="classes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Add New Class</CardTitle>
                <CardDescription>Create a new class with student USNs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="class-name">Class Name</Label>
                    <Input
                      id="class-name"
                      value={newClass.name}
                      onChange={(e) => setNewClass({...newClass, name: e.target.value})}
                      placeholder="e.g., CS-A, IT-B"
                    />
                  </div>
                  <div>
                    <Label htmlFor="class-semester">Semester</Label>
                    <Input
                      id="class-semester"
                      value={newClass.semester}
                      onChange={(e) => setNewClass({...newClass, semester: e.target.value})}
                      placeholder="e.g., 6th, 4th"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="class-students">Student USNs (comma-separated)</Label>
                  <Input
                    id="class-students"
                    value={newClass.students}
                    onChange={(e) => setNewClass({...newClass, students: e.target.value})}
                    placeholder="1RV21CS001, 1RV21CS002, 1RV21CS003"
                  />
                </div>
                <Button onClick={addClass} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Class
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Registered Classes ({classes.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {classes.map((classItem) => (
                    <div key={classItem.id} className="p-4 bg-white rounded-lg border">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{classItem.name}</h4>
                          <p className="text-sm text-gray-600">Semester: {classItem.semester}</p>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeClass(classItem.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-2">Students ({classItem.students.length}):</p>
                        <div className="flex flex-wrap gap-2">
                          {classItem.students.map((student, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              {student}
                            </span>
                          ))}
                        </div>
                      </div>
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

export default LabAssistantDashboard;
