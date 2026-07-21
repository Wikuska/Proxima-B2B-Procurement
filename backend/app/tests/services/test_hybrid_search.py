import uuid

from app.ai.hybrid_search import reciprocal_rank_fusion


def test_reciprocal_rank_fusion_prefers_items_high_on_both_lists():
    a = uuid.uuid4()
    b = uuid.uuid4()
    c = uuid.uuid4()

    fused = reciprocal_rank_fusion(
        [
            [a, b, c],
            [c, a, b],
        ]
    )

    assert fused[0] == a
    assert set(fused) == {a, b, c}


def test_reciprocal_rank_fusion_handles_empty_and_single_list():
    only = uuid.uuid4()
    assert reciprocal_rank_fusion([[], []]) == []
    assert reciprocal_rank_fusion([[only]]) == [only]
    assert reciprocal_rank_fusion([[], [only]]) == [only]
