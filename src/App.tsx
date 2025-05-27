import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";

import CreateReservation from "./pages/MyReservations/CreateReservation";
import Reservation from "./pages/MyReservations/Reservation";
import ReservationSummary from "./pages/MyReservations/ReservationSummary";

import ForgotPassword from "./pages/AuthPages/ForgotPassword";
import Verification from "./pages/AuthPages/Verification";
import NewPassword from "./pages/AuthPages/NewPassword";

import UsageHistory from "./pages/History/UsageHistory";

import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";

export default function App() {
  return (
    <>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Dashboard Layout */}
          <Route element={<AppLayout />}>
          {/* Auth */}
            <Route path="/" element={<Navigate to="/signin" replace />} />
            
            <Route index path="/dashboard" element={<Home />} />

            {/* My Reservations */}
            <Route path="/my-reservations" element={<Reservation />} />
            <Route path="/my-reservations/create" element={<CreateReservation />} />
            <Route path="/my-reservations/summary" element={<ReservationSummary />} />

            {/* History */}
            <Route path="/usage-history" element={<UsageHistory />} />

            {/* Others Page */}
            <Route path="/profile" element={<UserProfiles />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/blank" element={<Blank />} />

            {/* Forms */}
            <Route path="/form-elements" element={<FormElements />} />

            {/* Tables */}
            <Route path="/basic-tables" element={<BasicTables />} />

            {/* Ui Elements */}
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/avatars" element={<Avatars />} />
            <Route path="/badge" element={<Badges />} />
            <Route path="/buttons" element={<Buttons />} />
            <Route path="/images" element={<Images />} />
            <Route path="/videos" element={<Videos />} />

            {/* Charts */}
            <Route path="/line-chart" element={<LineChart />} />
            <Route path="/bar-chart" element={<BarChart />} />
          </Route>

          {/* Auth Layout */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          <Route index path="/forgot-password" element={<ForgotPassword  />} />
          <Route index path="/verification" element={<Verification />} />
          <Route index path="/new-password" element={<NewPassword />} />

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}
