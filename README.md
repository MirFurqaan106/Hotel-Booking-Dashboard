# HorizonStay | Hotel Booking Analytics Dashboard

A modern, portfolio-quality, and responsive SaaS Hotel Booking Analytics Dashboard built with **React**, **Recharts**, **React Router**, and **Vanilla CSS**. This dashboard mimics real-world analytics panels used by hoteliers and travel companies to track financial growth, analyze booking channels, manage room layout status, and review customer loyalty data.

---

## 🚀 Key Features

- **📊 Comprehensive KPI Cards**: Real-time evaluation of key performance metrics including Total Bookings, Total Revenue, Occupancy Rate, Cancellation Rate, Average Stay, Available Rooms, and Active Guest check-ins.
- **📈 Interactive Data Visualizations**: Fully responsive charts built with Recharts, containing:
  - *Revenue & Profit Trends* (Glassmorphic Area charts)
  - *Monthly Checked-In stays* (Bar charts)
  - *Occupancy Rates* (Line charts)
  - *Room Class & Booking Channels distribution* (Donut charts)
  - *Cancellation Rate & Customer Review ratios* (Grouped/Single Bar charts)
  - *Country-wise guest splits* (Horizontal Bar charts)
- **🔍 Advanced Guest & Booking Registry**: Table containing pagination, column sorting, dynamic searches (Guest Name, Booking ID, Country, Room Type), and status badges (Checked In, Confirmed, Checked Out, Cancelled). Includes a **CSV exporter** to download filtered reports.
- **👥 Interactive Customer CRM**: Directory grouping booking records by guest to compute total stays, aggregate financial spends, assign loyalty tiers (VIP, Gold, Silver, Regular), and inspect individual profile details alongside chronological stay timelines.
- **🏨 Live Room Layout Tracker**: Visual catalog of hotel rooms displaying real-time availability. Occupied cards show active guest details and check-out dates. Includes room class filter (Single, Double, Deluxe, President Suite).
- **⚙️ Account & Application Preferences**: Mock profile edit options, notifications controls, language toggles (English, Spanish, French, German), and **Light/Dark theme** selector.
- **📱 Responsive Mobile First Design**: Clean CSS Grid and Flexbox system adapting perfectly from desktop screens to tablets and mobile layouts.

---

## 🛠️ Tech Stack

- **Core Framework**: React (Vite template)
- **Languages**: JavaScript (ES6+), HTML5, CSS3 (Vanilla Custom Layout System)
- **Libraries**:
  - [Recharts](https://recharts.org/) for data visualizations
  - [React Icons](https://react-icons.github.io/react-icons/) (Lucide/Feather icons)
  - [React Router DOM](https://reactrouter.com/) for fluid client-side page routes
- **Tooling**: Node.js, Git, npm

---

## 📁 Folder Structure

```
hotel-booking-dashboard/
│
├── public/
│   └── vite.svg
│
├── src/
│   ├── assets/            # Static assets
│   ├── components/        # Reusable dashboard widgets
│   │   ├── BookingTable/  # Guest registry table with pagination & CSV export
│   │   ├── Charts/        # Recharts visual charts
│   │   ├── Filters/       # Dynamic date, status, and price filters
│   │   ├── Footer/        # Copyright and status bar
│   │   ├── Header/        # Page title banner & action reset buttons
│   │   ├── KPICards/      # Analytical metric grids
│   │   └── Sidebar/       # Responsive navigation sidebar
│   │
│   ├── context/
│   │   └── DashboardContext.jsx  # Global filters, theme & dataset state
│   │
│   ├── data/
│   │   └── bookings.json  # Comprehensive dataset containing 400 mock logs
│   │
│   ├── pages/             # Layout view controllers
│   │   ├── Dashboard/     # Analytical widgets and recent entries
│   │   ├── Bookings/      # Complete registry filter catalog
│   │   ├── Customers/     # Client CRM and stay timelines
│   │   ├── Rooms/         # Visual room grid status dashboard
│   │   ├── Revenue/       # Income margins and net profit details
│   │   └── Settings/      # Preferences configuration panel
│   │
│   ├── App.jsx            # Routing and global layouts
│   ├── App.css            # Overall dashboard grid styles
│   ├── main.jsx           # Client entrypoint
│   └── index.css          # Design variables, scrollbars & badges
│
├── README.md
├── package.json
└── eslint.config.js
```

---

## ⚙️ Installation & Running Locally

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed (v18+ recommended).

### Steps
1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/Hotel-Booking-Dashboard.git
   cd Hotel-Booking-Dashboard
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run in development mode**:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:5173`.

4. **Build production assets**:
   ```bash
   npm run build
   ```

---

## 🔮 Future Enhancements

- **Backend Integration**: Replace the static `bookings.json` with a live REST API (Node.js/Express) and relational database (PostgreSQL/MongoDB).
- **Live Booking Flow**: Add an interactive interface for managers to manually add, modify, or cancel client stays directly from the front-end.
- **Staff Operations Tracker**: Add a panel to assign room cleaning services, laundry orders, and room service deliveries to operational staff.
- **Printable PDF Reports**: Expand the CSV exporter to support full canvas-rendered PDF analytics reporting.
