import Navbar from './Navbar';

function Layout({ children, wide = false }) {
  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <main className={`mx-auto px-6 py-10 ${wide ? 'max-w-7xl' : 'max-w-5xl'}`}>
        {children}
      </main>
    </div>
  );
}

export default Layout;