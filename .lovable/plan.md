

# Rebuild IT Support BD Portal as React + Supabase

## Overview

Your portal is currently written in PHP with a MySQL database. Since Lovable runs React (not PHP), we need to **rebuild the entire portal as a React application** using Supabase for authentication and database. The PHP files cannot run here -- they must be rewritten as React pages and Supabase edge functions.

This is a large project. We will build it in phases, starting with the most critical features.

---

## Phase 1: Database Setup (Supabase Migrations)

Create all the database tables matching your current MySQL schema:

**Tables to create:**
- `customers` -- first_name, last_name, email (linked to auth.users)
- `profiles` -- customer_id, avatar_url, address, phone
- `admin_users` -- username, email (linked to auth.users)
- `user_roles` -- user_id, role (admin/customer) -- required for security
- `products` -- name, description, price, max_devices, license_duration_days, category
- `licenses` -- customer_id, product_id, license_key, status, max_devices, current_devices, expires_at, bound_installation_id, last_active_at
- `orders` -- customer_id, total_amount, status, payment_method, transaction_id, sender_number
- `order_items` -- order_id, product_id, quantity, price, license_key_generated
- `support_tickets` -- customer_id, subject, message, status
- `ticket_replies` -- ticket_id, sender_id, sender_type, message

**Security:**
- RLS policies on all tables
- `has_role()` security definer function for admin checks
- Customers can only see their own data
- Admins can see everything

---

## Phase 2: Authentication & Core Layout

- Remove all current root files (Index, Login, NotFound, etc.)
- Set up Supabase auth (email/password sign-up and sign-in)
- Create shared layout with the glassmorphism navbar from your portal
- Port your `portal-style.css` for the dark glass theme

**Pages:**
- `/` -- Public landing page (from your index.php)
- `/login` -- Customer login (from your login.php)
- `/register` -- Customer registration with auto free license (from registration.php)
- `/admin-login` -- Admin login (from adminpanel.php)

---

## Phase 3: Customer Portal Pages

- `/dashboard` -- License list + order history (from dashboard.php)
- `/products` -- Product catalog with categories (from products.php)
- `/cart` -- Shopping cart (React state, no session needed)
- `/payment` -- Checkout with manual payment methods (from payment.php)
- `/profile` -- Edit profile, avatar, address, phone (from profile.php)
- `/change-password` -- Password change (from change_password.php)
- `/support` -- Ticket list, create ticket, view replies (from support.php)

---

## Phase 4: Admin Panel Pages

- `/admin` -- Dashboard with stats (customers, products, licenses, orders, revenue)
- `/admin/licenses` -- Generate, edit, release, delete licenses
- `/admin/products` -- Manage products
- `/admin/users` -- Manage customers
- `/admin/tickets` -- Manage support tickets
- `/admin/orders` -- View and approve orders

---

## Phase 5: License Verification API

- Create a Supabase edge function `verify-license` that replicates your `verify_license.php` logic
- Handles encrypted license validation for Docker AMPNM apps
- This keeps your Docker installations working with the new backend

---

## What Gets Removed

- All files in `portal.itsupport.com.bd/` subfolder (kept as reference, not executed)
- Current root `src/pages/Index.tsx` and `src/pages/Login.tsx` (replaced)
- Current `src/pages/NotFound.tsx` (replaced with portal-styled version)
- Pages related to docker-ampnm and script-ampnm React apps (AddDevicePage, EditDevicePage, etc.)

---

## What Gets Created (New Files)

Around 25-30 new React components/pages, 1 CSS file (ported from portal-style.css), 8-10 Supabase migrations, and 1-2 edge functions.

---

## Technical Details

- **Auth**: Supabase Auth with email/password. Auto-create profile + free license on sign-up via database trigger.
- **Roles**: Stored in `user_roles` table with `has_role()` security definer function. Admin pages check role server-side via RLS.
- **Cart**: Managed in React state (no server sessions needed).
- **Styling**: Your existing glassmorphism CSS ported into Tailwind + custom CSS. Dark navy theme preserved.
- **License verification**: Edge function with AES-256-CBC encryption matching your Docker app's expectations.

---

## Implementation Order

1. Connect Supabase (Lovable Cloud or external)
2. Create database schema migrations
3. Build auth pages (login, register, admin login)
4. Build customer pages (dashboard, products, cart, payment, profile, support)
5. Build admin pages (dashboard, licenses, products, users, tickets, orders)
6. Create license verification edge function
7. Clean up and remove PHP reference files

