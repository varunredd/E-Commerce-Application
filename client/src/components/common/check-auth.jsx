import PropTypes from 'prop-types';
import { Navigate, useLocation } from 'react-router-dom';

function CheckAuth({ isAuthenticated, user, children }) {
    const location = useLocation();

    if (!isAuthenticated && !(location.pathname.includes('/login') || location.pathname.includes('/register'))) {
        return <Navigate to="/auth/login" />;
    }
    if (isAuthenticated && (location.pathname.includes('/login') || location.pathname.includes('/register'))) {
        if ((user?.role === 'admin' || user?.role === 'super_admin')) {
            return <Navigate to="/admin/dashboard" />;
        } else {
            return <Navigate to="/shop/home" />;
        }
    }
    if (isAuthenticated && user?.role !== 'admin' && user?.role !== 'super_admin' && location.pathname.includes('/admin')) {
        return <Navigate to="/unauth-page" />;
    }
    if (isAuthenticated && (user?.role === 'admin' || user?.role === 'super_admin') && location.pathname.includes('/shop')) {
        return <Navigate to="/admin/dashboard" />;
    }
    return <>{children}</>;
}

CheckAuth.propTypes = {
    isAuthenticated: PropTypes.bool,
    user: PropTypes.shape({
        role: PropTypes.string,
        // add other user properties as needed
    }),
    children: PropTypes.node,
};

export default CheckAuth;
