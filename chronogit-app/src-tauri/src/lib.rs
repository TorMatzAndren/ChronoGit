use serde::{Deserialize, Serialize};
use std::process::Command;
use tauri::Emitter;

#[derive(Serialize)]
struct FileChange {
    path: String,
    index_status: String,
    worktree_status: String,
    status: String,
    risk: String,
    staged: bool,
    explanation: String,
}

#[derive(Serialize)]
struct GitStatusResponse {
    branch: String,
    staged: Vec<FileChange>,
    working: Vec<FileChange>,
}

#[derive(Serialize)]
struct GitRemoteStatus {
    repo_path: String,
    branch: String,
    upstream: Option<String>,
    remote: Option<String>,
    remote_url: Option<String>,
    ahead: u32,
    behind: u32,
    has_remote: bool,
    is_diverged: bool,
    is_clean: bool,
}

#[derive(Serialize)]
struct BranchInfo {
    name: String,
    full_name: String,
    short_hash: String,
    upstream: Option<String>,
    ahead: u32,
    behind: u32,
    is_current: bool,
    is_remote: bool,
    is_detached: bool,
}

#[derive(Serialize)]
struct BranchOverview {
    current_branch: String,
    detached_head: bool,
    local_branches: Vec<BranchInfo>,
    remote_branches: Vec<BranchInfo>,
}

#[derive(Serialize)]
struct BranchGraphCommit {
    hash: String,
    short_hash: String,
    parents: Vec<String>,
    refs: Vec<String>,
    author: String,
    date: String,
    subject: String,
    is_head: bool,
}

#[derive(Serialize)]
struct BranchGraphRef {
    name: String,
    full_name: String,
    kind: String,
    target_short_hash: String,
}

#[derive(Serialize)]
struct BranchGraph {
    commits: Vec<BranchGraphCommit>,
    refs: Vec<BranchGraphRef>,
}

#[derive(Serialize)]
struct GitOperationState {
    rebase_in_progress: bool,
    merge_in_progress: bool,
    cherry_pick_in_progress: bool,
    revert_in_progress: bool,
    conflicted_files: Vec<String>,
    warning: String,
}

#[derive(Serialize)]
struct RemotePullResult {
    ok: bool,
    message: String,
    stdout: String,
    stderr: String,
}

#[derive(Serialize)]
struct RemotePushResult {
    ok: bool,
    message: String,
    stdout: String,
    stderr: String,
}

#[derive(Serialize)]
struct MergeSafetyPrediction {
    classification: String,
    risk_level: String,
    summary: String,
    local_touched_files: usize,
    remote_touched_files: usize,
    local_files: Vec<String>,
    remote_files: Vec<String>,
    shared_files: Vec<String>,
    working_changes: usize,
    warning: String,
}

#[derive(Serialize)]
struct RemoteOperationPreview {
    operation: String,
    repo_path: String,
    branch: String,
    upstream: Option<String>,
    remote: Option<String>,
    ahead: u32,
    behind: u32,
    commit_count: usize,
    commits: Vec<String>,
    changed_files: Vec<ChangedFile>,
    consequence: String,
    warning: String,
    merge_safety: MergeSafetyPrediction,
}

#[derive(Serialize)]
struct RepoInfo {
    path: String,
    name: String,
    root: String,
}

#[derive(Serialize)]
struct CommitResult {
    ok: bool,
    message: String,
    commit_hash: String,
}

#[derive(Serialize)]
struct CommitPreflight {
    staged_files: usize,
    insertions: i32,
    deletions: i32,
    is_empty: bool,
}

#[derive(Serialize)]
struct HistoryCommit {
    hash: String,
    short_hash: String,
    author: String,
    timestamp: String,
    message: String,
}

#[derive(Serialize)]
struct ChangedFile {
    path: String,
    status: String,
}

#[derive(Serialize)]
struct DiffResult {
    commit_hash: String,
    path: String,
    diff: String,
}

#[derive(Serialize)]
struct CommitComparison {
    left_commit: String,
    right_commit: String,
    left_label: String,
    right_label: String,
    changed_files: Vec<ChangedFile>,
    insertions: i32,
    deletions: i32,
    diff: String,
}

#[derive(Serialize, Clone)]
struct FileHistoryEntry {
    hash: String,
    short_hash: String,
    author: String,
    timestamp: String,
    message: String,
    status: String,
    path: String,
}

#[derive(Serialize, Clone)]
struct FileRenameEvent {
    hash: String,
    old_path: String,
    new_path: String,
}

#[derive(Serialize)]
struct FileLineage {
    path: String,
    commits: Vec<FileHistoryEntry>,
    first_commit: Option<FileHistoryEntry>,
    last_commit: Option<FileHistoryEntry>,
    renamed: bool,
    deleted: bool,
    rename_events: Vec<FileRenameEvent>,
}

#[tauri::command]
fn open_external_url(url: String) -> Result<String, String> {
    let allowed = ["http://jarri.systems", "https://github.com/TorMatzAndren"];

    if !allowed.iter().any(|allowed_url| *allowed_url == url) {
        return Err(format!(
            "External URL blocked by ChronoGit allowlist: {}",
            url
        ));
    }

    #[cfg(target_os = "windows")]
    let mut command = {
        let mut cmd = Command::new("cmd");
        cmd.args(["/C", "start", "", &url]);
        cmd
    };

    #[cfg(target_os = "macos")]
    let mut command = {
        let mut cmd = Command::new("open");
        cmd.arg(&url);
        cmd
    };

    #[cfg(all(unix, not(target_os = "macos")))]
    let mut command = {
        let mut cmd = Command::new("xdg-open");
        cmd.arg(&url);
        cmd
    };

    command
        .spawn()
        .map_err(|e| format!("Could not open external browser: {}", e))?;

    Ok(format!("Opened external browser: {}", url))
}

#[tauri::command]
fn detect_git() -> Result<String, String> {
    let output = Command::new("git")
        .arg("--version")
        .output()
        .map_err(|_| "Git not found in PATH".to_string())?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).trim().to_string());
    }

    Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
}

fn classify_backup(path: &str) -> bool {
    path.ends_with(".bak")
        || path.ends_with(".tmp")
        || path.ends_with(".old")
        || path.ends_with(".orig")
        || path.ends_with('~')
}

fn classify_change(
    index_status: char,
    worktree_status: char,
    path: &str,
    staged: bool,
) -> FileChange {
    let is_backup = classify_backup(path);
    let code = format!("{}{}", index_status, worktree_status);

    let (status, risk, explanation) = if code == "??" {
        if is_backup {
            (
                "untracked",
                "evidence",
                "Backup-like file detected. It is not tracked by Git and should be reviewed before adding.",
            )
        } else {
            (
                "untracked",
                "review",
                "New file not tracked by Git. It will not be included in history unless prepared.",
            )
        }
    } else if matches!(
        code.as_str(),
        "UU" | "AA" | "DD" | "AU" | "UA" | "DU" | "UD"
    ) {
        (
            "conflict",
            "critical",
            "Conflict state detected. Manual resolution is required before committing.",
        )
    } else {
        let active = if staged {
            index_status
        } else {
            worktree_status
        };

        match active {
            'M' => (
                "modified",
                if is_backup { "evidence" } else { "normal" },
                if staged {
                    "Tracked file modification is prepared for the next commit."
                } else {
                    "Tracked file modified, but not yet prepared for the next commit."
                },
            ),
            'A' => (
                "added",
                if is_backup { "evidence" } else { "normal" },
                "New file is prepared and will be included in the next snapshot.",
            ),
            'D' => (
                "deleted",
                "danger",
                if staged {
                    "Tracked file deletion is prepared. It will be removed in the next snapshot if committed."
                } else {
                    "Tracked file deleted in the working folder. Prepare only if this removal is intentional."
                },
            ),
            'R' => (
                "renamed",
                "review",
                "Renamed file detected. Review before committing.",
            ),
            'C' => (
                "copied",
                "review",
                "Copied file detected. Review before committing.",
            ),
            _ => (
                "unknown",
                "review",
                "Unclassified Git change. Review before acting.",
            ),
        }
    };

    FileChange {
        path: path.to_string(),
        index_status: index_status.to_string(),
        worktree_status: worktree_status.to_string(),
        status: status.to_string(),
        risk: risk.to_string(),
        staged,
        explanation: explanation.to_string(),
    }
}

fn scan_git_repos(
    root: &std::path::Path,
    depth: usize,
    max_depth: usize,
    repos: &mut Vec<RepoInfo>,
) {
    if depth > max_depth {
        return;
    }

    let Ok(entries) = std::fs::read_dir(root) else {
        return;
    };

    for entry in entries.flatten() {
        let path = entry.path();

        if !path.is_dir() {
            continue;
        }

        let file_name = path
            .file_name()
            .and_then(|value| value.to_str())
            .unwrap_or("");

        if file_name == ".git"
            || file_name == "node_modules"
            || file_name == "target"
            || file_name == "dist"
            || file_name == "build"
            || file_name == ".cache"
            || file_name == ".local"
            || file_name == ".cargo"
            || file_name == ".rustup"
            || file_name == ".npm"
            || file_name == ".ollama"
            || file_name == ".vscode"
        {
            continue;
        }

        let git_dir = path.join(".git");
        if git_dir.exists() {
            let name = path
                .file_name()
                .and_then(|value| value.to_str())
                .unwrap_or("repo")
                .to_string();

            repos.push(RepoInfo {
                path: path.to_string_lossy().to_string(),
                name,
                root: root.to_string_lossy().to_string(),
            });

            continue;
        }

        scan_git_repos(&path, depth + 1, max_depth, repos);
    }
}

fn discover_scan_roots() -> Vec<std::path::PathBuf> {
    let mut roots = Vec::new();

    if let Ok(raw) = std::env::var("CHRONOGIT_SCAN_ROOTS") {
        for part in raw.split(':') {
            let trimmed = part.trim();
            if !trimmed.is_empty() {
                roots.push(std::path::PathBuf::from(trimmed));
            }
        }
    }

    if let Ok(home) = std::env::var("HOME") {
        for folder in [
            "projects",
            "Projects",
            "dev",
            "Dev",
            "src",
            "code",
            "work",
            "Documents",
            "Desktop",
            "Downloads",
        ] {
            roots.push(std::path::PathBuf::from(format!("{}/{}", home, folder)));
        }

        roots.push(std::path::PathBuf::from(home));
    }

    roots.push(std::path::PathBuf::from("/opt"));

    roots.sort();
    roots.dedup();
    roots
}

#[tauri::command]
fn discover_git_repos() -> Result<Vec<RepoInfo>, String> {
    let roots = discover_scan_roots();
    let mut repos = Vec::new();

    for root in roots {
        if root.exists() && root.is_dir() {
            if root.join(".git").exists() {
                let name = root
                    .file_name()
                    .and_then(|value| value.to_str())
                    .unwrap_or("repo")
                    .to_string();

                repos.push(RepoInfo {
                    path: root.to_string_lossy().to_string(),
                    name,
                    root: root.to_string_lossy().to_string(),
                });
            }

            let max_depth = if root.to_string_lossy() == std::env::var("HOME").unwrap_or_default() {
                2
            } else {
                5
            };

            scan_git_repos(&root, 0, max_depth, &mut repos);
        }
    }

    repos.sort_by(|a, b| a.path.cmp(&b.path));
    repos.dedup_by(|a, b| a.path == b.path);

    Ok(repos)
}

fn parse_remote_counts(status_line: &str) -> (u32, u32) {
    let mut ahead = 0;
    let mut behind = 0;

    if let Some(start) = status_line.find('[') {
        if let Some(end) = status_line[start..].find(']') {
            let bracket = &status_line[start + 1..start + end];

            for part in bracket.split(',') {
                let trimmed = part.trim();

                if let Some(value) = trimmed.strip_prefix("ahead ") {
                    ahead = value.parse::<u32>().unwrap_or(0);
                }

                if let Some(value) = trimmed.strip_prefix("behind ") {
                    behind = value.parse::<u32>().unwrap_or(0);
                }
            }
        }
    }

    (ahead, behind)
}

