"""
Code is courtesy of Matthias Grabmair
    - https://gitlab.datadrivendiscovery.org/mgrabmair/ta3ta2-proxy
"""
import json

from django.conf import settings
from tworaven_apps.ta2_interfaces import core_pb2
#from tworaven_apps.ta2_interfaces import core_pb2_grpc as cpb_grpc
from tworaven_apps.ta2_interfaces.ta2_connection import TA2Connection
from tworaven_apps.ta2_interfaces.ta2_util import get_non_server_session_response_error
from google.protobuf.json_format import MessageToJson,\
    Parse, ParseError


def start_session():
    """Start session command"""
    user_agent = settings.TA2_GPRC_USER_AGENT
    content = json.dumps(dict(user_agent=user_agent,
                              version=TA2Connection.get_protocol_version()))

    # convert the JSON string to a gRPC request
    #
    try:
        req = Parse(content, core_pb2.SessionRequest())
    except ParseError as err_obj:
        print('err_obj', err_obj)
        print('err_obj', dir(err_obj))
        err_msg = 'Failed to convert JSON to gRPC: %s' % (err_obj)
        grpc_bad_status = get_non_server_session_response_error(\
                        core_pb2.FAILED_PRECONDITION,
                        err_msg)

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

    # Send the gRPC request
    #
    try:
        reply = core_stub.StartSession(req)
    except:
        grpc_bad_status = get_non_server_session_response_error(\
                        core_pb2.FAILED_PRECONDITION,
                        "server error.  gRPC server may be down")
        return MessageToJson(grpc_bad_status)

    # Convert the reply to JSOn and send it on
    #
    return MessageToJson(reply)



def updateproblemschema():
    # hard code as init test
    content_dict = {"taskType" : "REGRESSION",
            "taskSubtype" : "TASK_SUBTYPE_UNDEFINED",
            "outputType" : "REAL",
            "metric" : "ROOT_MEAN_SQUARED_ERROR"}

    updates_list = []
    for key, val in content_dict.items():
        updates_list.append({ key : val})

    final_dict = dict(updates=updates_list)

    content = json.dumps(final_dict)


    # convert the JSON string to a gRPC request
    #
    try:
        req = Parse(content, core_pb2.UpdateProblemSchemaRequest())
    except ParseError as err_obj:
        print('err_obj', err_obj)
        print('err_obj', dir(err_obj))
        err_msg = 'Failed to convert JSON to gRPC: %s' % (err_obj)
        grpc_bad_status = get_non_server_session_response_error(\
                        core_pb2.FAILED_PRECONDITION,
                        err_msg)
        return MessageToJson(grpc_bad_status)

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

    # Send the gRPC request
    #
    try:
        reply = core_stub.UpdateProblemSchema(req)
    except Exception as ex:
        grpc_bad_status = get_non_server_session_response_error(\
                        core_pb2.FAILED_PRECONDITION,
                        str(ex))
        return MessageToJson(grpc_bad_status)

    # Convert the reply to JSOn and send it on
    #
    return MessageToJson(reply)
"""
python manage.py shell
from tworaven_apps.ta2_interfaces.ta2_proxy import *
updateproblemschema()

start_session()

core_pb2.UpdateProblemSchemaRequest(\
    core_pb2.UpdateProblemSchemaRequest.ReplaceProblemSchemaField(\
        task_type=core_pb2.REGRESSION,
        task_subtype=core_pb2.TASK_SUBTYPE_UNDEFINED,
        task_description='ok there',
        output_type=core_pb2.REAL,
        metric=core_pb2.ROOT_MEAN_SQUARED_ERROR))


m = core_pb2.UpdateProblemSchemaRequest()
ref = m.updates.add()
ref.task_type=core_pb2.REGRESSION
ref = m.updates.add()
ref.task_subtype=core_pb2.TASK_SUBTYPE_UNDEFINED
m.updates


m.updates.extend = [core_pb2.UpdateProblemSchemaRequest.ReplaceProblemSchemaField(\
        task_type=core_pb2.REGRESSION)]
s1 = core_pb2.UpdateProblemSchemaRequest.ReplaceProblemSchemaField(\
        task_type=core_pb2.REGRESSION)
m.updates.add()

#m = core_pb2.UpdateProblemSchemaRequest(\
#        core_pb2.UpdateProblemSchemaRequest.ReplaceProblemSchemaField(\
#        task_type=core_pb2.REGRESSION))

MessageToJson(grpc_bad_status)
"""

"""{
"task_type":"regression",
"task_subtype":"none",
"output_type":"real",
"metric":"rootMeanSquaredError"
}"""
