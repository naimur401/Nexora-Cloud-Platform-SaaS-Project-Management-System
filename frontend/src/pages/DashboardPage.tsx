import NotificationBell from "../components/NotificationBell";
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../services/auth.service";
import CreateTaskModal from "../components/CreateTaskModal";
import axios from "../services/axios.config";
import toast from "react-hot-toast";

export default function DashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("kanban");
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newProject, setNewProject] = useState({ title: "", description: "" });
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [attachments, setAttachments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setUser(authService.getCurrentUser());
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [projectsRes, tasksRes] = await Promise.all([
        axios.get("/projects"),
        axios.get("/tasks"),
      ]);
      setProjects(projectsRes.data.data || []);
      setTasks(tasksRes.data.data || []);
    } catch { toast.error("Failed to load data"); }
    finally { setLoading(false); }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchPriority = filterPriority ? task.priority === filterPriority : true;
    const matchStatus = filterStatus ? task.status === filterStatus : true;
    return matchSearch && matchPriority && matchStatus;
  });

  const fetchComments = async (taskId: number) => {
    try {
      const res = await axios.get("/tasks/" + taskId + "/comments");
      setComments(res.data.data || []);
    } catch { toast.error("Failed to load comments"); }
  };

  const fetchAttachments = async (taskId: number) => {
    try {
      const res = await axios.get("/tasks/" + taskId + "/attachments");
      setAttachments(res.data.data || []);
    } catch {}
  };

  const openTaskComments = (task: any) => {
    setSelectedTask(task);
    fetchComments(task.id);
    fetchAttachments(task.id);
  };

  const addComment = async () => {
    if (!newComment.trim()) return;
    setCommentLoading(true);
    try {
      const res = await axios.post("/tasks/" + selectedTask.id + "/comments", { content: newComment });
      setComments([...comments, res.data.data]);
      setNewComment("");
      toast.success("Comment added");
    } catch { toast.error("Failed to add comment"); }
    finally { setCommentLoading(false); }
  };

  const deleteComment = async (commentId: number) => {
    try {
      await axios.delete("/comments/" + commentId);
      setComments(comments.filter(c => c.id !== commentId));
      toast.success("Comment deleted");
    } catch { toast.error("Failed to delete comment"); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post('/tasks/' + selectedTask.id + '/attachments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setAttachments([res.data.data, ...attachments]);
      toast.success('File uploaded');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const deleteAttachment = async (id: number) => {
    if (!confirm('Delete this file?')) return;
    try {
      await axios.delete('/attachments/' + id);
      setAttachments(attachments.filter(a => a.id !== id));
      toast.success('File deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    navigate("/login");
  };

  const createProject = async () => {
    if (!newProject.title) { toast.error("Project title required"); return; }
    try {
      const res = await axios.post("/projects", newProject);
      if (res.data.success) {
        setProjects([...projects, res.data.data]);
        setShowProjectModal(false);
        setNewProject({ title: "", description: "" });
        toast.success("Project created");
      }
    } catch { toast.error("Failed to create project"); }
  };

  const deleteProject = async (id: number) => {
    if (!confirm("Are you sure?")) return;
    try {
      await axios.delete("/projects/" + id);
      setProjects(projects.filter(p => p.id !== id));
      toast.success("Project deleted");
    } catch { toast.error("Failed to delete"); }
  };

  const updateTaskStatus = async (taskId: number, newStatus: string) => {
    try {
      const res = await axios.put("/tasks/" + taskId + "/status", { status: newStatus });
      if (res.data.success) {
        setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
        toast.success("Task updated");
      }
    } catch { toast.error("Failed to update task"); }
  };

  const handleDragStart = (e: React.DragEvent, task: any) => {
    e.dataTransfer.setData("taskId", task.id.toString());
    (e.currentTarget as HTMLElement).style.opacity = "0.5";
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).style.opacity = "1";
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const taskId = parseInt(e.dataTransfer.getData("taskId"));
    const task = tasks.find(t => t.id === taskId);
    if (task && task.status !== newStatus) await updateTaskStatus(taskId, newStatus);
  };

  const getTaskCountByStatus = (status: string) => tasks.filter(t => t.status === status).length;

  const getPriorityBadge = (priority: string) => {
    if (priority === "HIGH") return "bg-red-100 text-red-800";
    if (priority === "MEDIUM") return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  const columns = [
    { id: "TODO", title: "To Do", borderColor: "border-yellow-400", bgColor: "bg-yellow-100" },
    { id: "IN_PROGRESS", title: "In Progress", borderColor: "border-blue-400", bgColor: "bg-blue-100" },
    { id: "DONE", title: "Done", borderColor: "border-green-400", bgColor: "bg-green-100" },
  ];

  const canManageTeam = user?.role === 'COMPANY_ADMIN' || user?.role === 'SUPER_ADMIN';

  if (loading) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-purple-600">Nexora Cloud</Link>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <span className="text-gray-700">Welcome, <span className="font-semibold">{user?.name}</span></span>
            <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded">{user?.role}</span>
            {canManageTeam && (
              <Link to="/team" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">👥 Team</Link>
            )}
            <Link to="/settings" className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">⚙️ Settings</Link>
            <button onClick={handleLogout} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Logout</button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          {[
            { icon: "📁", value: projects.length, label: "Total Projects", color: "text-purple-600" },
            { icon: "✅", value: getTaskCountByStatus("DONE"), label: "Completed", color: "text-green-600" },
            { icon: "🔄", value: getTaskCountByStatus("IN_PROGRESS"), label: "In Progress", color: "text-blue-600" },
            { icon: "⏳", value: getTaskCountByStatus("TODO"), label: "Pending", color: "text-yellow-600" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-lg shadow p-6">
              <div className="text-3xl mb-2">{stat.icon}</div>
              <div className={"text-2xl font-bold " + stat.color}>{stat.value}</div>
              <div className="text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b flex">
            {[{ id: "projects", label: "📁 Projects" }, { id: "kanban", label: "🎯 Kanban Board" }].map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={"px-6 py-3 text-sm font-medium transition " + (activeTab === tab.id ? "border-b-2 border-purple-600 text-purple-600" : "text-gray-500 hover:text-gray-700")}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "projects" && (
          <>
            <div className="bg-white rounded-lg shadow mb-8">
              <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-xl font-bold">📁 Projects</h2>
                <button onClick={() => setShowProjectModal(true)} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">+ New Project</button>
              </div>
              <div className="p-6">
                {projects.length === 0 ? <p className="text-gray-500 text-center">No projects yet.</p> : (
                  <div className="grid gap-4">
                    {projects.map((project) => (
                      <div key={project.id} className="border rounded-lg p-4 hover:shadow-md transition flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">{project.title}</h3>
                          <p className="text-gray-600 text-sm">{project.description || "No description"}</p>
                        </div>
                        <button onClick={() => deleteProject(project.id)} className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-xl font-bold">✅ Tasks</h2>
                <button onClick={() => setShowTaskModal(true)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">+ New Task</button>
              </div>
              <div className="p-4 border-b bg-gray-50 flex gap-3 flex-wrap">
                <input type="text" placeholder="🔍 Search tasks..." value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 min-w-48 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
                  <option value="">All Priority</option>
                  <option value="HIGH">🔴 High</option>
                  <option value="MEDIUM">🟡 Medium</option>
                  <option value="LOW">🟢 Low</option>
                </select>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
                  <option value="">All Status</option>
                  <option value="TODO">📝 TODO</option>
                  <option value="IN_PROGRESS">🔄 In Progress</option>
                  <option value="DONE">✅ Done</option>
                </select>
                {(searchQuery || filterPriority || filterStatus) && (
                  <button onClick={() => { setSearchQuery(""); setFilterPriority(""); setFilterStatus(""); }}
                    className="px-3 py-2 bg-gray-200 rounded-lg text-sm hover:bg-gray-300">
                    ✕ Clear
                  </button>
                )}
              </div>
              <div className="p-6">
                {filteredTasks.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    {tasks.length === 0 ? "No tasks yet." : "No tasks match your search."}
                  </p>
                ) : (
                  <div className="grid gap-4">
                    {filteredTasks.map((task) => (
                      <div key={task.id} className="border rounded-lg p-4 hover:shadow-md transition">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{task.title}</h3>
                            <p className="text-gray-600 text-sm">{task.description}</p>
                            <div className="flex gap-2 mt-2">
                              <span className={"px-2 py-1 rounded text-xs " + getPriorityBadge(task.priority)}>{task.priority}</span>
                              <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">{task.status}</span>
                            </div>
                          </div>
                          <div className="flex gap-2 items-center">
                            <button onClick={() => openTaskComments(task)} className="text-sm text-purple-600 hover:text-purple-800 border border-purple-200 px-3 py-1 rounded-lg">
                              💬 Comments
                            </button>
                            <select value={task.status} onChange={(e) => updateTaskStatus(task.id, e.target.value)} className="text-sm border rounded px-2 py-1">
                              <option value="TODO">TODO</option>
                              <option value="IN_PROGRESS">In Progress</option>
                              <option value="DONE">Done</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === "kanban" && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">🎯 Task Board</h2>
                <p className="text-gray-600 text-sm">Drag to change status. Click 💬 for comments.</p>
              </div>
              <button onClick={() => setShowTaskModal(true)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">+ New Task</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {columns.map((column) => (
                <div key={column.id} className="bg-gray-50 rounded-lg">
                  <div className={"p-4 rounded-t-lg " + column.bgColor + " border-b-4 " + column.borderColor}>
                    <h3 className="font-bold">{column.title}</h3>
                    <p className="text-sm text-gray-600">{getTaskCountByStatus(column.id)} tasks</p>
                  </div>
                  <div className="p-4 min-h-96" onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, column.id)}>
                    {tasks.filter(t => t.status === column.id).map((task) => (
                      <div key={task.id} draggable
                        onDragStart={(e) => handleDragStart(e, task)}
                        onDragEnd={handleDragEnd}
                        className="bg-white rounded-lg p-4 mb-3 shadow-md hover:shadow-lg cursor-grab active:cursor-grabbing transition">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-gray-800 text-sm">{task.title}</h4>
                          <span className={"text-xs px-2 py-1 rounded " + getPriorityBadge(task.priority)}>{task.priority}</span>
                        </div>
                        <p className="text-xs text-gray-500 mb-3">{task.description}</p>
                        <button onClick={() => openTaskComments(task)} className="text-xs text-purple-600 hover:text-purple-800">
                          💬 Comments
                        </button>
                      </div>
                    ))}
                    {getTaskCountByStatus(column.id) === 0 && (
                      <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">Drop tasks here</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showProjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-xl font-bold mb-4">Create New Project</h3>
            <input type="text" placeholder="Project Title" value={newProject.title}
              onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg mb-3" />
            <textarea placeholder="Description (optional)" value={newProject.description}
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg mb-4" rows={3} />
            <div className="flex gap-3">
              <button onClick={createProject} className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Create</button>
              <button onClick={() => setShowProjectModal(false)} className="flex-1 px-4 py-2 bg-gray-300 rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold">{selectedTask.title}</h3>
                <p className="text-gray-500 text-sm mt-1">{selectedTask.description}</p>
                <div className="flex gap-2 mt-2">
                  <span className={"text-xs px-2 py-1 rounded " + getPriorityBadge(selectedTask.priority)}>{selectedTask.priority}</span>
                  <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">{selectedTask.status}</span>
                </div>
              </div>
              <button onClick={() => { setSelectedTask(null); setComments([]); setAttachments([]); }} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>

            <div className="p-6 border-b bg-gray-50">
              <h4 className="font-semibold text-gray-700 mb-3">📎 Attachments ({attachments.length})</h4>
              <input
                type="file"
                id={'file-input-' + selectedTask.id}
                className="hidden"
                onChange={handleFileUpload}
                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
              />
              <label
                htmlFor={'file-input-' + selectedTask.id}
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer text-sm"
              >
                + Upload File
              </label>
              {uploading && <span className="ml-3 text-sm text-gray-500">Uploading...</span>}

              <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                {attachments.length === 0 ? (
                  <p className="text-gray-400 text-sm">No attachments yet.</p>
                ) : (
                  attachments.map((file) => (
                    <div key={file.id} className="flex items-center gap-3 bg-white p-2 rounded border">
                      <span className="text-lg">
                        {file.file_type?.includes('image') ? '🖼️' : file.file_type?.includes('pdf') ? '📄' : '📎'}
                      </span>
                      <a href={file.file_url} target="_blank" rel="noopener noreferrer" className="flex-1 text-sm text-purple-600 hover:underline truncate">
                        {file.file_name}
                      </a>
                      <span className="text-xs text-gray-400">
                        {file.file_size ? (file.file_size / 1024).toFixed(1) + ' KB' : ''}
                      </span>
                      <button onClick={() => deleteAttachment(file.id)} className="text-red-400 hover:text-red-600 text-xs">
                        Delete
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <h4 className="font-semibold text-gray-700 mb-4">💬 Comments ({comments.length})</h4>
              {comments.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No comments yet.</p>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-sm flex-shrink-0">
                        {comment.user_name?.[0]?.toUpperCase() || "U"}
                      </div>
                      <div className="flex-1 bg-gray-50 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-semibold text-sm">{comment.user_name || "Unknown"}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">{new Date(comment.created_at).toLocaleString()}</span>
                            <button onClick={() => deleteComment(comment.id)} className="text-red-400 hover:text-red-600 text-xs">Delete</button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t">
              <div className="flex gap-3">
                <input type="text" placeholder="Write a comment..." value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addComment()}
                  className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                <button onClick={addComment} disabled={commentLoading || !newComment.trim()}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm">
                  {commentLoading ? "..." : "Send"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <CreateTaskModal isOpen={showTaskModal} onClose={() => setShowTaskModal(false)} onTaskCreated={fetchData} projects={projects} />
    </div>
  );
}