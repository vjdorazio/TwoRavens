from datetime import datetime as dt

from django.db import models
from django.template.defaultfilters import slugify

from model_utils.models import TimeStampedModel
from django.db import transaction
from tworaven_apps.utils.js_helper import get_js_boolean
from tworaven_apps.utils.url_helper import add_trailing_slash,\
    remove_trailing_slash

class D3MConfiguration(TimeStampedModel):
    """
    Allow settings of javascript global variables via the database.
    These are used within the index.html template (for now)
    """
    name = models.CharField(max_length=255,
                            help_text='for internal use',
                            unique=True)

    is_default = models.BooleanField(\
                    default=False,
                    help_text='There can be either one default or no defaults')

    dataset_schema = models.TextField(\
                        help_text='Input: Path to the dataset schema')

    problem_schema = models.TextField(\
                        help_text='Input: Path to the problem schema')

    training_data_root = models.TextField(\
                        help_text=('Input: Path to the root directory of the'
                                   ' dataset described by dataset_schema'))

    executables_root = models.TextField(\
                        blank=True,
                        help_text=('Output: Directory in which to write'
                                   ' the Test Executables.'))

    pipeline_logs_root = models.TextField(\
                        blank=True,
                        help_text=('Output: Path at which performers'
                                   ' should write the pipeline list,'
                                   ' output described in Section 4.1.3'))

    temp_storage_root = models.TextField(\
                        blank=True,
                        help_text=('Temporary storage root for performers'
                                   ' to use.'))

    slug = models.SlugField(blank=True,
                            help_text='auto-filled on save')

    def __str__(self):
        return self.name

    @transaction.atomic
    def save(self, *args, **kwargs):
        if not self.name:
            time_now = dt.now().strftime('%Y-%m-%d_%H-%M-%S')
            self.name = 'config_%s' % time_now

        self.slug = slugify(self.name)

        # If this is the default, set everything else to non-default
        if self.is_default:
            D3MConfiguration.objects.filter(\
                            is_default=True\
                            ).update(is_default=False)

        super(D3MConfiguration, self).save(*args, **kwargs)

    class Meta:
        ordering = ('name', '-modified')
        verbose_name = 'D3M Configuration'
        verbose_name_plural = 'D3M Configurations'
