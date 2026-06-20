import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Toaster } from "@/components/ui/Toaster";
import Dashboard from "@/pages/Dashboard";
import Spaces from "@/pages/Spaces";
import Reservations from "@/pages/Reservations";
import Attendance from "@/pages/Attendance";
import Learning from "@/pages/Learning";
import Billing from "@/pages/Billing";
import Access from "@/pages/Access";
import Blacklist from "@/pages/Blacklist";
import PermanentSeats from "@/pages/PermanentSeats";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/spaces" element={<Spaces />} />
          <Route path="/reservations" element={<Reservations />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/learning" element={<Learning />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/access" element={<Access />} />
          <Route path="/blacklist" element={<Blacklist />} />
          <Route path="/permanent-seats" element={<PermanentSeats />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      <Toaster />
    </Router>
  );
}
