use std::path::PathBuf;
use std::thread;
use std::sync::mpsc::{sync_channel, Receiver};
use tauri::Manager;
use tauri_plugin_shell::{ShellExt, process::CommandEvent};

#[tauri::command]
fn start_backend(app: &tauri::AppHandle, receiver: Receiver<i32>) -> Result<(), Box<dyn std::error::Error>> {
    let resource_dir: PathBuf = app.path().resource_dir()?;
    let appdata_dir: PathBuf = app.path().app_data_dir()?;
    let appconfig_dir: PathBuf = app.path().app_config_dir()?;
    let mut cmd = app
        .shell()
        .sidecar("express-backend")
        .map_err(|e| {
            format!("sidecar not found: {e}")
        })?;
    cmd = cmd
        .env("NODE_ENVFILE", ".env.production")
        .env("NODE_APPDATADIR", appdata_dir.display().to_string())
        .env("NODE_APPCONFIGDIR", appconfig_dir.display().to_string())
        .env("NODE_RESDIR", resource_dir.display().to_string());


    let result = cmd.spawn();
    match &result {
        Ok(_) => eprintln!("DEBUG: sidecar spawned successfully"),
        Err(e) => eprintln!("DEBUG: spawn failed: {e}"),
    }

    let (mut rx, child) = result.map_err(|e| {
        format!("failed to spawn sidecar: {e}")
    })?;

    thread::spawn(move || {
        loop {
            let s = receiver.recv();
            if s.unwrap() == -1 {
                child.kill().expect("sidecar stopped.");
                break;
            }
        }
    });

    // read events such as stdout
    tauri::async_runtime::spawn(async move {
        while let Some(event) = rx.recv().await {
            match event {
                CommandEvent::Stdout(line) => {
                    let line = String::from_utf8_lossy(&line);
                    print!("backend: {}", line);
                }
                CommandEvent::Stderr(line) => {
                    let line = String::from_utf8_lossy(&line);
                    eprint!("backend error: {}", line);
                }
                CommandEvent::Terminated(status) => {
                    eprintln!("backend terminated: {:?}", status);
                    break;
                }
                _ => {}
            }
        }
    });
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let (tx, rx) = sync_channel(1);
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                    .level(log::LevelFilter::Info)
                    .build(),
                )?;
            }
            println!("Starting backend...");
            start_backend(&app.handle(), rx)?;
            let window = app.get_webview_window("main").unwrap();
            window.on_window_event( move |event| {
                if let tauri::WindowEvent::Destroyed { .. } = event {
                    let _ = tx.send(-1);
                    println!("Closing gracefully...");
                }
            });
           Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
