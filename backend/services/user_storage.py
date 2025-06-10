import json
import os
import logging
from typing import Dict, List, Optional
from datetime import datetime

from models import LinkedInProfileResponse

logger = logging.getLogger(__name__)

class UserStorageService:
    """Service for managing user data storage in JSON file"""
    
    def __init__(self, storage_file: str = "user.json"):
        """Initialize the user storage service"""
        self.storage_file = storage_file
        self.storage_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), storage_file)
        self._ensure_storage_file()
    
    def _ensure_storage_file(self) -> None:
        """Ensure the storage file exists with proper structure"""
        if not os.path.exists(self.storage_path):
            initial_data = {"profiles": []}
            try:
                with open(self.storage_path, 'w') as f:
                    json.dump(initial_data, f, indent=2)
                logger.info(f"Created new user storage file: {self.storage_path}")
            except Exception as e:
                logger.error(f"Failed to create user storage file: {e}")
                raise
    
    def _load_data(self) -> Dict:
        """Load data from storage file"""
        try:
            with open(self.storage_path, 'r') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Failed to load user storage file: {e}")
            return {"profiles": []}
    
    def _save_data(self, data: Dict) -> None:
        """Save data to storage file"""
        try:
            with open(self.storage_path, 'w') as f:
                json.dump(data, f, indent=2, default=str)
            logger.debug("User data saved successfully")
        except Exception as e:
            logger.error(f"Failed to save user storage file: {e}")
            raise
    
    def save_profile(self, profile_url: str, profile_data: LinkedInProfileResponse) -> None:
        """Save LinkedIn profile data to storage"""
        try:
            data = self._load_data()
            
            # Create profile entry
            profile_entry = {
                "profileUrl": profile_url,
                "firstName": profile_data.firstName,
                "lastName": profile_data.lastName,
                "timestamp": datetime.utcnow().isoformat(),
                "id": len(data["profiles"]) + 1  # Simple incrementing ID
            }
            
            # Add to profiles list
            data["profiles"].append(profile_entry)
            
            # Save data
            self._save_data(data)
            
            logger.info(f"Profile saved: {profile_data.firstName} {profile_data.lastName} ({profile_url})")
            
        except Exception as e:
            logger.error(f"Failed to save profile: {e}")
            raise
    
    def get_all_profiles(self) -> List[Dict]:
        """Get all saved profiles"""
        try:
            data = self._load_data()
            return data.get("profiles", [])
        except Exception as e:
            logger.error(f"Failed to get profiles: {e}")
            return []
    
    def profile_exists(self, profile_url: str) -> bool:
        """Check if a profile URL has already been scraped"""
        try:
            data = self._load_data()
            profiles = data.get("profiles", [])
            return any(profile.get("profileUrl") == profile_url for profile in profiles)
        except Exception as e:
            logger.error(f"Failed to check profile existence: {e}")
            return False

# Global storage service instance
user_storage = UserStorageService() 