import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import Home from './pages/Home.jsx';
import Alerts from './pages/Alerts.jsx';
import Watchlist from './pages/Watchlist.jsx';
import SignIn from './pages/SignIn.jsx';
import SignUp from './pages/SignUp.jsx';

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <SignIn />,
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
      path: "/alerts",
      element: <Alerts userId={localStorage.getItem('userId') || ''} />,
    },
    {
      path: "/watchlist",
      element: <Watchlist />,
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