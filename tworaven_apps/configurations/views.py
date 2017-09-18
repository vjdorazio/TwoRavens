"""Views for the D3M configuration module"""
from django.shortcuts import render
from django.http import JsonResponse, HttpResponse, Http404

# Create your views here.
def view_d3m_list(request):
    """List the D3m configurations in the db"""

    return HttpResponse('view_d3m_list')


def view_d3m_details_page(request, d3m_config_id):
    """Show the D3m configuration on a web page"""

    return HttpResponse('view_d3m_details_page: %d' % d3m_config_id)

def view_d3m_details_json(request, d3m_config_id):
    """Return the D3m configuration as JSON"""

    desc = 'placeholder: ' + view_d3m_details_json.__doc__

    tinfo = dict(description=desc,
                 d3m_config_id=d3m_config_id)

    return JsonResponse(tinfo)


def view_d3m_details_json_latest(request, d3m_config_id):
    """Return the "latest" D3m configuration as JSON.
    "latest" may be most recently added or a "default"
    of some kind"""

    desc = 'placeholder: ' + view_d3m_details_json_latest.__doc__

    tinfo = dict(description=desc,
                 d3m_config_id=d3m_config_id)

    return JsonResponse(tinfo)
