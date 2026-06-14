import os
import json
import logging
import random
import time
import warnings
with warnings.catch_warnings():
    warnings.simplefilter("ignore", category=FutureWarning)
    import google.generativeai as genai
from dotenv import dotenv_values

logger = logging.getLogger(__name__)

# We use gemini-flash-lite-latest to avoid strict 20 RPD limits
MODEL_NAME = "gemini-flash-lite-latest"

# Resolve the .env path relative to this file's location
_ENV_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), '.env')

def _get_api_key() -> str:
    """Read GEMINI_API_KEY fresh from .env on every call so restarts aren't needed."""
    try:
        vals = dotenv_values(_ENV_PATH)
        key = (vals.get("GEMINI_API_KEY") or "").strip().strip('"').strip("'")
        if key and key != "your_api_key_here":
            return key
    except Exception:
        pass
    
    key = os.environ.get("GEMINI_API_KEY", "").strip().strip('"').strip("'")
    return key

def _generate_json_with_debug(prompt: str):
    """Helper to generate a JSON response from Gemini and return debug info."""
    api_key = _get_api_key()
    start_time = time.time()
    
    debug_info = {
        "endpoint": "generativelanguage.googleapis.com",
        "model": MODEL_NAME,
        "request_payload": prompt,
        "raw_response": None,
        "token_usage": None,
        "response_time_ms": 0,
        "error": None,
        "statusCode": None
    }
    
    if not api_key or api_key == "your_api_key_here":
        debug_info["error"] = "GEMINI_API_KEY_NOT_FOUND"
        debug_info["statusCode"] = 401
        logger.error(f"[Gemini Debug] Error: {debug_info['error']}")
        return None, debug_info
    
    logger.info(f"[Gemini] Calling API with key ending in ...{api_key[-6:]}")
    
    try:
        logger.info(f"[Gemini Debug] Request URL: {debug_info['endpoint']}")
        logger.info(f"[Gemini Debug] Model: {debug_info['model']}")
        logger.info(f"[Gemini Debug] Payload: {prompt}")

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(
            MODEL_NAME,
            generation_config={"response_mime_type": "application/json"}
        )
        
        response = model.generate_content(
            contents=prompt,
        )
        
        debug_info["response_time_ms"] = int((time.time() - start_time) * 1000)
        debug_info["raw_response"] = response.text
        debug_info["statusCode"] = 200
        
        if hasattr(response, 'usage_metadata') and response.usage_metadata:
            debug_info["token_usage"] = {
                "prompt_tokens": getattr(response.usage_metadata, 'prompt_token_count', 0),
                "completion_tokens": getattr(response.usage_metadata, 'candidates_token_count', 0),
                "total_tokens": getattr(response.usage_metadata, 'total_token_count', 0)
            }
        
        logger.info(f"[Gemini Debug] Response Time: {debug_info['response_time_ms']}ms")
        logger.info(f"[Gemini Debug] Token Usage: {debug_info['token_usage']}")
        logger.info(f"[Gemini Debug] Response Body: {debug_info['raw_response']}")
        
        result = json.loads(debug_info["raw_response"])
        return result, debug_info
    except Exception as e:
        debug_info["response_time_ms"] = int((time.time() - start_time) * 1000)
        
        # Try to extract detailed error if it's from the API client
        if hasattr(e, 'code'):
            debug_info["statusCode"] = getattr(e, 'code', 500)
        
        if hasattr(e, 'message'):
            debug_info["error"] = str(e.message)
        else:
            debug_info["error"] = str(e)
            
        # Fallback string matching for common errors
        if "quota" in debug_info["error"].lower() or "429" in str(debug_info["statusCode"]):
            debug_info["error"] = "Rate Limit Exceeded"
        elif "not found" in debug_info["error"].lower():
            debug_info["error"] = "Model Not Found"
        elif "api key" in debug_info["error"].lower() or "400" in str(debug_info["statusCode"]) and "API_KEY_INVALID" in debug_info["error"]:
            debug_info["error"] = "Invalid API Key"
            
        logger.error(f"[Gemini Debug] Error: {debug_info['error']} | Status: {debug_info.get('statusCode')}")
        return None, debug_info

def _generate_json(prompt: str) -> dict:
    """Helper to generate a JSON response from Grok. Reads API key fresh each call."""
    res, _ = _generate_json_with_debug(prompt)
    return res

