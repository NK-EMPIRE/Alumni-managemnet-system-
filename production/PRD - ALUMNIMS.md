**Product Requirements Document (PRD)** 

**Project Name:** Alumni Professional Information Update Management System (APIUMS)

**Version:** 1.0

**Prepared For:** College Administration

**Project Type:** Internal College Web Application

**Target Users:** Admin, Team Leader, Team Member

**Deployment:** Windows Server \+ IIS \+ Node.js \+ Microsoft SQL Server

---

# **1\. Executive Summary**

## **Purpose**

The Alumni Professional Information Update Management System (APIUMS) is an internal web-based application developed to streamline the collection, updating, assignment, tracking, and reporting of alumni professional information.

The college currently maintains alumni information using Excel sheets and manual coordination. This process is difficult to manage, lacks transparency, increases duplicate work, and provides no centralized mechanism to monitor progress.

APIUMS centralizes the entire workflow by allowing administrators to import alumni records, assign them to Team Leaders based on batches, distribute records to Team Members using an automated Round Robin algorithm, monitor progress, and generate reports.

The application is intended for production deployment within the college and emphasizes security, scalability, maintainability, and auditability.

---

# **2\. Problem Statement**

Current challenges include:

* Alumni information is stored across multiple Excel files.  
* No centralized database exists.  
* Assignments are manually tracked.  
* Duplicate work occurs.  
* No real-time visibility into progress.  
* No audit trail of updates.  
* Difficult to generate reports.  
* Manual data consolidation.  
* High risk of data inconsistency.

---

# **3\. Objectives**

The system aims to:

* Centralize alumni information in a secure database.  
* Replace spreadsheet-based workflows.  
* Provide secure role-based access.  
* Allow administrators to assign alumni records by batch.  
* Automatically distribute workloads equally.  
* Enable Team Members to update professional details.  
* Track update progress.  
* Generate reports.  
* Maintain audit logs.  
* Reduce administrative effort.

---

# **4\. Project Scope**

## **In Scope**

### **Authentication**

* Login  
* Logout  
* JWT Authentication  
* Password Hashing (bcrypt)  
* Password Reset by Admin  
* Role-Based Access Control

### **User Management**

* Create Users  
* Update Users  
* Activate/Deactivate Users  
* Soft Delete Users  
* Reset Password

### **Team Management**

* Create Teams  
* Assign Team Leaders  
* Assign Team Members

### **Alumni Management**

* Import Alumni (Excel)  
* Search Alumni  
* View Alumni  
* Update Professional Information  
* Save Draft  
* Submit Record

### **Assignment Management**

* Assign Batch to Team Leader  
* Round Robin Distribution  
* Lock Distribution

### **Reporting**

* Dashboard  
* Excel Export  
* Team Reports  
* Batch Reports  
* Department Reports

### **Audit**

* Activity Logs  
* Login Logs  
* Update Logs

---

## **Out of Scope**

* Alumni Self Registration  
* Alumni Login  
* Mobile App  
* SMS Notifications  
* WhatsApp Integration  
* Salary Collection  
* Multi-College Support  
* Public API  
* Cloud Deployment

---

# **5\. Stakeholders**

| Stakeholder | Responsibility |
| ----- | ----- |
| College Management | Overall Ownership |
| Administrator | Manage Entire System |
| Team Leader | Manage Team Workflow |
| Team Member | Update Alumni Records |
| IT Administrator | Deployment & Maintenance |

---

# **6\. User Roles**

## **Administrator**

### **Responsibilities**

* Login  
* Dashboard  
* Manage Users  
* Manage Teams  
* Create Team Leaders  
* Create Team Members  
* Activate Users  
* Deactivate Users  
* Soft Delete Users  
* Reset Passwords  
* Import Excel  
* Assign Alumni Batch  
* Monitor Progress  
* View Reports  
* Export Reports  
* View Audit Logs  
* Configure System Settings

---

## **Team Leader**

### **Responsibilities**

* Login  
* Dashboard  
* View Assigned Alumni  
* Automatic Distribution  
* Reassign Work  
* Lock Distribution  
* View Team Performance  
* Export Reports

---

## **Team Member**

### **Responsibilities**

* Login  
* Dashboard  
* View Assigned Alumni  
* Update Alumni Information  
* Save Draft  
* Submit Record  
* View Personal Progress

---

# **7\. Functional Requirements**

## **Authentication Module**

* Secure Login  
* JWT Authentication  
* Password Encryption  
* Session Timeout  
* Role Verification

---

## **User Management Module**

Administrator shall be able to

* Create Users  
* Edit Users  
* Disable Users  
* Delete Users (Soft Delete)  
* Reset Passwords

