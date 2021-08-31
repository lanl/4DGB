# syntax=docker/dockerfile:1.3-labs
#
# Image for an Apache HTTP server which calls into gtkserver.py via WSGI,
# used for production instances of the 4DGB server. The server requires
# HTTPS and, by default, requires basic authentication. An httpd password
# file along with an SSL certificate/key are meant to be provided via bind
# mounts when running a container. The 'server/example' directory in this
# repository contains a simple password file (username: 'user',
# password: 'password') and a self-signed certificate if you just want to
# test it out.
#
# - The password file should be mounted at '/etc/apache2/passwd'
# - The SSL certificate and key should be mounted at '/etc/apache2/ssl/cert.pem'
#   and '/etc/apache2/ssl/privkey.pem', respectively.
#
# For HTTPS to work, you should provide a build argument, SERVERNAME, which
# Apache will use as the virtual host address and should match the domain name
# of your certificate. Default is 'localhost', which will also work with the
# provided example certificate.
#
# HTTPS is always required, but basic auth can be disabled at run time by
# providing the environment variable PASSWORDPROTECT=no when running the
# container.
# 
# Example (build):
#   DOCKER_BUILDKIT=1 docker build . -t 4dgb:latest \
#       --build-arg SERVERNAME=4dgb.example.net
#
# Example (run):
#   docker run --rm --it -name 4dgb -p 4430:443 \
#       -v /path/to/example/passwd:/etc/apache2/passwd:ro \
#       -v /path/to/example/ssl:/etc/apache2/ssl:ro 4dgb
#
# IMPORTANT:
#   This Dockerfile requires BuildKit. When calling 'docker build' make sure
#   the environment variable DOCKER_BUILDKIT is set to '1'
#
#   This Dockerfile is meant to be run from one of the release directories,
#   NOT from the top-level server directory which, if you just cloned this
#   repo is where you found it. The make_release script copies this Dockerfile,
#   and the rest of the files it needs to build an image (such as a project
#   directory) into a release directory.
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

# Make Apache use this config file as its only enabled site
ARG SERVERNAME=localhost
COPY <<'EOF' /etc/apache2/sites-available/my_site.conf
LoadModule wsgi_module /usr/lib/apache2/modules/mod_wsgi.so
LoadModule ssl_module  /usr/lib/apache2/modules/mod_ssl.so
WSGIPythonPath /srv

ServerName  SERVERNAME
ServerAdmin webmaster@SERVERNAME

Listen 443 https
<VirtualHost _default_:443>

    ServerName  SERVERNAME

    TransferLog /dev/stderr

    DocumentRoot /srv

    WSGIScriptAlias / /srv/app.wsgi

    SSLEngine on
    SSLCertificateFile "/etc/apache2/ssl/cert.pem"
    SSLCertificateKeyFile "/etc/apache2/ssl/privkey.pem"


    <Directory /srv>

        <If "osenv('PASSWORDPROTECT') != 'no'">
            AuthType Basic
            AuthName "Restricted"
            AuthBasicProvider file
            AuthUserFile "/etc/apache2/passwd"
            Require valid-user
        </If>

        Require all granted
    </Directory>

</VirtualHost>
EOF

RUN perl -i.bak -lpe "s:SERVERNAME:${SERVERNAME}:g" /etc/apache2/sites-available/my_site.conf

RUN rm /etc/apache2/sites-enabled/000-default.conf \
    && ln /etc/apache2/sites-available/my_site.conf /etc/apache2/sites-enabled/my_site.conf

COPY gtkserver.py /srv/gtkserver.py
COPY static/      /srv/static
RUN  echo "from gtkserver import app as application" > /srv/app.wsgi

# We want apache to write its logs to the container's stderr.
# For some reason, redirecting the error log only works with the hack
# you see here, and not with an directive in Apache's config, while redirecting
# the regular log only works in the apache config and not by hacking a
# symlink here.
RUN ln -sf /dev/stderr /var/log/apache2/error.log

WORKDIR /srv

EXPOSE 443

CMD [ "apachectl", "-D", "FOREGROUND", "-e", "info" ]