def analyze_customer(customer_data: dict) -> dict:
    """
    Analyze a specific customer and provide full campaign copilot output.
    """
    prompt = f"""
    Analyze this customer.
    
    Provide:
    1. Churn Risk (0-100)
    2. Customer Health
    3. Reasons
    4. Recommended Action
    5. Personalized Message
    6. Best Channel
    7. Expected Campaign Outcome

    Return JSON only with this exact structure:
    {{
      "churnScore": 37,
      "customerHealth": "Medium",
      "reason": "...",
      "recommendedAction": "...",
      "bestChannel": "WhatsApp",
      "message": "...",
      "expectedOpenRate": "42%",
      "expectedConversion": "6%"
    }}
    
    Data:
    {json.dumps(customer_data, indent=2)}
    """
    res, debug = _generate_json_with_debug(prompt)
    if not res:
        # Fallback Python calculation
        logger.warning(f"[Copilot] Gemini failed ({debug.get('error')}), using python fallback.")
        c = customer_data.get("customer", {})
        oh = customer_data.get("order_history", {})
        eng = customer_data.get("engagement", {})
        
        last_purchase_days = oh.get("last_purchase_days", 90)
        total_orders = oh.get("order_count", 0)
        total_spend = oh.get("total_spend", 0.0)
        
        emails_sent = eng.get("emails_sent", 0)
        emails_opened = eng.get("emails_opened", 0)
        open_rate = (emails_opened / emails_sent * 100) if emails_sent > 0 else 0
        
        churnScore = 20
        if last_purchase_days > 45: churnScore = 60
        if last_purchase_days > 90: churnScore = 85
        if total_orders == 1 and total_spend < 1000: churnScore += 15
        if open_rate < 10: churnScore += 10
        churnScore = min(100, max(0, churnScore))
        
        health = "High" if churnScore < 30 else ("Medium" if churnScore < 70 else "Low")
        
        return {
            "churnScore": churnScore,
            "customerHealth": health,
            "reason": f"Fallback calculation: Customer last purchased {last_purchase_days} days ago. Open rate is {open_rate:.1f}%.",
            "recommendedAction": "Send a re-engagement offer with a 20% discount." if churnScore > 50 else "Send VIP loyalty reward.",
            "bestChannel": "Email",
            "message": f"Hi {c.get('name', 'there')}, we miss you! Here is a special offer just for you.",
            "expectedOpenRate": "25%",
            "expectedConversion": "5%",
            "debug": debug,
            "error": None
        }
        
    res["debug"] = debug
    return res

