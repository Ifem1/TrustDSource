# v0.2.17
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *
import json
import hashlib


class TrustDSourceUnified(gl.Contract):
    """
    TrustDSource Unified — GenLayer Intelligent Contract

    One-contract version of:
    - Main TrustDSource
    - Claim Extractor
    - Source Discovery
    - Credibility Engine
    - Scoring Engine
    - Schemas/constants

    Design:
    - submit_content creates the on-chain snapshot.
    - extract_claims is deterministic and fast. No AI here.
    - analyse_sources can use GenLayer AI but has fallback.
    - analyse_credibility can use GenLayer AI but has fallback.
    - calculate_credibility is deterministic.
    - store_report stores verification hash and analytics.
    - update_reputation updates user profile/reputation.

    Important:
    - No TreeMap/DynArray initialisation inside __init__.
    - Complex objects are stored as JSON strings.
    - No datetime usage.
    - No float public return types.
    - Use "all_time" analytics.
    """

    owner: str
    verification_count: u256

    reports: TreeMap[str, str]
    profiles: TreeMap[str, str]
    reputation: TreeMap[str, u256]
    analytics: TreeMap[str, str]
    verification_index: DynArray[str]

    def __init__(self) -> None:
        self.owner = ""
        self.verification_count = u256(0)

    # ==========================================================
    # Basic helpers
    # ==========================================================

    def _json_dumps(self, value) -> str:
        return json.dumps(value, sort_keys=True)

    def _json_loads(self, value: str):
        try:
            return json.loads(value)
        except Exception:
            return None

    def _clean_text(self, value, max_len: u256) -> str:
        text = str(value).strip()
        limit = int(max_len)

        text = text.replace("\n", " ")
        text = text.replace("\r", " ")
        text = text.replace("\t", " ")

        while "  " in text:
            text = text.replace("  ", " ")

        if len(text) > limit:
            return text[:limit]

        return text

    def _lower(self, value) -> str:
        return str(value).lower().strip()

    def _safe_bool(self, value, default: bool) -> bool:
        if value is True:
            return True

        if value is False:
            return False

        text = str(value).lower().strip()

        if text == "true":
            return True
        if text == "yes":
            return True
        if text == "1":
            return True
        if text == "primary":
            return True
        if text == "supporting":
            return True
        if text == "supports":
            return True

        if text == "false":
            return False
        if text == "no":
            return False
        if text == "0":
            return False
        if text == "conflicting":
            return False
        if text == "conflicts":
            return False

        return default

    def _normalise_score_int(self, value) -> int:
        try:
            text = str(value).strip()

            if "." in text:
                text = text.split(".")[0]

            score = int(text)
        except Exception:
            score = 0

        if score < 0:
            return 0

        if score > 100:
            return 100

        return score

    def _normalise_decimal_string(self, value) -> str:
        text = str(value).strip()

        if text == "":
            return "0.5"

        if text.startswith("-"):
            return "0.0"

        if "." not in text:
            try:
                integer_value = int(text)
            except Exception:
                return "0.5"

            if integer_value <= 1:
                return str(integer_value) + ".0"

            if integer_value > 100:
                integer_value = 100

            whole = integer_value // 100
            decimal = integer_value % 100

            if decimal == 0:
                return str(whole) + ".0"

            if decimal < 10:
                return str(whole) + ".0" + str(decimal)

            return str(whole) + "." + str(decimal)

        parts = text.split(".")

        if len(parts) < 2:
            return "0.5"

        whole_part = parts[0]
        decimal_part = parts[1]

        try:
            whole_int = int(whole_part)
        except Exception:
            whole_int = 0

        if whole_int >= 1:
            return "1.0"

        decimal_part = decimal_part[:2]

        if decimal_part == "":
            decimal_part = "0"

        return "0." + decimal_part

    def _confidence_to_score(self, value) -> int:
        text = self._normalise_decimal_string(value)

        try:
            if "." not in text:
                raw = int(text)

                if raw <= 1:
                    return raw * 100

                if raw > 100:
                    return 100

                return raw

            parts = text.split(".")
            whole = int(parts[0])
            decimal = parts[1]

            if whole >= 1:
                return 100

            if decimal == "":
                return 0

            if len(decimal) == 1:
                return int(decimal) * 10

            return int(decimal[:2])
        except Exception:
            return 50

    def _get_snapshot(self, report_id: str):
        stored = self.reports.get(report_id, "")

        if stored == "":
            return {}

        parsed = self._json_loads(stored)

        if isinstance(parsed, dict):
            return parsed

        return {}

    def _store_snapshot(self, report_id: str, snapshot) -> None:
        self.reports[report_id] = self._json_dumps(snapshot)

    # ==========================================================
    # Schema/constants helpers
    # ==========================================================

    def _normalise_category(self, category: str) -> str:
        clean = self._lower(category)

        if clean == "news":
            return "news"
        if clean == "social":
            return "social"
        if clean == "research":
            return "research"
        if clean == "public_statement":
            return "public_statement"
        if clean == "blog":
            return "blog"
        if clean == "press_release":
            return "press_release"
        if clean == "breaking_news":
            return "breaking_news"
        if clean == "politics":
            return "politics"
        if clean == "health":
            return "health"
        if clean == "science":
            return "science"
        if clean == "finance":
            return "finance"
        if clean == "technology":
            return "technology"
        if clean == "government":
            return "government"
        if clean == "policy":
            return "policy"
        if clean == "misinformation":
            return "misinformation"

        return "other"

    def _normalise_verdict(self, verdict: str) -> str:
        clean = str(verdict).upper().strip()

        if clean == "HIGH_CREDIBILITY":
            return "HIGH_CREDIBILITY"
        if clean == "MODERATE_CREDIBILITY":
            return "MODERATE_CREDIBILITY"
        if clean == "LOW_CREDIBILITY":
            return "LOW_CREDIBILITY"
        if clean == "MISLEADING":
            return "MISLEADING"
        if clean == "UNVERIFIED":
            return "UNVERIFIED"

        return "UNVERIFIED"

    def _normalise_bias_risk(self, risk: str) -> str:
        clean = str(risk).upper().strip()

        if clean == "LOW":
            return "LOW"
        if clean == "MEDIUM":
            return "MEDIUM"
        if clean == "HIGH":
            return "HIGH"

        return "LOW"

    def _normalise_misinfo_risk(self, risk: str) -> str:
        clean = str(risk).upper().strip()

        if clean == "LOW":
            return "LOW"
        if clean == "MEDIUM":
            return "MEDIUM"
        if clean == "HIGH":
            return "HIGH"
        if clean == "CRITICAL":
            return "CRITICAL"

        return "LOW"

    @gl.public.view
    def get_schema_metadata_json(self) -> str:
        metadata = {
            "verdicts": [
                "HIGH_CREDIBILITY",
                "MODERATE_CREDIBILITY",
                "LOW_CREDIBILITY",
                "MISLEADING",
                "UNVERIFIED",
            ],
            "risks": [
                "LOW",
                "MEDIUM",
                "HIGH",
                "CRITICAL",
            ],
            "content_categories": [
                "news",
                "social",
                "research",
                "public_statement",
                "blog",
                "press_release",
                "breaking_news",
                "politics",
                "health",
                "science",
                "finance",
                "technology",
                "government",
                "policy",
                "misinformation",
                "other",
            ],
            "claim_schema": {
                "claim_text": "str",
                "claim_type": "str",
                "confidence": "str:0.0-1.0",
                "is_primary": "bool",
                "order_index": "int",
            },
            "source_schema": {
                "url": "str",
                "title": "str",
                "domain": "str",
                "publication": "str",
                "credibility_score": "int:0-100",
                "source_type": "str",
                "is_supporting": "bool",
                "relevance_score": "str:0.0-1.0",
                "snippet": "str",
            },
        }

        return self._json_dumps(metadata)

    # ==========================================================
    # Domain/source helpers
    # ==========================================================

    @gl.public.view
    def extract_domain(self, url: str) -> str:
        clean_url = self._lower(url)

        if clean_url.startswith("https://"):
            clean_url = clean_url[8:]

        if clean_url.startswith("http://"):
            clean_url = clean_url[7:]

        parts = clean_url.split("/")
        domain = parts[0]

        if domain.startswith("www."):
            domain = domain[4:]

        return domain

    def _is_high_credibility_domain(self, domain: str) -> bool:
        clean = self._lower(domain)

        if clean == "reuters.com":
            return True
        if clean == "apnews.com":
            return True
        if clean == "bbc.com":
            return True
        if clean == "bbc.co.uk":
            return True
        if clean == "nytimes.com":
            return True
        if clean == "theguardian.com":
            return True
        if clean == "washingtonpost.com":
            return True
        if clean == "who.int":
            return True
        if clean == "cdc.gov":
            return True
        if clean == "nih.gov":
            return True
        if clean == "nature.com":
            return True
        if clean == "science.org":
            return True
        if clean == "pubmed.ncbi.nlm.nih.gov":
            return True
        if clean == "ft.com":
            return True
        if clean == "economist.com":
            return True
        if clean == "wsj.com":
            return True
        if clean == "nbcnews.com":
            return True
        if clean == "cbsnews.com":
            return True
        if clean == "abcnews.go.com":
            return True
        if clean == "npr.org":
            return True
        if clean == "pbs.org":
            return True
        if clean == "politifact.com":
            return True
        if clean == "snopes.com":
            return True
        if clean == "factcheck.org":
            return True
        if clean == "fullfact.org":
            return True

        return False

    @gl.public.view
    def score_domain(self, domain: str) -> u256:
        clean = self._lower(domain)

        if clean == "":
            return u256(40)

        if self._is_high_credibility_domain(clean):
            return u256(87)

        if clean.endswith(".gov"):
            return u256(92)

        if ".gov." in clean:
            return u256(92)

        if clean.endswith(".edu"):
            return u256(85)

        if ".edu." in clean:
            return u256(85)

        if clean == "x.com":
            return u256(45)
        if clean == "twitter.com":
            return u256(45)
        if clean == "facebook.com":
            return u256(45)
        if clean == "instagram.com":
            return u256(45)
        if clean == "tiktok.com":
            return u256(40)
        if clean == "youtube.com":
            return u256(50)
        if clean == "reddit.com":
            return u256(45)
        if clean == "medium.com":
            return u256(50)
        if clean == "substack.com":
            return u256(50)

        if clean.endswith(".org"):
            return u256(65)

        return u256(50)

    @gl.public.view
    def infer_source_type(self, domain: str) -> str:
        clean = self._lower(domain)

        if clean.endswith(".gov") or ".gov." in clean:
            return "government"

        if clean.endswith(".edu") or ".edu." in clean:
            return "academic"

        if clean == "who.int":
            return "academic"
        if clean == "cdc.gov":
            return "government"
        if clean == "nih.gov":
            return "academic"
        if clean == "pubmed.ncbi.nlm.nih.gov":
            return "academic"
        if clean == "nature.com":
            return "academic"
        if clean == "science.org":
            return "academic"

        if clean == "politifact.com":
            return "fact_check"
        if clean == "snopes.com":
            return "fact_check"
        if clean == "factcheck.org":
            return "fact_check"
        if clean == "fullfact.org":
            return "fact_check"

        if clean == "x.com":
            return "social"
        if clean == "twitter.com":
            return "social"
        if clean == "facebook.com":
            return "social"
        if clean == "instagram.com":
            return "social"
        if clean == "tiktok.com":
            return "social"
        if clean == "reddit.com":
            return "social"

        if clean == "medium.com":
            return "blog"
        if clean == "substack.com":
            return "blog"

        if self._is_high_credibility_domain(clean):
            return "news"

        return "other"

    # ==========================================================
    # Claim extraction — deterministic, no AI
    # ==========================================================

    def _is_valid_claim_type_internal(self, claim_type: str) -> bool:
        clean = self._lower(claim_type)

        if clean == "statistical":
            return True
        if clean == "event":
            return True
        if clean == "attribution":
            return True
        if clean == "scientific":
            return True
        if clean == "policy":
            return True
        if clean == "quote":
            return True
        if clean == "factual":
            return True

        return False

    def _normalise_claim_type_internal(self, claim_type: str) -> str:
        clean = self._lower(claim_type)

        if self._is_valid_claim_type_internal(clean):
            return clean

        return "factual"

    @gl.public.view
    def is_valid_claim_type(self, claim_type: str) -> bool:
        return self._is_valid_claim_type_internal(claim_type)

    @gl.public.view
    def normalise_claim_type(self, claim_type: str) -> str:
        return self._normalise_claim_type_internal(claim_type)

    @gl.public.view
    def get_claim_types_json(self) -> str:
        return json.dumps([
            "statistical",
            "event",
            "attribution",
            "scientific",
            "policy",
            "quote",
            "factual",
        ])

    def _looks_like_claim(self, text: str) -> bool:
        clean = self._clean_text(text, u256(700))
        lower = self._lower(clean)

        if clean == "":
            return False

        if len(clean) < 20:
            return False

        if clean.endswith("?"):
            return False

        claim_markers = [
            " confirms ", " confirmed ", " discovers ", " discovered ",
            " finds ", " found ", " says ", " said ", " reports ",
            " reported ", " announced ", " shows ", " showed ",
            " reveals ", " revealed ", " according to ", " study ",
            " research ", " data ", " evidence ",
        ]

        for marker in claim_markers:
            if marker in lower:
                return True

        i = 0
        while i < len(clean):
            ch = clean[i]
            if ch >= "0" and ch <= "9":
                return True
            i = i + 1

        if len(clean) >= 60:
            return True

        return False

    def _infer_claim_type(self, text: str) -> str:
        lower = self._lower(text)

        if "%" in lower:
            return "statistical"

        i = 0
        while i < len(lower):
            ch = lower[i]

            if ch >= "0" and ch <= "9":
                if "million" in lower:
                    return "statistical"
                if "billion" in lower:
                    return "statistical"
                if "percent" in lower:
                    return "statistical"
                if "%" in lower:
                    return "statistical"
                if "year" in lower:
                    return "event"

            i = i + 1

        if "telescope" in lower:
            return "scientific"
        if "planet" in lower:
            return "scientific"
        if "exoplanet" in lower:
            return "scientific"
        if "water vapor" in lower:
            return "scientific"
        if "methane" in lower:
            return "scientific"
        if "carbon dioxide" in lower:
            return "scientific"
        if "study" in lower:
            return "scientific"
        if "research" in lower:
            return "scientific"
        if "scientist" in lower:
            return "scientific"

        if "policy" in lower:
            return "policy"
        if "law" in lower:
            return "policy"
        if "regulation" in lower:
            return "policy"
        if "government" in lower:
            return "policy"

        if "according to" in lower:
            return "attribution"
        if "said" in lower:
            return "attribution"
        if "says" in lower:
            return "attribution"
        if "confirmed" in lower:
            return "attribution"

        if '"' in text:
            return "quote"

        if "announced" in lower:
            return "event"
        if "discovered" in lower:
            return "event"
        if "launched" in lower:
            return "event"
        if "happened" in lower:
            return "event"

        return "factual"

    def _split_sentences(self, text: str):
        clean = self._clean_text(text, u256(3000))

        clean = clean.replace("?", ".")
        clean = clean.replace("!", ".")
        clean = clean.replace(";", ".")
        clean = clean.replace(" • ", ". ")
        clean = clean.replace(" - ", ". ")

        raw_parts = clean.split(".")
        parts = []

        for part in raw_parts:
            sentence = self._clean_text(part, u256(700))

            if sentence != "":
                parts.append(sentence)

            if len(parts) >= 20:
                break

        return parts

    def _add_claim_if_unique(self, claims, seen_texts, claim_text: str, confidence: str):
        clean_claim = self._clean_text(claim_text, u256(700))

        if clean_claim == "":
            return claims

        text_lower = self._lower(clean_claim)

        already_seen = False
        for seen in seen_texts:
            if seen == text_lower:
                already_seen = True

        if already_seen:
            return claims

        if not self._looks_like_claim(clean_claim):
            return claims

        seen_texts.append(text_lower)

        claims.append({
            "claim_text": clean_claim,
            "claim_type": self._infer_claim_type(clean_claim),
            "confidence": self._normalise_decimal_string(confidence),
            "is_primary": len(claims) == 0,
            "order_index": len(claims),
        })

        return claims

    def _ensure_one_primary(self, claims):
        if not isinstance(claims, list):
            return []

        if len(claims) == 0:
            return []

        first_primary_index = -1
        highest_index = 0
        highest_score = -1

        i = 0

        for claim in claims:
            if isinstance(claim, dict):
                score = self._confidence_to_score(claim.get("confidence", "0.5"))

                if score > highest_score:
                    highest_score = score
                    highest_index = i

                if first_primary_index == -1:
                    if self._safe_bool(claim.get("is_primary", False), False):
                        first_primary_index = i

            i = i + 1

        primary_index = highest_index

        if first_primary_index >= 0:
            primary_index = first_primary_index

        cleaned = []
        j = 0

        for claim in claims:
            if isinstance(claim, dict):
                claim_text = self._clean_text(claim.get("claim_text", ""), u256(700))

                if claim_text != "":
                    claim_type = self._normalise_claim_type_internal(
                        str(claim.get("claim_type", "factual"))
                    )

                    if claim_type == "factual":
                        claim_type = self._infer_claim_type(claim_text)

                    cleaned.append({
                        "claim_text": claim_text,
                        "claim_type": claim_type,
                        "confidence": self._normalise_decimal_string(
                            claim.get("confidence", "0.5")
                        ),
                        "is_primary": j == primary_index,
                        "order_index": len(cleaned),
                    })

            j = j + 1

            if len(cleaned) >= 12:
                break

        return cleaned

    def _deterministic_extract_claims_list(self, content: str, claim_summary: str):
        claims = []
        seen_texts = []

        safe_summary = self._clean_text(claim_summary, u256(900))
        safe_content = self._clean_text(content, u256(3000))

        if safe_summary != "":
            summary_sentences = self._split_sentences(safe_summary)

            if len(summary_sentences) == 0:
                claims = self._add_claim_if_unique(
                    claims,
                    seen_texts,
                    safe_summary,
                    "0.75",
                )
            else:
                for sentence in summary_sentences:
                    claims = self._add_claim_if_unique(
                        claims,
                        seen_texts,
                        sentence,
                        "0.75",
                    )

                    if len(claims) >= 3:
                        break

        if safe_content != "":
            content_sentences = self._split_sentences(safe_content)

            for sentence in content_sentences:
                claims = self._add_claim_if_unique(
                    claims,
                    seen_texts,
                    sentence,
                    "0.65",
                )

                if len(claims) >= 8:
                    break

        if len(claims) == 0:
            fallback_text = safe_summary

            if fallback_text == "":
                fallback_text = safe_content[:700]

            if fallback_text != "":
                claims.append({
                    "claim_text": fallback_text,
                    "claim_type": self._infer_claim_type(fallback_text),
                    "confidence": "0.5",
                    "is_primary": True,
                    "order_index": 0,
                })

        return self._ensure_one_primary(claims)

    @gl.public.view
    def deterministic_extract_claims(
        self,
        content: str,
        claim_summary: str,
        category: str,
    ) -> str:
        claims = self._deterministic_extract_claims_list(content, claim_summary)
        return self._json_dumps(claims)

    @gl.public.view
    def get_primary_claim(self, claims_json: str) -> str:
        parsed = self._json_loads(claims_json)

        if not isinstance(parsed, list):
            return ""

        fallback_claim = ""
        fallback_score = -1

        for claim in parsed:
            if not isinstance(claim, dict):
                continue

            claim_text = self._clean_text(claim.get("claim_text", ""), u256(700))

            if claim_text == "":
                continue

            if self._safe_bool(claim.get("is_primary", False), False):
                return claim_text

            score = self._confidence_to_score(claim.get("confidence", "0.5"))

            if score > fallback_score:
                fallback_score = score
                fallback_claim = claim_text

        return fallback_claim

    # ==========================================================
    # Source discovery / analysis
    # ==========================================================

    @gl.public.view
    def build_search_query(self, title: str, primary_claim: str, category: str) -> str:
        safe_title = self._clean_text(title, u256(120))
        safe_claim = self._clean_text(primary_claim, u256(180))
        safe_category = self._normalise_category(category)

        query = safe_title + " " + safe_claim

        if safe_category == "research":
            query = query + " study research peer reviewed PubMed Nature Science"
        elif safe_category == "science":
            query = query + " study research evidence"
        elif safe_category == "health":
            query = query + " WHO CDC NIH study evidence"
        elif safe_category == "government":
            query = query + " official government statement report"
        elif safe_category == "policy":
            query = query + " official government policy statement"
        elif safe_category == "politics":
            query = query + " Reuters AP BBC official statement fact check"
        elif safe_category == "finance":
            query = query + " Reuters Bloomberg FT filing report"
        elif safe_category == "news":
            query = query + " Reuters AP BBC report statement"
        elif safe_category == "misinformation":
            query = query + " fact check debunked verified misleading"

        if len(query) > 250:
            query = query[:250]

        return query

    def _source_fallback_list(self, url: str, title: str, content: str):
        clean_url = self._clean_text(url, u256(500))
        clean_title = self._clean_text(title, u256(250))
        clean_content = self._clean_text(content, u256(700))

        if clean_url == "" and clean_title == "" and clean_content == "":
            return []

        domain = self.extract_domain(clean_url)
        domain_score = int(self.score_domain(domain))
        source_type = self.infer_source_type(domain)

        return [{
            "url": clean_url,
            "title": clean_title,
            "domain": domain,
            "publication": "Submitted source",
            "credibility_score": domain_score,
            "source_type": source_type,
            "is_supporting": True,
            "relevance_score": "0.5",
            "snippet": clean_content,
        }]

    def _clean_sources_list(self, raw_sources, fallback_url: str, fallback_title: str, fallback_content: str):
        cleaned = []
        seen_keys = []

        if isinstance(raw_sources, list):
            for item in raw_sources:
                if not isinstance(item, dict):
                    continue

                source_url = self._clean_text(item.get("url", ""), u256(500))
                source_title = self._clean_text(item.get("title", ""), u256(250))

                if source_url == "" and source_title == "":
                    continue

                domain = self._clean_text(item.get("domain", ""), u256(120))

                if domain == "" and source_url != "":
                    domain = self.extract_domain(source_url)

                domain_score = int(self.score_domain(domain))
                ai_score = self._normalise_score_int(item.get("credibility_score", domain_score))
                blended_score = int((ai_score * 65 + domain_score * 35) / 100)

                key = source_url
                if key == "":
                    key = domain + ":" + source_title

                key = self._lower(key)

                already_seen = False
                for seen in seen_keys:
                    if seen == key:
                        already_seen = True

                if already_seen:
                    continue

                seen_keys.append(key)

                source_type = self._clean_text(item.get("source_type", ""), u256(40))

                if source_type == "":
                    source_type = self.infer_source_type(domain)

                cleaned.append({
                    "url": source_url,
                    "title": source_title,
                    "domain": domain,
                    "publication": self._clean_text(item.get("publication", ""), u256(120)),
                    "credibility_score": self._normalise_score_int(blended_score),
                    "source_type": source_type,
                    "is_supporting": self._safe_bool(item.get("is_supporting", True), True),
                    "relevance_score": self._normalise_decimal_string(
                        item.get("relevance_score", "0.5")
                    ),
                    "snippet": self._clean_text(item.get("snippet", ""), u256(700)),
                })

                if len(cleaned) >= 15:
                    break

        if len(cleaned) == 0:
            return self._source_fallback_list(fallback_url, fallback_title, fallback_content)

        return cleaned

    def _parse_sources_from_string(self, response: str):
        cleaned = str(response).strip()

        if cleaned.startswith("```"):
            lines = cleaned.split("\n")

            if len(lines) >= 3:
                cleaned = "\n".join(lines[1:-1]).strip()

            if cleaned.lower().startswith("json"):
                cleaned = cleaned[4:].strip()

        try:
            parsed = json.loads(cleaned)

            if isinstance(parsed, list):
                return parsed

            if isinstance(parsed, dict):
                for key in ["sources", "results", "items", "data"]:
                    candidate = parsed.get(key, [])
                    if isinstance(candidate, list):
                        return candidate
        except Exception:
            pass

        try:
            start = cleaned.find("[")
            end = cleaned.rfind("]")

            if start >= 0 and end > start:
                parsed = json.loads(cleaned[start:end + 1])

                if isinstance(parsed, list):
                    return parsed
        except Exception:
            pass

        return []

    @gl.public.view
    def build_source_analysis_prompt(
        self,
        url: str,
        category: str,
        primary_claim: str,
        web_results: str,
    ) -> str:
        safe_url = self._clean_text(url, u256(500))
        safe_category = self._clean_text(category, u256(80))
        safe_claim = self._clean_text(primary_claim, u256(1000))
        safe_results = self._clean_text(web_results, u256(7000))

        return f"""
You are a source credibility analyst for a misinformation detection platform.

Original content URL:
{safe_url}

Category:
{safe_category}

Primary claim:
{safe_claim}

Search results or evidence text:
{safe_results}

Task:
Analyse the supplied results/evidence as sources for the primary claim.

For each relevant result:
1. Identify URL, title, domain, and publication.
2. Classify source type.
3. Decide whether it supports or conflicts with the primary claim.
4. Score credibility from 0 to 100.
5. Score relevance from 0.0 to 1.0.
6. Extract a short evidence snippet.

Return ONLY valid JSON.

Expected JSON array:
[
  {{
    "url": "full url",
    "title": "page title",
    "domain": "domain.com",
    "publication": "Publication Name",
    "credibility_score": 85,
    "source_type": "news|government|academic|primary_source|blog|social|fact_check|other",
    "is_supporting": true,
    "relevance_score": 0.92,
    "snippet": "relevant excerpt"
  }}
]
""".strip()

    def _validate_sources_result(self, leader_result) -> bool:
        try:
            data = leader_result.calldata
        except Exception:
            return False

        if isinstance(data, list):
            if len(data) > 40:
                return False
            return True

        if isinstance(data, dict):
            return True

        if isinstance(data, str):
            if len(data) > 20000:
                return False
            return True

        return False

    def _normalise_source_result_to_list(self, result):
        if isinstance(result, list):
            return result

        if isinstance(result, dict):
            for key in ["sources", "results", "items", "data"]:
                candidate = result.get(key, [])
                if isinstance(candidate, list):
                    return candidate
            return []

        if isinstance(result, str):
            return self._parse_sources_from_string(result)

        return []

    @gl.public.write
    def analyse_sources(self, report_id: str, web_results_text: str) -> str:
        snapshot = self._get_snapshot(report_id)

        if snapshot == {}:
            return "[]"

        title = str(snapshot.get("title", ""))
        url = str(snapshot.get("url", ""))
        category = str(snapshot.get("category", "news"))
        content = str(snapshot.get("content", ""))
        claims = snapshot.get("claims", [])

        primary_claim = ""
        if isinstance(claims, list):
            primary_claim = self.get_primary_claim(self._json_dumps(claims))

        if primary_claim == "":
            primary_claim = str(snapshot.get("claim_summary", ""))[:700]

        prompt = self.build_source_analysis_prompt(
            url,
            category,
            primary_claim,
            web_results_text,
        )

        def leader_fn():
            return gl.nondet.exec_prompt(prompt, response_format="json")

        try:
            result = gl.vm.run_nondet_unsafe(
                leader_fn,
                self._validate_sources_result,
            )
        except Exception:
            result = []

        raw_sources = self._normalise_source_result_to_list(result)

        sources = self._clean_sources_list(
            raw_sources,
            url,
            title,
            content,
        )

        snapshot["sources"] = sources
        snapshot["status"] = "sources_analyzed"
        self._store_snapshot(report_id, snapshot)

        return self._json_dumps(sources)

    @gl.public.write
    def use_fallback_sources(self, report_id: str) -> str:
        snapshot = self._get_snapshot(report_id)

        if snapshot == {}:
            return "[]"

        sources = self._source_fallback_list(
            str(snapshot.get("url", "")),
            str(snapshot.get("title", "")),
            str(snapshot.get("content", "")),
        )

        snapshot["sources"] = sources
        snapshot["status"] = "sources_fallback"
        self._store_snapshot(report_id, snapshot)

        return self._json_dumps(sources)

    # ==========================================================
    # Credibility analysis
    # ==========================================================

    def _split_sources(self, sources):
        supporting = []
        conflicting = []

        if isinstance(sources, list):
            for source in sources:
                if not isinstance(source, dict):
                    continue

                if self._safe_bool(source.get("is_supporting", True), True):
                    supporting.append(source)
                else:
                    conflicting.append(source)

                if len(supporting) >= 10 and len(conflicting) >= 5:
                    break

        return supporting, conflicting

    def _claims_text(self, claims):
        text = ""

        if isinstance(claims, list):
            count = 0

            for claim in claims:
                if isinstance(claim, dict):
                    claim_text = self._clean_text(claim.get("claim_text", ""), u256(700))

                    if claim_text != "":
                        text = text + "- " + claim_text + "\n"
                        count = count + 1

                if count >= 10:
                    break

        return text

    def _sources_text(self, sources, max_items: u256):
        text = ""
        count = 0
        limit = int(max_items)

        if isinstance(sources, list):
            for source in sources:
                if isinstance(source, dict):
                    credibility = str(source.get("credibility_score", 0))
                    title = self._clean_text(source.get("title", ""), u256(250))
                    domain = self._clean_text(source.get("domain", ""), u256(120))
                    snippet = self._clean_text(source.get("snippet", ""), u256(700))

                    if title != "" or snippet != "":
                        text = (
                            text
                            + "- ["
                            + credibility
                            + "] "
                            + title
                            + " ("
                            + domain
                            + "): "
                            + snippet
                            + "\n"
                        )
                        count = count + 1

                if count >= limit:
                    break

        return text

    @gl.public.view
    def build_verification_prompt(self, report_id: str) -> str:
        snapshot = self._get_snapshot(report_id)

        if snapshot == {}:
            return ""

        title = self._clean_text(snapshot.get("title", ""), u256(200))
        category = self._clean_text(snapshot.get("category", ""), u256(80))
        content = self._clean_text(snapshot.get("content", ""), u256(3000))

        claims = snapshot.get("claims", [])
        sources = snapshot.get("sources", [])

        supporting, conflicting = self._split_sources(sources)

        claims_text = self._claims_text(claims)
        supporting_text = self._sources_text(supporting, u256(8))
        conflicting_text = self._sources_text(conflicting, u256(5))

        return f"""
You are a professional misinformation analyst and fact-checker.

CONTENT TITLE:
{title}

CONTENT CATEGORY:
{category}

EXTRACTED CLAIMS:
{claims_text if claims_text != "" else "No specific claims extracted"}

SUPPORTING SOURCES ({len(supporting)} found):
{supporting_text if supporting_text != "" else "No supporting sources found"}

CONFLICTING SOURCES ({len(conflicting)} found):
{conflicting_text if conflicting_text != "" else "No conflicting sources found"}

ORIGINAL CONTENT EXCERPT:
{content[:1500]}

Analyse:
1. Are the claims supported by credible evidence?
2. Are the sources consistent or contradictory?
3. Does the content accurately represent the evidence?
4. Are there misinformation signals such as sensationalism, false attribution, cherry-picked data, misleading framing, missing context, or outdated information presented as current?
5. Are there bias signals such as political, commercial, ideological, or confirmation bias?

Return ONLY valid JSON.

Expected JSON object:
{{
  "credibility_score": 0,
  "confidence": 0.0,
  "source_quality": 0,
  "evidence_strength": 0,
  "consistency_score": 0,
  "bias_risk": "LOW",
  "misinformation_risk": "LOW",
  "verdict": "UNVERIFIED",
  "reasoning": "detailed explanation",
  "ai_summary": "1-2 sentence plain English summary",
  "misinformation_signals": [],
  "bias_signals": []
}}
""".strip()

    def _default_analysis(self, reason: str):
        return {
            "credibility_score": 0,
            "confidence": "0.0",
            "source_quality": 0,
            "evidence_strength": 0,
            "consistency_score": 0,
            "bias_risk": "LOW",
            "misinformation_risk": "LOW",
            "verdict": "UNVERIFIED",
            "reasoning": reason,
            "ai_summary": "Credibility could not be fully determined from available evidence.",
            "misinformation_signals": [],
            "bias_signals": [],
        }

    def _deterministic_analysis(self, snapshot):
        sources = snapshot.get("sources", [])
        claims = snapshot.get("claims", [])

        source_count = 0
        total_source_score = 0
        supporting_count = 0
        conflicting_count = 0

        if isinstance(sources, list):
            for source in sources:
                if isinstance(source, dict):
                    score = self._normalise_score_int(source.get("credibility_score", 0))
                    total_source_score = total_source_score + score
                    source_count = source_count + 1

                    if self._safe_bool(source.get("is_supporting", True), True):
                        supporting_count = supporting_count + 1
                    else:
                        conflicting_count = conflicting_count + 1

        source_quality = 0
        if source_count > 0:
            source_quality = total_source_score // source_count

        claim_count = 0
        if isinstance(claims, list):
            claim_count = len(claims)

        evidence_strength = 0
        if source_count > 0:
            evidence_strength = min(100, source_count * 20)

        consistency_score = 50
        if source_count > 0:
            consistency_score = 70

        if conflicting_count > 0:
            consistency_score = 45

        if conflicting_count > supporting_count:
            consistency_score = 25

        raw_credibility = int((source_quality * 60 + evidence_strength * 40) / 100)

        misinformation_risk = "LOW"
        if conflicting_count > supporting_count and source_count > 0:
            misinformation_risk = "HIGH"
        elif conflicting_count > 0:
            misinformation_risk = "MEDIUM"

        bias_risk = "LOW"
        if source_count <= 1:
            bias_risk = "MEDIUM"

        score = self._calculate_score_int(
            raw_credibility,
            source_quality,
            evidence_strength,
            consistency_score,
            source_count,
            claim_count,
        )

        verdict = self._determine_verdict_int(score, misinformation_risk)

        return {
            "credibility_score": score,
            "confidence": "0.55",
            "source_quality": source_quality,
            "evidence_strength": evidence_strength,
            "consistency_score": consistency_score,
            "bias_risk": bias_risk,
            "misinformation_risk": misinformation_risk,
            "verdict": verdict,
            "reasoning": "Deterministic credibility analysis based on available claims and source signals.",
            "ai_summary": "TrustDSource produced a deterministic credibility assessment from the submitted content and available evidence.",
            "misinformation_signals": [],
            "bias_signals": [],
        }

    def _clean_analysis_object(self, raw):
        if not isinstance(raw, dict):
            return self._default_analysis("Analysis failed or returned invalid JSON.")

        misinfo_signals = raw.get("misinformation_signals", [])
        bias_signals = raw.get("bias_signals", [])

        if not isinstance(misinfo_signals, list):
            misinfo_signals = []

        if not isinstance(bias_signals, list):
            bias_signals = []

        cleaned_misinfo = []
        for item in misinfo_signals:
            cleaned_misinfo.append(str(item)[:120])
            if len(cleaned_misinfo) >= 12:
                break

        cleaned_bias = []
        for item in bias_signals:
            cleaned_bias.append(str(item)[:120])
            if len(cleaned_bias) >= 12:
                break

        return {
            "credibility_score": self._normalise_score_int(raw.get("credibility_score", 0)),
            "confidence": self._normalise_decimal_string(raw.get("confidence", "0.0")),
            "source_quality": self._normalise_score_int(raw.get("source_quality", 0)),
            "evidence_strength": self._normalise_score_int(raw.get("evidence_strength", 0)),
            "consistency_score": self._normalise_score_int(raw.get("consistency_score", 0)),
            "bias_risk": self._normalise_bias_risk(str(raw.get("bias_risk", "LOW"))),
            "misinformation_risk": self._normalise_misinfo_risk(
                str(raw.get("misinformation_risk", "LOW"))
            ),
            "verdict": self._normalise_verdict(str(raw.get("verdict", "UNVERIFIED"))),
            "reasoning": str(raw.get("reasoning", ""))[:2000],
            "ai_summary": str(raw.get("ai_summary", ""))[:500],
            "misinformation_signals": cleaned_misinfo,
            "bias_signals": cleaned_bias,
        }

    def _validate_analysis_result(self, leader_result) -> bool:
        try:
            data = leader_result.calldata
        except Exception:
            return False

        if isinstance(data, dict):
            return True

        if isinstance(data, str):
            if len(data) > 20000:
                return False
            return True

        return False

    def _normalise_analysis_result_to_dict(self, result):
        if isinstance(result, dict):
            return result

        if isinstance(result, str):
            cleaned = str(result).strip()

            if cleaned.startswith("```"):
                lines = cleaned.split("\n")

                if len(lines) >= 3:
                    cleaned = "\n".join(lines[1:-1]).strip()

                if cleaned.lower().startswith("json"):
                    cleaned = cleaned[4:].strip()

            try:
                parsed = json.loads(cleaned)

                if isinstance(parsed, dict):
                    return parsed
            except Exception:
                pass

            try:
                start = cleaned.find("{")
                end = cleaned.rfind("}")

                if start >= 0 and end > start:
                    parsed = json.loads(cleaned[start:end + 1])

                    if isinstance(parsed, dict):
                        return parsed
            except Exception:
                pass

        return {}

    @gl.public.write
    def analyse_credibility(self, report_id: str) -> str:
        snapshot = self._get_snapshot(report_id)

        if snapshot == {}:
            return self._json_dumps(self._default_analysis("Report not found."))

        prompt = self.build_verification_prompt(report_id)

        if prompt == "":
            analysis = self._deterministic_analysis(snapshot)
            snapshot["verification_analysis"] = analysis
            snapshot["status"] = "credibility_deterministic"
            self._store_snapshot(report_id, snapshot)
            return self._json_dumps(analysis)

        def leader_fn():
            return gl.nondet.exec_prompt(prompt, response_format="json")

        try:
            result = gl.vm.run_nondet_unsafe(
                leader_fn,
                self._validate_analysis_result,
            )
        except Exception:
            result = {}

        parsed = self._normalise_analysis_result_to_dict(result)

        if parsed == {}:
            analysis = self._deterministic_analysis(snapshot)
        else:
            analysis = self._clean_analysis_object(parsed)

        snapshot["verification_analysis"] = analysis
        snapshot["status"] = "credibility_analyzed"
        self._store_snapshot(report_id, snapshot)

        return self._json_dumps(analysis)

    @gl.public.write
    def use_deterministic_credibility(self, report_id: str) -> str:
        snapshot = self._get_snapshot(report_id)

        if snapshot == {}:
            return self._json_dumps(self._default_analysis("Report not found."))

        analysis = self._deterministic_analysis(snapshot)

        snapshot["verification_analysis"] = analysis
        snapshot["status"] = "credibility_deterministic"
        self._store_snapshot(report_id, snapshot)

        return self._json_dumps(analysis)

    # ==========================================================
    # Scoring engine
    # ==========================================================

    def _calculate_score_int(
        self,
        raw_credibility: int,
        source_quality: int,
        evidence_strength: int,
        consistency_score: int,
        source_count: int,
        claim_count: int,
    ) -> int:
        raw = self._normalise_score_int(raw_credibility)
        sq = self._normalise_score_int(source_quality)
        es = self._normalise_score_int(evidence_strength)
        cs = self._normalise_score_int(consistency_score)

        source_bonus = source_count * 2
        if source_bonus > 10:
            source_bonus = 10

        claim_bonus = claim_count
        if claim_bonus > 5:
            claim_bonus = 5

        weighted_score = (
            raw * 40
            + sq * 25
            + es * 20
            + cs * 15
        ) // 100

        final_score = weighted_score + source_bonus + claim_bonus

        if final_score > 100:
            return 100

        if final_score < 0:
            return 0

        return final_score

    def _determine_verdict_int(self, credibility_score: int, misinformation_risk: str) -> str:
        score = self._normalise_score_int(credibility_score)
        risk = str(misinformation_risk).upper().strip()

        if score >= 80:
            return "HIGH_CREDIBILITY"

        if score >= 55:
            return "MODERATE_CREDIBILITY"

        if score >= 30:
            if risk == "HIGH":
                return "MISLEADING"
            if risk == "CRITICAL":
                return "MISLEADING"

            return "LOW_CREDIBILITY"

        if score > 0:
            return "MISLEADING"

        return "UNVERIFIED"

    @gl.public.view
    def calculate_credibility_score(
        self,
        raw_credibility: u256,
        source_quality: u256,
        evidence_strength: u256,
        consistency_score: u256,
        source_count: u256,
        claim_count: u256,
    ) -> u256:
        score = self._calculate_score_int(
            int(raw_credibility),
            int(source_quality),
            int(evidence_strength),
            int(consistency_score),
            int(source_count),
            int(claim_count),
        )

        return u256(score)

    @gl.public.view
    def determine_verdict(self, credibility_score: u256, misinformation_risk: str) -> str:
        return self._determine_verdict_int(
            int(credibility_score),
            misinformation_risk,
        )

    @gl.public.view
    def calculate_reputation_delta(self, verdict: str) -> u256:
        clean = self._normalise_verdict(verdict)

        if clean == "HIGH_CREDIBILITY":
            return u256(15)
        if clean == "MODERATE_CREDIBILITY":
            return u256(10)
        if clean == "LOW_CREDIBILITY":
            return u256(7)
        if clean == "MISLEADING":
            return u256(5)
        if clean == "UNVERIFIED":
            return u256(3)

        return u256(5)

    @gl.public.view
    def get_reputation_tier(self, score: u256) -> str:
        reputation_score = int(score)

        if reputation_score >= 1000:
            return "verification_expert"

        if reputation_score >= 500:
            return "trusted_researcher"

        if reputation_score >= 200:
            return "researcher"

        if reputation_score >= 50:
            return "analyst"

        return "new"

    # ==========================================================
    # Main report pipeline
    # ==========================================================

    @gl.public.write
    def submit_content(
        self,
        title: str,
        url: str,
        content: str,
        claim_summary: str,
        category: str,
        submitter_wallet: str,
    ) -> str:
        safe_title = self._clean_text(title, u256(200))
        safe_url = self._clean_text(url, u256(500))
        safe_content = self._clean_text(content, u256(3000))
        safe_summary = self._clean_text(claim_summary, u256(1000))
        safe_category = self._normalise_category(category)
        safe_submitter = self._clean_text(submitter_wallet, u256(120))

        content_hash = hashlib.sha256(
            (safe_content + safe_url + safe_summary).encode()
        ).hexdigest()

        report_id = hashlib.sha256(
            (content_hash + ":" + str(int(self.verification_count))).encode()
        ).hexdigest()[:24]

        snapshot = {
            "report_id": report_id,
            "content_hash": content_hash,
            "title": safe_title,
            "url": safe_url,
            "content": safe_content,
            "claim_summary": safe_summary,
            "category": safe_category,
            "submitter_wallet": safe_submitter,
            "snapshot_timestamp": "seq:" + str(int(self.verification_count)),
            "status": "snapshot_locked",
            "locked": True,
            "claims": [],
            "sources": [],
            "verification_analysis": {},
            "final_report": {},
            "verification_hash": "",
            "stored": False,
        }

        self.reports[report_id] = self._json_dumps(snapshot)
        self.verification_index.append(report_id)
        self.verification_count = self.verification_count + u256(1)

        return report_id

    @gl.public.write
    def extract_claims(self, report_id: str) -> str:
        snapshot = self._get_snapshot(report_id)

        if snapshot == {}:
            return "[]"

        claims = self._deterministic_extract_claims_list(
            str(snapshot.get("content", "")),
            str(snapshot.get("claim_summary", "")),
        )

        snapshot["claims"] = claims
        snapshot["status"] = "claims_extracted"
        self._store_snapshot(report_id, snapshot)

        return self._json_dumps(claims)

    @gl.public.write
    def calculate_credibility(self, report_id: str) -> str:
        snapshot = self._get_snapshot(report_id)

        if snapshot == {}:
            return "{}"

        analysis = snapshot.get("verification_analysis", {})

        if not isinstance(analysis, dict) or analysis == {}:
            analysis = self._deterministic_analysis(snapshot)
            snapshot["verification_analysis"] = analysis

        sources = snapshot.get("sources", [])
        claims = snapshot.get("claims", [])

        source_count = 0
        if isinstance(sources, list):
            source_count = len(sources)

        claim_count = 0
        if isinstance(claims, list):
            claim_count = len(claims)

        raw_cred = self._normalise_score_int(analysis.get("credibility_score", 0))
        raw_sq = self._normalise_score_int(analysis.get("source_quality", 0))
        raw_es = self._normalise_score_int(analysis.get("evidence_strength", 0))
        raw_cs = self._normalise_score_int(analysis.get("consistency_score", 0))

        credibility_score = self._calculate_score_int(
            raw_cred,
            raw_sq,
            raw_es,
            raw_cs,
            source_count,
            claim_count,
        )

        misinformation_risk = self._normalise_misinfo_risk(
            str(analysis.get("misinformation_risk", "LOW"))
        )

        verdict = self._determine_verdict_int(
            credibility_score,
            misinformation_risk,
        )

        supporting, conflicting = self._split_sources(sources)

        final_report = {
            "report_id": report_id,
            "content_hash": snapshot.get("content_hash", ""),
            "credibility_score": credibility_score,
            "confidence": analysis.get("confidence", "0.0"),
            "source_quality": raw_sq,
            "evidence_strength": raw_es,
            "consistency_score": raw_cs,
            "bias_risk": self._normalise_bias_risk(str(analysis.get("bias_risk", "LOW"))),
            "misinformation_risk": misinformation_risk,
            "verdict": verdict,
            "supporting_sources": supporting[:10],
            "conflicting_sources": conflicting[:5],
            "reasoning": str(analysis.get("reasoning", ""))[:2000],
            "ai_summary": str(analysis.get("ai_summary", ""))[:500],
            "misinformation_signals": analysis.get("misinformation_signals", []),
            "bias_signals": analysis.get("bias_signals", []),
            "claims": claims,
            "created_at": "seq:" + str(int(self.verification_count)),
        }

        snapshot["final_report"] = final_report
        snapshot["status"] = "complete"
        self._store_snapshot(report_id, snapshot)

        return self._json_dumps(final_report)

    @gl.public.write
    def store_report(self, report_id: str) -> bool:
        snapshot = self._get_snapshot(report_id)

        if snapshot == {}:
            return False

        if snapshot.get("status", "") != "complete":
            return False

        report = snapshot.get("final_report", {})

        if not isinstance(report, dict):
            return False

        verification_hash = hashlib.sha256(
            self._json_dumps(report).encode()
        ).hexdigest()

        snapshot["verification_hash"] = verification_hash
        snapshot["stored_at"] = "seq:" + str(int(self.verification_count))
        snapshot["stored"] = True
        self._store_snapshot(report_id, snapshot)

        analytics_key = "all_time"

        stored_analytics = self.analytics.get(analytics_key, "")

        if stored_analytics == "":
            analytics = {
                "date": analytics_key,
                "total": 0,
                "high_credibility": 0,
                "moderate_credibility": 0,
                "low_credibility": 0,
                "misleading": 0,
                "unverified": 0,
                "total_score": 0,
            }
        else:
            loaded = self._json_loads(stored_analytics)

            if isinstance(loaded, dict):
                analytics = loaded
            else:
                analytics = {
                    "date": analytics_key,
                    "total": 0,
                    "high_credibility": 0,
                    "moderate_credibility": 0,
                    "low_credibility": 0,
                    "misleading": 0,
                    "unverified": 0,
                    "total_score": 0,
                }

        verdict = str(report.get("verdict", "UNVERIFIED")).lower()

        analytics["total"] = int(analytics.get("total", 0)) + 1
        analytics["total_score"] = int(analytics.get("total_score", 0)) + int(
            report.get("credibility_score", 0)
        )

        if verdict == "high_credibility":
            analytics["high_credibility"] = int(analytics.get("high_credibility", 0)) + 1
        elif verdict == "moderate_credibility":
            analytics["moderate_credibility"] = int(analytics.get("moderate_credibility", 0)) + 1
        elif verdict == "low_credibility":
            analytics["low_credibility"] = int(analytics.get("low_credibility", 0)) + 1
        elif verdict == "misleading":
            analytics["misleading"] = int(analytics.get("misleading", 0)) + 1
        else:
            analytics["unverified"] = int(analytics.get("unverified", 0)) + 1

        self.analytics[analytics_key] = self._json_dumps(analytics)

        return True

    @gl.public.write
    def update_reputation(self, wallet_address: str, report_id: str) -> u256:
        wallet = self._clean_text(wallet_address, u256(120))

        current_score = self.reputation.get(wallet, u256(0))

        snapshot = self._get_snapshot(report_id)

        if snapshot == {}:
            return current_score

        report = snapshot.get("final_report", {})

        if not isinstance(report, dict):
            return current_score

        verdict = self._normalise_verdict(str(report.get("verdict", "UNVERIFIED")))
        delta = int(self.calculate_reputation_delta(verdict))

        new_score_int = int(current_score) + delta
        new_score = u256(new_score_int)

        self.reputation[wallet] = new_score

        stored_profile = self.profiles.get(wallet, "")

        if stored_profile == "":
            profile = {
                "wallet": wallet,
                "verifications": 0,
                "reputation_score": 0,
                "last_verification": "",
            }
        else:
            loaded_profile = self._json_loads(stored_profile)

            if isinstance(loaded_profile, dict):
                profile = loaded_profile
            else:
                profile = {
                    "wallet": wallet,
                    "verifications": 0,
                    "reputation_score": 0,
                    "last_verification": "",
                }

        profile["wallet"] = wallet
        profile["verifications"] = int(profile.get("verifications", 0)) + 1
        profile["reputation_score"] = new_score_int
        profile["last_verification"] = report_id

        self.profiles[wallet] = self._json_dumps(profile)

        return new_score

    # ==========================================================
    # One-call flows
    # ==========================================================

    @gl.public.write
    def run_fast_verification(
        self,
        title: str,
        url: str,
        content: str,
        claim_summary: str,
        category: str,
        submitter_wallet: str,
    ) -> str:
        """
        Fast safe flow.
        No AI calls.

        Recommended for demos and reliable UX.
        """
        report_id = self.submit_content(
            title,
            url,
            content,
            claim_summary,
            category,
            submitter_wallet,
        )

        self.extract_claims(report_id)
        self.use_fallback_sources(report_id)
        self.use_deterministic_credibility(report_id)
        final_report = self.calculate_credibility(report_id)
        self.store_report(report_id)
        self.update_reputation(submitter_wallet, report_id)

        return final_report

    @gl.public.write
    def run_ai_verification(
        self,
        title: str,
        url: str,
        content: str,
        claim_summary: str,
        category: str,
        submitter_wallet: str,
        web_results_text: str,
    ) -> str:
        """
        AI-enhanced flow.
        Claim extraction is still deterministic.
        Source analysis and credibility analysis may use AI.
        """
        report_id = self.submit_content(
            title,
            url,
            content,
            claim_summary,
            category,
            submitter_wallet,
        )

        self.extract_claims(report_id)
        self.analyse_sources(report_id, web_results_text)
        self.analyse_credibility(report_id)
        final_report = self.calculate_credibility(report_id)
        self.store_report(report_id)
        self.update_reputation(submitter_wallet, report_id)

        return final_report

    # ==========================================================
    # Views
    # ==========================================================

    @gl.public.view
    def get_report(self, report_id: str) -> str:
        snapshot = self._get_snapshot(report_id)

        if snapshot == {}:
            return "{}"

        final_report = snapshot.get("final_report", {})

        if isinstance(final_report, dict) and final_report != {}:
            report = final_report
        else:
            report = {
                "report_id": report_id,
                "content_hash": snapshot.get("content_hash", ""),
                "verification_hash": snapshot.get("verification_hash", ""),
                "snapshot_timestamp": snapshot.get("snapshot_timestamp", ""),
                "status": snapshot.get("status", ""),
                "title": snapshot.get("title", ""),
                "url": snapshot.get("url", ""),
                "category": snapshot.get("category", ""),
                "submitter_wallet": snapshot.get("submitter_wallet", ""),
                "credibility_score": 0,
                "confidence": "0.0",
                "source_quality": 0,
                "evidence_strength": 0,
                "consistency_score": 0,
                "bias_risk": "",
                "misinformation_risk": "",
                "verdict": "UNVERIFIED",
                "supporting_sources": [],
                "conflicting_sources": [],
                "reasoning": "",
                "ai_summary": "",
                "claims": snapshot.get("claims", []),
                "created_at": "",
            }

        report["verification_hash"] = snapshot.get("verification_hash", "")
        report["snapshot_timestamp"] = snapshot.get("snapshot_timestamp", "")
        report["status"] = snapshot.get("status", "")
        report["title"] = snapshot.get("title", "")
        report["url"] = snapshot.get("url", "")
        report["category"] = snapshot.get("category", "")
        report["submitter_wallet"] = snapshot.get("submitter_wallet", "")

        return self._json_dumps(report)

    @gl.public.view
    def get_snapshot(self, report_id: str) -> str:
        snapshot = self._get_snapshot(report_id)

        if snapshot == {}:
            return "{}"

        return self._json_dumps(snapshot)

    @gl.public.view
    def get_profile(self, wallet_address: str) -> str:
        wallet = self._clean_text(wallet_address, u256(120))
        reputation_score = int(self.reputation.get(wallet, u256(0)))

        tier = self.get_reputation_tier(u256(reputation_score))

        stored_profile = self.profiles.get(wallet, "")

        if stored_profile == "":
            profile = {
                "wallet_address": wallet,
                "reputation_score": reputation_score,
                "reputation_tier": tier,
                "total_verifications": 0,
                "last_verification": "",
            }
        else:
            loaded = self._json_loads(stored_profile)

            if isinstance(loaded, dict):
                profile = {
                    "wallet_address": wallet,
                    "reputation_score": reputation_score,
                    "reputation_tier": tier,
                    "total_verifications": int(loaded.get("verifications", 0)),
                    "last_verification": str(loaded.get("last_verification", "")),
                }
            else:
                profile = {
                    "wallet_address": wallet,
                    "reputation_score": reputation_score,
                    "reputation_tier": tier,
                    "total_verifications": 0,
                    "last_verification": "",
                }

        return self._json_dumps(profile)

    @gl.public.view
    def get_analytics(self, analytics_key: str) -> str:
        key = self._clean_text(analytics_key, u256(80))

        if key == "":
            key = "all_time"

        stored = self.analytics.get(key, "")

        if stored == "":
            analytics = {
                "date": key,
                "total": 0,
                "high_credibility": 0,
                "moderate_credibility": 0,
                "low_credibility": 0,
                "misleading": 0,
                "unverified": 0,
                "total_score": 0,
                "avg_score": 0,
            }

            return self._json_dumps(analytics)

        loaded = self._json_loads(stored)

        if not isinstance(loaded, dict):
            return "{}"

        total = int(loaded.get("total", 0))
        total_score = int(loaded.get("total_score", 0))

        avg_score = 0
        if total > 0:
            avg_score = total_score // total

        loaded["avg_score"] = avg_score

        return self._json_dumps(loaded)

    @gl.public.view
    def get_total_verifications(self) -> u256:
        return self.verification_count

    @gl.public.view
    def get_report_id_at(self, index: u256) -> str:
        idx = int(index)
        total = len(self.verification_index)

        if idx >= total:
            return ""

        return self.verification_index[idx]

    @gl.public.view
    def get_recent_report_ids(self, limit: u256) -> str:
        total = len(self.verification_index)
        lim = int(limit)

        if lim <= 0:
            return "[]"

        if lim > 25:
            lim = 25

        start = total - lim

        if start < 0:
            start = 0

        result = []
        i = start

        while i < total:
            result.append(self.verification_index[i])
            i = i + 1

        return self._json_dumps(result)
