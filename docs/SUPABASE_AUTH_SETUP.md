# YOUMOVE - Supabase Auth Setup Guide

## 1. Authentication Providers

### Email Provider
- Enable Email provider: YES
- Confirm email: ON (production) / OFF (development)
- Secure email change: ON
- Secure password change: ON

### Phone/SMS (optional)
- Configure Twilio for future SMS verification

---

## 2. General Settings

### Site URL
| Environment | URL |
|-------------|-----|
| Development | http://localhost:3000 |
| Staging | https://staging.youmove.app |
| Production | https://youmove.app |

### Redirect URLs (add all)
```
http://localhost:3000/**
https://staging.youmove.app/**
https://youmove.app/**
```

### JWT Expiry
- 3600 seconds (1 hour)

---

## 3. Social Login Providers (Future)

### Google
1. Create OAuth 2.0 credentials in Google Cloud Console
2. Add Client ID and Secret in Supabase
3. Scopes: email, profile

### Apple
1. Create App ID with Sign in with Apple capability
2. Create Service ID
3. Create Key
4. Add credentials in Supabase

### Facebook (optional)
1. Create Facebook App
2. Add credentials

---

## 4. Email Templates

Customize in Dashboard > Authentication > Email Templates:
- Confirm Signup
- Magic Link
- Change Email
- Reset Password

---

## 5. Rate Limiting

Default rate limiting is enabled. Adjust for production:
- SMS: 5 per hour per phone
- Email: 3 per hour per email

---

## 6. Edge Functions (Webhooks)

Create these Edge Functions:

### on-user-created
- Triggered after user signup
- Send welcome email
- Initialize analytics
- Create first workout recommendation

### on-user-deleted
- Cleanup user data
- Cancel subscriptions
- Remove from analytics

### on-password-changed
- Log security event
- Send notification email
