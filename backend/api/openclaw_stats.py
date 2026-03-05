"""OpenClaw workspace stats — file sizes, token estimates, boot cost."""

from flask import Blueprint, jsonify
import os
import glob
from pathlib import Path

openclaw_stats_bp = Blueprint('openclaw_stats', __name__)

WORKSPACE = Path.home() / '.openclaw' / 'workspace'

# Files always loaded at boot (Project Context injection)
BOOT_FILES = [
    'AGENTS.md',
    'SOUL.md',
    'TOOLS.md',
    'IDENTITY.md',
    'USER.md',
    'HEARTBEAT.md',
    'BOOTSTRAP.md',
    'MEMORY.md',
    'BRAIN.md',
]

# Skills loaded via identity/persistent-memory
SKILL_FILES = [
    Path.home() / '.openclaw' / 'skills' / 'identity' / 'USER.md',
]

def estimate_tokens(text: str) -> int:
    """Rough token estimate: ~4 chars per token (GPT-4 approximation)."""
    return max(1, len(text) // 4)

def file_stats(path: Path) -> dict:
    try:
        content = path.read_text(encoding='utf-8', errors='ignore')
        size = path.stat().st_size
        tokens = estimate_tokens(content)
        return {
            'name': path.name,
            'path': str(path),
            'size_bytes': size,
            'tokens': tokens,
            'lines': content.count('\n'),
            'exists': True,
        }
    except FileNotFoundError:
        return {'name': path.name, 'path': str(path), 'size_bytes': 0, 'tokens': 0, 'lines': 0, 'exists': False}
    except Exception as e:
        return {'name': path.name, 'path': str(path), 'size_bytes': 0, 'tokens': 0, 'lines': 0, 'exists': False, 'error': str(e)}


@openclaw_stats_bp.route('/api/openclaw/workspace-stats', methods=['GET'])
def workspace_stats():
    """Return OpenClaw workspace file sizes, token counts, and boot cost estimate."""

    # ── Boot files ────────────────────────────────────────────────
    boot_stats = []
    for name in BOOT_FILES:
        p = WORKSPACE / name
        s = file_stats(p)
        s['role'] = 'boot'
        boot_stats.append(s)

    # Add skill identity file
    for p in SKILL_FILES:
        s = file_stats(Path(p))
        s['role'] = 'skill'
        boot_stats.append(s)

    boot_tokens = sum(f['tokens'] for f in boot_stats if f['exists'])
    boot_size = sum(f['size_bytes'] for f in boot_stats if f['exists'])

    # ── Daily memory files ────────────────────────────────────────
    memory_dir = WORKSPACE / 'memory'
    memory_files = []
    if memory_dir.exists():
        for p in sorted(memory_dir.glob('*.md'), reverse=True)[:30]:
            s = file_stats(p)
            s['role'] = 'memory'
            memory_files.append(s)

    memory_tokens = sum(f['tokens'] for f in memory_files)
    memory_size = sum(f['size_bytes'] for f in memory_files)

    # ── All workspace .md files ───────────────────────────────────
    all_md = []
    for p in WORKSPACE.glob('*.md'):
        if p.name not in BOOT_FILES:
            s = file_stats(p)
            s['role'] = 'workspace'
            all_md.append(s)
    all_md.sort(key=lambda x: x['tokens'], reverse=True)

    # ── Totals ────────────────────────────────────────────────────
    workspace_tokens = sum(f['tokens'] for f in all_md)
    total_tokens = boot_tokens + memory_tokens + workspace_tokens

    # ── Largest files (top 10 across everything) ──────────────────
    all_files = boot_stats + memory_files + all_md
    top_files = sorted([f for f in all_files if f['exists']], key=lambda x: x['tokens'], reverse=True)[:10]

    return jsonify({
        'boot': {
            'files': boot_stats,
            'total_tokens': boot_tokens,
            'total_size_bytes': boot_size,
            'file_count': len([f for f in boot_stats if f['exists']]),
        },
        'memory': {
            'files': memory_files,
            'total_tokens': memory_tokens,
            'total_size_bytes': memory_size,
            'file_count': len(memory_files),
        },
        'workspace': {
            'files': all_md,
            'total_tokens': workspace_tokens,
            'file_count': len(all_md),
        },
        'totals': {
            'total_tokens': total_tokens,
            'boot_tokens': boot_tokens,
            'memory_tokens': memory_tokens,
            'workspace_tokens': workspace_tokens,
        },
        'top_files': top_files,
    })
