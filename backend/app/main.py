import os
import time
import logging
import httpx
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq

from app.config import settings
from app.prompts import NORTH_SYSTEM_PROMPT
from app.schemas import ChatRequest, ChatResponse, MLSLookupRequest
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
    "mls-lookup": {}
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

@app.get("/address-suggest")
async def address_suggest(request: Request, q: str = ""):
    """
    GET /address-suggest?q=<query>
    Proxies to Photon's open-source geocoding API,
    filtering for US results and returning a cleaned trimmed list.
    """
    check_rate_limit(request, "address-suggest", 30)
    
    if not q or len(q.strip()) < 3:
        return {"items": []}

    url = "https://photon.komoot.io/api"
    params = {
        "q": q.strip(),
        "limit": "10",
        "countrycode": "US"
    }
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, params=params, headers=headers)
            response.raise_for_status()
            res_data = response.json()
            
        features = res_data.get("features", [])
        suggestions = []
        
        for feature in features:
            properties = feature.get("properties", {})
            
            street = properties.get("street", "").strip()
            city = properties.get("city", "").strip()
            state = properties.get("state", "").strip()
            state_abbr = normalize_state_abbrev(state)
            
            house_number = properties.get("housenumber", "").strip()
            postal_code = properties.get("postcode", "").strip()
            if postal_code and "-" in postal_code:
                postal_code = postal_code.split("-")[0].strip()
                
            if house_number and street:
                address_line_1 = f"{house_number} {street}"
            elif street:
                address_line_1 = street
            else:
                continue
                
            country = properties.get("country", "").strip()
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
        logger.error(f"Photon API returned error status {exc.response.status_code}: {exc.response.text}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Address suggestion service temporary error."
        )
    except Exception as exc:
        logger.error(f"Photon API exception: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Address suggestion service is temporarily unavailable."
        )


