#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
ROOT_DIR="$(dirname "$DIR")"

echo "Checking Python pip..."
if ! /usr/bin/python3 -m pip --version >/dev/null 2>&1; then
    echo "Pip is missing. Installing pip..."
    /usr/bin/python3 "$ROOT_DIR/get-pip.py"
fi

echo "Installing requirements..."
/usr/bin/python3 -m pip install -r "$DIR/requirements.txt" python-multipart

echo "Starting FastAPI backend on port 8001..."
cd "$DIR"
export PYTHONPATH="$PYTHONPATH:$DIR"
exec /usr/bin/python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8001