def analyze_churn(customer_data: dict) -> dict:
    """
    Analyze customer data for churn risk using strict calibrated scoring rules.
    """
    c = customer_data.get("customer", {})
    prompt = f"""
    You are a CRM churn prediction engine. Analyze this customer profile and assign a REALISTIC churn risk score.

    Customer Data:
    {json.dumps(c, indent=2)}

    === SCORING RULES (FOLLOW STRICTLY) ===

    RECENCY (Days Since Last Purchase) - most important factor:
      0-7 days:   score 0-10 (very recent, almost no churn risk)
      8-20 days:  score 11-25
      21-45 days: score 26-50 (moderate risk)
      46-90 days: score 51-75 (high risk - customer likely churning)
      90+ days:   score 76-100 (very high risk - probably already churned)

    FREQUENCY (totalOrders):
      10+ orders: loyal customer, reduce score by 15
      5-9 orders: reduce score by 8
      2-4 orders: no adjustment
      1 order:    increase score by 15 (one-time buyer, high churn risk)

    MONETARY (totalSpend):
      >10000: reduce score by 10
      2000-9999: no adjustment
      <2000: increase score by 10

    ENGAGEMENT (openRate + clickRate):
      openRate>30 and clickRate>10: reduce score by 10
      openRate<10 and clickRate<5:  increase score by 10
      openRate=0 and clickRate=0:   increase score by 20 (fully disengaged)

    === CLASSIFICATION ===
    churnScore 0-30:   riskCategory = "Low"
    churnScore 31-70:  riskCategory = "Medium"
    churnScore 71-100: riskCategory = "High"

    === CRITICAL RULES ===
    - NEVER default everything to Low Risk.
    - If lastPurchaseDays >= 45, the score MUST be at least 51 (Medium or High).
    - If lastPurchaseDays >= 90, the score MUST be at least 71 (High).
    - If totalOrders == 1 AND totalSpend < 2000, score MUST be at least 60.
    - Apply these rules mechanically before making any creative judgments.

    Return ONLY valid JSON, no markdown, no explanation:
    {{
      "churnScore": <integer 0-100>,
      "riskCategory": "Low" | "Medium" | "High",
      "probability": "<churnScore>%",
      "reason": "<Specific explanation referencing lastPurchaseDays, totalOrders, totalSpend, openRate, clickRate>",
      "recommendation": "<Specific retention action tailored to this customer's risk profile>"
    }}
    """
    res, debug = _generate_json_with_debug(prompt)
    if not res:
        # Fallback Python calculation
        logger.warning(f"[Churn] Gemini failed ({debug.get('error')}), using python fallback.")
        c = customer_data.get("customer", {})
        oh = customer_data.get("order_history", {})
        eng = customer_data.get("engagement", {})
        
        last_purchase_days = oh.get("last_purchase_days", 90)
        total_orders = oh.get("order_count", 0)
        total_spend = oh.get("total_spend", 0.0)
        
        emails_sent = eng.get("emails_sent", 0)
        emails_opened = eng.get("emails_opened", 0)
        open_rate = (emails_opened / emails_sent * 100) if emails_sent > 0 else 0
        
        churnScore = 20
        if last_purchase_days > 45: churnScore = 60
        if last_purchase_days > 90: churnScore = 85
        if total_orders == 1 and total_spend < 1000: churnScore += 15
        if open_rate < 10: churnScore += 10
        churnScore = min(100, max(0, churnScore))
        
        cat = "High" if churnScore > 70 else ("Medium" if churnScore > 30 else "Low")
        return {
            "churnScore": churnScore,
            "riskCategory": cat,
            "probability": f"{churnScore}%",
            "reason": f"Fallback: Last purchase {last_purchase_days} days ago. Open rate {open_rate:.1f}%.",
            "recommendation": "Send personalized win-back offer." if churnScore > 50 else "Maintain engagement.",
            "debug": debug,
            "error": None
        }

    res["debug"] = debug
    return res

def generate_customer_intelligence(customer_data: dict) -> dict:
    """
    Generate comprehensive AI intelligence for a customer, strictly without fallback data.
    """
    prompt = f"""
    Analyze this customer and return JSON:

    {{
      "predictedLTV": number,
      "riskScore": number,
      "riskLevel": "Low|Medium|High",
      "reason": string,
      "recommendedAction": string,
      "bestChannel": string,
      "nextBestOffer": string,
      "confidence": number
    }}

    Use actual customer behavior.
    Do not invent facts.
    Base predictions only on supplied customer data.

    Data:
    {json.dumps(customer_data, indent=2)}
    """
    res, debug = _generate_json_with_debug(prompt)
    if not res:
        logger.error(f"[CustomerIntelligence] Gemini failed: {debug.get('error')}")
        raise Exception(f"AI Analysis Failed: {debug.get('error')}")
    
    res["debug"] = debug
    return res

def generate_segments(customer_dataset: list, prompt_text: str = None) -> dict:
    """
    Generate customer segments using real logic rules parsed by Gemini.
    """
    prompt = f"""
    You are an AI Audience Generator for a CRM.
    Your job is to translate the user's natural language request into strict filtering rules.
    We will use these rules to query the SQL database.

    User Request: {prompt_text or 'Create a generic engaged customer segment.'}
    
    Available fields to filter on:
    - city (string)
    - total_spend (number)
    - order_count (number)
    - days_since_last_purchase (number)
    
    Return EXACTLY ONE segment in the following JSON structure:
    {{
       "segments": [
          {{
            "name": "Segment Name",
            "description": "...",
            "reason": "...",
            "recommendedCampaign": "...",
            "recommendedOffer": "...",
            "confidence": 95,
            "rules": [
              {{
                "field": "city",
                "operator": "equals",
                "value": "Delhi"
              }},
              {{
                "field": "days_since_last_purchase",
                "operator": ">",
                "value": 60
              }}
            ]
          }}
       ]
    }}
    
    Allowed operators: "equals", "contains", ">", "<", ">=", "<="
    """
    res, debug = _generate_json_with_debug(prompt)
    if not res:
        logger.error(f"[AudienceGenerator] Gemini failed: {debug.get('error')}")
        raise Exception(f"AI Analysis Failed: {debug.get('error')}")
    
    res["debug"] = debug
    return res

