import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_BASE } from '../config';

const PlanView = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [plan, setPlan] = useState(location.state?.plan || []);
    const [history, setHistory] = useState([]);
    const planId = location.state?.planId || null;

    useEffect(() => {
        if (planId) {
            const token = localStorage.getItem('token');
            fetch(`${API_BASE}/plans/${planId}`, {
                headers: { Authorization: `Bearer ${token}` }
            }).then(async (res) => {
                if (!res.ok) return;
                const data = await res.json();
                const mapped = data.plan.items.map((it) => ({ id: it.id, time: it.time, task: it.text, status: it.status, locked: !!it.locked }));
                setPlan(mapped);
            });
        }
    }, [planId]);

    const addToHistory = () => {
        setHistory(prev => [...prev, plan]);
    };

    const toggleTask = async (id) => {
        addToHistory();
        const item = plan.find(t => t.id === id);
        const nextStatus = item && item.status === 'completed' ? 'pending' : 'completed';
        setPlan(plan.map(t => t.id === id ? { ...t, status: nextStatus } : t));
        if (planId) {
            const token = localStorage.getItem('token');
            await fetch(`${API_BASE}/plans/${planId}/items/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ status: nextStatus })
            });
        }
    };

    const toggleLock = async (id) => {
        addToHistory();
        const item = plan.find(t => t.id === id);
        const nextLock = item ? !item.locked : false;
        setPlan(plan.map(t => t.id === id ? { ...t, locked: nextLock } : t));
        if (planId) {
            const token = localStorage.getItem('token');
            await fetch(`${API_BASE}/plans/${planId}/items/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ locked: nextLock })
            });
        }
    };

    const handleUndo = () => {
        if (history.length === 0) return;
        const previousPlan = history[history.length - 1];
        setHistory(prev => prev.slice(0, -1));
        setPlan(previousPlan);
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center p-6 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute bottom-0 right-0 w-full h-1 bg-gradient-to-l from-blue-500 to-purple-500"></div>

            <div className="w-full max-w-3xl z-10">
                <header className="flex justify-between items-center mb-10">
                    <h1 className="text-3xl font-bold text-white">Your Recovery Plan</h1>
                    <div className="flex gap-4">
                        <button
                            onClick={() => {
                                // Extract original tasks/context from plan items or state if available
                                // Since we don't store raw context in plan, we'll extract task text.
                                // Ideal solution would be passing context TO PlanView initially to pass back.
                                // For now, let's just pass back the list of tasks from the plan.
                                const currentTasks = plan
                                    .filter(item => !item.id.toString().startsWith('break')) // Exclude breaks
                                    .map(item => ({ id: item.id, text: item.task }));

                                navigate('/context', {
                                    state: {
                                        existingTasks: currentTasks,
                                        // We'd ideally want to pass back deadline/constraints too, 
                                        // but PlanView doesn't currently hold them in state.
                                        // For now, recovering the task list is the critical step.
                                    }
                                });
                            }}
                            className="text-slate-400 hover:text-white transition-colors"
                        >
                            Back to Edit
                        </button>
                        <button
                            onClick={() => {
                                const token = localStorage.getItem('token');
                                if (token) {
                                    fetch(`${API_BASE}/auth/logout`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
                                }
                                localStorage.removeItem('token');
                                navigate('/login');
                            }}
                            className="text-slate-400 hover:text-white transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </header>

                <div className="space-y-4">
                    {plan.map((item) => (
                        <div
                            key={item.id}
                            className={`group flex items-center p-4 rounded-xl border transition-all duration-300 ${item.status === 'completed'
                                ? 'bg-slate-900/40 border-slate-800 opacity-60'
                                : 'bg-slate-900/80 border-slate-700 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-900/20'
                                }`}
                        >
                            {/* Time Block */}
                            <div className="w-32 font-mono text-slate-400 text-sm border-r border-slate-700 mr-4 flex-shrink-0">
                                {item.time}
                            </div>

                            {/* Task Content */}
                            <div className="flex-1">
                                <p className={`font-medium text-lg ${item.status === 'completed' ? 'text-slate-500 line-through' : 'text-slate-100'}`}>
                                    {item.task}
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-3 ml-4 opacity-50 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => toggleLock(item.id)}
                                    className={`p-2 rounded-full hover:bg-slate-800 ${item.locked ? 'text-orange-400' : 'text-slate-600'}`}
                                    title={item.locked ? "Unlock Task" : "Lock Task"}
                                >
                                    {item.locked ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" /></svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M11 1a2 2 0 0 0-2 2v4a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h5V3a3 3 0 0 1 6 0v4a.5.5 0 0 1-1 0V3a2 2 0 0 0-2-2z" /></svg>
                                    )}
                                </button>

                                <input
                                    type="checkbox"
                                    checked={item.status === 'completed'}
                                    onChange={() => toggleTask(item.id)}
                                    className="w-6 h-6 rounded border-slate-600 bg-slate-800 text-green-500 focus:ring-offset-slate-900"
                                />
                            </div>
                        </div>
                    ))}
                    {plan.length === 0 && (
                        <p className="text-center text-slate-500">No plan generated yet. Try submitting some tasks.</p>
                    )}
                </div>

                <div className="mt-8 flex justify-between text-slate-500 text-sm">
                    <button
                        onClick={handleUndo}
                        disabled={history.length === 0}
                        className={`transition-colors ${history.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:text-white'}`}
                    >
                        Undo Changes
                    </button>
                    <button className="hover:text-red-400 transition-colors">Stop AI Logic</button>
                </div>
            </div>
        </div>
    );
};

export default PlanView;
