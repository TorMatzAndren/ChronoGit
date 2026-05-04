use serde::Serialize;
use std::process::Command;

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
struct CommitResult {
    ok: bool,
    message: String,
    commit_hash: String,
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

fn classify_change(index_status: char, worktree_status: char, path: &str, staged: bool) -> FileChange {
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
    } else if matches!(code.as_str(), "UU" | "AA" | "DD" | "AU" | "UA" | "DU" | "UD") {
        (
            "conflict",
            "critical",
            "Conflict state detected. Manual resolution is required before committing.",
        )
    } else {
        let active = if staged { index_status } else { worktree_status };

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
            'R' => ("renamed", "review", "Renamed file detected. Review before committing."),
            'C' => ("copied", "review", "Copied file detected. Review before committing."),
            _ => ("unknown", "review", "Unclassified Git change. Review before acting."),
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

    Ok(GitStatusResponse { branch, staged, working })
}

fn run_git_path_action(repo_path: String, args: Vec<&str>, path: String, success: &str) -> Result<String, String> {
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

#[tauri::command]
fn git_stage(repo_path: String, path: String) -> Result<String, String> {
    run_git_path_action(repo_path, vec!["add"], path, "Prepared")
}

#[tauri::command]
fn git_unstage(repo_path: String, path: String) -> Result<String, String> {
    run_git_path_action(repo_path, vec!["restore", "--staged"], path, "Removed from next commit")
}

#[tauri::command]
fn git_restore(repo_path: String, path: String) -> Result<String, String> {
    run_git_path_action(repo_path, vec!["restore"], path, "Restored")
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
        return Err(String::from_utf8_lossy(&conflict_check.stderr).trim().to_string());
    }

    if !String::from_utf8_lossy(&conflict_check.stdout).trim().is_empty() {
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
        return Err(String::from_utf8_lossy(&commit_out.stderr).trim().to_string());
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
fn git_history(repo_path: String) -> Result<Vec<HistoryCommit>, String> {
    let out = Command::new("git")
        .arg("-C")
        .arg(&repo_path)
        .args(["log", "--pretty=format:%H%x1f%h%x1f%an%x1f%cI%x1f%s", "-n", "50"])
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
fn git_changed_files_from_commit(repo_path: String, commit_hash: String) -> Result<Vec<ChangedFile>, String> {
    let out = Command::new("git")
        .arg("-C")
        .arg(&repo_path)
        .args(["diff", "--name-status", &commit_hash, "HEAD"])
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
fn git_diff_file_from_commit(repo_path: String, commit_hash: String, path: String) -> Result<DiffResult, String> {
    let out = Command::new("git")
        .arg("-C")
        .arg(&repo_path)
        .args(["diff", &commit_hash, "HEAD", "--"])
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
fn git_restore_file_from_commit(repo_path: String, commit_hash: String, path: String) -> Result<String, String> {
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            detect_git,
            git_status,
            git_stage,
            git_unstage,
            git_restore,
            git_commit,
            git_history,
            git_changed_files_from_commit,
            git_diff_file_from_commit,
            git_restore_file_from_commit
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri app");
}
