//! Mandatory C3D-T01–T21 synthetic proofs (contract §8).
//! Provenance: fixture techniques adapted from C3C `mandatory_proofs.rs`;
//! IDs, namespace, and envelope assertions are C3D-specific.
#![cfg(windows)]

use std::fs::{self, File};
use std::io::Write;
use std::os::windows::ffi::OsStrExt;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::time::{SystemTime, UNIX_EPOCH};

use ehas2_windows_protected_runner::codes::RunnerCode;
use ehas2_windows_protected_runner::identity::{compare_identity_or_changed, IdentityTuple};
use ehas2_windows_protected_runner::outcome::RunnerOutcome;
use ehas2_windows_protected_runner::path_lex::validate_external_selection;
use ehas2_windows_protected_runner::procedure::{
    capture_identity, open_for_share_test, plan_component_walk, run_windows_runner,
    walk_evidence_for_selection,
};
use ehas2_windows_protected_runner::volume::{
    classify_volume_observation, DriveTypeObs, VolumeObservation,
};
use ehas2_windows_protected_runner::{
    format_result_json, identity_tuples_equal, parse_stdin_channel, MAX_ACCEPTED_BYTES,
};
use windows_sys::Win32::Foundation::{
    CloseHandle, ERROR_SHARING_VIOLATION, GENERIC_READ, GetLastError, HANDLE,
};
use windows_sys::Win32::Storage::FileSystem::{
    CreateFileW, CreateHardLinkW, CreateSymbolicLinkW, MoveFileExW, FILE_ATTRIBUTE_NORMAL,
    FILE_GENERIC_WRITE, FILE_SHARE_DELETE, FILE_SHARE_NONE, FILE_SHARE_READ, FILE_SHARE_WRITE,
    OPEN_EXISTING,
};

fn unique_root() -> PathBuf {
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    let mut p = std::env::temp_dir();
    p.push(format!("ehas2_c3d_runner_{nanos}"));
    fs::create_dir_all(&p).unwrap();
    p
}

fn to_wide(path: &Path) -> Vec<u16> {
    path.as_os_str()
        .encode_wide()
        .chain(std::iter::once(0))
        .collect()
}

fn drive_letter_path(p: &Path) -> String {
    // Do not canonicalize: would resolve reparse points and defeat T03/T04.
    let s = p.to_string_lossy();
    if let Some(rest) = s.strip_prefix(r"\\?\") {
        rest.to_string()
    } else {
        s.into_owned()
    }
}

fn cleanup_tree(root: &Path) -> Result<(), RunnerCode> {
    match fs::remove_dir_all(root) {
        Ok(()) => Ok(()),
        Err(_) => Err(RunnerCode::CleanupFailed),
    }
}

fn write_file(path: &Path, bytes: &[u8]) {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).unwrap();
    }
    let mut f = File::create(path).unwrap();
    f.write_all(bytes).unwrap();
}

fn run_bin(selection: &str) -> (i32, String, Vec<u8>) {
    let bin = env!("CARGO_BIN_EXE_ehas2-windows-protected-runner");
    let mut child = Command::new(bin)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .unwrap();
    {
        use std::io::Write as _;
        child
            .stdin
            .as_mut()
            .unwrap()
            .write_all(selection.as_bytes())
            .unwrap();
    }
    let out = child.wait_with_output().unwrap();
    let line = String::from_utf8(out.stdout).unwrap();
    (out.status.code().unwrap_or(255), line, out.stderr)
}

fn assert_no_leakage(line: &str) {
    let lower = line.to_ascii_lowercase();
    assert!(!lower.contains("c:\\"));
    assert!(!line.contains("\\\\"));
    assert!(!lower.contains("ntstatus"));
    assert!(!lower.contains("panic"));
    assert!(!lower.contains("backtrace"));
    assert!(!lower.contains("patient"));
    assert!(!line.contains("sha256"));
}

