import React from 'react';
import { Routes, Route, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutGrid,
  Building2,
  ScanLine,
  Users,
  MapPin,
  Route as RouteIcon,
  Activity,
  Car,
  Ticket,
  MessageCircle,
  Wallet,
  HelpCircle,
  LogOut,
  Search,
  Bell,
  Zap,
  Menu,
  X,
} from 'lucide-react';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import ActivitiesPage from './pages/ActivitiesPage';
import IncomePage from './pages/IncomePage';
import HotpointsPage from './pages/HotpointsPage';
import RoutesPage from './pages/RoutesPage';
import DisputesPage from './pages/DisputesPage';
import TicketsPage from './pages/TicketsPage';
import VehiclesPage from './pages/VehiclesPage';
import ScannerOperatorsPage from './pages/ScannerOperatorsPage';
import AgencyManagementPage from './pages/AgencyManagementPage';
import LoginPage from './pages/LoginPage';
import { AdminScopeProvider } from './context/AdminScopeContext';
import type { AdminUser } from './types';

const ROUTE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/agency-management': 'Agencies',
  '/scanner-operators': 'Scanner operators',
  '/users': 'Users',
  '/hotpoints': 'Hot points',
  '/routes': 'Routes',
  '/activities': 'Activities',
  '/tickets': 'Tickets',
  '/vehicles': 'Vehicles',
  '/disputes': 'Disputes',
  '/income': 'Income',
};

type VisibleFor = 'all' | 'system' | 'agency';

// Super admin: Overview + Operations (Agencies, Users, Hot points, Routes, Activities, Vehicles) + Support + Finance.
// Agency admin: Overview + Agency (My agency, Scanner operators) + Operations (Users, Routes, Activities, Vehicles) + Support + Finance.
// Scanner operators are the agency's users, created by the agency admin; they appear under Agency.
const NAV_SECTIONS: {
  label: string;
  links: {
    to: string;
    label: string;
    labelForAgency?: string;
    end?: boolean;
    icon: React.ReactNode;
    visibleFor?: VisibleFor;
  }[];
}[] = [
  {
    label: 'Overview',
    links: [
      { to: '/', label: 'Dashboard', end: true, icon: <LayoutGrid size={20} />, visibleFor: 'all' },
    ],
  },
  {
    label: 'Agency',
    links: [
      { to: '/agency-management', label: 'Agencies', end: true, icon: <Building2 size={20} />, visibleFor: 'system' },
      { to: '/agency-management', label: 'My agency', end: true, icon: <Building2 size={20} />, visibleFor: 'agency' },
      { to: '/scanner-operators', label: 'Scanner operators', icon: <ScanLine size={20} />, visibleFor: 'agency' },
    ],
  },
  {
    label: 'Operations',
    links: [
      { to: '/users', label: 'Users', icon: <Users size={20} />, visibleFor: 'all' },
      { to: '/hotpoints', label: 'Hot points', icon: <MapPin size={20} />, visibleFor: 'system' },
      { to: '/routes', label: 'Routes', icon: <RouteIcon size={20} />, visibleFor: 'all' },
      { to: '/activities', label: 'Activities', icon: <Activity size={20} />, visibleFor: 'all' },
      { to: '/vehicles', label: 'Vehicles', icon: <Car size={20} />, visibleFor: 'all' },
    ],
  },
  {
    label: 'Support',
    links: [
      { to: '/tickets', label: 'Tickets', icon: <Ticket size={20} />, visibleFor: 'all' },
      { to: '/disputes', label: 'Disputes', icon: <MessageCircle size={20} />, visibleFor: 'all' },
    ],
  },
  {
    label: 'Finance',
    links: [{ to: '/income', label: 'Income', icon: <Wallet size={20} />, visibleFor: 'all' }],
  },
];

function isLinkVisible(visibleFor: VisibleFor | undefined, adminType: AdminUser['adminType']): boolean {
  if (!visibleFor || visibleFor === 'all') return true;
  if (adminType === 'system') return visibleFor === 'system';
  if (adminType === 'agency') return visibleFor === 'agency';
  return true;
}

interface LayoutProps {
  user: AdminUser;
  onLogout: () => void;
}

