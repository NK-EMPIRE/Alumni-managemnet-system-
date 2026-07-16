import re
from typing import Dict, Any, List

class ValidationEngine:
    @staticmethod
    def validate_row(row_dict: Dict[str, Any], row_num: int, sheet_name: str) -> List[Dict[str, Any]]:
        errors = []
        
        # 1. Validate Register Number
        reg_no = row_dict.get('registerNo')
        if not reg_no or str(reg_no).strip() == '' or str(reg_no).strip().lower() == 'null':
            errors.append({
                "sheet": sheet_name,
                "row": row_num,
                "registerNo": "-",
                "errorType": "Missing Register Number",
                "errorDescription": f"Row {row_num} in sheet '{sheet_name}' is missing a Register Number."
            })

        # 2. Validate Email
        email = row_dict.get('email')
        if email:
            email_pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
            if not re.match(email_pattern, str(email)):
                errors.append({
                    "sheet": sheet_name,
                    "row": row_num,
                    "registerNo": reg_no or "-",
                    "errorType": "Invalid Email Format",
                    "errorDescription": f"Email format '{email}' is invalid."
                })

        # 3. Validate Phone
        phone = row_dict.get('phone')
        if phone:
            # Phone digits should be 10-15 chars
            digits = re.sub(r'[^\d]', '', str(phone))
            if len(digits) < 10 or len(digits) > 15:
                errors.append({
                    "sheet": sheet_name,
                    "row": row_num,
                    "registerNo": reg_no or "-",
                    "errorType": "Invalid Phone Format",
                    "errorDescription": f"Phone number '{phone}' must contain between 10 and 15 digits."
                })

        return errors
class DuplicateDetector:
    def __init__(self):
        self.seen = set()

    def is_duplicate(self, register_no: str) -> bool:
        if not register_no:
            return False
        clean_reg = str(register_no).strip().lower()
        if clean_reg in self.seen:
            return True
        self.seen.add(clean_reg)
        return False