/// C3D-T01 — valid regular-file procedure
#[test]
fn c3d_t01_regular_file_procedure() {
    let root = unique_root();
    let file = root.join("a").join("b").join("f.bin");
    write_file(&file, b"synthetic-ok");
    let sel = drive_letter_path(&file);
    let r = run_windows_runner(&sel);
    assert_eq!(r.outcome, RunnerOutcome::ProcedureCompleted);
    assert_eq!(r.failure_code, None);
    let (exit, line, stderr) = run_bin(&sel);
    assert_eq!(exit, 0);
    assert!(stderr.is_empty());
    assert_eq!(
        line,
        "{\"code\":\"RULE5_PROTECTED_RUNNER_OK\",\"outcome\":\"PROCEDURE_COMPLETED\"}\n"
    );
    assert_no_leakage(&line);
    cleanup_tree(&root).unwrap();
}

/// C3D-T02 — oversize rejection
#[test]
fn c3d_t02_oversize_rejection() {
    let root = unique_root();
    let file = root.join("big.bin");
    let mut data = vec![0u8; (MAX_ACCEPTED_BYTES as usize) + 1];
    data[0] = 1;
    write_file(&file, &data);
    let sel = drive_letter_path(&file);
    let r = run_windows_runner(&sel);
    assert_eq!(r.failure_code, Some(RunnerCode::Oversize));
    cleanup_tree(&root).unwrap();
}

fn try_create_symlink_file(link: &Path, target: &Path) -> Result<(), &'static str> {
    let link_w = to_wide(link);
    let target_w = to_wide(target);
    let ok = unsafe { CreateSymbolicLinkW(link_w.as_ptr(), target_w.as_ptr(), 0) };
    if !ok {
        Err("SYMLINK_PRIVILEGE_OR_DEVELOPER_MODE_REQUIRED")
    } else {
        Ok(())
    }
}

fn try_create_junction(link: &Path, target: &Path) -> Result<(), &'static str> {
    let status = Command::new("cmd")
        .arg("/C")
        .arg("mklink")
        .arg("/J")
        .arg(link.as_os_str())
        .arg(target.as_os_str())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .status();
    match status {
        Ok(s) if s.success() => Ok(()),
        _ => Err("DIRECTORY_JUNCTION_CREATE_FAILED"),
    }
}

/// C3D-T03 — final reparse rejection (file symlink fixture)
#[test]
fn c3d_t03_final_reparse_rejection() {
    let root = unique_root();
    let target = root.join("real.bin");
    write_file(&target, b"x");
    let link = root.join("link.bin");
    match try_create_symlink_file(&link, &target) {
        Ok(()) => {
            let sel = drive_letter_path(&link);
            let r = run_windows_runner(&sel);
            assert_eq!(r.failure_code, Some(RunnerCode::ReparseRejected));
            cleanup_tree(&root).unwrap();
        }
        Err(class) => {
            cleanup_tree(&root).ok();
            panic!("C3D-T03 blocked prerequisite class={class}");
        }
    }
}

/// C3D-T04 — parent reparse rejection (directory junction)
#[test]
fn c3d_t04_parent_reparse_rejection() {
    let root = unique_root();
    let real_dir = root.join("realdir");
    fs::create_dir_all(&real_dir).unwrap();
    write_file(&real_dir.join("f.bin"), b"x");
    let link_dir = root.join("linkdir");
    match try_create_junction(&link_dir, &real_dir) {
        Ok(()) => {
            let file = link_dir.join("f.bin");
            let sel = drive_letter_path(&file);
            let r = run_windows_runner(&sel);
            assert_eq!(r.failure_code, Some(RunnerCode::ReparseRejected));
            cleanup_tree(&root).unwrap();
        }
        Err(class) => {
            cleanup_tree(&root).ok();
            panic!("C3D-T04 blocked prerequisite class={class}");
        }
    }
}

/// C3D-T05 — hard-link rejection
#[test]
fn c3d_t05_hardlink_rejection() {
    let root = unique_root();
    let a = root.join("a.bin");
    let b = root.join("b.bin");
    write_file(&a, b"hello");
    let aw = to_wide(&a);
    let bw = to_wide(&b);
    let ok = unsafe { CreateHardLinkW(bw.as_ptr(), aw.as_ptr(), std::ptr::null_mut()) };
    assert!(ok != 0, "hardlink create failed");
    let sel = drive_letter_path(&a);
    let r = run_windows_runner(&sel);
    assert_eq!(r.failure_code, Some(RunnerCode::HardlinkRejected));
    cleanup_tree(&root).unwrap();
}