function Layout({ user, onLogout }: LayoutProps) {
  const location = useLocation();
  const title = ROUTE_TITLES[location.pathname] ?? 'Dashboard';
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  // Close drawer when route changes (e.g. after clicking a nav link)
  React.useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen bg-surface font-sans text-dark">
      {/* Backdrop for mobile drawer */}
      <button
        type="button"
        aria-label="Close menu"
        onClick={() => setSidebarOpen(false)}
        className={`fixed inset-0 z-20 bg-black/30 transition-opacity lg:hidden ${
          sidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* Sidebar: overlay drawer below lg, in-flow on lg+ */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-primary flex flex-col h-screen shadow-xl transition-transform duration-200 ease-out lg:static lg:translate-x-0 lg:shrink-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 lg:p-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-dark rounded-xl flex items-center justify-center shrink-0">
              <Zap className="text-primary" size={24} fill="#FEE46B" />
            </div>
            <span className="font-black text-2xl tracking-tight text-dark">ihute</span>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
            className="lg:hidden p-2 rounded-xl text-dark hover:bg-dark/10"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {NAV_SECTIONS.map((section) => {
            const visibleLinks = section.links.filter((link) =>
              isLinkVisible(link.visibleFor, user.adminType)
            );
            if (visibleLinks.length === 0) return null;
            return (
              <div key={section.label}>
                <p className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-dark/60">
                  {section.label}
                </p>
                {visibleLinks.map(({ to, label, labelForAgency, end, icon }) => {
                  const displayLabel = user.adminType === 'agency' && labelForAgency != null ? labelForAgency : label;
                  return (
                    <NavLink
                      key={to}
                      to={to}
                      end={end ?? false}
                      className={({ isActive }) =>
                        `w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition-all mb-2 ${
                          isActive
                            ? 'bg-dark text-primary shadow-lg'
                            : 'text-dark hover:bg-dark/10'
                        }`
                      }
                    >
                      {icon}
                      {displayLabel}
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </nav>

        <div className="p-6 border-t border-dark/10 space-y-2">
          <a href="#support" className="w-full flex items-center gap-4 px-4 py-3 text-dark font-bold hover:bg-dark/10 rounded-xl">
            <HelpCircle size={20} /> Support
          </a>
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center gap-4 px-4 py-3 text-accent font-bold hover:bg-accent/10 rounded-xl"
          >
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top navbar: responsive padding and search */}
        <header className="h-20 bg-white border-b border-soft px-4 lg:px-10 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1 lg:flex-initial">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
              className="lg:hidden p-2 rounded-xl text-dark hover:bg-surface shrink-0"
            >
              <Menu size={24} />
            </button>
            <div className="relative w-full max-w-md lg:w-96 min-w-0">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted shrink-0" size={18} />
              <input
                type="text"
                placeholder="Search data, transactions, files..."
                className="w-full py-2 pl-12 pr-4 bg-surface rounded-xl text-sm border-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-6 shrink-0">
            <div className="p-2 text-muted hover:text-dark cursor-pointer relative">
              <Bell size={22} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full" />
            </div>
            <div className="flex items-center gap-2 sm:gap-3 border-l pl-3 sm:pl-6 border-soft">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold truncate max-w-[120px]">{user.name}</p>
                <p className="text-[10px] text-muted font-bold uppercase tracking-widest">
                  {user.adminType === 'agency' ? 'Agency Admin' : 'System Admin'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-soft border-2 border-primary flex items-center justify-center font-bold text-dark shrink-0">
                {user.name[0]}
              </div>
            </div>
          </div>
        </header>

        {/* Page title + content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10">
          <h1 className="text-xl sm:text-2xl font-black text-dark mb-6">{title}</h1>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default function App() {
  const [authedUser, setAuthedUser] = React.useState<AdminUser | null>(null);

  if (!authedUser) {
    return <LoginPage onLogin={setAuthedUser} />;
  }

  const scope =
    authedUser?.adminType === 'agency' && authedUser.agencyId
      ? { agencyId: authedUser.agencyId }
      : undefined;

  return (
    <AdminScopeProvider scope={scope}>
      <Routes>
        <Route
          path="/"
          element={<Layout user={authedUser} onLogout={() => setAuthedUser(null)} />}
        >
          <Route index element={<DashboardPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="hotpoints" element={<HotpointsPage />} />
          <Route path="routes" element={<RoutesPage />} />
          <Route path="activities" element={<ActivitiesPage />} />
          <Route path="tickets" element={<TicketsPage />} />
          <Route path="vehicles" element={<VehiclesPage />} />
          <Route path="scanner-operators" element={<ScannerOperatorsPage />} />
          <Route path="agency-management" element={<AgencyManagementPage />} />
          <Route path="disputes" element={<DisputesPage />} />
          <Route path="income" element={<IncomePage />} />
        </Route>
      </Routes>
    </AdminScopeProvider>
  );
}
