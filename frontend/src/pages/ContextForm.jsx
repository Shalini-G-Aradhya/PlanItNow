import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_BASE } from '../config';

const ContextForm = () => {
    const navigate = useNavigate();
    const location = useLocation(); // Add hook
    const [tasks, setTasks] = useState(location.state?.existingTasks || []);
    const [currentTask, setCurrentTask] = useState('');
    const [deadline, setDeadline] = useState('');
    const [constraints, setConstraints] = useState('');

    useEffect(() => {
    }, []);

    const addTask = (e) => {
        e.preventDefault();
        if (!currentTask.trim()) return;
        setTasks([...tasks, { id: Date.now(), text: currentTask }]);
        setCurrentTask('');
    };

    const removeTask = (id) => {
        setTasks(tasks.filter(t => t.id !== id));
    };

    const handleSubmit = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/generate-plan`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    deadline,
                    tasks,
                    constraints
                }),
            });

            if (response.ok) {
                const data = await response.json();
                navigate('/plan', { state: { plan: data.plan, planId: data.plan_id } });
            } else {
                console.error('Failed to generate plan');
            }
        } catch (error) {
            console.error('Error connecting to backend:', error);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500"></div>

            <div className="w-full max-w-2xl z-10">
                <div className="flex justify-end mb-4">
                    <button
                        onClick={() => {
                            const token = localStorage.getItem('token');
                            if (token) {
                                fetch('http://localhost:8000/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
                            }
                            localStorage.removeItem('token');
                            navigate('/login');
                        }}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        Logout
                    </button>
                </div>
                <h2 className="text-3xl font-bold text-white mb-8 text-center">What's the Panic?</h2>

                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl">

                    {/* Deadline Input */}
                    <div className="mb-8">
                        <label className="block text-slate-400 text-sm uppercase tracking-wider mb-2">Hard Deadline</label>
                        <input
                            type="datetime-local"
                            value={deadline}
                            onChange={(e) => setDeadline(e.target.value)}
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
                        />
                    </div>

                    {/* Task List Input */}
                    <div className="mb-8">
                        <label className="block text-slate-400 text-sm uppercase tracking-wider mb-2">Tasks to Crush</label>
                        <div className="flex gap-2 mb-4">
                            <input
                                type="text"
                                value={currentTask}
                                onChange={(e) => setCurrentTask(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && addTask(e)}
                                placeholder="e.g. Write Introduction Section"
                                className="flex-1 bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                            />
                            <button
                                onClick={addTask}
                                className="bg-slate-800 hover:bg-slate-700 text-white px-6 rounded-lg font-medium transition-colors"
                            >
                                Add
                            </button>
                        </div>

                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                            {tasks.map(task => (
                                <div key={task.id} className="flex items-center justify-between bg-slate-900/30 p-3 rounded border border-white/5 animate-fade-in-up">
                                    <span className="text-slate-200">{task.text}</span>
                                    <button
                                        onClick={() => removeTask(task.id)}
                                        className="text-slate-500 hover:text-red-400 transition-colors"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                            {tasks.length === 0 && (
                                <p className="text-slate-600 text-sm italic text-center py-4">No tasks added yet.</p>
                            )}
                        </div>
                    </div>

                    {/* Constraints Input */}
                    <div className="mb-8">
                        <label className="block text-slate-400 text-sm uppercase tracking-wider mb-2">Constraints / Context</label>
                        <textarea
                            value={constraints}
                            onChange={(e) => setConstraints(e.target.value)}
                            placeholder="e.g. I have a meeting at 2pm, need 5 min breaks every hour."
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 h-24 resize-none transition-colors"
                        />
                    </div>

                    {/* Action Button */}
                    <button
                        onClick={handleSubmit}
                        className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold py-4 rounded-xl shadow-lg transform transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        GENERATE RECOVERY PLAN
                    </button>

                </div>
            </div>
        </div>
    );
};

export default ContextForm;
