import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';

// Exemplo de página protegida
const Projects = () => {
  const { user, tenant, logout } = useAuth();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
              {tenant && (
                <p className="text-sm text-gray-500">Tenant: {tenant.name}</p>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, {user?.username}!
              </span>
              <button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900">Projects Dashboard</h2>
              <p className="mt-2 text-gray-600">
                This is a protected page. Only authenticated users can see this.
              </p>
              {user && (
                <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                  <h3 className="font-medium text-gray-900">User Info:</h3>
                  <p className="text-sm text-gray-600">ID: {user.id}</p>
                  <p className="text-sm text-gray-600">Username: {user.username}</p>
                  <p className="text-sm text-gray-600">Email: {user.email}</p>
                  {tenant && (
                    <>
                      <p className="text-sm text-gray-600">Tenant: {tenant.name}</p>
                      <p className="text-sm text-gray-600">Schema: {tenant.schema_name}</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/projects"
              element={
                <ProtectedRoute>
                  <Projects />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/projects" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