fn parse_branch_ahead_behind(value: &str) -> (u32, u32) {
    let mut ahead = 0;
    let mut behind = 0;

    for part in value.split(',') {
        let trimmed = part.trim();

        if let Some(raw) = trimmed.strip_prefix("ahead ") {
            ahead = raw.parse::<u32>().unwrap_or(0);
        }

        if let Some(raw) = trimmed.strip_prefix("behind ") {
            behind = raw.parse::<u32>().unwrap_or(0);
        }
    }

    (ahead, behind)
}

fn validate_branch_name(branch_name: &str) -> Result<String, String> {
    let trimmed = branch_name.trim();

    if trimmed.is_empty() {
        return Err("Branch name is required.".into());
    }

    if trimmed.contains(char::is_whitespace) {
        return Err("Branch name must not contain whitespace.".into());
    }

    if trimmed.starts_with('-') {
        return Err("Branch name must not start with '-'.".into());
    }

    if trimmed.contains("..")
        || trimmed.contains("//")
        || trimmed.contains("@{")
        || trimmed.ends_with('.')
        || trimmed.ends_with('/')
        || trimmed.contains('\\')
        || trimmed.contains('~')
        || trimmed.contains('^')
        || trimmed.contains(':')
        || trimmed.contains('?')
        || trimmed.contains('*')
        || trimmed.contains('[')
    {
        return Err("Branch name contains characters Git does not allow safely here.".into());
    }

    Ok(trimmed.to_string())
}

#[tauri::command]
fn git_create_branch(repo_path: String, branch_name: String) -> Result<String, String> {
    let branch_name = validate_branch_name(&branch_name)?;

    let exists_out = Command::new("git")
        .arg("-C")
        .arg(&repo_path)
        .args(["show-ref", "--verify", "--quiet"])
        .arg(format!("refs/heads/{}", branch_name))
        .output()
        .map_err(|e| e.to_string())?;

    if exists_out.status.success() {
        return Err(format!("Branch already exists: {}", branch_name));
    }

    let out = Command::new("git")
        .arg("-C")
        .arg(&repo_path)
        .args(["branch"])
        .arg(&branch_name)
        .output()
        .map_err(|e| e.to_string())?;

    if !out.status.success() {
        return Err(command_error("git branch <name>", &out));
    }

    Ok(format!(
        "Created branch '{}' at the current snapshot. No files were changed and checkout did not switch branches.",
        branch_name
    ))
}

#[tauri::command]
fn git_switch_branch(repo_path: String, branch_name: String) -> Result<String, String> {
    let branch_name = validate_branch_name(&branch_name)?;

    let current_exe = std::env::current_exe()
        .map_err(|e| format!("Could not inspect current executable path: {}", e))?;

    let canonical_repo = std::fs::canonicalize(&repo_path)
        .map_err(|e| format!("Could not canonicalize repository path: {}", e))?;

    if current_exe.starts_with(&canonical_repo) {
        return Err(
            "Branch switch blocked: ChronoGit is currently running from this repository. Switching this repository can replace the running app source/binary and cause blank panels or restart behavior. Use a separate test repository, or switch manually after closing ChronoGit.".into()
        );
    }

    let exists_out = Command::new("git")
        .arg("-C")
        .arg(&repo_path)
        .args(["show-ref", "--verify", "--quiet"])
        .arg(format!("refs/heads/{}", branch_name))
        .output()
        .map_err(|e| e.to_string())?;

    if !exists_out.status.success() {
        return Err(format!(
            "Branch switch blocked: branch does not exist: {}",
            branch_name
        ));
    }

    let status_out = Command::new("git")
        .arg("-C")
        .arg(&repo_path)
        .args(["status", "--porcelain=v1"])
        .output()
        .map_err(|e| e.to_string())?;

    if !status_out.status.success() {
        return Err(command_error("git status --porcelain=v1", &status_out));
    }

    if !String::from_utf8_lossy(&status_out.stdout)
        .trim()
        .is_empty()
    {
        return Err("Branch switch blocked: working tree contains uncommitted changes.".into());
    }

    let checkout_out = Command::new("git")
        .arg("-C")
        .arg(&repo_path)
        .args(["checkout"])
        .arg(&branch_name)
        .output()
        .map_err(|e| e.to_string())?;

    if !checkout_out.status.success() {
        return Err(command_error("git checkout <branch>", &checkout_out));
    }

    Ok(format!(
        "Switched active timeline to branch: {}",
        branch_name
    ))
}

#[tauri::command]
fn git_branch_overview(repo_path: String) -> Result<BranchOverview, String> {
    let current_out = Command::new("git")
        .arg("-C")
        .arg(&repo_path)
        .args(["branch", "--show-current"])
        .output()
        .map_err(|e| e.to_string())?;

    if !current_out.status.success() {
        return Err(command_error("git branch --show-current", &current_out));
    }

    let current_branch = String::from_utf8_lossy(&current_out.stdout)
        .trim()
        .to_string();

    let head_out = Command::new("git")
        .arg("-C")
        .arg(&repo_path)
        .args(["rev-parse", "--short", "HEAD"])
        .output()
        .map_err(|e| e.to_string())?;

    let detached_head = current_branch.is_empty();
    let detached_hash = if head_out.status.success() {
        String::from_utf8_lossy(&head_out.stdout).trim().to_string()
    } else {
        "unknown".to_string()
    };

    let out = Command::new("git")
        .arg("-C")
        .arg(&repo_path)
        .args([
            "for-each-ref",
            "--format=%(refname)|%(refname:short)|%(objectname:short)|%(upstream:short)|%(upstream:track)",
            "refs/heads",
            "refs/remotes",
        ])
        .output()
        .map_err(|e| e.to_string())?;

    if !out.status.success() {
        return Err(command_error("git for-each-ref branch overview", &out));
    }

    let mut local_branches = Vec::new();
    let mut remote_branches = Vec::new();

    for line in String::from_utf8_lossy(&out.stdout).lines() {
        let parts: Vec<&str> = line.split('|').collect();

        if parts.len() < 5 {
            continue;
        }

        let full_name = parts[0].to_string();
        let name = parts[1].to_string();
        let short_hash = parts[2].to_string();
        let upstream = if parts[3].trim().is_empty() {
            None
        } else {
            Some(parts[3].to_string())
        };

        let track = parts[4]
            .trim()
            .trim_start_matches('[')
            .trim_end_matches(']')
            .to_string();

        let (ahead, behind) = parse_branch_ahead_behind(&track);
        let is_remote = full_name.starts_with("refs/remotes/");
        let is_current = !is_remote && !current_branch.is_empty() && name == current_branch;

        if name.ends_with("/HEAD") {
            continue;
        }

        let branch = BranchInfo {
            name,
            full_name,
            short_hash,
            upstream,
            ahead,
            behind,
            is_current,
            is_remote,
            is_detached: false,
        };

        if branch.is_remote {
            remote_branches.push(branch);
        } else {
            local_branches.push(branch);
        }
    }

    if detached_head {
        local_branches.insert(
            0,
            BranchInfo {
                name: format!("DETACHED HEAD @ {}", detached_hash),
                full_name: "HEAD".to_string(),
                short_hash: detached_hash,
                upstream: None,
                ahead: 0,
                behind: 0,
                is_current: true,
                is_remote: false,
                is_detached: true,
            },
        );
    }

    Ok(BranchOverview {
        current_branch: if detached_head {
            "DETACHED HEAD".to_string()
        } else {
            current_branch
        },
        detached_head,
        local_branches,
        remote_branches,
    })
}

#[tauri::command]
fn git_branch_graph(repo_path: String) -> Result<BranchGraph, String> {
    let head_out = Command::new("git")
        .arg("-C")
        .arg(&repo_path)
        .args(["rev-parse", "HEAD"])
        .output()
        .map_err(|e| e.to_string())?;

    let head_hash = if head_out.status.success() {
        String::from_utf8_lossy(&head_out.stdout).trim().to_string()
    } else {
        String::new()
    };

    let log_out = Command::new("git")
        .arg("-C")
        .arg(&repo_path)
        .args([
            "log",
            "--all",
            "--max-count=80",
            "--date=iso-strict",
            "--pretty=format:%H%x1f%h%x1f%P%x1f%D%x1f%an%x1f%ad%x1f%s%x1e",
        ])
        .output()
        .map_err(|e| e.to_string())?;

    if !log_out.status.success() {
        return Err(command_error("git log --all branch graph", &log_out));
    }

    let log_text = String::from_utf8_lossy(&log_out.stdout);
    let mut commits = Vec::new();

    for record in log_text.split('\x1e') {
        let trimmed = record.trim();
        if trimmed.is_empty() {
            continue;
        }

        let parts: Vec<&str> = trimmed.split('\x1f').collect();
        if parts.len() < 7 {
            continue;
        }

        let hash = parts[0].to_string();
        let parents = parts[2]
            .split_whitespace()
            .map(|value| value.to_string())
            .collect::<Vec<String>>();

        let refs = parts[3]
            .split(',')
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .map(|value| value.to_string())
            .collect::<Vec<String>>();

        commits.push(BranchGraphCommit {
            is_head: !head_hash.is_empty() && hash == head_hash,
            hash,
            short_hash: parts[1].to_string(),
            parents,
            refs,
            author: parts[4].to_string(),
            date: parts[5].to_string(),
            subject: parts[6].to_string(),
        });
    }

    let refs_out = Command::new("git")
        .arg("-C")
        .arg(&repo_path)
        .args([
            "for-each-ref",
            "--format=%(refname)|%(refname:short)|%(objectname:short)",
            "refs/heads",
            "refs/remotes",
            "refs/tags",
        ])
        .output()
        .map_err(|e| e.to_string())?;

    if !refs_out.status.success() {
        return Err(command_error("git for-each-ref branch graph", &refs_out));
    }

    let mut refs = Vec::new();

    for line in String::from_utf8_lossy(&refs_out.stdout).lines() {
        let parts: Vec<&str> = line.split('|').collect();
        if parts.len() < 3 {
            continue;
        }

        let full_name = parts[0].to_string();
        let name = parts[1].to_string();

        if name.ends_with("/HEAD") {
            continue;
        }

        let kind = if full_name.starts_with("refs/heads/") {
            "local"
        } else if full_name.starts_with("refs/remotes/") {
            "remote"
        } else if full_name.starts_with("refs/tags/") {
            "tag"
        } else {
            "other"
        };

        refs.push(BranchGraphRef {
            name,
            full_name,
            kind: kind.to_string(),
            target_short_hash: parts[2].to_string(),
        });
    }

    Ok(BranchGraph { commits, refs })
}

#[tauri::command]
fn git_remote_status(repo_path: String) -> Result<GitRemoteStatus, String> {
    let status_out = Command::new("git")
        .arg("-C")
        .arg(&repo_path)
        .args(["status", "-sb"])
        .output()
        .map_err(|e| e.to_string())?;

    if !status_out.status.success() {
        return Err(command_error("git status -sb", &status_out));
    }

    let status_text = String::from_utf8_lossy(&status_out.stdout);
    let status_line = status_text.lines().next().unwrap_or("## unknown").trim();

    let mut branch = "unknown".to_string();
    let mut upstream: Option<String> = None;

    if let Some(rest) = status_line.strip_prefix("## ") {
        let clean_rest = rest.split('[').next().unwrap_or(rest).trim();

        if let Some((local, remote_branch)) = clean_rest.split_once("...") {
            branch = local.trim().to_string();
            let remote_branch = remote_branch.trim();
            if !remote_branch.is_empty() {
                upstream = Some(remote_branch.to_string());
            }
        } else {
            branch = clean_rest.trim().to_string();
        }
    }

    let (ahead, behind) = parse_remote_counts(status_line);

    let remote = upstream
        .as_ref()
        .and_then(|value| value.split('/').next())
        .map(|value| value.to_string());

    let remote_out = Command::new("git")
        .arg("-C")
        .arg(&repo_path)
        .args(["remote", "-v"])
        .output()
        .map_err(|e| e.to_string())?;

    let mut remote_url: Option<String> = None;

    if remote_out.status.success() {
        let remote_text = String::from_utf8_lossy(&remote_out.stdout);

        for line in remote_text.lines() {
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() >= 3 && parts[2] == "(fetch)" {
                if let Some(remote_name) = &remote {
                    if parts[0] == remote_name {
                        remote_url = Some(parts[1].to_string());
                        break;
                    }
                }

                if remote_url.is_none() {
                    remote_url = Some(parts[1].to_string());
                }
            }
        }
    }

    let has_remote = upstream.is_some() || remote_url.is_some();
    let is_diverged = ahead > 0 && behind > 0;
    let is_clean = has_remote && ahead == 0 && behind == 0;

    Ok(GitRemoteStatus {
        repo_path,
        branch,
        upstream,
        remote,
        remote_url,
        ahead,
        behind,
        has_remote,
        is_diverged,
        is_clean,
    })
}

