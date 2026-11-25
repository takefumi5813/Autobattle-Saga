#!/bin/sh
# 使い方: sh art/op.sh <写しの名前の末尾> <名> [<末尾> <名> ...]
T='C:/Users/tsuzu/.claude/projects/C--Users-tsuzu-AppData-Local-Claude-Data-claude-pzs8sxrjxfjjc-scratch-workspaces-cf78cd38-0543-4441-b759-fa2fd0ed03d3-f02a2a22-9b6b-4f3c-bb61-6952b7afc7f3-scratch-2026-11-24-5e7d08/7f9e2f45-3b6d-4183-b830-f7360689e14c/tool-results'
while [ $# -ge 2 ]; do python -I art/op_take.py "$T" "$1" "$2"; shift 2; done
