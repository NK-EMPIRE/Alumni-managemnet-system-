import re
import pandas as pd
from datetime import datetime
from typing import Any, Optional

class DataCleaningEngine:
    @staticmethod
    def clean_register_no(val: Any) -> str:
        if pd.isna(val) or val is None:
            return ""
        v = str(val).strip()
        if v.endswith('.0'):
            v = v[:-2]
        return v

    @staticmethod
    def clean_email(val: Any) -> str:
        if pd.isna(val) or val is None:
            return ""
        return str(val).strip().lower()

    @staticmethod
    def clean_phone(val: Any) -> str:
        if pd.isna(val) or val is None:
            return ""
        v = str(val).strip()
        if v.endswith('.0'):
            v = v[:-2]
        return re.sub(r'[^\d+]', '', v)

    @staticmethod
    def clean_date(val: Any) -> str:
        """
        Parses date from various raw types (pd.Timestamp, datetime, float/int excel serial, or formatted strings)
        and converts to standard DD/MM/YYYY string format.
        """
        if pd.isna(val) or val is None:
            return ""

        # Handle datetime / Timestamp objects directly from pandas
        if isinstance(val, (pd.Timestamp, datetime)):
            return val.strftime('%d/%m/%Y')

        # Handle string or float representation
        v = str(val).strip()
        if not v or v.lower() in ('null', 'none', 'nan', 'nat', '-'):
            return ""

        if v.endswith('.0'):
            v = v[:-2]

        # Strip ordinal suffixes e.g. "5th May 2025" -> "5 May 2025", "21st-05-2003" -> "21-05-2003"
        v_clean = re.sub(r'(\d+)(st|nd|rd|th)', r'\1', v, flags=re.IGNORECASE)

        # Handle Excel numeric date serial numbers (e.g. 37762 -> 2003-05-21)
        if v_clean.isdigit() and len(v_clean) in (4, 5):
            try:
                serial = int(v_clean)
                dt = pd.to_datetime(serial, unit='D', origin='1899-12-30')
                return dt.strftime('%d/%m/%Y')
            except Exception:
                pass

        # Try parsing via pandas to_datetime
        import warnings
        with warnings.catch_warnings():
            warnings.simplefilter('ignore')
            try:
                parsed_dt = pd.to_datetime(v, errors='coerce')
                if not pd.isna(parsed_dt):
                    return parsed_dt.strftime('%d/%m/%Y')
            except Exception:
                pass

        # Manual Regex fallback formats for DD-MM-YYYY, YYYY-MM-DD, DD/MM/YYYY, etc.
        patterns = [
            (r'^(\d{1,2})[-\/\.](\d{1,2})[-\/\.](\d{4})$', lambda m: f"{int(m.group(1)):02d}/{int(m.group(2)):02d}/{m.group(3)}"),
            (r'^(\d{4})[-\/\.](\d{1,2})[-\/\.](\d{1,2})$', lambda m: f"{int(m.group(3)):02d}/{int(m.group(2)):02d}/{m.group(1)}"),
        ]

        for pattern, formatter in patterns:
            match = re.match(pattern, v)
            if match:
                try:
                    return formatter(match)
                except Exception:
                    pass

        return v

    @staticmethod
    def clean_gender(val: Any) -> str:
        if pd.isna(val) or val is None:
            return ""
        g = str(val).strip().lower()
        if g in ('m', 'male'):
            return 'Male'
        if g in ('f', 'female'):
            return 'Female'
        return 'Other'

    @staticmethod
    def clean_batch(val: Any) -> str:
        if pd.isna(val) or val is None:
            return ""
        v = str(val).strip()
        if v.endswith('.0'):
            v = v[:-2]

        full_range = re.match(r'^(\d{4})[-\s/](\d{4})$', v)
        if full_range:
            return f"{full_range.group(1)}-{full_range.group(2)}"

        shorthand = re.match(r'^(\d{4})[-\s/](\d{2})$', v)
        if shorthand:
            start_yr_str = shorthand.group(1)
            end_2digit_str = shorthand.group(2)
            start_yr = int(start_yr_str)
            end_2digit = int(end_2digit_str)
            century = (start_yr // 100) * 100
            start_2digit = start_yr % 100

            if end_2digit < start_2digit:
                end_yr = (century + 100) + end_2digit
            else:
                end_yr = century + end_2digit
            return f"{start_yr}-{end_yr}"

        single_year = re.match(r'^(\d{4})$', v)
        if single_year:
            return v

        return v

    @staticmethod
    def clean_text(val: Any) -> str:
        if pd.isna(val) or val is None:
            return ""
        return str(val).strip()
