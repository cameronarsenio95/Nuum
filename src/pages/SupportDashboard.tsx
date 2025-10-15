import { useSupportAuth } from '../contexts/SupportAuthContext';
import { SupportLogin } from './SupportLogin';

export function SupportDashboard() {
  const { user, supportStaff, loading } = useSupportAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-linear-bg light:bg-linear-light-bg">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-linear-accent border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 dark:text-text-secondary light:text-text-light-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !supportStaff) {
    return <SupportLogin />;
  }

  return (
    <div className="min-h-screen dark:bg-linear-bg light:bg-linear-light-bg p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-medium mb-4 dark:text-text-primary light:text-text-light-primary">Support Dashboard</h1>
        <p className="dark:text-text-secondary light:text-text-light-secondary">
          Welcome {supportStaff?.name}
        </p>
      </div>
    </div>
  );
}
