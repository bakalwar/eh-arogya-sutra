//! Documented handle-relative Windows procedure (C3C §8 / Q04–Q13).
//! Production reading never closes and reopens by pathname.

#![cfg(windows)]

use std::mem::{size_of, zeroed};
use std::ptr;

use windows_sys::Wdk::Foundation::OBJECT_ATTRIBUTES;
use windows_sys::Wdk::Storage::FileSystem::{
    NtCreateFile, FILE_DIRECTORY_FILE, FILE_NON_DIRECTORY_FILE, FILE_OPEN,
    FILE_OPEN_FOR_BACKUP_INTENT, FILE_OPEN_REPARSE_POINT, FILE_SYNCHRONOUS_IO_NONALERT,
};
use windows_sys::Win32::Foundation::{
    CloseHandle, HANDLE, INVALID_HANDLE_VALUE, OBJ_CASE_INSENSITIVE, OBJ_DONT_REPARSE,
    STATUS_REPARSE_POINT_ENCOUNTERED, STATUS_SUCCESS, NTSTATUS, UNICODE_STRING,
};
use windows_sys::Win32::Storage::FileSystem::{
    GetDriveTypeW, GetFileInformationByHandle, GetFileInformationByHandleEx, GetVolumeInformationW,
    ReadFile, BY_HANDLE_FILE_INFORMATION, FILE_ATTRIBUTE_REPARSE_POINT, FILE_ID_INFO, FILE_ID_128,
    FILE_LIST_DIRECTORY, FILE_READ_ATTRIBUTES, FILE_READ_DATA, FILE_SHARE_READ, FILE_STANDARD_INFO,
    FILE_STREAM_INFO, FILE_TRAVERSE, FileIdInfo, FileStandardInfo, FileStreamInfo, SYNCHRONIZE,
};

// Documented Win32 GetDriveTypeW return values (MSDN).
const DRIVE_UNKNOWN: u32 = 0;
const DRIVE_NO_ROOT_DIR: u32 = 1;
const DRIVE_REMOVABLE: u32 = 2;
const DRIVE_FIXED: u32 = 3;
const DRIVE_REMOTE: u32 = 4;
const DRIVE_CDROM: u32 = 5;
const DRIVE_RAMDISK: u32 = 6;
use windows_sys::Win32::System::IO::IO_STATUS_BLOCK;

use crate::codes::SpikeCode;
use crate::identity::{compare_identity_or_changed, IdentityTuple};
use crate::outcome::SpikeResult;
use crate::path_lex::{validate_external_selection, PathPlan};
use crate::platform::require_windows11_x64;
use crate::volume::{classify_volume_observation, DriveTypeObs, VolumeObservation};
use crate::{MAX_ACCEPTED_BYTES, READ_PROBE_CEILING};

pub struct OwnedHandle(HANDLE);


impl OwnedHandle {
    fn new(h: HANDLE) -> Result<Self, SpikeCode> {
        if h.is_null() || h == INVALID_HANDLE_VALUE {
            Err(SpikeCode::Internal)
        } else {
            Ok(Self(h))
        }
    }

    pub fn raw(&self) -> HANDLE {
        self.0
    }
}

impl Drop for OwnedHandle {
    fn drop(&mut self) {
        if !self.0.is_null() && self.0 != INVALID_HANDLE_VALUE {
            unsafe {
                CloseHandle(self.0);
            }
            self.0 = INVALID_HANDLE_VALUE;
        }
    }
}

/// Walk-plan evidence for T14: component-relative opens only after root anchor.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct WalkEvidence {
    pub component_relative_opens: usize,
    pub used_full_path_reopen_for_read: bool,
}

pub fn plan_component_walk(selection: &str) -> Result<PathPlan, SpikeCode> {
    validate_external_selection(selection)
}

pub fn run_windows_spike(selection: &str) -> SpikeResult {
    match run_windows_spike_inner(selection) {
        Ok(()) => SpikeResult::proven(),
        Err(code) => SpikeResult::failed(code),
    }
}

