# **SECURITY ARCHITECTURE DOCUMENT**

## **Project**

**Alumni Professional Information Update Management System (APIUMS)**

Version: **1.0**

Classification: **Internal College Application**

---

# **1\. Security Objectives**

The system must ensure:

* Confidentiality  
* Integrity  
* Availability  
* Authentication  
* Authorization  
* Accountability  
* Auditability

---

# **2\. Security Layers**

The application uses **Defense in Depth**.

Internet  
      │  
      ▼  
IIS  
      │  
      ▼  
HTTPS  
      │  
      ▼  
Helmet Security Headers  
      │  
      ▼  
Rate Limiter  
      │  
      ▼  
Authentication  
      │  
      ▼  
Authorization  
      │  
      ▼  
Validation  
      │  
      ▼  
Business Logic  
      │  
      ▼  
Parameterized SQL Queries  
      │  
      ▼  
Microsoft SQL Server  
---

# **3\. Authentication Design**

Authentication method:

* Username  
* Password  
* JWT Access Token  
* Refresh Token

Password Flow

User Password

↓

bcrypt Hash

↓

Store Hash

↓

Login

↓

bcrypt.compare()

↓

JWT Generated

Passwords are **never stored in plaintext**.

---

# **4\. Authorization**

Role Based Access Control (RBAC)

Three Roles

Admin

↓

Leader

↓

Member

Every request passes through:

JWT Middleware  
        ↓  
Role Middleware  
        ↓  
Controller  
---

# **5\. RBAC Matrix**

| Feature | Admin | Leader | Member |
| ----- | ----- | ----- | ----- |
| Login | ✓ | ✓ | ✓ |
| Dashboard | ✓ | ✓ | ✓ |
| User Management | ✓ | ✗ | ✗ |
| Team Management | ✓ | ✗ | ✗ |
| Assign Batch | ✓ | ✗ | ✗ |
| Round Robin | ✗ | ✓ | ✗ |
| View Assigned Alumni | ✓ | ✓ | ✓ |
| Update Alumni | ✗ | ✓ (own assigned) | ✓ |
| Import Excel | ✓ | ✗ | ✗ |
| Export Reports | ✓ | ✓ | ✗ |
| Audit Logs | ✓ | ✗ | ✗ |
| System Settings | ✓ | ✗ | ✗ |

---

# **6\. JWT Strategy**

Access Token

* Short lifetime (e.g., 15–30 minutes)

Refresh Token

* Longer lifetime (e.g., 7 days)

The refresh token should be stored securely (preferably in an HTTP-only cookie if the frontend and backend are served together).

---

# **7\. Token Lifecycle**

Login  
   │  
   ▼  
Access Token \+ Refresh Token  
   │  
   ▼  
API Requests  
   │  
   ▼  
Access Token Expired?  
   │  
 ┌─┴────────────┐  
 │ No           │ Yes  
 ▼              ▼  
Continue   Refresh Token  
                 │  
                 ▼  
          New Access Token  
---

# **8\. Password Policy**

Minimum Requirements

* Minimum 8 characters  
* Maximum 64 characters  
* At least:  
  * 1 uppercase letter  
  * 1 lowercase letter  
  * 1 number  
  * 1 special character

Passwords are hashed with **bcrypt**.

Passwords are never returned in API responses.

---

# **9\. Login Protection**

Rate Limit

5 failed login attempts

↓

Temporary lock (15 minutes)

Log every failed login attempt with timestamp and IP address.

---

# **10\. Session Management**

* Stateless authentication using JWT.  
* Server does not maintain user sessions.  
* Refresh tokens can be revoked by the administrator (e.g., after a password reset).

---

# **11\. SQL Injection Protection**

Rules

* Use parameterized queries only.  
* Never concatenate SQL strings with user input.  
* Validate all input before reaching the repository layer.

Example (conceptually)

GOOD

SELECT \* FROM Users WHERE Username \= @username

BAD

SELECT \* FROM Users WHERE Username \= '" \+ username \+ "'"  
---

# **12\. XSS Protection**

* Escape user-generated content before rendering.  
* Sanitize input where appropriate.  
* Set a Content Security Policy (CSP) using Helmet.  
* Avoid injecting HTML directly into the DOM.

---

# **13\. CSRF Protection**

If JWT is stored in an HTTP-only cookie:

* Implement CSRF tokens for state-changing requests.

If JWT is stored in memory and sent in the `Authorization` header:

* CSRF risk is significantly reduced.

---

# **14\. Brute Force Protection**

* Rate limit login endpoint.  
* Temporary account lock after repeated failures.  
* Log suspicious activity.

---

# **15\. Broken Authentication Prevention**

* Strong password policy.  
* Password hashing.  
* JWT signature validation.  
* Token expiration.  
* Secure refresh token handling.  
* Password reset invalidates existing refresh tokens.

---

# **16\. Broken Authorization Prevention**

Every protected endpoint must:

1. Verify JWT.  
2. Verify role.  
3. Verify resource ownership.

Example

A Team Member can only access alumni records assigned to them.

---

# **17\. Sensitive Data Protection**

Do not expose:

