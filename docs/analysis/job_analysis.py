"""
Job-AI Platform: End-to-End Data Analysis
Dataset: Synthetic data generated from schema (jobs, ai_scores, job_skills, job_sources)
"""

import random
import warnings
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns
from scipy import stats
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from statsmodels.formula.api import ols

warnings.filterwarnings("ignore")
random.seed(42)
np.random.seed(42)
OUT = "/workspaces/job-ai/docs/analysis"

# ─────────────────────────────────────────────
# SECTION 1 — SYNTHETIC DATA GENERATION
# ─────────────────────────────────────────────
SOURCES = ["LinkedIn", "Indeed", "RemoteOK", "WeWorkRemotely", "Nature Careers"]
ROLES   = ["DevOps Engineer", "Cloud Engineer", "SRE", "Platform Engineer",
           "Automation Engineer", "Research Associate", "Postdoc", "Technical Writer"]
LOCS    = ["Bengaluru", "Remote", "Hyderabad", "Mumbai", "Chennai", "Pune"]
MODES   = ["remote", "hybrid", "onsite"]
SKILLS  = ["Python","Kubernetes","Terraform","AWS","Docker","CI/CD","Linux",
           "Ansible","Prometheus","Git","Bash","GCP","Azure","Helm","Jenkins"]

n = 800
posted_dates = pd.date_range("2024-01-01", "2024-12-31", periods=n)

jobs = pd.DataFrame({
    "job_id":          range(1, n+1),
    "source":          np.random.choice(SOURCES, n, p=[0.35,0.25,0.15,0.15,0.10]),
    "title":           np.random.choice(ROLES, n),
    "location":        np.random.choice(LOCS, n, p=[0.40,0.25,0.12,0.10,0.08,0.05]),
    "work_mode":       np.random.choice(MODES, n, p=[0.40,0.35,0.25]),
    "salary_min":      np.random.randint(8, 30, n) * 100000,
    "salary_max":      np.random.randint(30, 80, n) * 100000,
    "posted_date":     posted_dates,
    "skills_count":    np.random.randint(3, 12, n),
})

# Inject realistic nulls
jobs.loc[np.random.choice(n, 80, replace=False), "salary_min"] = np.nan
jobs.loc[np.random.choice(n, 80, replace=False), "salary_max"] = np.nan
jobs.loc[np.random.choice(n, 20, replace=False), "location"]   = np.nan

# AI scores — higher for DevOps/Cloud/SRE, lower for Research/Postdoc
role_base = {"DevOps Engineer":72,"Cloud Engineer":70,"SRE":68,"Platform Engineer":65,
             "Automation Engineer":63,"Research Associate":45,"Postdoc":40,"Technical Writer":50}
match_scores = [
    min(100, max(0, int(role_base[r] + np.random.normal(0, 15))))
    for r in jobs["title"]
]
ai_scores = pd.DataFrame({
    "job_id":      jobs["job_id"],
    "match_score": match_scores,
    "should_alert": [s >= 75 for s in match_scores],
})

df = jobs.merge(ai_scores, on="job_id")

# ─────────────────────────────────────────────
# SECTION 2 — DATA CLEANING & PREP
# ─────────────────────────────────────────────
print("=== BEFORE CLEANING ===")
print(f"Shape: {df.shape}")
print(f"Missing values:\n{df.isnull().sum()[df.isnull().sum()>0]}")
print(f"Duplicates: {df.duplicated().sum()}")

df.drop_duplicates(inplace=True)
df["location"].fillna("Unknown", inplace=True)

# Salary imputation: fill with median per role
for col in ["salary_min","salary_max"]:
    df[col] = df.groupby("title")[col].transform(lambda x: x.fillna(x.median()))

# Feature engineering
df["salary_mid"]      = (df["salary_min"] + df["salary_max"]) / 2
df["salary_range"]    = df["salary_max"] - df["salary_min"]
df["is_high_match"]   = df["match_score"] >= 75
df["posted_month"]    = df["posted_date"].dt.to_period("M")
df["posted_week"]     = df["posted_date"].dt.isocalendar().week.astype(int)
df["is_tech_role"]    = df["title"].isin(
    ["DevOps Engineer","Cloud Engineer","SRE","Platform Engineer","Automation Engineer"])

