#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
自动生成 data/index.json 文件
用于在 GitHub Pages 等不支持目录扫描的环境中提供数据文件列表
"""

import os
import json
from datetime import datetime

def generate_index_json():
    # 获取当前目录
    current_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(current_dir, 'data')
    
    # 扫描 data 目录下的所有文件（排除 index.json 和 file-list.json）
    files = []
    for filename in sorted(os.listdir(data_dir)):
        filepath = os.path.join(data_dir, filename)
        
        # 跳过目录和配置文件
        if os.path.isdir(filepath):
            continue
        if filename in ['index.json', 'file-list.json']:
            continue
        if filename.startswith('.'):
            continue
            
        # 提取日期信息（假设文件名格式为 MMDD_HHMMSS）
        description = ""
        try:
            if '_' in filename:
                date_part, time_part = filename.split('_')
                month = int(date_part[:2])
                day = int(date_part[2:4])
                hour = int(time_part[:2])
                minute = int(time_part[2:4])
                description = f"{month}月{day}日 {hour:02d}:{minute:02d} 比赛数据"
        except:
            description = "比赛数据"
        
        files.append({
            "filename": filename,
            "description": description
        })
    
    # 创建索引数据结构
    index_data = {
        "name": "S2 内战数据文件索引",
        "description": "自动生成的数据文件列表，用于 GitHub Pages 部署",
        "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "files": files,
        "total_files": len(files),
        "usage": "此文件用于在 GitHub Pages 等不支持目录扫描的环境中提供数据文件列表"
    }
    
    # 写入 index.json
    output_path = os.path.join(data_dir, 'index.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(index_data, f, ensure_ascii=False, indent=2)
    
    print(f"✅ 已生成 {output_path}")
    print(f"📊 共包含 {len(files)} 个数据文件:")
    for file_info in files:
        print(f"   - {file_info['filename']}: {file_info['description']}")

if __name__ == '__main__':
    generate_index_json()