def analyze_opportunities(customer_data: dict) -> dict:
    """
    Analyze opportunities from DB aggregations to find recovery segments using Gemini.
    """
    prompt = f"""
    You are an AI CRM expert. Look at the current customer aggregated metrics:
    {json.dumps(customer_data, indent=2)}

    Identify the best opportunity segment to target.
    
    Return exactly this JSON structure:
    {{
      "segmentName": "string",
      "reason": "string",
      "estimatedAudience": number,
      "estimatedRecovery": number,
      "confidence": number,
      "rules": [
        {{
           "field": "churn_risk_category",
           "operator": "equals",
           "value": "High"
        }}
      ]
    }}
    
    Do NOT invent data out of nowhere. Base your predictions strictly on the aggregate numbers provided.
    Ensure the `rules` array contains valid filtering logic to isolate the target customers. Allowed fields: city, total_spend, order_count, days_since_last_purchase, churn_risk_category.
    
    IMPORTANT: The `existing_segments` key in the data summary contains names of segments that have ALREADY been created. You MUST suggest a totally NEW and UNIQUE opportunity segment that does not overlap conceptually with these existing ones.
    """
    res, debug = _generate_json_with_debug(prompt)
    if not res:
        logger.error(f"[Opportunities] Gemini failed: {debug.get('error')}")
        raise Exception(f"AI Analysis Failed: {debug.get('error')}")
    
    res["debug"] = debug
    return res

def generate_campaign(customer_data: dict, objective: str = "") -> dict:
    """
    Generate campaign recommendations.
    """
    prompt = f"""
    Generate a highly targeted and completely novel marketing campaign opportunity based on actual customer data.
    Objective: {objective}
    
    CRM Summary Data:
    {json.dumps(customer_data, indent=2)}
    
    IMPORTANT CRITERIA:
    1. The 'existing_campaigns' key contains names of campaigns already launched. You MUST suggest a totally NEW campaign that does not overlap conceptually or by name.
    2. Instead of a generic "High Risk" blast, try to find a niche (e.g. "Dormant users", "High Value At Risk", "Loyal customers").
    
    Return JSON with the following structure:
    {{
      "campaign_name": string,
      "objective": string,
      "target_audience": string,
      "recommended_channel": string,
      "subject_line": string,
      "message_content": string,
      "expected_revenue": integer,
      "confidence": float (between 0 and 1),
      "rules": [
        {{ "field": "churn_risk_score", "operator": ">=", "value": 70 }}
      ]
    }}
    Make sure the 'rules' array targets the customers you intend to reach. Allowed fields: churn_risk_score, total_spend, days_since_active. Operators: >=, <=, ==.
    """
    return _generate_json(prompt)

def generate_journey(user_prompt: str, customer_data: dict = None) -> dict:
    """
    Generate a customer journey workflow.
    """
    prompt = f"""
    Create a highly targeted and dynamically generated marketing journey workflow based on the following request:
    "{user_prompt}"
    
    CRM Data Context:
    {json.dumps(customer_data, indent=2) if customer_data else "{}"}

    Based on the request and the data, you must:
    1. Define the target audience with strict filtering rules. Allowed fields for rules: city, total_spend, order_count, days_since_last_purchase, churn_risk_category. Operators: equals, contains, >, <, >=, <=, Not equals.
    2. Define the flow steps (messages and channels).
    3. Predict the expected revenue and provide a confidence score.
    4. Generate the ReactFlow graph nodes and edges.

    Return JSON with exactly this structure:
    {{
      "journeyName": "string",
      "rules": [
         {{ "field": "days_since_last_purchase", "operator": ">=", "value": 60 }}
      ],
      "steps": [
         {{ "day": 0, "channel": "Email", "message": "string" }}
      ],
      "expectedRevenue": integer,
      "confidence": integer (0-100),
      "nodes": [
         {{
           "id": "string",
           "type": "trigger",
           "position": {{ "x": 300, "y": 50 }},
           "data": {{ 
              "label": "string",
              "type": "string (optional subtype)"
           }}
         }}
      ],
      "edges": [
         {{
           "id": "string",
           "source": "string",
           "target": "string",
           "type": "smoothstep",
           "animated": true,
           "sourceHandle": "string (optional)"
         }}
      ]
    }}
    
    Ensure logical progression from a single trigger down to an end node. Spread nodes out horizontally or vertically (e.g., y increments by 100).
    """
    return _generate_json(prompt)

