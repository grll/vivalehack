import httpx
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

class LinkedInService:
    """Service for LinkedIn profile scraping using Apify API"""
    
    def __init__(self):
        """Initialize the LinkedIn service"""
        self.apify_token = "apify_api_9E6iAR5jgVPNYwnHEcD0ZIPw5gAxAr4BoTkm"
        self.apify_url = "https://api.apify.com/v2/acts/dev_fusion~linkedin-profile-scraper/run-sync-get-dataset-items"
        self.timeout = 60.0  # 60 seconds timeout
    
    async def scrape_profile(self, profile_url: str) -> Dict[str, Any]:
        """
        Scrape LinkedIn profile data using Apify API
        
        Args:
            profile_url: LinkedIn profile URL to scrape
            
        Returns:
            Dict containing all profile data from Apify API
            
        Raises:
            Exception: If scraping fails or data is not found
        """
        try:
            logger.info(f"Scraping LinkedIn profile: {profile_url}")
            
            # Prepare request data
            request_data = {
                "profileUrls": [profile_url]
            }
            
            # Make request to Apify API
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    self.apify_url,
                    params={"token": self.apify_token, "method": "POST"},
                    headers={"Content-Type": "application/json"},
                    json=request_data
                )
                
                logger.info(f"Apify API response status: {response.status_code}")
                
                if response.status_code not in [200, 201]:
                    logger.error(f"Apify API error: {response.status_code} - {response.text}")
                    raise Exception(f"Apify API request failed with status {response.status_code}")
                
                # Parse response
                response_data = response.json()
                logger.debug(f"Apify API response: {response_data}")
                
                print(response_data)
                # Extract profile data
                if not response_data or not isinstance(response_data, list) or len(response_data) == 0:
                    raise Exception("No profile data returned from Apify API")
                
                profile_data = response_data[0]  # Get first (and only) profile
                
                # Ensure we have essential name fields for backward compatibility
                first_name = profile_data.get("firstName", "").strip()
                last_name = profile_data.get("lastName", "").strip()
                
                if not first_name and not last_name:
                    # Try alternative field names
                    full_name = profile_data.get("fullName", "").strip()
                    name = profile_data.get("name", "").strip()
                    
                    if full_name:
                        name_parts = full_name.split(" ", 1)
                        first_name = name_parts[0] if len(name_parts) > 0 else ""
                        last_name = name_parts[1] if len(name_parts) > 1 else ""
                    elif name:
                        name_parts = name.split(" ", 1)
                        first_name = name_parts[0] if len(name_parts) > 0 else ""
                        last_name = name_parts[1] if len(name_parts) > 1 else ""
                    
                    # Update the profile data with extracted names
                    if first_name:
                        profile_data["firstName"] = first_name
                    if last_name:
                        profile_data["lastName"] = last_name
                
                if not first_name and not last_name:
                    logger.error(f"Could not extract name from profile data: {profile_data}")
                    raise Exception("Could not extract firstName and lastName from profile data")
                
                logger.info(f"Successfully scraped profile: {first_name} {last_name}")
                logger.info(f"Total fields in profile: {len(profile_data)}")
                
                return profile_data
                
        except httpx.TimeoutException:
            logger.error("Timeout while scraping LinkedIn profile")
            raise Exception("Request timeout while scraping LinkedIn profile")
        except httpx.RequestError as e:
            logger.error(f"Request error while scraping LinkedIn profile: {e}")
            raise Exception(f"Network error while scraping LinkedIn profile: {str(e)}")
        except Exception as e:
            logger.error(f"Error scraping LinkedIn profile: {e}")
            raise Exception(f"Failed to scrape LinkedIn profile: {str(e)}")

# Global service instance
linkedin_service = LinkedInService() 