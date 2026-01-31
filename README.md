# Sakura Hotels Management System

A comprehensive, enterprise-grade hotel management platform designed to streamline operations, enhance guest engagement, and maximize revenue. Built with a modern, serverless architecture using Next.js 14 and Supabase.

## 🚀 Overview

Sakura Hotels bridges the gap between robust back-office administration and a seamless, interactive guest experience. It features a real-time reservation system, dynamic marketing tools, and a responsive public-facing catalog.

## ✨ Key Features

### 🏨 Admin Dashboard (Back-Office)
*   **Dashboard**: Real-time overview of occupancy, revenue, and booking statistics.
*   **Room Management**: Manage room inventory, status (Available, Occupied, Maintenance), and pricing.
*   **Reservations**: Complete booking lifecycle management (Pending -> Confirmed -> Checked In -> Checked Out).
*   **Invoices**: Generate and manage PDF invoices for reservations.
*   **Offers & Marketing**: Create real-time flash sales and discount codes that appear instantly on the public site.
*   **Packages**: Manage special packages (Corporate, Wedding, Featured) with custom inclusions.
*   **Services**: Manage hotel services (Dining, Travel, Sightseeing).
*   **Staff Management**: Role-Based Access Control (RBAC) for Managers, Receptionists, and Housekeeping.
*   **Testimonials**: Curate and display guest reviews.
*   **Settings**: Configure global site settings, contact info, and policies.

### 🛎️ Guest Experience (Public Site)
*   **Interactive Catalog**: Browse Rooms, Packages, and Services with filtering options.
*   **Real-Time Offers**: Live popups and marquees showing active deals and discount codes.
*   **Booking Engine**: Seamless inquiry and reservation request flow.
*   **Responsive Design**: Optimized for Mobile, Tablet, and Desktop.
*   **Contact & Inquiries**: Direct communication channels via WhatsApp or Inquiry Forms.

## 🛠️ Tech Stack

### Frontend
*   **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **Icons**: [Lucide React](https://lucide.dev/), [React Icons](https://react-icons.github.io/react-icons/)
*   **Animations**: [Framer Motion](https://www.framer.com/motion/)
*   **PDF Generation**: [jspdf](https://github.com/parallax/jsPDF)

### Backend & Database
*   **Platform**: [Supabase](https://supabase.com/)
*   **Database**: PostgreSQL
*   **Authentication**: Supabase Auth (SSR) + Secure Session Management
*   **Real-time**: Supabase Realtime (WebSockets)
*   **Storage**: Cloudinary (Secure Image Hosting)

## 📂 Project Structure

```bash
├── app/                  # Next.js App Router
│   ├── admin/            # Admin Dashboard routes (Protected)
│   ├── api/              # API Routes (Serverless functions)
│   ├── catalog/          # Public Room Catalog
│   ├── components/       # Shared UI Components
│   ├── context/          # React Context (Settings, Auth)
│   ├── lib/              # Utilities (Supabase client, Auth helpers)
│   └── ...
├── components/           # Reusable UI Components
│   ├── admin/            # Admin-specific components
│   ├── layout/           # Layout components (Navbar, Footer)
│   └── ui/               # Generic UI elements (Buttons, Inputs)
├── supabase/             # Database configuration
│   ├── functions/        # Supabase Edge Functions
│   └── schema.sql        # Database Schema definitions
└── public/               # Static assets
```

## 🗄️ Database Schema

The application uses the following key tables in Supabase:

*   `hotels`: Hotel property details.
*   `rooms`: Individual room units with pricing and status.
*   `reservations`: Guest bookings linked to rooms.
*   `services`: Additional services like Food, Travel.
*   `packages`: Bundled offers (e.g., Wedding Package).
*   `offers`: Promotional discount codes and flash sales.
*   `staff`: Admin users and their roles.
*   `invoices`: Billing records.
*   `quotations`: Inquiries from the contact form.
*   `testimonials`: Guest reviews.
*   `settings`: Global configuration (Site name, Currency, etc.).

## 🔐 Security & Roles

*   **Authentication**: Managed via Supabase Auth.
*   **RBAC (Role-Based Access Control)**:
    *   **Owner/Manager**: Full access to all modules.
    *   **Staff**: Restricted access based on assigned duties.
    *   **Customer**: Public access + personal booking data.
*   **RLS (Row Level Security)**: Database policies ensure users can only access data permitted by their role.

## 📦 Getting Started

### Prerequisites
*   Node.js 18+
*   npm or yarn
*   A Supabase project
*   A Cloudinary account

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-org/sakura-hotels.git
    cd sakura-hotels
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Setup**:
    Create a `.env.local` file in the root directory and add the following variables:

    ```env
    # Supabase Configuration
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

    # Cloudinary Configuration (For Image Uploads)
    CLOUDINARY_CLOUD_NAME=your_cloud_name
    CLOUDINARY_API_KEY=your_api_key
    CLOUDINARY_API_SECRET=your_api_secret
    ```

4.  **Database Setup**:
    *   Go to your Supabase SQL Editor.
    *   Run the scripts located in `supabase/schema.sql`.
    *   Run `supabase/create_offers_table.sql` and `supabase/create_testimonials_table.sql` to ensure all tables are created.
    *   Run `supabase/enable_realtime.sql` and `supabase/enable_offers_realtime.sql` to enable real-time updates for rooms, reservations, and offers.

5.  **Run Development Server**:
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🚀 Deployment

The easiest way to deploy this Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

1.  Push your code to a Git repository (GitHub, GitLab, BitBucket).
2.  Import your project into Vercel.
3.  Add the environment variables (Supabase and Cloudinary keys) in the Vercel project settings.
4.  Deploy!

Check out the [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1.  Fork the project.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
