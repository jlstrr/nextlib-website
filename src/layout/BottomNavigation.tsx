import { Link, useLocation } from "react-router";
import { 
  GridIcon, 
  CalenderIcon, 
  ListIcon,
} from "../icons";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path: string;
  label: string;
};

const bottomNavItems: NavItem[] = [
  {
    name: "Dashboard",
    icon: <GridIcon />,
    path: "/dashboard",
    label: "Dashboard"
  },
  {
    name: "Reservations", 
    icon: <CalenderIcon />,
    path: "/my-reservations",
    label: "Reservation"
  },
  {
    name: "Usage History",
    icon: <ListIcon />,
    path: "/usage-history", 
    label: "Usage History"
  }
];

const BottomNavigation: React.FC = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    // For charts and UI elements, check if current path starts with the base path
    if (path === "/line-chart") {
      return location.pathname === "/line-chart" || location.pathname === "/bar-chart";
    }
    if (path === "/alerts") {
      return location.pathname === "/alerts" || location.pathname === "/avatars" || 
             location.pathname === "/badge" || location.pathname === "/buttons" ||
             location.pathname === "/images" || location.pathname === "/videos";
    }
    return location.pathname === path;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-50 lg:hidden shadow-lg">
      <div className="flex justify-around items-center py-1 px-2">
        {bottomNavItems.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            className={`flex flex-col items-center justify-center min-w-0 flex-1 py-2 px-1 transition-all duration-200 rounded-lg mx-1 ${
              isActive(item.path)
                ? "text-brand-500 bg-brand-50 dark:bg-brand-500/10"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
            role="button"
            aria-label={`Navigate to ${item.label}`}
          >
            <span className={`text-2xl mb-1 transition-colors duration-200 ${
              isActive(item.path) ? "text-brand-500" : ""
            }`}>
              {item.icon}
            </span>
            <span className="text-xs font-medium truncate w-full text-center leading-tight">
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default BottomNavigation;