# Stonemoor County Community Website — setup guide

This is a browser-friendly starter website for GitHub Pages + Supabase. It includes the visual website, account sign-up/login, persistent chat, live message refresh, public announcements, and database-enforced admin permissions.

## Part 1 — Create the GitHub repository

1. Open https://github.com/new and sign in.
2. Repository name: `stonemoor-community`
3. Set it to **Public** (GitHub Free needs a public repository for GitHub Pages).
4. Leave **Add a README** checked and choose **Create repository**.
5. On the repository page choose **Add file → Upload files**.
6. Open the downloaded ZIP on your computer and extract it. Upload the files inside the `Stonemoor_Community_Website` folder (not the enclosing folder itself): `index.html`, `style.css`, `app.js`, `supabase-setup.sql`, and `SETUP-GUIDE.md`.
7. Click **Commit changes**.

GitHub's official guide: https://docs.github.com/en/pages/quickstart

## Part 2 — Create the database and accounts

1. Open https://supabase.com/ and create/sign in to an account.
2. Create a new project. Name it `Stonemoor Community`. Save the database password somewhere safe.
3. Wait for the project to finish provisioning.
4. Open **SQL Editor** → **New query**.
5. In GitHub, open `supabase-setup.sql`, copy the entire contents and paste them into the Supabase SQL Editor.
6. Click **Run**. Check for any errors before continuing.
7. In Supabase, open **Project Settings → API** (or the project's Connect/API details panel, depending on the current dashboard layout). Copy the **Project URL** and the **publishable key** (often labelled `anon` on older projects).
8. In GitHub, open `app.js` and click the pencil/edit button. At the top, replace:
   - `PASTE_YOUR_SUPABASE_PROJECT_URL_HERE` with your Project URL, keeping the quote marks.
   - `PASTE_YOUR_SUPABASE_PUBLISHABLE_KEY_HERE` with your publishable/anon key, keeping the quote marks.
9. Click **Commit changes**.

**Important:** Only use the publishable/anon key in browser code. Never put a `service_role` key or Supabase secret key into `app.js` or any public file.

## Part 3 — Make your own account an administrator

1. Open your website after deployment and create an account with your email.
2. If email confirmation is enabled, open the confirmation email and confirm the account.
3. Log in to the website at least once.
4. In Supabase, open **SQL Editor → New query**.
5. Run this query, replacing the email with the exact email address you used to register:

```sql
update public.profiles
set role = 'admin'
where id = (
  select id from auth.users
  where lower(email) = lower('YOUR-EMAIL@example.com')
);
```

6. Check the result says one row was updated. Log out and back in on the website. Your account should now show a **Post announcement** button.

Never let users edit their own role; the SQL permissions are designed to stop that.

## Part 4 — Publish the website

1. In the GitHub repository, open **Settings**.
2. In the left sidebar, choose **Pages**.
3. Under **Build and deployment**, select **Deploy from a branch**.
4. Choose branch `main` and folder `/(root)`, then click **Save**.
5. Wait a few minutes. The site URL will appear on the Pages settings screen, usually `https://YOUR-GITHUB-USERNAME.github.io/stonemoor-community/`.

## Part 5 — Test it

- Open the public website in a browser.
- Create a member account and confirm the email if asked.
- Log in and send a message in Community lounge.
- Open the website in a second browser/private window, sign in with another account, and check that messages appear for both signed-in members.
- Sign in as the admin and test **Post announcement**.
- If the website shows preview mode, check the two Supabase values at the top of `app.js` and commit the changes again.

## What this starter includes

- Dark green/black responsive layout for desktop and mobile
- Sign-up and login through Supabase Auth
- Profiles and member/admin roles
- Saved chat messages and realtime message updates for signed-in users
- Public announcement feed
- Admin-only announcement creation, enforced by database policies
- Basic input limits and HTML escaping for user-generated text

## Current limitations / next improvements

- The starter does not yet include a full admin dashboard for deleting chat messages, banning members, editing announcements, or viewing reports.
- Supabase email confirmation and allowed redirect URLs may need configuring in the Supabase Authentication settings for your deployed GitHub Pages URL.
- GitHub Pages publishes a public static site. Do not put private information or secret keys in the repository.
- This is a starter, so test permissions with a normal member account before inviting your whole community.
