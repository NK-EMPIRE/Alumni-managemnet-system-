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

        target_set = set(str(s).strip() for s in target_sheets) if target_sheets else None

        valid_sheets = {}
        for sheet_name in xl.sheet_names:
            if target_set and str(sheet_name).strip() not in target_set:
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
