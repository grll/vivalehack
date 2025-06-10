import json
import os
import logging
from typing import Dict, Any, Optional
from datetime import datetime

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
            initial_data = {}  # Start with empty object instead of array structure
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
            return {}
    
    def _save_data(self, data: Dict) -> None:
        """Save data to storage file"""
        try:
            with open(self.storage_path, 'w') as f:
                json.dump(data, f, indent=2, default=str)
            logger.debug("User data saved successfully")
        except Exception as e:
            logger.error(f"Failed to save user storage file: {e}")
            raise
    
    def save_profile(self, profile_url: str, profile_data: Dict[str, Any]) -> None:
        """Save LinkedIn profile data to storage"""
        try:
            # Create complete profile data with metadata
            complete_profile = {
                **profile_data,  # Include all scraped data
                "profileUrl": profile_url,
                "timestamp": datetime.utcnow().isoformat(),
                "lastUpdated": datetime.utcnow().isoformat()
            }
            
            # Save as single object, not array
            self._save_data(complete_profile)
            
            first_name = profile_data.get("firstName", "")
            last_name = profile_data.get("lastName", "")
            logger.info(f"Profile saved: {first_name} {last_name} ({profile_url})")
            logger.info(f"Total fields saved: {len(complete_profile)}")
            
        except Exception as e:
            logger.error(f"Failed to save profile: {e}")
            raise
    
    def get_profile(self) -> Optional[Dict[str, Any]]:
        """Get the saved profile data"""
        try:
            data = self._load_data()
            return data if data else None
        except Exception as e:
            logger.error(f"Failed to get profile: {e}")
            return None
    
    def profile_exists(self, profile_url: str = None) -> bool:
        """Check if profile data exists"""
        try:
            data = self._load_data()
            if not data:
                return False
            
            # If profile_url is provided, check if it matches
            if profile_url:
                return data.get("profileUrl") == profile_url
            
            # Otherwise, check if any profile data exists
            return bool(data)
            
        except Exception as e:
            logger.error(f"Failed to check profile existence: {e}")
            return False
    
    def clear_profile(self) -> None:
        """Clear all profile data"""
        try:
            self._save_data({})
            logger.info("Profile data cleared")
        except Exception as e:
            logger.error(f"Failed to clear profile data: {e}")
            raise

# Global storage service instance
user_storage = UserStorageService() 