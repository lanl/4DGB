import gentk
from .testfunctions import *

import os

CERT_FILE = os.path.join(
    os.path.dirname(__file__), '..', 'server', 'example', 'ssl', 'cert.pem'
)
os.environ['REQUESTS_CA_BUNDLE'] = CERT_FILE

set_client( gentk.client.client("https://localhost", "4430", auth="user:password"), "test.00", "test00projid" )