/// C3D-T06 — ADS rejection
#[test]
fn c3d_t06_ads_rejection() {
    let root = unique_root();
    let file = root.join("ads.bin");
    write_file(&file, b"main");
    let ads = format!("{}:zone", drive_letter_path(&file));
    let mut f = File::create(&ads).expect("create named ADS");
    f.write_all(b"secret").unwrap();
    drop(f);
    let sel = drive_letter_path(&file);
    let r = run_windows_runner(&sel);
    assert_eq!(r.failure_code, Some(RunnerCode::AdsRejected));
    cleanup_tree(&root).unwrap();
}

/// C3D-T07 — UNC / device / reserved-name lexical rejection
#[test]
fn c3d_t07_lexical_unc_device_reserved() {
    assert_eq!(
        validate_external_selection(r"\\server\share\file.txt"),
        Err(RunnerCode::InvalidSelection)
    );
    assert_eq!(
        validate_external_selection(r"\\.\C:\Windows\notepad.exe"),
        Err(RunnerCode::InvalidSelection)
    );
    assert_eq!(
        validate_external_selection(r"\\?\C:\a\b"),
        Err(RunnerCode::InvalidSelection)
    );
    assert_eq!(
        validate_external_selection(r"C:\NUL"),
        Err(RunnerCode::UnsafePathComponent)
    );
    let r = run_windows_runner(r"\\server\share\file.txt");
    assert_eq!(r.failure_code, Some(RunnerCode::InvalidSelection));
}

/// C3D-T08 — fixed NTFS positive classification
#[test]
fn c3d_t08_fixed_ntfs_positive() {
    let root = unique_root();
    let file = root.join("pos.bin");
    write_file(&file, b"pos");
    let sel = drive_letter_path(&file);
    let r = run_windows_runner(&sel);
    assert_eq!(r.outcome, RunnerOutcome::ProcedureCompleted);
    cleanup_tree(&root).unwrap();
}

/// C3D-T09 — deterministic negative volume classification
#[test]
fn c3d_t09_negative_volume_classifier() {
    let cases = [
        DriveTypeObs::Removable,
        DriveTypeObs::Remote,
        DriveTypeObs::Cdrom,
        DriveTypeObs::Ramdisk,
        DriveTypeObs::Unknown,
        DriveTypeObs::NoRootDir,
    ];
    for dt in cases {
        assert_eq!(
            classify_volume_observation(&VolumeObservation {
                drive_type: dt,
                is_ntfs: true
            }),
            Err(RunnerCode::UnsupportedVolume)
        );
    }
    assert_eq!(
        classify_volume_observation(&VolumeObservation {
            drive_type: DriveTypeObs::Fixed,
            is_ntfs: false
        }),
        Err(RunnerCode::UnsupportedVolume)
    );
}

/// C3D-T10 — share denial
#[test]
fn c3d_t10_share_denial() {
    let root = unique_root();
    let file = root.join("share.bin");
    write_file(&file, b"share");
    let sel = drive_letter_path(&file);
    let (owned, _id) = open_for_share_test(&sel).unwrap();
    let wide = to_wide(Path::new(&sel));
    let h: HANDLE = unsafe {
        CreateFileW(
            wide.as_ptr(),
            FILE_GENERIC_WRITE,
            FILE_SHARE_READ | FILE_SHARE_WRITE | FILE_SHARE_DELETE,
            std::ptr::null(),
            OPEN_EXISTING,
            FILE_ATTRIBUTE_NORMAL,
            std::ptr::null_mut(),
        )
    };
    let err = unsafe { GetLastError() };
    if !h.is_null() && h != (-1isize as HANDLE) {
        unsafe { CloseHandle(h) };
        drop(owned);
        cleanup_tree(&root).ok();
        panic!("C3D-T10 expected write open denial");
    }
    assert_eq!(err, ERROR_SHARING_VIOLATION);
    drop(owned);
    cleanup_tree(&root).unwrap();
}

