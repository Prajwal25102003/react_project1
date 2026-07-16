import { Link } from "react-router-dom";
import CommonGridShape from "./CommonGridShape.jsx";

function AuthLayout({ title, description, children, footer }) {
  return (
    <div className="relative z-1 min-w-0 overflow-x-hidden bg-white p-6 sm:p-0">
      <div className="relative flex h-screen w-full min-w-0 flex-col justify-center overflow-x-hidden sm:p-0 lg:flex-row">
        <div className="flex min-w-0 w-full flex-1 flex-col lg:w-1/2">
          <div className="mx-auto flex w-full min-w-0 max-w-md items-center gap-2 px-1 pt-10">
            <img
              src="/images/logo/logo-icon.svg"
              alt=""
              className="h-8 w-8"
            />
            <span className="text-lg font-semibold text-gray-800">EMP</span>
          </div>
          <div className="mx-auto flex w-full min-w-0 max-w-md flex-1 flex-col justify-center px-1">
            <div className="mb-5 sm:mb-8">
              <h1 className="text-title-sm mb-2 font-semibold text-gray-800 sm:text-title-md">
                {title}
              </h1>
              <p className="text-sm text-gray-500">{description}</p>
            </div>
            {children}
            {footer}
          </div>
        </div>

        <div className="relative hidden h-full w-full items-center bg-brand-950 lg:grid lg:w-1/2">
          <div className="z-1 flex items-center justify-center">
            <CommonGridShape />
            <div className="flex max-w-xs flex-col items-center px-6">
              <Link to="/signin" className="mb-5 flex items-center gap-3">
                <img
                  src="/images/logo/logo-icon.svg"
                  alt=""
                  className="h-12 w-12"
                />
                <span className="text-3xl font-semibold text-white">EMP</span>
              </Link>
              <p className="text-center text-lg font-medium text-white">
                Employee Management System
              </p>
              <p className="mt-2 text-center text-sm text-gray-400">
                Sign in to manage employees, attendance, and leave.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
