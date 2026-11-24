import ast
from pathlib import Path

SKIP_DIRS = {"venv", ".venv", "__pycache__"}

for path in Path("backend").rglob("*.py"):
    if SKIP_DIRS.intersection(path.parts):
        continue
    ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
