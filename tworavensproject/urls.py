from django.conf.urls import url, include
from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from tworaven_apps.rook_services import views_test

admin.site.site_header = 'TwoRavens Administration'
admin.site.index_title = ('TwoRavens Admin')
admin.site.site_title = ('TwoRavens Admin page')

urlpatterns = [
    url(r'^admin/', admin.site.urls),

    url(r'^rook-custom/', include('tworaven_apps.rook_services.urls')),

    url(r'^data/', include('tworaven_apps.test_data.urls')),

    url(r'^$', views_test.view_webpack_test, name='home'),

] + static(settings.STATIC_URL,
           #document_root=settings.STATIC_ROOT)
           document_root=settings.TEST_DIRECT_STATIC)


"""
if settings.DEBUG:
    import debug_toolbar
    urlpatterns = [
        url(r'^__debug__/', include(debug_toolbar.urls)),
    ] + urlpatterns
"""