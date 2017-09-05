from django.contrib import admin
from tworaven_apps.configurations.models import AppConfiguration,\
    D3MConfiguration

class AppConfigurationAdmin(admin.ModelAdmin):
    save_on_top = True
    search_fields = ('name',)
    list_display = ('name',
                    'is_active',
                    'production',
                    'd3m_mode',
                    'privacy_mode',
                    'rook_app_url',
                    'dataverse_url')
    readonly_fields = ('modified', 'created')
admin.site.register(AppConfiguration, AppConfigurationAdmin)


class D3MConfigurationAdmin(admin.ModelAdmin):
    save_on_top = True
    search_fields = ('name',)
    list_display = ('name',
                    'dataset_schema',
                    'problem_schema',
                    'training_data_root',
                    'modified',
                    'created',)
    readonly_fields = ('modified', 'created')
admin.site.register(D3MConfiguration, D3MConfigurationAdmin)
