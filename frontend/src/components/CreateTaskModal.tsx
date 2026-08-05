import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import axios from "../services/axios.config";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
  projects: any[];
}

export default function CreateTaskModal({ isOpen, onClose, onTaskCreated, projects }: CreateTaskModalProps) {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    projectId: "",
    assignedTo: ""
  });

  useEffect(() => {
    if (isOpen) fetchUsers();
  }, [isOpen]);

  const fetchUsers = async () => {
    try {
      const res = await axios.get("/users");
      setUsers(res.data.data || []);
    } catch {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) { toast.error("Task title is required"); return; }
    if (!formData.projectId) { toast.error("Please select a project"); return; }

    setLoading(true);
    try {
      const res = await axios.post("/tasks", {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        projectId: parseInt(formData.projectId),
        assignedTo: formData.assignedTo ? parseInt(formData.assignedTo) : null
      });

      if (res.data.success) {
        toast.success("Task created successfully!");
        setFormData({ title: "", description: "", priority: "MEDIUM", projectId: "", assignedTo: "" });
        onTaskCreated();
        onClose();
      } else {
        toast.error(res.data.message || "Failed to create task");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Create New Task</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Task Title <span className="text-red-500">*</span></label>
            <input type="text" value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"
              placeholder="Enter task title" required />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"
              rows={3} placeholder="Enter task description" />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
            <select value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
              <option value="LOW">🟢 Low</option>
              <option value="MEDIUM">🟡 Medium</option>
              <option value="HIGH">🔴 High</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Project <span className="text-red-500">*</span></label>
            <select value={formData.projectId}
              onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600" required>
              <option value="">Select a project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>{project.title}</option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Assign To</label>
            <select value={formData.assignedTo}
              onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
              <option value="">Unassigned</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 mt-6">
            <button type="submit" disabled={loading}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50">
              {loading ? "Creating..." : "Create Task"}
            </button>
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

