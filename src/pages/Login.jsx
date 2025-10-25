import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Mail, Loader2, Facebook, Twitter, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login, isLoading, error, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }

    clearError(); // Clear any previous errors

    const result = await login(email, password);
    
    if (result.success) {
      toast({
        title: "Login Successful",
        description: `Welcome back, ${result.data.user.firstName}!`,
      });
      
      // Navigate to dashboard after successful login
      navigate("/dashboard");
    } else {
      toast({
        title: "Login Failed",
        description: result.error || "Invalid email or password",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Red Header */}
      <div className="bg-red-600 h-16 flex items-center px-8">
        <div className="flex items-center">
          <span className="text-white text-2xl font-bold">Murugan</span>
          <span className="text-yellow-300 text-xl ml-2">Super Market</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-128px)]">
        {/* Left Side - Supermarket Image */}
        <div className="hidden lg:flex lg:w-2/3 relative overflow-hidden items-center justify-center p-2">
          <div className="relative w-full h-full">
            <img 
              src="/loginimage.jpg" 
              alt="Supermarket Aisle" 
              className="w-half h-half object-cover rounded-2xl border-4 border-gray-200 shadow-2xl"
            />
            <div className="absolute inset-0 rounded-2xl border-2 border-white shadow-inner"></div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/3 flex items-center justify-center p-4 bg-white">
          <div className="w-full max-w-lg">
            <div className="bg-white rounded-xl shadow-2xl p-12 border-4 border-gray-200 relative">
              <div className="absolute inset-0 rounded-xl border-2 border-white shadow-inner"></div>
              <div className="relative z-10">
                <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
                  Murugan Super Market
                </h2>
              
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or</span>
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-8">
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-gray-700 font-medium">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 bg-blue-50 border-gray-300 focus:border-yellow-500 focus:ring-yellow-500"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="password" className="text-gray-700 font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9 bg-blue-50 border-gray-300 focus:border-yellow-500 focus:ring-yellow-500"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 rounded-lg shadow-md transition-all duration-300"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      LOGIN
                    </>
                  ) : (
                    "LOGIN"
                  )}
                </Button>

                <div className="text-center mt-4">
                  <Link 
                    to="/forgot-password" 
                    className="text-blue-600 hover:text-blue-800 hover:underline text-sm font-medium transition-colors duration-200"
                  >
                    Forgot Password?
                  </Link>
                </div>
              </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Red Footer */}
      <div className="bg-red-600 h-16 flex items-center justify-between px-8">
        <div className="text-white text-sm">
          info@pushdiggy.gmail.com
        </div>
        <div className="flex items-center space-x-4">
          <Facebook className="h-5 w-5 text-white" />
          <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
            <span className="text-red-600 text-xs font-bold">g+</span>
          </div>
          <Linkedin className="h-5 w-5 text-white" />
          <Twitter className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );
}