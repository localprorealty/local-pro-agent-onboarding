import os
import time
import logging
import httpx
import asyncio
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq

from app.config import settings
from app.prompts import NORTH_SYSTEM_PROMPT
from app.schemas import ChatRequest, ChatResponse, MLSLookupRequest, ListingCopyRequest, ListingCopyResponse
from app.rets_service import RETSService

logger = logging.getLogger(__name__)

# Initialize FastAPI application
app = FastAPI(
    title="LocalPRO Onboarding Backend",
    description="Lightweight FastAPI backend for LocalPRO Onboarding site chat support.",
    version="1.0.0"
)

# Setup CORS Middleware (reloaded configuration)
if settings:
    origins = settings.cors_origins_list
else:
    # Fallback to local defaults if settings failed validation
    origins = ["http://localhost:5173", "http://127.0.0.1:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom In-Memory Rate Limiters (independent buckets)
RATE_LIMIT_DURATION = 60  # seconds
rate_limit_buckets: dict[str, dict[str, list[float]]] = {
    "address-suggest": {},
    "mls-lookup": {},
    "generate-listing-copy": {}
}

def check_rate_limit(request: Request, endpoint: str, limit: int):
    client_ip = request.client.host if request.client else "unknown"
    now = time.time()
    
    bucket = rate_limit_buckets.get(endpoint)
    if bucket is None:
        return
        
    if client_ip not in bucket:
        bucket[client_ip] = []
        
    # Remove old timestamps
    bucket[client_ip] = [
        t for t in bucket[client_ip]
        if now - t < RATE_LIMIT_DURATION
    ]
    
    if len(bucket[client_ip]) >= limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too Many Requests. Rate limit: {limit} per minute."
        )
    bucket[client_ip].append(now)

def split_address_line(address_line: str) -> tuple[str, str]:
    parts = address_line.strip().split(maxsplit=1)
    if not parts:
        return "", ""
    if len(parts) == 1:
        return "", parts[0]
    return parts[0], parts[1]

def extract_whitelisted_fields(row: dict[str, str]) -> dict[str, str]:
    prop_type = row.get("PropertySubType") or row.get("PropertyType") or "Single Family Home"
    beds = row.get("BedroomsTotal") or "N/A"
    
    full_baths = row.get("BathroomsFull")
    half_baths = row.get("BathroomsHalf")
    if full_baths:
        try:
            fb = int(full_baths)
            hb = int(half_baths) if half_baths else 0
            baths = str(fb + hb * 0.5)
            if baths.endswith(".0"):
                baths = baths[:-2]
        except ValueError:
            baths = full_baths
    else:
        baths = "N/A"
        
    sqft_val = row.get("LivingArea") or row.get("BuildingAreaTotal") or "N/A"
    if sqft_val != "N/A":
        try:
            clean_sqft = sqft_val.split(".", 1)[0]
            sqft = f"{int(clean_sqft):,} sqft"
        except ValueError:
            sqft = f"{sqft_val} sqft"
    else:
        sqft = "N/A"
        
    lot_area = row.get("LotSizeArea") or row.get("LotSizeSquareFeet")
    lot_unit = row.get("LotSizeUnits") or "Square Feet"
    if lot_area:
        try:
            val = float(lot_area)
            if lot_unit.lower() in ("acres", "acre", "ac"):
                lot_size = f"{val:.2f} acres"
            else:
                if val > 1000:
                    acres = val / 43560.0
                    lot_size = f"{acres:.2f} acres"
                else:
                    lot_size = f"{val:.2f} acres"
        except ValueError:
            lot_size = f"{lot_area} {lot_unit}"
    else:
        lot_size = "N/A"
        
    year_built = row.get("YearBuilt") or "N/A"
    
    price_val = row.get("ListPrice") or "N/A"
    if price_val != "N/A":
        try:
            clean_price = price_val.split(".", 1)[0]
            price = f"${int(clean_price):,}"
        except ValueError:
            price = f"${price_val}"
    else:
        price = "N/A"
        
    return {
        "Property Type": prop_type,
        "Bedrooms": beds,
        "Bathrooms": baths,
        "Square Footage": sqft,
        "Lot Size (acres)": lot_size,
        "Year Built": year_built,
        "Estimated List Price": price
    }

@app.get("/health", status_code=status.HTTP_200_OK)
async def health_check():
    """Simple health check endpoint to verify backend status."""
    return {"status": "healthy"}

@app.post("/chat", response_model=ChatResponse)
async def chat_with_north(request: ChatRequest):
    """
    POST /chat
    Accepts message history, calls Groq (Llama 3.3 70B) with North's system prompt,
    and returns North's response reply.
    """
    if not settings or not settings.GROQ_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Server configuration error: GROQ_API_KEY is not set."
        )

    groq_messages = [{"role": "system", "content": NORTH_SYSTEM_PROMPT}]
    for msg in request.messages:
        groq_messages.append({
            "role": msg.role,
            "content": msg.content
        })

    try:
        client = Groq(api_key=settings.GROQ_API_KEY)
        completion = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=groq_messages,
            temperature=0.7,
            max_tokens=500
        )
        reply = completion.choices[0].message.content
        if not reply:
            raise ValueError("Groq returned an empty response.")
        return ChatResponse(reply=reply)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"North guide is temporarily unavailable: {str(e)}"
        )

