from sqlalchemy import Row

from app.core.exceptions import StrandTestNotFoundError
from app.enums.strand_test import StrandTestType
from app.repositories.strand_test import StrandTestRepository
from app.schemas.strand_test_viewer import (
    StrandTestIntegrity,
    StrandTestIntegrityIssue,
    StrandTestViewerDetailResponse,
    StrandTestViewerItem,
    StrandTestViewerListResponse,
    StrandTestViewerOption,
    StrandTestViewerQuestion,
)
from app.services.strand_test import get_item_asset_url


class StrandTestViewerService:
    """A facilitator's or admin's read-only view of the strand tests, correct
    answers included. Nothing here creates or changes a test.

    Strand tests are global per strand, not per cohort, so there is no cohort
    check. Who may call is decided by the router's guard.
    """

    def __init__(self, test_repository: StrandTestRepository):
        self._test_repository = test_repository

    async def get_list(
        self,
        strand_id: int | None,
        test_type: StrandTestType | None,
    ) -> StrandTestViewerListResponse:
        rows = await self._test_repository.get_overview_rows(strand_id, test_type)
        items = [self._to_item(row) for row in rows]

        return StrandTestViewerListResponse(items=items, total=len(items))

    async def get_detail(self, test_id: int) -> StrandTestViewerDetailResponse:
        rows = await self._test_repository.get_overview_rows(test_id=test_id)
        if not rows:
            raise StrandTestNotFoundError()

        # Each is looked up once for the whole test.
        items = await self._test_repository.get_items(test_id)
        options = await self._test_repository.get_options(test_id)
        assets = await self._test_repository.get_assets(test_id)

        options_by_item: dict[int, list[StrandTestViewerOption]] = {}
        for option in options:
            options_by_item.setdefault(option.item_id, []).append(
                StrandTestViewerOption(
                    id=option.id,
                    option_text=option.option_text,
                    is_correct=option.is_correct,
                )
            )

        # The learner's test gives one link per item. Where an item has more
        # than one asset, the newest is the one kept.
        asset_by_item = {asset.item_id: asset for asset in assets}

        without_correct, multiple_correct = [], []
        for item in items:
            correct = sum(1 for option in options_by_item.get(item.id, []) if option.is_correct)
            if correct == 0:
                without_correct.append(item.id)
            elif correct > 1:
                multiple_correct.append(item.id)

        return StrandTestViewerDetailResponse(
            **self._to_item(rows[0]).model_dump(),
            items=[
                StrandTestViewerQuestion(
                    id=item.id,
                    question_text=item.question_text,
                    options=options_by_item.get(item.id, []),
                    asset_url=(
                        get_item_asset_url(asset_by_item[item.id])
                        if item.id in asset_by_item
                        else None
                    ),
                )
                for item in items
            ],
            integrity=StrandTestIntegrity(
                items_without_correct_option=StrandTestIntegrityIssue(
                    count=len(without_correct), item_ids=without_correct
                ),
                items_with_multiple_correct_options=StrandTestIntegrityIssue(
                    count=len(multiple_correct), item_ids=multiple_correct
                ),
            ),
        )

    @staticmethod
    def _to_item(row: Row) -> StrandTestViewerItem:
        test, strand_code, strand_name, item_count, attempt_count = row

        return StrandTestViewerItem(
            id=test.id,
            strand_id=test.strand_id,
            strand_code=strand_code,
            strand_name=strand_name,
            type=test.type,
            title=test.title,
            item_count=item_count,
            attempt_count=attempt_count,
            is_locked=attempt_count > 0,
        )
