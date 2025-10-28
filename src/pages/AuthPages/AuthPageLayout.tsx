import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/login_bg.jpg')" }}
    >
      {/* low-opacity white overlay on top of background image */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundColor: 'rgba(255,255,255,0.39)' }}
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col justify-center w-full h-screen lg:flex-row dark:bg-gray-900 sm:p-0">
        {children}
        {/* <div className="items-center hidden p-8 lg:w-1/2 dark:bg-white/5 lg:grid">
          <div className="relative bg-[#F4F4F4] rounded-xl flex items-center justify-center z-1">
            <div className="flex flex-col items-center justify-center">
              <img
                src="/images/logo/bg.png"
                alt="Logo"
                className="w-full h-auto mb-6"
              />
            </div>
          </div>
        </div> */}
        {/* <div className="fixed z-50 hidden bottom-6 right-6 sm:block">
          <ThemeTogglerTwo />
        </div> */}
      </div>
    </div>
  );
}
