import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import Alerts from './pages/Alerts.jsx';
import Watchlist from './pages/Watchlist.jsx';
import SignIn from './pages/SignIn.jsx';
import SignUp from './pages/SignUp.jsx';
import News from './pages/News.jsx';

function Root() {
  const userId = localStorage.getItem('userId');
  return userId && userId.trim() !== '' ? <Navigate to="/dashboard" replace /> : <Navigate to="/SignIn/" replace />;
}

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <Root />,
    },
    {
      path: "/SignIn",
      element: <SignIn />,
    },
    {
      path: "/SignUp",
      element: <SignUp />,
    },
    {
      path: "/dashboard",
      element: <Dashboard userId={localStorage.getItem('userId') || ''} />,
    },
    {
      path: "/alerts/",
      element: <Alerts userId={localStorage.getItem('userId') || ''} />,
    },
    {
      path: "/watchlist/",
      element: <Watchlist />,
    },
    {
      path: "/news/",
      element: <News />,
    },
  ],
  {
    future: {
      v7_relativeSplatPath: true,
    },
  }
);

function App() {
  return <RouterProvider router={router} />;
}

export default App;