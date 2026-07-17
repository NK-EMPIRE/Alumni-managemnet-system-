import pandas as pd
from typing import Dict

class WorkbookAnalyzer:
    def __init__(self, file_path: str):
        self.file_path = file_path

    def get_valid_sheets(self) -> Dict[str, pd.DataFrame]:
        try:
            xl = pd.ExcelFile(self.file_path, engine='openpyxl')
        except Exception as e:
            raise ValueError(f"Failed to open workbook: {str(e)}")

        valid_sheets = {}
        for sheet_name in xl.sheet_names:
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
