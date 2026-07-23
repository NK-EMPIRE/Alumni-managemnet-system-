import re
from typing import Dict, Optional

class ColumnMapper:
    MAPPINGS = {
        'registerNo': [
            'register_no', 'reg_no', 'regno', 'registerno', 'registration_number',
            'registrationnumber', 'roll_no', 'rollno', 'roll_number',
            'enrollmentno', 'enrollment_no', 'student_id', 'studentid',
            'register_number', 'reg_number', 'regnumber', 'enroll_no',
            'roll', 'registerationno', 'registrationno', 'adm_no', 'admno',
            'application_no', 'applicationno', 'id_no', 'idno',
            'pi_reg_no', 'piregno', 'hall_ticket_no', 'hallticketno',
        ],
        'name': [
            'name', 'student_name', 'studentname', 'full_name', 'fullname',
            'first_name', 'firstname', 'pi_name', 'piname',
            'pi_name_as_in_certificate', 'name_as_in_certificate',
            'candidate_name', 'candidatename', 'alumni_name', 'alumniname',
            'pupil_name', 'pupilname', 'scholar_name', 'sname',
        ],
        'email': [
            'email', 'mail', 'e_mail', 'email_id', 'emailid',
            'email_address', 'emailaddress', 'personal_email', 'personalemail',
            'official_email', 'officialemail', 'primary_email', 'primaryemail',
        ],
        'phone': [
            'phone', 'mobile', 'mobile_no', 'mobileno', 'contact',
            'contact_no', 'contactno', 'contactnumber', 'student_phone',
            'student_mobile', 'phone_no', 'phoneno', 'cell', 'cell_no',
            'cellno', 'whatsapp', 'whatsapp_no', 'whatsappno',
            'personal_phone', 'personalphone', 'primary_phone', 'primaryphone',
            'mobile_number', 'mobilenumber', 'phone_number', 'phonenumber',
        ],
        'secondaryEmail': [
            'mail_id', 'mailid', 'secondary_email', 'secondaryemail',
            'alternate_email', 'alternateemail', 'email2', 'other_email',
            'otheremail', 'alternative_email', 'alternativeemail',
        ],
        'secondaryPhone': [
            'secondary_phone', 'secondaryphone', 'alternate_phone', 'alternatephone',
            'phone2', 'other_phone', 'otherphone', 'alternative_mobile',
            'alternativemobile', 'emergency_contact', 'emergencycontact',
            'secondary_mobile', 'secondarymobile',
        ],
        'department': [
            'department', 'dept', 'depart', 'branch', 'stream', 'course',
            'programme', 'program', 'discipline', 'field', 'major',
            'pi_dept', 'pidept', 'pi_department', 'pidepartment',
            'pi_course', 'picourse',
        ],
        'batch': [
            'batch', 'year', 'batch_year', 'batchyear', 'passing_year',
            'passingyear', 'graduation_year', 'graduationyear',
            'pass_year', 'passyear', 'batch_of', 'batchof',
            'year_of_passing', 'yearofpassing', 'pass_out_year',
            'passoutyear', 'pg_completion_year', 'completion_year',
            'passed_out_year', 'passedoutyear',
        ],
        'gender': [
            'gender', 'sex', 'pi_gender', 'pigender',
        ],
        'dateOfBirth': [
            # All common DOB header formats found in Indian college Excel files
            'date_of_birth', 'dob', 'birth_date', 'birthdate',
            'dateofbirth', 'd_o_b', 'dob_', 'date_birth', 'datebirth',
            'birth_day', 'birthday', 'date_of_birth_dd_mm_yyyy',
            'date_of_birth_ddmmyyyy', 'd_o_b_dd_mm_yyyy',
            'pi_date_of_birth', 'pidateofbirth', 'pi_dob', 'pidob',
            'pi_d_o_b', 'pi_d_of_b',
        ],
        'fatherName': [
            # All common Father Name formats found in college Excel exports
            'father_name', 'fathername', 'fathers_name', 'fathersname',
            'father_s_name', 'father', 'fathers_name_',
            'pi_father_name', 'pifathername', 'pi_fathername',
            'fathers_name', 'father_name_', 'dad_name', 'dadname',
            'parent_name', 'parentname', 'guardian_name', 'guardianname',
            'pi_father_s_name', 'pifathers_name',
        ],
        'workingDetails': [
            'working_detail', 'working_details', 'work_detail', 'workdetails',
            'working_status', 'work_status', 'employment_status',
            'employmentstatus', 'job_status', 'jobstatus',
            'current_status', 'currentstatus', 'placed', 'placement_status',
            'placementstatus',
        ],
        'linkedinProfile': [
            'linkedin_profile', 'linkedin_url', 'linkedin', 'linkedinurl',
            'linkedin_facebook_profile', 'linkedin_id', 'linkedinid',
            'linkedin_link', 'linkedinlink',
        ],
        'company': [
            'company', 'organization', 'org', 'employer',
            'company_name', 'companyname', 'employer_name', 'employername',
            'current_company', 'currentcompany', 'placed_company',
            'placedcompany', 'firm', 'institute', 'workplace',
        ],
        'designation': [
            'designation', 'role', 'position', 'job_title', 'jobtitle',
            'current_designation', 'currentdesignation', 'job_role',
            'jobrole', 'post', 'title', 'profile', 'job_profile',
        ],
        'facultyAssigned': [
            'faculty_assigned', 'faculty', 'assigned_faculty',
            'faculty_name', 'facultyname', 'mentor', 'advisor',
            'counselor', 'assigned_to', 'assignedto',
        ],
        'address': [
            'address', 'residential_address', 'permanent_address',
            'addr', 'current_address', 'currentaddress', 'home_address',
            'homeaddress', 'correspondence_address', 'correspondenceaddress',
        ],
        'city': [
            'city', 'town', 'current_city', 'currentcity',
            'city_name', 'cityname', 'place',
        ],
        'state': [
            'state', 'province', 'state_name', 'statename',
        ],
        'country': [
            'country', 'nation', 'country_name', 'countryname',
        ],
        'experience': [
            'experience', 'exp', 'years_of_experience', 'yearsofexperience',
            'work_experience', 'workexperience', 'total_experience',
        ],
        'salary': [
            'salary', 'ctc', 'package', 'annual_salary', 'annualsalary',
            'salary_package', 'salarypackage', 'lpa',
        ],
    }

    @staticmethod
    def normalize_header(header_name: str) -> str:
        if not isinstance(header_name, str):
            return ""
        h = header_name.strip().lower()
        # Remove apostrophes/backticks before normalizing
        h = re.sub(r"[''`\"]", '', h)
        # Replace spaces, hyphens, dots, slashes with underscore
        h = re.sub(r'[\s\-\./\\]+', '_', h)
        # Remove all non-alphanumeric except underscore
        h = re.sub(r'[^a-z0-9_]', '', h)
        # Collapse multiple underscores
        h = re.sub(r'_+', '_', h).strip('_')
        return h

    def map_column(self, header_name: str) -> Optional[str]:
        norm = self.normalize_header(header_name)
        # Compact form: remove all underscores for fuzzy matching
        compact = norm.replace('_', '')
        for target, alternates in self.MAPPINGS.items():
            # Exact normalized match
            if norm == target.lower() or norm in alternates:
                return target
            # Compact match (no underscores)
            for alt in alternates:
                if compact == alt.replace('_', ''):
                    return target
        return None

    def get_all_synonyms(self) -> list:
        syns = []
        for alternates in self.MAPPINGS.values():
            syns.extend(alternates)
        return syns
