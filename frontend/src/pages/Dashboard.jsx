import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../config';

const Dashboard = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`${API_BASE}/plans`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(async (res) => {
      if (!res.ok) {
        setError('Failed to load');
        return;
      }
      const data = await res.json();
      setPlans(data.plans || []);
    }).catch(() => setError('Network error'));
  }, []);

  const viewPlan = async (id) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/plans/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return;
    const data = await res.json();
    const mapped = data.plan.items.map((it) => ({ id: it.id, time: it.time, task: it.text, status: it.status, locked: !!it.locked }));
    navigate('/plan', { state: { plan: mapped, planId: id } });
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl text-white font-bold">Dashboard</h1>
          <div className="flex gap-2">
            <button onClick={()=>navigate('/context')} className="bg-blue-600 text-white px-4 py-2 rounded-lg">New Plan</button>
            <button onClick={()=>{localStorage.removeItem('token'); navigate('/login');}} className="bg-slate-800 text-white px-4 py-2 rounded-lg">Logout</button>
          </div>
        </div>
        {error && <p className="text-red-400 mb-2 text-sm">{error}</p>}
        <div className="grid grid-cols-1 gap-3">
          {plans.map((p) => (
            <div key={p.id} className="bg-slate-900/70 border border-slate-700 rounded-xl p-4 flex justify-between items-center">
              <div>
                <p className="text-white font-medium">Plan #{p.id}</p>
                <p className="text-slate-400 text-sm">Deadline: {p.deadline || 'N/A'}</p>
              </div>
              <button onClick={()=>viewPlan(p.id)} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg">View</button>
            </div>
          ))}
          {plans.length === 0 && <p className="text-slate-500">No plans yet.</p>}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
