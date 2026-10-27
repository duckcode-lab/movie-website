import { Outlet } from 'react-router-dom';
import Sidebar from '../components/admin/Sidebar';
import SiteLayout from './SiteLayout.jsx';
import '../components/admin/admin.css';

export default function AdminLayout() {
  return (
    <SiteLayout mainClassName="admin-layout-main">
      <div className="admin-app">
        <div className="admin-body">
          <Sidebar />
          <main className="admin-page-content">
            <Outlet />
          </main>
        </div>
      </div>
    </SiteLayout>
  );
}
