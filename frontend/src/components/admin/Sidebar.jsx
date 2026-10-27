import { NavLink } from "react-router-dom";

const icons = {
  dashboard: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="8" height="8" rx="1" />
      <rect x="13" y="3" width="8" height="5" rx="1" />
      <rect x="13" y="10" width="8" height="11" rx="1" />
      <rect x="3" y="13" width="8" height="8" rx="1" />
    </svg>
  ),
  movies: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M7 4v16M17 4v16M3 9h4m-4 6h4m10-6h4m-4 6h4" />
    </svg>
  ),
  genres: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 13 11 22 2 13V4h9l9 9Z" />
      <circle cx="7" cy="9" r="1.5" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="9" cy="8" r="4" />
      <path d="M2 21a7 7 0 0 1 14 0m2-13a4 4 0 0 1 0 8m1 2a6 6 0 0 1 3 5" />
    </svg>
  ),
};

const menuItems = [
  {
    title: "Báo cáo",
    path: "/admin/dashboard",
    icon: "dashboard",
    end: true,
  },
  {
    title: "Quản lý phim",
    path: "/admin/movies",
    icon: "movies",
  },
  {
    title: "Quản lý thể loại",
    path: "/admin/genres",
    icon: "genres",
  },
  {
    title: "Quản lý user",
    path: "/admin/users",
    icon: "users",
  },
];

export default function Sidebar() {
  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-brand">Quản trị</div>
      <nav className="sidebar-menu">
        {menuItems.map((item) => {
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
            >
              <span className="sidebar-icon">{icons[item.icon]}</span>
              <span>{item.title}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
