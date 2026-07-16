import re
import pandas as pd
from typing import Any, Optional

class DataCleaningEngine:
    @staticmethod
    def clean_register_no(val: Any) -> str:
        if pd.isna(val):
            return ""
        v = str(val).strip()
        # Convert scientific notation or floats like '2021001.0' -> '2021001'
        if v.endswith('.0'):
            v = v[:-2]
        return v

    @staticmethod
    def clean_email(val: Any) -> str:
        if pd.isna(val):
            return ""
        return str(val).strip().lower()

    @staticmethod
    def clean_phone(val: Any) -> str:
        if pd.isna(val):
            return ""
        v = str(val).strip()
        if v.endswith('.0'):
            v = v[:-2]
        # Keep only digits and '+'
        return re.sub(r'[^\d+]', '', v)

    @staticmethod
    def clean_date(val: Any) -> str:
        if pd.isna(val):
            return ""
        # Try returning clean string
        v = str(val).strip()
        if v.endswith('.0'):
            v = v[:-2]
        return v

    @staticmethod
    def clean_gender(val: Any) -> str:
        if pd.isna(val):
            return ""
        g = str(val).strip().lower()
        if g in ('m', 'male'):
            return 'Male'
        if g in ('f', 'female'):
            return 'Female'
        return 'Other'

    @staticmethod
    def clean_batch(val: Any) -> str:
        if pd.isna(val):
            return ""
        v = str(val).strip()
        if v.endswith('.0'):
            v = v[:-2]
        # Ensure it is a 4-digit number if matchable
        match = re.search(r'\b(20\d{2})\b', v)
        if match:
            return match.group(1)
        return v

    @staticmethod
    def clean_text(val: Any) -> str:
        if pd.isna(val) or val is None:
            return ""
        return str(val).strip()
