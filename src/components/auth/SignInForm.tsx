import { useState } from "react";
import { Link } from "react-router";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import Button from "../ui/button/Button";

// Hardcoded users
const users = [
  { id: "123456789", password: "123456789" },
  { id: "admin", password: "admin123" },
];

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [idNumber, setIdNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const user = users.find(
      (u) => u.id === idNumber.trim() && u.password === password.trim()
    );

    if (user) {
      localStorage.setItem("isLoggedIn", "true");
      window.location.href = "/dashboard";
    } else {
      setError("Invalid ID number or password.");
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
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
              Welcome, trailblazer!
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your login credentials to proceed.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <Label>
                  ID Number <span className="text-error-500">*</span>
                </Label>
                <Input
                  placeholder="123456789"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                />
              </div>

              <div>
                <Label>
                  Password <span className="text-error-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="*************"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox checked={isChecked} onChange={setIsChecked} />
                  <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                    Keep me logged in
                  </span>
                </div>
                <Link
                  to="/forgot-password"
                  className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Forgot password?
                </Link>
              </div>

              {error && (
                <div className="text-sm text-error-500 bg-red-50 border border-red-200 p-2 rounded">
                  {error}
                </div>
              )}

              <div>
                <Button className="w-full" size="sm">
                  Login
                </Button>
              </div>
            </div>
          </form>

          <div className="mt-8 sm:mt-8 flex justify-center">
            <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400">
              © 2025 iReserve - USTP Jasaan. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