fn run_windows_spike_inner(selection: &str) -> Result<(), SpikeCode> {
    require_windows11_x64()?;
    let plan = validate_external_selection(selection)?;
    verify_volume(&plan)?;
    let (file, _walk) = open_via_component_walk(&plan)?;
    let id = capture_identity(file.raw())?;
    verify_final_file_metadata(file.raw())?;
    let size = end_of_file(file.raw())?;
    if size > MAX_ACCEPTED_BYTES {
        return Err(SpikeCode::Oversize);
    }
    bounded_read_same_handle(file.raw(), size, &id)?;
    let id_after = capture_identity(file.raw())?;
    compare_identity_or_changed(&id, &id_after)?;
    Ok(())
}

fn verify_volume(plan: &PathPlan) -> Result<(), SpikeCode> {
    let root = format!("{}:\\", plan.drive);
    let obs = collect_volume_observation(&root)?;
    classify_volume_observation(&obs)
}

pub fn collect_volume_observation(root_path: &str) -> Result<VolumeObservation, SpikeCode> {
    let wide = to_wide_null(root_path)?;
    let dt = unsafe { GetDriveTypeW(wide.as_ptr()) };
    let drive_type = match dt {
        DRIVE_UNKNOWN => DriveTypeObs::Unknown,
        DRIVE_NO_ROOT_DIR => DriveTypeObs::NoRootDir,
        DRIVE_REMOVABLE => DriveTypeObs::Removable,
        DRIVE_FIXED => DriveTypeObs::Fixed,
        DRIVE_REMOTE => DriveTypeObs::Remote,
        DRIVE_CDROM => DriveTypeObs::Cdrom,
        DRIVE_RAMDISK => DriveTypeObs::Ramdisk,
        _ => DriveTypeObs::Unknown,
    };
    let mut fs_name = [0u16; 64];
    let ok = unsafe {
        GetVolumeInformationW(
            wide.as_ptr(),
            ptr::null_mut(),
            0,
            ptr::null_mut(),
            ptr::null_mut(),
            ptr::null_mut(),
            fs_name.as_mut_ptr(),
            fs_name.len() as u32,
        )
    };
    if ok == 0 {
        return Err(SpikeCode::UnsupportedVolume);
    }
    let name = wide_to_string(&fs_name);
    let is_ntfs = name.eq_ignore_ascii_case("NTFS");
    Ok(VolumeObservation {
        drive_type,
        is_ntfs,
    })
}

fn open_via_component_walk(plan: &PathPlan) -> Result<(OwnedHandle, WalkEvidence), SpikeCode> {
    let mut parent = open_volume_root(plan.drive)?;
    let mut relative_opens = 0usize;
    let last = plan.components.len() - 1;
    for (i, comp) in plan.components.iter().enumerate() {
        let is_final = i == last;
        let child = open_relative(parent.raw(), comp, is_final)?;
        relative_opens += 1;
        parent = child;
    }
    Ok((
        parent,
        WalkEvidence {
            component_relative_opens: relative_opens,
            used_full_path_reopen_for_read: false,
        },
    ))
}

/// Open volume root via NtCreateFile NT path `\??\X:\` (not CreateFileW sole authority).
fn open_volume_root(drive: char) -> Result<OwnedHandle, SpikeCode> {
    let nt = format!("\\??\\{}:\\", drive);
    let mut wide = to_wide_null(&nt)?;
    let mut us = UNICODE_STRING {
        Length: ((wide.len() - 1) * 2) as u16,
        MaximumLength: (wide.len() * 2) as u16,
        Buffer: wide.as_mut_ptr(),
    };
    let mut oa = OBJECT_ATTRIBUTES {
        Length: size_of::<OBJECT_ATTRIBUTES>() as u32,
        RootDirectory: ptr::null_mut(),
        ObjectName: &mut us,
        Attributes: OBJ_CASE_INSENSITIVE | OBJ_DONT_REPARSE,
        SecurityDescriptor: ptr::null(),
        SecurityQualityOfService: ptr::null(),
    };
    let mut handle: HANDLE = ptr::null_mut();
    let mut iosb: IO_STATUS_BLOCK = unsafe { zeroed() };
    let access = FILE_LIST_DIRECTORY | FILE_TRAVERSE | FILE_READ_ATTRIBUTES | SYNCHRONIZE;
    let status: NTSTATUS = unsafe {
        NtCreateFile(
            &mut handle,
            access,
            &mut oa,
            &mut iosb,
            ptr::null(),
            0,
            FILE_SHARE_READ,
            FILE_OPEN,
            FILE_DIRECTORY_FILE | FILE_SYNCHRONOUS_IO_NONALERT | FILE_OPEN_FOR_BACKUP_INTENT,
            ptr::null(),
            0,
        )
    };
    map_open_status(status)?;
    OwnedHandle::new(handle)
}

