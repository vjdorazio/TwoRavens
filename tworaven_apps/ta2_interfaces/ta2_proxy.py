"""
Code is courtesy of Matthias Grabmair
    - https://gitlab.datadrivendiscovery.org/mgrabmair/ta3ta2-proxy
"""
import json

from django.conf import settings
from tworaven_apps.ta2_interfaces import core_pb2
#from tworaven_apps.ta2_interfaces import core_pb2_grpc as cpb_grpc
from tworaven_apps.ta2_interfaces.ta2_connection import TA2Connection

from google.protobuf.json_format import MessageToJson,\
    Parse, ParseError


def get_non_server_session_response_error(grpc_status_code, err_msg):
    """Do we want to do this?"""

    return core_pb2.SessionResponse(\
                response_info=core_pb2.Response(\
                    status=core_pb2.Status(\
                        code=grpc_status_code,
                        details=err_msg)))

def start_session():
    """Start session command"""
    user_agent = settings.TA2_GPRC_USER_AGENT
    content = json.dumps(dict(user_agent=user_agent,
                              version=TA2Connection.get_protocol_version()))

    print('content', content)

    # parse the request
    try:
        req = Parse(content, core_pb2.SessionRequest())
    except ParseError as err_obj:
        print('err_obj', err_obj)
        print('err_obj', dir(err_obj))
        return

    print('req', req)

    # Get the connection, return an error if there are channel issues
    #
    core_stub, err_msg = TA2Connection.get_grpc_stub()
    if err_msg:
        grpc_bad_status = get_non_server_session_response_error(\
                        core_pb2.FAILED_PRECONDITION,
                        err_msg)
        return MessageToJson(grpc_bad_status)
        #return dict(status=core_pb2.FAILED_PRECONDITION,
        #            details=err_msg)

    try:
        reply = core_stub.StartSession(req)
    except:
        grpc_bad_status = get_non_server_session_response_error(\
                        core_pb2.FAILED_PRECONDITION,
                        "server error.  gRPC server may be down")
        return MessageToJson(grpc_bad_status)


    #if not reply.status.code == core_pb2.OK:
    #    print('not ok!: ', reply.status)
    #print('reply', reply)

    return MessageToJson(reply)


"""
python manage.py shell
from tworaven_apps.ta2_interfaces.ta2_proxy import *
start_session()
"""