@app.post("/mls-lookup")
async def mls_lookup(request: Request, req: MLSLookupRequest):
    """
    POST /mls-lookup
    Performs rate-limited DMQL search against NTREIS RETS MLS server.
    Whitelists and returns only standard listing properties.
    """
    check_rate_limit(request, "mls-lookup", 10)
    
    if not settings or not settings.NTREIS_RETS_URL:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="RETS server is not configured."
        )

    street_num, street_name = split_address_line(req.addressLine1)
    if not street_num or not street_name:
        return {"found": False}

    try:
        async with RETSService(
            login_url=settings.NTREIS_RETS_URL,
            username=settings.NTREIS_RETS_USERNAME,
            password=settings.NTREIS_RETS_PASSWORD
        ) as rets:
            results = await rets.search_by_address(
                street_number=street_num,
                street_name=street_name,
                city=req.city
            )
            if not results:
                return {"found": False}
                
            raw_row = results[0]
            mapped_data = extract_whitelisted_fields(raw_row)
            return {
                "found": True,
                "data": mapped_data
            }
    except Exception as exc:
        # Hide internal RETS credentials and log trace from client
        logger.error("Internal RETS lookup exception: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Lookup temporarily unavailable"
        )

STATE_ABBREVIATIONS = {
    "alabama": "AL", "alaska": "AK", "arizona": "AZ", "arkansas": "AR", "california": "CA",
    "colorado": "CO", "connecticut": "CT", "delaware": "DE", "florida": "FL", "georgia": "GA",
    "hawaii": "HI", "idaho": "ID", "illinois": "IL", "indiana": "IN", "iowa": "IA",
    "kansas": "KS", "kentucky": "KY", "louisiana": "LA", "maine": "ME", "maryland": "MD",
    "massachusetts": "MA", "michigan": "MI", "minnesota": "MN", "mississippi": "MS",
    "missouri": "MO", "montana": "MT", "nebraska": "NE", "nevada": "NV", "new hampshire": "NH",
    "new jersey": "NJ", "new mexico": "NM", "new york": "NY", "north carolina": "NC",
    "north dakota": "ND", "ohio": "OH", "oklahoma": "OK", "oregon": "OR", "pennsylvania": "PA",
    "rhode island": "RI", "south carolina": "SC", "south dakota": "SD", "tennessee": "TN",
    "texas": "TX", "utah": "UT", "vermont": "VT", "virginia": "VA", "washington": "WA",
    "west virginia": "WV", "wisconsin": "WI", "wyoming": "WY", "district of columbia": "DC"
}

def normalize_state_abbrev(state: str) -> str:
    if not state:
        return "Unknown"
    val = state.strip().lower()
    if len(val) == 2:
        return val.upper()
    return STATE_ABBREVIATIONS.get(val, state)

class NominatimThrottler:
    def __init__(self):
        self._lock = None
        self.last_request_time = 0.0

    @property
    def lock(self) -> asyncio.Lock:
        if self._lock is None:
            self._lock = asyncio.Lock()
        return self._lock

    async def throttle(self):
        async with self.lock:
            now = time.time()
            elapsed = now - self.last_request_time
            if elapsed < 1.0:
                await asyncio.sleep(1.0 - elapsed)
            self.last_request_time = time.time()

nominatim_throttler = NominatimThrottler()

