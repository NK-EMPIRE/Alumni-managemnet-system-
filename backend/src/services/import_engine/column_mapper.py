import re
from typing import Dict, Optional

class ColumnMapper:
    MAPPINGS = {
        'registerNo': ['register_no', 'reg_no', 'regno', 'registerno', 'registration_number', 'registrationnumber', 'roll_no', 'rollno', 'roll_number', 'enrollmentno', 'enrollment_no', 'student_id', 'studentid'],
        'name': ['name', 'student_name', 'studentname', 'full_name', 'fullname', 'first_name', 'firstname'],
        'email': ['email', 'mail', 'mail_id', 'mailid', 'e_mail', 'email_id', 'emailid'],
        'phone': ['phone', 'mobile', 'mobile_no', 'mobileno', 'contact', 'contact_no', 'contactnumber', 'student_phone', 'student_mobile'],
        'department': ['department', 'dept', 'depart', 'branch', 'stream', 'course'],
        'batch': ['batch', 'year', 'batch_year', 'batchyear', 'passing_year', 'passingyear'],
        'gender': ['gender', 'sex'],
        'dateOfBirth': ['date_of_birth', 'dob', 'birth_date', 'birthdate', 'dateofbirth'],
        'workingDetails': ['working_detail', 'working_details', 'work_detail', 'workdetails', 'working_status', 'work_status'],
        'linkedinProfile': ['linkedin_profile', 'linkedin_url', 'linkedin', 'linkedinurl'],
        'company': ['company', 'organization', 'org', 'employer'],
        'designation': ['designation', 'role', 'position', 'job_title', 'jobtitle'],
        'facultyAssigned': ['faculty_assigned', 'faculty', 'assigned_faculty', 'faculty_name', 'facultyname'],
        'fatherName': ['father_name', 'fathername', 'fathers_name', 'fathersname', 'father_s_name', 'father']
    }

    @staticmethod
    def normalize_header(header_name: str) -> str:
        if not isinstance(header_name, str):
            return ""
        h = header_name.strip().lower()
        h = re.sub(r'[\s_-]+', '_', h)
        h = re.sub(r'[^a-z0-9_]', '', h)
        return h

    def map_column(self, header_name: str) -> Optional[str]:
        norm = self.normalize_header(header_name)
        for target, alternates in self.MAPPINGS.items():
            if norm in alternates or norm == target.lower():
                return target
        return None

    def get_all_synonyms(self) -> list:
        syns = []
        for alternates in self.MAPPINGS.values():
            syns.extend(alternates)
        return syns
