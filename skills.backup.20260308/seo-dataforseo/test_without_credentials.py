#!/usr/bin/env python3
"""
测试 DataForSEO Skill 在没有凭据时的行为
"""
import sys
from pathlib import Path

# 添加 scripts 目录到路径
sys.path.insert(0, str(Path(__file__).parent / "scripts"))

try:
    from main import keyword_research
    print("✓ 成功导入 main 模块")
    
    # 尝试调用函数（应该会失败，因为没有凭据）
    print("\n尝试调用 keyword_research（预期会失败）...")
    result = keyword_research("test keyword")
    print("✗ 意外成功！这不应该发生")
    
except ImportError as e:
    print(f"✗ 导入失败: {e}")
    
except Exception as e:
    print(f"✓ 预期的错误: {type(e).__name__}: {e}")
    print("\n这是正常的，因为没有配置 DataForSEO 凭据")
