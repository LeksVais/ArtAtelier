from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CommentViewSet, ObjectCommentsView

router = DefaultRouter()
router.register(r'comments', CommentViewSet, basename='comment')

comment_urls = [
    path('object/<str:content_type>/<int:object_id>/', ObjectCommentsView.as_view(), name='object-comments'),
    path('<int:pk>/reply/', CommentViewSet.as_view({'post': 'reply'}), name='comment-reply'),
]

urlpatterns = [
    path('', include(router.urls)),
    path('comments/', include(comment_urls)),
]