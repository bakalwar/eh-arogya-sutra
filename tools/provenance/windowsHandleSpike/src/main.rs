//! Out-of-process spike binary.
//!
//! Input (C3C-Q03): one UTF-8 absolute drive-letter path on **stdin** (not argv/env/stdout/stderr).
//! Output: exactly one JSON line on stdout; stderr empty.

use std::io::{self, Read, Write};

use windows_handle_spike::{format_result_json, run_spike_selection};

fn main() {
    let result = match read_stdin_selection() {
        Ok(sel) => run_spike_selection(&sel),
        Err(code) => windows_handle_spike::outcome::SpikeResult::failed(code),
    };
    let line = format_result_json(&result);
    let _ = io::stdout().write_all(line.as_bytes());
    let _ = io::stdout().flush();
    // Exit codes are not contract-frozen; keep process status aligned with outcome.
    let code = match result.outcome {
        windows_handle_spike::outcome::SpikeOutcome::SpikeControlProven => 0,
        windows_handle_spike::outcome::SpikeOutcome::SpikeControlFailed => 1,
        windows_handle_spike::outcome::SpikeOutcome::C3cBlocked => 2,
    };
    std::process::exit(code);
}

fn read_stdin_selection() -> Result<String, windows_handle_spike::codes::SpikeCode> {
    let mut buf = Vec::new();
    io::stdin()
        .take(1025)
        .read_to_end(&mut buf)
        .map_err(|_| windows_handle_spike::codes::SpikeCode::InvalidSelection)?;
    if buf.len() > 1024 {
        return Err(windows_handle_spike::codes::SpikeCode::InvalidSelection);
    }
    // Strip UTF-8 BOM if present.
    let start = if buf.starts_with(&[0xEF, 0xBB, 0xBF]) {
        3
    } else {
        0
    };
    let mut s = String::from_utf8(buf[start..].to_vec())
        .map_err(|_| windows_handle_spike::codes::SpikeCode::InvalidSelection)?;
    if let Some(end) = s.find('\n') {
        s.truncate(end);
    }
    if s.ends_with('\r') {
        s.pop();
    }
    if s.is_empty() {
        return Err(windows_handle_spike::codes::SpikeCode::InvalidSelection);
    }
    Ok(s)
}
