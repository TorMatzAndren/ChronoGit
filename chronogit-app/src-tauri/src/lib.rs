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

#[tauri::command]
fn detect_git() -> Result<String, String> {
    match Command::new("git").arg("--version").output() {
        Ok(output) if output.status.success() => {
            Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
        }
        Ok(output) => Err(String::from_utf8_lossy(&output.stderr).trim().to_string()),
        Err(_) => Err("Git not found in PATH".into()),
    }
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

    Ok(GitStatusResponse {
        branch,
        staged,
        working,
    })
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            detect_git,
            git_status,
            git_stage,
            git_unstage,
            git_restore
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri app");
}
