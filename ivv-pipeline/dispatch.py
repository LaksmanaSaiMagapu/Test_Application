#!/usr/bin/env python3
"""
dispatch.py — IV&V pipeline dispatcher for the OpenHands Agent Server.

Registers LLM/agent profiles and launches IV&V stages (unit tests, sonar
remediation, E2E, triage) as API-driven conversations, then archives the
trajectory as evidence. Pure stdlib — runs on RHEL 10.2 python3.12.

Usage:
  python3 dispatch.py setup                       # register profiles
  python3 dispatch.py run --profile ivv-unit-test-writer \
      --prompt prompts/unit-tests.md --workspace /projects/gis-sample \
      --var REPO_PATH=/projects/gis-sample --var MR_IID=1 --var MR_SHA=HEAD \
      --var TARGET_BRANCH=main --tag mr-1
  python3 dispatch.py list                        # recent conversations
  python3 dispatch.py evidence <conversation_id>  # download trajectory

Config: reads IVV_ENV (default .env beside this script) with:
  AGENT_SERVER_URL   (default http://localhost:8000)
  SESSION_API_KEY    (default: read from ../.openhands/agent-canvas/api-key.txt)
  LLM_BASE_URL / LLM_API_KEY  (substituted into profiles/*.json)
"""
import argparse, json, os, re, sys, time, urllib.request, urllib.error
from pathlib import Path

ROOT = Path(__file__).resolve().parent

def load_env():
    env = {}
    f = ROOT / (os.environ.get("IVV_ENV", ".env"))
    if f.exists():
        for line in f.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip().strip('"').strip("'")
    return env

ENV = load_env()
BASE = ENV.get("AGENT_SERVER_URL", "http://localhost:8000").rstrip("/")
KEY = ENV.get("SESSION_API_KEY")
if not KEY:
    kf = ROOT.parent / ".openhands" / "agent-canvas" / "api-key.txt"
    if kf.exists():
        KEY = kf.read_text().strip()
if not KEY:
    sys.exit("No SESSION_API_KEY and no api-key.txt found. Start agent-canvas first.")

def api(method, path, body=None, raw=False):
    req = urllib.request.Request(
        BASE + path,
        method=method,
        data=json.dumps(body).encode() if body is not None else None,
        headers={"X-Session-API-Key": KEY, "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            data = r.read()
            return data if raw else json.loads(data or b"{}")
    except urllib.error.HTTPError as e:
        sys.exit(f"HTTP {e.code} {method} {path}: {e.read().decode()[:400]}")

def subst(text):
    """Replace {{VAR}} from --var and $ENV from the .env file."""
    def env_sub(m):
        return ENV.get(m.group(1), m.group(0))
    return re.sub(r"\$\{?([A-Z_]+)\}?", env_sub, text)

# ---------------------------------------------------------------- setup
def cmd_setup(_):
    for f in sorted((ROOT / "profiles").glob("*.json")):
        payload = json.loads(subst(f.read_text()))
        name = f.stem
        api("POST", f"/api/profiles/{name}", payload)
        print(f"registered LLM profile: {name}")
    for f in sorted((ROOT / "agent-profiles").glob("*.json")):
        payload = json.loads(f.read_text())
        name = f.stem
        api("POST", f"/api/agent-profiles/{name}", payload)
        print(f"registered agent profile: {name}")

# ---------------------------------------------------------------- run
def cmd_run(a):
    prompt = (ROOT / a.prompt).read_text() if not Path(a.prompt).is_absolute() else Path(a.prompt).read_text()
    for kv in a.var or []:
        k, v = kv.split("=", 1)
        prompt = prompt.replace("{{" + k + "}}", v)
    if re.search(r"\{\{[A-Z_]+\}\}", prompt):
        missing = sorted(set(re.findall(r"\{\{([A-Z_]+)\}\}", prompt)))
        sys.exit(f"unset template vars: {', '.join(missing)} (pass --var NAME=value)")

    # resolve profile name -> UUID
    profiles = api("GET", "/api/agent-profiles").get("profiles", [])
    pid = next((p["id"] for p in profiles if p["name"] == a.profile or p["id"] == a.profile), None)
    if not pid:
        sys.exit(f"agent profile '{a.profile}' not registered (run: python3 dispatch.py setup)")

    tags = {}
    for t in a.tag or []:
        k, _, v = t.partition("=")
        tags[k.lower() if v else "tag"] = v or k

    body = {
        "workspace": {"working_dir": a.workspace, "kind": "LocalWorkspace"},
        "initial_message": {"role": "user", "content": [{"type": "text", "text": prompt}]},
        "agent_profile_id": pid,
        "max_iterations": a.max_iterations,
        "confirmation_policy": {"kind": "NeverConfirm"},
        "tags": tags,
    }
    conv = api("POST", "/api/conversations", body)
    cid = conv.get("id") or conv.get("conversation_id")
    print(f"conversation started: {cid}")
    # starting with initial_message auto-runs; /run may 409 — that is fine
    req = urllib.request.Request(BASE + f"/api/conversations/{cid}/run", method="POST",
                                 headers={"X-Session-API-Key": KEY})
    try:
        urllib.request.urlopen(req, timeout=30)
    except urllib.error.HTTPError as e:
        if e.code != 409:
            raise

    status = ""
    for _ in range(a.timeout // 5):
        time.sleep(5)
        c = api("GET", f"/api/conversations/{cid}")
        status = c.get("execution_status") or c.get("status") or ""
        if status.lower() in ("finished", "stopped", "error", "paused"):
            break
    print(f"final status: {status}")
    cmd_evidence(argparse.Namespace(conversation_id=cid))

# ---------------------------------------------------------------- list/evidence
def cmd_list(_):
    data = api("GET", "/api/conversations/search?limit=20")
    for c in data.get("items", data.get("conversations", [])):
        print(c.get("conversation_id") or c.get("id"), "|", c.get("execution_status", "?"), "|", (c.get("title") or "")[:60])

def cmd_evidence(a):
    outdir = ROOT / "evidence" / str(a.conversation_id)
    outdir.mkdir(parents=True, exist_ok=True)
    data = api("GET", f"/api/file/download-trajectory/{a.conversation_id}", raw=True)
    (outdir / "trajectory.json").write_bytes(data)
    print(f"evidence saved: {outdir / 'trajectory.json'} ({len(data)} bytes)")

if __name__ == "__main__":
    p = argparse.ArgumentParser(description="IV&V dispatcher for OpenHands Agent Server")
    sub = p.add_subparsers(dest="cmd", required=True)
    sub.add_parser("setup").set_defaults(fn=cmd_setup)
    r = sub.add_parser("run")
    r.add_argument("--profile", required=True)
    r.add_argument("--prompt", required=True)
    r.add_argument("--workspace", required=True)
    r.add_argument("--var", action="append")
    r.add_argument("--tag", action="append")
    r.add_argument("--max-iterations", type=int, default=100)
    r.add_argument("--timeout", type=int, default=3600)
    r.set_defaults(fn=cmd_run)
    sub.add_parser("list").set_defaults(fn=cmd_list)
    e = sub.add_parser("evidence")
    e.add_argument("conversation_id")
    e.set_defaults(fn=cmd_evidence)
    a = p.parse_args()
    a.fn(a)
