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
    ca-certificates build-essential curl nginx jq
RUN ln -s /usr/bin/python3 /usr/bin/python
# Install scroller (for pretty output!)
RUN cpanm Term::Scroller

# Setup NodeJS PPA
RUN curl -fsSL 'https://deb.nodesource.com/setup_16.x' > setup_16.x
RUN bash setup_16.x
RUN DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs

#Setup Directories/Permissions
# We need to set permissions on a few things so nginx can
# read them when running as www-data (instead of root)
RUN mkdir -p /var/lib/nginx /var/log/nginx \
    && touch /run/nginx.pid \
    && chown -R www-data:www-data /var/lib/nginx /run/nginx.pid /var/log/nginx \
    # If the container is using a tty, then we'll need to be in the tty group
    # in order to write to stdout
    && usermod -aG tty www-data
WORKDIR /srv

# Javascript Stuff
COPY package.json ./
COPY client-js ./client-js
RUN npm install \
    && npx webpack --config client-js/webpack.config.js

# Python Stuff
COPY server/requirements.txt ./server/requirements.txt
RUN  pip3 install -r ./server/requirements.txt \
     && pip3 install gunicorn pandas

# Persistent volume to store the project release directory
VOLUME /srv/release

# Server Configuration
COPY bin/db_pop ./
COPY bin/docker-entrypoint ./entrypoint
COPY bin/docker-setup      ./setup
COPY server/ ./server
RUN chmod +x ./entrypoint  ./setup

#Determine if this is going to be a production, or a local setup
ARG MODE=local
ENV MODE ${MODE}
RUN if [ "${MODE}" != "production" ] && [ "${MODE}" != "local" ] ; then \
        echo "MODE must be either 'production' or 'local'" \
        && exit 1 \
    ; fi

# If in production mode, symlink nginx's access log to stdout
RUN if [ "${MODE}" = "production" ] ; then \
    ln -sf /dev/stdout /var/log/nginx/access.log \
    ; fi

RUN cp ./server/nginx-${MODE}.conf /etc/nginx/nginx.conf

ENV BROWSERCONTAINER "yes"

ENTRYPOINT [ "./entrypoint" ]
