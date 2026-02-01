# BR31 PMS (Property Management System)

A comprehensive, enterprise-grade property management platform designed to streamline operations for Paying Guest (PG) accommodations. Built with a modern, serverless architecture using Next.js 14 and Supabase.

**Status:** 🟢 **Production Ready** (Security Hardened)

## 🚀 Overview

BR31 PMS bridges the gap between robust back-office administration and a seamless, interactive guest experience. It features a real-time reservation system, dynamic marketing tools, and a responsive public-facing catalog for both Hotels and PGs.

## ✨ Key Features

### 🏨 Admin & Owner Dashboard (Back-Office)
*   **Dashboard**: Real-time overview of occupancy, revenue, and booking statistics.
*   **Property Management**: Manage multiple properties, including Hotels and PGs.
*   **Room & Inventory**: Manage room inventory, status (Available, Occupied, Maintenance), and pricing.
*   **Reservations**: Complete booking lifecycle management.
*   **Operations**:
    *   **Maintenance**: Track and resolve maintenance requests.
    *   **Complaints**: Manage guest/tenant complaints.
    *   **Inquiries**: Handle new booking inquiries.
*   **Financials**:
    *   **Invoices**: Generate and manage PDF invoices.
    *   **Subscriptions**: Manage owner subscriptions and payments.
*   **Marketing**:
    *   **Offers**: Create real-time flash sales and discount codes.
    *   **Packages**: Manage special packages.
    *   **Blogs**: Publish content to engage users.
    *   **Testimonials**: Curate guest reviews.
*   **Staff Management**: Role-Based Access Control (RBAC) for Admins, Staff, and Owners.
*   **Settings**: Configure global site settings and policies.

### 🛎️ Guest & Tenant Experience (Public Site)
*   **Interactive Catalog**: Browse Hotels and PGs with advanced filtering (City, Amenities, Price).
*   **Booking Engine**: Seamless inquiry and reservation request flow.
*   **User Profile**:
    *   **Dashboard**: View booking history and status.
    *   **Wishlist**: Save favorite properties.
    *   **Support**: Raise support tickets or complaints.
*   **Real-Time Offers**: Live popups showing active deals.
*   **Responsive Design**: Optimized for Mobile, Tablet, and Desktop.

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
*   **Payments**: Razorpay Integration

## 📂 Project Structure

```bash
├── app/                  # Next.js App Router
│   ├── admin/            # Admin Dashboard routes (Protected)
│   ├── api/              # API Routes (Serverless functions)
│   ├── catalog/          # Public Room/Property Catalog
│   ├── pg/               # PG specific routes
│   ├── profile/          # User Profile routes
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
│   └── schema.sql        # Consolidated Database Schema
└── public/               # Static assets
```

## 🔐 Security & Roles

*   **Authentication**: Managed via Supabase Auth with server-side session verification.
*   **RBAC (Role-Based Access Control)**:
    *   **Admin**: Full system access.
    *   **Owner**: Manage their own properties and listings (Requires Subscription).
    *   **Staff**: Restricted access based on assigned duties.
    *   **User/Tenant**: Public access, booking management, and wishlist.
*   **RLS (Row Level Security)**: Database policies ensure users can only access data permitted by their role.

## 📦 Getting Started

### Prerequisites
*   Node.js 18+
*   npm or yarn
*   A Supabase project
*   A Cloudinary account
*   A Razorpay account (for payments)

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-org/br31-pms.git
    cd br31-pms
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

    # Razorpay Configuration (For Payments)
    RAZORPAY_KEY_ID=your_razorpay_key_id
    RAZORPAY_KEY_SECRET=your_razorpay_key_secret
    ```

4.  **Database Setup**:
    *   Go to your Supabase SQL Editor.
    *   Run the script located in `supabase/schema.sql`. This single file contains the complete schema including tables, RLS policies, and triggers.

5.  **Run Development Server**:
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🚀 Deployment

The easiest way to deploy this Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

1.  Push your code to a Git repository (GitHub, GitLab, BitBucket).
2.  Import your project into Vercel.
3.  Add the environment variables (Supabase, Cloudinary, and Razorpay keys) in the Vercel project settings.
4.  Deploy!

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1.  Fork the project.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
