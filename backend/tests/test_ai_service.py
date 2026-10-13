import pytest
from unittest.mock import patch, AsyncMock
from app.services.ai_service import AIService

def test_ai_prompt_validation():
    """Verify bounds checking on prompts."""
    service = AIService()
    with pytest.raises(ValueError) as exc:
        service.validate_prompt("")
    assert "empty" in str(exc.value)

    oversized = "A" * (service.MAX_PROMPT_CHARS + 10)
    with pytest.raises(ValueError) as exc2:
        service.validate_prompt(oversized)
    assert "exceeds maximum" in str(exc2.value)

@pytest.mark.asyncio
async def test_ai_fallback_to_groq_when_gemini_fails():
    """Verify seamless fallback from Gemini to Groq upon error."""
    service = AIService()
    service.gemini_key = "test_gemini_key"
    service.groq_key = "test_groq_key"
    service.default_provider = "gemini"
    service.fallback_enabled = True

    # Mock _call_gemini_with_retry to raise exception, _call_groq_with_retry to succeed
    with patch.object(service, '_call_gemini_with_retry', side_effect=RuntimeError("Gemini Rate Limit Exceeded")):
        with patch.object(service, '_call_groq_with_retry', return_value="Step-by-step Groq derivation."):
            result = await service.explain_question(
                question_text="Find the derivative of x^2",
                options=[{"key": "A", "text": "2x"}, {"key": "B", "text": "x"}],
                correct_answer="A"
            )
            assert result["provider"] == "groq_fallback"
            assert result["isOfficialVerified"] is False
            assert "Step-by-step Groq derivation." in result["explanation"]
            assert "AI tutor assistance" in result["disclaimer"]

@pytest.mark.asyncio
async def test_ai_both_providers_fail_cleanly():
    """Verify actionable diagnostic message when both providers fail."""
    service = AIService()
    service.gemini_key = "test_gemini_key"
    service.groq_key = "test_groq_key"

    with patch.object(service, '_call_gemini_with_retry', side_effect=RuntimeError("Gemini 500")):
        with patch.object(service, '_call_groq_with_retry', side_effect=RuntimeError("Groq 500")):
            with pytest.raises(RuntimeError) as exc:
                await service.explain_question(
                    question_text="Explain Ohm's Law",
                    options=[],
                    correct_answer="V=IR"
                )
            assert "All AI providers failed" in str(exc.value)