/// C3D-T11 — same-handle identity stability
#[test]
fn c3d_t11_same_handle_identity_stability() {
    let root = unique_root();
    let file = root.join("id.bin");
    write_file(&file, b"identity-a");
    let sel = drive_letter_path(&file);
    let (owned, id1) = open_for_share_test(&sel).unwrap();
    let id2 = capture_identity(owned.raw()).unwrap();
    assert!(compare_identity_or_changed(&id1, &id2).is_ok());
    let sibling = root.join("renamed.bin");
    let from = to_wide(Path::new(&sel));
    let to = to_wide(&sibling);
    let moved = unsafe { MoveFileExW(from.as_ptr(), to.as_ptr(), 0) };
    assert_eq!(moved, 0, "rename must be denied while production handle open");
    drop(owned);
    cleanup_tree(&root).unwrap();
}

/// C3D-T12 — retained-original coexistence identity distinction
#[test]
fn c3d_t12_retained_original_coexistence() {
    let root = unique_root();
    let original = root.join("slot.bin");
    write_file(&original, b"original-bytes");
    let sel = drive_letter_path(&original);
    let (owned, id_original) = open_for_share_test(&sel).unwrap();
    drop(owned);

    let retained = root.join("retained.bin");
    fs::rename(&original, &retained).unwrap();
    write_file(&original, b"replacement-bytes");

    let sel2 = drive_letter_path(&original);
    let (owned2, id_new) = open_for_share_test(&sel2).unwrap();
    assert!(
        !identity_tuples_equal(&id_original, &id_new),
        "replacement tuple must differ while original retained"
    );
    assert!(retained.exists() && original.exists());
    drop(owned2);
    cleanup_tree(&root).unwrap();
}

/// C3D-T13 — identity mismatch decision mapping
#[test]
fn c3d_t13_identity_mismatch_mapping() {
    let a = IdentityTuple {
        volume_serial: 9,
        file_id: 100,
        number_of_links: 1,
    };
    assert!(compare_identity_or_changed(&a, &a).is_ok());
    let b = IdentityTuple {
        volume_serial: 9,
        file_id: 101,
        number_of_links: 1,
    };
    assert_eq!(
        compare_identity_or_changed(&a, &b),
        Err(RunnerCode::IdentityChanged)
    );
}

/// C3D-T14 — cleanup failure as non-success
#[test]
fn c3d_t14_cleanup_failure_non_success() {
    let root = unique_root();
    let file = root.join("held.bin");
    write_file(&file, b"hold");
    let wide = to_wide(&file);
    let h: HANDLE = unsafe {
        CreateFileW(
            wide.as_ptr(),
            GENERIC_READ,
            FILE_SHARE_NONE,
            std::ptr::null(),
            OPEN_EXISTING,
            FILE_ATTRIBUTE_NORMAL,
            std::ptr::null_mut(),
        )
    };
    assert!(!h.is_null() && h != (-1isize as HANDLE));
    let err = cleanup_tree(&root);
    unsafe {
        CloseHandle(h);
    }
    assert_eq!(err, Err(RunnerCode::CleanupFailed));
    let _ = fs::remove_dir_all(&root);
}

/// C3D-T15 — component-relative walk evidence
#[test]
fn c3d_t15_component_relative_walk() {
    let root = unique_root();
    let file = root.join("p1").join("p2").join("leaf.bin");
    write_file(&file, b"walk");
    let sel = drive_letter_path(&file);
    let plan = plan_component_walk(&sel).unwrap();
    assert!(plan.components.len() >= 3);
    assert_eq!(
        &plan.components[plan.components.len() - 3..],
        ["p1", "p2", "leaf.bin"]
    );
    let walk = walk_evidence_for_selection(&sel).unwrap();
    assert_eq!(walk.component_relative_opens, plan.components.len());
    assert!(!walk.used_full_path_reopen_for_read);
    cleanup_tree(&root).unwrap();
}