fn open_relative(parent: HANDLE, component: &str, is_final_file: bool) -> Result<OwnedHandle, SpikeCode> {
    let mut wide = to_wide_null(component)?;
    let mut us = UNICODE_STRING {
        Length: ((wide.len() - 1) * 2) as u16,
        MaximumLength: (wide.len() * 2) as u16,
        Buffer: wide.as_mut_ptr(),
    };
    let mut oa = OBJECT_ATTRIBUTES {
        Length: size_of::<OBJECT_ATTRIBUTES>() as u32,
        RootDirectory: parent,
        ObjectName: &mut us,
        Attributes: OBJ_CASE_INSENSITIVE | OBJ_DONT_REPARSE,
        SecurityDescriptor: ptr::null(),
        SecurityQualityOfService: ptr::null(),
    };
    let mut handle: HANDLE = ptr::null_mut();
    let mut iosb: IO_STATUS_BLOCK = unsafe { zeroed() };
    let (access, share, options) = if is_final_file {
        (
            FILE_READ_DATA | FILE_READ_ATTRIBUTES | SYNCHRONIZE,
            FILE_SHARE_READ, // write/delete share denied (Q11)
            FILE_NON_DIRECTORY_FILE
                | FILE_SYNCHRONOUS_IO_NONALERT
                | FILE_OPEN_REPARSE_POINT,
        )
    } else {
        (
            FILE_LIST_DIRECTORY | FILE_TRAVERSE | FILE_READ_ATTRIBUTES | SYNCHRONIZE,
            FILE_SHARE_READ,
            FILE_DIRECTORY_FILE
                | FILE_SYNCHRONOUS_IO_NONALERT
                | FILE_OPEN_REPARSE_POINT,
        )
    };
    let status: NTSTATUS = unsafe {
        NtCreateFile(
            &mut handle,
            access,
            &mut oa,
            &mut iosb,
            ptr::null(),
            0,
            share,
            FILE_OPEN,
            options,
            ptr::null(),
            0,
        )
    };
    map_open_status(status)?;
    let owned = OwnedHandle::new(handle)?;
    // Reject any reparse-tagged component (junction/symlink/mount) before advancing.
    if is_reparse_handle(owned.raw())? {
        return Err(SpikeCode::ReparseRejected);
    }
    if !is_final_file && !is_directory_handle(owned.raw())? {
        return Err(SpikeCode::Internal);
    }
    Ok(owned)
}

fn is_reparse_handle(handle: HANDLE) -> Result<bool, SpikeCode> {
    let mut bhfi: BY_HANDLE_FILE_INFORMATION = unsafe { zeroed() };
    let ok = unsafe { GetFileInformationByHandle(handle, &mut bhfi) };
    if ok == 0 {
        return Err(SpikeCode::Internal);
    }
    Ok((bhfi.dwFileAttributes & FILE_ATTRIBUTE_REPARSE_POINT) != 0)
}

fn is_directory_handle(handle: HANDLE) -> Result<bool, SpikeCode> {
    let mut stdinfo: FILE_STANDARD_INFO = unsafe { zeroed() };
    let ok = unsafe {
        GetFileInformationByHandleEx(
            handle,
            FileStandardInfo,
            &mut stdinfo as *mut _ as *mut _,
            size_of::<FILE_STANDARD_INFO>() as u32,
        )
    };
    if ok == 0 {
        return Err(SpikeCode::Internal);
    }
    Ok(stdinfo.Directory)
}

