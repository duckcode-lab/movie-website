import { Outlet } from 'react-router-dom';
import Header from '../Header';
import Sidebar from './Sidebar';
import './admin.css';

export default function AdminLayout() {
  return (
    <div className="admin-app">
      <Header showSearch={false} />
      <div className="admin-body">
        <Sidebar />
        <main className="admin-page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
