# assessment/views.py

import json
from django.urls import reverse
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Question, TestCase, Assessment

def assessment_home(request):
    """
    Renders the initial assessment creation choice page.
    """
    return render(request, 'Coding_Assessment.html')

def difficulty_choice(request):
    """
    Renders the page for selecting the difficulty level.
    """
    return render(request, 'Difficulty_levels.html')

def review_selection(request):
    """
    Renders the final review page for the selected questions.
    """
    return render(request, 'Review_Page.html')


@csrf_exempt
def manual_question_create(request):
    """
    Handles both rendering the manual question creation form and processing
    the POST request to save a new question.
    """
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            difficulty = data.get('difficulty') 

            tags = data.get('tags', '')
            selected_topics = data.get('selected_topics', [])
            if selected_topics:
                topics_str = ', '.join(selected_topics)
                tags = f"{tags}, {topics_str}" if tags else topics_str
            
            # --- FIX: Domain is now always 'Tech'. The language is stored in allowed_languages ---
            selected_languages = data.get('selected_languages', [])
            domain = 'Tech' # Default domain is always Tech now

            question = Question.objects.create(
                title=data.get('title'),
                description=data.get('description'),
                difficulty=difficulty,
                depth_of_knowledge=data.get('depth_of_knowledge'),
                points=data.get('points'),
                time_to_answer=data.get('time_to_answer'),
                domain=domain, # Use the fixed 'Tech' domain
                tags=tags,
                hint=data.get('hint'),
                instructions=data.get('instructions'),
                available_in_interview=data.get('available_in_interview', False),
                enable_watermark=data.get('enable_watermark', True),
                deliver_fullscreen=data.get('deliver_fullscreen', False),
                allowed_languages=json.dumps(selected_languages) 
            )

            test_cases_data = data.get('test_cases', [])
            for tc_data in test_cases_data:
                TestCase.objects.create(
                    question=question,
                    description=tc_data.get('description'),
                    input_data=tc_data.get('input_data'),
                    output_data=tc_data.get('output_data'),
                    categories=tc_data.get('categories'),
                    weightage=tc_data.get('weightage')
                )
            
            # Simplified redirect logic
            # This makes the flow more robust. The user will be sent to the library
            # where their new question will appear at the top.
            redirect_level = ''
            # FIX: Added 'Beginner' to the condition to ensure correct redirect
            if difficulty in ['Basic', 'Novice', 'Beginner']:
                redirect_level = 'beginner'
            elif difficulty == 'Intermediate':
                redirect_level = 'intermediate'
            elif difficulty in ['Advanced', 'Expert']:
                redirect_level = 'advanced'
            
            # Use Django's reverse to build the URL safely
            redirect_url = f"{reverse('question_library')}?level={redirect_level}"
            
            return JsonResponse({'status': 'success', 'message': 'Question saved successfully!', 'redirect_url': redirect_url})

        except Exception as e:
            # Log the full error for debugging
            print(f"Error saving question: {e}") 
            return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

    return render(request, 'Question_Coding.html')


def question_library(request):
    """
    Renders the question library page. Data is fetched by a separate API call.
    """
    return render(request, 'Question_Library.html')