fn current_branch(repo_path: &str) -> Result<String, String> {
    let out = Command::new("git")
        .arg("-C")
        .arg(repo_path)
        .args(["branch", "--show-current"])
        .output()
        .map_err(|e| e.to_string())?;

    if !out.status.success() {
        return Err(command_error("git branch --show-current", &out));
    }

    let branch = String::from_utf8_lossy(&out.stdout).trim().to_string();

    if branch.is_empty() {
        Err(
            "Current repository is in detached HEAD state. Remote preview requires a branch."
                .into(),
        )
    } else {
        Ok(branch)
    }
}

fn current_upstream(repo_path: &str) -> Result<String, String> {
    let out = Command::new("git")
        .arg("-C")
        .arg(repo_path)
        .args(["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"])
        .output()
        .map_err(|e| e.to_string())?;

    if !out.status.success() {
        return Err("No upstream tracking branch is configured for this branch.".into());
    }

    let upstream = String::from_utf8_lossy(&out.stdout).trim().to_string();

    if upstream.is_empty() {
        Err("No upstream tracking branch is configured for this branch.".into())
    } else {
        Ok(upstream)
    }
}

fn remote_name_from_upstream(upstream: &str) -> Option<String> {
    upstream.split('/').next().map(|value| value.to_string())
}

fn ahead_behind_against_upstream(repo_path: &str) -> Result<(u32, u32), String> {
    let out = Command::new("git")
        .arg("-C")
        .arg(repo_path)
        .args(["rev-list", "--left-right", "--count", "@{u}...HEAD"])
        .output()
        .map_err(|e| e.to_string())?;

    if !out.status.success() {
        return Err(command_error(
            "git rev-list --left-right --count @{u}...HEAD",
            &out,
        ));
    }

    let text = String::from_utf8_lossy(&out.stdout);
    let parts: Vec<&str> = text.split_whitespace().collect();

    if parts.len() < 2 {
        return Err(format!(
            "Could not parse ahead/behind counts: {}",
            text.trim()
        ));
    }

    let behind = parts[0].parse::<u32>().unwrap_or(0);
    let ahead = parts[1].parse::<u32>().unwrap_or(0);

    Ok((ahead, behind))
}

fn preview_commits(repo_path: &str, range: &str) -> Result<Vec<String>, String> {
    let out = Command::new("git")
        .arg("-C")
        .arg(repo_path)
        .args(["log", "--oneline", "--decorate=no"])
        .arg(range)
        .output()
        .map_err(|e| e.to_string())?;

    if !out.status.success() {
        return Err(command_error("git log preview range", &out));
    }

    Ok(String::from_utf8_lossy(&out.stdout)
        .lines()
        .map(|line| line.to_string())
        .filter(|line| !line.trim().is_empty())
        .collect())
}

fn preview_commit_hashes(repo_path: &str, range: &str) -> Result<Vec<String>, String> {
    let out = Command::new("git")
        .arg("-C")
        .arg(repo_path)
        .args(["log", "--format=%H"])
        .arg(range)
        .output()
        .map_err(|e| e.to_string())?;

    if !out.status.success() {
        return Err(command_error("git log --format=%H preview range", &out));
    }

    Ok(String::from_utf8_lossy(&out.stdout)
        .lines()
        .map(|line| line.trim().to_string())
        .filter(|line| !line.is_empty())
        .collect())
}

fn preview_changed_files_from_commits(
    repo_path: &str,
    range: &str,
) -> Result<Vec<ChangedFile>, String> {
    let commits = preview_commit_hashes(repo_path, range)?;
    let mut seen = std::collections::BTreeSet::<(String, String)>::new();

    for commit in commits {
        let out = Command::new("git")
            .arg("-C")
            .arg(repo_path)
            .args([
                "diff-tree",
                "--root",
                "--no-commit-id",
                "--name-status",
                "-r",
                "--find-renames",
                "--find-copies",
            ])
            .arg(&commit)
            .output()
            .map_err(|e| e.to_string())?;

        if !out.status.success() {
            return Err(command_error("git diff-tree directional preview", &out));
        }

        for line in String::from_utf8_lossy(&out.stdout).lines() {
            let mut parts = line.split_whitespace();
            let status = parts.next().unwrap_or("").to_string();
            let path = parts.last().unwrap_or("").to_string();

            if !path.is_empty() {
                seen.insert((path, status));
            }
        }
    }

    Ok(seen
        .into_iter()
        .map(|(path, status)| ChangedFile { path, status })
        .collect())
}

fn count_working_changes(repo_path: &str) -> Result<usize, String> {
    let out = Command::new("git")
        .arg("-C")
        .arg(repo_path)
        .args(["status", "--porcelain=v1"])
        .output()
        .map_err(|e| e.to_string())?;

    if !out.status.success() {
        return Err(command_error("git status --porcelain=v1", &out));
    }

    Ok(String::from_utf8_lossy(&out.stdout)
        .lines()
        .filter(|line| !line.trim().is_empty())
        .count())
}

fn build_merge_safety_prediction(repo_path: &str) -> Result<MergeSafetyPrediction, String> {
    let local_files = preview_changed_files_from_commits(repo_path, "@{u}..HEAD")?;
    let remote_files = preview_changed_files_from_commits(repo_path, "HEAD..@{u}")?;
    let working_changes = count_working_changes(repo_path)?;

    let local_paths: std::collections::BTreeSet<String> =
        local_files.iter().map(|file| file.path.clone()).collect();

    let remote_paths: std::collections::BTreeSet<String> =
        remote_files.iter().map(|file| file.path.clone()).collect();

    let shared_files: Vec<String> = local_paths.intersection(&remote_paths).cloned().collect();

    let classification = if !shared_files.is_empty() {
        "NEEDS REVIEW".to_string()
    } else if local_paths.is_empty() || remote_paths.is_empty() {
        "ONE-WAY".to_string()
    } else {
        "LIKELY CLEAN".to_string()
    };

    let risk_level = if !shared_files.is_empty() && working_changes > 0 {
        "HIGH".to_string()
    } else if !shared_files.is_empty() || working_changes > 0 {
        "MEDIUM".to_string()
    } else {
        "LOW".to_string()
    };

    let summary = if !shared_files.is_empty() {
        "Local-only and remote-only commits touch at least one same path. A merge conflict is possible and must be reviewed before real download/merge.".to_string()
    } else if local_paths.is_empty() && remote_paths.is_empty() {
        "No local-only or remote-only file changes are visible in this preview.".to_string()
    } else if local_paths.is_empty() {
        "Only the remote side has unique file changes. Download may be straightforward, but ChronoGit has not executed a merge.".to_string()
    } else if remote_paths.is_empty() {
        "Only the local side has unique file changes. Upload should not change working files, but it will publish local snapshots.".to_string()
    } else {
        "Local-only and remote-only commits touch different paths. A clean merge is likely, but not guaranteed until Git actually merges.".to_string()
    };

    let warning = if working_changes > 0 {
        "Working folder has uncommitted changes. Remote actions are harder to reason about until the working folder is clean.".to_string()
    } else if !shared_files.is_empty() {
        "Same-path changes detected across local and remote histories. Review before any real pull/merge.".to_string()
    } else {
        "Prediction only. Git remains the authority; no merge has been executed.".to_string()
    };

    Ok(MergeSafetyPrediction {
        classification,
        risk_level,
        summary,
        local_touched_files: local_paths.len(),
        remote_touched_files: remote_paths.len(),
        local_files: local_paths.into_iter().collect(),
        remote_files: remote_paths.into_iter().collect(),
        shared_files,
        working_changes,
        warning,
    })
}

fn fetch_configured_remote(repo_path: &str) -> Result<String, String> {
    let upstream = current_upstream(repo_path)?;
    let remote = remote_name_from_upstream(&upstream).ok_or_else(|| {
        format!(
            "Could not determine remote name from upstream: {}",
            upstream
        )
    })?;

    let out = Command::new("git")
        .arg("-C")
        .arg(repo_path)
        .args(["fetch", "--prune", &remote])
        .output()
        .map_err(|e| e.to_string())?;

    if out.status.success() {
        Ok(format!("Fetched remote knowledge from {}.", remote))
    } else {
        Err(command_error("git fetch --prune <remote>", &out))
    }
}

#[tauri::command]
fn git_operation_state(repo_path: String) -> Result<GitOperationState, String> {
    let git_dir_out = Command::new("git")
        .arg("-C")
        .arg(&repo_path)
        .args(["rev-parse", "--git-dir"])
        .output()
        .map_err(|e| e.to_string())?;

    if !git_dir_out.status.success() {
        return Err(command_error("git rev-parse --git-dir", &git_dir_out));
    }

    let git_dir_text = String::from_utf8_lossy(&git_dir_out.stdout)
        .trim()
        .to_string();
    let git_dir = if std::path::Path::new(&git_dir_text).is_absolute() {
        std::path::PathBuf::from(git_dir_text)
    } else {
        std::path::PathBuf::from(&repo_path).join(git_dir_text)
    };

    let rebase_in_progress =
        git_dir.join("rebase-merge").exists() || git_dir.join("rebase-apply").exists();
    let merge_in_progress = git_dir.join("MERGE_HEAD").exists();
    let cherry_pick_in_progress = git_dir.join("CHERRY_PICK_HEAD").exists();
    let revert_in_progress = git_dir.join("REVERT_HEAD").exists();

    let conflict_out = Command::new("git")
        .arg("-C")
        .arg(&repo_path)
        .args(["diff", "--name-only", "--diff-filter=U"])
        .output()
        .map_err(|e| e.to_string())?;

    if !conflict_out.status.success() {
        return Err(command_error(
            "git diff --name-only --diff-filter=U",
            &conflict_out,
        ));
    }

    let conflicted_files: Vec<String> = String::from_utf8_lossy(&conflict_out.stdout)
        .lines()
        .map(|line| line.trim().to_string())
        .filter(|line| !line.is_empty())
        .collect();

    let warning = if !conflicted_files.is_empty() {
        "Git reports conflicted files. Resolve them manually or use Abort rebase if a rebase is in progress.".to_string()
    } else if rebase_in_progress {
        "Rebase is in progress. Continue only after verifying Git status.".to_string()
    } else if merge_in_progress {
        "Merge is in progress. Resolve or abort before starting another remote action.".to_string()
    } else if cherry_pick_in_progress {
        "Cherry-pick is in progress. Resolve or abort before starting another remote action."
            .to_string()
    } else if revert_in_progress {
        "Revert is in progress. Resolve or abort before starting another remote action.".to_string()
    } else {
        "No interrupted Git operation detected.".to_string()
    };

    Ok(GitOperationState {
        rebase_in_progress,
        merge_in_progress,
        cherry_pick_in_progress,
        revert_in_progress,
        conflicted_files,
        warning,
    })
}

#[tauri::command]
fn git_fetch_remote(repo_path: String) -> Result<String, String> {
    let upstream = current_upstream(&repo_path)?;
    let remote = remote_name_from_upstream(&upstream).ok_or_else(|| {
        format!(
            "Could not determine remote name from upstream: {}",
            upstream
        )
    })?;

    let out = Command::new("git")
        .arg("-C")
        .arg(&repo_path)
        .args(["fetch", "--prune", &remote])
        .output()
        .map_err(|e| e.to_string())?;

    if out.status.success() {
        Ok(format!(
            "Fetched remote knowledge from {}. Working files were not changed.",
            remote
        ))
    } else {
        Err(command_error("git fetch --prune <remote>", &out))
    }
}

