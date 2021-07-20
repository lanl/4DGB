# Repository for the 4D Genome Browser project
![client](https://github.com/lanl/4DGB/actions/workflows/client.yml/badge.svg)
![client-js](https://github.com/lanl/4DGB/actions/workflows/client-js.yml/badge.svg)
![publisher](https://github.com/lanl/4DGB/actions/workflows/publisher.yml/badge.svg)

## To run the application locally

- Make a release, then run the release server:
    - initialize the database
        - `./bin/db_pop <project directory>`
    - make a release
        - `./bin/make_release <project> <port>`
    - cd to the release and run the server

- Here is an example of doing this for the `test.00` project:
```
    ./bin/make_release test.00 8000
    pushd release/test.00
    python gtkserver.py localhost.yaml
```

- In another shell, run the client script:
```
   (cd to your repository)
   pushd release/test.00/python
   ./test-gentk
```

- You can also open a browser to `http://127.0.0.1:8000/viewer.html?gtkproject=test.00`. You'll see the following:

<div align="center">
<img src="img/test.00.png"></img>
</div>

  
