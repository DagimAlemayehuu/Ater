import sys
import io
import contextlib
import traceback
from typing import Dict, Any, Tuple

def execute_sandboxed_code(python_code: str, timeout: int = 5) -> Tuple[bool, str, Dict[str, Any]]:
    """
    Executes Python code in a restricted local sandbox.
    The code is expected to define a function `generate_artifact() -> dict`.
    The dict should contain 'markdown' (the table/diagram) and 'state' (the ground truth variables).
    """
    # Safe builtins
    safe_globals = {
        "__builtins__": {
            "range": range, "len": len, "int": int, "float": float, "str": str,
            "bool": bool, "list": list, "dict": dict, "set": set, "tuple": tuple,
            "sum": sum, "min": min, "max": max, "abs": abs, "round": round,
            "enumerate": enumerate, "zip": zip, "map": map, "filter": filter,
            "any": any, "all": all, "sorted": sorted, "reversed": reversed,
            "Exception": Exception, "ValueError": ValueError, "TypeError": TypeError,
            "math": __import__("math")
        }
    }
    
    local_env = {}
    
    # Capture stdout
    stdout = io.StringIO()
    try:
        with contextlib.redirect_stdout(stdout):
            # Execute the code definition
            exec(python_code, safe_globals, local_env)

            # Resilience: check for either name
            func = local_env.get("generate") or local_env.get("generate_artifact")

            if not func:
                return False, "Error: Code must define a function named `generate()` or `generate_artifact()`.", {}

            # Run the function
            result = func()
            
            if not isinstance(result, dict) or "artifact" not in result or "walkthrough" not in result:
                return False, "Error: `generate()` must return a dict with 'equation', 'artifact', and 'walkthrough' keys.", {}
                
            return True, result["artifact"], result
            
    except Exception as e:
        error_trace = traceback.format_exc()
        return False, f"Execution Failed:\n{error_trace}\nOutput:\n{stdout.getvalue()}", {}
