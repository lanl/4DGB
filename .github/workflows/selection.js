# This workflow will install Python dependencies, run tests and lint with a single version of Python
# For more information see: https://help.github.com/actions/language-and-framework-guides/using-python-with-github-actions

name: Client selection test 

on:
  push:

jobs:
  build:

    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: [3.7, 3.8, 3.9]

    steps:
    - uses: actions/checkout@v2
    - name: Set up Python ${{ matrix.python-version }} 
      uses: actions/setup-python@v2
      with:
        python-version: ${{ matrix.python-version }} 
    - name: Make the release 
      run: |
        npm install
        ./bin/make_release test.00
    - name: Install dependencies
      run: |
        echo 'installing python dependencies'
        python -m pip install --upgrade pip
        pip install -r requirements.txt
        pip install pytest
        echo ''
        echo 'installing javascript dependencies'
    - name: Run the server and test with client 
      run: |
        python3 release/test.00/server/gtkserver.py &
        sleep 5
        echo 'running javascript test'
        npm run test testing/selection.js
