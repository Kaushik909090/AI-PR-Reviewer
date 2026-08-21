import React from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Repository from "./pages/Repository";
import PullRequests from "./pages/PullRequests";
import Review from "./pages/Review";


function App() {

  return (
    <BrowserRouter>

      <Routes>

        {/* Landing Page */}
        <Route
          path="/"
          element={<Home />}
        />


        {/* Login */}
        <Route
          path="/login"
          element={<Login />}
        />


        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={<Dashboard />}
        />


        {/* Repository */}
        <Route
          path="/repository/:owner/:repo"
          element={<Repository />}
        />


        {/* Pull Requests */}
        <Route
          path="/repository/:owner/:repo/pull-requests"
          element={<PullRequests />}
        />


        {/* AI Review */}
        <Route
          path="/review/:owner/:repo/:pr"
          element={<Review />}
        />


        {/* Unknown route */}
        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;