@app.get("/address-suggest")
async def address_suggest(request: Request, q: str = ""):
    """
    GET /address-suggest?q=<query>
    Proxies to OpenStreetMap's Nominatim Search API,
    filtering for US results and returning a cleaned trimmed list.
    Enforces a global 1 req/second rate-limit on upstream requests.
    """
    check_rate_limit(request, "address-suggest", 30)
    
    if not q or len(q.strip()) < 3:
        return {"items": []}

    # Enforce global 1 req/sec limit to Nominatim
    await nominatim_throttler.throttle()

    url = "https://nominatim.openstreetmap.org/search"
    params = {
        "q": q.strip(),
        "limit": "10",
        "countrycodes": "us",
        "addressdetails": "1",
        "format": "json"
    }
    headers = {
        "User-Agent": "LocalProOnboarding/1.0 (contact@localprorealty.com)"
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, params=params, headers=headers)
            response.raise_for_status()
            res_data = response.json()
            
        suggestions = []
        
        for item in res_data:
            address = item.get("address", {})
            
            # Extract fields
            house_number = address.get("house_number", "").strip()
            # Nominatim usually returns the street name in 'road', fallback to 'street' or properties.name/display_name
            street = address.get("road", address.get("street", "")).strip()
            
            # Fallback if both house_number and street are missing in structured address details
            # e.g., if it's a street feature and OSM didn't structure it, or we parsed a place name
            if not street:
                display_name = item.get("display_name", "")
                if display_name:
                    parts = [p.strip() for p in display_name.split(",")]
                    if parts:
                        street = parts[0]
            
            if house_number and street:
                address_line_1 = f"{house_number} {street}"
            elif street:
                address_line_1 = street
            else:
                # If we still have absolutely no street-level info, skip it
                continue
                
            city = address.get("city", address.get("town", address.get("village", address.get("suburb", "")))).strip()
            state = address.get("state", "").strip()
            state_abbr = normalize_state_abbrev(state)
            
            postal_code = address.get("postcode", "").strip()
            if postal_code and "-" in postal_code:
                postal_code = postal_code.split("-")[0].strip()
                
            country = address.get("country", "").strip()
            country_label = "USA" if country.lower() in ("united states", "us", "usa") else country
            
            # Form clean address label
            label_parts = [address_line_1, city, state_abbr]
            if postal_code:
                label_parts.append(postal_code)
            if country_label:
                label_parts.append(country_label)
            label = ", ".join([p for p in label_parts if p])
            
            suggestions.append({
                "label": label,
                "addressLine1": address_line_1,
                "city": city,
                "state": state_abbr,
                "zip": postal_code
            })
            
        return {"items": suggestions}
        
    except httpx.HTTPStatusError as exc:
        logger.error(f"Nominatim API returned error status {exc.response.status_code}: {exc.response.text}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Address suggestion service temporary error."
        )
    except Exception as exc:
        logger.error(f"Nominatim API exception: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Address suggestion service is temporarily unavailable."
        )


@app.post("/generate-listing-copy", response_model=ListingCopyResponse)
async def generate_listing_copy(request: Request, req: ListingCopyRequest):
    """
    POST /generate-listing-copy
    Generates a professional property description and social media caption
    based on whitelisted MLS property details and optional notes.
    """
    check_rate_limit(request, "generate-listing-copy", 10)

    if not settings or not settings.GROQ_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Server configuration error: GROQ_API_KEY is not set."
        )

    data = req.propertyData
    details_str = "\n".join([f"- {k}: {v}" for k, v in data.items()])
    notes_str = req.notes.strip() if req.notes else "None"

    system_prompt = (
        "You are North, a helpful guide and AI teammate at LocalPRO Realty. "
        "Your task is to write high-end, premium, and compelling real estate marketing copy. "
        "You must speak in a professional, confident, yet warm and inviting tone. "
        "Provide your response EXACTLY as a JSON object containing two keys: "
        '"description" (a detailed paragraph about the home) and '
        '"socialCaption" (a short, catchy Instagram/social post caption with relevant emojis/hashtags). '
        "Do not include any extra text, markdown formatting, or explanations outside the JSON object itself."
    )

    user_prompt = (
        f"Generate listing marketing copy for a property with these details:\n"
        f"{details_str}\n\n"
        f"Additional agent notes:\n"
        f"\"{notes_str}\"\n\n"
        f"Return only a valid JSON object matching this structure:\n"
        f"{{\n"
        f'  "description": "...",\n'
        f'  "socialCaption": "..."\n'
        f"}}"
    )

    try:
        client = Groq(api_key=settings.GROQ_API_KEY)
        completion = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7,
            max_tokens=600,
            response_format={"type": "json_object"}
        )
        content = completion.choices[0].message.content
        if not content:
            raise ValueError("Groq returned an empty response.")
        
        import json
        result = json.loads(content.strip())
        
        description = result.get("description", "")
        social_caption = result.get("socialCaption", "")
        
        if not description or not social_caption:
            raise ValueError("Missing description or socialCaption in generated JSON.")
            
        return ListingCopyResponse(description=description, socialCaption=social_caption)
        
    except Exception as e:
        logger.error(f"AI Listing copy generation error: {e}", exc_info=True)
        # Fallback to local deterministic generator if Groq has an error so the demo remains functional
        fallback_desc = (
            f"Presenting this exceptional {data.get('Property Type', 'Property')}, featuring "
            f"{data.get('Bedrooms', 'N/A')} bedrooms and {data.get('Bathrooms', 'N/A')} bathrooms. "
            f"Boasting {data.get('Square Footage', 'N/A')} of living space on a lot of "
            f"{data.get('Lot Size', 'N/A')}, this property was built in {data.get('Year Built', 'N/A')}. "
            f"Offered at {data.get('List Price', 'N/A')}, it represents a fantastic opportunity in the market. "
            f"{'Note: ' + req.notes if req.notes else ''}"
        )
        fallback_social = (
            f"🏡 New Listing Alert! Check out this beautiful {data.get('Property Type', 'home')}! "
            f"✨ {data.get('Bedrooms', 'N/A')} beds | {data.get('Bathrooms', 'N/A')} baths | "
            f"{data.get('Square Footage', 'N/A')} | Offered at {data.get('List Price', 'N/A')}. "
            f"Contact us to schedule a showing! #LocalPRORealty #RealEstate #DreamHome"
        )
        return ListingCopyResponse(description=fallback_desc, socialCaption=fallback_social)



