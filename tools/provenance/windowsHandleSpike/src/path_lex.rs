//! External path grammar (C3C-Q07). Lexical checks are supplementary to the handle walk.
//! Never embed rejected input text in errors.

use crate::codes::SpikeCode;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct PathPlan {
    /// Drive letter A-Z (uppercase).
    pub drive: char,
    /// Path components after the root, each a single Windows path element.
    pub components: Vec<String>,
}

/// Validate and plan a single absolute drive-letter selection.
pub fn validate_external_selection(raw: &str) -> Result<PathPlan, SpikeCode> {
    if raw.is_empty() || raw.len() > 1024 {
        return Err(SpikeCode::InvalidSelection);
    }
    if raw.contains('\0') {
        return Err(SpikeCode::InvalidSelection);
    }
    // Reject slash ambiguity and non-backslash separators.
    if raw.contains('/') {
        return Err(SpikeCode::InvalidSelection);
    }
    // Reject UNC / device / extended / GLOBALROOT / GUID prefixes.
    if raw.starts_with("\\\\") {
        return Err(SpikeCode::InvalidSelection);
    }
    let bytes = raw.as_bytes();
    if bytes.len() < 3 {
        return Err(SpikeCode::InvalidSelection);
    }
    let d0 = bytes[0] as char;
    if !d0.is_ascii_alphabetic() {
        return Err(SpikeCode::InvalidSelection);
    }
    if bytes[1] != b':' || bytes[2] != b'\\' {
        return Err(SpikeCode::InvalidSelection);
    }
    // Extra colon anywhere after the drive separator → ADS / malformed.
    if raw[2..].contains(':') {
        return Err(SpikeCode::InvalidSelection);
    }
    // Env / wildcard / glob.
    if raw.contains('%') || raw.contains('*') || raw.contains('?') || raw.contains('<') || raw.contains('>') || raw.contains('|') || raw.contains('"') {
        return Err(SpikeCode::InvalidSelection);
    }

    let drive = d0.to_ascii_uppercase();
    let rest = &raw[3..];
    if rest.is_empty() {
        // Drive root alone is not a final file selection for the spike.
        return Err(SpikeCode::InvalidSelection);
    }
    if rest.ends_with('\\') {
        return Err(SpikeCode::InvalidSelection);
    }
    if rest.contains("\\\\") {
        return Err(SpikeCode::InvalidSelection);
    }

    let mut components = Vec::new();
    for part in rest.split('\\') {
        validate_component(part)?;
        components.push(part.to_string());
    }
    if components.is_empty() {
        return Err(SpikeCode::InvalidSelection);
    }
    Ok(PathPlan { drive, components })
}

fn validate_component(part: &str) -> Result<(), SpikeCode> {
    if part.is_empty() {
        return Err(SpikeCode::UnsafePathComponent);
    }
    if part == "." || part == ".." {
        return Err(SpikeCode::UnsafePathComponent);
    }
    if part.ends_with(' ') || part.ends_with('.') {
        return Err(SpikeCode::UnsafePathComponent);
    }
    if part.chars().any(|c| {
        matches!(
            c,
            '<' | '>' | ':' | '"' | '/' | '\\' | '|' | '?' | '*' | '\0'
        ) || (c as u32) < 0x20
    }) {
        return Err(SpikeCode::UnsafePathComponent);
    }
    // Reserved DOS device names (exact or with extension).
    let stem = part
        .split('.')
        .next()
        .unwrap_or(part)
        .to_ascii_uppercase();
    const RESERVED: &[&str] = &[
        "CON", "PRN", "AUX", "NUL", "COM1", "COM2", "COM3", "COM4", "COM5", "COM6",
        "COM7", "COM8", "COM9", "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7",
        "LPT8", "LPT9",
    ];
    if RESERVED.contains(&stem.as_str()) {
        return Err(SpikeCode::UnsafePathComponent);
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accepts_nested_drive_letter() {
        let p = validate_external_selection(r"C:\a\b\file.txt").unwrap();
        assert_eq!(p.drive, 'C');
        assert_eq!(p.components, vec!["a", "b", "file.txt"]);
    }

    #[test]
    fn rejects_unc_and_device() {
        assert!(validate_external_selection(r"\\server\share\a").is_err());
        assert!(validate_external_selection(r"\\.\C:\a").is_err());
        assert!(validate_external_selection(r"\\?\C:\a").is_err());
    }

    #[test]
    fn rejects_dos_reserved() {
        assert_eq!(
            validate_external_selection(r"C:\NUL"),
            Err(SpikeCode::UnsafePathComponent)
        );
    }
}
