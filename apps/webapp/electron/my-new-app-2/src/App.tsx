import { NavLink, Route, Routes } from 'react-router-dom';

function Home() {
  return (
    <div>
      <h1 className="text-3xl font-bold">Hello from Electron + React Router</h1>
      <p className="text-lg mt-4">
        This renderer is using <code>react-router-dom</code> v7.
      </p>
    </div>
  );
}

function About() {
  return (
    <div>
      <h1 className="text-3xl font-bold">About</h1>
      <p className="text-lg mt-4">Basic route navigation should work in Electron.</p>
    </div>
  );
}

function NotFound() {
  return (
    <div>
      <h1 className="text-3xl font-bold">404</h1>
      <p className="text-lg mt-4">Page not found.</p>
    </div>
  );
}

function App() {
  return (
    <div className="min-h-screen p-6">
      <header className="flex gap-3 border-b border-neutral-200 pb-4">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `text-sm font-medium ${isActive ? 'text-neutral-900' : 'text-neutral-500 hover:text-neutral-900'}`
          }
        >
          Home
        </NavLink>
        <NavLink
          to="/about"
          className={({ isActive }) =>
            `text-sm font-medium ${isActive ? 'text-neutral-900' : 'text-neutral-500 hover:text-neutral-900'}`
          }
        >
          About
        </NavLink>
      </header>

      <main className="pt-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