/// C3D-T16 — exact JSON key order and one-line output
#[test]
fn c3d_t16_json_key_order_one_line() {
    let ok = format_result_json(&ehas2_windows_protected_runner::outcome::RunnerResult::ok());
    assert_eq!(
        ok,
        "{\"code\":\"RULE5_PROTECTED_RUNNER_OK\",\"outcome\":\"PROCEDURE_COMPLETED\"}\n"
    );
    assert_eq!(ok.matches('\n').count(), 1);
    let fail = format_result_json(
        &ehas2_windows_protected_runner::outcome::RunnerResult::failed(RunnerCode::Oversize),
    );
    assert!(fail.starts_with("{\"code\":\"RULE5_PROTECTED_RUNNER_OVERSIZE\",\"outcome\":"));
    let root = unique_root();
    let file = root.join("j.bin");
    write_file(&file, b"j");
    let (_exit, line, stderr) = run_bin(&drive_letter_path(&file));
    assert!(stderr.is_empty());
    assert_eq!(line.matches('\n').count(), 1);
    assert!(line.starts_with("{\"code\":"));
    assert!(line.contains(",\"outcome\":"));
    cleanup_tree(&root).unwrap();
}

/// C3D-T17 — stderr redaction for expected errors and unwindable panic
#[test]
fn c3d_t17_stderr_redaction() {
    let (exit, line, stderr) = run_bin(r"\\server\share\x");
    assert_eq!(exit, 1);
    assert!(stderr.is_empty());
    assert!(line.contains("PROCEDURE_NON_SUCCESS"));
    assert_no_leakage(&line);
    // Unwindable panic path covered by main.rs unit test `induced_panic_maps_to_internal`.
}

/// C3D-T18 — stdin-only selection (no argv path authority)
#[test]
fn c3d_t18_stdin_only_selection() {
    let bin = env!("CARGO_BIN_EXE_ehas2-windows-protected-runner");
    let root = unique_root();
    let file = root.join("stdin.bin");
    write_file(&file, b"stdin");
    let sel = drive_letter_path(&file);
    // Path on argv must not be accepted as selection authority (empty stdin → INPUT_CONTROL).
    let out = Command::new(bin)
        .arg(&sel)
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
        .unwrap();
    assert!(out.stderr.is_empty());
    let line = String::from_utf8(out.stdout).unwrap();
    assert!(line.contains("RULE5_PROTECTED_RUNNER_INPUT_CONTROL_FAILED"));
    assert!(!line.contains(&sel));
    // Channel unit mapping
    assert_eq!(
        parse_stdin_channel(b""),
        Err(RunnerCode::InputControlFailed)
    );
    cleanup_tree(&root).unwrap();
}

/// C3D-T19 — no path / byte / native-value leakage
#[test]
fn c3d_t19_no_path_byte_native_leakage() {
    let root = unique_root();
    let file = root.join("leak.bin");
    write_file(&file, b"secret-bytes-must-not-appear");
    let sel = drive_letter_path(&file);
    let (_exit, line, stderr) = run_bin(&sel);
    assert!(stderr.is_empty());
    assert_no_leakage(&line);
    assert!(!line.contains("secret-bytes"));
    assert!(!line.contains(&sel));
    cleanup_tree(&root).unwrap();
}

/// C3D-T20 — no protected-source fixture or reference
#[test]
fn c3d_t20_no_protected_source_fixture() {
    // This suite uses only owned temp synthetic roots (`ehas2_c3d_runner_*`).
    let root = unique_root();
    assert!(root
        .to_string_lossy()
        .contains("ehas2_c3d_runner_"));
    assert!(!root.to_string_lossy().to_ascii_lowercase().contains("clinic"));
    assert!(!root.to_string_lossy().to_ascii_lowercase().contains("patient"));
    write_file(&root.join("syn.bin"), b"syn");
    let r = run_windows_runner(&drive_letter_path(&root.join("syn.bin")));
    assert_eq!(r.outcome, RunnerOutcome::ProcedureCompleted);
    cleanup_tree(&root).unwrap();
}

/// C3D-T21 — no hash / manifest activity
#[test]
fn c3d_t21_no_hash_manifest_activity() {
    let root = unique_root();
    let file = root.join("hash.bin");
    write_file(&file, b"no-digest");
    let (_exit, line, _) = run_bin(&drive_letter_path(&file));
    assert!(!line.to_ascii_lowercase().contains("sha"));
    assert!(!line.to_ascii_lowercase().contains("digest"));
    assert!(!line.to_ascii_lowercase().contains("manifest"));
    // Source tree must not call digest APIs (static scan in delivery).
    cleanup_tree(&root).unwrap();
}
