import { useState, useEffect } from "react";
import { Link } from "react-router";
import { ChevronLeftIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import { forgotPassword } from "../../api/users";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setTimeout(() => {
        setCooldownSeconds(cooldownSeconds - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownSeconds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!email) {
      setError('Please enter your email');
      return;
    }
    try {
      setIsLoading(true);
      await forgotPassword(email);
      setSuccess('If that email exists, a verification link was sent. Check your inbox.');
      setCooldownSeconds(60); // Start 60-second cooldown
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 items-center justify-center">
      <div className="flex flex-col items-center justify-center w-full max-w-xl mx-auto bg-white rounded-xl p-10">
        <div className="w-full max-w-md pt-5 pb-5 mx-auto">
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
              Forgot your password?
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Don't worry, it happens to the best of us. Just enter your email below.
            </p>
          </div>
          <div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <Label>
                    Email <span className="text-error-500">*</span>{" "}
                  </Label>
                  <Input
                    type="email"
                    placeholder="yourname@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                  {success && (
                    <div className="mt-2">
                      <p className="text-sm text-green-700">{success}</p>
                      {cooldownSeconds > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          You can request another email in {cooldownSeconds} seconds
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <Button
                    className="w-full"
                    size="sm"
                    disabled={isLoading || cooldownSeconds > 0}
                  >
                    {isLoading ? 'Sending...' : cooldownSeconds > 0 ? `Wait ${cooldownSeconds}s` : 'Submit'}
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
