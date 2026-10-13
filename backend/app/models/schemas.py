from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field
from datetime import datetime

# --- User & Auth ---
class UserBase(BaseModel):
    name: str
    email: str = Field(..., pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    role: str = Field(default="student", description="student | editor | admin")
    targetExam: str = "JEE Main"
    preferredLanguage: str = "english"
    avatar: Optional[str] = None

class UserCreate(UserBase):
    password: Optional[str] = None

class UserResponse(UserBase):
    id: str
    createdAt: str

class UserLoginRequest(BaseModel):
    email: str = Field(..., pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    password: str

class DemoLoginRequest(BaseModel):
    role: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# --- Exam Structure ---
class ExamModel(BaseModel):
    id: str
    slug: str
    name: str
    shortCode: str
    category: str
    conductingBody: str
    description: str
    totalPapers: int = 0
    totalQuestions: int = 0
    subjects: List[str] = []

class SubjectModel(BaseModel):
    id: str
    slug: str
    name: str
    code: str
    examId: str
    examName: str
    topicsCount: int = 0
    papersCount: int = 0
    description: str = ""

class TopicModel(BaseModel):
    id: str
    name: str
    subjectId: str
    subjectName: str
    examId: str
    frequencyScore: str = "Medium"
    papersMapped: int = 0
    questionsCount: int = 0

# --- Question Paper ---
class QuestionPaperModel(BaseModel):
    id: str
    slug: str
    title: str
    examId: str
    examName: str
    subjectId: Optional[str] = None
    subjectName: Optional[str] = None
    institution: str = ""
    year: int
    session: str = ""
    paperType: str = "Official Exam"
    durationMinutes: int = 180
    maxMarks: int = 300
    language: str = "English"
    r2ObjectKey: str
    fileSizeBytes: int = 0
    verifiedSolutionAvailable: bool = True
    reviewStatus: str = "published"
    checksum: str = ""
    downloadsCount: int = 0
    viewsCount: int = 0
    createdAt: str

# --- Question & Solutions ---
class QuestionOption(BaseModel):
    key: str
    text: str

class VerifiedSolution(BaseModel):
    finalAnswer: str
    stepByStep: List[str]
    keyConcept: str
    commonMistakes: str = ""

class QuestionModel(BaseModel):
    id: str
    paperId: Optional[str] = None
    paperTitle: Optional[str] = None
    examId: str
    examName: str
    subjectId: str
    subjectName: str
    topicId: str
    topicName: str
    year: int
    questionNumber: int
    questionText: str
    options: List[QuestionOption]
    correctAnswer: str
    marks: float = 4.0
    negativeMarks: float = 1.0
    difficulty: str = "Medium"
    verifiedSolution: VerifiedSolution

class PublicQuestionModel(BaseModel):
    """Sanitized question model without answer key for secure ongoing CBT attempts."""
    id: str
    questionNumber: int
    questionText: str
    options: List[QuestionOption]
    marks: float
    negativeMarks: float
    difficulty: str
    subjectName: str
    topicName: str

# --- Mock Test & Attempts ---
class MockTestModel(BaseModel):
    id: str
    title: str
    examId: str
    examName: str
    subjectName: str
    durationMinutes: int
    totalQuestions: int
    maxMarks: float
    negativeMarkingRatio: float = 0.25
    instructions: List[str] = []
    questionIds: List[str]
    attemptsCount: int = 0
    avgScore: float = 0.0

class AttemptAnswerModel(BaseModel):
    questionId: str
    selectedOption: Optional[str] = None
    timeSpentSeconds: int = 0
    markedForReview: bool = False
    isCorrect: Optional[bool] = None
    scoreAwarded: Optional[float] = None

class TestAttemptModel(BaseModel):
    id: str
    userId: str
    mockTestId: str
    mockTestTitle: str
    examName: str
    startedAt: str
    submittedAt: Optional[str] = None
    status: str = "in_progress"  # in_progress | completed | expired | abandoned
    timeRemainingSeconds: int
    answers: Dict[str, AttemptAnswerModel] = {}
    score: Optional[float] = None
    maxMarks: Optional[float] = None
    accuracyPercentage: Optional[float] = None
    correctCount: Optional[int] = None
    incorrectCount: Optional[int] = None
    unansweredCount: Optional[int] = None
    totalTimeSpentSeconds: Optional[int] = None

# --- Mistakes, Bookmarks, Study Plans ---
class MistakeItemModel(BaseModel):
    id: str
    userId: str
    questionId: str
    questionText: str
    subjectName: str
    topicName: str
    examName: str
    yourAnswer: str
    correctAnswer: str
    status: str = "unresolved"  # unresolved | reviewing | mastered
    studentNotes: str = ""
    sourceType: str = "mock_test"
    recordedAt: str
    lastReviewedAt: Optional[str] = None

class BookmarkModel(BaseModel):
    id: str
    userId: str
    itemType: str  # paper | question
    itemId: str
    title: str
    subtitle: str
    notes: Optional[str] = None
    createdAt: str

class StudyPlanTaskModel(BaseModel):
    id: str
    title: str
    subject: str
    topic: str
    targetQuestions: int
    estimatedMinutes: int
    completed: bool = False
    dueDate: str
    priority: str = "medium"

class StudyPlanModel(BaseModel):
    id: str
    userId: str
    targetExam: str
    examDate: str
    dailyHours: float
    weakTopics: List[str] = []
    totalTasks: int = 0
    completedTasks: int = 0
    tasks: List[StudyPlanTaskModel] = []

class ContentReportModel(BaseModel):
    id: str
    userId: str
    userEmail: str
    entityType: str
    entityId: str
    issueType: str
    description: str
    status: str = "pending"
    createdAt: str

class AuditLogModel(BaseModel):
    id: str
    actorEmail: str
    actorRole: str
    action: str
    entity: str
    details: str
    timestamp: str

class GoogleSheetsSyncStateModel(BaseModel):
    lastSyncedAt: str
    status: str
    syncedRows: int
    sheetName: str
