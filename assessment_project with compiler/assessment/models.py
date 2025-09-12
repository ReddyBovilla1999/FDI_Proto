# assessment/models.py

from django.db import models
import json

class Question(models.Model):
    """
    Represents a single coding question created by a user.
    """
    DIFFICULTY_CHOICES = [
        ('Basic', 'Basic'),
        ('Novice', 'Novice'),
        ('Intermediate', 'Intermediate'),
        ('Advanced', 'Advanced'),
        ('Expert', 'Expert'),
    ]

    DOK_CHOICES = [
        ('Recall & Reproduction', 'Recall & Reproduction'),
        ('Skill & Concept', 'Skill & Concept'),
        ('Strategic Thinking', 'Strategic Thinking'),
        ('Extended Thinking', 'Extended Thinking'),
    ]

    DOMAIN_CHOICES = [
        ('Programming', 'Programming'),
        ('SQL', 'SQL'),
    ]

    # Core question details
    title = models.CharField(max_length=255, help_text="The title of the question.")
    description = models.TextField(help_text="The detailed problem description in HTML format.")
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, help_text="The difficulty level of the question.")
    depth_of_knowledge = models.CharField(max_length=50, choices=DOK_CHOICES, help_text="The Depth of Knowledge (DOK) level.")
    points = models.PositiveIntegerField(default=1, help_text="Points awarded for a correct answer.")
    time_to_answer = models.CharField(max_length=8, help_text="The time allowed to answer in HH:MM:SS format.")
    domain = models.CharField(max_length=50, choices=DOMAIN_CHOICES, default='Programming', help_text="The domain of the question (e.g., Programming, SQL).")

    # Optional fields
    tags = models.CharField(max_length=255, blank=True, null=True, help_text="Comma-separated tags for the question.")
    hint = models.TextField(blank=True, null=True, help_text="An optional hint for the question.")
    instructions = models.TextField(blank=True, null=True, help_text="Specific instructions for the candidate.")

    # Boolean flags for question settings
    available_in_interview = models.BooleanField(default=False, help_text="Is this question available in the interview area?")
    enable_watermark = models.BooleanField(default=True, help_text="Should a watermark be enabled for this question?")
    deliver_fullscreen = models.BooleanField(default=False, help_text="Should the question be delivered in full screen?")

    # Topics and creation timestamp
    selected_topics = models.TextField(blank=True, null=True, help_text="JSON-encoded list of selected topics.")
    created_at = models.DateTimeField(auto_now_add=True)

    # ** NEW FIELDS TO STORE LANGUAGE AND CODE STUB DATA **
    allowed_languages = models.TextField(blank=True, null=True, help_text="JSON-encoded list of allowed languages.")
    code_stubs = models.TextField(blank=True, null=True, help_text="JSON-encoded dictionary of code stubs for each language.")


    def __str__(self):
        return self.title

class TestCase(models.Model):
    """
    Represents a test case associated with a Question.
    """
    CATEGORY_CHOICES = [
        ('Basic cases', 'Basic Cases'),
        ('Boundary cases', 'Boundary Cases'),
        ('Dependent cases', 'Dependent Cases'),
        ('Functional cases', 'Functional Cases'),
    ]

    question = models.ForeignKey(Question, related_name='test_cases', on_delete=models.CASCADE)
    description = models.CharField(max_length=255, blank=True, null=True, help_text="A brief description of the test case.")
    input_data = models.TextField(help_text="The input data for the test case.")
    output_data = models.TextField(help_text="The expected output for the test case.")
    categories = models.CharField(max_length=50, choices=CATEGORY_CHOICES, blank=True, null=True, help_text="The category of the test case.")
    weightage = models.FloatField(blank=True, null=True, help_text="The weightage or score for this test case.")

    def __str__(self):
        return f"Test case for {self.question.title}"

class Assessment(models.Model):
    """
    Represents an assessment consisting of multiple questions.
    """
    questions = models.ManyToManyField(Question, related_name='assessments')
    timer = models.IntegerField(default=3600, help_text="Timer duration in seconds.")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Assessment created at {self.created_at}"


