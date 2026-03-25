# Forze Auth Email Branding

The app now sends branded post-auth notifications from `Forze` after:

- successful sign-in
- email confirmation
- successful password change

These notifications use `FORZE_RESEND_API_KEY` and `FORZE_FROM_EMAIL` when configured.

## Environment

Set these variables in production:

```bash
FORZE_RESEND_API_KEY=...
FORZE_FROM_EMAIL="Forze <no-reply@your-domain.com>"
```

## Supabase auth emails

The confirmation and password-reset emails that Supabase sends for sign-up and recovery are still controlled by Supabase Auth settings. To make those emails truly come from `Forze`, update the Supabase Auth email templates and sender name in the Supabase dashboard or connect a custom SMTP provider there.

That dashboard-level change is required because the Next.js app cannot rewrite the provider-generated email before it is sent.
