import pytest
import os
from app.services.migration import MigrationManager

@pytest.mark.asyncio
async def test_migration_manager_dry_run():
    """Verify migration manager validates JSON seed fixture in dry-run mode."""
    fixture_path = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        "app", "fixtures", "seed_data.json"
    )
    assert os.path.exists(fixture_path), "seed_data.json must exist"

    report = await MigrationManager.migrate_from_json(fixture_path, dry_run=True)
    assert report["dryRun"] is True
    assert "collections" in report
    assert report["totalErrors"] == 0
    assert len(report["collections"]) >= 10
