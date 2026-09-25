import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../services/axios.config';
import toast from 'react-hot-toast';

interface Comment {
  id: number;
  content: string;
  user_id: number;
  user_name: string;
  user_email: string;
  created_at: string;
}

export default function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState<any>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const user = localStorage.getItem('user');
    setCurrentUser(user ? JSON.parse(user) : null);
    fetchTaskAndComments();
  }, [id]);

  const fetchTaskAndComments = async () => {
    try {
      const [taskRes, commentsRes] = await Promise.all([
        axios.get('/tasks'),
        axios.get('/tasks/' + id + '/comments')
      ]);
      const foundTask = taskRes.data.data.find((t: any) => t.id === parseInt(id!));
      setTask(foundTask);
      setComments(commentsRes.data.data);
    } catch (error) {
      toast.error('Failed to load task');
    } finally {
      setLoading(false);
    }
  };

  const addComment = async () => {
    if (!newComment.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }
    try {
      const response = await axios.post('/tasks/' + id + '/comments', { content: newComment });
      setComments([...comments, response.data.data]);
      setNewComment('');
      toast.success('Comment added');
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  const deleteComment = async (commentId: number) => {
    if (!confirm('Delete this comment?')) return;
    try {
      await axios.delete('/comments/' + commentId);
      setComments(comments.filter(c => c.id !== commentId));
      toast.success('Comment deleted');
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!task) return <div className="min-h-screen flex items-center justify-center">Task not found</div>;

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <button onClick={() => navigate(-1)} className="mb-4 text-purple-600 hover:underline">← Back</button>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-2xl font-bold">{task.title}</h1>
            <span className={'px-3 py-1 rounded text-sm ' + (
              task.status === 'TODO' ? 'bg-yellow-100 text-yellow-800' :
              task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
              'bg-green-100 text-green-800'
            )}>
              {task.status}
            </span>
          </div>
          <p className="text-gray-600 mb-4">{task.description || 'No description'}</p>
          <div className="flex gap-4 text-sm">
            <span className="text-gray-500">Priority: <strong>{task.priority}</strong></span>
            <span className="text-gray-500">Task #{task.id}</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Comments ({comments.length})</h2>

          <div className="mb-6">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="w-full px-3 py-2 border rounded-lg mb-2 focus:ring-2 focus:ring-purple-600"
              rows={3}
            />
            <button
              onClick={addComment}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Post Comment
            </button>
          </div>

          <div className="space-y-4">
            {comments.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No comments yet. Be the first!</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="border-l-4 border-purple-500 pl-4 py-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold">{comment.user_name || 'User'}</div>
                      <div className="text-xs text-gray-500">{new Date(comment.created_at).toLocaleString()}</div>
                    </div>
                    {(currentUser?.id === comment.user_id || currentUser?.role === 'SUPER_ADMIN') && (
                      <button
                        onClick={() => deleteComment(comment.id)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                  <p className="mt-2 text-gray-700">{comment.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}