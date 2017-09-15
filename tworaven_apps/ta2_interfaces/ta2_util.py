"""
Code is courtesy of Matthias Grabmair
    - https://gitlab.datadrivendiscovery.org/mgrabmair/ta3ta2-proxy
"""
from tworaven_apps.ta2_interfaces import core_pb2

def get_non_server_session_response_error(grpc_status_code, err_msg):
    """Do we want to do this?"""

    return core_pb2.SessionResponse(\
                response_info=core_pb2.Response(\
                    status=core_pb2.Status(\
                        code=grpc_status_code,
                        details=err_msg)))
