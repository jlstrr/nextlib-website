import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import { FiClock, FiCheckCircle, FiMonitor, FiCalendar, FiSettings } from "react-icons/fi";

const stats = [
  {
    label: "Total Usage Time",
    value: "24h",
    badge: "This Month",
    icon: <FiClock className="text-xl text-brand-500" />,
  },
  {
    label: "Completed Sessions",
    value: "15",
    badge: "This Month",
    icon: <FiCheckCircle className="text-xl text-green-500" />,
  },
  {
    label: "Different PCs Used",
    value: "8",
    badge: "This Month",
    icon: <FiMonitor className="text-xl text-yellow-500" />,
  },
  {
    label: "Attendance Rate",
    value: "92%",
    badge: "This Month",
    icon: <FiCalendar className="text-xl text-purple-500" />,
  },
];


const usageHistory = [
  {
    date: "Jan 15, 2025",
    pc: "PC-02",
    timeIn: "10:00 AM",
    timeOut: "11:00 AM",
    duration: "1hr",
    purpose: "Research",
    status: "Completed",
  },
  {
    date: "Jan 14, 2025",
    pc: "PC-05",
    timeIn: "02:00 PM",
    timeOut: "03:00 PM",
    duration: "1hr",
    purpose: "Assignment",
    status: "Completed",
  },
  {
    date: "Jan 13, 2025",
    pc: "PC-03",
    timeIn: "10:00 AM",
    timeOut: "--:--",
    duration: "--",
    purpose: "Online Course",
    status: "Cancelled",
  },
];

export default function UsageHistoryPage() {
  return (
    <div>
      <PageMeta title="Usage History | iReserve System" description="View PC usage history" />
      <PageBreadcrumb pageTitle="Usage History" />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="rounded-xl border p-5 bg-white dark:bg-gray-800 dark:border-gray-700">
            <div className="mb-3 flex justify-between items-center">
              <span className="text-xl">{stat.icon}</span>
              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                {stat.badge}
              </span>
            </div>
            <h4 className="text-gray-700 text-sm font-medium dark:text-gray-200">{stat.label}</h4>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Usage Table */}
      <div className="rounded-xl mt-4 border bg-white dark:bg-gray-900 dark:border-gray-700 mb-10">
        <div className="flex justify-between items-center px-6 py-4 border-b dark:border-gray-700">
          <h2 className="font-semibold text-lg text-gray-800 dark:text-white">Detailed Usage History</h2>
          <Button variant="outline" size="sm" startIcon={<FiSettings />}>
            Filter
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-100 dark:bg-gray-800 text-xs uppercase text-gray-500 dark:text-gray-400">
              <tr>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">PC Number</th>
                <th className="px-6 py-3">Time In</th>
                <th className="px-6 py-3">Time Out</th>
                <th className="px-6 py-3">Duration</th>
                <th className="px-6 py-3">Purpose</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {usageHistory.map((entry, index) => (
                <tr key={index} className="border-b dark:border-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">{entry.date}</td>
                  <td className="px-6 py-4">{entry.pc}</td>
                  <td className="px-6 py-4">{entry.timeIn}</td>
                  <td className="px-6 py-4">{entry.timeOut}</td>
                  <td className="px-6 py-4">{entry.duration}</td>
                  <td className="px-6 py-4">{entry.purpose}</td>
                  <td className="px-6 py-4">
                    {entry.status === "Completed" ? (
                      <span className="text-green-600 bg-green-100 text-xs px-2 py-1 rounded-full">Completed</span>
                    ) : (
                      <span className="text-red-600 bg-red-100 text-xs px-2 py-1 rounded-full">Cancelled</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
          <p>Showing 1–3 of 15 sessions</p>
          <div className="flex space-x-2">
            <Button size="sm" variant="outline">Previous</Button>
            <Button size="sm" variant="primary">1</Button>
            <Button size="sm" variant="outline">2</Button>
            <Button size="sm" variant="outline">3</Button>
            <Button size="sm" variant="outline">Next</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
