/**
 * Authentication Route Guard
 * Chức năng: Bảo vệ các route yêu cầu đăng nhập, tự động chuyển hướng người dùng về trang Login nếu không có Token.
 * Các thành phần chính: Kiểm tra trạng thái Authenticating, Redirect về /login nếu chưa đăng nhập.
 */
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { token, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-950">
                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!token) return <Navigate to="/login" replace />;
    return <>{children}</>;
}
