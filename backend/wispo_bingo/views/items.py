from django.http import JsonResponse
from django.conf import settings
from django.db import transaction

from utils.views import allow_methods, validate_body

from ..models import Item

from is_valid import is_list_of, is_dict_of, is_transformed, is_str, is_int


def item_data():
    return [
        {'id': item.id, 'description': item.description}
        for item in Item.objects.order_by('description')
    ]


@allow_methods('GET')
def items_view(request):
    return JsonResponse(item_data(), safe=False)


@allow_methods('POST')
@validate_body({
    'created': is_list_of(is_str),
    'updated': is_dict_of(is_transformed(int), is_str),
    'deleted': is_list_of(is_int),
})
@transaction.atomic
def items_edit_view(request, data, token):
    if token != settings.WISPO_BINGO_TOKEN:
        return JsonResponse(
            status=403,
            data={
                'code': 'Forbidden',
                'message': 'forbidden',
            },
        )

    Item.objects.filter(id__in=data['deleted']).delete()

    for id, description in data['updated'].items():
        try:
            item = Item.objects.get(id=id)
        except Item.DoesNotExist:
            continue
        item.description = description
        item.save()

    for description in data['created']:
        Item.objects.create(description=description)

    return JsonResponse(item_data(), safe=False)