#[tauri::command]
fn git_push_preview(repo_path: String) -> Result<RemoteOperationPreview, String> {
    let branch = current_branch(&repo_path)?;
    let upstream = current_upstream(&repo_path)?;
    let remote = remote_name_from_upstream(&upstream);
    let (ahead, behind) = ahead_behind_against_upstream(&repo_path)?;

    let commits = preview_commits(&repo_path, "@{u}..HEAD")?;
    let changed_files = preview_changed_files_from_commits(&repo_path, "@{u}..HEAD")?;
    let merge_safety = build_merge_safety_prediction(&repo_path)?;

    Ok(RemoteOperationPreview {
        operation: "upload_snapshots_preview".to_string(),
        repo_path,
        branch,
        upstream: Some(upstream),
        remote,
        ahead,
        behind,
        commit_count: commits.len(),
        commits,
        changed_files,
        consequence: "Preview only. No snapshots were uploaded. Working files were not changed."
            .to_string(),
        warning: if ahead == 0 {
            "Nothing local is ahead of the upstream branch.".to_string()
        } else if behind > 0 {
            "Branch is diverged. Upload preview shows only local-only commits; it does not include remote-only work.".to_string()
        } else {
            "Uploading would make these local snapshots visible on the configured remote."
                .to_string()
        },
        merge_safety,
    })
}

#[tauri::command]
fn git_pull_preview(repo_path: String) -> Result<RemoteOperationPreview, String> {
    let branch = current_branch(&repo_path)?;
    let upstream = current_upstream(&repo_path)?;
    let remote = remote_name_from_upstream(&upstream);
    let (ahead, behind) = ahead_behind_against_upstream(&repo_path)?;

    let commits = preview_commits(&repo_path, "HEAD..@{u}")?;
    let changed_files = preview_changed_files_from_commits(&repo_path, "HEAD..@{u}")?;
    let merge_safety = build_merge_safety_prediction(&repo_path)?;

    Ok(RemoteOperationPreview {
        operation: "download_updates_preview".to_string(),
        repo_path,
        branch,
        upstream: Some(upstream),
        remote,
        ahead,
        behind,
        commit_count: commits.len(),
        commits,
        changed_files,
        consequence: "Preview only. No remote snapshots were downloaded into the working branch. Working files were not changed.".to_string(),
        warning: if behind == 0 {
            "Nothing remote is ahead of this local branch.".to_string()
        } else if ahead > 0 {
            "Branch is diverged. Download preview shows only remote-only commits; local-only work remains separate.".to_string()
        } else {
            "Downloading updates may modify files and may create conflicts when implemented as a real action.".to_string()
        },
        merge_safety,
    })
}

#[tauri::command]
fn git_status(repo_path: String) -> Result<GitStatusResponse, String> {
    let out = Command::new("git")
        .arg("-C")
        .arg(&repo_path)
        .args(["status", "--porcelain=v1", "--branch"])
        .output()
        .map_err(|e| e.to_string())?;

    if !out.status.success() {
        return Err(String::from_utf8_lossy(&out.stderr).trim().to_string());
    }

    let text = String::from_utf8_lossy(&out.stdout);
    let mut branch = "unknown".to_string();
    let mut staged = Vec::new();
    let mut working = Vec::new();

    for line in text.lines() {
        if line.starts_with("## ") {
            branch = line.replace("## ", "");
            continue;
        }

        if line.len() < 4 {
            continue;
        }

        let chars: Vec<char> = line.chars().collect();
        let index_status = chars[0];
        let worktree_status = chars[1];
        let path = &line[3..];

        if index_status == '?' && worktree_status == '?' {
            working.push(classify_change(index_status, worktree_status, path, false));
            continue;
        }

        if index_status != ' ' {
            staged.push(classify_change(index_status, worktree_status, path, true));
        }

        if worktree_status != ' ' {
            working.push(classify_change(index_status, worktree_status, path, false));
        }
    }

    Ok(GitStatusResponse {
        branch,
        staged,
        working,
    })
}

fn run_git_path_action(
    repo_path: String,
    args: Vec<&str>,
    path: String,
    success: &str,
) -> Result<String, String> {
    let out = Command::new("git")
        .arg("-C")
        .arg(&repo_path)
        .args(args)
        .arg("--")
        .arg(&path)
        .output()
        .map_err(|e| e.to_string())?;

    if out.status.success() {
        Ok(format!("{} {}", success, path))
    } else {
        Err(String::from_utf8_lossy(&out.stderr).trim().to_string())
    }
}

fn validate_relative_path(path: &str) -> Result<(), String> {
    if path.trim().is_empty() {
        return Err("Path is empty.".into());
    }

    if path.starts_with('/') {
        return Err("Absolute paths are not allowed.".into());
    }

    if path.split('/').any(|part| part == "..") {
        return Err("Parent path traversal is not allowed.".into());
    }

    Ok(())
}

fn validate_commitish(repo_path: &str, value: &str) -> Result<(), String> {
    let trimmed = value.trim();

    if trimmed.is_empty() {
        return Err("Commit reference is empty.".into());
    }

    if trimmed.starts_with('-') {
        return Err("Commit reference may not start with '-'.".into());
    }

    if trimmed.chars().any(|ch| ch.is_whitespace()) {
        return Err("Commit reference may not contain whitespace.".into());
    }

    let out = Command::new("git")
        .arg("-C")
        .arg(repo_path)
        .args(["rev-parse", "--verify"])
        .arg(format!("{}^{{commit}}", trimmed))
        .output()
        .map_err(|e| e.to_string())?;

    if out.status.success() {
        Ok(())
    } else {
        Err(format!("Invalid commit reference: {}", trimmed))
    }
}

fn commit_label(repo_path: &str, commit: &str) -> Result<String, String> {
    let out = Command::new("git")
        .arg("-C")
        .arg(repo_path)
        .args(["log", "-1", "--pretty=format:%h %s"])
        .arg(commit)
        .output()
        .map_err(|e| e.to_string())?;

    if out.status.success() {
        Ok(String::from_utf8_lossy(&out.stdout).trim().to_string())
    } else {
        Err(command_error("git log -1 --pretty=format", &out))
    }
}

#[tauri::command]
fn git_remove_untracked(repo_path: String, path: String) -> Result<String, String> {
    validate_relative_path(&path)?;

    let status_out = Command::new("git")
        .arg("-C")
        .arg(&repo_path)
        .args(["status", "--porcelain=v1", "--"])
        .arg(&path)
        .output()
        .map_err(|e| e.to_string())?;

    if !status_out.status.success() {
        return Err(String::from_utf8_lossy(&status_out.stderr)
            .trim()
            .to_string());
    }

    let status_text = String::from_utf8_lossy(&status_out.stdout);

    if !status_text.lines().any(|line| line.starts_with("?? ")) {
        return Err(
            "Remove blocked: ChronoGit only removes untracked files with this action.".into(),
        );
    }

    let out = Command::new("git")
        .arg("-C")
        .arg(&repo_path)
        .args(["clean", "-f", "--"])
        .arg(&path)
        .output()
        .map_err(|e| e.to_string())?;

    if out.status.success() {
        Ok(format!("Removed untracked file {}", path))
    } else {
        Err(String::from_utf8_lossy(&out.stderr).trim().to_string())
    }
}

#[tauri::command]
fn git_ignore_path(repo_path: String, path: String) -> Result<String, String> {
    use std::fs::OpenOptions;
    use std::io::Write;
    use std::path::PathBuf;

    validate_relative_path(&path)?;

    let ignore_path = PathBuf::from(&repo_path).join(".gitignore");

    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&ignore_path)
        .map_err(|e| format!("Could not open .gitignore: {}", e))?;

    writeln!(file, "{}", path).map_err(|e| format!("Could not write .gitignore: {}", e))?;

    Ok(format!("Added {} to .gitignore", path))
}

#[tauri::command]
fn git_stage(repo_path: String, path: String) -> Result<String, String> {
    run_git_path_action(repo_path, vec!["add"], path, "Prepared")
}

#[tauri::command]
fn git_unstage(repo_path: String, path: String) -> Result<String, String> {
    run_git_path_action(
        repo_path,
        vec!["restore", "--staged"],
        path,
        "Removed from next commit",
    )
}

#[tauri::command]
fn git_restore(repo_path: String, path: String) -> Result<String, String> {
    run_git_path_action(repo_path, vec!["restore"], path, "Restored")
}

#[tauri::command]
fn git_commit_preflight(repo_path: String) -> Result<CommitPreflight, String> {
    let files_out = Command::new("git")
        .arg("-C")
        .arg(&repo_path)
        .args(["diff", "--cached", "--name-only"])
        .output()
        .map_err(|e| e.to_string())?;

    if !files_out.status.success() {
        return Err(command_error("git diff --cached --name-only", &files_out));
    }

    let staged_files = String::from_utf8_lossy(&files_out.stdout)
        .lines()
        .filter(|line| !line.trim().is_empty())
        .count();

    let stat_out = Command::new("git")
        .arg("-C")
        .arg(&repo_path)
        .args(["diff", "--cached", "--numstat"])
        .output()
        .map_err(|e| e.to_string())?;

    if !stat_out.status.success() {
        return Err(command_error("git diff --cached --numstat", &stat_out));
    }

    let mut insertions: i32 = 0;
    let mut deletions: i32 = 0;

    for line in String::from_utf8_lossy(&stat_out.stdout).lines() {
        let parts: Vec<&str> = line.split_whitespace().collect();

        if parts.len() < 2 {
            continue;
        }

        if let Ok(value) = parts[0].parse::<i32>() {
            insertions += value;
        }

        if let Ok(value) = parts[1].parse::<i32>() {
            deletions += value;
        }
    }

    Ok(CommitPreflight {
        staged_files,
        insertions,
        deletions,
        is_empty: staged_files == 0,
    })
}

#[tauri::command]
fn git_commit(repo_path: String, message: String) -> Result<CommitResult, String> {
    let trimmed = message.trim();

    if trimmed.is_empty() {
        return Err("Snapshot blocked: commit message is required.".into());
    }

    let conflict_check = Command::new("git")
        .arg("-C")
        .arg(&repo_path)
        .args(["diff", "--name-only", "--diff-filter=U"])
        .output()
        .map_err(|e| e.to_string())?;

    if !conflict_check.status.success() {
        return Err(String::from_utf8_lossy(&conflict_check.stderr)
            .trim()
            .to_string());
    }

    if !String::from_utf8_lossy(&conflict_check.stdout)
        .trim()
        .is_empty()
    {
        return Err("Snapshot blocked: unresolved Git conflicts are present.".into());
    }

    let staged_check = Command::new("git")
        .arg("-C")
        .arg(&repo_path)
        .args(["diff", "--cached", "--quiet"])
        .output()
        .map_err(|e| e.to_string())?;

    if staged_check.status.success() {
        return Err("Snapshot blocked: no prepared files are staged.".into());
    }

    let commit_out = Command::new("git")
        .arg("-C")
        .arg(&repo_path)
        .args(["commit", "-m"])
        .arg(trimmed)
        .output()
        .map_err(|e| e.to_string())?;

    if !commit_out.status.success() {
        return Err(String::from_utf8_lossy(&commit_out.stderr)
            .trim()
            .to_string());
    }

    let hash_out = Command::new("git")
        .arg("-C")
        .arg(&repo_path)
        .args(["rev-parse", "--short", "HEAD"])
        .output()
        .map_err(|e| e.to_string())?;

    let commit_hash = if hash_out.status.success() {
        String::from_utf8_lossy(&hash_out.stdout).trim().to_string()
    } else {
        "unknown".to_string()
    };

    Ok(CommitResult {
        ok: true,
        message: format!("Snapshot created with Git commit: {}", commit_hash),
        commit_hash,
    })
}

