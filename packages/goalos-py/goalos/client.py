"""
HTTP client for GoalOS Cloud API (future integration)
"""

from typing import Any, Dict, Optional
from urllib.parse import urljoin

try:
    import httpx
except ImportError:
    httpx = None  # type: ignore


class GoalOSClient:
    """HTTP client for GoalOS Cloud API"""

    def __init__(
        self,
        base_url: str = "https://api.goalos.io",
        api_key: Optional[str] = None,
        timeout: float = 10.0,
    ):
        """Initialize the client"""
        if httpx is None:
            raise ImportError("httpx is required for GoalOS Cloud API client")

        self.base_url = base_url
        self.api_key = api_key
        self.timeout = timeout
        self._client: Optional[httpx.Client] = None

    def _get_client(self) -> httpx.Client:
        """Get or create HTTP client"""
        if self._client is None:
            headers = {}
            if self.api_key:
                headers["Authorization"] = f"Bearer {self.api_key}"

            self._client = httpx.Client(
                base_url=self.base_url,
                headers=headers,
                timeout=self.timeout,
            )

        return self._client

    async def get_graph(self, graph_id: str) -> Dict[str, Any]:
        """Fetch an intent graph from the API"""
        url = urljoin(self.base_url, f"/api/v1/graphs/{graph_id}")
        response = self._get_client().get(url)
        response.raise_for_status()
        return response.json()

    async def create_graph(
        self,
        owner: str,
        name: Optional[str] = None,
        data: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Create a new intent graph via API"""
        url = urljoin(self.base_url, "/api/v1/graphs")
        payload = {
            "owner": owner,
            "name": name,
            **(data or {}),
        }
        response = self._get_client().post(url, json=payload)
        response.raise_for_status()
        return response.json()

    async def update_graph(
        self,
        graph_id: str,
        data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Update an intent graph via API"""
        url = urljoin(self.base_url, f"/api/v1/graphs/{graph_id}")
        response = self._get_client().put(url, json=data)
        response.raise_for_status()
        return response.json()

    async def list_goals(self, graph_id: str) -> Dict[str, Any]:
        """List goals in a graph via API"""
        url = urljoin(self.base_url, f"/api/v1/graphs/{graph_id}/goals")
        response = self._get_client().get(url)
        response.raise_for_status()
        return response.json()

    async def add_goal(self, graph_id: str, goal_data: Dict[str, Any]) -> Dict[str, Any]:
        """Add a goal via API"""
        url = urljoin(self.base_url, f"/api/v1/graphs/{graph_id}/goals")
        response = self._get_client().post(url, json=goal_data)
        response.raise_for_status()
        return response.json()

    async def update_goal(
        self,
        graph_id: str,
        goal_id: str,
        updates: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Update a goal via API"""
        url = urljoin(self.base_url, f"/api/v1/graphs/{graph_id}/goals/{goal_id}")
        response = self._get_client().put(url, json=updates)
        response.raise_for_status()
        return response.json()

    async def complete_goal(
        self,
        graph_id: str,
        goal_id: str,
    ) -> Dict[str, Any]:
        """Complete a goal via API"""
        url = urljoin(self.base_url, f"/api/v1/graphs/{graph_id}/goals/{goal_id}/complete")
        response = self._get_client().post(url)
        response.raise_for_status()
        return response.json()

    def close(self) -> None:
        """Close the HTTP client"""
        if self._client:
            self._client.close()
            self._client = None

    def __enter__(self) -> "GoalOSClient":
        """Context manager entry"""
        return self

    def __exit__(self, *args: Any) -> None:
        """Context manager exit"""
        self.close()
