import { useState } from "react";
import { Link } from "react-router";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";

export default function NewPasswordForm() {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <div className="flex flex-col flex-1">
      

      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
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
            <form 
                onSubmit={(e) => {
                    e.preventDefault();
                    window.location.href = "/dashboard";
                }}
            >
              <div className="space-y-6">
                <div>
                  <Label>
                    New password <span className="text-error-500">*</span>{" "}
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="*************"
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
                    onClick={() => {
                      window.location.href = "/verification";
                    }}
                  >
                    Set Password
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
    </div>
  );
}
