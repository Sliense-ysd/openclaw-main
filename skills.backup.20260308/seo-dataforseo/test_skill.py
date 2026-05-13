#!/usr/bin/env python3
"""
DataForSEO Skill 测试脚本
测试 Skill 的结构和依赖是否正确
"""
import sys
from pathlib import Path

# 添加 scripts 目录到路径
skill_dir = Path.home() / ".openclaw/workspace/skills/seo-dataforseo"
scripts_dir = skill_dir / "scripts"
sys.path.insert(0, str(scripts_dir))

print("=" * 60)
print("DataForSEO Skill 结构测试")
print("=" * 60)

# 测试 1: 检查目录结构
print("\n[1/5] 检查目录结构...")
required_dirs = [
    skill_dir / "scripts",
    skill_dir / "scripts/api",
    skill_dir / "scripts/config",
    skill_dir / "scripts/core",
]
for d in required_dirs:
    status = "✓" if d.exists() else "✗"
    print(f"  {status} {d.relative_to(skill_dir)}")

# 测试 2: 检查必需文件
print("\n[2/5] 检查必需文件...")
required_files = [
    skill_dir / "SKILL.md",
    skill_dir / "scripts/main.py",
    skill_dir / "scripts/requirements.txt",
    skill_dir / "scripts/config/settings.py",
]
for f in required_files:
    status = "✓" if f.exists() else "✗"
    print(f"  {status} {f.relative_to(skill_dir)}")

# 测试 3: 检查 Python 依赖
print("\n[3/5] 检查 Python 依赖...")
try:
    import dataforseo_client
    print(f"  ✓ dataforseo-client (version: {dataforseo_client.__version__})")
except ImportError as e:
    print(f"  ✗ dataforseo-client: {e}")

try:
    import dotenv
    print(f"  ✓ python-dotenv")
except ImportError as e:
    print(f"  ✗ python-dotenv: {e}")

# 测试 4: 检查模块导入
print("\n[4/5] 检查模块导入...")
try:
    from config.settings import settings
    print("  ✓ config.settings")
except ImportError as e:
    print(f"  ✗ config.settings: {e}")

try:
    from api.keywords_data import get_search_volume
    print("  ✓ api.keywords_data")
except ImportError as e:
    print(f"  ✗ api.keywords_data: {e}")

try:
    from api.labs import get_keyword_overview
    print("  ✓ api.labs")
except ImportError as e:
    print(f"  ✗ api.labs: {e}")

try:
    from api.serp import get_google_serp
    print("  ✓ api.serp")
except ImportError as e:
    print(f"  ✗ api.serp: {e}")

try:
    from api.trends import get_google_trends
    print("  ✓ api.trends")
except ImportError as e:
    print(f"  ✗ api.trends: {e}")

# 测试 5: 检查主函数
print("\n[5/5] 检查主函数...")
try:
    from main import (
        keyword_research,
        youtube_keyword_research,
        landing_page_keyword_research,
        full_keyword_analysis,
        competitor_analysis,
        trending_topics
    )
    functions = [
        "keyword_research",
        "youtube_keyword_research",
        "landing_page_keyword_research",
        "full_keyword_analysis",
        "competitor_analysis",
        "trending_topics"
    ]
    for func in functions:
        print(f"  ✓ {func}")
except ImportError as e:
    print(f"  ✗ 主函数导入失败: {e}")

# 总结
print("\n" + "=" * 60)
print("测试完成！")
print("=" * 60)
print("\n下一步:")
print("1. 创建 .env 文件（在工作目录）")
print("2. 添加 DataForSEO 凭据:")
print("   DATAFORSEO_LOGIN=your_email@example.com")
print("   DATAFORSEO_PASSWORD=your_api_password")
print("3. 测试 API 调用")
print("\n获取凭据: https://app.dataforseo.com/api-access")
