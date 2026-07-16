import sys
import os
import subprocess

def main():
    if len(sys.argv) < 2:
        print('{"success": false, "error": "No file path provided"}')
        sys.exit(1)

    file_path = sys.argv[1]
    script_dir = os.path.dirname(os.path.abspath(__file__))
    target_script = os.path.join(script_dir, 'import_engine', 'main.py')

    if not os.path.exists(target_script):
        print(f'{{"success": false, "error": "Import engine script not found at {target_script}"}}')
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
            print(f'{{"success": false, "error": "Import engine execution failed: {stderr.strip()}"}}')
            sys.exit(proc.returncode)
            
        print(stdout)
    except Exception as e:
        print(f'{{"success": false, "error": "Failed to run import engine: {str(e)}"}}')
        sys.exit(1)

if __name__ == '__main__':
    main()
