import AdminNavbar from './AdminNavbar';

function AdminLayout({ children }) {
    return (
        <div className="min-h-screen bg-gray-50">
            <AdminNavbar />
            <main className="max-w-6xl mx-auto px-6 py-8">
                {children}
            </main>
        </div>
    );
}

export default AdminLayout;