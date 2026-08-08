"""
Async HTTP client wrapping the Zerops REST API.
"""
import logging
import os
from typing import Any

import httpx

logger = logging.getLogger(__name__)

ZEROPS_API_BASE = os.environ.get(
    "ZEROPS_API_BASE",
    "https://api.app-prg1.zerops.io/api/rest/public",
)


class ZeropsClient:
    """Thin async wrapper around the Zerops REST API."""

    def __init__(self, token: str):
        self._token = token
        self._client = httpx.AsyncClient(
            base_url=ZEROPS_API_BASE,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
            timeout=20.0,
        )

    async def close(self):
        await self._client.aclose()

    async def _get(self, path: str, params: dict | None = None) -> Any:
        try:
            response = await self._client.get(path, params=params)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as exc:
            logger.warning("Zerops API HTTP %s on %s", exc.response.status_code, path)
            raise
        except httpx.RequestError as exc:
            logger.warning("Zerops API request error on %s: %s", path, exc)
            raise

    async def get_project(self, project_id: str) -> dict:
        try:
            data = await self._get(f"/project/{project_id}")
            return data.get("output", data)
        except Exception:
            return {}

    async def get_services(self, project_id: str) -> list[dict]:
        try:
            data = await self._get(f"/project/{project_id}/service-stack")
            if isinstance(data, list):
                return data
            if isinstance(data, dict):
                output = data.get("output", data)
                if isinstance(output, list):
                    return output
                if isinstance(output, dict):
                    return output.get("items", output.get("serviceStacks", []))
            return []
        except Exception as exc:
            logger.warning("get_services failed: %s", exc)
            return []

    async def get_app_versions(self, service_id: str, limit: int = 5) -> list[dict]:
        try:
            data = await self._get(
                "/app-version",
                params={"serviceStackId": service_id, "limit": limit},
            )
            output = data.get("output", data)
            if isinstance(output, dict):
                return output.get("items", [])
            if isinstance(output, list):
                return output
            return []
        except Exception:
            return []
