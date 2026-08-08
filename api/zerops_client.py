"""
Async HTTP client wrapping the Zerops REST API.

Auth: Bearer token from ZEROPS_API_TOKEN env var.
Base URL: https://api.app-prg1.zerops.io/api/rest/public
  (This is the global API endpoint — same regardless of which datacenter
   your project's containers run in.)

Key endpoints used:
  GET /project/{project_id}/service-stack   → list of services + status
  GET /app-version?serviceStackId={id}      → recent pipeline events per service
  GET /project/{project_id}                 → project metadata (name, etc.)
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

    # ------------------------------------------------------------------
    # Raw helpers
    # ------------------------------------------------------------------

    async def _get(self, path: str, params: dict | None = None) -> Any:
        """GET a path, return parsed JSON or raise on HTTP error."""
        try:
            response = await self._client.get(path, params=params)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as exc:
            logger.error(
                "Zerops API HTTP %s on %s: %s",
                exc.response.status_code,
                path,
                exc.response.text[:500],
            )
            raise
        except httpx.RequestError as exc:
            logger.error("Zerops API request error on %s: %s", path, exc)
            raise

    # ------------------------------------------------------------------
    # Domain methods
    # ------------------------------------------------------------------

    async def get_project(self, project_id: str) -> dict:
        """Return project metadata dict."""
        data = await self._get(f"/project/{project_id}")
        return data.get("output", data)

    async def get_services(self, project_id: str) -> list[dict]:
        """
        Return list of service dicts for a project.
        Endpoint: GET /project/{projectId}/service-stack
        Response wraps items in data.output.items or data.items depending on version.
        """
        data = await self._get(f"/project/{project_id}/service-stack")
        # Zerops typically wraps lists in {"output": {"items": [...]}}
        # but guard against both shapes
        output = data.get("output", data)
        if isinstance(output, dict):
            return output.get("items", [])
        if isinstance(output, list):
            return output
        return []

    async def get_app_versions(
        self,
        service_id: str,
        limit: int = 5,
    ) -> list[dict]:
        """
        Return recent app-version records (pipeline events) for a service.
        Endpoint: GET /app-version?serviceStackId={id}&limit={n}
        """
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
        except httpx.HTTPStatusError:
            # If the service has never been deployed, 404 is normal
            return []

    async def get_user_notifications(self, limit: int = 20) -> list[dict]:
        """
        Return recent platform-level notifications.
        Endpoint: GET /user-notification
        """
        try:
            data = await self._get("/user-notification", params={"limit": limit})
            output = data.get("output", data)
            if isinstance(output, dict):
                return output.get("items", [])
            if isinstance(output, list):
                return output
            return []
        except Exception:
            return []
