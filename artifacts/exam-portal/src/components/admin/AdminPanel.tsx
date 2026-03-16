import { useState, useRef, useEffect } from "react";
import { Users, Building2, FileText, UploadCloud, Plus, Trash2 } from "lucide-react";
import { useGetUsers, useDeleteUser, useGetDepartments, useCreateDepartment, useDeleteDepartment, useCreateExam, useUpdateExam, type Exam } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useQueryClient } from "@tanstack/react-query";

interface AdminPanelProps {
  editingExam?: Exam | null;
  onClearEdit: () => void;
}

export function AdminPanel({ editingExam, onClearEdit }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<"users" | "depts" | "exams">(editingExam ? "exams" : "users");
  
  const queryClient = useQueryClient();
  const { data: users = [] } = useGetUsers();
  const { data: depts = [] } = useGetDepartments();
  
  const { mutate: deleteUser } = useDeleteUser({ mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/users'] }) } });
  const { mutate: createDept } = useCreateDepartment({ mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/departments'] }) } });
  const { mutate: deleteDept } = useDeleteDepartment({ mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/departments'] }) } });
  
  const { mutate: createExam, isPending: isCreatingExam } = useCreateExam({ 
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/exams'] });
        resetExamForm();
      }
    }
  });
  const { mutate: updateExam, isPending: isUpdatingExam } = useUpdateExam({ 
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/exams'] });
        resetExamForm();
      }
    }
  });

  // Dept State
  const [newDeptName, setNewDeptName] = useState("");

  // Exam Form State
  const [examTitle, setExamTitle] = useState(editingExam?.title || "");
  const [examDept, setExamDept] = useState(editingExam?.department || "");
  const [examCountdown, setExamCountdown] = useState(editingExam?.countdown?.toString() || "0");
  const [examFile, setExamFile] = useState<{name: string, content: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync edit state
  useEffect(() => {
    if (editingExam) {
      setExamTitle(editingExam.title);
      setExamDept(editingExam.department);
      setExamCountdown(editingExam.countdown.toString());
      setActiveTab("exams");
    }
  }, [editingExam]);

  const resetExamForm = () => {
    setExamTitle("");
    setExamDept("");
    setExamCountdown("0");
    setExamFile(null);
    onClearEdit();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith('.html')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setExamFile({ name: file.name, content: ev.target.result as string });
        }
      };
      reader.readAsText(file);
    } else {
      alert("Please upload a valid HTML file");
    }
  };

  const handleSaveExam = () => {
    if (!examTitle || !examDept) return alert("Fill required fields");
    const payload = {
      title: examTitle,
      department: examDept,
      countdown: parseInt(examCountdown) || 0,
      ...(examFile && { fileName: examFile.name, content: examFile.content })
    };

    if (editingExam) {
      updateExam({ id: editingExam.id, data: payload });
    } else {
      if (!examFile) return alert("Please attach an HTML file for the exam content");
      createExam({ data: payload });
    }
  };

  return (
    <div className="bg-card rounded-2xl border border-border shadow-lg overflow-hidden flex flex-col mb-8">
      <div className="flex p-2 bg-muted/50 border-b border-border">
        <button onClick={() => setActiveTab("users")} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === 'users' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
          <Users className="w-4 h-4" /> Users
        </button>
        <button onClick={() => setActiveTab("depts")} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === 'depts' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
          <Building2 className="w-4 h-4" /> Departments
        </button>
        <button onClick={() => setActiveTab("exams")} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === 'exams' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
          <FileText className="w-4 h-4" /> Post Exam
        </button>
      </div>

      <div className="p-6">
        {activeTab === "users" && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold flex items-center justify-between">
              Registered Users 
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">{users.length}</span>
            </h3>
            <div className="divide-y border border-border rounded-xl overflow-hidden bg-background">
              {users.length === 0 ? <p className="p-4 text-center text-muted-foreground text-sm">No users found</p> : null}
              {users.map(u => (
                <div key={u.username} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center font-bold">
                      {u.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground flex items-center gap-2">
                        {u.username}
                        {u.isAdmin && <span className="bg-amber-500/10 text-amber-600 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">Admin</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">Joined: {u.joinDate}</p>
                    </div>
                  </div>
                  {!u.isAdmin && (
                    <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => deleteUser({ username: u.username })}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "depts" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold mb-4">Manage Departments</h3>
              <div className="flex gap-3">
                <Input 
                  placeholder="New Department Name" 
                  value={newDeptName} 
                  onChange={e => setNewDeptName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && newDeptName.trim()) {
                      createDept({ data: { name: newDeptName.trim() }});
                      setNewDeptName("");
                    }
                  }}
                />
                <Button onClick={() => {
                  if (newDeptName.trim()) {
                    createDept({ data: { name: newDeptName.trim() }});
                    setNewDeptName("");
                  }
                }}>
                  <Plus className="w-4 h-4 mr-2" /> Add
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {depts.map(d => (
                <div key={d.id} className="bg-background border border-border p-3 rounded-xl flex items-center justify-between group hover:border-primary/50 transition-colors">
                  <span className="font-medium text-sm truncate">{d.name}</span>
                  <button onClick={() => deleteDept({ id: d.id })} className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "exams" && (
          <div className="space-y-4 max-w-2xl">
            <h3 className="text-lg font-bold mb-4">{editingExam ? 'Edit Exam' : 'Post New Exam'}</h3>
            <Input placeholder="Exam Title" value={examTitle} onChange={e => setExamTitle(e.target.value)} />
            
            <div className="flex gap-4">
              <select 
                className="flex h-12 w-full rounded-xl border-2 border-input bg-background px-4 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10"
                value={examDept}
                onChange={e => setExamDept(e.target.value)}
              >
                <option value="">Select Department</option>
                {depts.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
              </select>
              
              <Input 
                type="number" 
                placeholder="Countdown (seconds)" 
                value={examCountdown} 
                onChange={e => setExamCountdown(e.target.value)} 
                min="0"
                className="w-48"
              />
            </div>

            <div 
              className="border-2 border-dashed border-border/60 hover:border-primary bg-muted/20 hover:bg-primary/5 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input type="file" accept=".html" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
              <UploadCloud className="w-10 h-10 text-muted-foreground mb-3" />
              <p className="font-medium text-foreground">Click to upload HTML file</p>
              <p className="text-sm text-muted-foreground mt-1">
                {examFile?.name || editingExam?.fileName || "No file selected"}
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={handleSaveExam} disabled={isCreatingExam || isUpdatingExam} className="flex-1">
                {editingExam ? "Update Exam" : "Post Exam"}
              </Button>
              {editingExam && (
                <Button variant="outline" onClick={resetExamForm}>Cancel Edit</Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
