# 4DGB Production Deployment Guide

This guide will walk you through the process of setting up a publicly-accessible, but password-protect instance of the 4DGB server.

The production server uses Apache to run the server-side module through WSGI, all wrapped inside a Docker container. Which project to use and the domain name of the web server is set at build-time for the Docker image. Password protection is handled through HTTP Basic Auth, with the user providing a password file to Apache by mounting one into the container at run-time.

HTTPS is *mandatory* for the production server. You must obtain a valid certificate and private key for your server, and mount them into the container at run-time.

## Build the project and Docker Image

Build the project with the [make_release](../bin/make_release) script, just like you would for the test server.
```sh
./bin/make_release test.00
```

Then change to the release directory and build the Docker image from the provided Dockerfile. You must enable BuildKit by setting the environment variable `DOCKER_BUILDKIT` to `1`, and you must provide the fully-qualified domain name of your server as the `SERVERNAME` build argument.

Example:
```sh
cd release/test.00/server
DOCKER_BUILDKIT=1 docker build -t 4dgb:latest --build-arg SERVERNAME=myexample.com .
```

## Set up users and passwords

You can use `htpasswd` (from the apache-utils package on Ubuntu) to create and add users to a password file for Apache.

To create a new file and set the first user, run `htpasswd -c [filename] [username]`. You will be promted to enter, and then confirm a password. Then, for every user you want to add after that, run `htpasswd [filename] [username]`.

Example:
```sh
htpasswd -c passwd john
htpasswd passwd jane
htpasswd passwd bob
```

## Run the container

To run the docker container, you must bind-mount the password file you created, as well your SSL certificate and private key. The container will look for the password file at `/etc/apache2/passwd` and the certificate and private key at `/etc/apache2/ssl/cert.pem` and `/etc/apache2/ssl/privkey.pem`, respectively. You should also expose the contianer on Port 443.

Example:
```sh
docker run --rm -p 443:443 \
    -v path/to/password/file:/etc/apache2/passwd:ro \
    -v path/to/ssl/dir:/etc/apache2/ssl:ro \
    4dgb:latest
```
## [Optional] Run without password-protection

If you want to disable password protection (only do this if your instance will *not* be publicly-accessible!!!), then you can set the environment variable `PASSWORDPROTECT` to `no` inside the container.

Example:
```sh
docker run --rm -p 443:443 \
    -e PASSWORDPROTECT=no \
    -v path/to/ssl/dir:/etc/apache2/ssl:ro \
    4dgb:latest
```
