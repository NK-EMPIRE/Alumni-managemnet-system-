import pandas as pd
import re
from typing import Tuple, List

class HeaderDetector:
    def __init__(self, synonym_dictionary: List[str]):
        self.synonyms = synonym_dictionary

    def detect_header_row(self, df: pd.DataFrame) -> Tuple[int, float]:
        """
        Scans first 20 rows of df, returns (header_row_index, confidence_score).
        Confidence is based on synonym presence in row cells.
        """
        max_rows = min(20, len(df))
        best_row = 0
        best_score = 0.0

        for r_idx in range(max_rows):
            row_vals = df.iloc[r_idx].dropna().tolist()
            if not row_vals:
                continue

            matches = 0
            for val in row_vals:
                if not isinstance(val, str):
                    val = str(val)
                norm = re.sub(r'[\s_-]+', '_', val.strip().lower())
                norm = re.sub(r'[^a-z0-9_]', '', norm)
                if norm in self.synonyms:
                    matches += 1

            total_cols = len(row_vals)
            score = matches / total_cols if total_cols > 0 else 0.0
            
            # Boost score slightly if standard fields like 'reg' or 'name' are matched
            if score > best_score:
                best_score = score
                best_row = r_idx

        # If no header rows found with confidence, default to 0
        if best_score == 0.0:
            return 0, 0.0
        return best_row, best_score
