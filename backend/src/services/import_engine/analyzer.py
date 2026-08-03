import pandas as pd
from typing import Dict

class WorkbookAnalyzer:
    def __init__(self, file_path: str):
        self.file_path = file_path

    def get_valid_sheets(self, target_sheets: list = None) -> Dict[str, pd.DataFrame]:
        try:
            xl = pd.ExcelFile(self.file_path, engine='openpyxl')
        except Exception as e:
            raise ValueError(f"Failed to open workbook: {str(e)}")

        target_set = None
        if target_sheets:
            cleaned = [str(s).strip() for s in target_sheets if str(s).strip() and str(s).strip().upper() != 'DEFAULT_ALL']
            if cleaned:
                target_set = set(s.lower() for s in cleaned)

        valid_sheets = {}
        for sheet_name in xl.sheet_names:
            if target_set and str(sheet_name).strip().lower() not in target_set:
                continue
            try:
                df = xl.parse(sheet_name, header=None)
                if df.empty:
                    continue
                if df.dropna(how='all').empty:
                    continue
                valid_sheets[sheet_name] = df
            except Exception:
                continue
        return valid_sheets
