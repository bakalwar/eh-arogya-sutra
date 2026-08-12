//! Seventeen mandatory C3C proofs (T01–T14 including T10-POS/NEG and T12-A/B/C).
#![cfg(windows)]

use std::fs::{self, File};

use std::io::Write;
use std::os::windows::ffi::OsStrExt;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::time::{SystemTime, UNIX_EPOCH};

use windows_handle_spike::codes::SpikeCode;
use windows_handle_spike::identity::{compare_identity_or_changed, IdentityTuple};
use windows_handle_spike::outcome::SpikeOutcome;
use windows_handle_spike::path_lex::validate_external_selection;
use windows_handle_spike::procedure::{
    capture_identity, open_for_share_test, plan_component_walk, run_windows_spike, walk_evidence_for_selection,
};
use windows_handle_spike::volume::{classify_volume_observation, DriveTypeObs, VolumeObservation};
use windows_handle_spike::{format_result_json, MAX_ACCEPTED_BYTES};
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
    p.push(format!("ehas2_c3c_spike_{nanos}"));
    fs::create_dir_all(&p).unwrap();
    p
}

fn to_wide(path: &Path) -> Vec<u16> {
    path.as_os_str().encode_wide().chain(std::iter::once(0)).collect()
}

fn drive_letter_path(p: &Path) -> String {
    // Do not canonicalize: Windows canonicalize resolves reparse points and would
    // defeat T03/T04 junction/symlink component coverage.
    let s = p.to_string_lossy();
    if let Some(rest) = s.strip_prefix(r"\\?\") {
        rest.to_string()
    } else {
        s.into_owned()
    }
}

fn cleanup_tree(root: &Path) -> Result<(), SpikeCode> {
    // Best-effort owned-tree cleanup; failure maps to CLEANUP_FAILED.
    match fs::remove_dir_all(root) {
        Ok(()) => Ok(()),
        Err(_) => Err(SpikeCode::CleanupFailed),
    }
}

fn write_file(path: &Path, bytes: &[u8]) {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).unwrap();
    }
    let mut f = File::create(path).unwrap();
    f.write_all(bytes).unwrap();
}

fn run_bin(selection: &str) -> (SpikeOutcome, Option<String>) {
    let bin = env!("CARGO_BIN_EXE_windows_handle_spike");
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
    assert!(
        out.stderr.is_empty(),
        "stderr must be empty"
    );
    let line = String::from_utf8(out.stdout).unwrap();
    assert!(line.ends_with('\n'));
    assert_eq!(line.matches('\n').count(), 1);
    // Parse minimal JSON without leaking path fields (none expected).
    assert!(!line.to_ascii_lowercase().contains("c:\\"));
    assert!(!line.contains("\\\\"));
    let outcome = if line.contains("SPIKE_CONTROL_PROVEN") {
        SpikeOutcome::SpikeControlProven
    } else if line.contains("C3C_BLOCKED") {
        SpikeOutcome::C3cBlocked
    } else {
        SpikeOutcome::SpikeControlFailed
    };
    let code = if line.contains("RULE5_WINDOWS_HANDLE_SPIKE_") {
        let start = line.find("RULE5_WINDOWS_HANDLE_SPIKE_").unwrap();
        let rest = &line[start..];
        let end = rest.find('"').unwrap_or(rest.len());
        Some(rest[..end].to_string())
    } else {
        None
    };
    (outcome, code)
}

#[test]
fn t01_regular_file_read_within_cap() {
    let root = unique_root();
    let file = root.join("a").join("b").join("f.bin");
    write_file(&file, b"synthetic-ok");
    let sel = drive_letter_path(&file);
    let r = run_windows_spike(&sel);
    assert_eq!(r.outcome, SpikeOutcome::SpikeControlProven);
    let (o, c) = run_bin(&sel);
    assert_eq!(o, SpikeOutcome::SpikeControlProven);
    assert!(c.is_none());
    cleanup_tree(&root).unwrap();
}

