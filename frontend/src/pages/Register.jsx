import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../config';

const Register = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setOk(false);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) {
        setError('Registration failed');
        return;
      }
      setOk(true);
      const login = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (login.ok) {
        const data = await login.json();
        localStorage.setItem('token', data.token);
        navigate('/dashboard');
      }
    } catch {
      setError('Network error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-2xl p-6">
        <h1 className="text-xl font-bold text-white mb-4">Create Account</h1>
        {error && <p className="text-red-400 mb-2 text-sm">{error}</p>}
        {ok && <p className="text-green-400 mb-2 text-sm">Account created</p>}
        <form onSubmit={submit} className="space-y-3">
          <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="Email" className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white" />
          <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Password" className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white" />
          <button type="submit" className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white font-semibold py-3 rounded-lg">Register</button>
        </form>
        <button onClick={()=>navigate('/login')} className="mt-3 w-full text-slate-400 hover:text-white">Sign in</button>
      </div>
    </div>
  );
};

export default Register;
