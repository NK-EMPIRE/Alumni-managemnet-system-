# **TECH STACK & DEVELOPMENT STANDARDS**

## **Project Name**

**Alumni Professional Information Update Management System (APIUMS)**

Version: **1.0**

Project Type: **Enterprise Internal College Web Application**

---

# **1\. Technology Stack**

## **Frontend**

| Technology | Version | Purpose |
| ----- | ----- | ----- |
| HTML5 | Latest | Structure |
| CSS3 | Latest | Styling |
| JavaScript (ES6+) | Latest | Client-side logic |
| Fetch API | Native | HTTP requests |
| Bootstrap 5 | Latest | Responsive UI |
| Font Awesome | Latest | Icons |
| SweetAlert2 | Latest | Dialogs & Alerts |
| Chart.js | Latest | Dashboard Charts |

---

## **Backend**

| Technology | Version | Purpose |
| ----- | ----- | ----- |
| Node.js | LTS | Runtime |
| Express.js | Latest | REST API Framework |
| Nodemon | Latest | Development |
| dotenv | Latest | Environment Variables |

---

## **Database**

| Technology | Purpose |
| ----- | ----- |
| Microsoft SQL Server | Primary Database |
| SSMS | Database Administration |

---

## **Authentication**

| Library | Purpose |
| ----- | ----- |
| JWT | Authentication |
| bcrypt | Password Hashing |

---

## **Validation**

| Library | Purpose |
| ----- | ----- |
| express-validator | Input Validation |

---

## **File Upload**

| Library | Purpose |
| ----- | ----- |
| Multer | File Upload |

---

## **Excel**

| Library | Purpose |
| ----- | ----- |
| xlsx | Import Excel |
| exceljs | Export Excel |

---

## **Logging**

| Library | Purpose |
| ----- | ----- |
| Winston | Application Logging |
| Morgan | HTTP Request Logging |

---

## **Security**

| Library | Purpose |
| ----- | ----- |
| Helmet | HTTP Security Headers |
| express-rate-limit | Rate Limiting |
| cors | Cross-Origin Resource Sharing |
| xss | XSS Sanitization |
| express-mongo-sanitize | ❌ Not Required (SQL Server) |

---

## **Email**

| Library | Purpose |
| ----- | ----- |
| Nodemailer | Email Notifications |

---

## **Utilities**

| Library | Purpose |
| ----- | ----- |
| UUID | Unique IDs (where needed) |
| Day.js | Date Handling |

---

# **2\. Complete Backend Folder Structure**

backend/  
│  
├── src/  
│  
├── config/  
│   ├── database.js  
│   ├── jwt.js  
│   ├── logger.js  
│   ├── multer.js  
│   ├── mail.js  
│   └── app.js  
│  
├── controllers/  
│   ├── auth.controller.js  
│   ├── user.controller.js  
│   ├── team.controller.js  
│   ├── alumni.controller.js  
│   ├── dashboard.controller.js  
│   ├── report.controller.js  
│   └── upload.controller.js  
│  
├── services/  
│  
├── repositories/  
│  
├── routes/  
│  
├── middlewares/  
│  
├── validators/  
│  
├── models/  
│  
├── helpers/  
│  
├── utils/  
│  
├── constants/  
│  
├── templates/  
│  
├── logs/  
│  
├── uploads/  
│  
├── tests/  
│  
├── app.js  
│  
└── server.js  
---

# **3\. Frontend Folder Structure**

frontend/  
│  
├── assets/  
│  
├── css/  
│  
├── js/  
│  
├── images/  
│  
├── components/  
│  
├── layouts/  
│  
├── services/  
│  
├── utils/  
│  
├── pages/  
│  
│   login.html  
│  
│   admin/  
│  
│   leader/  
│  
│   member/  
│  
└── index.html  
---

# **4\. Module Architecture**

Authentication

↓

User Management

↓

Team Management

↓

Alumni Management

↓

Assignment Management

↓

Dashboard

↓

Reports

↓

Audit

↓

Notification

Each module is independent.

---

# **5\. Backend Layer Architecture**

Routes

↓

Middleware

↓

Controller

↓

Service

↓

Repository

↓

Database

Never violate this order.

---

# **6\. Controller Responsibilities**

Controllers only:

* Receive HTTP Request  
* Call Service  
* Return JSON Response

Controllers NEVER:

* Write SQL  
* Validate Business Rules  
* Send Emails Directly

---

# **7\. Service Responsibilities**

Services contain:

Business Logic

Example:

Assign Alumni

↓

Calculate Distribution

↓

Update Assignment

↓

Write Audit Log

↓

Return Result  
---