---

## **Team Management Module**

Administrator shall be able to

* Create Teams  
* Assign Leaders  
* Assign Members  
* View Team Details

---

## **Alumni Management Module**

Administrator shall be able to

* Import Excel  
* View Alumni  
* Search Alumni  
* Filter Alumni

Team Members shall be able to

* Edit Assigned Records  
* Save Draft  
* Submit Record

---

## **Assignment Module**

Administrator shall

* Assign Alumni by Batch

Team Leader shall

* Automatically distribute records  
* Lock distribution

---

## **Dashboard Module**

Administrator Dashboard

* Total Alumni  
* Total Teams  
* Assigned Records  
* Updated Records  
* Pending Records  
* Completed Records  
* Completion Percentage

Leader Dashboard

* Assigned Alumni  
* Pending  
* Updated  
* Member Performance

Member Dashboard

* Assigned Records  
* Updated Records  
* Pending Records

---

## **Reports Module**

Administrator

* Export Excel

Leader

* Export Team Report

---

# **8\. Non-Functional Requirements**

## **Performance**

* Support 50+ concurrent users.  
* Average response time under 3 seconds.  
* Dashboard load under 5 seconds.  
* Excel import supports files up to 50 MB.

## **Availability**

* Hosted on a single Windows Server.  
* Planned maintenance coordinated by the IT department.

## **Reliability**

* Daily database backups.  
* Soft deletion for business entities.  
* Error logging and recovery procedures.

## **Maintainability**

* Modular architecture.  
* Layered backend.  
* Reusable frontend components.  
* Standardized coding practices.

## **Security**

* JWT Authentication.  
* bcrypt password hashing.  
* Helmet security headers.  
* Parameterized SQL queries.  
* Role-Based Access Control.  
* Input validation.  
* Audit logging.  
* Rate limiting.

---

# **9\. Business Workflow**

Admin Login  
      │  
      ▼  
Import Alumni Excel  
      │  
      ▼  
Assign Batch to Team Leader  
      │  
      ▼  
Leader Distributes Alumni  
(Round Robin)  
      │  
      ▼  
Member Updates Record  
      │  
      ├────► Save Draft  
      │  
      ▼  
Submit Record  
      │  
      ▼  
Dashboard Updated  
      │  
      ▼  
Reports Generated  
---

# **10\. Record Lifecycle**

Imported  
    │  
    ▼  
Assigned  
    │  
    ▼  
Pending  
    │  
 ┌──┴──────┐  
 │         │  
 ▼         ▼  
Draft   Updated  
           │  
           ▼  
      Completed  
---

# **11\. Success Criteria**

The system is considered successful when:

* All users authenticate securely.  
* Alumni records are imported without duplication.  
* Batch assignments are completed accurately.  
* Round Robin distribution assigns work fairly.  
* Team Members can save drafts and submit updates.  
* Dashboards reflect real-time progress.  
* Reports are generated successfully.  
* Audit logs capture critical activities.  
* The system supports at least 50 concurrent users.

---

# **12\. Key Performance Indicators (KPIs)**

* Total alumni imported.  
* Total batches assigned.  
* Total records distributed.  
* Records pending.  
* Records updated.  
* Records completed.  
* Team completion percentage.  
* Member completion percentage.  
* Average update time.  
* Failed login attempts.  
* Password reset requests.  
* Excel import success rate.

---

# **13\. Assumptions**

* The system is used only by authorized college staff.  
* Alumni records are imported by administrators.  
* Administrators assign records to Team Leaders based on batch.  
* Team Leaders distribute records using Round Robin.  
* Password resets are handled by administrators.  
* Email notifications are sent using Nodemailer.  
* Microsoft SQL Server is the system database.  
* The application is deployed on a single Windows Server behind IIS.

---

# **14\. Constraints**

* Single-server deployment.  
* Maximum Excel file size: 50 MB.  
* No alumni self-service portal.  
* No salary information stored.  
* Soft deletion only (no hard delete through the application).  
* Modern browsers only: Edge, Chrome, Firefox, Brave, and Opera.

---

# **15\. Acceptance Criteria**

The system shall:

* Authenticate users securely.  
* Enforce role-based access for all modules.  
* Allow administrators to import alumni data from Excel.  
* Allow administrators to assign alumni by batch to Team Leaders.  
* Allow Team Leaders to distribute records fairly using Round Robin.  
* Allow Team Members to update, save drafts, and submit assigned records.  
* Provide dashboards and Excel reports.  
* Maintain audit logs for all significant actions.  
* Meet the defined performance and security requirements.