def predict_revenue(historical_data: dict) -> dict:
    """
    Predict next 30 day revenue and explain reasoning.
    """
    prompt = f"""
    Predict next 30 day revenue and explain reasoning based on:
    {json.dumps(historical_data, indent=2)}
    
    Return JSON with the following structure:
    {{
      "expected_revenue": integer,
      "confidence": integer (0-100),
      "expected_growth": float,
      "chart_data": [
         {{ "name": "Jan", "actual": integer or null, "forecast": integer or null }},
         ...
      ]
    }}
    NOTE: The chart_data should contain 12 months. The historical data should be populated in 'actual', and the next 3 months should be populated in 'forecast'.
    """
    return _generate_json(prompt)

def generate_business_insights(data_summary: dict) -> dict:
    """
    Generate overall CRM business insights for the AI Command Center.
    """
    prompt = f"""
    You are an expert CRM AI analyst. Review this database summary:
    {json.dumps(data_summary, indent=2)}

    Generate a compelling Command Center payload with exactly this JSON structure:
    {{
      "executive_summary": {{
         "revenue_trend": "String",
         "channel_insight": "String",
         "churn_prediction": "String",
         "recoverable_revenue": integer,
         "recommended_action": "String"
      }},
      "churn_risk": {{
         "title": "String",
         "recommended_action": "String",
         "expected_recovery": integer,
         "count": {data_summary.get('high_risk_customers_count', 0)}
      }},
      "ai_alerts": [
         {{ "priority": "high", "text": "String" }}
      ],
      "recommendations": [
         {{ "title": "String", "desc": "String", "priority": "Critical | High | Medium" }}
      ],
      "ai_opportunities_found": 3,
      "high_risk_customers": {data_summary.get('high_risk_customers_count', 0)},
      "revenue_opportunity": 500000,
      "campaign_suggestions": 5,
      "greeting": "A welcoming, dynamic greeting referencing the data...",
      "insights_feed": [
         {{
           "title": "String (e.g. High Churn Risk)",
           "content": "String (detailed explanation)",
           "metrics": {{
              "Metric Name": "String value"
           }},
           "actions": ["Create Segment", "Draft Email", "Launch Campaign"]
         }}
      ],
      "recommendation_cards": [
         {{
            "icon": "fire" | "chart" | "message" | "target",
            "title": "String",
            "audience_size": "String",
            "opportunity": 100000,
            "subtitle": "String",
            "action": "String"
         }}
      ]
    }}
    
    Make the insights unique, specific to the provided data, and highly actionable. Include 2-3 insights and 3-4 recommendation cards. Do not use generic placeholders.
    """
    res, debug = _generate_json_with_debug(prompt)
    if not res:
        logger.error(f"[BusinessInsights] Gemini failed: {{debug.get('error') if debug else 'Unknown error'}}")
        raise Exception("AI Analysis Failed")
    res["debug"] = debug
    return res

