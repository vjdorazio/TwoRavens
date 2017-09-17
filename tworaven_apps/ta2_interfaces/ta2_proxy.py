"""
Code is courtesy of Matthias Grabmair
    - https://gitlab.datadrivendiscovery.org/mgrabmair/ta3ta2-proxy
"""
import json

from django.conf import settings
from tworaven_apps.ta2_interfaces import core_pb2
#from tworaven_apps.ta2_interfaces import core_pb2_grpc as cpb_grpc
from tworaven_apps.ta2_interfaces.ta2_connection import TA2Connection
from tworaven_apps.ta2_interfaces.ta2_util import get_non_server_session_response_error,\
    get_failed_precondition_error
from google.protobuf.json_format import MessageToJson,\
    Parse, ParseError


def start_session(raven_json_str=None):
    """Start session command
    This command sends a UserAgent and the protocol version
    to the TA2 service
    """
    if raven_json_str is None:
        # Default if the user_agent is not from the UI
        raven_dict = dict(user_agent=settings.TA2_GPRC_USER_AGENT)
    else:
        # The UI has sent JSON in string format that contains the user_agent
        try:
            raven_dict = json.loads(raven_json_str)
        except json.decoder.JSONDecodeError as err_obj:
            err_msg = 'Failed to convert UI Str to JSON: %s' % (err_obj)
            return get_failed_precondition_error(err_msg)

    # The protocol version always comes from the latest
    # version we have in the repo (just copied in for now)
    #
    raven_dict['version'] = TA2Connection.get_protocol_version()

    # --------------------------------
    # Convert back to string for TA2 call
    # --------------------------------
    content = json.dumps(raven_dict)

    # --------------------------------
    # convert the JSON string to a gRPC request
    # --------------------------------
    try:
        req = Parse(content, core_pb2.SessionRequest())
    except ParseError as err_obj:
        err_msg = 'Failed to convert JSON to gRPC: %s' % (err_obj)
        return get_failed_precondition_error(err_msg)


    # --------------------------------
    # Get the connection, return an error if there are channel issues
    # --------------------------------
    core_stub, err_msg = TA2Connection.get_grpc_stub()
    if err_msg:
        return get_failed_precondition_error(err_msg)

        #return dict(status=core_pb2.FAILED_PRECONDITION,
        #            details=err_msg)

    # --------------------------------
    # Send the gRPC request
    # --------------------------------
    try:
        reply = core_stub.StartSession(req)
    except Exception as ex:
        return get_failed_precondition_error(str(ex))


    # --------------------------------
    # Convert the reply to JSON and send it back
    # --------------------------------
    return MessageToJson(reply)


def get_test_info_str():
    return '''{"taskType" : "REGRESSION",
     "taskSubtype" : "TASK_SUBTYPE_UNDEFINED",
     "outputType" : "REAL",
     "metric" : "ROOT_MEAN_SQUARED_ERROR"}'''

def update_problem_schema(info_str=None):
    """
    Accept UI input as JSON *string* similar to
     {"taskType" : "REGRESSION",
      "taskSubtype" : "TASK_SUBTYPE_UNDEFINED",
      "outputType" : "REAL",
      "metric" : "ROOT_MEAN_SQUARED_ERROR"}
    """
    info_str = get_test_info_str()
    if info_str is None:
        err_msg = 'UI Str for UpdateProblemSchema is None'
        return get_failed_precondition_error(err_msg)

    # --------------------------------
    # Convert info string to dict
    # --------------------------------
    try:
        info_dict = json.loads(info_str)
    except json.decoder.JSONDecodeError as err_obj:
        err_msg = 'Failed to convert UI Str to JSON: %s' % (err_obj)
        return get_failed_precondition_error(err_msg)

    # --------------------------------
    # create UpdateProblemSchemaRequest compatible JSON
    # --------------------------------
    updates_list = []
    for key, val in info_dict.items():
        updates_list.append({ key : val})

    final_dict = dict(updates=updates_list)

    content = json.dumps(final_dict)


    # --------------------------------
    # convert the JSON string to a gRPC request
    # --------------------------------
    try:
        req = Parse(content, core_pb2.UpdateProblemSchemaRequest())
    except ParseError as err_obj:
        err_msg = 'Failed to convert JSON to gRPC: %s' % (err_obj)
        return get_failed_precondition_error(err_msg)


    # --------------------------------
    # Get the connection, return an error if there are channel issues
    # --------------------------------
    core_stub, err_msg = TA2Connection.get_grpc_stub()
    if err_msg:
        return get_failed_precondition_error(err_msg)

    # --------------------------------
    # Send the gRPC request
    # --------------------------------
    try:
        reply = core_stub.UpdateProblemSchema(req)
    except Exception as ex:
        return get_failed_precondition_error(str(ex))

    # --------------------------------
    # Convert the reply to JSON and send it on
    # --------------------------------
    return MessageToJson(reply)


"""
python manage.py shell
from tworaven_apps.ta2_interfaces.ta2_proxy import *
updateproblemschema()
"""
