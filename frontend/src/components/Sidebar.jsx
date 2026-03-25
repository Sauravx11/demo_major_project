/**
 * Sidebar – collapsible navigation with hamburger toggle
 * Desktop: icon-only when collapsed (72px) | full when expanded (260px)
 * Mobile:  hidden by default, slides in on hamburger click
 */
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';

export default function Sidebar() {
  const { user, logoutUser, isTeacher } = useAuth();
  const { collapsed, mobileOpen, toggle } = useSidebar();
  const initial = user?.name?.charAt(0)?.toUpperCase() || 'U';

  const sidebarClass = [
    'sidebar',
    collapsed ? 'collapsed' : '',
    mobileOpen ? 'mobile-open' : '',
  ].filter(Boolean).join(' ');

  const teacherLinks = [
    { section: 'Overview' },
    { to: '/dashboard',     icon: '📊', label: 'Dashboard' },
    { section: 'Management' },
    { to: '/students',      icon: '👥', label: 'Students' },
    { to: '/upload',        icon: '📁', label: 'Upload CSV' },
    { section: 'Analytics' },
    { to: '/predictions',   icon: '🤖', label: 'Predictions' },
    { to: '/model-metrics', icon: '📈', label: 'Model Metrics' },
  ];

  const studentLinks = [
    { section: 'My Space' },
    { to: '/my-dashboard',  icon: '📊', label: 'My Dashboard' },
    { to: '/submit',        icon: '🎯', label: 'Submit Data' },
    { section: 'Analytics' },
    { to: '/predictions',   icon: '🔮', label: 'My Predictions' },
  ];

  const links = isTeacher ? teacherLinks : studentLinks;

  return (
    <aside className={sidebarClass}>
      {/* ── Brand (Acts as Toggle) ── */}
      <div className="sidebar-brand">
        <div 
          className="brand-icon" 
          onClick={toggle}
          role="button"
          tabIndex={0}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label="Toggle sidebar"
        >
          🎓
        </div>
        <h2>EduPredict AI</h2>
      </div>

      {/* ── Navigation ── */}
      <nav className="sidebar-nav">
        {links.map((item, i) =>
          item.section ? (
            <div key={`sec-${i}`} className="sidebar-label">{item.section}</div>
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <span className="link-icon">{item.icon}</span>
              <span className="link-text">{item.label}</span>
            </NavLink>
          )
        )}
      </nav>

      {/* ── User footer ── */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="user-avatar">{initial}</div>
          <div className="user-info">
            <div className="user-name">{user?.name}</div>
            <div className="user-role">
              {isTeacher ? '👨‍🏫 Teacher' : '👨‍🎓 Student'}
            </div>
          </div>
          <button
            className="btn btn-sm btn-secondary"
            onClick={logoutUser}
            title="Logout"
          >
            🚪
          </button>
        </div>
      </div>
    </aside>
  );
}
