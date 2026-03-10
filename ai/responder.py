"""
Responder — Ollama-based intent detection + response generation.

Uses qwen2.5 model via local Ollama for:
1. Intent classification (tax_calculation vs tax_question)
2. Financial entity extraction (for tax_calculation intent)
3. Conversational response generation with RAG context

All tax figures come from the deterministic engine —
the LLM only explains them in natural language.
"""

import ollama
import json
from typing import Dict, Any, List, Optional

from tax_engine.individual_tax import calculate_individual_tax
from tax_engine.regime_compare import compare_regimes

OLLAMA_MODEL = "qwen2.5"


def detect_intent(question: str) -> str:
    """
    Classify user question into: tax_calculation or tax_question.

    Returns:
        One of: "tax_calculation", "tax_question"
    """
    prompt = f"""Classify the user query.

Return ONLY one word.

Possible outputs:
- tax_calculation
- tax_question

User query:
{question}"""

    response = ollama.chat(
        model=OLLAMA_MODEL,
        options={"temperature": 0},
        messages=[{"role": "user", "content": prompt}]
    )

    intent = response["message"]["content"].strip().lower()

    # Normalize — only allow known intents
    if intent not in ("tax_calculation", "tax_question"):
        intent = "tax_question"

    return intent


def extract_financial_entities(
    question: str, context: str
) -> Optional[Dict[str, Any]]:
    """
    Extract income, deductions, and expenses from a user's question.

    Returns:
        Dict with income_sources, deductions, expenses — or None if parsing fails.
    """
    prompt = f"""You are a financial entity extractor.

Identify all financial values in the user query.

Use the context to understand which tax deduction or income category they belong to.

Return JSON.

Fields:
- income_sources
- deductions
- expenses
- taxpayer_type (individual, business, firm)

Example output:

{{
"taxpayer_type": "individual",
"income_sources":[
   {{"type":"salary","amount":1200000}}
],

"deductions":[
   {{"type":"80C","amount":150000,"reason":"PPF investment"}},
   {{"type":"80D","amount":25000,"reason":"health insurance"}}
],

"expenses":[]
}}

Context:
{context}

User query:
{question}"""

    response = ollama.chat(
        model=OLLAMA_MODEL,
        options={"temperature": 0},
        messages=[{"role": "user", "content": prompt}]
    )

    text = response["message"]["content"].strip()

    # Strip markdown fences if present
    if text.startswith("```json"):
        text = text[7:]
    if text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]

    try:
        return json.loads(text.strip())
    except json.JSONDecodeError:
        return None


def run_tax_engine(entities: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Run the deterministic tax engine on extracted entities.

    Returns:
        Dict with engine results including regime comparison, or None if no income found.
    """
    income_sources = entities.get("income_sources", [])
    if not income_sources:
        return None

    income = sum(s.get("amount", 0) for s in income_sources)
    deduction_list = entities.get("deductions", [])
    deductions = sum(d.get("amount", 0) for d in deduction_list)
    taxable_income = max(income - deductions, 0)

    # Individual tax calculation
    tax_result = calculate_individual_tax(taxable_income)

    # Regime comparison
    comparison = compare_regimes(income, deductions)

    return {
        "income": income,
        "deductions": deductions,
        "taxable_income": taxable_income,
        "tax_result": tax_result,
        "regime_comparison": comparison,
    }


def generate_response(
    question: str,
    context: str,
    conversation_history: List[Dict[str, str]],
    engine_output: Optional[Dict[str, Any]] = None,
    user_profile: Optional[Dict[str, Any]] = None,
) -> str:
    """
    Generate a conversational response using Ollama qwen2.5.

    Args:
        question: The user's current question.
        context: RAG context from ChromaDB.
        conversation_history: List of prior {role, content} messages.
        engine_output: Tax engine results (if tax_calculation intent).
        user_profile: User's financial profile summary (if available).

    Returns:
        The AI-generated response string.
    """
    # Build the system + context prompt
    system_msg = "You are TaxGPT, an expert AI assistant specialized in Indian taxation."

    engine_section = ""
    if engine_output:
        engine_section = f"""

Tax Engine Results (AUTHORITATIVE — use these exact figures):
- Income: ₹{engine_output['income']:,.0f}
- Deductions: ₹{engine_output['deductions']:,.0f}
- Taxable Income: ₹{engine_output['taxable_income']:,.0f}
- Tax (base): ₹{engine_output['tax_result']['base_tax']:,.0f}
- Cess: ₹{engine_output['tax_result']['cess']:,.0f}
- Total Tax: ₹{engine_output['tax_result']['total_tax']:,.0f}
- Old Regime Tax: ₹{engine_output['regime_comparison']['old_regime_tax']:,.0f}
- New Regime Tax: ₹{engine_output['regime_comparison']['new_regime_tax']:,.0f}
- Recommended Regime: {engine_output['regime_comparison']['recommended_regime']}
"""

    profile_section = ""
    if user_profile:
        profile_section = f"""

User's Financial Profile:
- Total Income: ₹{user_profile.get('total_income', 0):,.0f}
- Total Deductions: ₹{user_profile.get('total_deductions', 0):,.0f}
- Total TDS: ₹{user_profile.get('total_tds', 0):,.0f}
"""

    user_prompt = f"""Your job:
- Explain tax rules clearly
- Answer conversationally
- Help users understand tax laws
- Use retrieved context when relevant
- IMPORTANT: If tax figures are provided from the Tax Engine, use ONLY those exact figures. Never invent ₹ amounts.

Guidelines:
- Prefer information from the context
- If context is insufficient, say you are unsure
- Speak naturally like a human assistant
- Use Indian rupee notation (₹10,00,000)
- Explain step-by-step if needed

Retrieved context:
{context}
{engine_section}
{profile_section}

User question:
{question}"""

    messages = [{"role": "system", "content": system_msg}]

    # Add conversation history (last N messages for context window)
    for msg in conversation_history[-10:]:
        messages.append({"role": msg["role"], "content": msg["content"]})

    messages.append({"role": "user", "content": user_prompt})

    response = ollama.chat(
        model=OLLAMA_MODEL,
        options={"temperature": 0.2},
        messages=messages
    )

    return response["message"]["content"]
