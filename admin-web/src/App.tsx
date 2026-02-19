import React, { useState } from 'react';
import { Routes, Route, NavLink, Outlet, useLocation } from 'react-router-dom';
import DashboardPage   from './pages/DashboardPage';
import UsersPage       from './pages/UsersPage';
import ActivitiesPage  from './pages/ActivitiesPage';
import IncomePage      from './pages/IncomePage';
import HotpointsPage   from './pages/HotpointsPage';
import RoutesPage      from './pages/RoutesPage';
import DisputesPage    from './pages/DisputesPage';
import TicketsPage     from './pages/TicketsPage';
import VehiclesPage    from './pages/VehiclesPage';
import ScannerOperatorsPage from './pages/ScannerOperatorsPage';
import AgencyManagementPage from './pages/AgencyManagementPage';
import LoginPage       from './pages/LoginPage';
import PageHeader      from './components/PageHeader';
import { NavIcons }    from './components/NavIcons';
import { AdminScopeProvider } from './context/AdminScopeContext';
import type { AdminUser } from './types';

const ROUTE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/agency-management': 'Agency',
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

const NAV_SECTIONS: {
  label: string;
  links: {
    to: string;
    label: string;
    labelForAgency?: string;
    end?: boolean;
    icon: keyof typeof NavIcons;
    visibleFor?: VisibleFor;
  }[];
}[] = [
  {
    label: 'Overview',
    links: [{ to: '/', label: 'Dashboard', end: true, icon: 'overview', visibleFor: 'all' }],
  },
  {
    label: 'Operations',
    links: [
      { to: '/agency-management', label: 'Agency', labelForAgency: 'My agency', icon: 'agency', visibleFor: 'all' },
      { to: '/scanner-operators', label: 'Scanner operators', icon: 'scanner', visibleFor: 'all' },
      { to: '/users', label: 'Users', icon: 'users', visibleFor: 'all' },
      { to: '/hotpoints', label: 'Hot points', icon: 'hotpoints', visibleFor: 'system' },
      { to: '/routes', label: 'Routes', icon: 'routes', visibleFor: 'all' },
      { to: '/activities', label: 'Activities', icon: 'activities', visibleFor: 'all' },
      { to: '/vehicles', label: 'Vehicles', icon: 'vehicles', visibleFor: 'all' },
    ],
  },
  {
    label: 'Support',
    links: [
      { to: '/tickets', label: 'Tickets', icon: 'tickets', visibleFor: 'all' },
      { to: '/disputes', label: 'Disputes', icon: 'disputes', visibleFor: 'all' },
    ],
  },
  {
    label: 'Finance',
    links: [{ to: '/income', label: 'Income', icon: 'income', visibleFor: 'all' }],
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

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <img src="/logo.png" className="app-logo-img" alt="ihute" />
        </div>

        <nav>
          {NAV_SECTIONS.map((section) => {
            const visibleLinks = section.links.filter((link) =>
              isLinkVisible(link.visibleFor, user.adminType)
            );
            if (visibleLinks.length === 0) return null;
            return (
              <React.Fragment key={section.label}>
                <div className="nav-section-label">{section.label}</div>
                {visibleLinks.map(({ to, label, labelForAgency, end, icon }) => {
                  const displayLabel = user.adminType === 'agency' && labelForAgency != null ? labelForAgency : label;
                  return (
                    <NavLink
                      key={to}
                      to={to}
                      end={end ?? false}
                      className={({ isActive }) => (isActive ? 'nav-btn nav-btn-active' : 'nav-btn')}
                    >
                      {NavIcons[icon]}
                      {displayLabel}
                    </NavLink>
                  );
                })}
              </React.Fragment>
            );
          })}
        </nav>

        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{user.name[0]}</div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{user.name}</span>
            <span className="sidebar-user-role">
              {user.adminType === 'agency' ? 'Agency admin' : user.adminType === 'system' ? 'System admin' : user.roles[0]}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="sidebar-logout-link"
          onClick={onLogout}
          title="Log out"
        >
          {NavIcons.logout}
          Log out
        </button>
      </aside>

      <div className="content">
        <PageHeader title={title} />
        <div className="content-main">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [authedUser, setAuthedUser] = useState<AdminUser | null>(null);

  if (!authedUser) {
    return <LoginPage onLogin={setAuthedUser} />;
  }

  const scope = authedUser?.adminType === 'agency' && authedUser.agencyId
    ? { agencyId: authedUser.agencyId }
    : undefined;

  return (
    <AdminScopeProvider scope={scope}>
    <Routes>
      <Route path="/" element={<Layout user={authedUser} onLogout={() => setAuthedUser(null)} />}>
        <Route index               element={<DashboardPage />}  />
        <Route path="users"        element={<UsersPage />}      />
        <Route path="hotpoints"    element={<HotpointsPage />}  />
        <Route path="routes"       element={<RoutesPage />}     />
        <Route path="activities"   element={<ActivitiesPage />} />
        <Route path="tickets"      element={<TicketsPage />}    />
        <Route path="vehicles"     element={<VehiclesPage />}   />
        <Route path="scanner-operators" element={<ScannerOperatorsPage />} />
        <Route path="agency-management" element={<AgencyManagementPage />} />
        <Route path="disputes"     element={<DisputesPage />}   />
        <Route path="income"       element={<IncomePage />}     />
      </Route>
    </Routes>
    </AdminScopeProvider>
  );
}
