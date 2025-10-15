import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SupportAuthProvider } from './contexts/SupportAuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ProofMetrics } from './components/ProofMetrics';
import { Features } from './components/Features';
import { DashboardShowcase } from './components/DashboardShowcase';
import { MiniDemo } from './components/MiniDemo';
import { PricingPreview } from './components/PricingPreview';
import { Integrations } from './components/Integrations';
import { FAQ } from './components/FAQ';
import { FinalCTA } from './components/FinalCTA';
import { Footer } from './components/Footer';
import { SignupModal } from './components/modals/SignupModal';
import { DemoModal } from './components/modals/DemoModal';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { SupportDashboard } from './pages/SupportDashboard';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { PricingPage } from './pages/PricingPage';
import { ResourcesPage } from './pages/ResourcesPage';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsOfService } from './pages/TermsOfService';
type Page = 'landing' | 'how-it-works' | 'pricing' | 'resources' | 'login' | 'support' | 'privacy' | 'terms';

function LandingPage({
  onLoginClick,
  onHowItWorksClick,
  onPricingClick,
  onResourcesClick,
  onSignupClick,
  onDemoClick,
  onPrivacyClick,
  onTermsClick,
}: {
  onLoginClick: () => void;
  onHowItWorksClick: () => void;
  onPricingClick: () => void;
  onResourcesClick: () => void;
  onSignupClick: () => void;
  onDemoClick: () => void;
  onPrivacyClick: () => void;
  onTermsClick: () => void;
}) {
  const [activeSection, setActiveSection] = useState('hero');

  useEffect(() => {
    if (window.UGC?.track) {
      window.UGC.track('view_home');
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['hero', 'features', 'dashboard-showcase', 'how-it-works', 'pricing', 'integrations', 'faq'];
      const scrollPosition = window.scrollY + 200;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: elementPosition - offset, behavior: 'smooth' });
    }
  };

  const navItems = [
    { id: 'hero', label: 'Home' },
    { id: 'features', label: 'Features' },
    { id: 'dashboard-showcase', label: 'Dashboard' },
    { id: 'how-it-works', label: 'How It Works' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'integrations', label: 'Integrations' },
    { id: 'faq', label: 'FAQ' },
  ];

  return (
    <div className="min-h-screen">
      <Header
        onLoginClick={onLoginClick}
        onSignupClick={onSignupClick}
        onHowItWorksClick={onHowItWorksClick}
        onPricingClick={onPricingClick}
        onResourcesClick={onResourcesClick}
        onBackClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      />

      <div className="fixed left-8 top-1/2 -translate-y-1/2 z-30 hidden lg:block">
        <nav className="space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className={`block w-2 h-2 rounded-full linear-transition ${
                activeSection === item.id ? 'bg-linear-accent w-8' : 'bg-white/20 hover:bg-white/40'
              }`}
              aria-label={`Navigate to ${item.label}`}
            />
          ))}
        </nav>
      </div>

      <Hero onSignupClick={onSignupClick} onDemoClick={onDemoClick} />
      <Features />
      <DashboardShowcase />
      <MiniDemo onDemoClick={onDemoClick} />
      <PricingPreview onSignupClick={onSignupClick} />
      <Integrations />
      <FAQ />
      <FinalCTA onSignupClick={onSignupClick} onHowItWorksClick={onHowItWorksClick} />
      <Footer onPrivacyClick={onPrivacyClick} onTermsClick={onTermsClick} />
    </div>
  );
}

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>(() => {
    if (window.location.pathname === '/support') {
      return 'support';
    }
    return 'landing';
  });
  const [signupModalOpen, setSignupModalOpen] = useState(false);
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname === '/support') {
        setCurrentPage('support');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleSignupClick = () => {
    setSignupModalOpen(true);
    if (window.UGC?.track) {
      window.UGC.track('open_signup_modal');
    }
  };

  if (currentPage === 'support') {
    return (
      <SupportAuthProvider>
        <SupportDashboard />
      </SupportAuthProvider>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-bg flex items-center justify-center">
        <div className="text-text-secondary">Loading...</div>
      </div>
    );
  }

  if (!user) {
    if (currentPage === 'how-it-works') {
      return (
        <HowItWorksPage
          onBackClick={() => setCurrentPage('landing')}
          onLoginClick={handleSignupClick}
          onSignupClick={handleSignupClick}
          onPricingClick={() => setCurrentPage('pricing')}
          onResourcesClick={() => setCurrentPage('resources')}
          onHowItWorksClick={() => setCurrentPage('how-it-works')}
        />
      );
    }

    if (currentPage === 'pricing') {
      return (
        <PricingPage
          onBackClick={() => setCurrentPage('landing')}
          onLoginClick={handleSignupClick}
          onSignupClick={handleSignupClick}
          onPricingClick={() => setCurrentPage('pricing')}
          onResourcesClick={() => setCurrentPage('resources')}
          onHowItWorksClick={() => setCurrentPage('how-it-works')}
        />
      );
    }

    if (currentPage === 'resources') {
      return (
        <ResourcesPage
          onBackClick={() => setCurrentPage('landing')}
          onLoginClick={handleSignupClick}
          onSignupClick={handleSignupClick}
          onPricingClick={() => setCurrentPage('pricing')}
          onResourcesClick={() => setCurrentPage('resources')}
          onHowItWorksClick={() => setCurrentPage('how-it-works')}
        />
      );
    }

    if (currentPage === 'privacy') {
      return (
        <PrivacyPolicy
          onBackClick={() => setCurrentPage('landing')}
          onLoginClick={handleSignupClick}
          onSignupClick={handleSignupClick}
          onPricingClick={() => setCurrentPage('pricing')}
          onResourcesClick={() => setCurrentPage('resources')}
          onHowItWorksClick={() => setCurrentPage('how-it-works')}
        />
      );
    }

    if (currentPage === 'terms') {
      return (
        <TermsOfService
          onBackClick={() => setCurrentPage('landing')}
          onLoginClick={handleSignupClick}
          onSignupClick={handleSignupClick}
          onPricingClick={() => setCurrentPage('pricing')}
          onResourcesClick={() => setCurrentPage('resources')}
          onHowItWorksClick={() => setCurrentPage('how-it-works')}
        />
      );
    }

    if (currentPage === 'login') {
      return <Login onClose={() => setCurrentPage('landing')} />;
    }

    return (
      <>
        <LandingPage
          onLoginClick={() => setCurrentPage('login')}
          onHowItWorksClick={() => setCurrentPage('how-it-works')}
          onPricingClick={() => setCurrentPage('pricing')}
          onResourcesClick={() => setCurrentPage('resources')}
          onSignupClick={handleSignupClick}
          onDemoClick={() => setDemoModalOpen(true)}
          onPrivacyClick={() => setCurrentPage('privacy')}
          onTermsClick={() => setCurrentPage('terms')}
        />
        <SignupModal isOpen={signupModalOpen} onClose={() => setSignupModalOpen(false)} />
        <DemoModal isOpen={demoModalOpen} onClose={() => setDemoModalOpen(false)} />
      </>
    );
  }

  return <Dashboard />;
}

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <NotificationProvider>
            <AppContent />
          </NotificationProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