print("\n=== AFTER CLEANING ===")
print(f"Shape: {df.shape}")
print(f"Missing values: {df.isnull().sum().sum()}")
print("\nCleaned dataset summary:")
print(df[["match_score","salary_mid","skills_count","is_high_match"]].describe().round(1))

# ─────────────────────────────────────────────
# SECTION 3 — EDA
# ─────────────────────────────────────────────

# 3a. Match score distribution by role
print("\n=== MATCH SCORE BY ROLE ===")
print(df.groupby("title")["match_score"].agg(["mean","median","std","count"]).round(1))

# 3b. High-match rate by source
print("\n=== HIGH-MATCH RATE BY SOURCE ===")
src_stats = df.groupby("source").agg(
    total=("job_id","count"),
    high_match=("is_high_match","sum"),
    avg_score=("match_score","mean")
).assign(alert_rate=lambda x: (x["high_match"]/x["total"]*100).round(1))
print(src_stats.sort_values("avg_score", ascending=False).round(1))

# 3c. Correlation matrix
corr_cols = ["match_score","salary_mid","salary_range","skills_count"]
corr = df[corr_cols].corr()
print("\n=== CORRELATION MATRIX ===")
print(corr.round(3))

# ─────────────────────────────────────────────
# SECTION 4 — ADVANCED ANALYSIS
# ─────────────────────────────────────────────

# 4a. t-test: tech roles vs non-tech match scores
tech    = df[df["is_tech_role"]]["match_score"]
nontech = df[~df["is_tech_role"]]["match_score"]
t_stat, p_val = stats.ttest_ind(tech, nontech)
print(f"\n=== T-TEST: Tech vs Non-Tech Match Scores ===")
print(f"Tech mean: {tech.mean():.1f} | Non-tech mean: {nontech.mean():.1f}")
print(f"t={t_stat:.3f}, p={p_val:.2e} {'*** SIGNIFICANT' if p_val<0.05 else ''}")

# 4b. ANOVA: match score across work modes
groups = [df[df["work_mode"]==m]["match_score"] for m in MODES]
f_stat, p_anova = stats.f_oneway(*groups)
print(f"\n=== ANOVA: Match Score by Work Mode ===")
for m in MODES:
    print(f"  {m}: mean={df[df['work_mode']==m]['match_score'].mean():.1f}")
print(f"F={f_stat:.3f}, p={p_anova:.4f}")

# 4c. KMeans clustering on salary + match score
X = df[["salary_mid","match_score","skills_count"]].copy()
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)
km = KMeans(n_clusters=3, random_state=42, n_init=10)
df["cluster"] = km.fit_predict(X_scaled)
print("\n=== KMEANS CLUSTERS ===")
print(df.groupby("cluster")[["match_score","salary_mid","skills_count"]].mean().round(1))

# 4d. OLS regression
model = ols("match_score ~ salary_mid + skills_count + C(work_mode) + C(is_tech_role)", data=df).fit()
print("\n=== OLS REGRESSION SUMMARY ===")
print(model.summary().tables[1])

# ─────────────────────────────────────────────
# SECTION 5 — VISUALIZATIONS
# ─────────────────────────────────────────────
sns.set_theme(style="whitegrid", palette="muted")

# Chart 1: Avg match score by source (bar)
fig, ax = plt.subplots(figsize=(8, 4))
src_order = src_stats.sort_values("avg_score", ascending=False).index
sns.barplot(data=df, x="source", y="match_score", order=src_order,
            estimator="mean", errorbar="sd", ax=ax)
ax.set_title("Avg Match Score by Job Source")
ax.set_xlabel("Source"); ax.set_ylabel("Match Score")
ax.axhline(75, color="red", linestyle="--", label="Alert threshold (75)")
ax.legend()
plt.tight_layout()
plt.savefig(f"{OUT}/chart1_match_by_source.png", dpi=120)
plt.close()

# Chart 2: Weekly job posting trend by source (line)
weekly = df.groupby(["posted_week","source"]).size().reset_index(name="count")
fig, ax = plt.subplots(figsize=(10, 4))
for src in SOURCES:
    d = weekly[weekly["source"]==src]
    ax.plot(d["posted_week"], d["count"], label=src, linewidth=1.5)
