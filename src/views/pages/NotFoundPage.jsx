import { Link } from "react-router-dom";
import CommonGridShape from "../components/CommonGridShape.jsx";

function NotFoundPage() {
  return (
    <div className="relative z-1 flex min-h-screen flex-col items-center justify-center overflow-hidden p-6">
      <CommonGridShape />

      <div className="mx-auto w-full max-w-[242px] text-center sm:max-w-[472px]">
        <h1 className="mb-8 text-title-md font-bold text-gray-800 xl:text-title-2xl">
          ERROR
        </h1>

        <img src="/images/error/404.svg" alt="404" />

        <p className="mt-10 mb-6 text-base text-gray-700 sm:text-lg">
          We can’t seem to find the page you are looking for!
        </p>

        <Link
          to="/signin"
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-3.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800"
        >
          Back to Sign In
        </Link>
      </div>

      <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} - Employee Management System
      </p>
    </div>
  );
}

export default NotFoundPage;
