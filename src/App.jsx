import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { Home, Clock, BarChart2, User } from 'lucide-react';
import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import History from './components/History';
import Analytics from './components/Analytics';
import Profile from './components/Profile';
import './index.css';

function Navbar() {
  return (
    <nav className="bottom-nav">
      <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Home size={20} />
        <span className="nav-label">Home</span>
      </NavLink>

      <NavLink to="/history" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Clock size={20} />
        <span className="nav-label">History</span>
      </NavLink>

      <div className="nav-fab-wrap">
        <NavLink to="/add" className="nav-fab">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </NavLink>
      </div>

      <NavLink to="/analytics" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <BarChart2 size={20} />
        <span className="nav-label">Analytics</span>
      </NavLink>

      <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <User size={20} />
        <span className="nav-label">Profile</span>
      </NavLink>
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/add" element={<TransactionForm />} />
          <Route path="/history" element={<History />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
        <Navbar />
      </div>
    </BrowserRouter>
  );
}

export default App;
