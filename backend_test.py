#!/usr/bin/env python3

import requests
import sys
import json
from pathlib import Path
from datetime import datetime

class MoviaAPITester:
    def __init__(self, base_url="https://trip-segment-calc.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.sample_data_dir = Path("/app/data")
        self.expected_results = self.load_expected_results()
        self.auth_token = None
        self.test_user_id = None

    def load_expected_results(self):
        """Load expected results from Phase 1 POC"""
        try:
            with open("/app/tests/phase1_poc_result.json", "r") as f:
                return json.load(f)
        except Exception as e:
            print(f"Warning: Could not load expected results: {e}")
            return None

    def run_test(self, name, method, endpoint, expected_status, files=None, data=None, auth_required=False):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {}
        
        if auth_required and self.auth_token:
            headers['Authorization'] = f'Bearer {self.auth_token}'
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files, data=data, headers=headers)
                else:
                    headers['Content-Type'] = 'application/json'
                    response = requests.post(url, json=data, headers=headers)
            elif method == 'PATCH':
                headers['Content-Type'] = 'application/json'
                response = requests.patch(url, json=data, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json()
                except:
                    return True, response.text
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"Response: {response.text[:500]}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_login_with_owner_credentials(self):
        """Test login with seeded owner credentials"""
        success, result = self.run_test(
            "Owner Login", 
            "POST", 
            "auth/login", 
            200,
            data={"username": "owner", "password": "Owner123!"}
        )
        
        if success and result:
            self.auth_token = result.get("access_token")
            user = result.get("user", {})
            if user.get("role") == "owner":
                print(f"✅ Owner login successful, role: {user.get('role')}")
            else:
                print(f"❌ Expected owner role, got: {user.get('role')}")
        
        return success, result

    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        return self.run_test(
            "Invalid Login", 
            "POST", 
            "auth/login", 
            401,
            data={"username": "invalid", "password": "wrongpassword123"}
        )

    def test_protected_endpoint_without_auth(self):
        """Test that protected endpoints reject unauthenticated requests"""
        return self.run_test(
            "Analyze Without Auth", 
            "POST", 
            "analyze", 
            401,
            data={"home_lat": 55.0, "home_lon": 11.0}
        )

    def test_admin_list_users(self):
        """Test admin user listing"""
        return self.run_test(
            "Admin List Users", 
            "GET", 
            "admin/users", 
            200,
            auth_required=True
        )

    def test_admin_create_user(self):
        """Test admin user creation"""
        timestamp = datetime.now().strftime("%H%M%S")
        username = f"testuser_{timestamp}"
        
        success, result = self.run_test(
            "Admin Create User", 
            "POST", 
            "admin/users", 
            200,
            data={"username": username, "password": "TestPass123!", "role": "user"},
            auth_required=True
        )
        
        if success and result:
            user = result.get("user", {})
            self.test_user_id = user.get("id")
            print(f"✅ Created test user: {username} with ID: {self.test_user_id}")
        
        return success, result

    def test_admin_deactivate_user(self):
        """Test admin user deactivation"""
        if not self.test_user_id:
            print("❌ No test user ID available for deactivation test")
            return False, {}
        
        return self.run_test(
            "Admin Deactivate User", 
            "PATCH", 
            f"admin/users/{self.test_user_id}", 
            200,
            data={"is_active": False},
            auth_required=True
        )

    def test_deactivated_user_login(self):
        """Test that deactivated user cannot login"""
        timestamp = datetime.now().strftime("%H%M%S")
        username = f"testuser_{timestamp}"
        
        # First create a user
        success, result = self.run_test(
            "Create User for Deactivation Test", 
            "POST", 
            "admin/users", 
            200,
            data={"username": username, "password": "TestPass123!", "role": "user"},
            auth_required=True
        )
        
        if not success:
            return False, {}
        
        user_id = result.get("user", {}).get("id")
        
        # Deactivate the user
        success, _ = self.run_test(
            "Deactivate Test User", 
            "PATCH", 
            f"admin/users/{user_id}", 
            200,
            data={"is_active": False},
            auth_required=True
        )
        
        if not success:
            return False, {}
        
        # Try to login with deactivated user
        return self.run_test(
            "Deactivated User Login", 
            "POST", 
            "auth/login", 
            403,
            data={"username": username, "password": "TestPass123!"}
        )

    def test_root_endpoint(self):
        """Test root endpoint"""
        return self.run_test("Root Endpoint", "GET", "", 200)

    def test_health_endpoint(self):
        """Test health endpoint"""
        return self.run_test("Health Check", "GET", "health", 200)
    def test_analyze_endpoint_with_sample_files(self):
        """Test analyze endpoint with sample files"""
        gps_file_path = self.sample_data_dir / "sample_gps.csv"
        webtrack_file_path = self.sample_data_dir / "sample_webtrack.pdf"
        
        if not gps_file_path.exists():
            print(f"❌ GPS sample file not found: {gps_file_path}")
            return False, {}
        
        if not webtrack_file_path.exists():
            print(f"❌ WebTrack sample file not found: {webtrack_file_path}")
            return False, {}

        # Use coordinates near Marskvej 9, 4700 Næstved (from expected results)
        home_lat = 55.225517
        home_lon = 11.747365
        
        files = {
            'gps_file': ('sample_gps.csv', open(gps_file_path, 'rb'), 'text/csv'),
            'webtrack_file': ('sample_webtrack.pdf', open(webtrack_file_path, 'rb'), 'application/pdf')
        }
        
        data = {
            'home_lat': home_lat,
            'home_lon': home_lon,
            'radius_m': 300,
            'dwell_minutes': 10,
            'stable_points': 3
        }
        
        try:
            success, result = self.run_test(
                "Analyze with Sample Files (Authenticated)", 
                "POST", 
                "analyze", 
                200, 
                files=files, 
                data=data,
                auth_required=True
            )
            
            # Close file handles
            for file_obj in files.values():
                if hasattr(file_obj[1], 'close'):
                    file_obj[1].close()
            
            if success and result:
                self.validate_analysis_results(result)
            
            return success, result
            
        except Exception as e:
            print(f"❌ Error in analyze test: {e}")
            # Close file handles in case of error
            for file_obj in files.values():
                if hasattr(file_obj[1], 'close'):
                    file_obj[1].close()
            return False, {}

    def test_analyze_with_private_trip_override(self):
        """Test analyze endpoint with private trip override"""
        gps_file_path = self.sample_data_dir / "sample_gps.csv"
        webtrack_file_path = self.sample_data_dir / "sample_webtrack.pdf"
        
        if not gps_file_path.exists() or not webtrack_file_path.exists():
            print("❌ Sample files not found for private trip test")
            return False, {}

        home_lat = 55.225517
        home_lon = 11.747365
        
        # Add manual private trip interval 12:00-12:30
        private_trip_overrides = [{"start_time": "12:00", "end_time": "12:30"}]
        
        files = {
            'gps_file': ('sample_gps.csv', open(gps_file_path, 'rb'), 'text/csv'),
            'webtrack_file': ('sample_webtrack.pdf', open(webtrack_file_path, 'rb'), 'application/pdf')
        }
        
        data = {
            'home_lat': home_lat,
            'home_lon': home_lon,
            'radius_m': 300,
            'dwell_minutes': 10,
            'stable_points': 3,
            'private_trip_overrides': json.dumps(private_trip_overrides)
        }
        
        try:
            success, result = self.run_test(
                "Analyze with Private Trip Override", 
                "POST", 
                "analyze", 
                200, 
                files=files, 
                data=data,
                auth_required=True
            )
            
            # Close file handles
            for file_obj in files.values():
                if hasattr(file_obj[1], 'close'):
                    file_obj[1].close()
            
            if success and result:
                # Validate private trip was applied
                private_trips = result.get("private_trips", [])
                if private_trips:
                    print(f"✅ Private trip applied: {private_trips}")
                    # Check if segments were split (should be 2 segments now)
                    segment_count = result.get("segment_count", 0)
                    if segment_count == 2:
                        print("✅ Segments correctly split by private trip")
                    else:
                        print(f"❌ Expected 2 segments after private trip, got {segment_count}")
                    
                    # Check if total work time was reduced
                    total_minutes = result.get("total_work_minutes", 0)
                    if total_minutes == 131:  # Expected from manual verification
                        print(f"✅ Total work time correctly reduced to {total_minutes} minutes")
                    else:
                        print(f"❌ Expected 131 minutes after private trip, got {total_minutes}")
                else:
                    print("❌ Private trip not applied in results")
            
            return success, result
            
        except Exception as e:
            print(f"❌ Error in private trip test: {e}")
            for file_obj in files.values():
                if hasattr(file_obj[1], 'close'):
                    file_obj[1].close()
            return False, {}

    def validate_analysis_results(self, result):
        """Validate analysis results against expected values"""
        print("\n📊 Validating Analysis Results:")
        
        if not self.expected_results:
            print("⚠️  No expected results to compare against")
            return
        
        # Check key metrics
        validations = [
            ("Segment Count", result.get("segment_count"), self.expected_results.get("segment_count")),
            ("Start Time", result.get("computed_start_time"), self.expected_results.get("computed_start_time")),
            ("End Time", result.get("computed_end_time"), self.expected_results.get("computed_end_time")),
            ("Total Work Minutes", result.get("total_work_minutes"), self.expected_results.get("total_work_minutes")),
            ("Run Number", result.get("webtrack_summary", {}).get("primary_run_number"), 
             self.expected_results.get("webtrack_summary", {}).get("primary_run_number")),
            ("Order Number", result.get("webtrack_summary", {}).get("primary_order_number"), 
             self.expected_results.get("webtrack_summary", {}).get("primary_order_number"))
        ]
        
        for name, actual, expected in validations:
            if actual == expected:
                print(f"✅ {name}: {actual} (matches expected)")
            else:
                print(f"❌ {name}: {actual} (expected: {expected})")
        
        # Check stop numbers
        actual_stops = result.get("webtrack_summary", {}).get("stop_numbers", [])
        expected_stops = self.expected_results.get("webtrack_summary", {}).get("stop_numbers", [])
        
        if set(actual_stops) == set(expected_stops):
            print(f"✅ Stop Numbers: {actual_stops} (matches expected)")
        else:
            print(f"❌ Stop Numbers: {actual_stops} (expected: {expected_stops})")
        
        # Check Danish correction text
        correction_text = result.get("movia_correction_text", "")
        if correction_text and "unknown: None" not in correction_text:
            print("✅ Danish correction text generated without 'unknown: None'")
        else:
            print("❌ Danish correction text missing or contains 'unknown: None'")
        
        # Check end time basis
        end_basis = result.get("end_time_basis_label", "")
        if "Første gyldige indkørsel i hjemmezone" in end_basis:
            print("✅ End time based on first valid home-zone entry")
        else:
            print(f"❌ End time basis: {end_basis}")

    def test_analyze_endpoint_validation(self):
        """Test analyze endpoint validation"""
        print("\n🔍 Testing API Validation:")
        
        # Test missing files (with auth)
        success, _ = self.run_test(
            "Missing GPS File", 
            "POST", 
            "analyze", 
            422,  # FastAPI validation error
            data={'home_lat': 55.0, 'home_lon': 11.0},
            auth_required=True
        )
        
        # Test invalid radius (with auth)
        gps_file_path = self.sample_data_dir / "sample_gps.csv"
        if gps_file_path.exists():
            files = {
                'gps_file': ('sample_gps.csv', open(gps_file_path, 'rb'), 'text/csv'),
                'webtrack_file': ('sample_webtrack.pdf', open(self.sample_data_dir / "sample_webtrack.pdf", 'rb'), 'application/pdf')
            }
            
            data = {
                'home_lat': 55.0,
                'home_lon': 11.0,
                'radius_m': 100,  # Invalid: below 200
                'dwell_minutes': 10,
                'stable_points': 3
            }
            
            try:
                success, _ = self.run_test(
                    "Invalid Radius", 
                    "POST", 
                    "analyze", 
                    400, 
                    files=files, 
                    data=data,
                    auth_required=True
                )
                
                # Close file handles
                for file_obj in files.values():
                    if hasattr(file_obj[1], 'close'):
                        file_obj[1].close()
                        
            except Exception as e:
                print(f"Error in validation test: {e}")

def main():
    """Main test execution"""
    print("🚀 Starting Movia Correction API Tests with Authentication")
    print("=" * 60)
    
    tester = MoviaAPITester()
    
    # Basic endpoint tests
    tester.test_health_endpoint()
    tester.test_root_endpoint()
    
    # Authentication tests
    print("\n🔐 Authentication Tests:")
    tester.test_login_invalid_credentials()
    tester.test_protected_endpoint_without_auth()
    tester.test_login_with_owner_credentials()
    
    # Admin functionality tests (requires auth)
    print("\n👑 Admin Functionality Tests:")
    tester.test_admin_list_users()
    tester.test_admin_create_user()
    tester.test_admin_deactivate_user()
    tester.test_deactivated_user_login()
    
    # Main functionality tests (requires auth)
    print("\n📊 Analysis Tests:")
    tester.test_analyze_endpoint_with_sample_files()
    tester.test_analyze_with_private_trip_override()
    
    # Validation tests
    print("\n✅ Validation Tests:")
    tester.test_analyze_endpoint_validation()
    
    # Print results
    print("\n" + "=" * 60)
    print(f"📊 Tests completed: {tester.tests_passed}/{tester.tests_run}")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"❌ {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())