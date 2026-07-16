import re
from difflib import SequenceMatcher
from typing import Dict, Any, List, Tuple

class EntityResolver:
    def __init__(self, faculty_list: List[Dict[str, Any]], alias_map: Dict[str, int]):
        """
        faculty_list: [{'userId': 16, 'name': 'Ms.K.Nisha', 'department': 'CSE'}, ...]
        alias_map: {'nisha mam': 16, 'k nisha': 16, ...}
        """
        self.faculties = faculty_list
        self.aliases = alias_map
        self.titles_pattern = r'\b(dr|prof|mr|mrs|ms|miss|mam|madam|ma\'am|sir|assistant|associate|professor)\b'

    def normalize_name(self, name: str) -> str:
        if not name:
            return ""
        # Lowercase, remove honorifics/titles
        n = name.strip().lower()
        n = re.sub(self.titles_pattern, '', n)
        # Remove punctuation, extra spaces
        n = re.sub(r'[^\w\s]', ' ', n)
        n = re.sub(r'\s+', ' ', n).strip()
        return n

    def resolve_faculty(self, excel_name: str, excel_dept: str = "") -> Tuple[int, float, str]:
        """
        Resolves excel_name to (faculty_id, confidence_score, canonical_name).
        Returns (0, 0.0, '') if unresolved.
        """
        if not excel_name:
            return 0, 0.0, ""

        norm_name = self.normalize_name(excel_name)
        if not norm_name:
            return 0, 0.0, ""

        # 1. Direct Alias Match Check
        if norm_name in self.aliases:
            fid = self.aliases[norm_name]
            fac = next((f for f in self.faculties if f['userId'] == fid), None)
            if fac:
                # Direct alias match gets high confidence (100%)
                return fid, 1.0, fac['name']

        # 2. Token-Based Matching & Fuzzy Matching
        best_fid = 0
        best_score = 0.0
        best_canonical = ""
        excel_tokens = set(norm_name.split())

        for fac in self.faculties:
            fid = fac['userId']
            canonical = fac['name']
            fac_dept = str(fac.get('department', '')).strip().upper()
            norm_canonical = self.normalize_name(canonical)
            canonical_tokens = set(norm_canonical.split())

            # A. Calculate Token Overlap Ratio
            intersection = excel_tokens.intersection(canonical_tokens)
            token_ratio = len(intersection) / len(canonical_tokens) if canonical_tokens else 0.0

            # B. Calculate Sequence Matching Similarity
            seq_score = SequenceMatcher(None, norm_name, norm_canonical).ratio()

            # Merge scores (weight SequenceMatcher higher, but token matches boost confidence)
            combined_score = (seq_score * 0.7) + (token_ratio * 0.3)

            # C. Department validation boost/penalty
            if excel_dept and fac_dept:
                norm_ex_dept = excel_dept.strip().upper()
                if norm_ex_dept == fac_dept or norm_ex_dept in fac_dept or fac_dept in norm_ex_dept:
                    combined_score += 0.05  # Slight boost for matching department
                else:
                    combined_score -= 0.10  # Penalty for department mismatch

            # Cap score between 0.0 and 1.0
            combined_score = max(0.0, min(1.0, combined_score))

            if combined_score > best_score:
                best_score = combined_score
                best_fid = fid
                best_canonical = canonical

        # Return best match
        return best_fid, best_score, best_canonical
