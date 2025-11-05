import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import { resetPassword, loginUser } from "../../api/users";

export default function NewPasswordForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const id_number = searchParams.get('id_number');

  useEffect(() => {
    if (!token || !email) {
      setError('Invalid reset link. Please request a new password reset.');
    }
  }, [token, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!token || !email) {
      setError('Invalid reset link. Please request a new password reset.');
      return;
    }

    if (!newPassword || !confirmPassword) {
      setError('Please fill in both password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    try {
      setIsLoading(true);
      
      // Reset the password first
      const resetResponse = await resetPassword(token, newPassword, email);
      
      // If we have id_number from URL or response, automatically log in
      let userIdNumber = id_number;
      if (!userIdNumber && resetResponse?.user?.id_number) {
        userIdNumber = resetResponse.user.id_number;
      }
      
      if (userIdNumber) {
        try {
          await loginUser(userIdNumber, newPassword);
          setSuccess('Password reset successfully! Logging you in...');
          setTimeout(() => {
            navigate('/dashboard');
          }, 1500);
        } catch (loginErr) {
          // If auto-login fails, still show success and redirect to login
          setSuccess('Password reset successfully! Please log in with your new password.');
          setTimeout(() => {
            navigate('/');
          }, 2000);
        }
      } else {
        setSuccess('Password reset successfully! Please log in with your new password.');
        setTimeout(() => {
          navigate('/');
        }, 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="flex flex-col flex-1 items-center justify-center">
      <div className="flex flex-col justify-center w-full max-w-xl mx-auto bg-white rounded-xl p-10">
        <div className="w-full max-w-md pt-10 mx-auto">
          <Link
            to="/"
            className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <ChevronLeftIcon className="size-5" />
            Back to login
          </Link>
        </div>
        <div className="flex gap-4 items-center mt-8 mb-6">
          <img
            src="../../images/logo/ustp-logo-for-white.png"
            alt="USTP Jasaan Logo"
            className="w-16 h-16 mb-2 block dark:hidden"
          />
          <img
            src="../../images/logo/ustp-logo-white.png"
            alt="USTP Jasaan Logo (Dark)"
            className="w-16 h-16 mb-2 hidden dark:block"
          />
          <h2 className="text-md font-bold text-gray-800 dark:text-white/90">
            University of Science and Technology of Southern Philippines
          </h2>
        </div>
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Set a new password
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Your previous password has been reset. Please set a new password to continue.
            </p>
          </div>
          <div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
                {success && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-700">{success}</p>
                  </div>
                )}
                <div>
                  <Label>
                    New password <span className="text-error-500">*</span>{" "}
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="*************"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      )}
                    </span>
                  </div>
                </div>
                <div>
                  <Label>
                    Re-enter new Password <span className="text-error-500">*</span>{" "}
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="*************"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      )}
                    </span>
                  </div>
                </div>
                <div>
                  <Button
                    className="w-full"
                    size="sm"
                    disabled={isLoading || !token || !email}
                  >
                    {isLoading ? 'Setting Password...' : 'Set Password'}
                  </Button>
                </div>
              </div>
            </form>

            <div className="mt-8 sm:mt-8 flex justify-center">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400">
              © 2025 NextLib - USTP Jasaan. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
