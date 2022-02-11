# 4DGB Browser Public Deployment

This guide explains how to set up an instance of the 4DGB browser suitable to be accessed from other machines over the internet. It assumes you are already familiar with the basic principles of running/hosting web services and/or using Docker.

**⚠ WARNING:** 4DGB is still a *research prototype*. The setup described here is secured only through HTTP Basic Auth, and is not designed to handle large amounts of traffic. This is best suited for internal (univeristy or organization-wide) deployments. Use caution if deploying somewhere visible to the entire internet.

## Setup

1. First, you must build the docker image for production use. This works just like building the image for local use, except with the build-arg `MODE=production`
```sh
docker build -t 4dgbrunner-prod --build-arg MODE=production .
```

2. Next, obtain an SSL/TLS certificate and private key for your server. How exactly you do this is outside the scope of the guide, but if you're at a loss, why not try [Let'sEncrypt](https://letsencrypt.org/)?

3. Finally, set up an htpasswd file with all the users you want to grant access to the server (and set their passwords). The `htpasswd(1)` utility comes with Apache httpd on most distributions and can be used to create and maintain this file. Below is an example of creating a new file and adding two users to it.
```
$ htpasswd -c passwd alice
New Password: <enter password>
Re-type new password: <re-enter password>
Adding password for user alice
$ htpasswd passwd bob
New Password: <enter password>
Re-type new password: <re-enter password>
Adding password for user bob
```

## Deployment

Running the Docker container has a "few" requirements:

* You need to expose **port 443** in the container. Which port you map it to is up to you.
* The directory for the project you wish to view should be bind-mounted at `/project` in the container.
* Your passwd file should be bind-mounted at `/etc/nginx/passwd` in the container.
* Your SSL cert/key should be bind-mounted at `/etc/nginx/ssl/cert.pem` and `/etc/nginx/ssl/privkey.pem` respectively.
* If you don't want to re-process and re-import the project every time you restart the container, you can
create a persistent volume at `/srv/release` inside the container.
* You must use a TTY for the container, or else nginx cannot write it's output to stdout. Details [HERE](https://github.com/moby/moby/issues/31243).
* The command-line arguments to the container should be `NAME` followed by `PORT` where:
  * `NAME` is the name of the project being viewed.
  * `PORT` is the port (outside the container) the server is listening on.

Below is an example to run the container using the example material available in this repository:
```sh
docker run --rm -it -p "8000:443" -v $(pwd)/projects/test.01:/project:ro -v 4dgbprojects:/srv/release -v $(pwd)/server/example/passwd:/etc/nginx/passwd:ro -v $(pwd)/server/example/ssl:/etc/nginx/ssl:ro 4dgbrunner-prod "test.01" 8000
```

**NOTE:** The example SSL certificate in this repository is self-signed, so your browser might still reject it. To log on, use the username `user`, and the password `password`.

You might have an easier time if you put all this in a `docker-compose.yml` file like so:

```yaml
version: "3"

volumes:
  4dgbprojects:

services:
  browser:
    image: "4dgbrunner-prod:latest"
    ports:
      - "8000:443"
    tty: true
    volumes:
      - "./projects/test.01:/project:ro"
      - "4dgbprojects:/srv/release"
      - "./server/example/passwd:/etc/nginx/passwd:ro"
      - "./server/example/ssl:/etc/nginx/ssl:ro"
    command: test.01 8000
```

Now you would just need to run `docker-compose up` to start the server.
