from typing import List

def check_formatting_issues(text: str) -> List[str]:
    """
    Analyzes raw text for common ATS parsing issues.
    """
    issues = []
    
    # Check 1: Garbage Characters
    if "(cid:" in text:
        issues.append("Unreadable fonts detected (CID encoding error). Avoid using custom fonts.")

    lines = [line for line in text.split('\n') if line.strip()]
    
    # Check 2: High Fragmentation
    if lines:
        short_lines = sum(1 for line in lines if len(line.split()) < 4)
        fragmentation_ratio = short_lines / len(lines)
        if fragmentation_ratio > 0.4:
            issues.append("High fragmentation detected. This often happens when using Tables or Multi-column layouts.")

    return issues