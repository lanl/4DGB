To run the example locally

You will need jupyter lab, ipympl, and pypac.
To install:
In a terminal run the following conda and pip commands:
    conda install -c conda-forge ipympl
    pip install pypac
    conda install -c conda-forge jupyterlab

After that, close that terminal.

Activate a jupyter lab in a terminal with the command:
    jupyter lab

Use the GUI to navigate to the directory of your notebook (4DGB), and then go to the folder "example", then click on "test00.ipynb"
"Image"

Before running the notebook, we need to make a release locally

    ./bin/make_release test.00
    python3 release/test.00/server/gtkserver.py --port 8000

Use the arrow to run the notebook, you should see this  3D plot
