FROM ubuntu:20.04

#
# Dockerfile for the 4DGB Browser Runner
# 
# This Dockerfile installs all the necessary Python3 and Javascript
# dependencies for the 4DGB Browser.
# When run, a container will import a project from whatever is mounted
# at the '/project' directory, build a release from it, then start up
# a server via gunicorn for it.
#

# Install dependencies
RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y \
    python3 python3 python3-pip rsync cpanminus gosu \
    ca-certificates build-essential curl
RUN ln -s /usr/bin/python3 /usr/bin/python
# Install scroller (for pretty output!)
RUN cpanm Term::Scroller

# Setup NodeJS PPA
# Download setup script and verify hash
RUN curl -fsSL 'https://deb.nodesource.com/setup_16.x' \
        > setup_16.x \
    && [ "$(sha256sum setup_16.x | cut -d' ' -f1)" \
        = "a112ad2cf36a1a2e3e233310740de79d2370213f757ca1b7f93de2f744fb265c" ]
RUN bash setup_16.x
RUN DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs

#Setup Directories
WORKDIR /srv

# Persistent volume to store the project release directory
VOLUME /srv/release

# (We copy these files first because we don't exepct them to change as much)
COPY bin/db_pop ./
COPY bin/docker-entrypoint ./entrypoint
COPY bin/docker-setup      ./setup
RUN chmod +x ./entrypoint  ./setup

# Server and Python Stuff
COPY server/ ./server
RUN  pip3 install -r ./server/requirements.txt && pip3 install gunicorn pandas

# Javascript Stuff
COPY package.json ./
RUN npm install
COPY client-js ./client-js
RUN npx webpack --config client-js/webpack.config.js

ENV BROWSERCONTAINER "yes"

EXPOSE 8000

ENTRYPOINT [ "./entrypoint" ]
