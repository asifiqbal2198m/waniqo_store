import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function AdminRoute({ children }) {
  const { isAuthenticated, user } = useAuth();

  // If user is not logged in or is not an administrator, block access and redirect to home
  if (!isAuthenticated || !user?.isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default AdminRoute;
