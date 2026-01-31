# Production Feasibility Report: PG_DEKHO (Sakura Hotels)

**Date:** 2026-01-31  
**Status:** 🔴 **High Risk / Not Production Ready**

## 1. Executive Summary

The application is a hotel management system built with a modern tech stack (Next.js 14, Supabase, Tailwind). While the UI structure and database schema are well-designed, the application suffers from **critical security vulnerabilities** that make it unsafe for public deployment. Specifically, the authentication mechanism contains a "backdoor" that allows anyone to become an admin, and sensitive secrets are exposed in the codebase.

**Recommendation:** Do **NOT** deploy to production until the security issues listed in Section 2 are resolved.

---

## 2. Critical Security Issues (Must Fix)

### A. Authentication Bypass (The "Backdoor")
*   **Severity:** 🚨 Critical
*   **Description:** The application uses a custom API route (`/api/session`) that sets a "logged in" cookie without actually verifying credentials. Any user can send a POST request to this endpoint with `{"role": "owner"}` to gain full administrative access.
*   **Vulnerable File:** `app/api/session/route.ts`
*   **Fix Required:** Remove the custom cookie logic. Adopt standard Supabase Server-Side Auth (SSR) and verify JWT tokens in middleware.

### B. Privilege Escalation & Insecure Admin Creation
*   **Severity:** 🚨 Critical
*   **Description:** The `/api/admin/create-staff` route allows the creation of new staff/admin accounts. It relies on the insecure cookie mentioned above for protection. An attacker can bypass this check and use the server's own `SERVICE_ROLE_KEY` to create unauthorized admin accounts.
*   **Vulnerable File:** `app/api/admin/create-staff/route.ts`
*   **Fix Required:** Implement strict server-side session validation using `supabase.auth.getUser()` before processing any admin requests.

### C. Unauthenticated File Uploads
*   **Severity:** 🟠 High
*   **Description:** The `/api/upload` route allows unauthenticated users to upload arbitrary files to the configured Cloudinary account. This exposes the project to storage abuse and malicious content hosting.
*   **Vulnerable File:** `app/api/upload/route.ts`
*   **Fix Required:** Add authentication checks to the upload endpoint.

### D. Secrets Exposure
*   **Severity:** 🚨 Critical
*   **Description:** The `.env.example` file contains what appear to be real production credentials (e.g., `SUPABASE_SERVICE_ROLE_KEY`, `BR31_ANGELHR_PASSWORD`).
*   **Fix Required:** 
    1. Rotate all exposed keys immediately in the Supabase and Cloudinary dashboards.
    2. Remove real values from `.env.example`.
    3. Ensure `.env` is included in `.gitignore` (it currently is, which is good).

---

## 3. Tech Stack & Architecture

| Component | Technology | Assessment |
| :--- | :--- | :--- |
| **Frontend** | Next.js 14 (App Router), React 18 | ✅ **Excellent**: Modern, performance-oriented structure. |
| **Styling** | Tailwind CSS, Framer Motion | ✅ **Excellent**: Clean, maintainable UI code. |
| **Language** | TypeScript | ⚠️ **Good**: Mostly typed, though strictness could be improved (some `any` usage). |
| **Database** | Supabase (PostgreSQL) | ✅ **Excellent**: Schema is well-normalized with proper constraints. |
| **Auth** | Supabase Auth + Custom Cookies | ❌ **Poor**: Current implementation is insecure (see Section 2). |
| **Storage** | Cloudinary | ⚠️ **Fair**: Needs better access control policies. |

---

## 4. Code Quality & Scalability

*   **Database Schema:** The SQL schema (`supabase/schema.sql`) is a strong point. It uses:
    *   UUIDs for primary keys (scalable).
    *   `CHECK` constraints for data integrity (e.g., status validation).
    *   Foreign keys with `ON DELETE CASCADE`.
*   **Project Structure:** The folder structure follows Next.js App Router best practices (`app/`, `components/`, `lib/`).
*   **Configuration:** `next.config.mjs` has a wildcard image permission (`hostname: "**"`), which is a minor security risk (XSS via SVG, etc.). It should be scoped to specific domains.

---

## 5. Roadmap to Production

To bring this application to a production-ready state, the following steps are mandatory:

### Phase 1: Security Hardening (Immediate Priority)
1.  [ ] **Rotate Secrets:** Change Supabase Service Key and Cloudinary credentials.
2.  [ ] **Fix Auth:** Delete `app/api/session`. Implement `@supabase/ssr` for secure cookie handling.
3.  [ ] **Update Middleware:** Rewrite `middleware.ts` to verify Supabase sessions securely.
4.  [ ] **Protect API Routes:** Add session verification to `api/upload` and `api/admin/*`.

### Phase 2: Data Protection
1.  [ ] **Enable RLS:** Enable Row Level Security on all Supabase tables.
2.  [ ] **Define Policies:** Write SQL policies to ensure customers can only see their own data, and staff can only access relevant records.

### Phase 3: Deployment Prep
1.  [ ] **Environment Config:** Set up environment variables on the hosting platform (Vercel/Netlify).
2.  [ ] **Build Verification:** Run `npm run build` to catch and fix any lingering TypeScript errors.
3.  [ ] **Image Optimization:** Restrict `remotePatterns` in `next.config.mjs`.

---

**Generated by Trae**