#[tauri::command]
fn git_amend_latest_commit_message(
    repo_path: String,
    message: String,
) -> Result<CommitResult, String> {
    let trimmed = message.trim();

    if trimmed.is_empty() {
        return Err("Rename blocked: snapshot message is required.".into());
    }

    let status_out = Command::new("git")
        .arg("-C")
        .arg(&repo_path)
        .args(["status", "--porcelain=v1"])
        .output()
        .map_err(|e| e.to_string())?;

    if !status_out.status.success() {
        return Err(command_error("git status --porcelain=v1", &status_out));
    }

    if !String::from_utf8_lossy(&status_out.stdout)
        .trim()
        .is_empty()
    {
        return Err("Rename blocked: working tree is not clean. Commit or restore changes before amending the latest snapshot message.".into());
    }

    let old_hash_out = Command::new("git")
        .arg("-C")
        .arg(&repo_path)
        .args(["rev-parse", "--short", "HEAD"])
        .output()
        .map_err(|e| e.to_string())?;

    if !old_hash_out.status.success() {
        return Err(command_error("git rev-parse --short HEAD", &old_hash_out));
    }

    let old_hash = String::from_utf8_lossy(&old_hash_out.stdout)
        .trim()
        .to_string();

    let amend_out = Command::new("git")
        .arg("-C")
        .arg(&repo_path)
        .args(["commit", "--amend", "-m"])
        .arg(trimmed)
        .output()
        .map_err(|e| e.to_string())?;

    if !amend_out.status.success() {
        return Err(command_error("git commit --amend -m", &amend_out));
    }

    let new_hash_out = Command::new("git")
        .arg("-C")
        .arg(&repo_path)
        .args(["rev-parse", "--short", "HEAD"])
        .output()
        .map_err(|e| e.to_string())?;

    let new_hash = if new_hash_out.status.success() {
        String::from_utf8_lossy(&new_hash_out.stdout)
            .trim()
            .to_string()
    } else {
        "unknown".to_string()
    };

    Ok(CommitResult {
        ok: true,
        message: format!(
            "Renamed latest snapshot message. Git commit hash changed: {} → {}",
            old_hash, new_hash
        ),
        commit_hash: new_hash,
    })
}

#[tauri::command]
fn git_file_lineage(repo_path: String, path: String) -> Result<FileLineage, String> {
    validate_relative_path(&path)?;

    let out = Command::new("git")
        .arg("-C")
        .arg(&repo_path)
        .args([
            "log",
            "--follow",
            "--name-status",
            "--format=__CHRONOGIT_COMMIT__%x1f%H%x1f%h%x1f%an%x1f%cI%x1f%s",
            "--",
        ])
        .arg(&path)
        .output()
        .map_err(|e| e.to_string())?;

    if !out.status.success() {
        return Err(command_error(
            "git log --follow --name-status -- <path>",
            &out,
        ));
    }

    let text = String::from_utf8_lossy(&out.stdout);
    let mut commits: Vec<FileHistoryEntry> = Vec::new();
    let mut rename_events: Vec<FileRenameEvent> = Vec::new();
    let mut renamed = false;
    let mut deleted = false;

    let mut current_hash = String::new();
    let mut current_short_hash = String::new();
    let mut current_author = String::new();
    let mut current_timestamp = String::new();
    let mut current_message = String::new();

    for raw_line in text.lines() {
        let line = raw_line.trim_end();

        if line.is_empty() {
            continue;
        }

        if line.starts_with("__CHRONOGIT_COMMIT__") {
            let parts: Vec<&str> = line.split('\x1f').collect();

            if parts.len() == 6 {
                current_hash = parts[1].to_string();
                current_short_hash = parts[2].to_string();
                current_author = parts[3].to_string();
                current_timestamp = parts[4].to_string();
                current_message = parts[5].to_string();
            }

            continue;
        }

        if current_hash.is_empty() {
            continue;
        }

        let parts: Vec<&str> = line.split('\t').collect();

        if parts.is_empty() {
            continue;
        }

        let status = parts[0].to_string();

        if status.starts_with('R') && parts.len() >= 3 {
            let old_path = parts[1].to_string();
            let new_path = parts[2].to_string();

            renamed = true;

            rename_events.push(FileRenameEvent {
                hash: current_hash.clone(),
                old_path: old_path.clone(),
                new_path: new_path.clone(),
            });

            commits.push(FileHistoryEntry {
                hash: current_hash.clone(),
                short_hash: current_short_hash.clone(),
                author: current_author.clone(),
                timestamp: current_timestamp.clone(),
                message: current_message.clone(),
                status,
                path: new_path,
            });

            continue;
        }

        if parts.len() >= 2 {
            let entry_path = parts[1].to_string();

            if status == "D" {
                deleted = true;
            }

            commits.push(FileHistoryEntry {
                hash: current_hash.clone(),
                short_hash: current_short_hash.clone(),
                author: current_author.clone(),
                timestamp: current_timestamp.clone(),
                message: current_message.clone(),
                status,
                path: entry_path,
            });
        }
    }

    let last_commit = commits.first().cloned();

    let first_commit = commits
        .iter()
        .rev()
        .find(|entry| entry.status == "A" || entry.status.starts_with('R'))
        .cloned()
        .or_else(|| commits.last().cloned());

    Ok(FileLineage {
        path,
        commits,
        first_commit,
        last_commit,
        renamed,
        deleted,
        rename_events,
    })
}

#[tauri::command]
fn git_history(repo_path: String) -> Result<Vec<HistoryCommit>, String> {
    let out = Command::new("git")
        .arg("-C")
        .arg(&repo_path)
        .args(["log", "--pretty=format:%H%x1f%h%x1f%an%x1f%cI%x1f%s"])
        .output()
        .map_err(|e| e.to_string())?;

    if !out.status.success() {
        return Err(String::from_utf8_lossy(&out.stderr).trim().to_string());
    }

    let text = String::from_utf8_lossy(&out.stdout);
    let mut commits = Vec::new();

    for line in text.lines() {
        let parts: Vec<&str> = line.split('\x1f').collect();
        if parts.len() != 5 {
            continue;
        }

        commits.push(HistoryCommit {
            hash: parts[0].to_string(),
            short_hash: parts[1].to_string(),
            author: parts[2].to_string(),
            timestamp: parts[3].to_string(),
            message: parts[4].to_string(),
        });
    }

    Ok(commits)
}

#[tauri::command]
fn git_changed_files_from_commit(
    repo_path: String,
    commit_hash: String,
) -> Result<Vec<ChangedFile>, String> {
    let range = format!("{}^!", commit_hash);

    let out = Command::new("git")
        .arg("-C")
        .arg(&repo_path)
        .args(["diff-tree", "--no-commit-id", "--name-status", "-r"])
        .arg(&range)
        .output()
        .map_err(|e| e.to_string())?;

    if !out.status.success() {
        return Err(String::from_utf8_lossy(&out.stderr).trim().to_string());
    }

    let text = String::from_utf8_lossy(&out.stdout);
    let mut files = Vec::new();

    for line in text.lines() {
        let mut parts = line.split_whitespace();
        let status = parts.next().unwrap_or("").to_string();
        let path = parts.last().unwrap_or("").to_string();

        if !path.is_empty() {
            files.push(ChangedFile { path, status });
        }
    }

    Ok(files)
}

#[tauri::command]
fn git_diff_file_from_commit(
    repo_path: String,
    commit_hash: String,
    path: String,
) -> Result<DiffResult, String> {
    validate_relative_path(&path)?;
    validate_commitish(&repo_path, &commit_hash)?;

    let range = format!("{}^!", commit_hash);

    let out = Command::new("git")
        .arg("-C")
        .arg(&repo_path)
        .args(["show", "--format=", "--find-renames", "--find-copies"])
        .arg(&range)
        .arg("--")
        .arg(&path)
        .output()
        .map_err(|e| e.to_string())?;

    if !out.status.success() {
        return Err(String::from_utf8_lossy(&out.stderr).trim().to_string());
    }

    Ok(DiffResult {
        commit_hash,
        path,
        diff: String::from_utf8_lossy(&out.stdout).to_string(),
    })
}

#[tauri::command]
fn git_compare_commits(
    repo_path: String,
    left_commit: String,
    right_commit: String,
) -> Result<CommitComparison, String> {
    validate_commitish(&repo_path, &left_commit)?;
    validate_commitish(&repo_path, &right_commit)?;

    if left_commit == right_commit {
        return Err("Comparison blocked: select two different snapshots.".into());
    }

    let name_out = Command::new("git")
        .arg("-C")
        .arg(&repo_path)
        .args(["diff", "--name-status", "--find-renames", "--find-copies"])
        .arg(&left_commit)
        .arg(&right_commit)
        .output()
        .map_err(|e| e.to_string())?;

    if !name_out.status.success() {
        return Err(command_error("git diff --name-status A B", &name_out));
    }

    let mut changed_files = Vec::new();

    for line in String::from_utf8_lossy(&name_out.stdout).lines() {
        let mut parts = line.split_whitespace();
        let status = parts.next().unwrap_or("").to_string();
        let path = parts.last().unwrap_or("").to_string();

        if !path.is_empty() {
            changed_files.push(ChangedFile { path, status });
        }
    }

    let stat_out = Command::new("git")
        .arg("-C")
        .arg(&repo_path)
        .args(["diff", "--numstat"])
        .arg(&left_commit)
        .arg(&right_commit)
        .output()
        .map_err(|e| e.to_string())?;

    if !stat_out.status.success() {
        return Err(command_error("git diff --numstat A B", &stat_out));
    }

    let mut insertions: i32 = 0;
    let mut deletions: i32 = 0;

    for line in String::from_utf8_lossy(&stat_out.stdout).lines() {
        let parts: Vec<&str> = line.split_whitespace().collect();

        if parts.len() < 2 {
            continue;
        }

        if let Ok(value) = parts[0].parse::<i32>() {
            insertions += value;
        }

        if let Ok(value) = parts[1].parse::<i32>() {
            deletions += value;
        }
    }

    let diff_out = Command::new("git")
        .arg("-C")
        .arg(&repo_path)
        .args(["diff", "--find-renames", "--find-copies"])
        .arg(&left_commit)
        .arg(&right_commit)
        .output()
        .map_err(|e| e.to_string())?;

    if !diff_out.status.success() {
        return Err(command_error("git diff A B", &diff_out));
    }

    Ok(CommitComparison {
        left_label: commit_label(&repo_path, &left_commit)?,
        right_label: commit_label(&repo_path, &right_commit)?,
        left_commit,
        right_commit,
        changed_files,
        insertions,
        deletions,
        diff: String::from_utf8_lossy(&diff_out.stdout).to_string(),
    })
}

#[tauri::command]
fn git_file_history(repo_path: String, path: String) -> Result<Vec<FileHistoryEntry>, String> {
    validate_relative_path(&path)?;

    let out = Command::new("git")
        .arg("-C")
        .arg(&repo_path)
        .args([
            "log",
            "--follow",
            "--name-status",
            "--pretty=format:COMMIT%x1f%H%x1f%h%x1f%an%x1f%cI%x1f%s",
            "--",
        ])
        .arg(&path)
        .output()
        .map_err(|e| e.to_string())?;

    if !out.status.success() {
        return Err(command_error("git log --follow --name-status", &out));
    }

    let mut entries = Vec::new();
    let mut current: Option<(String, String, String, String, String)> = None;

    for line in String::from_utf8_lossy(&out.stdout).lines() {
        if let Some(rest) = line.strip_prefix("COMMIT\x1f") {
            let parts: Vec<&str> = rest.split('\x1f').collect();
            if parts.len() == 5 {
                current = Some((
                    parts[0].to_string(),
                    parts[1].to_string(),
                    parts[2].to_string(),
                    parts[3].to_string(),
                    parts[4].to_string(),
                ));
            }
            continue;
        }

        if line.trim().is_empty() {
            continue;
        }

        if let Some((hash, short_hash, author, timestamp, message)) = current.clone() {
            let mut parts = line.split_whitespace();
            let status = parts.next().unwrap_or("").to_string();
            let changed_path = parts.last().unwrap_or("").to_string();

            if !status.is_empty() && !changed_path.is_empty() {
                entries.push(FileHistoryEntry {
                    hash,
                    short_hash,
                    author,
                    timestamp,
                    message,
                    status,
                    path: changed_path,
                });
            }
        }
    }

    Ok(entries)
}

