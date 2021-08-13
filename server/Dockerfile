#
# Image for an Apache HTTP server which calls into gtkserver.py via WSGI,
# used for production instances of the 4DGB server.
#
# IMPORTANT:
#   This Dockerfile is meant to be run from one of the release directories,
#   NOT from the top-level server directory which, if you just cloned this
#   repo is where you found it. The make_release script copies this Dockerfile,
#   and the rest of the files it needs to build an image (such as a project
#   directory) into a release directory.
#
# 

FROM ubuntu:20.04

RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y \
    python3 python3-dev python3-pip apache2 apache2-dev \
    ca-certificates build-essential curl

# mod_wsgi's documentation reccommends compiling from source (as opposed
# to using a pre-packaged binary, so we do that here)

# Download mod_wsgi-4.9.0 and verify hash
RUN curl -sL 'https://codeload.github.com/GrahamDumpleton/mod_wsgi/tar.gz/refs/tags/4.9.0' \
        > mod_wsgi-4.9.0.tar.gz \
    && [ "$(sha256sum mod_wsgi-4.9.0.tar.gz | cut -d' ' -f1)" \
        = "0a6f380af854b85a3151e54a3c33b520c4a6e21a99bcad7ae5ddfbfe31a74b50" ]
# Extract and build/install
RUN tar -xzf mod_wsgi-4.9.0.tar.gz && cd mod_wsgi-4.9.0 \
    && ./configure --with-python=/usr/bin/python3 --with-apxs=/usr/bin/apxs \
    && make install

COPY requirements.txt .
RUN pip3 install -r requirements.txt

# Make Apache use apache_config.conf as its only enabled site
COPY apache_config.conf /etc/apache2/sites-available/my_site.conf
RUN rm /etc/apache2/sites-enabled/000-default.conf \
    && ln /etc/apache2/sites-available/my_site.conf /etc/apache2/sites-enabled/my_site.conf

COPY gtkserver.py /srv/gtkserver.py
COPY static/      /srv/static
RUN  echo "from gtkserver import app as application" > /srv/app.wsgi

# We want apache to write its logs to the container's stderr.
# For some reason, redirecting the error log only works with the hack
# see here, and not with an directive in Apache's config, while redirecting
# the regular log only works in the apache config and not by hacking a
# symlink here.

RUN ln -sf /dev/stderr /var/log/apache2/error.log

WORKDIR /srv

EXPOSE 80

CMD [ "apachectl", "-D", "FOREGROUND", "-e", "info" ]
