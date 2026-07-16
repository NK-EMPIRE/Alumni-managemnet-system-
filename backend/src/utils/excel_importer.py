import sys
import os
import subprocess

def main():
    if len(sys.argv) < 2:
        sys.stderr.write('{"success": false, "error": "No file path provided"}\n')
        sys.exit(1)

    file_path = sys.argv[1]
    script_dir = os.path.dirname(os.path.abspath(__file__))
    target_script = os.path.join(os.path.dirname(script_dir), 'services', 'import_engine', 'main.py')

    if not os.path.exists(target_script):
        sys.stderr.write(f'{{"success": false, "error": "Import engine script not found at {target_script}"}}\n')
        sys.exit(1)

    # Forward stdin contents if any are available (pass database faculties/aliases to Python)
    stdin_data = ""
    if not sys.stdin.isatty():
        stdin_data = sys.stdin.read()

    try:
        proc = subprocess.Popen(
            [sys.executable, target_script, file_path],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding='utf-8'
        )
        stdout, stderr = proc.communicate(input=stdin_data)
        
        if proc.returncode != 0:
            sys.stderr.write(f'{{"success": false, "error": "Import engine execution failed: {stderr.strip()}"}}\n')
            sys.exit(proc.returncode)
            
        print(stdout)
    except Exception as e:
        sys.stderr.write(f'{{"success": false, "error": "Failed to run import engine: {str(e)}"}}\n')
        sys.exit(1)

if __name__ == '__main__':
    main()
