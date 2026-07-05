import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import bookingsData from '../data/bookings.json';

const DashboardContext = createContext();

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};

export const DashboardProvider = ({ children }) => {
  // Theme state: default to localStorage or dark if preferred
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('dashboard-theme');
    if (saved) return saved;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  });

  // Language state
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('dashboard-lang') || 'en';
  });

  // Sidebar responsive toggle
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Filter state
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    roomType: 'All',
    country: 'All',
    bookingStatus: 'All',
    paymentStatus: 'All',
    priceRange: [0, 5000], // Will adjust max price dynamically
  });

  // Search query
  const [searchQuery, setSearchQuery] = useState('');

  // Apply theme to body
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('dashboard-theme', theme);
  }, [theme]);

  // Apply language to local storage
  useEffect(() => {
    localStorage.setItem('dashboard-lang', language);
  }, [language]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Find dynamic max price from dataset
  const maxBookingPrice = useMemo(() => {
    return Math.max(...bookingsData.map((b) => b.Revenue), 1000);
  }, []);

  // Update default price range once bookings are loaded
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      priceRange: [0, maxBookingPrice],
    }));
  }, [maxBookingPrice]);

  // Unique lists for filter options
  const filterOptions = useMemo(() => {
    const countriesSet = new Set(bookingsData.map((b) => b.Country));
    const roomTypesSet = new Set(bookingsData.map((b) => b.RoomType));
    const statusesSet = new Set(bookingsData.map((b) => b.BookingStatus));
    const paymentsSet = new Set(bookingsData.map((b) => b.PaymentStatus));

    return {
      countries: ['All', ...Array.from(countriesSet).sort()],
      roomTypes: ['All', ...Array.from(roomTypesSet).sort()],
      bookingStatuses: ['All', ...Array.from(statusesSet).sort()],
      paymentStatuses: ['All', ...Array.from(paymentsSet).sort()],
    };
  }, []);

  // Filter and Search logic
  const filteredBookings = useMemo(() => {
    return bookingsData.filter((booking) => {
      // 1. Search Query filter (GuestName, BookingID, Country, RoomType)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          booking.GuestName.toLowerCase().includes(query) ||
          booking.BookingID.toLowerCase().includes(query) ||
          booking.Country.toLowerCase().includes(query) ||
          booking.RoomType.toLowerCase().includes(query);

        if (!matchesSearch) return false;
      }

      // 2. Room Type filter
      if (filters.roomType !== 'All' && booking.RoomType !== filters.roomType) {
        return false;
      }

      // 3. Country filter
      if (filters.country !== 'All' && booking.Country !== filters.country) {
        return false;
      }

      // 4. Booking Status filter
      if (filters.bookingStatus !== 'All' && booking.BookingStatus !== filters.bookingStatus) {
        return false;
      }

      // 5. Payment Status filter
      if (filters.paymentStatus !== 'All' && booking.PaymentStatus !== filters.paymentStatus) {
        return false;
      }

      // 6. Price Range filter (Revenue)
      if (booking.Revenue < filters.priceRange[0] || booking.Revenue > filters.priceRange[1]) {
        return false;
      }

      // 7. Date Range filter (CheckIn date)
      if (filters.startDate) {
        if (new Date(booking.CheckIn) < new Date(filters.startDate)) {
          return false;
        }
      }
      if (filters.endDate) {
        if (new Date(booking.CheckIn) > new Date(filters.endDate)) {
          return false;
        }
      }

      return true;
    });
  }, [filters, searchQuery]);

  const resetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      roomType: 'All',
      country: 'All',
      bookingStatus: 'All',
      paymentStatus: 'All',
      priceRange: [0, maxBookingPrice],
    });
    setSearchQuery('');
  };

  const value = {
    allBookings: bookingsData,
    filteredBookings,
    filters,
    setFilters,
    searchQuery,
    setSearchQuery,
    filterOptions,
    resetFilters,
    maxBookingPrice,
    theme,
    toggleTheme,
    language,
    setLanguage,
    sidebarCollapsed,
    setSidebarCollapsed,
    mobileSidebarOpen,
    setMobileSidebarOpen,
  };

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
};
