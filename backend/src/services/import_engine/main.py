import sys
import os
import json
import pandas as pd
import time
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

    # Load faculty list & aliases from stdin if provided, otherwise default to empty
    faculty_list = []
    alias_map = {}
    
    try:
        # Read from standard input (non-blocking style check)
        if not sys.stdin.isatty():
            input_data = sys.stdin.read().strip()
            if input_data:
                parsed_input = json.loads(input_data)
                faculty_list = parsed_input.get("faculties", [])
                aliases_list = parsed_input.get("aliases", [])
                # Map alias string (normalized) -> faculty_id
                for item in aliases_list:
                    alias_name = str(item.get("alias_name", "")).strip().lower()
                    if alias_name:
                        alias_map[alias_name] = item.get("faculty_id")
    except Exception as e:
        # Gracefully handle reading/parsing empty stdin
        pass

    try:
        analyzer = WorkbookAnalyzer(file_path)
        valid_sheets = analyzer.get_valid_sheets()
    except Exception as e:
        print(json.dumps({"success": False, "error": f"Failed to read workbook: {str(e)}"}))
        sys.exit(1)

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

    for sheet_name, df in valid_sheets.items():
        total_sheets += 1
        
        # Detect header row
        header_row, confidence = detector.detect_header_row(df)
        
        # Split DataFrame into headers and records
        headers_row_data = df.iloc[header_row]
        df_records = df.iloc[header_row + 1:]

        # Map headers
        header_map = {}
        for col_idx, col_val in headers_row_data.items():
            col_str = str(col_val).strip() if not pd.isna(col_val) else ""
            if col_str:
                target_field = mapper.map_column(col_str)
                if target_field:
                    header_map[col_idx] = target_field

        # Cache columns list for fast name lookup checks
        headers_normalized = [mapper.normalize_header(str(val)) for val in headers_row_data.values]

        for idx, row in df_records.iterrows():
            if row.dropna().empty:
                continue

            total_records += 1
            row_num = idx + 1  # Excel row is 1-based

            # Map raw fields
            record = {"sheet": sheet_name}
            for col_idx, val in row.items():
                target = header_map.get(col_idx)
                if target:
                    record[target] = val if not pd.isna(val) else None

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

            # Normalizations
            record['email'] = DataCleaningEngine.clean_email(record.get('email'))
            record['phone'] = DataCleaningEngine.clean_phone(record.get('phone'))
            record['department'] = DataCleaningEngine.clean_text(record.get('department'))
            record['batch'] = DataCleaningEngine.clean_batch(record.get('batch'))
            record['gender'] = DataCleaningEngine.clean_gender(record.get('gender'))
            record['dateOfBirth'] = DataCleaningEngine.clean_date(record.get('dateOfBirth'))
            record['workingDetails'] = DataCleaningEngine.clean_text(record.get('workingDetails'))
            record['linkedinProfile'] = DataCleaningEngine.clean_text(record.get('linkedinProfile'))
            record['company'] = DataCleaningEngine.clean_text(record.get('company'))
            record['designation'] = DataCleaningEngine.clean_text(record.get('designation'))
            record['fatherName'] = DataCleaningEngine.clean_text(record.get('fatherName'))

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
                # If matched with medium confidence (80-95%) or high (>=95%), flag for auto-alias save later
                record['facultyAliasToSave'] = fac_name if (0.80 <= confidence_score < 1.0) else None
            else:
                record['facultyId'] = None
                record['facultyConfidence'] = 0.0
                record['facultyAliasToSave'] = None
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

    output = {
        "success": True,
        "summary": summary,
        "records": all_records,
        "errors": errors
    }
    print(json.dumps(output, ensure_ascii=False, indent=2))

if __name__ == '__main__':
    main()
