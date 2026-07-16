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

        # 1. Check full range YYYY-YYYY
        full_range = re.match(r'^(\d{4})[-\s/](\d{4})$', v)
        if full_range:
            return f"{full_range.group(1)}-{full_range.group(2)}"

        # 2. Check shorthand YYYY-YY
        shorthand = re.match(r'^(\d{4})[-\s/](\d{2})$', v)
        if shorthand:
            start_yr_str = shorthand.group(1)
            end_2digit_str = shorthand.group(2)
            
            start_yr = int(start_yr_str)
            end_2digit = int(end_2digit_str)
            
            century = (start_yr // 100) * 100
            start_2digit = start_yr % 100
            
            # If the end year 2-digit is less than start year 2-digit (e.g. 1999-01),
            # it means we rolled over into the next century.
            if end_2digit < start_2digit:
                end_yr = (century + 100) + end_2digit
            else:
                end_yr = century + end_2digit
            
            return f"{start_yr}-{end_yr}"

        # 3. Check single YYYY
        single_year = re.match(r'^(\d{4})$', v)
        if single_year:
            return v

        # 4. Fallback to raw string
        return v

    @staticmethod
    def clean_text(val: Any) -> str:
        if pd.isna(val) or val is None:
            return ""
        return str(val).strip()