def get_questions_api(request):
    """
    API endpoint to fetch questions, filterable by difficulty level.
    If no level is specified, it returns all questions.
    """
    level = request.GET.get('level', None)
    
    # Start with all questions
    questions = Question.objects.all()

    # Filter by difficulty level ONLY if a level is provided
    if level and level != 'all':
        if level == 'beginner':
            # FIX: Added 'Beginner' to the filter list to include these questions
            questions = questions.filter(difficulty__in=['Basic', 'Novice', 'Beginner'])
        elif level == 'intermediate':
            # FIX: Intermediate now includes both 'Intermediate' and 'Expert' levels
            questions = questions.filter(difficulty__in=['Intermediate', 'Expert'])
        elif level == 'advanced':
            # FIX: Advanced now only includes the 'Advanced' level
            questions = questions.filter(difficulty='Advanced')
    
    # Order by creation date to show the newest questions first
    questions = questions.order_by('-created_at')
    
    questions_list = []
    for q in questions:
        # --- FIX: Robustly determine question type from 'allowed_languages' ---
        question_type = 'Programming'  # Default to Programming
        raw_languages = q.allowed_languages

        if raw_languages:
            is_sql = False
            try:
                # Attempt to parse as JSON (handles formats like ["sql", "python"])
                langs_list = json.loads(raw_languages)
                if isinstance(langs_list, list):
                    # Check if 'sql' exists in the list, case-insensitively
                    if any(str(lang).lower() == 'sql' for lang in langs_list):
                        is_sql = True
            except (json.JSONDecodeError, TypeError):
                # If JSON parsing fails, treat it as a plain string (handles legacy "SQL" or "Python")
                if isinstance(raw_languages, str):
                    if raw_languages.lower() == 'sql':
                        is_sql = True
            
            if is_sql:
                question_type = 'SQL'

        # Safely get the parsed languages list for the response, or an empty list
        try:
            allowed_languages = json.loads(q.allowed_languages) if q.allowed_languages and q.allowed_languages.strip().startswith('[') else [q.allowed_languages] if q.allowed_languages else []
        except (json.JSONDecodeError, TypeError):
             allowed_languages = [q.allowed_languages] if q.allowed_languages else []


        questions_list.append({
            'id': q.id,
            'title': q.title,
            'description': q.description,
            'difficulty': q.difficulty,
            'points': q.points,
            'time_to_answer': q.time_to_answer,
            'hint': q.hint,
            'domain': question_type, # This key tells the frontend how to categorize the question
            'allowed_languages': allowed_languages, 
            'test_cases': list(q.test_cases.all().values('description', 'input_data', 'output_data', 'categories', 'weightage'))
        })
            
    return JsonResponse({'questions': questions_list})


@csrf_exempt
def create_assessment(request):
    """
    POST: { "question_ids": [1,2,3], "timer": 3600 }
    Returns: { "assessment_id": 123 }
    """
    if request.method == "POST":
        data = json.loads(request.body)
        question_ids = data.get("question_ids", [])
        timer = data.get("timer", 3600)
        assessment = Assessment.objects.create(timer=timer)
        assessment.questions.set(Question.objects.filter(id__in=question_ids))
        assessment.save()
        return JsonResponse({"assessment_id": assessment.id})

def get_assessment(request, assessment_id):
    """
    GET: Returns assessment details for candidate.
    """
    try:
        assessment = Assessment.objects.get(id=assessment_id)
        questions = []
        for q in assessment.questions.all():
            questions.append({
                "id": q.id,
                "title": q.title,
                "description": q.description,
                "hint": getattr(q, "hint", ""),
                "test_cases": [
                    {
                        "input_data": tc.input_data,
                        "output_data": tc.output_data
                    }
                    for tc in q.test_cases.all()
                ]
            })
        return JsonResponse({
            "timer": assessment.timer,
            "questions": questions
        })
    except Assessment.DoesNotExist:
        return JsonResponse({"error": "Assessment not found"}, status=404)

def assessment_start(request, assessment_id):
    """
    Renders the candidate's assessment page (compiler) for a given assessment_id.
    """
    return render(request, 'compiler.html', {'assessment_id': assessment_id})

def sample_assessment_request():
    """
    Returns a sample assessment request payload.
    """
    return {
      "timer": 1200,
      "questions": [
        {
          "title": "Reverse Words in String",
          "description": "Given a string, ...",
          "hint": "Try splitting the string.",
          "test_cases": [
            {"input_data": "abc def", "output_data": "def abc"}
          ]
        }
      ]
    }

from django.http import JsonResponse
from .models import Question

def get_selected_questions(request):
    """
    API endpoint to fetch questions by a list of IDs.
    Example: /api/selected_questions/?ids=1,2,3
    """
    ids = request.GET.get('ids', '')
    id_list = [int(i) for i in ids.split(',') if i.isdigit()]
    questions = Question.objects.filter(id__in=id_list)
    data = []
    for q in questions:
        data.append({
            "id": q.id,
            "title": q.title,
            "difficulty": q.difficulty,
            "time_to_answer": q.time_to_answer,
            "points": q.points,
            # Add other fields as needed
        })
    return JsonResponse({"questions": data})



