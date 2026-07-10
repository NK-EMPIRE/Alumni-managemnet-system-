---

# **SOFTWARE DESIGN DOCUMENT (SDD)**

**Project Name:** Alumni Professional Information Update Management System (APIUMS)

**Version:** 1.0

**Architecture Style:** Layered Architecture (3-Tier)

**Prepared By:** Software Architecture Team

**Target Deployment:** Windows Server \+ IIS \+ Node.js \+ Microsoft SQL Server

---

# **1\. Purpose**

This document describes the complete software architecture, module decomposition, component interactions, request lifecycle, design principles, and implementation standards for APIUMS.

It serves as the primary technical reference for developers, testers, and future maintenance.

---

# **2\. Design Goals**

The architecture is designed to achieve:

* Scalability  
* Security  
* Maintainability  
* Performance  
* Extensibility  
* Testability  
* Separation of Concerns  
* Reusability

---

# **3\. Architecture Overview**

The application follows a **3-Tier Layered Architecture**.

┌─────────────────────────────────────────────┐  
│              Presentation Layer             │  
│ HTML │ CSS │ JavaScript │ Fetch API         │  
└─────────────────────────────────────────────┘  
                    │  
                    ▼  
┌─────────────────────────────────────────────┐  
│             Application Layer               │  
│ Express.js                                 │  
│ Controllers                                │  
│ Middleware                                 │  
│ Services                                   │  
│ Validation                                 │  
│ Authentication                             │  
└─────────────────────────────────────────────┘  
                    │  
                    ▼  
┌─────────────────────────────────────────────┐  
│                Data Layer                   │  
│ MSSQL                                       │  
│ Connection Pool                             │  
│ Parameterized Queries                       │  
│ Transactions                                │  
└─────────────────────────────────────────────┘  
---

# **4\. Architectural Principles**

### **Separation of Concerns**

Each layer has a single responsibility.

* UI handles presentation.  
* Controllers handle HTTP requests.  
* Services contain business logic.  
* Repositories handle database operations.

---

### **Single Responsibility Principle**

Each module performs only one logical task.

Example:

UserController

Only handles HTTP requests.

No SQL.

No business logic.  
---

### **Open/Closed Principle**

Business modules can be extended without modifying existing code.

Example:

Future role

Department Coordinator

should be added without changing authentication logic.

---

### **Dependency Injection (Conceptual)**

Services depend on interfaces, not implementation.

Example

UserService

↓

UserRepository

↓

Database  
---

### **Reusability**

Validation

Authentication

Email

Logger

Error handler

will all be reusable middleware/services.

---

# **5\. High-Level Architecture**

Browser  
      │  
      ▼  
IIS Reverse Proxy  
      │  
      ▼  
Node.js Application  
      │  
      ├──────── Authentication  
      ├──────── Authorization  
      ├──────── Validation  
      ├──────── Controllers  
      ├──────── Services  
      ├──────── Repository  
      └──────── Logger  
              │  
              ▼  
      Microsoft SQL Server  
---

# **6\. Logical Components**

## **Frontend**

Responsibilities

* Login UI  
* Dashboard  
* Forms  
* Tables  
* Search  
* Pagination  
* Validation  
* Reports

---

## **Backend**

Responsibilities

* REST APIs  
* JWT  
* Business Logic  
* Validation  
* Audit  
* Logging  
* File Upload  
* Excel Import

---

## **Database**

Responsibilities

* Store all data  
* Transactions  
* Constraints  
* Indexes  
* Audit Logs

---

# **7\. Major Modules**

## **Authentication Module**

Responsibilities

* Login  
* Logout  
* JWT  
* Password Verification  
* Token Validation

---

## **User Management**

Responsibilities

* Create User  
* Update User  
* Activate  
* Deactivate  
* Reset Password

---

## **Team Module**

Responsibilities

* Create Team  
* Assign Leader  
* Assign Members

---

## **Alumni Module**

Responsibilities

* Search  
* View  
* Update  
* Save Draft  
* Submit

---

## **Assignment Module**

Responsibilities

* Batch Assignment  
* Round Robin Distribution  
* Reassignment

---

## **Dashboard Module**

Responsibilities

* Statistics  
* KPIs  
* Charts  
* Progress

---

## **Reports Module**

Responsibilities

* Excel Export  
* Team Reports  
* Batch Reports

---

## **Audit Module**

Responsibilities

* Login Logs  
* Update Logs  
* Import Logs  
* Assignment Logs

---

# **8\. Request Lifecycle**

Browser

↓

Fetch API

↓

Express Router

↓

Authentication Middleware

↓

Authorization Middleware

↓

Validation Middleware

↓

Controller

↓

Service

↓

Repository

↓

SQL Server

↓

Repository

↓

Service

↓

Controller

↓

JSON Response  
---

# **9\. Middleware Pipeline**

Every request passes through:

Helmet

↓

CORS

↓

