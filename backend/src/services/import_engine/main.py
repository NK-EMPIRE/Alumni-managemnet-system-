import sys
import os
import json
import pandas as pd
import time
import re
from typing import Dict, Any, List

# Include local service modules
from analyzer import WorkbookAnalyzer
from header_detector import HeaderDetector
from column_mapper import ColumnMapper
from structure_intelligence import StructureIntelligenceEngine
from cleaning_engine import DataCleaningEngine
from entity_resolver import EntityResolver
from validation_engine import ValidationEngine, DuplicateDetector

def main():
    start_time = time.time()
    
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "No file path provided"}))
        sys.exit(1)

    file_path = sys.argv[1]
    if not os.path.exists(file_path):
        print(json.dumps({"success": False, "error": f"File not found: {file_path}"}))
        sys.exit(1)

    # Load faculty list, aliases & selected sheets from stdin if provided
    faculty_list = []
    alias_map = {}
    target_sheets = []
    inspect_sheets_mode = "--inspect-sheets" in sys.argv
    
    try:
        # Read from standard input (non-blocking style check)
        if not sys.stdin.isatty():
            input_data = sys.stdin.read().strip()
            if input_data:
                parsed_input = json.loads(input_data)
                faculty_list = parsed_input.get("faculties", [])
                aliases_list = parsed_input.get("aliases", [])
                target_sheets = parsed_input.get("sheets", [])
                # Map alias string (normalized) -> faculty_id
                for item in aliases_list:
                    alias_name = str(item.get("alias_name", "")).strip().lower()
                    if alias_name:
                        alias_map[alias_name] = item.get("faculty_id")
    except Exception as e:
        # Gracefully handle reading/parsing empty stdin
        pass

    if len(sys.argv) > 2 and sys.argv[2] and not sys.argv[2].startswith("--"):
        try:
            target_sheets = json.loads(sys.argv[2])
        except Exception:
            target_sheets = [s.strip() for s in sys.argv[2].split(",") if s.strip()]

    try:
        analyzer = WorkbookAnalyzer(file_path)
        valid_sheets = analyzer.get_valid_sheets(target_sheets=target_sheets if not inspect_sheets_mode else None)
    except Exception as e:
        print(json.dumps({"success": False, "error": f"Failed to read workbook: {str(e)}"}))
        sys.exit(1)

    if inspect_sheets_mode:
        sheets_info = []
        for s_name, df in valid_sheets.items():
            sheets_info.append({
                "name": s_name,
                "totalRows": len(df)
            })
        print(json.dumps({"success": True, "sheets": sheets_info}))
        sys.exit(0)

    mapper = ColumnMapper()
    detector = HeaderDetector(mapper.get_all_synonyms())
    resolver = EntityResolver(faculty_list, alias_map)
    duplicate_detector = DuplicateDetector()

    all_records = []
    errors = []

    total_sheets = 0
    total_records = 0
    imported = 0
    duplicates_count = 0
    invalid_rows = 0
    missing_faculty_count = 0

    unmapped_columns_samples = {}

    for sheet_name, df in valid_sheets.items():
        total_sheets += 1
        
        # Detect header row
        header_row, confidence = detector.detect_header_row(df)
        
        # Split DataFrame into headers and records
        headers_row_data = df.iloc[header_row]
        df_records = df.iloc[header_row + 1:]

        # Map headers
        header_map = {}
        unmapped_cols = []
        for col_idx, col_val in headers_row_data.items():
            col_str = str(col_val).strip() if not pd.isna(col_val) else ""
            if col_str:
                target_field = mapper.map_column(col_str)
                # Differentiate Mail (primary) and Mail ID (secondary)
                # and Mobile No. (primary) and Mobile No (secondary)
                norm_header = mapper.normalize_header(col_str)
                
                if target_field:
                    if norm_header in ('mail_id', 'mailid'):
                        header_map[col_idx] = 'secondaryEmail'
                    elif norm_header in ('mobile_no', 'mobileno') and col_str == 'Mobile No':
                        header_map[col_idx] = 'secondaryPhone'
                    else:
                        header_map[col_idx] = target_field
                else:
                    unmapped_cols.append((col_idx, col_str))

        # Cache columns list for fast name lookup checks
        headers_normalized = [mapper.normalize_header(str(val)) for val in headers_row_data.values]

        for idx, row in df_records.iterrows():
            if row.dropna().empty:
                continue

            total_records += 1
            row_num = idx + 1  # Excel row is 1-based

            # Extract samples for unmapped columns
            for col_idx, col_name in unmapped_cols:
                val = row.get(col_idx)
                val_str = str(val).strip() if not pd.isna(val) else ""
                if val_str:
                    if col_name not in unmapped_columns_samples:
                        unmapped_columns_samples[col_name] = []
                    if len(unmapped_columns_samples[col_name]) < 3 and val_str not in unmapped_columns_samples[col_name]:
                        unmapped_columns_samples[col_name].append(val_str)

            # Map raw fields with duplicate header collision prevention
            record = {"sheet": sheet_name}
            
            email_primary = None
            email_secondary = None
            phone_primary = None
            phone_secondary = None

            for col_idx, val in row.items():
                target = header_map.get(col_idx)
                if not target:
                    continue
                
                cell_val = val if not pd.isna(val) else None
                
                if target == 'email':
                    if email_primary is None:
                        email_primary = cell_val
                elif target == 'secondaryEmail':
                    if email_secondary is None:
                        email_secondary = cell_val
                elif target == 'phone':
                    if phone_primary is None:
                        phone_primary = cell_val
                elif target == 'secondaryPhone':
                    if phone_secondary is None:
                        phone_secondary = cell_val
                else:
                    # Generic collision check: first write wins
                    if target not in record:
                        record[target] = cell_val

            # Process scientific notation/string clean for registration number
            reg_no = DataCleaningEngine.clean_register_no(record.get('registerNo'))
            
            # Validation Step
            row_errors = ValidationEngine.validate_row(record, row_num, sheet_name)
            if row_errors:
                errors.extend(row_errors)
                invalid_rows += 1
                continue

            # Duplicate Check (within this workbook)
            if duplicate_detector.is_duplicate(reg_no):
                errors.append({
                    "sheet": sheet_name,
                    "row": row_num,
                    "registerNo": reg_no,
                    "name": record.get('name') or "-",
                    "department": record.get('department') or "-",
                    "batch": record.get('batch') or "-",
                    "errorType": "Duplicate Register Number",
                    "errorDescription": f"Register Number '{reg_no}' appears more than once in the workbook."
                })
                duplicates_count += 1
                invalid_rows += 1
                continue

            record['registerNo'] = reg_no

            # Resolve split name columns if present
            record['name'] = DataCleaningEngine.clean_text(
                StructureIntelligenceEngine.resolve_split_names(record, headers_normalized, row)
            )

            # Normalizations & Cleanings
            record['department'] = DataCleaningEngine.clean_text(record.get('department'))
            record['batch'] = DataCleaningEngine.clean_batch(record.get('batch'))
            record['gender'] = DataCleaningEngine.clean_gender(record.get('gender'))
            record['dateOfBirth'] = DataCleaningEngine.clean_date(record.get('dateOfBirth'))
            record['workingDetails'] = DataCleaningEngine.clean_text(record.get('workingDetails'))
            record['linkedinProfile'] = DataCleaningEngine.clean_text(record.get('linkedinProfile'))
            record['company'] = DataCleaningEngine.clean_text(record.get('company'))
            record['designation'] = DataCleaningEngine.clean_text(record.get('designation'))
            record['fatherName'] = DataCleaningEngine.clean_text(record.get('fatherName'))
            
            # Address mapping
            record['address'] = DataCleaningEngine.clean_text(record.get('address'))
            record['city'] = DataCleaningEngine.clean_text(record.get('city'))
            record['state'] = DataCleaningEngine.clean_text(record.get('state'))
            record['country'] = DataCleaningEngine.clean_text(record.get('country'))

            # Multi-value split and routing with precedence (Fix 6 & Fix 9)
            multi_emails = StructureIntelligenceEngine.parse_multiple_emails(email_primary)
            multi_phones = StructureIntelligenceEngine.parse_multiple_phones(phone_primary)

            record['email'] = DataCleaningEngine.clean_email(multi_emails[0] if multi_emails else email_primary)
            record['phone'] = DataCleaningEngine.clean_phone(multi_phones[0] if multi_phones else phone_primary)

            if email_secondary:
                record['secondaryEmail'] = DataCleaningEngine.clean_email(email_secondary)
            elif len(multi_emails) > 1:
                record['secondaryEmail'] = DataCleaningEngine.clean_email(multi_emails[1])
            else:
                record['secondaryEmail'] = ""

            if phone_secondary:
                record['secondaryPhone'] = DataCleaningEngine.clean_phone(phone_secondary)
            elif len(multi_phones) > 1:
                record['secondaryPhone'] = DataCleaningEngine.clean_phone(multi_phones[1])
            else:
                record['secondaryPhone'] = ""

            # Validate LinkedIn Profile URL
            linkedin_val = record.get('linkedinProfile')
            if linkedin_val:
                is_url = re.match(r'^https?://', linkedin_val.strip().lower())
                if not is_url:
                    errors.append({
                        "sheet": sheet_name,
                        "row": row_num,
                        "registerNo": reg_no or "-",
                        "name": record.get('name') or "-",
                        "department": record.get('department') or "-",
                        "batch": record.get('batch') or "-",
                        "errorType": "Validation Warning",
                        "errorDescription": f"Row {row_num}: linkedinProfile value '{linkedin_val}' is not a URL."
                    })
                    record['linkedinProfile'] = ""  # Clear invalid URL so record still inserts

            # Parse Course and Batch if merged e.g., 'CSE-2022'
            merged_course = StructureIntelligenceEngine.split_course_batch(record.get('department'))
            if merged_course:
                record['department'] = merged_course['course']
                if not record['batch']:
                    record['batch'] = merged_course['batch']

            # Resolve Faculty Entity
            fac_name = DataCleaningEngine.clean_text(record.get('facultyAssigned'))
            resolved_fid, confidence_score, resolved_canonical = resolver.resolve_faculty(
                fac_name, record['department']
            )

            if resolved_fid > 0:
                record['facultyId'] = resolved_fid
                record['facultyAssigned'] = resolved_canonical
                record['facultyConfidence'] = confidence_score
                # auto-alias save later only if confidence is high (>=95%)
                record['facultyAliasToSave'] = fac_name if (confidence_score >= 0.95) else None
                # For FIX 2: 80% to 95% threshold gets set aside for human review
                record['facultyAliasPendingReview'] = fac_name if (0.80 <= confidence_score < 0.95) else None
            else:
                record['facultyId'] = None
                record['facultyConfidence'] = 0.0
                record['facultyAliasToSave'] = None
                record['facultyAliasPendingReview'] = None
                if fac_name:
                    missing_faculty_count += 1

            all_records.append(record)
            imported += 1

    execution_time = round(time.time() - start_time, 3)

    summary = {
        "totalSheets": total_sheets,
        "totalRecords": total_records,
        "imported": imported,
        "duplicates": duplicates_count,
        "invalidRows": invalid_rows,
        "missingFaculty": missing_faculty_count,
        "executionTime": execution_time
    }

    # Format unmapped columns list
    unmapped_output = []
    for col_name, samples in unmapped_columns_samples.items():
        unmapped_output.append({
            "columnName": col_name,
            "sampleValues": samples
        })

    output = {
        "success": True,
        "summary": summary,
        "records": all_records,
        "errors": errors,
        "unmappedColumns": unmapped_output
    }
    print(json.dumps(output, ensure_ascii=False, indent=2))

if __name__ == '__main__':
    main()
