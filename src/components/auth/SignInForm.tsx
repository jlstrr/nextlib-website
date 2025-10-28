import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import Button from "../ui/button/Button";
import { loginUser } from "../../api/users";


export default function SignInForm() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [idNumber, setIdNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Load remembered ID (if any) on mount
  useEffect(() => {
    try {
      const remembered = localStorage.getItem("rememberedId");
      if (remembered) {
        setIdNumber(remembered);
        setIsChecked(true);
      }
    } catch (_) {
      // ignore storage errors
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Basic client-side validation
    if (!idNumber.trim() || !password.trim()) {
      setError("Please enter both ID number and password.");
      return;
    }

    setLoading(true);
    try {
      const data = await loginUser(idNumber.trim(), password.trim());

      // Expecting the API to return a token or similar on success.
      // We'll try common fields: token, accessToken, or data.token
      // const token = (data && (data.token || data.accessToken || data?.data?.token)) || null;
      // const user = (data && (data.user || data?.data?.user)) || null;

      // if (token) {
      //   localStorage.setItem("token", token);
      // }
      // if (user) {
      //   try {
      //     localStorage.setItem("user", JSON.stringify(user));
      //   } catch (_) {
      //     // ignore JSON storage errors
      //   }
      // }

        // Parse common shapes from API response for token and user object.
        const token = data?.token || data?.accessToken || data?.data?.token || null;
        const responseUser = data?.user || data?.data?.user || data?.userInfo || null;

        if (token) {
          try {
            localStorage.setItem("token", token);
          } catch (_) {
            // ignore storage errors
          }
        }

        // Prepare a user object to store. If the API didn't provide a user object,
        // create a minimal one using the provided idNumber.
        const userToStore = responseUser || { id: idNumber.trim(), name: idNumber.trim(), email: "" };
        try {
          localStorage.setItem("user", JSON.stringify(userToStore));
        } catch (_) {
          // ignore storage errors
        }

        // Notify any open components about the updated user (SPA internal event).
        try {
          window.dispatchEvent(new CustomEvent("ire-user-updated", { detail: userToStore }));
        } catch (_) {
          // ignore dispatch issues
        }

      // Persist only the ID number when "Keep me logged in" is checked
      if (isChecked) {
        try {
          localStorage.setItem("rememberedId", idNumber.trim());
        } catch (_) {
          // ignore storage errors
        }
      } else {
        localStorage.removeItem("rememberedId");
      }

      localStorage.setItem("isLoggedIn", "true");
      // Redirect to dashboard using router navigation (single-page navigation)
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      // If the API throws a message, prefer that
      const message = err?.message || "Login failed. Please check your credentials.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 items-center justify-center">
      <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto bg-white rounded-xl p-10">
        <div className="flex gap-4 items-center mb-10">
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
          <h2 className="text-xl font-medium text-gray-800 dark:text-white/90">
            University of Science and Technology of Southern Philippines
          </h2>
        </div>

        <div className="w-full max-w-xl items-center">
          <div className="mb-5 sm:mb-8 items-center justify-center text-center">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Welcome, trailblazer!
            </h1>
            <p className="text-md text-gray-500 dark:text-gray-400">
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
                  type="number"
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
                {/* <Link
                  to="/forgot-password"
                  className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Forgot password?
                </Link> */}
              </div>

              {error && (
                <div className="text-sm text-error-500 bg-red-50 border border-red-200 p-2 rounded">
                  {error}
                </div>
              )}

              <div>
                <Button
                  className="w-full rounded-2xl"
                  size="sm"
                  disabled={loading}
                >
                  {loading ? "Logging in..." : "Login"}
                </Button>
              </div>
            </div>
          </form>

          <div className="mt-8 sm:mt-8 flex justify-center">
            <p className="text-xs font-normal text-center text-gray-700 dark:text-gray-400">
              © 2025 iReserve - USTP Jasaan. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
