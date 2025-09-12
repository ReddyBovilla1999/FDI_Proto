# assessment/urls.py

from django.urls import path
from . import views

urlpatterns = [
    # The home page where the user chooses Manual or Automatic
    path('', views.assessment_home, name='assessment_home'),
    
    # Page to choose difficulty
    path('difficulty/', views.difficulty_choice, name='difficulty_choice'),

    # The page for manually creating a question
    path('manual/', views.manual_question_create, name='manual_question'),
    
    # The page that displays the question library
    path('library/', views.question_library, name='question_library'),

    # The page to review selected questions
    path('review/', views.review_selection, name='review_selection'),
    
    # The API endpoint that provides question data as JSON
    path('api/questions/', views.get_questions_api, name='get_questions_api'),

    # API endpoint to create an assessment
    path('api/create_assessment/', views.create_assessment, name='create_assessment'),

    # API endpoint to get assessment by ID
    path('api/assessment/<int:assessment_id>/', views.get_assessment, name='get_assessment'),

    # The page to start the assessment
    path('assessment/start/<int:assessment_id>/', views.assessment_start, name='assessment_start'),

    # API endpoint to get selected questions
    path('api/selected_questions/', views.get_selected_questions, name='get_selected_questions'),
]
