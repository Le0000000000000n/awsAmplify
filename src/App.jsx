import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import Home from './pages/Home.jsx';
import Alerts from './pages/Alerts.jsx';
import Watchlist from './pages/Watchlist.jsx';
import SignIn from './sign-in/SignIn.jsx';
import SignUp from './sign-up/SignUp.jsx';

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
      element: <Dashboard userId="dd4f509a-e839-4f1a-9a84-6441ada1c7e6" />,
    },
    {
      path: "/alerts",
      element: <Alerts userId="dd4f509a-e839-4f1a-9a84-6441ada1c7e6" />,
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