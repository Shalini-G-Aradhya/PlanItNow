import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import ContextForm from './pages/ContextForm';
import PlanView from './pages/PlanView';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/context" element={<ContextForm />} />
        <Route path="/plan" element={<PlanView />} />
      </Routes>
    </Router>
  );
}

export default App;
