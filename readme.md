# Repository for the 4D Genome Browser project

## To run the application locally

- Make a release, then run the release server:
    - initialize the database
        - `./bin/db_pop <project directory>`
    - make a release
        - `./bin/make_release <project> <port>`
    - cd to the release and run the server

- Here is an example of doing this for the `test.00` project:
```
    ./bin/db_pop projects/test.00
    ./bin/make_release test.00 8000
    pushd release/test.00
    python gtkserver.py localhost.yaml
```

- Open a browser to `http://127.0.0.1:8000/viewer.html?gtkproject=test.00`. You'll see the following:

<div align="center">
<img src="img/test.00.png"></img>
</div>

  