#[test]
fn t02_oversize_rejected() {
    let root = unique_root();
    let file = root.join("big.bin");
    let mut data = vec![0u8; (MAX_ACCEPTED_BYTES as usize) + 1];
    data[0] = 1;
    write_file(&file, &data);
    let sel = drive_letter_path(&file);
    let r = run_windows_spike(&sel);
    assert_eq!(r.code, Some(SpikeCode::Oversize));
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
    // Directory junction via `mklink /J` does not require SeCreateSymbolicLinkPrivilege.
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

#[test]
fn t03_final_symlink_reparse_rejected() {
    let root = unique_root();
    let target = root.join("real.bin");
    write_file(&target, b"x");
    let link = root.join("link.bin");
    match try_create_symlink_file(&link, &target) {
        Ok(()) => {
            let sel = drive_letter_path(&link);
            let r = run_windows_spike(&sel);
            assert_eq!(r.code, Some(SpikeCode::ReparseRejected));
            cleanup_tree(&root).unwrap();
        }
        Err(class) => {
            cleanup_tree(&root).ok();
            panic!("T03 blocked prerequisite class={class}");
        }
    }
}

#[test]
fn t04_parent_junction_reparse_rejected() {
    let root = unique_root();
    let real_dir = root.join("realdir");
    fs::create_dir_all(&real_dir).unwrap();
    write_file(&real_dir.join("f.bin"), b"x");
    let link_dir = root.join("linkdir");
    match try_create_junction(&link_dir, &real_dir) {
        Ok(()) => {
            let file = link_dir.join("f.bin");
            let sel = drive_letter_path(&file);
            let r = run_windows_spike(&sel);
            assert_eq!(r.code, Some(SpikeCode::ReparseRejected));
            cleanup_tree(&root).unwrap();
        }
        Err(class) => {
            cleanup_tree(&root).ok();
            panic!("T04 blocked prerequisite class={class}");
        }
    }
}

#[test]
fn t05_hardlink_rejected() {
    let root = unique_root();
    let a = root.join("a.bin");
    let b = root.join("b.bin");
    write_file(&a, b"hello");
    let aw = to_wide(&a);
    let bw = to_wide(&b);
    let ok = unsafe { CreateHardLinkW(bw.as_ptr(), aw.as_ptr(), std::ptr::null_mut()) };
    assert!(ok != 0, "hardlink create failed");
    let sel = drive_letter_path(&a);
    let r = run_windows_spike(&sel);
    assert_eq!(r.code, Some(SpikeCode::HardlinkRejected));
    cleanup_tree(&root).unwrap();
}

#[test]
fn t06_named_ads_rejected() {
    let root = unique_root();
    let file = root.join("ads.bin");
    write_file(&file, b"main");
    // Create named ADS via Win32 path with colon (test fixture creation only).
    let ads = format!("{}:zone", drive_letter_path(&file));
    let mut f = File::create(&ads).expect("create named ADS");
    f.write_all(b"secret").unwrap();
    drop(f);
    let sel = drive_letter_path(&file);
    let r = run_windows_spike(&sel);
    assert_eq!(r.code, Some(SpikeCode::AdsRejected));
    cleanup_tree(&root).unwrap();
}

#[test]
fn t07_unc_rejected() {
    assert!(validate_external_selection(r"\\server\share\file.txt").is_err());
    let r = run_windows_spike(r"\\server\share\file.txt");
    assert!(matches!(
        r.code,
        Some(SpikeCode::InvalidSelection) | Some(SpikeCode::UnsafePathComponent)
    ));
}

#[test]
fn t08_device_namespace_rejected() {
    assert!(validate_external_selection(r"\\.\C:\Windows\notepad.exe").is_err());
    let r = run_windows_spike(r"\\.\C:\Windows\notepad.exe");
    assert!(matches!(
        r.code,
        Some(SpikeCode::InvalidSelection) | Some(SpikeCode::UnsafePathComponent)
    ));
}

#[test]
fn t09_reserved_dos_name_rejected() {
    assert_eq!(
        validate_external_selection(r"C:\NUL"),
        Err(SpikeCode::UnsafePathComponent)
    );
}

#[test]
fn t10_pos_fixed_ntfs_accepted() {
    let root = unique_root();
    let file = root.join("pos.bin");
    write_file(&file, b"pos");
    let sel = drive_letter_path(&file);
    let r = run_windows_spike(&sel);
    assert_eq!(r.outcome, SpikeOutcome::SpikeControlProven);
    cleanup_tree(&root).unwrap();
}

#[test]
fn t10_neg_pure_classifier() {
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
            Err(SpikeCode::UnsupportedVolume)
        );
    }
    assert_eq!(
        classify_volume_observation(&VolumeObservation {
            drive_type: DriveTypeObs::Fixed,
            is_ntfs: false
        }),
        Err(SpikeCode::UnsupportedVolume)
    );
}