#[derive(Serialize)]
struct ExplainDiffResult {
    model: String,
    explanation: String,
    tdp_before_watts: String,
    tdp_active_watts: String,
    tdp_reset_watts: String,
}

#[derive(Serialize)]
struct OllamaGenerateRequest {
    model: String,
    prompt: String,
    stream: bool,
}

#[derive(Deserialize)]
struct OllamaGenerateResponse {
    response: Option<String>,
    error: Option<String>,
}

#[derive(Serialize)]
struct LocalModel {
    name: String,
    engine: String,
    size: u64,
    modified_at: String,
    family: String,
    parameter_size: String,
    quantization_level: String,
}

#[derive(Deserialize)]
struct OllamaTagsResponse {
    models: Vec<OllamaTagModel>,
}

#[derive(Deserialize)]
struct OllamaTagModel {
    name: String,
    modified_at: String,
    size: u64,
    details: Option<OllamaTagDetails>,
}

#[derive(Deserialize)]
struct OllamaTagDetails {
    family: Option<String>,
    parameter_size: Option<String>,
    quantization_level: Option<String>,
}

#[derive(Deserialize)]
struct OllamaStreamChunk {
    response: Option<String>,
    done: Option<bool>,
    error: Option<String>,
}

#[derive(Serialize, Clone)]
struct LlmStreamEvent {
    stream_id: String,
    chunk: String,
    done: bool,
    error: Option<String>,
}

