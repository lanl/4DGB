# To run the Jupyter Notebook locally

You will need jupyter lab, ipympl, and pypac.

### To install: 
```sh
conda install -c conda-forge ipympl
pip install pypac
conda install -c conda-forge jupyterlab
```

### To run the `test.00` project in this repository:
    ./bin/make_release test.00
    python3 release/test.00/server/gtkserver.py --port 8000

### Activate a jupyter Notebook in a different terminal:
    jupyter notebook

Use the GUI to navigate to the directory of your notebook "4DGB", go to the folder "example", and then click on "test00.ipynb" 

Run the entire notebook to view the 3D plot:

<div align="center">
<img src="structure.png" width="500" height="500">

</div>

