import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="grid min-h-screen place-items-center p-6">
      <div className="max-w-md text-center">
        <div className="text-6xl font-bold text-ey-yellow">404</div>
        <h1 className="mt-4 text-2xl font-bold text-ey-black">Page not found</h1>
        <p className="mt-2 text-sm text-ey-gray-500">The page you are looking for does not exist or may have moved.</p>
        <Link className="btn-primary mt-6" to="/dashboard">Go to dashboard</Link>
      </div>
    </div>
  );
}
