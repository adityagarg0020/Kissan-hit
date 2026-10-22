import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { MarketProvider } from './context/MarketContext';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Dedicated Route Pages
import DashboardPage from './pages/DashboardPage';
import LiveMarketPage from './pages/LiveMarketPage';
import NearbyMandisPage from './pages/NearbyMandisPage';
import ComparisonPage from './pages/ComparisonPage';
import HistoricalPage from './pages/HistoricalPage';
import PredictionPage from './pages/PredictionPage';
import SellDecisionPage from './pages/SellDecisionPage';
import AlertsPage from './pages/AlertsPage';
import AiAssistantPage from './pages/AiAssistantPage';
import ExpenseTrackerPage from './pages/ExpenseTrackerPage';
import WeatherPage from './pages/WeatherPage';
import LoginPage from './pages/LoginPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import FarmerProfilePage from './pages/FarmerProfilePage';
import LandingPage from './pages/LandingPage';

export default function App() {
  return (
    <AuthProvider>
      <MarketProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Farmer-First Landing Page */}
            <Route path="/" element={<LandingPage />} />

            {/* Public Authentication Pages */}
            <Route path="login" element={<LoginPage />} />
            <Route path="reset-password" element={<ResetPasswordPage />} />

            {/* In-App Workspace Shell — All Features Protected (Login Required) */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              {/* 1. Dashboard */}
              <Route path="dashboard" element={<DashboardPage />} />

              {/* 2. Live Mandi Prices */}
              <Route path="market" element={<LiveMarketPage />} />

              {/* 3. Nearby Mandis */}
              <Route path="nearby-mandis" element={<NearbyMandisPage />} />

              {/* 4. Price Comparison */}
              <Route path="comparison" element={<ComparisonPage />} />

              {/* 5. Historical Analysis */}
              <Route path="historical" element={<HistoricalPage />} />

              {/* 6. AI Price Prediction */}
              <Route path="prediction" element={<PredictionPage />} />

              {/* 7. Sell Decision */}
              <Route path="sell-decision" element={<SellDecisionPage />} />

              {/* 8. Weather Report & Alerts */}
              <Route path="weather" element={<WeatherPage />} />

              {/* 9. AI Assistant Chatbot */}
              <Route path="ai-assistant" element={<AiAssistantPage />} />

              {/* 10. Farmer Profile */}
              <Route path="profile" element={<FarmerProfilePage />} />

              {/* 11. Farm Expenses */}
              <Route path="expenses" element={<ExpenseTrackerPage />} />

              {/* 12. Price Alerts */}
              <Route path="alerts" element={<AlertsPage />} />
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </MarketProvider>
    </AuthProvider>
  );
}
