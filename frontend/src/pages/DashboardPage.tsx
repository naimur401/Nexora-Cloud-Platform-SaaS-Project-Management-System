import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/auth.service';
import CreateTaskModal from '../components/CreateTaskModal';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('kanban');
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newProject, setNewProject] = useState({ title: '', description: '' });

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const projectsResponse = await fetch('http://localhost:5000/api/projects', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const projectsData = await projectsResponse.json();
      
      const tasksResponse = await fetch('http://localhost:5000/api/tasks', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const tasksData = await tasksResponse.json();
      
      setProjects(projectsData.data || []);
      setTasks(tasksData.data || []);
      
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  const createProject = async () => {
    if (!newProject.title) {
      toast.error('Project title required');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/projects', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newProject)
      });
      const data = await response.json();
      if (data.success) {
        setProjects([...projects, data.data]);
        setShowProjectModal(false);
        setNewProject({ title: '', description: '' });
        toast.success('Project created');
      }
    } catch (error) {
      toast.error('Failed to create project');
    }
  };

  const deleteProject = async (id: number) => {
    if (!confirm('Are you sure?')) return;
    try {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:5000/api/projects/' + id, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token }
      });
      setProjects(projects.filter(p => p.id !== id));
      toast.success('Project deleted');
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const updateTaskStatus = async (taskId: number, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/tasks/' + taskId + '/status', {
        method: 'PUT',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await response.json();
      if (data.success) {
        setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
        toast.success(`Task moved to ${newStatus}`);
      }
      return data.success;
    } catch (error) {
      console.error('Failed to update:', error);
      toast.error('Failed to update task');
      return false;
    }
  };

  const handleDragStart = (e: React.DragEvent, task: any) => {
    e.dataTransfer.setData('taskId', task.id.toString());
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.style.opacity = '0.5';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.style.opacity = '1';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const taskId = parseInt(e.dataTransfer.getData('taskId'));
    const task = tasks.find(t => t.id === taskId);
    
    if (task && task.status !== newStatus) {
      await updateTaskStatus(taskId, newStatus);
    }
  };

  const getTaskCountByStatus = (status: string) => {
    return tasks.filter(t => t.status === status).length;
  };

  const columns = [
    { id: 'TODO', title: '📝 To Do', color: 'bg-yellow-50', borderColor: 'border-yellow-400', bgColor: 'bg-yellow-100' },
    { id: 'IN_PROGRESS', title: '🔄 In Progress', color: 'bg-blue-50', borderColor: 'border-blue-400', bgColor: 'bg-blue-100' },
    { id: 'DONE', title: '✅ Done', color: 'bg-green-50', borderColor: 'border-green-400', bgColor: 'bg-green-100' }
  ];

  const getPriorityBadge = (priority: string) => {
    switch(priority) {
      case 'HIGH': return 'bg-red-100 text-red-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-purple-600">Nexora Cloud</Link>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">Welcome, <span className="font-semibold">{user?.name}</span></span>
            <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded">{user?.role}</span>
            <button onClick={handleLogout} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">Logout</button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl mb-2">📁</div>
            <div className="text-2xl font-bold text-purple-600">{projects.length}</div>
            <div className="text-gray-600">Total Projects</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl mb-2">✅</div>
            <div className="text-2xl font-bold text-green-600">{getTaskCountByStatus('DONE')}</div>
            <div className="text-gray-600">Completed Tasks</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl mb-2">🔄</div>
            <div className="text-2xl font-bold text-blue-600">{getTaskCountByStatus('IN_PROGRESS')}</div>
            <div className="text-gray-600">In Progress</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl mb-2">⏳</div>
            <div className="text-2xl font-bold text-yellow-600">{getTaskCountByStatus('TODO')}</div>
            <div className="text-gray-600">Pending Tasks</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b">
            <div className="flex">
              <button
                onClick={() => setActiveTab('projects')}
                className={"px-6 py-3 text-sm font-medium transition " + (activeTab === 'projects' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500 hover:text-gray-700')}
              >
                📁 Projects
              </button>
              <button
                onClick={() => setActiveTab('kanban')}
                className={"px-6 py-3 text-sm font-medium transition " + (activeTab === 'kanban' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500 hover:text-gray-700')}
              >
                🎯 Kanban Board
              </button>
            </div>
          </div>
        </div>

        {activeTab === 'projects' && (
          <>
            <div className="bg-white rounded-lg shadow mb-8">
              <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-xl font-bold">📁 Projects</h2>
                <button onClick={() => setShowProjectModal(true)} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">+ New Project</button>
              </div>
              <div className="p-6">
                {projects.length === 0 ? (
                  <p className="text-gray-500 text-center">No projects yet. Create your first project!</p>
                ) : (
                  <div className="grid gap-4">
                    {projects.map((project) => (
                      <div key={project.id} className="border rounded-lg p-4 hover:shadow-md transition">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-lg">{project.title}</h3>
                            <p className="text-gray-600 text-sm">{project.description || 'No description'}</p>
                            <span className="inline-block mt-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">{project.status}</span>
                          </div>
                          <button onClick={() => deleteProject(project.id)} className="text-red-600 hover:text-red-800">Delete</button>
                        </div>
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
              <div className="p-6">
                {tasks.length === 0 ? (
                  <p className="text-gray-500 text-center">No tasks yet. Create your first task!</p>
                ) : (
                  <div className="grid gap-4">
                    {tasks.map((task) => (
                      <div key={task.id} className="border rounded-lg p-4 hover:shadow-md transition">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{task.title}</h3>
                            <p className="text-gray-600 text-sm">{task.description}</p>
                            <div className="flex gap-2 mt-2">
                              <span className={"px-2 py-1 rounded text-xs " + getPriorityBadge(task.priority)}>
                                {task.priority}
                              </span>
                              <span className={"px-2 py-1 rounded text-xs " + (
                                task.status === 'TODO' ? 'bg-yellow-100 text-yellow-800' :
                                task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                                'bg-green-100 text-green-800'
                              )}>
                                {task.status}
                              </span>
                            </div>
                          </div>
                          <select 
                            value={task.status} 
                            onChange={(e) => updateTaskStatus(task.id, e.target.value)} 
                            className="text-sm border rounded px-2 py-1 ml-4"
                          >
                            <option value="TODO">TODO</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="DONE">Done</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === 'kanban' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">🎯 Task Board</h2>
                <p className="text-gray-600">Drag and drop tasks to change their status</p>
              </div>
              <button 
                onClick={() => setShowTaskModal(true)} 
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
              >
                <span>+</span> New Task
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {columns.map((column) => (
                <div key={column.id} className="bg-gray-50 rounded-lg">
                  <div className={"p-4 rounded-t-lg " + column.bgColor + " border-b-4 " + column.borderColor}>
                    <h3 className="font-bold text-lg">{column.title}</h3>
                    <p className="text-sm text-gray-600">{getTaskCountByStatus(column.id)} tasks</p>
                  </div>
                  
                  <div
                    className="p-4 min-h-[400px] transition-colors"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, column.id)}
                  >
                    {tasks.filter(t => t.status === column.id).map((task) => (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task)}
                        onDragEnd={handleDragEnd}
                        className="bg-white rounded-lg p-4 mb-3 shadow-md hover:shadow-lg cursor-grab active:cursor-grabbing transition"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-gray-800">{task.title}</h4>
                          <span className={"text-xs px-2 py-1 rounded " + getPriorityBadge(task.priority)}>
                            {task.priority}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                        <div className="text-xs text-gray-400">
                          Task #{task.id}
                        </div>
                      </div>
                    ))}
                    
                    {getTaskCountByStatus(column.id) === 0 && (
                      <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
                        Drop tasks here
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md">
            <h3 className="text-xl font-bold mb-4">Create New Project</h3>
            <input 
              type="text" 
              placeholder="Project Title" 
              value={newProject.title} 
              onChange={(e) => setNewProject({ ...newProject, title: e.target.value })} 
              className="w-full px-3 py-2 border rounded-lg mb-3"
            />
            <textarea 
              placeholder="Description (optional)" 
              value={newProject.description} 
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })} 
              className="w-full px-3 py-2 border rounded-lg mb-4" 
              rows={3}
            />
            <div className="flex gap-3">
              <button onClick={createProject} className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Create</button>
              <button onClick={() => setShowProjectModal(false)} className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        onTaskCreated={fetchData}
        projects={projects}
      />
    </div>
  );
}