Rate Limiter

↓

Request Logger

↓

JWT Verification

↓

Role Verification

↓

Validation

↓

Controller

↓

Error Handler  
---

# **10\. Module Dependency Diagram**

Frontend

↓

Routes

↓

Controllers

↓

Services

↓

Repositories

↓

Database

Controllers never access the database directly.

---

# **11\. Folder Structure**

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
├── routes/  
│   ├── auth.routes.js  
│   ├── user.routes.js  
│   ├── team.routes.js  
│   ├── alumni.routes.js  
│   ├── dashboard.routes.js  
│   ├── report.routes.js  
│   └── upload.routes.js  
│  
├── controllers/  
│  
├── services/  
│  
├── repositories/  
│  
├── middlewares/  
│  
├── validators/  
│  
├── models/  
│  
├── utils/  
│  
├── helpers/  
│  
├── uploads/  
│  
├── logs/  
│  
├── templates/  
│  
├── constants/  
│  
├── errors/  
│  
└── server.js  
---

# **12\. Frontend Structure**

frontend/  
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
├── assets/  
│  
├── css/  
│  
├── js/  
│  
├── components/  
│  
├── services/  
│  
├── utils/  
│  
└── index.html  
---

# **13\. Routing Strategy**

## **Frontend Routes**

/

/login

/admin/dashboard

/admin/users

/admin/teams

/admin/alumni

/admin/import

/admin/reports

/admin/settings

/leader/dashboard

/leader/distribution

/leader/alumni

/leader/reports

/member/dashboard

/member/alumni

/member/profile  
---

## **Backend API Versioning**

/api/v1

Every API starts with

/api/v1

Example

POST /api/v1/auth/login

GET /api/v1/users

POST /api/v1/alumni/import  
---

# **14\. Error Handling Strategy**

Controllers never return raw SQL errors.

Standard response:

{  
  "success": false,  
  "message": "Validation failed",  
  "errors": \[\]  
}

Centralized Global Error Handler.

---

# **15\. Logging Strategy**

Every important event is logged.

Examples:

* Login  
* Logout  
* Password Reset  
* Excel Import  
* User Creation  
* Team Assignment  
* Alumni Update  
* Export

---

# **16\. Email Module**

Nodemailer service.

Templates

* Password Reset  
* Assignment Notification  
* Import Completed

---

# **17\. Excel Import Workflow**

Upload

↓

Validate File

↓

Validate Columns

↓

Validate Duplicate Rows

↓

Store Valid Records

↓

Generate Import Summary

↓

Audit Log  
---

# **18\. Round Robin Distribution**

Algorithm:

Input

Leader

Member A

Member B

Member C

120 Records

↓

Output

Leader → 30

A → 30

B → 30

C → 30

If records are not perfectly divisible, distribute the remainder starting from the first participant in the rotation.

---

# **19\. Performance Strategy**

* MSSQL Connection Pooling  
* Pagination  
* Lazy Loading  
* Indexed Search  
* Server-side Filtering  
* Batch Database Operations

---

# **20\. Scalability Strategy**

Although initially deployed on a single server, the architecture should avoid tight coupling so it can later support:

* Separate frontend and backend deployments  
* Load-balanced Node.js instances  
* Dedicated database server  
* Background job processing for imports and notifications

---

# **21\. Coding Standards**

* Controllers contain no business logic.  
* Services contain no SQL.  
* Repositories contain all database access.  
* Use async/await consistently.  
* Use parameterized queries only.  
* Avoid duplicated logic.  
* Keep functions focused on a single responsibility.

---

# **22\. Architecture Decisions**

| Decision | Reason |
| ----- | ----- |
| Layered Architecture | Clear separation of responsibilities |
| REST APIs | Simple integration and maintenance |
| JWT Authentication | Stateless authentication |
| MSSQL | Existing college infrastructure |
| Soft Delete | Preserve historical records |
| Round Robin Distribution | Fair workload allocation |
| Repository Pattern | Easier testing and maintainability |
| Centralized Error Handling | Consistent API responses |
| Audit Logging | Accountability and traceability |
| API Versioning (`/api/v1`) | Future compatibility |

---

## **Architecture Review Notes**

Before implementation, I would make two recommendations beyond the current requirements:

1. **Introduce a `Campaign` entity** in the future so alumni update drives (e.g., "2026 NAAC Update", "2027 Accreditation Survey") can be managed independently without redesigning the schema.  
2. **Replace file-based uploads with background processing** if Excel imports become significantly larger than the current 50 MB limit or if user concurrency grows substantially.

---

### **Next Document**

The next document should be the **Tech Stack & Development Standards**, where we'll define:

* Complete technology stack  
* NPM packages and their purpose  
* Coding conventions  
* Naming conventions  
* Environment variables  
* Git branching strategy  
* Development workflow  
* Build and dependency standards

This document will serve as the implementation guide for developers and AI coding tools.

