#!/usr/bin/env python3
"""
Tax Analytics Script
Analyzes backed up expense data for tax insights and optimization
"""

import json
import pandas as pd
import numpy as np
from pathlib import Path
from datetime import datetime
import matplotlib.pyplot as plt
import seaborn as sns
from typing import Dict, List, Optional
import openai  # For LLM reasoning
import os

class TaxAnalytics:
    def __init__(self, user_id: str = "default-user"):
        self.user_id = user_id
        self.data_dir = Path("data/backups") / user_id
        self.df = None
        
    def load_latest_backup(self) -> pd.DataFrame:
        """Load the most recent backup for analysis"""
        if not self.data_dir.exists():
            raise ValueError(f"No backups found for user {self.user_id}")
        
        # Find the latest CSV file
        csv_files = list(self.data_dir.glob("*.csv"))
        if not csv_files:
            raise ValueError("No CSV backups found")
        
        latest_csv = max(csv_files, key=lambda f: f.stat().st_mtime)
        print(f"Loading backup: {latest_csv.name}")
        
        self.df = pd.read_csv(latest_csv)
        self.df['Date'] = pd.to_datetime(self.df['Date'])
        self.df['Amount'] = pd.to_numeric(self.df['Amount'], errors='coerce')
        
        return self.df
    
    def load_json_backup(self, backup_id: Optional[str] = None) -> Dict:
        """Load JSON backup for detailed analysis"""
        if backup_id:
            json_path = self.data_dir / f"{backup_id}.json"
        else:
            # Find latest JSON
            json_files = list(self.data_dir.glob("*.json"))
            if not json_files:
                raise ValueError("No JSON backups found")
            json_path = max(json_files, key=lambda f: f.stat().st_mtime)
        
        with open(json_path, 'r') as f:
            return json.load(f)
    
    def category_analysis(self) -> pd.DataFrame:
        """Analyze expenses by category"""
        if self.df is None:
            self.load_latest_backup()
        
        category_stats = self.df.groupby('Category').agg({
            'Amount': ['sum', 'count', 'mean'],
            'Schedule C Line': 'first'
        }).round(2)
        
        category_stats.columns = ['Total', 'Count', 'Average', 'Schedule C Line']
        category_stats = category_stats.sort_values('Total', ascending=False)
        
        return category_stats
    
    def monthly_trends(self) -> pd.DataFrame:
        """Analyze monthly spending trends"""
        if self.df is None:
            self.load_latest_backup()
        
        self.df['Month'] = self.df['Date'].dt.to_period('M')
        monthly = self.df.groupby(['Month', 'Category'])['Amount'].sum().unstack(fill_value=0)
        
        return monthly
    
    def vendor_analysis(self, top_n: int = 20) -> pd.DataFrame:
        """Analyze top vendors by spending"""
        if self.df is None:
            self.load_latest_backup()
        
        vendor_stats = self.df.groupby('Vendor').agg({
            'Amount': ['sum', 'count'],
            'Category': lambda x: x.mode()[0] if len(x.mode()) > 0 else 'Unknown'
        }).round(2)
        
        vendor_stats.columns = ['Total Spent', 'Transaction Count', 'Primary Category']
        vendor_stats = vendor_stats.sort_values('Total Spent', ascending=False).head(top_n)
        
        return vendor_stats
    
    def tax_optimization_insights(self) -> Dict:
        """Generate tax optimization insights"""
        if self.df is None:
            self.load_latest_backup()
        
        insights = {
            'total_deductions': self.df['Amount'].sum(),
            'meal_deductions': {
                'total': self.df[self.df['Category'] == 'meals']['Amount'].sum(),
                'deductible_50%': self.df[self.df['Category'] == 'meals']['Amount'].sum() * 0.5,
                'count': len(self.df[self.df['Category'] == 'meals'])
            },
            'home_office': self._calculate_home_office(),
            'vehicle_expenses': self._calculate_vehicle_expenses(),
            'top_categories': self.category_analysis().head(5).to_dict(),
            'audit_flags': self._identify_audit_flags()
        }
        
        return insights
    
    def _calculate_home_office(self) -> Dict:
        """Calculate home office deduction potential"""
        utilities = self.df[self.df['Category'] == 'utilities']['Amount'].sum()
        
        return {
            'utilities_total': utilities,
            'potential_deduction_20%': utilities * 0.2,  # Assuming 20% home office use
            'recommendation': "Consider tracking square footage for accurate home office deduction"
        }
    
    def _calculate_vehicle_expenses(self) -> Dict:
        """Calculate vehicle expense deductions"""
        travel = self.df[self.df['Category'] == 'travel']['Amount'].sum()
        
        return {
            'travel_expenses': travel,
            'recommendation': "Track mileage for standard mileage deduction ($0.655/mile in 2023)"
        }
    
    def _identify_audit_flags(self) -> List[str]:
        """Identify potential audit red flags"""
        flags = []
        
        # Check meal expense ratio
        meal_ratio = self.df[self.df['Category'] == 'meals']['Amount'].sum() / self.df['Amount'].sum()
        if meal_ratio > 0.3:
            flags.append(f"High meal expense ratio: {meal_ratio:.1%} (typical is <20%)")
        
        # Check for round numbers
        round_amounts = self.df[self.df['Amount'] % 100 == 0]
        if len(round_amounts) > len(self.df) * 0.2:
            flags.append(f"Many round number expenses: {len(round_amounts)} ({len(round_amounts)/len(self.df):.1%})")
        
        # Check for missing receipts
        receipts = self.df[self.df['Document Type'] == 'receipt']
        receipt_coverage = len(receipts) / len(self.df)
        if receipt_coverage < 0.3:
            flags.append(f"Low receipt coverage: {receipt_coverage:.1%}")
        
        return flags
    
    def generate_visualizations(self, output_dir: str = "tax_analysis"):
        """Generate visualization charts"""
        Path(output_dir).mkdir(exist_ok=True)
        
        # Category pie chart
        plt.figure(figsize=(10, 8))
        category_totals = self.df.groupby('Category')['Amount'].sum().sort_values(ascending=False).head(10)
        plt.pie(category_totals.values, labels=category_totals.index, autopct='%1.1f%%')
        plt.title('Expense Distribution by Category')
        plt.savefig(f"{output_dir}/category_distribution.png")
        plt.close()
        
        # Monthly trend
        plt.figure(figsize=(12, 6))
        monthly = self.df.groupby(self.df['Date'].dt.to_period('M'))['Amount'].sum()
        monthly.plot(kind='bar')
        plt.title('Monthly Expense Trend')
        plt.xlabel('Month')
        plt.ylabel('Total Expenses ($)')
        plt.xticks(rotation=45)
        plt.tight_layout()
        plt.savefig(f"{output_dir}/monthly_trend.png")
        plt.close()
        
        print(f"Visualizations saved to {output_dir}/")
    
    def llm_tax_advisor(self, api_key: Optional[str] = None) -> str:
        """Use LLM to provide tax advice based on expense patterns"""
        if api_key:
            openai.api_key = api_key
        else:
            api_key = os.getenv('OPENAI_API_KEY')
            if not api_key:
                return "Set OPENAI_API_KEY environment variable for AI insights"
        
        insights = self.tax_optimization_insights()
        category_stats = self.category_analysis()
        
        prompt = f"""
        As a tax advisor, analyze these business expenses and provide optimization recommendations:
        
        Total Deductions: ${insights['total_deductions']:,.2f}
        
        Top Categories:
        {category_stats.head(5).to_string()}
        
        Audit Flags: {insights['audit_flags']}
        
        Meal Deductions: ${insights['meal_deductions']['total']:,.2f} (50% deductible)
        
        Provide:
        1. Tax optimization strategies
        2. Documentation recommendations
        3. Potential missed deductions
        4. Audit risk assessment
        """
        
        try:
            response = openai.ChatCompletion.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are an experienced tax advisor specializing in Schedule C business deductions."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1000
            )
            
            return response.choices[0].message.content
        except Exception as e:
            return f"LLM analysis unavailable: {str(e)}"


def main():
    """Main execution function"""
    analytics = TaxAnalytics()
    
    try:
        # Load data
        df = analytics.load_latest_backup()
        print(f"\nLoaded {len(df)} expense records")
        
        # Category analysis
        print("\n=== CATEGORY ANALYSIS ===")
        print(analytics.category_analysis())
        
        # Vendor analysis
        print("\n=== TOP VENDORS ===")
        print(analytics.vendor_analysis(top_n=10))
        
        # Tax insights
        print("\n=== TAX OPTIMIZATION INSIGHTS ===")
        insights = analytics.tax_optimization_insights()
        print(f"Total Deductions: ${insights['total_deductions']:,.2f}")
        print(f"Meal Deductions (50%): ${insights['meal_deductions']['deductible_50%']:,.2f}")
        
        if insights['audit_flags']:
            print("\n⚠️  Audit Risk Flags:")
            for flag in insights['audit_flags']:
                print(f"  - {flag}")
        
        # Generate visualizations
        analytics.generate_visualizations()
        
        # Optional: LLM insights
        # print("\n=== AI TAX ADVISOR ===")
        # print(analytics.llm_tax_advisor())
        
    except Exception as e:
        print(f"Error: {str(e)}")


if __name__ == "__main__":
    main() 