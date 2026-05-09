# OWASP A05: Security Misconfiguration - HTTP Headers, CSP & CSRF Audit

**Date:** 2026-05-09  
**File:** `next.config.ts`, `src/lib/session.ts`  
**Verdict:** **GRADE: C** (Partial. Strong session & CSRF posture, but missing HSTS + CSP creates material risk.)

---

## 1. Headers Inventory

### Present (✅)
| Header | Value | Status |
|--------|-------|--------|
| X-Content-Type-Options | nosniff | ✅ |
| X-Frame-Options | DENY | ✅ |
| Referrer-Policy | strict-origin-when-cross-origin | ✅ |
| Permissions-Policy | camera=(), microphone=(), geolocation=(self) | ✅ |
| X-Powered-By | *disabled* | ✅ |

### Missing (❌)
| Header | Severity | Fix |
|--------|----------|-----|
| **Strict-Transport-Security (HSTS)** | HIGH | Add `max-age=31536000; includeSubDomains; preload` |
| **Content-Security-Policy** | HIGH | Implement baseline CSP for Tailwind 4 + lucide + shadcn/ui |

---

## 2. CSP Status: MISSING

**Severity:** HIGH  
**Impact:** No protection against XSS, unsafe inline scripts/styles accepted.

**Reason for Project:** Tailwind 4 uses dynamic style injection; shadcn/ui + lucide-react use client-side JS. Standard `'unsafe-inline'` CSP required temporarily.

**Recommended Minimum:**
```
default-src 'self';
script-src 'self' 'unsafe-inline';
style-src 'self' 'unsafe-inline';
img-src 'self' https: data:;
connect-src 'self' https://api.groq.com https://api.open-meteo.com https://overpass-api.de;
font-src 'self' data:;
frame-ancestors 'none';
```

---

## 3. CSRF Protection: ✅ SECURE

- **Server Actions:** Next.js built-in `__next_action_id` token automatically applied on `<form action={serverAction}>`.
- **Route Handlers:** Both `/api/health` and `/api/demo/scoring-status` are GET-only; no mutation risk.
- **Fetch-Based Mutations:** None detected in codebase.

**Verdict:** CSRF posture is strong for current scope.

---

## 4. Session/Cookie Security: ✅ SECURE

**File:** `src/lib/session.ts:31-37`

```typescript
cookieOptions: {
  httpOnly: true,         // ✅ prevents XSS access
  secure: true (prod),    // ✅ HTTPS-only in production
  sameSite: "lax",        // ✅ cross-site POST protected
  maxAge: 60 * 60 * 24 * 30,  // 30 days
  path: "/",
}
```

---

## 5. Other Checks

| Check | Status | Finding |
|-------|--------|---------|
| Mixed Content (http://) | ✅ PASS | No hardcoded insecure URLs |
| CORS Misconfiguration | ✅ PASS | No `Access-Control-Allow-Origin: *` |
| robots.txt | ❌ MISSING | Create `public/robots.txt` for SEO polish |
| .well-known/security.txt | ❌ MISSING | Add for disclosure policy (production nice-to-have) |
| Server Timing Leaks | ✅ PASS | `poweredByHeader: false` prevents X-Powered-By leak |

---

## Top 3 Fixes (Priority)

### 1. Add HSTS Header (next.config.ts:21)
**Severity:** HIGH  
**File:Line:** `next.config.ts:21`

```diff
headers: [
  // ... existing headers ...
+ { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
]
```

### 2. Implement CSP Header (next.config.ts:21)
**Severity:** HIGH  
**File:Line:** `next.config.ts:21`

```diff
headers: [
  // ... existing headers ...
+ {
+   key: "Content-Security-Policy",
+   value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; connect-src 'self' https://api.groq.com https://api.open-meteo.com https://overpass-api.de; font-src 'self' data:; frame-ancestors 'none';"
+ },
]
```

### 3. Add robots.txt (public/robots.txt)
**Severity:** MEDIUM  
**File:Line:** Create new file

```
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /onboarding/
Sitemap: https://showup2move.example.com/sitemap.xml
```

---

## Summary

- **HSTS + CSP:** Missing. Implement both before production.
- **Session/Cookies:** Excellent `httpOnly`, `secure`, `sameSite=lax` posture.
- **CSRF:** Covered by Next.js server action token + GET-only routes.
- **CORS:** No misconfiguration detected.
- **Security Metadata:** robots.txt missing (SEO polish).

**OWASP A05 Grade: C** → **Target: A** (add HSTS + CSP, create robots.txt).