def chat_with_data(user_message: str, data_summary: dict, history: list = None) -> dict:
    """
    Process user chat message against CRM data context.
    """
    history_str = ""
    if history:
        history_str = "Recent Conversation History:\n" + "\n".join([f"{m.get('role', 'unknown').upper()}: {m.get('content', '')}" for m in history])
        
    prompt = f"""
    You are an AI CRM assistant. A user is talking to you via the AI Command Center chat.
    
    Current CRM Data Context:
    {json.dumps(data_summary, indent=2)}
    
    {history_str}
    
    User message: "{user_message}"
    
    Respond thoughtfully using the data available. If the user is asking to create a campaign right after creating a segment, you MUST use the exact same `rules_json` for the campaign target audience as the segment they just created. If they ask about segments, VIPs, churn, or campaigns, invent a highly plausible response that aligns with the numbers.
    
    CRITICAL RULE FOR CONVERSATIONAL TEXT: 
    When creating a segment or a campaign, NEVER state the exact number of customers in your conversational `content` response (e.g., do NOT say "for your 12 customers"). The backend will dynamically calculate the true number and append it to your message. Use generic phrases like "the matching customers" or "this audience" instead.
    
    CRITICAL: If the user explicitly asks to CREATE or SAVE a segment, add a `create_segment` object.
    If the user explicitly asks to CREATE or GENERATE a campaign, add a `create_campaign_opportunity` object.
    
    IMPORTANT RULES FOR `rules_json`:
    The `field` MUST be exactly one of the following strings (do NOT invent fields):
    - "city" (operator: "equals", "contains", "Not equals")
    - "total_spend" (operator: ">=", "<=", "equals")
    - "order_count" (operator: ">=", "<=", "equals")
    - "days_since_last_purchase" (operator: ">=", "<=")
    - "churn_risk_score" (operator: ">=", "<=")
    - "churn_risk_category" (operator: "equals", "Not equals" with values like "Low", "Medium", "High")
    
    Return ONLY JSON:
    {{
       "content": "String (your conversational response)",
       "metrics": {{ "Optional Key": "Optional Value" }},
       "actions": ["Action 1", "Action 2"],
       "create_segment": {{
           "name": "String",
           "description": "String",
           "rules_json": [ {{ "field": "churn_risk_score", "operator": ">=", "value": 70 }} ]
       }},
       "create_campaign_opportunity": {{
           "campaign_name": "String",
           "objective": "String",
           "target_audience": "String",
           "recommended_channel": "Email",
           "subject_line": "String",
           "message_content": "String",
           "expected_revenue": 1000,
           "rules_json": [ {{ "field": "total_spend", "operator": ">", "value": 1000 }} ]
       }}
    }}
    (Omit `create_segment` or `create_campaign_opportunity` if not requested)
    """
    res, debug = _generate_json_with_debug(prompt)
    if not res:
        return {
            "content": "Sorry, I had trouble analyzing that data right now.",
            "metrics": {},
            "actions": []
        }
    return res

def generate_email_template(prompt: str):
    """Generates a complete email template structure via Gemini."""
    system_prompt = f"""
    You are an expert enterprise email marketing designer.
    The user wants an email template for: {prompt}.
    Return a strictly formatted JSON object matching this schema:
    {{
        "name": "Template Name",
        "category": "e.g., VIP, Newsletter, Win Back, Promotional",
        "subject_line": "Catchy email subject line",
        "preheader": "Short preview text for the inbox",
        "headline": "Main Email Headline",
        "subheadline": "Secondary text",
        "cta": "Call to action button text",
        "sections": [
            {{
                "type": "text|image|button|spacer|divider|coupon|products",
                "content": "Content of the section. (See instructions below for images)"
            }}
        ]
    }}
    Make the sections rich and realistic. 
    Include at least 1 coupon block, 1 image block, 1 text block, and 1 button block in a recommended layout.
    
    CRITICAL RULE FOR IMAGES: For any 'image' block, the 'content' MUST be a URL that generates an AI image based on the context. 
    Use this exact format: https://image.pollinations.ai/prompt/YOUR_DESCRIPTIVE_PROMPT_HERE?width=800&height=400&nologo=true
    (Replace YOUR_DESCRIPTIVE_PROMPT_HERE with a url-encoded, very detailed description of what the image should show, e.g., 'a_beautiful_summer_dress_on_hanger' or 'a_luxury_gift_box_with_gold_ribbon')
    
    Use personalization tokens like {{firstName}}, {{lastOrderDate}}, {{discountCode}}, {{city}}, {{recommendedProduct}} where appropriate.
    """
    try:
        result, _ = _generate_json_with_debug(system_prompt)
        return result
    except Exception as e:
        logger.error(f"Error generating template: {e}")
        return None

def rewrite_template_block(content: str, instructions: str, tone: str = "Professional"):
    """Rewrites a specific block of text based on instructions and tone."""
    system_prompt = f"""
    You are an expert enterprise copywriter.
    Rewrite the following text based on these instructions: '{instructions}'.
    The tone MUST be: {tone}.
    
    Text to rewrite:
    "{content}"
    
    Return ONLY a JSON object with a single key 'content' containing the rewritten text.
    Preserve any personalization tokens (like {{firstName}}) if they exist in the text.
    """
    try:
        result, _ = _generate_json_with_debug(system_prompt)
        return result.get("content", content) if result else content
    except Exception as e:
        logger.error(f"Error rewriting block: {e}")
        return content
