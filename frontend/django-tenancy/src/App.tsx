import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import Header from './components/Header';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import ProjectList from './pages/ProjectList';
import ProjectCreate from './pages/ProjectCreate';
import type { User } from './types';

function App() {
  const [user, setUser] = useState<User | null>(null);

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {user && <Header user={user} onLogout={handleLogout} />}
        
        <Routes>
          <Route 
            path="/login" 
            element={!user ? <Login /> : <Navigate to="/projects" replace />} 
          />
          <Route 
            path="/register" 
            element={!user ? <Register /> : <Navigate to="/projects" replace />} 
          />
          <Route 
            path="/profile" 
            element={user ? <Profile user={user} /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/projects" 
            element={user ? <ProjectList /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/projects/create" 
            element={user ? <ProjectCreate /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/" 
            element={<Navigate to={user ? "/projects" : "/login"} replace />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