# **8\. Repository Responsibilities**

Repositories perform:

* SQL Queries  
* Transactions  
* Stored Procedure Calls (if later required)

Repositories NEVER:

* Validate Requests  
* Generate JWT  
* Send Emails

---

# **9\. Middleware Responsibilities**

Authentication

Authorization

Validation

Logging

Rate Limiting

Error Handling

Upload Validation

---

# **10\. Naming Convention**

## **Files**

user.controller.js

team.service.js

alumni.repository.js

auth.routes.js  
---

## **Variables**

camelCase

Example

firstName

lastLogin

teamLeaderId  
---

## **Constants**

UPPER\_CASE

Example

MAX\_UPLOAD\_SIZE

JWT\_SECRET

TOKEN\_EXPIRY  
---

## **Database Tables**

PascalCase

Example

Users

Teams

Alumni

AuditLogs  
---

## **Database Columns**

PascalCase

Example

UserId

FirstName

LastLogin

CreatedAt  
---

# **11\. API Naming Standards**

Always

Plural Resources

Good

/users

/teams

/alumni

Avoid

/getUsers

/createUser

/deleteUser  
---

# **12\. API Versioning**

Every endpoint

/api/v1

Example

/api/v1/auth/login

/api/v1/users

/api/v1/teams  
---

# **13\. JSON Response Standard**

Success

{  
    "success": true,  
    "message": "Operation successful",  
    "data": {}  
}

Error

{  
    "success": false,  
    "message": "Validation failed",  
    "errors": \[\]  
}  
---

# **14\. Environment Variables**

PORT

NODE\_ENV

DB\_SERVER

DB\_DATABASE

DB\_USER

DB\_PASSWORD

JWT\_SECRET

JWT\_EXPIRES\_IN

REFRESH\_TOKEN\_SECRET

REFRESH\_TOKEN\_EXPIRES\_IN

EMAIL\_HOST

EMAIL\_PORT

EMAIL\_USER

EMAIL\_PASSWORD

UPLOAD\_PATH

MAX\_FILE\_SIZE

LOG\_LEVEL  
---

# **15\. Coding Standards**

Use

* async/await

Never use

* Nested callbacks

Use

* try/catch

Always

* Return proper HTTP status codes

Never

* Return raw SQL errors

---

# **16\. Error Handling Standard**

Use Global Error Middleware.

Never

console.log(error)

inside controllers.

Use Winston Logger.

---

# **17\. HTTP Status Codes**

| Code | Meaning |
| ----- | ----- |
| 200 | Success |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Validation Error |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

---

# **18\. Git Branch Strategy**

main

↓

develop

↓

feature/\*

Example

feature/authentication

feature/user-management

feature/team-module

feature/dashboard  
---

# **19\. Commit Standard**

feat:

fix:

docs:

refactor:

test:

style:

perf:

Example

feat: add JWT authentication

fix: resolve alumni assignment bug

docs: update API documentation  
---

# **20\. Development Order**

### **Phase 1**

Project Setup

Database

Authentication

---

### **Phase 2**

User Module

RBAC

Audit

---

### **Phase 3**

Team Module

Assignment Module

---

### **Phase 4**

Alumni Module

Draft

Submit

---

### **Phase 5**

Excel Import

Export

---

### **Phase 6**

Dashboard

Reports

Email

---

### **Phase 7**

Security Hardening

Performance

Testing

Deployment

---

# **21\. Build & Deployment Standards**

* Environment-specific configuration via `.env`.  
* No hardcoded credentials or secrets.  
* Validate configuration at startup and fail fast if required values are missing.  
* Separate development and production logging levels.  
* Store uploaded files outside the application source directory if possible.

---

# **22\. AI Coding Rules (for Vibe Coding)**

When using AI tools to generate code for this project:

* Follow the folder structure exactly.  
* Generate one module at a time.  
* Keep controllers thin; business logic belongs in services.  
* Use parameterized SQL queries only.  
* Reuse validation middleware instead of duplicating rules.  
* Return responses using the standard JSON format.  
* Add structured logging for all important operations.  
* Write code that is modular and testable rather than combining multiple responsibilities into a single file.

---

## **Architecture Recommendations**

A few refinements will make the project more maintainable:

1. **Use the `mssql` connection pool** instead of opening new database connections per request.  
2. **Keep SQL in repository files only**, avoiding inline SQL in controllers or services.  
3. **Use a consistent response wrapper** for every API to simplify frontend handling.  
4. **Centralize constants** (roles, statuses, messages, limits) in dedicated files.  
5. **Document every endpoint** as you implement it so the API specification stays synchronized with the code.

