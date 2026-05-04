use serde::{Deserialize, Serialize};
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
        return Err(String::from_utf8_lossy(&status_out.stderr).trim().to_string());
    }

    let status_text = String::from_utf8_lossy(&status_out.stdout);

    if !status_text.lines().any(|line| line.starts_with("?? ")) {
        return Err("Remove blocked: ChronoGit only removes untracked files with this action.".into());
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
fn git_diff_file_from_commit(repo_path: String, commit_hash: String, path: String) -> Result<DiffResult, String> {
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

#[tauri::command]
fn explain_diff_with_ollama(
    model: String,
    diff: String,
    file_path: String,
    commit_hash: String,
    commit_message: String,
) -> Result<ExplainDiffResult, String> {
    let allowed_models = ["qwen3:8b", "llama3.1:8b"];
    if !allowed_models.contains(&model.as_str()) {
        return Err("Model blocked: only local allowed models may be used.".into());
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

    let clipped_diff: String = diff.chars().take(14000).collect();

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
Rules:\n\
- Do not invent context beyond the metadata and diff.\n\
- Mention when a change affects safety, destructive actions, Git state, UI behavior, or local-only execution.\n\
- Keep it practical and concise.\n\n\
Metadata:\n\
File: {}\n\
Commit: {}\n\
Commit message: {}\n\
Comparison: this single commit patch, not full repo history\n\n\
DIFF:\n{}",
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
    let (tdp_reset_watts, _) = query_gpu_power_limits().unwrap_or_else(|_| ("unknown".to_string(), tdp_default_watts.clone()));

    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().unwrap_or_else(|_| "Could not read Ollama error body.".to_string());
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
        cleaned = format!("[GPU TDP WARNING: could not set 60% power limit: {}]\n\n{}", warning, cleaned);
    }

    if let Some(warning) = tdp_reset_warning {
        cleaned = format!("[GPU TDP WARNING: could not reset power limit: {}]\n\n{}", warning, cleaned);
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
            git_remove_untracked,
            git_ignore_path,
            git_commit,
            git_history,
            git_changed_files_from_commit,
            git_diff_file_from_commit,
            explain_diff_with_ollama,
            git_restore_file_from_commit
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri app");
}
