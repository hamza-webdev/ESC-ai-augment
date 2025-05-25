import unittest
from unittest.mock import Mock, PropertyMock
from datetime import date

# Assuming models are in backend.app.models path
# Adjust these imports if your project structure is different
# For these tests, we are testing the classes directly, not through SQLAlchemy's db interaction.
# So we need to import the classes themselves.
# If direct instantiation is problematic due to db.Column or other SQLAlchemy specifics
# that are not easily separable for pure Python object testing, this approach might need adjustment.

from app.models.user import User
from app.models.player import Player
from app.models.match import PlayerStats # PlayerStats is in match.py

class TestModelProperties(unittest.TestCase):

    def test_player_full_name(self):
        # Case 1: Player has an associated user_account
        mock_user = Mock(spec=User)
        # Mocking the full_name property on the User instance
        type(mock_user).full_name = PropertyMock(return_value="Test User")
        
        # Player requires user_id, position, birth_date, nationality
        # We provide dummy values as we are not testing DB interactions
        player = Player(user_id=1, position='ST', birth_date=date(2000, 1, 1), nationality='Testland')
        player.user_account = mock_user # Manually assign the mocked user object

        self.assertEqual(player.full_name, "Test User")

        # Case 2: Player has no associated user_account
        player_no_user = Player(user_id=2, position='GK', birth_date=date(1999, 1, 1), nationality='Testlandia')
        player_no_user.user_account = None # Explicitly set to None

        self.assertEqual(player_no_user.full_name, "Unknown")

    def test_player_stats_to_dict_includes_player_name(self):
        # Case 1: PlayerStats has an associated player with a full_name
        mock_player_with_name = Mock(spec=Player)
        # Mocking the full_name property on the Player instance
        type(mock_player_with_name).full_name = PropertyMock(return_value="Player Name")

        # PlayerStats requires player_id, match_id
        stats = PlayerStats(player_id=1, match_id=1)
        stats.player = mock_player_with_name # Manually assign the mocked player object

        stats_dict = stats.to_dict()
        self.assertIn('player_name', stats_dict)
        self.assertEqual(stats_dict['player_name'], "Player Name")

        # Case 2: PlayerStats has no associated player
        stats_no_player = PlayerStats(player_id=2, match_id=2)
        stats_no_player.player = None # Explicitly set to None

        stats_no_player_dict = stats_no_player.to_dict()
        self.assertIn('player_name', stats_no_player_dict)
        self.assertIsNone(stats_no_player_dict['player_name'])
        
    def test_user_full_name_property(self):
        # Test the User.full_name property directly
        # User requires username, email, password, first_name, last_name
        user = User(username="testuser", email="test@example.com", password="password",
                    first_name="First", last_name="Last")
        self.assertEqual(user.full_name, "First Last")

        user_no_last = User(username="testuser2", email="test2@example.com", password="password",
                            first_name="FirstOnly", last_name="")
        self.assertEqual(user_no_last.full_name, "FirstOnly ") # Note: space if last_name is empty string
        
        # To handle the trailing space issue, let's refine User.full_name or the test
        # User.full_name is: return f"{self.first_name} {self.last_name}"
        # If last_name is "", it becomes "FirstName "
        # A better User.full_name might be: return f"{self.first_name} {self.last_name}".strip()
        # The current User.full_name in user.py is already f"{self.first_name} {self.last_name}",
        # which will produce "FirstOnly " if last_name is "". The prompt's code has this version.
        # If User.full_name was f"{self.first_name} {self.last_name}".strip()
        # self.assertEqual(user_no_last.full_name, "FirstOnly")
        # For now, testing against current actual behavior.

if __name__ == '__main__':
    unittest.main()
