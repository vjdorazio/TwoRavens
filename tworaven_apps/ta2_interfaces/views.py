import random, string
import json
from django.conf import settings
from django.shortcuts import render
from django.template.loader import render_to_string
from django.http import JsonResponse, HttpResponse, Http404
from django.views.decorators.csrf import csrf_exempt, csrf_protect
from tworaven_apps.ta2_interfaces.ta2_proxy import start_session,\
    update_problem_schema


def get_grpc_test_json(request, grpc_json_file, info_dict={}):
    """Return gRPC JSON response"""
    json_str = render_to_string(grpc_json_file, info_dict)

    return JsonResponse(json.loads(json_str))


def view_grpc_test_links(request):
    """Show an existing list of gRPC related urls"""
    return render(request,
                  'test_responses/grpc_list.html',
                  )



@csrf_exempt
def view_startsession(request):
    """gRPC: Call from UI to start session

    User agent and version id can originate on the server
    """
    if settings.TA2_STATIC_TEST_MODE:     # return hardcoded message
        rnd_session_id = ''.join(random.choice(string.ascii_lowercase + string.digits)
                         for _ in range(7))
        d = dict(session_id=rnd_session_id)
        if random.randint(1,10) == 7:
            return get_grpc_test_json(request, 'test_responses/startsession_badassertion.json')
        else:
            return get_grpc_test_json(request, 'test_responses/startsession_ok.json', d)

    # Let's call the TA2 and start the session!
    json_str = start_session()

    # Convert JSON str to python dict - err catch here
    json_dict = json.loads(json_str)

    return JsonResponse(json_dict, safe=False)



@csrf_exempt
def view_update_problem_schema(request):
    """gRPC: Call from UI to update the problem schema"""

    info = dict(status=dict(\
                code="ok",
                details="update problem schema message ok"))

    #return JsonResponse(info)

    # Let's call the TA2 and start the session!
    json_str = update_problem_schema()

    # Convert JSON str to python dict - err catch here
    json_dict = json.loads(json_str)

    return JsonResponse(json_dict, safe=False)


@csrf_exempt
def view_test_call(request):
    """gRPC: Capture other calls to D3M"""
    if request.POST:
        post_str = str(request.POST)
    else:
        post_str = '(no post)'

    info = dict(status='ok',
                post_str=post_str,
                message='test message to path: %s' % request.path)


    return JsonResponse(info)
