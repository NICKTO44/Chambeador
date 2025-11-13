import React from 'react';
import { Helmet } from 'react-helmet';
import DashboardAdmin from '../components/DashboardAdmin';
import { useAuth } from '../context/AuthContext';

function AdminPage() {
  const { token } = useAuth();

  return (
    <>
      <Helmet>
        <title>Panel Admin - El Chambeador</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <DashboardAdmin token={token} />
    </>
  );
}

export default AdminPage;