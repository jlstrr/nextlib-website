import { Link } from "react-router";

interface BreadcrumbProps {
  pageTitle: string;
}

const PageBreadcrumb: React.FC<BreadcrumbProps> = ({ pageTitle }) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6 flex-col md:flex-row md:items-center">
      <div className="w-full md:w-auto">
        <h2
          className="text-xl font-semibold text-gray-800 dark:text-white/90"
          x-text="pageName"
        >
          {pageTitle}
        </h2>
        <nav>
          <ol className="flex items-center gap-1.5 flex-wrap">
          <li>
            <Link
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400"
            to="/dashboard"
            >
            Home
            <svg
              className="stroke-current"
              width="17"
              height="16"
              viewBox="0 0 17 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
              d="M6.0765 12.667L10.2432 8.50033L6.0765 4.33366"
              stroke=""
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              />
            </svg>
            </Link>
          </li>
          {pageTitle === "Create Reservation" && (
            <li>
              <Link
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400"
              to="/my-reservations"
              >
                My Reservations
                <svg
                  className="stroke-current"
                  width="17"
                  height="16"
                  viewBox="0 0 17 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                  d="M6.0765 12.667L10.2432 8.50033L6.0765 4.33366"
                  stroke=""
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  />
                </svg>
              </Link>
            </li>
          )}
          <li className="text-sm text-gray-800 dark:text-white/90">
            {pageTitle}
          </li>
          </ol>
        </nav>
        
      </div>
      {pageTitle === "My Reservation" && (
        <div className="flex flex-col gap-3 w-full md:w-auto md:flex-row md:items-center">
          <Link
            to="/my-reservations/create"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 w-full md:w-auto justify-center"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Create Reservation
          </Link>
        </div>
      )}
    </div>
  );
};

export default PageBreadcrumb;
