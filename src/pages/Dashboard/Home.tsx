import { useEffect, useState } from "react";
import EcommerceMetrics from "../../components/ecommerce/EcommerceMetrics";
import MonthlySalesChart from "../../components/ecommerce/MonthlySalesChart";
import MonthlyTarget from "../../components/ecommerce/MonthlyTarget";
import PageMeta from "../../components/common/PageMeta";
import { getDashboardData } from "../../api/users";

interface DashboardData {
  user: {
    id: string;
    name: string;
    user_type: string;
    status: string;
  };
  statistics: {
    reservations_made: number;
    available_computers: number;
  };
  allotted_hours: {
    average_hours_per_day: number;
    remaining_hours_left: number;
    used_hours_today: number;
    total_allotted_time: string;
  };
  monthly_usage_chart: Array<{
    month: string;
    year: number;
    monthNumber: number;
    monthName: string;
    totalHours: number;
    totalMinutes: number;
    sessionCount: number;
  }>;
}

export default function Home() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await getDashboardData();
        setDashboardData(response.data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <>
        <PageMeta
          title="iReserve System"
          description="This is the iReserve System Dashboard page for Student/Faculty."
        />
        <div className="grid grid-cols-12 gap-4 md:gap-6">
          <div className="col-span-12 space-y-6 xl:col-span-7">
            {/* EcommerceMetrics Skeleton */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
              <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
                <div className="flex items-center justify-center w-12 h-12 bg-gray-200 rounded-xl dark:bg-gray-700 animate-pulse"></div>
                <div className="flex items-end justify-between mt-5">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded dark:bg-gray-700 animate-pulse mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded dark:bg-gray-700 animate-pulse w-16"></div>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
                <div className="flex items-center justify-center w-12 h-12 bg-gray-200 rounded-xl dark:bg-gray-700 animate-pulse"></div>
                <div className="flex items-end justify-between mt-5">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded dark:bg-gray-700 animate-pulse mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded dark:bg-gray-700 animate-pulse w-16"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* MonthlySalesChart Skeleton */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <div className="h-6 bg-gray-200 rounded dark:bg-gray-700 animate-pulse w-32 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded dark:bg-gray-700 animate-pulse w-48"></div>
                </div>
                <div className="w-6 h-6 bg-gray-200 rounded dark:bg-gray-700 animate-pulse"></div>
              </div>
              <div className="h-48 bg-gray-200 rounded dark:bg-gray-700 animate-pulse"></div>
            </div>
          </div>

          <div className="col-span-12 xl:col-span-5">
            {/* MonthlyTarget Skeleton */}
            <div className="rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="px-5 pt-5 bg-white shadow-default rounded-2xl pb-11 dark:bg-gray-900 sm:px-6 sm:pt-6">
                <div className="flex justify-between mb-6">
                  <div>
                    <div className="h-6 bg-gray-200 rounded dark:bg-gray-700 animate-pulse w-32 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded dark:bg-gray-700 animate-pulse w-56"></div>
                  </div>
                  <div className="w-6 h-6 bg-gray-200 rounded dark:bg-gray-700 animate-pulse"></div>
                </div>
                <div className="relative">
                  <div className="max-h-[330px] flex items-center justify-center">
                    <div className="w-64 h-64 bg-gray-200 rounded-full dark:bg-gray-700 animate-pulse"></div>
                  </div>
                </div>
                <div className="mx-auto mt-10 w-full max-w-[380px] text-center">
                  <div className="h-4 bg-gray-200 rounded dark:bg-gray-700 animate-pulse mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded dark:bg-gray-700 animate-pulse w-3/4 mx-auto"></div>
                </div>
              </div>
              <div className="flex items-center justify-center gap-5 px-6 py-3.5 sm:gap-8 sm:py-5">
                <div className="text-center">
                  <div className="h-3 bg-gray-200 rounded dark:bg-gray-700 animate-pulse mb-2 w-16"></div>
                  <div className="h-5 bg-gray-200 rounded dark:bg-gray-700 animate-pulse w-20"></div>
                </div>
                <div className="w-px bg-gray-200 h-7 dark:bg-gray-800"></div>
                <div className="text-center">
                  <div className="h-3 bg-gray-200 rounded dark:bg-gray-700 animate-pulse mb-2 w-20"></div>
                  <div className="h-5 bg-gray-200 rounded dark:bg-gray-700 animate-pulse w-16"></div>
                </div>
                <div className="w-px bg-gray-200 h-7 dark:bg-gray-800"></div>
                <div className="text-center">
                  <div className="h-3 bg-gray-200 rounded dark:bg-gray-700 animate-pulse mb-2 w-16"></div>
                  <div className="h-5 bg-gray-200 rounded dark:bg-gray-700 animate-pulse w-12"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageMeta
          title="iReserve System"
          description="This is the iReserve System Dashboard page for Student/Faculty."
        />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-red-500">Error: {error}</div>
        </div>
      </>
    );
  }
  return (
    <>
      <PageMeta
        title="iReserve System"
        description="This is the iReserve System Dashboard page for Student/Faculty."
      />
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 space-y-6 xl:col-span-7">
          <EcommerceMetrics statistics={dashboardData?.statistics} />

          <MonthlySalesChart monthlyUsageData={dashboardData?.monthly_usage_chart} />
        </div>

        <div className="col-span-12 xl:col-span-5">
          <MonthlyTarget 
            allottedHours={dashboardData?.allotted_hours} 
            userType={dashboardData?.user?.user_type}
          />
        </div>

      </div>
    </>
  );
}
