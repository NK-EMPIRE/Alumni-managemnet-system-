import re
import pandas as pd
from typing import Dict, Any, List

class StructureIntelligenceEngine:
    @staticmethod
    def parse_multiple_phones(val: str) -> List[str]:
        if not val:
            return []
        # Split on common separators: , / | ; newline
        parts = re.split(r'[,/|;\n\t]', str(val))
        phones = []
        for p in parts:
            p_clean = re.sub(r'[^\d+]', '', p.strip())
            if len(p_clean) >= 10:
                phones.append(p_clean)
        return phones

    @staticmethod
    def parse_multiple_emails(val: str) -> List[str]:
        if not val:
            return []
        parts = re.split(r'[,/|;\s\n\t]', str(val))
        emails = []
        email_pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
        for p in parts:
            p_clean = p.strip()
            if re.match(email_pattern, p_clean):
                emails.append(p_clean.lower())
        return emails

    @staticmethod
    def resolve_split_names(row_dict: Dict[str, Any], df_cols_norm: List[str], raw_row: pd.Series) -> str:
        """
        Merge split first/middle/last name columns if full name is missing or incomplete
        """
        first_name = ""
        middle_name = ""
        last_name = ""
        
        for col_name, val in raw_row.items():
            if pd.isna(val):
                continue
            col_norm = re.sub(r'[^a-z]', '', str(col_name).lower())
            if col_norm in ('firstname', 'first_name'):
                first_name = str(val).strip()
            elif col_norm in ('middlename', 'middle_name'):
                middle_name = str(val).strip()
            elif col_norm in ('lastname', 'last_name', 'surname'):
                last_name = str(val).strip()
        
        if first_name:
            parts = [first_name]
            if middle_name:
                parts.append(middle_name)
            if last_name:
                parts.append(last_name)
            return " ".join(parts)
        return row_dict.get('name', '')

    @staticmethod
    def split_course_batch(val: str) -> Dict[str, str]:
        """
        Handles combined strings like 'CSE-2022' or 'ECE 2021' -> {'course': 'ECE', 'batch': '2021'}
        """
        if not val:
            return {}
        pattern = r'^([a-zA-Z\s\.-]+)[-\s](\d{4})$'
        match = re.match(pattern, str(val).strip())
        if match:
            return {
                'course': match.group(1).strip(),
                'batch': match.group(2).strip()
            }
        return {}
