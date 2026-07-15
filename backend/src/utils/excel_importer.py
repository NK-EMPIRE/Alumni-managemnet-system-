import sys
import os
import re
import json
import pandas as pd

def normalize_header(header_name):
    if not isinstance(header_name, str):
        return ""
    # Trim, lowercase, replace spaces/dashes with underscore, keep alphanumeric + underscore
    h = header_name.strip().lower()
    h = re.sub(r'[\s_-]+', '_', h)
    h = re.sub(r'[^a-z0-9_]', '', h)
    return h

def map_column_name(normalized_header):
    # Mapping to target camelCase standard format
    mappings = {
        'registerNo': ['register_no', 'reg_no', 'regno', 'registerno', 'registration_number', 'registrationnumber', 'roll_no', 'rollno', 'roll_number', 'enrollmentno', 'enrollment_no'],
        'name': ['name', 'student_name', 'studentname', 'full_name', 'fullname', 'first_name', 'firstname'],
        'email': ['email', 'mail', 'mail_id', 'mailid', 'e_mail', 'email_id', 'emailid'],
        'phone': ['phone', 'mobile', 'mobile_no', 'mobileno', 'contact', 'contact_no', 'contactnumber'],
        'department': ['department', 'dept', 'depart', 'branch', 'stream', 'course'],
        'batch': ['batch', 'year', 'batch_year', 'batchyear', 'passing_year', 'passingyear'],
        'gender': ['gender', 'sex'],
        'dateOfBirth': ['date_of_birth', 'dob', 'birth_date', 'birthdate', 'dateofbirth'],
        'workingDetails': ['working_detail', 'working_details', 'work_detail', 'workdetails'],
        'linkedinProfile': ['linkedin_profile', 'linkedin_url', 'linkedin', 'linkedinurl', 'linkedinfacebook', 'linkedin_facebook', 'facebook'],
        'company': ['company', 'organization', 'org', 'employer'],
        'designation': ['designation', 'role', 'position', 'job_title', 'jobtitle'],
        'facultyAssigned': ['faculty_assigned', 'faculty', 'assigned_faculty', 'faculty_name', 'facultyname'],
        'fatherName': ['father_name', 'fathername', 'fathers_name', 'fathersname', 'father_s_name', 'father']
    }
    
    for target, alternates in mappings.items():
        if normalized_header in alternates or normalized_header == target.lower():
            return target
    return None

def normalize_faculty(val):
    if pd.isna(val) or not str(val).strip():
        return ""
    # " ravi " -> "Ravi", "RAVI" -> "Ravi", "ravi" -> "Ravi"
    # Capitalize first letter, lowercase the rest (Title Case)
    return str(val).strip().title()

def normalize_dept(val):
    if pd.isna(val) or not str(val).strip():
        return ""
    return str(val).strip().upper()

def normalize_batch(val):
    if pd.isna(val) or not str(val).strip():
        return ""
    # Normalize batch/year to string
    # If float e.g. 2021.0, convert to integer string "2021"
    v = str(val).strip()
    if v.endswith('.0'):
        v = v[:-2]
    return v

