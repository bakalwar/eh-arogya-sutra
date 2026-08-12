//! Stdin channel parsing for C3D (INPUT_CONTROL_FAILED vs lexical).
//! Provenance: channel-boundary concept from C3C main.rs; mapping is C3D-specific.

use crate::codes::RunnerCode;

/// Parse raw stdin bytes into one selection line, or `INPUT_CONTROL_FAILED`.
///
/// Does **not** perform lexical path validation (that is `path_lex`).
pub fn parse_stdin_channel(buf: &[u8]) -> Result<String, RunnerCode> {
    if buf.len() > 1024 {
        return Err(RunnerCode::InputControlFailed);
    }
    if buf.iter().any(|&b| b == 0) {
        return Err(RunnerCode::InputControlFailed);
    }
    let start = if buf.starts_with(&[0xEF, 0xBB, 0xBF]) {
        3
    } else {
        0
    };
    let s = String::from_utf8(buf[start..].to_vec()).map_err(|_| RunnerCode::InputControlFailed)?;
    let (first, rest) = match s.split_once('\n') {
        Some((a, b)) => (a, b),
        None => (s.as_str(), ""),
    };
    if !rest.is_empty() {
        return Err(RunnerCode::InputControlFailed);
    }
    let mut line = first.to_string();
    if line.ends_with('\r') {
        line.pop();
    }
    if line.is_empty() {
        return Err(RunnerCode::InputControlFailed);
    }
    Ok(line)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn empty_and_multiline_are_input_control() {
        assert_eq!(
            parse_stdin_channel(b""),
            Err(RunnerCode::InputControlFailed)
        );
        assert_eq!(
            parse_stdin_channel(b"\n"),
            Err(RunnerCode::InputControlFailed)
        );
        assert_eq!(
            parse_stdin_channel(b"C:\\a\\b\nextra"),
            Err(RunnerCode::InputControlFailed)
        );
        assert_eq!(
            parse_stdin_channel(b"C:\\a\\b\0"),
            Err(RunnerCode::InputControlFailed)
        );
    }

    #[test]
    fn single_line_accepted_for_lexical_stage() {
        assert_eq!(
            parse_stdin_channel(b"C:\\a\\b\\f.bin\n").unwrap(),
            r"C:\a\b\f.bin"
        );
    }
}
