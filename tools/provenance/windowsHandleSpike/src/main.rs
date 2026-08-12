//! Out-of-process spike binary.
//!
//! Input (C3C-Q03): one UTF-8 absolute drive-letter path on **stdin** (not argv/env/stdout/stderr).
//! Output: exactly one JSON line on stdout; stderr empty.
//!
//! Unwindable Rust panics are redacted to INTERNAL/FAILED with empty stderr.
//! Process-abort / OOM are not claimed to be caught.

use std::io::{self, Read, Write};
use std::panic::{self, AssertUnwindSafe};

use windows_handle_spike::codes::SpikeCode;
use windows_handle_spike::outcome::{SpikeOutcome, SpikeResult};
use windows_handle_spike::{format_result_json, run_spike_selection};

fn main() {
    // Silent hook: unwindable panics must not print to stderr.
    panic::set_hook(Box::new(|_| {}));

    // Build the complete JSON envelope inside the catch boundary.
    let prepared = panic::catch_unwind(AssertUnwindSafe(|| {
        let result = match read_stdin_selection() {
            Ok(sel) => run_spike_selection(&sel),
            Err(code) => SpikeResult::failed(code),
        };
        let line = format_result_json(&result);
        let code = exit_code_for(&result);
        (line, code)
    }));

    let (line, code) = match prepared {
        Ok(v) => v,
        Err(_) => {
            // Caught unwind only — no panic payload/message/backtrace.
            let failed = SpikeResult::failed(SpikeCode::Internal);
            (format_result_json(&failed), exit_code_for(&failed))
        }
    };

    // Single best-effort stdout write; never emit a second diagnostic / stderr.
    write_stdout_once(line.as_bytes());
    std::process::exit(code);
}

fn exit_code_for(result: &SpikeResult) -> i32 {
    match result.outcome {
        SpikeOutcome::SpikeControlProven => 0,
        SpikeOutcome::SpikeControlFailed => 1,
        SpikeOutcome::C3cBlocked => 2,
    }
}

/// Best-effort single stdout write. Write/flush errors are ignored (no stderr, no panic).
fn write_stdout_once(bytes: &[u8]) {
    write_bytes_best_effort(&mut io::stdout(), bytes);
}

fn write_bytes_best_effort<W: Write>(w: &mut W, bytes: &[u8]) {
    let _ = w.write_all(bytes);
    let _ = w.flush();
}

fn read_stdin_selection() -> Result<String, SpikeCode> {
    let mut buf = Vec::new();
    io::stdin()
        .take(1025)
        .read_to_end(&mut buf)
        .map_err(|_| SpikeCode::InvalidSelection)?;
    if buf.len() > 1024 {
        return Err(SpikeCode::InvalidSelection);
    }
    // Strip UTF-8 BOM if present.
    let start = if buf.starts_with(&[0xEF, 0xBB, 0xBF]) {
        3
    } else {
        0
    };
    let mut s = String::from_utf8(buf[start..].to_vec())
        .map_err(|_| SpikeCode::InvalidSelection)?;
    if let Some(end) = s.find('\n') {
        s.truncate(end);
    }
    if s.ends_with('\r') {
        s.pop();
    }
    if s.is_empty() {
        return Err(SpikeCode::InvalidSelection);
    }
    Ok(s)
}

/// Immutable panic-redaction helper for unit tests (production uses the same catch pattern in `main`).
#[cfg(test)]
fn redact_unwindable_panic<F>(op: F) -> SpikeResult
where
    F: FnOnce() -> SpikeResult,
{
    match panic::catch_unwind(AssertUnwindSafe(op)) {
        Ok(r) => r,
        Err(_) => SpikeResult::failed(SpikeCode::Internal),
    }
}

#[cfg(test)]
mod panic_redaction_tests {
    use super::*;
    use std::io;

    #[test]
    fn success_envelope_unchanged() {
        let r = SpikeResult::proven();
        let line = format_result_json(&r);
        assert_eq!(line, "{\"code\":null,\"outcome\":\"SPIKE_CONTROL_PROVEN\"}\n");
        assert_eq!(line.matches('\n').count(), 1);
        assert!(line.starts_with("{\"code\":"));
        assert!(line.contains(",\"outcome\":"));
    }

    #[test]
    fn fixed_failure_envelope_unchanged() {
        let r = SpikeResult::failed(SpikeCode::Oversize);
        let line = format_result_json(&r);
        assert_eq!(
            line,
            "{\"code\":\"RULE5_WINDOWS_HANDLE_SPIKE_OVERSIZE\",\"outcome\":\"SPIKE_CONTROL_FAILED\"}\n"
        );
        assert_eq!(line.matches('\n').count(), 1);
    }

    #[test]
    fn induced_panic_maps_to_internal_failed() {
        panic::set_hook(Box::new(|_| {}));
        const SENTINEL: &str = "PANIC_SENTINEL_MUST_NOT_LEAK_7f3a";
        let r = redact_unwindable_panic(|| panic!("{SENTINEL}"));
        assert_eq!(r.outcome, SpikeOutcome::SpikeControlFailed);
        assert_eq!(r.code, Some(SpikeCode::Internal));
        let line = format_result_json(&r);
        assert!(!line.contains(SENTINEL));
        assert!(!line.to_ascii_lowercase().contains("panic"));
        assert!(!line.to_ascii_lowercase().contains("backtrace"));
        assert!(line.starts_with(
            "{\"code\":\"RULE5_WINDOWS_HANDLE_SPIKE_INTERNAL\",\"outcome\":\"SPIKE_CONTROL_FAILED\"}\n"
        ));
        assert_eq!(line.matches('\n').count(), 1);
    }

    #[test]
    fn write_failure_does_not_panic_or_require_stderr() {
        struct FailWriter;
        impl Write for FailWriter {
            fn write(&mut self, _buf: &[u8]) -> io::Result<usize> {
                Err(io::Error::new(io::ErrorKind::Other, "fail"))
            }
            fn flush(&mut self) -> io::Result<()> {
                Err(io::Error::new(io::ErrorKind::Other, "fail"))
            }
        }
        let line = format_result_json(&SpikeResult::failed(SpikeCode::Internal));
        // Must not panic; errors discarded.
        write_bytes_best_effort(&mut FailWriter, line.as_bytes());
    }
}