fn map_open_status(status: NTSTATUS) -> Result<(), SpikeCode> {
    if status == STATUS_SUCCESS {
        return Ok(());
    }
    if status == STATUS_REPARSE_POINT_ENCOUNTERED {
        return Err(SpikeCode::ReparseRejected);
    }
    // Object-not-found / invalid → treat as unsafe/invalid without leaking status.
    Err(SpikeCode::Internal)
}

fn verify_final_file_metadata(handle: HANDLE) -> Result<(), SpikeCode> {
    let mut stdinfo: FILE_STANDARD_INFO = unsafe { zeroed() };
    let ok = unsafe {
        GetFileInformationByHandleEx(
            handle,
            FileStandardInfo,
            &mut stdinfo as *mut _ as *mut _,
            size_of::<FILE_STANDARD_INFO>() as u32,
        )
    };
    if ok == 0 {
        return Err(SpikeCode::Internal);
    }
    if stdinfo.Directory {
        return Err(SpikeCode::Internal);
    }
    if stdinfo.NumberOfLinks != 1 {
        return Err(SpikeCode::HardlinkRejected);
    }
    // Reparse attribute via BY_HANDLE_FILE_INFORMATION.
    let mut bhfi: BY_HANDLE_FILE_INFORMATION = unsafe { zeroed() };
    let ok2 = unsafe { GetFileInformationByHandle(handle, &mut bhfi) };
    if ok2 == 0 {
        return Err(SpikeCode::Internal);
    }
    if (bhfi.dwFileAttributes & FILE_ATTRIBUTE_REPARSE_POINT) != 0 {
        return Err(SpikeCode::ReparseRejected);
    }
    verify_default_unnamed_stream_only(handle)?;
    Ok(())
}

fn verify_default_unnamed_stream_only(handle: HANDLE) -> Result<(), SpikeCode> {
    // Handle-authoritative FileStreamInfo (Q09). Buffer sized for several streams.
    let mut buf = vec![0u8; 4096];
    let ok = unsafe {
        GetFileInformationByHandleEx(
            handle,
            FileStreamInfo,
            buf.as_mut_ptr() as *mut _,
            buf.len() as u32,
        )
    };
    if ok == 0 {
        // If the API fails on this host, ADS control is unproven → fail closed.
        return Err(SpikeCode::AdsRejected);
    }
    let mut offset = 0usize;
    loop {
        if offset + size_of::<FILE_STREAM_INFO>() > buf.len() {
            return Err(SpikeCode::AdsRejected);
        }
        let info = unsafe { &*(buf.as_ptr().add(offset) as *const FILE_STREAM_INFO) };
        let name_len = info.StreamNameLength as usize;
        let name_u16 = unsafe {
            std::slice::from_raw_parts(
                info.StreamName.as_ptr(),
                name_len / 2,
            )
        };
        let name = String::from_utf16_lossy(name_u16);
        // Default unnamed data stream is "::$DATA" or ":$DATA".
        let is_default = name == "::$DATA" || name == ":$DATA" || name.is_empty();
        if !is_default {
            return Err(SpikeCode::AdsRejected);
        }
        if info.NextEntryOffset == 0 {
            break;
        }
        offset = offset.saturating_add(info.NextEntryOffset as usize);
        if offset >= buf.len() {
            break;
        }
    }
    Ok(())
}

pub fn capture_identity(handle: HANDLE) -> Result<IdentityTuple, SpikeCode> {
    let mut id_info: FILE_ID_INFO = unsafe { zeroed() };
    let ok = unsafe {
        GetFileInformationByHandleEx(
            handle,
            FileIdInfo,
            &mut id_info as *mut _ as *mut _,
            size_of::<FILE_ID_INFO>() as u32,
        )
    };
    if ok == 0 {
        return Err(SpikeCode::IdentityUnavailable);
    }
    let mut stdinfo: FILE_STANDARD_INFO = unsafe { zeroed() };
    let ok2 = unsafe {
        GetFileInformationByHandleEx(
            handle,
            FileStandardInfo,
            &mut stdinfo as *mut _ as *mut _,
            size_of::<FILE_STANDARD_INFO>() as u32,
        )
    };
    if ok2 == 0 {
        return Err(SpikeCode::IdentityUnavailable);
    }
    // Compatibility evidence (not sole authority).
    let mut bhfi: BY_HANDLE_FILE_INFORMATION = unsafe { zeroed() };
    let _ = unsafe { GetFileInformationByHandle(handle, &mut bhfi) };

    let file_id = file_id_128_to_u128(&id_info.FileId);
    Ok(IdentityTuple {
        volume_serial: id_info.VolumeSerialNumber,
        file_id,
        number_of_links: stdinfo.NumberOfLinks,
    })
}

