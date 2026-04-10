import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ user, roles = [], children }) {
  if (!user) return <Navigate to="/login" replace />;
  if (roles.length && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
}