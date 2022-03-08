#
# Gunicorn Config
# Used in the Docker container
#

bind = "127.0.0.1:8000"
wsgi_app = 'gtkserver:app'
workers = 4
