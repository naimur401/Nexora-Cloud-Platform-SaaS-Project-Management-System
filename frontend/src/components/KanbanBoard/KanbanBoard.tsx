import { useState, useEffect } from "react";
import toast from "react-hot-toast";

interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
}

interface KanbanBoardProps {
  tasks: Task[];
  onTaskStatusChange: (taskId: number, newStatus: string) => Promise<void>;
}

const columns = [
  { id: "TODO", title: "To Do", bgColor: "bg-yellow-100", borderColor: "border-yellow-400" },
  { id: "IN_PROGRESS", title: "In Progress", bgColor: "bg-blue-100", borderColor: "border-blue-400" },
  { id: "DONE", title: "Done", bgColor: "bg-green-100", borderColor: "border-green-400" },
];

export default function KanbanBoard({ tasks, onTaskStatusChange }: KanbanBoardProps) {
  const [columnTasks, setColumnTasks] = useState<Record<string, Task[]>>({
    TODO: [], IN_PROGRESS: [], DONE: []
  });

  useEffect(() => {
    setColumnTasks({
      TODO: tasks.filter(t => t.status === "TODO"),
      IN_PROGRESS: tasks.filter(t => t.status === "IN_PROGRESS"),
      DONE: tasks.filter(t => t.status === "DONE"),
    });
  }, [tasks]);

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleDragStart = (e: React.DragEvent, taskId: number) => {
    e.dataTransfer.setData("taskId", taskId.toString());
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const taskId = parseInt(e.dataTransfer.getData("taskId"));
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === newStatus) return;

    try {
      await onTaskStatusChange(taskId, newStatus);
      toast.success("Task moved to " + newStatus);
    } catch {
      toast.error("Failed to update task");
    }
  };

  const getPriorityColor = (priority: string) => {
    if (priority === "HIGH") return "bg-red-100 text-red-800";
    if (priority === "MEDIUM") return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {columns.map((column) => (
        <div key={column.id} className="bg-gray-50 rounded-lg">
          <div className={"p-4 rounded-t-lg border-b-4 " + column.bgColor + " " + column.borderColor}>
            <h3 className="font-bold">{column.title}</h3>
            <p className="text-sm text-gray-600">{columnTasks[column.id].length} tasks</p>
          </div>
          <div className="p-4 min-h-96"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}>
            {columnTasks[column.id].map((task) => (
              <div key={task.id} draggable
                onDragStart={(e) => handleDragStart(e, task.id)}
                className="bg-white rounded-lg p-4 mb-3 shadow-md hover:shadow-lg cursor-grab transition">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-gray-800 text-sm">{task.title}</h4>
                  <span className={"text-xs px-2 py-1 rounded " + getPriorityColor(task.priority)}>
                    {task.priority}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{task.description}</p>
              </div>
            ))}
            {columnTasks[column.id].length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
                Drop tasks here
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