#[tauri::command]
fn explain_prompt_with_ollama_stream(
    window: tauri::Window,
    model: String,
    stream_id: String,
    title: String,
    prompt: String,
) -> Result<ExplainDiffResult, String> {
    let local_models = list_local_llm_models("ollama".to_string())?;
    if !local_models
        .iter()
        .any(|local_model| local_model.name == model)
    {
        return Err(format!("Model blocked or unavailable locally: {}", model));
    }

    let clipped_prompt: String = prompt.chars().take(26000).collect();

    let request = OllamaGenerateRequest {
        model: model.clone(),
        prompt: clipped_prompt,
        stream: true,
    };

    let response = reqwest::blocking::Client::new()
        .post("http://127.0.0.1:11434/api/generate")
        .json(&request)
        .send()
        .map_err(|e| format!("Could not call local Ollama API: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let body = response
            .text()
            .unwrap_or_else(|_| "Could not read Ollama error body.".to_string());
        return Err(format!("Ollama API failed with {}: {}", status, body));
    }

    let mut full = String::new();
    let reader = std::io::BufReader::new(response);

    for line_result in std::io::BufRead::lines(reader) {
        let line = line_result.map_err(|e| format!("Could not read Ollama stream: {}", e))?;
        if line.trim().is_empty() {
            continue;
        }

        let parsed: OllamaStreamChunk = serde_json::from_str(&line)
            .map_err(|e| format!("Could not parse Ollama stream chunk: {}", e))?;

        if let Some(error) = parsed.error {
            let _ = window.emit(
                "chronogit://llm-stream",
                LlmStreamEvent {
                    stream_id: stream_id.clone(),
                    chunk: String::new(),
                    done: true,
                    error: Some(error.clone()),
                },
            );
            return Err(error);
        }

        let chunk = parsed.response.unwrap_or_default();
        if !chunk.is_empty() {
            full.push_str(&chunk);
            let _ = window.emit(
                "chronogit://llm-stream",
                LlmStreamEvent {
                    stream_id: stream_id.clone(),
                    chunk,
                    done: false,
                    error: None,
                },
            );
        }

        if parsed.done.unwrap_or(false) {
            break;
        }
    }

    let mut cleaned = clean_ollama_text(&full);
    if cleaned.is_empty() {
        cleaned = format!(
            "Local LLM finished, but returned no readable explanation for: {}",
            title
        );
    }

    let _ = window.emit(
        "chronogit://llm-stream",
        LlmStreamEvent {
            stream_id: stream_id.clone(),
            chunk: String::new(),
            done: true,
            error: None,
        },
    );

    Ok(ExplainDiffResult {
        model,
        explanation: cleaned,
        tdp_before_watts: "streamed".to_string(),
        tdp_active_watts: "unchanged".to_string(),
        tdp_reset_watts: "unchanged".to_string(),
    })
}

#[tauri::command]
fn list_local_llm_models(engine: String) -> Result<Vec<LocalModel>, String> {
    if engine != "ollama" {
        return Err("Only Ollama model discovery is implemented right now.".into());
    }

    let response = reqwest::blocking::Client::new()
        .get("http://127.0.0.1:11434/api/tags")
        .send()
        .map_err(|e| format!("Could not query local Ollama models: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let body = response
            .text()
            .unwrap_or_else(|_| "Could not read Ollama error body.".to_string());
        return Err(format!(
            "Ollama model query failed with {}: {}",
            status, body
        ));
    }

    let parsed: OllamaTagsResponse = response
        .json()
        .map_err(|e| format!("Could not parse Ollama model list: {}", e))?;

    let mut models: Vec<LocalModel> = parsed
        .models
        .into_iter()
        .map(|model| {
            let details = model.details;
            LocalModel {
                name: model.name,
                engine: "ollama".to_string(),
                size: model.size,
                modified_at: model.modified_at,
                family: details
                    .as_ref()
                    .and_then(|d| d.family.clone())
                    .unwrap_or_else(|| "unknown".to_string()),
                parameter_size: details
                    .as_ref()
                    .and_then(|d| d.parameter_size.clone())
                    .unwrap_or_else(|| "unknown".to_string()),
                quantization_level: details
                    .and_then(|d| d.quantization_level)
                    .unwrap_or_else(|| "unknown".to_string()),
            }
        })
        .collect();

    models.sort_by(|a, b| a.name.cmp(&b.name));
    Ok(models)
}

fn command_error(command: &str, out: &std::process::Output) -> String {
    let stderr = String::from_utf8_lossy(&out.stderr).trim().to_string();
    let stdout = String::from_utf8_lossy(&out.stdout).trim().to_string();

    if !stderr.is_empty() {
        stderr
    } else if !stdout.is_empty() {
        stdout
    } else {
        format!("{} failed with no stdout/stderr", command)
    }
}

fn clean_ollama_text(input: &str) -> String {
    let mut output = String::new();
    let mut chars = input.chars().peekable();

    while let Some(ch) = chars.next() {
        if ch == '\u{1b}' {
            while let Some(next) = chars.next() {
                if next.is_ascii_alphabetic() {
                    break;
                }
            }
            continue;
        }

        if ch == '\u{8}' {
            output.pop();
            continue;
        }

        if ch == '\r' {
            continue;
        }

        if ch.is_control() && ch != '\n' && ch != '\t' {
            continue;
        }

        output.push(ch);
    }

    let mut cleaned = output
        .replace("Thinking...", "")
        .replace("...done thinking.", "")
        .replace("<think>", "")
        .replace("</think>", "")
        .trim()
        .to_string();

    if let Some(pos) = cleaned.find("Summary:") {
        cleaned = cleaned[pos..].to_string();
    }

    if let Some(pos) = cleaned.find("\nHard rules:") {
        cleaned = cleaned[..pos].trim().to_string();
    }

    if let Some(pos) = cleaned.find("\nRules:") {
        cleaned = cleaned[..pos].trim().to_string();
    }

    let mut compact_lines = Vec::new();
    let mut previous_blank = false;

    for line in cleaned.lines() {
        let trimmed = line.trim_end();

        if trimmed.is_empty() {
            if !previous_blank {
                compact_lines.push(String::new());
            }
            previous_blank = true;
            continue;
        }

        previous_blank = false;
        compact_lines.push(trimmed.to_string());
    }

    compact_lines.join("\n").trim().to_string()
}

fn query_gpu_power_limits() -> Result<(String, String), String> {
    let out = Command::new("nvidia-smi")
        .args([
            "--query-gpu=power.limit,power.default_limit",
            "--format=csv,noheader,nounits",
        ])
        .output()
        .map_err(|e| format!("Could not run nvidia-smi: {}", e))?;

    if !out.status.success() {
        return Err(command_error("nvidia-smi query power limits", &out));
    }

    let text = String::from_utf8_lossy(&out.stdout).trim().to_string();
    let parts: Vec<&str> = text.split(',').map(|part| part.trim()).collect();

    if parts.len() < 2 {
        return Err(format!("Could not parse nvidia-smi power limits: {}", text));
    }

    Ok((parts[0].to_string(), parts[1].to_string()))
}

fn set_gpu_power_limit(watts: u32) -> Result<(), String> {
    let out = Command::new("sudo")
        .args(["-n", "/usr/bin/nvidia-smi", "-pl", &watts.to_string()])
        .output()
        .map_err(|e| format!("Could not run sudo nvidia-smi -pl: {}", e))?;

    if out.status.success() {
        Ok(())
    } else {
        Err(command_error("sudo -n /usr/bin/nvidia-smi -pl", &out))
    }
}

fn is_lockfile(path: &str) -> bool {
    path.ends_with("Cargo.lock")
        || path.ends_with("package-lock.json")
        || path.ends_with("pnpm-lock.yaml")
        || path.ends_with("yarn.lock")
}

fn summarize_lockfile_diff(diff: &str) -> String {
    let mut added_packages: Vec<String> = Vec::new();
    let mut removed_packages: Vec<String> = Vec::new();
    let mut added_versions: Vec<String> = Vec::new();
    let mut removed_versions: Vec<String> = Vec::new();

    for line in diff.lines() {
        let trimmed = line.trim();

        if trimmed.starts_with("+name = ") {
            added_packages.push(
                trimmed
                    .trim_start_matches("+name = ")
                    .trim_matches('"')
                    .to_string(),
            );
        }

        if trimmed.starts_with("-name = ") {
            removed_packages.push(
                trimmed
                    .trim_start_matches("-name = ")
                    .trim_matches('"')
                    .to_string(),
            );
        }

        if trimmed.starts_with("+version = ") {
            added_versions.push(
                trimmed
                    .trim_start_matches("+version = ")
                    .trim_matches('"')
                    .to_string(),
            );
        }

        if trimmed.starts_with("-version = ") {
            removed_versions.push(
                trimmed
                    .trim_start_matches("-version = ")
                    .trim_matches('"')
                    .to_string(),
            );
        }
    }

    added_packages.sort();
    added_packages.dedup();
    removed_packages.sort();
    removed_packages.dedup();
    added_versions.sort();
    added_versions.dedup();
    removed_versions.sort();
    removed_versions.dedup();

    format!(
        "LOCKFILE SUMMARY GENERATED BY CHRONOGIT:\n\
This file is a dependency lockfile, not hand-written application logic.\n\
Explain it as dependency resolution caused by manifest changes.\n\
Do not analyze the full dependency graph.\n\
Do not recommend manual lockfile edits.\n\
Do not recommend cargo update, cargo clean, cargo tree, version pinning, platform fixes, or dependency upgrades unless explicitly requested by the user.\n\
Do not infer duplicate dependencies, outdated packages, TLS conflicts, macOS issues, missing system libraries, or build failures.\n\n\
Added package names visible in changed lockfile blocks:\n{}\n\n\
Removed package names visible in changed lockfile blocks:\n{}\n\n\
Added versions visible in changed lockfile blocks:\n{}\n\n\
Removed versions visible in changed lockfile blocks:\n{}\n\n\
Required explanation focus:\n\
- This lockfile changed because dependency resolution changed.\n\
- Explain only the visible added/removed package names and versions above.\n\
- If the summary is insufficient, say that the exact cause is not visible in this lockfile diff alone.",
        if added_packages.is_empty() { "- none visible".to_string() } else { added_packages.iter().map(|v| format!("- {}", v)).collect::<Vec<_>>().join("\n") },
        if removed_packages.is_empty() { "- none visible".to_string() } else { removed_packages.iter().map(|v| format!("- {}", v)).collect::<Vec<_>>().join("\n") },
        if added_versions.is_empty() { "- none visible".to_string() } else { added_versions.iter().map(|v| format!("- {}", v)).collect::<Vec<_>>().join("\n") },
        if removed_versions.is_empty() { "- none visible".to_string() } else { removed_versions.iter().map(|v| format!("- {}", v)).collect::<Vec<_>>().join("\n") }
    )
}

#[tauri::command]
fn explain_context_with_ollama(
    model: String,
    kind: String,
    title: String,
    plain_text: String,
    raw_truth: String,
) -> Result<ExplainDiffResult, String> {
    let local_models = list_local_llm_models("ollama".to_string())?;
    if !local_models
        .iter()
        .any(|local_model| local_model.name == model)
    {
        return Err(format!("Model blocked or unavailable locally: {}", model));
    }

    let (tdp_before_watts, tdp_default_watts) = query_gpu_power_limits()?;

    let default_limit = tdp_default_watts
        .split_whitespace()
        .next()
        .ok_or("Could not parse GPU default power limit.")?
        .parse::<f32>()
        .map_err(|e| format!("Could not parse GPU default power limit: {}", e))?;

    let active_limit = (default_limit * 0.60).round() as u32;
    let reset_limit = default_limit.round() as u32;

    let tdp_set_warning = set_gpu_power_limit(active_limit).err();

    let clipped_plain: String = plain_text.chars().take(8000).collect();
    let clipped_truth: String = raw_truth.chars().take(12000).collect();

    let prompt = format!(
        "/no_think\n\
You are ChronoGit, a local-only Git learning assistant.\n\
Return ONLY the final explanation. Do not include thinking, prelude, self-talk, or reasoning narration.\n\
Explain this ChronoGit UI concept or action for a beginner, while keeping enough technical detail for an advanced developer.\n\
Use this exact format:\n\
Summary:\n\
- ...\n\n\
What it means:\n\
- ...\n\n\
Safe action guidance:\n\
- ...\n\n\
Risk notes:\n\
- ...\n\n\
Suggested review:\n\
- ...\n\n\
Hard rules:\n\
- Do not invent context beyond the supplied UI context and raw truth.\n\
- If something is not visible in the supplied context, say: not visible in this context.\n\
- ChronoGit is local-only. Do not claim cloud behavior unless explicitly visible.\n\
- Git truth and deterministic UI state are authoritative; the LLM explanation is advisory.\n\
- Use ChronoGit UI terms first: 'Prepare for commit' instead of 'git add', 'Remove from next commit' instead of 'git restore --staged', and 'Restore / discard' for destructive working-folder restore.\n\
- If raw truth says staged=false, do not say the file is staged or locally staged.\n\
- If raw truth says staged=true, say it is prepared for the next commit.\n\
- Do not recommend terminal commands unless the UI cannot perform the action.\n\
- Never recommend `git reset --hard` unless the user explicitly asks for dangerous recovery commands.\n\
- For Time Machine restore, say ChronoGit restores one selected file from one selected snapshot into the working folder and requires review before commit.\n\
- Prefer explaining what the UI does over telling the user which raw Git command to run.\n\
- Keep it practical and concise.\n\n\
Metadata:\n\
Kind: {}\n\
Title: {}\n\n\
User-facing context:\n{}\n\n\
Raw truth:\n{}",
        kind,
        title,
        clipped_plain,
        clipped_truth
    );

    let request = OllamaGenerateRequest {
        model: model.clone(),
        prompt,
        stream: false,
    };

    let response = reqwest::blocking::Client::new()
        .post("http://127.0.0.1:11434/api/generate")
        .json(&request)
        .send()
        .map_err(|e| {
            let _ = set_gpu_power_limit(reset_limit);
            format!("Could not call local Ollama API: {}", e)
        })?;

    let tdp_reset_warning = set_gpu_power_limit(reset_limit).err();
    let (tdp_reset_watts, _) = query_gpu_power_limits()
        .unwrap_or_else(|_| ("unknown".to_string(), tdp_default_watts.clone()));

    if !response.status().is_success() {
        let status = response.status();
        let body = response
            .text()
            .unwrap_or_else(|_| "Could not read Ollama error body.".to_string());
        return Err(format!("Ollama API failed with {}: {}", status, body));
    }

    let parsed: OllamaGenerateResponse = response
        .json()
        .map_err(|e| format!("Could not parse Ollama API response: {}", e))?;

    if let Some(error) = parsed.error {
        return Err(error);
    }

    let mut cleaned = clean_ollama_text(parsed.response.as_deref().unwrap_or(""));
    if cleaned.is_empty() {
        cleaned = "Local LLM finished, but returned no readable explanation.".to_string();
    }

    if let Some(warning) = tdp_set_warning {
        cleaned = format!(
            "[GPU TDP WARNING: could not set 60% power limit: {}]\n\n{}",
            warning, cleaned
        );
    }

    if let Some(warning) = tdp_reset_warning {
        cleaned = format!(
            "[GPU TDP WARNING: could not reset power limit: {}]\n\n{}",
            warning, cleaned
        );
    }

    Ok(ExplainDiffResult {
        model,
        explanation: cleaned,
        tdp_before_watts,
        tdp_active_watts: active_limit.to_string(),
        tdp_reset_watts,
    })
}

#[tauri::command]
fn explain_diff_with_ollama(
    model: String,
    diff: String,
    file_path: String,
    commit_hash: String,
    commit_message: String,
) -> Result<ExplainDiffResult, String> {
    let local_models = list_local_llm_models("ollama".to_string())?;
    if !local_models
        .iter()
        .any(|local_model| local_model.name == model)
    {
        return Err(format!("Model blocked or unavailable locally: {}", model));
    }

    if diff.trim().is_empty() {
        return Err("No diff selected to explain.".into());
    }

    let (tdp_before_watts, tdp_default_watts) = query_gpu_power_limits()?;

    let default_limit = tdp_default_watts
        .split_whitespace()
        .next()
        .ok_or("Could not parse GPU default power limit.")?
        .parse::<f32>()
        .map_err(|e| format!("Could not parse GPU default power limit: {}", e))?;

    let active_limit = (default_limit * 0.60).round() as u32;
    let reset_limit = default_limit.round() as u32;

    let tdp_set_warning = set_gpu_power_limit(active_limit).err();

    let diff_for_model = if is_lockfile(&file_path) {
        summarize_lockfile_diff(&diff)
    } else {
        diff.clone()
    };

    let clipped_diff: String = diff_for_model.chars().take(14000).collect();

    let file_guidance = if file_path.ends_with("Cargo.lock")
        || file_path.ends_with("package-lock.json")
        || file_path.ends_with("pnpm-lock.yaml")
        || file_path.ends_with("yarn.lock")
    {
        "This is a lockfile. Treat it as generated dependency resolution output, not normal source code. Do not recommend manual edits. Do not infer platform errors, missing libraries, duplicate dependency bugs, outdated packages, or build failures unless explicitly visible in changed lines. Use the ChronoGit-generated lockfile summary as the primary signal."
    } else if file_path.ends_with("Cargo.toml")
        || file_path.ends_with("package.json")
        || file_path.ends_with("requirements.txt")
        || file_path.ends_with("pyproject.toml")
    {
        "This is a dependency/config manifest. Explain direct dependency or configuration changes. Distinguish local-only HTTP use from cloud/network telemetry. Do not claim external network behavior unless visible in the diff."
    } else {
        "Explain only the selected file patch."
    };

    let prompt = format!(
        "/no_think\n\
You are ChronoGit, a local-only Git learning assistant.\n\
Return ONLY the final explanation. Do not include thinking, prelude, self-talk, or reasoning narration.\n\
Explain the selected Git diff for a beginner, while keeping enough technical detail for an advanced developer.\n\
Use this exact format:\n\
Summary:\n\
- ...\n\n\
Important changes:\n\
- ...\n\n\
Risk notes:\n\
- ...\n\n\
Suggested review:\n\
- ...\n\n\
Hard rules:\n\
- Do not give generic project advice.\n\
- Do not invent context beyond the metadata and diff.\n\
- Every claim must be grounded in the changed lines.\n\
- If something is not visible in the diff, say: not visible in this diff.\n\
- Do not claim cloud, telemetry, security, platform, or build problems unless the diff supports it.\n\
- Mention when a change affects safety, destructive actions, Git state, UI behavior, or local-only execution.\n\
- Keep it practical and concise.\n\n\
File-specific guidance:\n\
{}\n\n\
Metadata:\n\
File: {}\n\
Commit: {}\n\
Commit message: {}\n\
Comparison: this single commit patch, not full repo history\n\n\
DIFF:\n{}",
        file_guidance,
        file_path,
        commit_hash,
        commit_message,
        clipped_diff
    );

    let request = OllamaGenerateRequest {
        model: model.clone(),
        prompt,
        stream: false,
    };

    let response = reqwest::blocking::Client::new()
        .post("http://127.0.0.1:11434/api/generate")
        .json(&request)
        .send()
        .map_err(|e| {
            let _ = set_gpu_power_limit(reset_limit);
            format!("Could not call local Ollama API: {}", e)
        })?;

    let tdp_reset_warning = set_gpu_power_limit(reset_limit).err();
    let (tdp_reset_watts, _) = query_gpu_power_limits()
        .unwrap_or_else(|_| ("unknown".to_string(), tdp_default_watts.clone()));

    if !response.status().is_success() {
        let status = response.status();
        let body = response
            .text()
            .unwrap_or_else(|_| "Could not read Ollama error body.".to_string());
        return Err(format!("Ollama API failed with {}: {}", status, body));
    }

    let parsed: OllamaGenerateResponse = response
        .json()
        .map_err(|e| format!("Could not parse Ollama API response: {}", e))?;

    if let Some(error) = parsed.error {
        return Err(error);
    }

    let mut cleaned = clean_ollama_text(parsed.response.as_deref().unwrap_or(""));

    if cleaned.is_empty() {
        cleaned = "Qwen finished, but returned no readable explanation.".to_string();
    }

    if let Some(warning) = tdp_set_warning {
        cleaned = format!(
            "[GPU TDP WARNING: could not set 60% power limit: {}]\n\n{}",
            warning, cleaned
        );
    }

    if let Some(warning) = tdp_reset_warning {
        cleaned = format!(
            "[GPU TDP WARNING: could not reset power limit: {}]\n\n{}",
            warning, cleaned
        );
    }

    Ok(ExplainDiffResult {
        model,
        explanation: cleaned,
        tdp_before_watts,
        tdp_active_watts: active_limit.to_string(),
        tdp_reset_watts,
    })
}

#[tauri::command]
fn explain_comparison_with_ollama(
    model: String,
    left_label: String,
    right_label: String,
    file_count: usize,
    insertions: i32,
    deletions: i32,
    changed_files_text: String,
    diff: String,
) -> Result<ExplainDiffResult, String> {
    let local_models = list_local_llm_models("ollama".to_string())?;
    if !local_models
        .iter()
        .any(|local_model| local_model.name == model)
    {
        return Err(format!("Model blocked or unavailable locally: {}", model));
    }

    if diff.trim().is_empty() {
        return Err("No comparison diff selected to explain.".into());
    }

    let (tdp_before_watts, tdp_default_watts) = query_gpu_power_limits()?;

    let default_limit = tdp_default_watts
        .split_whitespace()
        .next()
        .ok_or("Could not parse GPU default power limit.")?
        .parse::<f32>()
        .map_err(|e| format!("Could not parse GPU default power limit: {}", e))?;

    let active_limit = (default_limit * 0.60).round() as u32;
    let reset_limit = default_limit.round() as u32;

    let tdp_set_warning = set_gpu_power_limit(active_limit).err();

    let clipped_files: String = changed_files_text.chars().take(8000).collect();
    let clipped_diff: String = diff.chars().take(26000).collect();

    let prompt = format!(
        "/no_think\n\
You are ChronoGit, a local-only Git comparison assistant.\n\
Return ONLY the final explanation. Do not include thinking, prelude, self-talk, or reasoning narration.\n\
Explain this exact A ↔ B Git diff. Do not give a generic description of ChronoGit, React, Rust, Git, or UI architecture.\n\
The user wants to understand what changed between these two selected snapshots.\n\n\
Use this exact format:\n\
Summary:\n\
- ...\n\n\
Structural changes:\n\
- ...\n\n\
Largest / most important file changes:\n\
- ...\n\n\
Risk notes:\n\
- ...\n\n\
Review first:\n\
- ...\n\n\
What NOT to infer:\n\
- ...\n\n\
Hard rules:\n\
- Explain only what is visible in the supplied comparison stats, changed-file list, and diff.\n\
- If a cause or intent is not visible, say: not visible in this diff.\n\
- Do not summarize the application as a whole unless the diff directly changes that application behavior.\n\
- Do not claim files changed unless they are in the changed-file list or diff.\n\
- Prioritize the biggest code movements and user-visible behavior changes.\n\
- Mention safety, mutation, Git state, LLM behavior, or UI consequence only when visible in changed lines.\n\
- This is A ↔ B comparison, not necessarily one single commit.\n\
- Do NOT say a function, feature, command, or UI path was replaced unless the diff explicitly removes the old one or reroutes all callers.\n\
- Classify each important change as one of: additive, modifying existing behavior, replacing existing behavior, removing behavior.\n\
- If both old and new functions remain visible, call the change additive or specialized, not replacement.\n\
- Git diff is authoritative. This explanation is advisory.\n\n\
Comparison metadata:\n\
A: {}\n\
B: {}\n\
Changed files: {}\n\
Insertions: {}\n\
Deletions: {}\n\n\
Changed files:\n{}\n\n\
DIFF:\n{}",
        left_label,
        right_label,
        file_count,
        insertions,
        deletions,
        clipped_files,
        clipped_diff
    );

    let request = OllamaGenerateRequest {
        model: model.clone(),
        prompt,
        stream: false,
    };

    let response = reqwest::blocking::Client::new()
        .post("http://127.0.0.1:11434/api/generate")
        .json(&request)
        .send()
        .map_err(|e| {
            let _ = set_gpu_power_limit(reset_limit);
            format!("Could not call local Ollama API: {}", e)
        })?;

    let tdp_reset_warning = set_gpu_power_limit(reset_limit).err();
    let (tdp_reset_watts, _) = query_gpu_power_limits()
        .unwrap_or_else(|_| ("unknown".to_string(), tdp_default_watts.clone()));

    if !response.status().is_success() {
        let status = response.status();
        let body = response
            .text()
            .unwrap_or_else(|_| "Could not read Ollama error body.".to_string());
        return Err(format!("Ollama API failed with {}: {}", status, body));
    }

    let parsed: OllamaGenerateResponse = response
        .json()
        .map_err(|e| format!("Could not parse Ollama API response: {}", e))?;

    if let Some(error) = parsed.error {
        return Err(error);
    }

    let mut cleaned = clean_ollama_text(parsed.response.as_deref().unwrap_or(""));

    if cleaned.is_empty() {
        cleaned =
            "Local LLM finished, but returned no readable comparison explanation.".to_string();
    }

    if let Some(warning) = tdp_set_warning {
        cleaned = format!(
            "[GPU TDP WARNING: could not set 60% power limit: {}]\n\n{}",
            warning, cleaned
        );
    }

    if let Some(warning) = tdp_reset_warning {
        cleaned = format!(
            "[GPU TDP WARNING: could not reset power limit: {}]\n\n{}",
            warning, cleaned
        );
    }

    Ok(ExplainDiffResult {
        model,
        explanation: cleaned,
        tdp_before_watts,
        tdp_active_watts: active_limit.to_string(),
        tdp_reset_watts,
    })
}

#[tauri::command]
fn git_push_execute(repo_path: String, override_token: String) -> Result<RemotePushResult, String> {
    let _upstream = current_upstream(&repo_path)?;
    let (ahead, behind) = ahead_behind_against_upstream(&repo_path)?;
    let merge_safety = build_merge_safety_prediction(&repo_path)?;

    if ahead == 0 {
        return Err(
            "Upload blocked: this branch has no local snapshots ahead of the remote.".into(),
        );
    }

    if merge_safety.risk_level == "HIGH" && override_token.trim() != "override" {
        return Err("Upload blocked: HIGH risk requires typing override.".into());
    }

    if (behind > 0 || merge_safety.risk_level == "MEDIUM")
        && !matches!(override_token.trim(), "confirm" | "override")
    {
        return Err(
            "Upload blocked: diverged or MEDIUM-risk upload requires explicit confirmation.".into(),
        );
    }

    let out = Command::new("git")
        .arg("-C")
        .arg(&repo_path)
        .arg("push")
        .output()
        .map_err(|e| e.to_string())?;

    let stdout = String::from_utf8_lossy(&out.stdout).trim().to_string();
    let stderr = String::from_utf8_lossy(&out.stderr).trim().to_string();

    if out.status.success() {
        Ok(RemotePushResult {
            ok: true,
            message: "Uploaded local snapshots with git push. Working files were not changed."
                .to_string(),
            stdout,
            stderr,
        })
    } else {
        Err(format!(
            "Upload failed during git push.\n\nstdout:\n{}\n\nstderr:\n{}\n\nChronoGit did not force push. Fetch remote knowledge and preview again before choosing another action.",
            stdout,
            stderr
        ))
    }
}

#[tauri::command]
fn git_pull_rebase_execute(
    repo_path: String,
    override_token: String,
) -> Result<RemotePullResult, String> {
    let _upstream = current_upstream(&repo_path)?;
    let (ahead, behind) = ahead_behind_against_upstream(&repo_path)?;
    let merge_safety = build_merge_safety_prediction(&repo_path)?;

    if behind == 0 {
        return Err("Download blocked: remote is not ahead of this branch.".into());
    }

    if ahead > 0 && merge_safety.risk_level == "HIGH" && override_token.trim() != "override" {
        return Err("Download blocked: HIGH risk requires typing override.".into());
    }

    if merge_safety.risk_level == "MEDIUM" && override_token.trim() != "confirm" {
        return Err("Download blocked: MEDIUM risk requires explicit confirmation.".into());
    }

    let out = Command::new("git")
        .arg("-C")
        .arg(&repo_path)
        .args(["pull", "--rebase", "--autostash"])
        .output()
        .map_err(|e| e.to_string())?;

    let stdout = String::from_utf8_lossy(&out.stdout).trim().to_string();
    let stderr = String::from_utf8_lossy(&out.stderr).trim().to_string();

    if out.status.success() {
        let fetch_note = fetch_configured_remote(&repo_path)
            .unwrap_or_else(|err| format!("Post-pull fetch failed: {}", err));

        Ok(RemotePullResult {
            ok: true,
            message: format!("Downloaded remote updates with git pull --rebase --autostash. {} Refresh state and inspect history.", fetch_note),
            stdout,
            stderr,
        })
    } else {
        Err(format!(
            "Download failed during git pull --rebase --autostash.\n\nstdout:\n{}\n\nstderr:\n{}\n\nIf Git started a rebase, use Abort rebase before trying another strategy.",
            stdout,
            stderr
        ))
    }
}

#[tauri::command]
fn git_rebase_abort(repo_path: String) -> Result<String, String> {
    let out = Command::new("git")
        .arg("-C")
        .arg(&repo_path)
        .args(["rebase", "--abort"])
        .output()
        .map_err(|e| e.to_string())?;

    if out.status.success() {
        Ok("Git rebase abort completed. Refresh ChronoGit state before taking another remote action.".to_string())
    } else {
        Err(command_error("git rebase --abort", &out))
    }
}

#[tauri::command]
fn git_restore_file_from_commit(
    repo_path: String,
    commit_hash: String,
    path: String,
) -> Result<String, String> {
    validate_relative_path(&path)?;
    validate_commitish(&repo_path, &commit_hash)?;

    let out = Command::new("git")
        .arg("-C")
        .arg(&repo_path)
        .args(["checkout", &commit_hash, "--"])
        .arg(&path)
        .output()
        .map_err(|e| e.to_string())?;

    if out.status.success() {
        Ok(format!("Restored {} from snapshot {}", path, commit_hash))
    } else {
        Err(String::from_utf8_lossy(&out.stderr).trim().to_string())
    }
}

fn chronogit_log_backup_dir() -> Result<std::path::PathBuf, String> {
    if let Ok(raw) = std::env::var("CHRONOGIT_LOG_BACKUP_DIR") {
        let trimmed = raw.trim();
        if !trimmed.is_empty() {
            return Ok(std::path::PathBuf::from(trimmed));
        }
    }

    let home = std::env::var("HOME")
        .or_else(|_| std::env::var("USERPROFILE"))
        .map_err(|_| "Could not determine home directory for ChronoGit log backups.".to_string())?;

    Ok(std::path::PathBuf::from(home)
        .join(".local")
        .join("share")
        .join("chronogit")
        .join("log-backups"))
}

fn sanitize_backup_filename(filename: &str) -> String {
    filename
        .chars()
        .map(|ch| {
            if ch.is_ascii_alphanumeric() || matches!(ch, '-' | '_' | '.') {
                ch
            } else {
                '_'
            }
        })
        .collect::<String>()
        .trim_matches('_')
        .to_string()
}

#[tauri::command]
fn save_log_backup(filename: String, body: String) -> Result<String, String> {
    let dir = chronogit_log_backup_dir()?;
    std::fs::create_dir_all(&dir)
        .map_err(|e| format!("Could not create ChronoGit log backup directory: {}", e))?;

    let safe_filename = sanitize_backup_filename(&filename);
    if safe_filename.is_empty() {
        return Err("Backup filename is empty after sanitization.".into());
    }

    let path = dir.join(safe_filename);
    std::fs::write(&path, body)
        .map_err(|e| format!("Could not write ChronoGit log backup: {}", e))?;

    Ok(path.to_string_lossy().to_string())
}

#[tauri::command]
fn open_log_backup_folder() -> Result<String, String> {
    let dir = chronogit_log_backup_dir()?;
    std::fs::create_dir_all(&dir)
        .map_err(|e| format!("Could not create ChronoGit log backup directory: {}", e))?;

    #[cfg(target_os = "windows")]
    let mut command = {
        let mut cmd = Command::new("explorer");
        cmd.arg(&dir);
        cmd
    };

    #[cfg(target_os = "macos")]
    let mut command = {
        let mut cmd = Command::new("open");
        cmd.arg(&dir);
        cmd
    };

    #[cfg(all(unix, not(target_os = "macos")))]
    let mut command = {
        let mut cmd = Command::new("xdg-open");
        cmd.arg(&dir);
        cmd
    };

    command
        .spawn()
        .map_err(|e| format!("Could not open ChronoGit log backup folder: {}", e))?;

    Ok(dir.to_string_lossy().to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            detect_git,
            open_external_url,
            save_log_backup,
            open_log_backup_folder,
            discover_git_repos,
            git_remote_status,
            git_branch_overview,
            git_branch_graph,
            git_create_branch,
            git_switch_branch,
            git_operation_state,
            git_fetch_remote,
            git_push_preview,
            git_pull_preview,
            git_push_execute,
            git_pull_rebase_execute,
            git_rebase_abort,
            git_status,
            git_commit_preflight,
            git_stage,
            git_unstage,
            git_restore,
            git_remove_untracked,
            git_ignore_path,
            git_commit,
            git_amend_latest_commit_message,
            git_history,
            git_file_lineage,
            git_changed_files_from_commit,
            git_diff_file_from_commit,
            git_compare_commits,
            git_file_history,
            explain_diff_with_ollama,
            explain_context_with_ollama,
            explain_prompt_with_ollama_stream,
            explain_comparison_with_ollama,
            list_local_llm_models,
            git_restore_file_from_commit
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri app");
}