fn file_id_128_to_u128(id: &FILE_ID_128) -> u128 {
    let mut bytes = [0u8; 16];
    for (i, b) in id.Identifier.iter().enumerate().take(16) {
        bytes[i] = *b;
    }
    u128::from_le_bytes(bytes)
}

fn end_of_file(handle: HANDLE) -> Result<u64, SpikeCode> {
    let mut stdinfo: FILE_STANDARD_INFO = unsafe { zeroed() };
    let ok = unsafe {
        GetFileInformationByHandleEx(
            handle,
            FileStandardInfo,
            &mut stdinfo as *mut _ as *mut _,
            size_of::<FILE_STANDARD_INFO>() as u32,
        )
    };
    if ok == 0 {
        return Err(SpikeCode::ReadFailed);
    }
    if stdinfo.EndOfFile < 0 {
        return Err(SpikeCode::ReadFailed);
    }
    Ok(stdinfo.EndOfFile as u64)
}

fn bounded_read_same_handle(
    handle: HANDLE,
    size: u64,
    expected: &IdentityTuple,
) -> Result<Vec<u8>, SpikeCode> {
    if size > MAX_ACCEPTED_BYTES {
        return Err(SpikeCode::Oversize);
    }
    // Probe ceiling: never read more than READ_PROBE_CEILING.
    let to_read = std::cmp::min(size, READ_PROBE_CEILING) as usize;
    let mut buf = vec![0u8; to_read];
    let mut read = 0u32;
    if to_read > 0 {
        let ok = unsafe {
            ReadFile(
                handle,
                buf.as_mut_ptr() as *mut _,
                to_read as u32,
                &mut read,
                ptr::null_mut(),
            )
        };
        if ok == 0 {
            return Err(SpikeCode::ReadFailed);
        }
    }
    let id_now = capture_identity(handle)?;
    compare_identity_or_changed(expected, &id_now)?;
    buf.truncate(read as usize);
    Ok(buf)
}

/// Open using the documented procedure; returns handle + identity for share tests.
pub fn open_for_share_test(selection: &str) -> Result<(OwnedHandle, IdentityTuple), SpikeCode> {
    require_windows11_x64()?;
    let plan = validate_external_selection(selection)?;
    verify_volume(&plan)?;
    let (file, _) = open_via_component_walk(&plan)?;
    verify_final_file_metadata(file.raw())?;
    let id = capture_identity(file.raw())?;
    Ok((file, id))
}

pub fn walk_evidence_for_selection(selection: &str) -> Result<WalkEvidence, SpikeCode> {
    require_windows11_x64()?;
    let plan = validate_external_selection(selection)?;
    verify_volume(&plan)?;
    let (_file, walk) = open_via_component_walk(&plan)?;
    if walk.component_relative_opens != plan.components.len() {
        return Err(SpikeCode::Internal);
    }
    if walk.used_full_path_reopen_for_read {
        return Err(SpikeCode::Internal);
    }
    Ok(walk)
}

fn to_wide_null(s: &str) -> Result<Vec<u16>, SpikeCode> {
    let mut v: Vec<u16> = s.encode_utf16().collect();
    v.push(0);
    Ok(v)
}

fn wide_to_string(buf: &[u16]) -> String {
    let len = buf.iter().position(|&c| c == 0).unwrap_or(buf.len());
    String::from_utf16_lossy(&buf[..len])
}

// Re-export OwnedHandle for tests in this crate.
pub type SpikeOwnedHandle = OwnedHandle;
