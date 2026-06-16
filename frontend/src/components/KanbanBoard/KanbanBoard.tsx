import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import toast from 'react-hot-toast';

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
  { id: 'TODO', title: '📝 To Do', color: 'bg-yellow-100', borderColor: 'border-yellow-400' },
  { id: 'IN_PROGRESS', title: '🔄 In Progress', color: 'bg-blue-100', borderColor: 'border-blue-400' },
  { id: 'DONE', title: '✅ Done', color: 'bg-green-100', borderColor: 'border-green-400' }
];

export default function KanbanBoard({ tasks, onTaskStatusChange }: KanbanBoardProps) {
  const [columnTasks, setColumnTasks] = useState<Record<string, Task[]>>({
    TODO: [],
    IN_PROGRESS: [],
    DONE: []
  });

  useEffect(() => {
    const grouped = {
      TODO: tasks.filter(t => t.status === 'TODO'),
      IN_PROGRESS: tasks.filter(t => t.status === 'IN_PROGRESS'),
      DONE: tasks.filter(t => t.status === 'DONE')
    };
    setColumnTasks(grouped);
  }, [tasks]);

  const handleDragEnd = async (result: any) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const sourceColumn = [...columnTasks[source.droppableId]];
    const destColumn = [...columnTasks[destination.droppableId]];
    const [movedTask] = sourceColumn.splice(source.index, 1);
    
    // Update task status
    const newStatus = destination.droppableId;
    movedTask.status = newStatus;
    
    if (source.droppableId === destination.droppableId) {
      sourceColumn.splice(destination.index, 0, movedTask);
      setColumnTasks({
        ...columnTasks,
        [source.droppableId]: sourceColumn
      });
    } else {
      destColumn.splice(destination.index, 0, movedTask);
      setColumnTasks({
        ...columnTasks,
        [source.droppableId]: sourceColumn,
        [destination.droppableId]: destColumn
      });
    }
    
    // Call API
    try {
      await onTaskStatusChange(parseInt(draggableId), newStatus);
      toast.success(Task moved to );
    } catch (error) {
      toast.error('Failed to update task status');
      // Revert on error
      const revertedTasks = tasks.filter(t => t.id === parseInt(draggableId));
      if (revertedTasks.length > 0) {
        const originalStatus = revertedTasks[0].status;
        movedTask.status = originalStatus;
        // Revert UI logic here if needed
      }
    }
  };

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'HIGH': return 'bg-red-100 text-red-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map((column) => (
          <div key={column.id} className="bg-gray-50 rounded-lg p-4">
            <div className={\mb-4 p-3 rounded-lg \ border-l-4 \\}>
              <h3 className="font-bold text-lg">{column.title}</h3>
              <p className="text-sm text-gray-600">{columnTasks[column.id].length} tasks</p>
            </div>
            
            <Droppable droppableId={column.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={\min-h-[500px] rounded-lg transition-colors \\}
                >
                  {columnTasks[column.id].map((task, index) => (
                    <Draggable key={task.id.toString()} draggableId={task.id.toString()} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={\g-white rounded-lg p-4 mb-3 shadow-md hover:shadow-lg transition cursor-move \\}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-gray-800">{task.title}</h4>
                            <span className={\	ext-xs px-2 py-1 rounded \\}>
                              {task.priority}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                          <div className="flex justify-between items-center text-xs text-gray-400">
                            <span>Task #{task.id}</span>
                            <span>📅 No deadline</span>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  
                  {columnTasks[column.id].length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      No tasks in {column.title}
                    </div>
                  )}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}
