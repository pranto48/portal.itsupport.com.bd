import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Mail, Lock, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: "Login failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-content min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="glass-card user-login-card p-8 form-fade-in">
          <div className="text-center mb-8">
            <div className="feature-icon mx-auto w-fit mb-4">
              <LogIn className="w-8 h-8 text-blue-200" />
            </div>
            <h1 className="text-3xl font-bold text-white">Customer Login</h1>
            <p className="text-gray-300 mt-2">Sign in to manage your licenses and support tickets</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="form-glass-input pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="form-glass-input pl-10"
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-glass-primary w-full py-3 text-lg">
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <p className="text-gray-400 text-sm">
              Don't have an account?{" "}
              <Link to="/register" className="text-blue-300 hover:text-blue-200 font-medium">Register here</Link>
            </p>
            <p className="text-gray-500 text-xs">
              <Link to="/admin-login" className="hover:text-gray-300">Admin access →</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
