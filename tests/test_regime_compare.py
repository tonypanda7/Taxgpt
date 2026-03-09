"""
Tests for the regime comparison engine and API.
Covers all 5 required scenarios from the spec.
"""
import pytest
from tax_engine.regime_compare import compare_regimes


class TestRegimeComparison:

    def test_salaried_low_deductions_new_regime_wins(self):
        """
        Salaried user ₹12L income, ₹1.5L 80C invested.
        New regime should be recommended since deductions are modest.
        """
        result = compare_regimes(income=1200000, deductions=150000)

        assert result["recommended_regime"] == "new"
        assert result["old_regime"]["total_tax"] > result["new_regime"]["total_tax"]
        assert result["savings"] == abs(
            result["old_regime"]["total_tax"] - result["new_regime"]["total_tax"]
        )

    def test_salaried_high_deductions_old_regime_wins(self):
        """
        Salaried user ₹12L income, ₹1.5L 80C + ₹50K NPS + ₹25K 80D + ₹1.5L HRA = ₹3.75L deductions.
        Old regime should be recommended due to heavy deductions.
        """
        total_deductions = 150000 + 50000 + 25000 + 150000  # ₹3,75,000
        result = compare_regimes(income=1200000, deductions=total_deductions)

        assert result["recommended_regime"] == "old"
        assert result["old_regime"]["total_tax"] < result["new_regime"]["total_tax"]
        assert result["savings"] == abs(
            result["old_regime"]["total_tax"] - result["new_regime"]["total_tax"]
        )

    def test_freelancer_44ada(self):
        """
        Freelancer ₹20L income, 44ADA elected (50% presumptive = ₹10L taxable).
        Both regimes should be calculated correctly.
        Note: For 44ADA, we pass ₹10L as income (presumptive) to regime_compare.
        """
        presumptive_income = 2000000 * 0.50  # 44ADA: 50% = ₹10L
        result = compare_regimes(income=presumptive_income, deductions=0)

        assert result["old_regime"]["total_tax"] >= 0
        assert result["new_regime"]["total_tax"] >= 0
        assert "old_regime" in result
        assert "new_regime" in result
        # Both regimes should have full breakdown
        for regime in ["old_regime", "new_regime"]:
            assert "taxable_income" in result[regime]
            assert "base_tax" in result[regime]
            assert "surcharge" in result[regime]
            assert "cess" in result[regime]

    def test_savings_equals_absolute_difference(self):
        """Assert savings field = abs(old_regime.total_tax - new_regime.total_tax)"""
        result = compare_regimes(income=1500000, deductions=200000)

        expected_savings = abs(
            result["old_regime"]["total_tax"] - result["new_regime"]["total_tax"]
        )
        assert result["savings"] == expected_savings

    def test_recommended_matches_lower_tax(self):
        """Assert recommended_regime matches whichever has lower total_tax."""
        # Test with low deductions → new should win
        result1 = compare_regimes(income=1000000, deductions=50000)
        if result1["old_regime"]["total_tax"] <= result1["new_regime"]["total_tax"]:
            assert result1["recommended_regime"] == "old"
        else:
            assert result1["recommended_regime"] == "new"

        # Test with high deductions → old should win
        result2 = compare_regimes(income=1000000, deductions=350000)
        if result2["old_regime"]["total_tax"] <= result2["new_regime"]["total_tax"]:
            assert result2["recommended_regime"] == "old"
        else:
            assert result2["recommended_regime"] == "new"

    def test_engine_version_present(self):
        """Ensure engine version is returned in the comparison result."""
        result = compare_regimes(income=1000000, deductions=100000)
        assert "engine_version" in result
        assert result["engine_version"].startswith("1.0.0")

    def test_zero_income(self):
        """Edge case: zero income should result in zero tax for both regimes."""
        result = compare_regimes(income=0, deductions=0)
        assert result["old_regime"]["total_tax"] == 0
        assert result["new_regime"]["total_tax"] == 0

    def test_rebate_87a_applied_new_regime(self):
        """
        Income ₹7L under new regime (after ₹75K standard deduction = ₹6.25L taxable).
        Should get full 87A rebate since taxable <= ₹7L.
        """
        result = compare_regimes(income=700000, deductions=0)
        assert result["new_regime"]["total_tax"] == 0  # Full rebate
