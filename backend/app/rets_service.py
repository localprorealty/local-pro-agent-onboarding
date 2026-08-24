import logging
import xml.etree.ElementTree as ET
from urllib.parse import urlparse
import httpx
from typing import Any

logger = logging.getLogger(__name__)

RETS_USER_AGENT = "LocalPROHub/1.0"
RETS_VERSION = "RETS/1.7.2"
RETS_PROPERTY_CLASS = "Property"

def _rets_base_url(login_url: str) -> str:
    parsed = urlparse(login_url)
    path = parsed.path.rsplit("/", 1)[0]
    return f"{parsed.scheme}://{parsed.netloc}{path}"

def _first(raw: dict[str, str], *keys: str) -> str:
    for key in keys:
        val = raw.get(key, "").strip()
        if val:
            return val
    return ""

def _yn_to_yes_no(raw: dict[str, str], *keys: str) -> str:
    val = _first(raw, *keys).lower()
    if val in ("1", "true", "yes", "y"):
        return "Yes"
    if val in ("0", "false", "no", "n"):
        return "No"
    return _first(raw, *keys)

def _strip_decimal_money(value: str) -> str:
    if not value:
        return ""
    if "." in value:
        return value.split(".", 1)[0]
    return value

class RETSService:
    """RETS client connection and DMQL search logic."""

    def __init__(self, login_url: str, username: str, password: str) -> None:
        self.login_url = login_url.strip()
        base = _rets_base_url(self.login_url) if self.login_url else ""
        self.search_url = f"{base}/Search.ashx" if base else ""
        self.username = username.strip()
        self.password = password
        self._client: httpx.AsyncClient | None = None

    @property
    def configured(self) -> bool:
        return bool(self.login_url and self.username and self.password)

    async def __aenter__(self) -> "RETSService":
        if not self.configured:
            raise RuntimeError("NTREIS RETS credentials are not configured.")
        self._client = httpx.AsyncClient(
            auth=httpx.DigestAuth(self.username, self.password),
            headers={
                "User-Agent": RETS_USER_AGENT,
                "RETS-Version": RETS_VERSION,
                "Accept": "*/*",
            },
            follow_redirects=True,
            timeout=30.0,
        )
        await self._login()
        return self

    async def __aexit__(self, *args: object) -> None:
        await self._logout()
        if self._client:
            await self._client.aclose()
            self._client = None

    async def _login(self) -> None:
        assert self._client is not None
        response = await self._client.get(self.login_url)
        response.raise_for_status()

    async def _logout(self) -> None:
        if not self._client:
            return
        try:
            logout_url = self.login_url.replace("Login.ashx", "Logout.ashx")
            await self._client.get(logout_url)
        except httpx.HTTPError:
            pass

    async def search_by_address(
        self,
        street_number: str,
        street_name: str,
        city: str = "",
    ) -> list[dict[str, str]]:
        name = street_name.strip()
        suffix_words = {
            "drive", "dr", "street", "st", "avenue", "ave", "road", "rd", 
            "court", "ct", "trail", "trl", "lane", "ln", "way", "loop", 
            "boulevard", "blvd", "circle", "cir", "parkway", "pkwy", 
            "place", "pl", "terrace", "ter"
        }
        words = name.split()
        if len(words) > 1 and words[-1].lower().rstrip(".") in suffix_words:
            name_without_suffix = " ".join(words[:-1])
        else:
            name_without_suffix = name

        queries = [
            f"(StreetNumber={street_number}),(StreetName={name})",
            f"(StreetNumber={street_number}),(StreetName=*{name}*)",
        ]
        
        if name_without_suffix != name:
            queries.append(f"(StreetNumber={street_number}),(StreetName={name_without_suffix})")
            queries.append(f"(StreetNumber={street_number}),(StreetName=*{name_without_suffix}*)")
            
        results: list[dict[str, str]] = []
        seen: set[str] = set()

        for query in queries:
            for row in await self._search_many(query, limit=15):
                key = row.get("ListingId") or row.get("ListingKeyNumeric", "")
                if key and key in seen:
                    continue
                if key:
                    seen.add(key)
                if city:
                    clean_city = city.split(",")[0].strip().lower()
                    row_city = row.get("City", "").strip().lower()
                    if row_city and row_city != clean_city:
                        continue
                results.append(row)
            if results:
                break

        return results

    async def _search_many(self, query: str, limit: int = 10) -> list[dict[str, str]]:
        assert self._client is not None
        params = {
            "SearchType": "Property",
            "Class": RETS_PROPERTY_CLASS,
            "Query": query,
            "QueryType": "DMQL2",
            "Count": "1",
            "Format": "COMPACT-DECODED",
            "Limit": str(limit),
            "StandardNames": "0",
        }
        try:
            response = await self._client.get(self.search_url, params=params)
            response.raise_for_status()
            return self._parse_compact_response(response.text)
        except httpx.HTTPError as exc:
            logger.warning("RETS search failed for query %r: %s", query, exc)
            return []

    def _parse_compact_response(self, xml_text: str) -> list[dict[str, str]]:
        try:
            root = ET.fromstring(xml_text)
        except ET.ParseError:
            start = xml_text.find("<RETS")
            if start < 0:
                return []
            try:
                root = ET.fromstring(xml_text[start:])
            except ET.ParseError:
                return []

        reply_code = root.get("ReplyCode", "0")
        if reply_code not in ("0", "20201"):
            return []

        columns_el = root.find("COLUMNS")
        if columns_el is None or not columns_el.text:
            return []

        columns = columns_el.text.strip("\t").split("\t")
        results: list[dict[str, str]] = []

        for data_el in root.findall("DATA"):
            if not data_el.text:
                continue
            values = data_el.text.strip("\t").split("\t")
            row = {
                columns[i]: values[i] if i < len(values) else ""
                for i in range(len(columns))
            }
            results.append(row)

        return results