#[test]
fn t11_share_denial() {
    let root = unique_root();
    let file = root.join("share.bin");
    write_file(&file, b"share");
    let sel = drive_letter_path(&file);
    let (owned, _id) = open_for_share_test(&sel).unwrap();
    let wide = to_wide(Path::new(&sel));
    // Attempt write share open while production handle holds deny-write.
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
        panic!("T11 expected write open denial");
    }
    assert_eq!(err, ERROR_SHARING_VIOLATION);
    drop(owned);
    cleanup_tree(&root).unwrap();
}

#[test]
fn t12_a_same_handle_stable_and_rename_denied_while_open() {
    let root = unique_root();
    let file = root.join("id.bin");
    write_file(&file, b"identity-a");
    let sel = drive_letter_path(&file);
    let (owned, id1) = open_for_share_test(&sel).unwrap();
    let id2 = capture_identity(owned.raw()).unwrap();
    assert!(compare_identity_or_changed(&id1, &id2).is_ok());
    // Rename while open should fail due to deny-delete share.
    let sibling = root.join("renamed.bin");
    let from = to_wide(Path::new(&sel));
    let to = to_wide(&sibling);
    let moved = unsafe { MoveFileExW(from.as_ptr(), to.as_ptr(), 0) };
    assert_eq!(moved, 0, "rename must be denied while production handle open");
    drop(owned);
    cleanup_tree(&root).unwrap();
}

#[test]
fn t12_b_retained_original_coexist_distinct_tuple() {
    let root = unique_root();
    let original = root.join("slot.bin");
    write_file(&original, b"original-bytes");
    let sel = drive_letter_path(&original);
    let (owned, id_original) = open_for_share_test(&sel).unwrap();
    drop(owned); // close production handle before rename/create

    let retained = root.join("retained.bin");
    fs::rename(&original, &retained).unwrap();
    write_file(&original, b"replacement-bytes");

    let sel2 = drive_letter_path(&original);
    let (owned2, id_new) = open_for_share_test(&sel2).unwrap();
    assert!(
        !windows_handle_spike::identity_tuples_equal(&id_original, &id_new),
        "replacement tuple must differ while original retained"
    );
    assert!(retained.exists() && original.exists());
    drop(owned2);
    cleanup_tree(&root).unwrap();
}

#[test]
fn t12_c_pure_comparator() {
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
        Err(SpikeCode::IdentityChanged)
    );
}

#[test]
fn t13_cleanup_failure() {
    let root = unique_root();
    let file = root.join("held.bin");
    write_file(&file, b"hold");
    // Exclusive open (share none) so owned-tree cleanup cannot delete the file.
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
    assert_eq!(err, Err(SpikeCode::CleanupFailed));
    let _ = fs::remove_dir_all(&root);
}

#[test]
fn t14_component_relative_walk_evidence() {
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

#[test]
fn json_key_order_and_redaction() {
    let r = windows_handle_spike::outcome::SpikeResult::failed(SpikeCode::Oversize);
    let line = format_result_json(&r);
    assert!(line.starts_with("{\"code\":\"RULE5_WINDOWS_HANDLE_SPIKE_OVERSIZE\",\"outcome\":\"SPIKE_CONTROL_FAILED\"}\n"));
}
