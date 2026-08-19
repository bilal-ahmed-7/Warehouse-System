from rest_framework.pagination import PageNumberPagination

class DynamicPageNumberPagination(PageNumberPagination):
    """
    Dynamic page number pagination allowing client to specify page and page_size.
    Default page size: 10 items. Max page size: 100 items.
    """
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100