ax.set_title("Weekly Job Postings by Source (2024)")
ax.set_xlabel("Week"); ax.set_ylabel("Job Count")
ax.legend(fontsize=8)
plt.tight_layout()
plt.savefig(f"{OUT}/chart2_weekly_trend.png", dpi=120)
plt.close()

# Chart 3: Match score boxplot by role (outliers visible)
fig, ax = plt.subplots(figsize=(10, 5))
order = df.groupby("title")["match_score"].median().sort_values(ascending=False).index
sns.boxplot(data=df, x="title", y="match_score", order=order, ax=ax)
ax.set_xticklabels(ax.get_xticklabels(), rotation=30, ha="right")
ax.axhline(75, color="red", linestyle="--", alpha=0.7, label="Alert threshold")
ax.set_title("Match Score Distribution by Role (with Outliers)")
ax.legend()
plt.tight_layout()
plt.savefig(f"{OUT}/chart3_boxplot_roles.png", dpi=120)
plt.close()

# Chart 4: Correlation heatmap
fig, ax = plt.subplots(figsize=(6, 5))
sns.heatmap(corr, annot=True, fmt=".2f", cmap="coolwarm", center=0,
            square=True, linewidths=0.5, ax=ax)
ax.set_title("Feature Correlation Heatmap")
plt.tight_layout()
plt.savefig(f"{OUT}/chart4_correlation_heatmap.png", dpi=120)
plt.close()

# Chart 5: KMeans clusters scatter
fig, ax = plt.subplots(figsize=(7, 5))
scatter = ax.scatter(df["salary_mid"]/100000, df["match_score"],
                     c=df["cluster"], cmap="Set1", alpha=0.5, s=20)
ax.set_xlabel("Salary Mid (₹ Lakhs)"); ax.set_ylabel("Match Score")
ax.set_title("Job Clusters: Salary vs Match Score")
plt.colorbar(scatter, ax=ax, label="Cluster")
plt.tight_layout()
plt.savefig(f"{OUT}/chart5_clusters.png", dpi=120)
plt.close()

# Chart 6: Alert rate by work mode (bar)
alert_mode = df.groupby("work_mode")["is_high_match"].mean().mul(100).reset_index()
alert_mode.columns = ["work_mode","alert_rate"]
fig, ax = plt.subplots(figsize=(6, 4))
sns.barplot(data=alert_mode, x="work_mode", y="alert_rate", ax=ax)
ax.set_title("High-Match Alert Rate by Work Mode (%)")
ax.set_ylabel("Alert Rate (%)")
plt.tight_layout()
plt.savefig(f"{OUT}/chart6_alert_by_workmode.png", dpi=120)
plt.close()

print("\n✅ All 6 charts saved to docs/analysis/")

# ─────────────────────────────────────────────
# SECTION 6 — INSIGHTS SUMMARY TABLE
# ─────────────────────────────────────────────
print("\n" + "="*60)
print("EXECUTIVE SUMMARY — KEY METRICS")
print("="*60)
summary = pd.DataFrame([
    ["Total Jobs Analyzed",          f"{len(df):,}"],
    ["High-Match Jobs (≥75)",         f"{df['is_high_match'].sum():,} ({df['is_high_match'].mean()*100:.1f}%)"],
    ["Best Source (avg score)",       src_stats['avg_score'].idxmax()],
    ["Best Source Score",             f"{src_stats['avg_score'].max():.1f}"],
    ["Tech Role Avg Score",           f"{tech.mean():.1f}"],
    ["Non-Tech Role Avg Score",       f"{nontech.mean():.1f}"],
    ["t-test p-value",                f"{p_val:.2e}"],
    ["Remote Alert Rate",             f"{alert_mode[alert_mode.work_mode=='remote']['alert_rate'].values[0]:.1f}%"],
    ["Top Cluster Avg Salary (₹L)",   f"{df.groupby('cluster')['salary_mid'].mean().max()/100000:.0f}L"],
], columns=["Metric", "Value"])
print(summary.to_string(index=False))
