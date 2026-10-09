from pydantic import BaseModel

from app.enums.strand_test import StrandTestType

# For facilitators and admins only. These responses carry the correct answers,
# so nothing here may be returned from a learner-facing route. The learner's
# own schemas are in strand_test.py and have no is_correct field.


class StrandTestViewerItem(BaseModel):
    id: int
    strand_id: int
    strand_code: str
    strand_name: str
    type: StrandTestType
    title: str
    item_count: int
    # Learner attempts on this test.
    attempt_count: int
    # A test's items are locked once any attempt exists (D8).
    is_locked: bool


class StrandTestViewerListResponse(BaseModel):
    # In strand order, pretest before posttest.
    items: list[StrandTestViewerItem]
    total: int


class StrandTestViewerOption(BaseModel):
    id: int
    option_text: str
    is_correct: bool


class StrandTestViewerQuestion(BaseModel):
    id: int
    question_text: str
    # In stored order.
    options: list[StrandTestViewerOption]
    # The same link the learner's test gives for this item. Null when the item
    # has no asset, or storage is not configured.
    asset_url: str | None


class StrandTestIntegrityIssue(BaseModel):
    count: int
    item_ids: list[int]


class StrandTestIntegrity(BaseModel):
    """Items a learner cannot answer correctly as the test stands, to help spot
    bad seed data. Each item should have exactly one correct option."""

    # Includes an item with no options at all.
    items_without_correct_option: StrandTestIntegrityIssue
    items_with_multiple_correct_options: StrandTestIntegrityIssue


class StrandTestViewerDetailResponse(StrandTestViewerItem):
    # In stored order.
    items: list[StrandTestViewerQuestion]
    integrity: StrandTestIntegrity
