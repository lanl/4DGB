#!/usr/bin/bash
# Make a new self-signed certificate
openssl req -x509 -newkey rsa:4096 -nodes -keyout key.pem -out cert.pem -days 365 -subj '/CN=localhost'
