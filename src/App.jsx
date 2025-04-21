import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';

import SignIn from './sign-in/SignIn.jsx';
import SignUp from './sign-up/SignUp.jsx';
// import Dashboard from './dashboard/Dashboard.jsx';
function App() {
  return (
    <BrowserRouter>
        <Routes>
            <Route path="/" element={<SignIn />} />
            <Route path="/SignIn" element={<SignIn />} />
            <Route path="/SignUp" element={<SignUp />} />
            {/* <Route path="/checkout" element={<Checkout />} /> */}
            {/* <Route path="/dashboard" element={<Dashboard />} /> */}
            {/* <Route path="/MarketingPage" element={<MarketingPage />} /> */}
        </Routes>
    </BrowserRouter>
  );
}

export default App;