* Password hashes  
* Refresh tokens  
* Internal IDs that are not required by the client  
* Server stack traces  
* Database connection details

Use HTTPS in production.

---

# **18\. File Upload Security**

Allowed file types

* `.xlsx`  
* `.xls`  
* `.csv`

Maximum file size

* 50 MB

Checks

* MIME type  
* File extension  
* File size

Reject executable or script files.

Store uploaded files outside the web root if possible.

---

# **19\. Directory Traversal Prevention**

* Never use user-supplied file paths directly.  
* Generate server-side filenames.  
* Restrict file operations to approved directories.

---

# **20\. Clickjacking Protection**

Configure Helmet to send:

X-Frame-Options: DENY

Only allow framing if there is a legitimate business requirement.

---

# **21\. Replay Attack Protection**

* Short-lived access tokens.  
* Refresh token rotation (recommended).  
* HTTPS to prevent token interception.

---

# **22\. Security Headers**

Use Helmet to configure:

* Content-Security-Policy  
* X-Frame-Options  
* X-Content-Type-Options  
* Referrer-Policy  
* Strict-Transport-Security (HSTS) in production  
* Cross-Origin policies as appropriate

---

# **23\. CORS Policy**

Only allow trusted origins, for example:

https://alumni.college.edu

Avoid using `*` in production.

Restrict allowed methods and headers to only what is required.

---

# **24\. Input Validation**

Validate all incoming data:

* Required fields  
* Length limits  
* Email format  
* Phone number format (if collected)  
* LinkedIn URL format  
* Username format

Validation occurs before business logic.

---

# **25\. Output Encoding**

Encode data before rendering in HTML.

Never insert untrusted strings using `innerHTML` unless they have been sanitized.

---

# **26\. Audit Logging**

Log the following actions:

* Login  
* Logout  
* Failed login  
* Password reset  
* User creation  
* User update  
* User deactivation  
* Team creation  
* Batch assignment  
* Round Robin distribution  
* Alumni update  
* Excel import  
* Excel export  
* Record deletion (soft delete)

Audit log fields:

* User ID  
* Username  
* Role  
* Action  
* Target entity  
* Timestamp  
* IP address  
* Result (Success/Failure)

---

# **27\. Activity Tracking**

Track operational metrics such as:

* Last login time  
* Last activity time  
* Number of records updated by each user  
* Number of imports and exports  
* Distribution events  
* Failed login count

---

# **28\. Logging Strategy**

Use **Winston**.

Recommended log files:

logs/  
    application.log  
    error.log  
    audit.log

Do not log passwords, tokens, or sensitive personal information.

---

# **29\. Error Handling**

Return consistent API responses.

Do not expose:

* SQL queries  
* Stack traces  
* Internal server paths

Example

{  
  "success": false,  
  "message": "An unexpected error occurred."  
}

Log the detailed error internally.

---

# **30\. Monitoring**

Monitor:

* Failed login attempts  
* High error rates  
* Large upload failures  
* Slow API responses  
* Database connection failures  
* Disk usage (logs/uploads)

---

# **31\. Backup & Recovery Security**

* Daily database backup.  
* Encrypt backup storage if possible.  
* Restrict backup access to IT administrators.  
* Test restoration procedures periodically.

---

# **32\. Password Reset Process**

1. User requests reset from Admin.  
2. Admin verifies the request through the college's established process.  
3. Admin sets a temporary password.  
4. User logs in.  
5. User is required to change the temporary password on first login.

---

# **33\. Secure Development Guidelines**

* Never hardcode secrets.  
* Store configuration in environment variables.  
* Keep dependencies updated.  
* Validate all external input.  
* Use least-privilege database accounts.  
* Review logs regularly.

---

# **34\. OWASP Top 10 Mapping**

| OWASP Risk | Mitigation |
| ----- | ----- |
| Broken Access Control | RBAC \+ ownership checks |
| Cryptographic Failures | bcrypt \+ HTTPS |
| Injection | Parameterized queries |
| Insecure Design | Layered architecture \+ validation |
| Security Misconfiguration | Helmet \+ secure configuration |
| Vulnerable Components | Dependency updates |
| Identification & Authentication Failures | JWT \+ password policy \+ rate limiting |
| Software & Data Integrity Failures | Controlled deployment, validated uploads |
| Security Logging & Monitoring Failures | Winston \+ audit logs |
| Server-Side Request Forgery (SSRF) | No external URL fetching from user input |

---

# **35\. Security Checklist**

Before production deployment:

* HTTPS enabled  
* Strong JWT secrets configured  
* Environment variables secured  
* Rate limiting enabled  
* Helmet configured  
* CORS restricted  
* Parameterized SQL enforced  
* Validation implemented  
* Audit logging enabled  
* Error messages sanitized  
* File upload restrictions tested  
* Backups configured and verified  
* Dependencies reviewed for vulnerabilities

---

## **Architecture Recommendation**

One enhancement I'd strongly recommend beyond the current scope is to introduce **row versioning (optimistic concurrency control)** for the `Alumni` table. This prevents one user's changes from accidentally overwriting another's if two users somehow access the same record during reassignment or administrative actions. SQL Server supports this efficiently with a `rowversion` column.