def validate_email(email):
    if not email:
        return True
    pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
    return bool(re.match(pattern, email))

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "No file path provided"}))
        sys.exit(1)

    file_path = sys.argv[1]
    if not os.path.exists(file_path):
        print(json.dumps({"success": False, "error": f"File not found: {file_path}"}))
        sys.exit(1)

    try:
        xl = pd.ExcelFile(file_path, engine='openpyxl')
    except Exception as e:
        print(json.dumps({"success": False, "error": f"Failed to read Excel file: {str(e)}"}))
        sys.exit(1)

    sheet_names = xl.sheet_names
    all_records = []
    errors = []
    
    total_sheets = 0
    total_records = 0
    imported = 0
    duplicates_count = 0
    invalid_rows = 0
    missing_faculty_count = 0

    seen_register_nos = set()

    for sheet_name in sheet_names:
        try:
            df = xl.parse(sheet_name)
        except Exception:
            continue
            
        # Ignore empty sheets
        if df.empty:
            continue
            
        total_sheets += 1
        
        # Trim whitespace in column headers
        df.columns = [str(c).strip() for c in df.columns]
        
        # Map headers
        header_map = {}
        for col in df.columns:
            norm = normalize_header(col)
            target = map_column_name(norm)
            if target:
                header_map[col] = target

        for idx, row in df.iterrows():
            # Check if row is completely empty/blank
            if row.dropna().empty:
                continue
                
            total_records += 1
            row_num = idx + 2 # 1-based index including header row
            
            # Map row values
            record = {"sheet": sheet_name}
            raw_data = {}
            for col, val in row.items():
                raw_data[col] = str(val) if not pd.isna(val) else ""
                target_field = header_map.get(col)
                if target_field:
                    record[target_field] = val if not pd.isna(val) else None

            # Check register number presence
            reg_no = record.get('registerNo')
            if reg_no is not None:
                reg_no_str = str(reg_no).strip()
                if reg_no_str.lower() in ('null', 'none', ''):
                    reg_no = None
            
            if reg_no is None:
                errors.append({
                    "sheet": sheet_name,
                    "row": row_num,
                    "registerNo": "-",
                    "errorType": "Missing Register Number",
                    "errorDescription": f"Row {row_num} in sheet '{sheet_name}' is missing a Register Number."
                })
                invalid_rows += 1
                continue

            reg_no_str = str(reg_no).strip()
            if reg_no_str.endswith('.0'):
                reg_no_str = reg_no_str[:-2]
            record['registerNo'] = reg_no_str

            # Check duplicate register numbers within this workbook
            if reg_no_str in seen_register_nos:
                errors.append({
                    "sheet": sheet_name,
                    "row": row_num,
                    "registerNo": reg_no_str,
                    "errorType": "Duplicate Register Number",
                    "errorDescription": f"Register Number '{reg_no_str}' appears more than once in the workbook."
                })
                duplicates_count += 1
                invalid_rows += 1
                continue
            
            seen_register_nos.add(reg_no_str)

            # Norm names and strings
            name = record.get('name')
            if name:
                # Handle last_name mapping if present in alternatives
                lastName_field = None
                for col in df.columns:
                    if normalize_header(col) in ('last_name', 'lastname', 'surname'):
                        lastName_field = col
                        break
                if lastName_field:
                    l_val = row[lastName_field]
                    if not pd.isna(l_val) and str(l_val).strip():
                        name = f"{str(name).strip()} {str(l_val).strip()}"
                record['name'] = str(name).strip()

            email = record.get('email')
            if email:
                email = str(email).strip()
                record['email'] = email
                if not validate_email(email):
                    errors.append({
                        "sheet": sheet_name,
                        "row": row_num,
                        "registerNo": reg_no_str,
                        "errorType": "Invalid Email",
                        "errorDescription": f"Email format '{email}' is invalid."
                    })
                    invalid_rows += 1
                    continue

            phone = record.get('phone')
            if phone:
                phone_str = str(phone).strip()
                if phone_str.endswith('.0'):
                    phone_str = phone_str[:-2]
                record['phone'] = phone_str

            # Normalize Faculty Assigned
            fac = record.get('facultyAssigned')
            norm_fac = normalize_faculty(fac)
            record['facultyAssigned'] = norm_fac if norm_fac else None
            if not norm_fac:
                missing_faculty_count += 1

            # Normalize Department & Batch
            dept = record.get('department')
            record['department'] = normalize_dept(dept) if dept else None

            batch = record.get('batch')
            record['batch'] = normalize_batch(batch) if batch else None

            # Date of Birth
            dob = record.get('dateOfBirth')
            if dob:
                dob_str = str(dob).strip()
                if dob_str.endswith('.0'):
                    dob_str = dob_str[:-2]
                record['dateOfBirth'] = dob_str

            # Father Name
            fname = record.get('fatherName')
            if fname:
                record['fatherName'] = str(fname).strip()

            # Add to valid list
            all_records.append(record)
            imported += 1

    summary = {
        "totalSheets": total_sheets,
        "totalRecords": total_records,
        "imported": imported,
        "duplicates": duplicates_count,
        "invalidRows": invalid_rows,
        "missingFaculty": missing_faculty_count
    }

    output = {
        "success": True,
        "summary": summary,
        "records": all_records,
        "errors": errors
    }
    
    print(json.dumps(output, ensure_ascii=False, indent=2))

if __name__ == '__main__':
    main()
