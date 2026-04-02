from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.append("/app/backend")

from analysis_core import analyze_day, dump_json


def main() -> None:
    parser = argparse.ArgumentParser(description="Phase 1 POC for trip segmentation and Movia correction output")
    parser.add_argument("--gps", required=True, help="Path to GPS CSV/XLSX file")
    parser.add_argument("--webtrack", required=True, help="Path to WebTrack PDF/XLSX file")
    parser.add_argument("--radius", type=float, default=300, help="Home zone radius in meters")
    parser.add_argument("--dwell", type=int, default=10, help="Valid return dwell in minutes")
    parser.add_argument("--stable-points", type=int, default=3, help="Consecutive inside/outside points needed to confirm transitions")
    parser.add_argument("--home-lat", type=float, default=None, help="Optional selected home latitude")
    parser.add_argument("--home-lon", type=float, default=None, help="Optional selected home longitude")
    parser.add_argument(
        "--output",
        default="/app/tests/phase1_poc_result.json",
        help="Where to store the JSON result",
    )
    args = parser.parse_args()

    result = analyze_day(
        gps_path=args.gps,
        webtrack_path=args.webtrack,
        home_latitude=args.home_lat,
        home_longitude=args.home_lon,
        radius_meters=args.radius,
        min_return_dwell_minutes=args.dwell,
        stable_point_count=args.stable_points,
    )
    dump_json(result, args.output)

    print("PHASE 1 POC RESULT")
    print(f"Home center source: {result['home_center']['source']}")
    print(f"Home center: {result['home_center']['latitude']}, {result['home_center']['longitude']} (radius {result['home_center']['radius_meters']}m)")
    print(f"GPS points: {result['gps_summary']['point_count']}")
    print(f"WebTrack run: {result['webtrack_summary']['primary_run_number']}")
    print(f"Stops: {result['webtrack_summary']['stop_numbers']}")
    print(f"Segments: {result['segment_count']}")
    print(f"Start: {result['computed_start_time']}")
    print(f"End: {result['computed_end_time']}")
    print(f"Total minutes: {result['total_work_minutes']}")
    print(f"End basis: {result['end_time_basis_label']}")
    print(f"Closest distance to home: {result['segment_debug']['closest_distance_m']} m")
    if result['segments']:
        first_segment = result['segments'][0]
        print(f"First segment raw start: {first_segment['start_time']}")
        print(f"First segment raw end: {first_segment['end_time']}")
        print(f"Closure reason: {first_segment['closure_reason']}")
    print("\nMOVIA TEXT PREVIEW\n")
    print(result['movia_correction_text'])
    print(f"\nJSON result written to: {Path(args.output)}")

    if result['segment_count'] < 1:
        raise SystemExit("POC failed: no segments were detected")
    if result['computed_end_time'] is None:
        raise SystemExit("POC failed: end time was not derived")


if __name__ == "__main__":
    main()
