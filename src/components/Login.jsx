import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import pkLogo from "../assets/pklogo.png";
import { login, isAuthenticated } from "../api";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Check if user is already logged in
  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/AdminDashboard");
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Please enter both username and password");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response = await login({ username, password });
      
      // Store username in localStorage along with the token
      if (response) {
        localStorage.setItem('user_name', username);
        navigate("/AdminDashboard");
      }
    } catch (err) {
      setError(err.message || "Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex justify-center items-center px-2">
      <div className="flex flex-col justify-center items-center w-full max-w-[700px] mx-auto px-2 md:bg-[#ffffff19] md:backdrop-blur-3xl rounded-3xl md:p-10">
        <div className="w-[150px] mb-10">
          <img src={pkLogo} alt="Logo" className="w-full h-full object-contain" />
        </div>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 w-full">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col w-full px-2 gap-5">
          <input
            type="text"
            placeholder="User Name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="bg-[#fff] px-5 py-2 rounded-3xl border-none outline-none"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-[#fff] px-5 py-2 rounded-3xl border-none outline-none"
          />
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-10 py-2 rounded-3xl bg-[#fff] font-bold cursor-pointer w-full md:w-auto"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/reset-password")}
              className="text-blue-600 hover:underline text-sm"
            >
              Forgot Password?
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;