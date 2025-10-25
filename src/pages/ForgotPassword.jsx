import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Loader2, Shield, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { authAPI } from "@/services/api";
import Footer from "@/components/Footer";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: email, 2: OTP, 3: new password
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (step === 1) {
      if (!email) {
        toast({
          title: "Error",
          description: "Please enter your email address",
          variant: "destructive",
        });
        return;
      }

      setIsLoading(true);

      try {
        const response = await authAPI.forgotPassword(email);
        
        if (response.status === 'success') {
          setStep(2);
          toast({
            title: "Success",
            description: response.message,
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: error.message || "Failed to send OTP",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    } else if (step === 2) {
      if (!otp || otp.length !== 6) {
        toast({
          title: "Error",
          description: "Please enter a valid 6-digit OTP",
          variant: "destructive",
        });
        return;
      }

      setIsLoading(true);

      try {
        const response = await authAPI.verifyOTP(email, otp);
        
        if (response.status === 'success') {
          setStep(3);
          toast({
            title: "Success",
            description: "OTP verified successfully",
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: error.message || "Invalid or expired OTP",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    } else if (step === 3) {
      if (!newPassword || newPassword.length < 6) {
        toast({
          title: "Error",
          description: "Password must be at least 6 characters long",
          variant: "destructive",
        });
        return;
      }

      if (newPassword !== confirmPassword) {
        toast({
          title: "Error",
          description: "Passwords do not match",
          variant: "destructive",
        });
        return;
      }

      setIsLoading(true);

      try {
        const response = await authAPI.resetPassword(email, otp, newPassword);
        
        if (response.status === 'success') {
          toast({
            title: "Success",
            description: "Password reset successfully! You can now log in.",
          });
          navigate("/");
        }
      } catch (error) {
        toast({
          title: "Error",
          description: error.message || "Failed to reset password",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const renderStepContent = () => {
    if (step === 1) {
      return (
        <>
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Forgot Password?
            </h1>
            <p className="text-gray-600">
              Enter your email address and we'll send you an OTP to reset your password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending OTP...
                </>
              ) : (
                <>
                  Send OTP
                  <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
                </>
              )}
            </Button>

            <div className="text-center">
              <Link to="/" className="text-primary hover:underline">
                <ArrowLeft className="inline mr-1 h-4 w-4" />
                Back to Login
              </Link>
            </div>
          </form>
        </>
      );
    } else if (step === 2) {
      return (
        <>
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Enter OTP
            </h1>
            <p className="text-gray-600 mb-2">
              We've sent a 6-digit OTP to <strong>{email}</strong>
            </p>
            <p className="text-sm text-gray-500">
              OTP expires in 10 minutes
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="otp">Enter OTP</Label>
              <Input
                id="otp"
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="text-center text-2xl tracking-widest"
                disabled={isLoading}
                maxLength={6}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
              disabled={isLoading || otp.length !== 6}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying OTP...
                </>
              ) : (
                "Verify OTP"
              )}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-primary hover:underline"
              >
                <ArrowLeft className="inline mr-1 h-4 w-4" />
                Back to Email
              </button>
            </div>
          </form>
        </>
      );
    } else if (step === 3) {
      return (
        <>
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Set New Password
            </h1>
            <p className="text-gray-600">
              Enter your new password below.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting Password...
                </>
              ) : (
                "Reset Password"
              )}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-primary hover:underline"
              >
                <ArrowLeft className="inline mr-1 h-4 w-4" />
                Back to OTP
              </button>
            </div>
          </form>
        </>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {renderStepContent()}
        </div>
      </motion.div>
      <Footer />
    </div>
  );
}